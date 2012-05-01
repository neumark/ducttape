###

   Copyright 2012 Peter Neumark

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

   FileSystem interface for DuctTape

   FS provides a uniform way of accessing hierarchical information like the unix
   filesystem or the DOM tree. It contains the following parts:
   * The UI: a small "prompt" which can show the current directory, or
     whatever you like.
   * Commands: commands to navigate and manipulate the filesystem:
     mount, unmount, ls, pwd, cd
   * The lib object, which provides the FSI API for modules whishing to
     implement access to a particular service.
###
define ['corelib'], (corelib) ->
    separator = "/"
    (dt) ->
        rootNode = null
        fsState = dt.pkgGet('core', 'internals').value.fs ? {}
        lib = null
        lib = 
            PathExprEx: class extends Error
                constructor: (@msg, @obj, @childName, @originalEx=null) ->
                    super(@msg);
            pathExpr: (strExpr) ->
                keyList = strExpr.split separator
                fun =
                    getChildSet: (obj) =>
                        currentKey = keyList[0]
                        nodeSet = obj?.attr?.children() 
                        if not nodeSet? then throw new lib.PathExprEx "Object has no children", obj, currentKey, strExpr
                        [
                            if (currentKey == "") and (keyList.length == 1) then true else fun.selectChild
                            nodeSet
                        ]
                    selectChild: (nodeSet) =>
                        currentKey = keyList.shift()
                        child = nodeSet.get currentKey
                        if not child? 
                            throw new lib.PathExprEx "NodeSet does not have a unique child by that name", nodeSet, currentKey, strExpr
                        [
                            if keyList.length == 0 then true else fun.getChildSet
                            child
                        ]
                currentObject = 
                    if keyList.length > 0 && keyList[0].length == 0
                        keyList.shift()
                        rootNode
                    else
                        fsState.co
                chain = 
                    if keyList.length > 0
                        new corelib.ContinuationChain [fun.getChildSet, currentObject]
                    else
                        new corelib.Promise value: currentObject
            Node: class extends corelib.NAV
                    constructor: (@name, parent=null) ->
                        @attr ?= {}
                        if parent? then @attr.parent = parent
                        @attr.fullname ?= =>
                            lib.makeFullName (if @attr.parent?.attr?.fullname? then @attr.parent.attr.fullname() else ""), @name
                    createChild: ->
                        throw new Error "Cannot create new child"
            NodeSet: class
                constructor: (childList) ->
                    #nodeDict maps full names to objects
                    @nodeDict = {}
                    @length = 0
                    @addNode nodeData for nodeData in (childList ? [])
                removeNode: (key) ->
                    # TODO: if there were duplicates and after removal
                    # this is no longer true, update the remaining key to be just name instead of fullpath.
                    if key of @nodeDict
                        delete @nodeDict[key]
                        @length--
                        true
                    else
                        false
                addNode: (nodeData, useFullName = false) -> 
                    name = 
                        if useFullName
                            nodeData.value.attr.fullname()
                        else
                            # TODO: check if nodeData.key is a valid name (eg. contains no separator characters).
                            nodeData.key
                    if !@nodeDict.hasOwnProperty name
                        @nodeDict[name] = nodeData
                        @length++
                        true
                    else
                        if !useFullName
                            # refer to duplicates by their full name
                            @length--
                            tmp = @nodeDict[name] 
                            delete @nodeDict[name]    
                            @addNode tmp, true
                            @addNode nodeData, true
                        else
                            false
                keys: -> Object.keys nodeDict
                map: (fn) -> (fn(key, value) for own key, value of @nodeDict)
                get: (key) -> @nodeDict[key]?.value
            splitFullName: (fullName) ->
                parts = fullName.split separator
                keyPart = parts.pop()
                return val = 
                    ns: parts.join separator
                    key: keyPart
            makeFullName: (ns, key) -> ns + separator + key
            eval: (expr) ->
                if typeof(expr) == "string" then lib.pathExpr expr else expr
            runMethod: (nodeName, methodName, args = []) ->
                corelib.promiseApply ((node) -> node[methodName].apply node, args), [lib.eval nodeName]
        # Make separator read-only.
        lib.__defineGetter__ 'separator', -> separator
        rootNode = fsState.co = new (
                class extends lib.Node
                    constructor:  ->
                        super ""
                        childrenOfRoot = new lib.NodeSet []
                        @value = true
                        @attr = 
                            parent: null
                            description: "Root node of ducttape filesystem."
                            children: -> childrenOfRoot 
                    createChild: (name, spec) ->
                        newMountPromise = dt.pkgGet(spec.type, 'makeMountPoint').value name, @, spec
                        @attr.children().addNode({
                            key: name
                            value: newMountPromise
                        })
                        # TODO: If the promise fails, remove newMountPromise from child set of root.
                        newMountPromise.afterFailure (t) ->
                            @attr.children().removeNode name
                        newMountPromise
            )()
        pkgInit = ->
            internals = dt.pkgGet('core', 'internals').value
            internals.fs ?= fsState
            true
        pkg =
            name: "fs"
            attr:
                description: "FileSystem inteface package"
                author: "Peter Neumark"
                version: "1.0"
                url: "https://github.com/neumark/ducttape"
                init: pkgInit
            value:
                root:
                    attr: 
                        description: "Root node of the ducttape filesystem."
                    value: rootNode
                pwd:
                    attr:
                        description: "Print current object's full name."
                        makePublic: true
                    value: -> 
                        dt.pkgGet('core', 'internals').value.fs?.co.attr.fullname()
                co:
                    attr:
                        description: "Sets or returns current object."
                        makePublic: true
                    value: (newCo) ->
                        fs = dt.pkgGet('core', 'internals').value.fs
                        if newCo? then fs.co = lib.eval newCo else fs.co
                get:
                    attr:
                        description: "Fetch an object from the filesystem."
                    value: lib.pathExpr
                ls:
                    attr:
                        description: "Lists children of current object."
                        makePublic: true
                    value: (expr) ->
                        nodePromise = lib.eval (expr ? "")
                        nodePromise.apply (parent) -> parent?.attr?.children() ? throw new Error "parent has no children"
                mk:
                    attr:
                        description: "Create a new object as a child of the current object (if possible)."
                        makePublic: true
                    value: (name, spec) ->
                        nameParts = lib.splitFullName name
                        parent = lib.pathExpr nameParts.ns
                        parent.apply (p) -> 
                            if p?.createChild? then p.createChild.apply p, [nameParts.key, spec] else throw new Error "cannot create child here."
                rm:
                    attr:
                        description: "Delete an object"
                        makePublic: true
                    value: (nodeName) -> lib.runMethod nodeName, 'destroy'
                save:
                    attr:
                        description: "Writes an object's state to backing storage."
                        makePublic: true
                    value: (nodeName) -> lib.runMethod nodeName, 'save'
                lib:
                    attr:
                        description: "Library of fs-related functions and classes."
                    value: lib
