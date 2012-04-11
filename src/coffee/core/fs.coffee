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
            PathExpr: class
                constructor: (@strExpr) ->
                    @keyList = strExpr.split separator
                evaluate: ->
                    fun =
                        getChildSet: (obj) =>
                            currentKey = @keyList[0]
                            nodeSet = obj?.attr?.children
                            if not nodeSet? then throw new lib.PathExprEx "Object has no children", obj, currentKey, @strExpr
                            [
                                if (currentKey == "") and (@keyList.length == 1) then true else fun.selectChild
                                nodeSet
                            ]
                        selectChild: (nodeSet) =>
                            currentKey = @keyList.shift()
                            child = nodeSet.get currentKey
                            if not child? 
                                throw new lib.PathExprEx "NodeSet does not have a unique child by that name", nodeSet, currentKey, @strExpr
                            [
                                if @keyList.length == 0 then true else fun.getChildSet
                                child
                            ]
                    currentObject = 
                        if @keyList.length > 0 && @keyList[0].length == 0
                            @keyList.shift()
                            rootNode
                        else
                            fsState.co
                    chain = new corelib.ContinuationChain [fun.getChildSet, currentObject]
            Node: class extends corelib.NAV
                constructor: (@name, parent=null) ->
                    @attr ?= {}
                    if parent? then @attr.parent = parent
                fullname: ->
                    lib.makeFullName (if @attr.parent? then @attr.parent.fullname() else ""), @name
            NodeSet: class
                constructor: (childList) ->
                    #nodeDict maps full names to objects
                    @nodeDict = {}
                    @length = 0
                    @addNode nodeData for nodeData in (childList ? [])
                addNode: (nodeData, useFullName = false) -> 
                    name = 
                        if useFullName
                            nodeData.value.fullname()
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
                #TODO: toHTML should not be in this file...
                #toHTML: ->
                #    div = $ "<div />"
                #    for own key, value of nodeDict
                #        div.addChild "<span>#{ key }</span>"
                #    div
            splitFullName: (fullName) ->
                parts = fullName.split separator
                keyPart = parts.pop()
                return val = 
                    ns: parts.join separator
                    key: keyPart
            makeFullName: (ns, key) -> ns + separator + key
        # Make separator read-only.
        lib.__defineGetter__ 'separator', -> separator
        fsState.path = new lib.PathExpr "/"
        rootNode = fsState.co = new (
                class extends lib.Node
                    constructor:  ->
                        super ""
                        @value = true
                        @attr = 
                            parent: null
                            description: "Root node of ducttape filesystem."
                            children: new lib.NodeSet []
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
                mount:
                    attr:
                        description: "Attach new FS adaptor."
                        makePublic: true
                    value: (mountPoint, fsType, options = {}) ->
                        rootNode.attr.children.addNode({
                            key: mountPoint
                            value: dt.pkgGet(fsType, 'makeMountPoint').value mountPoint, rootNode, options
                        })
                pwd:
                    attr:
                        description: "Print current directory."
                        makePublic: true
                    value: -> (session.fs?.currentPath ? []).join('/')

                co:
                    attr:
                        description: "Displays current object."
                        makePublic: true
                    value: ->
                        session.fs?.currentObject?.contents()
                get:
                    attr:
                        description: "Fetch an object from the filesystem."
                    value: (path) ->
                        pathExpr = new lib.PathExpr path
                        pathExpr.evaluate()
                ls:
                    attr:
                        description: "Lists children of current object."
                        makePublic: true
                    value: ->
                        session.fs?.currentObject?.children()
                lib:
                    attr:
                        description: "Library of fs-related functions and classes."
                    value: lib
                   
