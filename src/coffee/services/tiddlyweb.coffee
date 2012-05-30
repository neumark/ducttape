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

   TiddlyWeb FS adaptor.
   This code allows one to mount a tiddlyweb host, accessible via the fs package.

###
# The mutable-state dependancy is a hack to make CRUD operations work on tiddlyspace!
define [], ->
    twSpec = 
        timeout: 2 * 60 # Two minute timeout for network traffic
    (dt) ->
        corelib = dt.pkgGet('core','internals').value.corelib
        fslib = dt.pkgGet('fs','lib').value

        getPolicy = (collection) ->
            corelib.sequence [
                ((coll) -> coll.value)
                ((twObj) -> twObj.policy)
            ], (dt collection)

        getUsername = (root, spec) ->
            usernamePromise = new corelib.Promise spec
            root.tw.ajaxCall
                url: root.attr.host + '/status',
                type: "GET",
                success: (status) -> 
                    dt.pkgGet('ga','gaLog').value 'command', 'tw.user', status.username
                    if status.username != 'GUEST' then usernamePromise.fulfill true, status.username
                    else usernamePromise.fulfill false, "not logged in"
                error: usernamePromise.defaultHandlers()[1]
            usernamePromise
        getTiddlyWebApi = (apiUrl) ->
            twebPromise = new corelib.Promise()
            require [apiUrl], ((apiObj) ->
                if typeof(apiObj) == 'function'
                    apiObj (t) -> twebPromise.fulfill true, t
                else
                    twebPromise.fulfill true, apiObj)
            twebPromise
            
        makeMountPoint = (mountName, mountParent, options) ->
            host = options.url
            class TWObj extends fslib.Node
                constructor: (name, parent=null, filters=null) ->
                    super name, parent
                    @obj ?= @mkTwebObj @attr.type, @name, filters
                    @contentObj = null
                    @childList = null
                mkTwebObj: (type, name, filters) -> new (@tw[type])(name, host, filters)
                rm: -> 
                    p = new corelib.Promise()
                    corelib.promiseApply ((obj) -> 
                        obj.delete.apply obj, p.defaultHandlers()), [@obj]
                    @removeChild p
                    p
                removeChild: (destroyPromise) ->
                    if @attr?.parent?.childList? 
                        oldChildList = @attr.parent.childList
                        @attr.parent.childList = corelib.promiseApply \
                            ((childList) => 
                                childList.removeNode node.name), 
                            # include destroyPromise in the arguments
                            # so that the node is only removed when 
                            # we know the deletion succeeded.
                            [oldChildList, destroyPromise]

                insertChild: (newChild) ->
                    if @childList? 
                        oldChildList = @childList
                        @childList = corelib.promiseApply ((obj, list) =>
                            list.addNode
                                key: obj.name
                                value: obj
                            ), [newChild, oldChildList]

                request: (that, ajaxFun, attribute, transform = (x)->x) =>
                    if !(@[attribute]?)
                        ajaxPromise = new corelib.Promise twSpec
                        ajaxFun.apply that, ajaxPromise.defaultHandlers()
                        @[attribute] = ajaxPromise.apply transform
                    @[attribute]

            class TopLevel extends TWObj # bags, recipes 
                constructor: (name, parent) -> 
                    @attr = 
                        type: 'Collection'
                        children: =>
                            @request @obj, @obj.get, 'childList', (val) =>
                                new fslib.NodeSet ({
                                        key: i
                                        value: new SecondLevel(i, @getType(), @)
                                    } for i in val)
                    @value = true
                    super(name, parent)
                getType: ->
                    switch @name
                        when 'bags' then 'Bag'
                        when 'recipes' then 'Recipe'
                        else
                            throw new Error 'Unknown top level child: ' + @name
                mk: (name, spec = {}) ->
                    newObj = @mkTwebObj @getType(), name
                    if spec.desc? then newObj.desc = spec.desc
                    if spec.policy? then newObj.policy = $.extend newObj.policy, spec.policy
                    if spec.recipe? then newObj.recipe = spec.recipe
                    creationPromise = corelib.sequence [
                        # Make PUT request to TiddlyWeb server
                        ((obj) -> 
                            p = new corelib.Promise()
                            obj.put.apply obj, p.defaultHandlers()
                            p)
                        # Wrap the response in a SecondLevel object before adding to fs tree.
                        ((twObj) => 
                            wrapped = new SecondLevel twObj.name, @getType(), @
                            wrapped.obj = twObj
                            @insertChild wrapped
                            wrapped)
                    ], newObj
 
            class SecondLevel extends TWObj # a Bag or Recipe
                constructor: (name, type, parent) -> 
                    # Define a setter for the value property
                    @__defineSetter__ 'value', -> throw new Error 'NotImplemented'
                    @__defineGetter__ 'value', =>
                        valueP = @request @obj, @obj.get, 'contentObj'
                        valueP.apply (v) => $.extend @obj, v
                        valueP
                    @attr = 
                        type: type
                        children: => 
                            @request \
                                @obj.tiddlers(),
                                (cb1, cb2) => @obj.tiddlers().get cb1, cb2, "fat=1",
                                'childList',
                                (tiddlerList) -> new fslib.NodeSet(({
                                        key: tiddler.title
                                        value: new TiddlerWrapper(tiddler, @)
                                    } for tiddler in tiddlerList))
                    super(name, parent)
                save: ->
                    corelib.promiseApply ((collection) =>
                            promise = new corelib.Promise()
                            collection.put.apply collection, promise.defaultHandlers()
                            promise), [@value]

                mk: (name, spec = {}) ->
                    # TODO: if @ is a recipe, we should add tiddler to last bag in recipe
                    if @attr.type != 'Bag' then throw new Error 'Cannot create child here.'
                    newObj = @mkTwebObj 'Tiddler', name
                    newObj.bag = @obj
                    if spec.text? then newObj.text = spec.text
                    if spec.tags? then newObj.tags = spec.tags
                    if spec.fields? then newObj.fields = $.extend newObj.fields, spec.fields
                    if spec.original?
                        fields = newObj.fields
                        # the stringify hack is a simple deep clone
                        $.extend newObj, JSON.parse JSON.stringify spec.original
                        $.extend newObj.fields, fields
                    creationPromise = corelib.sequence [
                        # Make PUT request to TiddlyWeb server
                        ((obj) -> 
                            p = new corelib.Promise()
                            obj.put.apply obj, p.defaultHandlers()
                            p)
                        # Wrap the response in a TiddlerWrapper object before adding to fs tree.
                        ((twObj) => 
                            wrapped = new TiddlerWrapper twObj, @
                            @insertChild wrapped
                            wrapped)
                    ], newObj

                   
            class TiddlerWrapper extends TWObj
                constructor: (@tiddler, parent=null) ->
                    @name = @tiddler.title
                    @attr = 
                        type: 'Tiddler'
                        parent: parent
                    @value = @obj = @tiddler
                    # TODO: revisions, fields, tags could be further children
                save: ->
                    corelib.sequence [
                        ( =>
                            promise = new corelib.Promise()
                            @tiddler.put.apply @tiddler, promise.defaultHandlers()
                            promise)
                        (=> @)
                    ]

            class Root extends TWObj
                constructor: (tw) ->
                    TWObj::tw = tw
                    @name = mountName
                    @childSet = new fslib.NodeSet ({
                            value: new TopLevel(i, @),
                            key: i
                        } for i in ['bags', 'recipes'])
                    @attr = 
                        host: host
                        type: 'root'
                        parent: mountParent
                        children: => @childSet 
                    @value = true

            getTiddlyWebApi(options.api).apply (tiddlyweb) -> new Root(tiddlyweb)
        pkg =
            name: "tiddlyweb"
            attr:
                description: "TiddlyWeb fs adaptor package"
                author: "Peter Neumark"
                version: "1.0"
                url: "https://github.com/neumark/ducttape"
            value:
                makeMountPoint:
                    attr:
                        description: "Root node of tiddlyweb filesystem."                     
                    value: makeMountPoint
                bootstrap:
                    attr: 
                        description: "Returns the user's custom bootstrap script (if any)."
                    value: (root, pathTemplate) ->
                        corelib.sequence [
                            ((username) -> 
                                path = pathTemplate.replace('{ user }', username)
                                dt path)
                            ((node) -> node.value)
                            ((tiddler) -> 
                                    corelib.execJS corelib.compile tiddler.text)
                        ], getUsername(root.host)
                tw:
                    attr:
                        description: "Utility functions for interacting with tiddlyweb servers."
                        makePublic: true
                    value:
                        policy: ->
                            dt.pkgGet('ga','gaLog').value 'command', 'tw.policy', arguments[0]
                            getPolicy.apply null, arguments
                        grant: (priv, user, collection) ->
                            dt.pkgGet('ga','gaLog').value 'command', 'tw.grant', collection +", "+user+", "+priv
                            corelib.sequence [
                                ((policy) ->
                                    if not policy[priv]? then throw new Error "No such privilege " + priv
                                    if not policy[priv] instanceof Array then throw new Error "Grant cannot be used on privilege " + priv
                                    # check if it already exists
                                    if policy[priv].indexOf(user) >= 0
                                        throw new Error "User #{ user } already has privilege #{ priv } on object"
                                    policy[priv].push user)
                                (-> dt.save collection)
                            ], getPolicy collection
                        revoke: (priv, user, collection) ->
                            dt.pkgGet('ga','gaLog').value 'command', 'tw.revoke', collection +", "+user+", "+priv
                            corelib.sequence [
                                ((policy) ->
                                    if not policy[priv]? then throw new Error "No such privilege " + priv
                                    if not policy[priv] instanceof Array then throw new Error "Revoke cannot be used on privilege " + priv
                                    # check if it already exists
                                    if policy[priv].indexOf(user) < 0
                                        throw new Error "User #{ user } already lacks privilege #{ priv } on object"
                                    policy[priv] = (i for i in policy[priv] when i != user))
                                (-> dt.save collection)
                            ], getPolicy collection
                        text: (tiddlerPath) ->
                            dt.pkgGet('ga','gaLog').value 'command', 'tw.text', tiddlerPath
                            corelib.sequence [
                                ((wrapper) -> wrapper.value)
                                ((twObj) -> twObj.text)
                            ], dt tiddlerPath
                        user: (root) -> 
                            getUsername root
                        editFields: (tiddler) ->
                            wrappedTiddler = null
                            s = corelib.sequence [
                                ((t) -> 
                                    wrappedTiddler = t
                                    t.value)
                                ((twObj) -> [twObj.fields])
                                ((f) -> dt.pkgGet('jsonedit','jsonedit').value f)
                                (-> wrappedTiddler.save())
                            ], fslib.eval tiddler
                            s.toHTML = -> null
                            s
                        editRecipe: (recipe) ->
                            rec = null
                            s = corelib.sequence [
                                ((r) -> r.value)
                                ((twObj) -> 
                                    rec = twObj
                                    twObj.recipe)
                                ((recipe) -> dt.pkgGet('jsonedit','jsonedit').value recipe)
                                ((newRecipe) -> 
                                    rec.recipe = newRecipe
                                    dt.save recipe)
                            ], fslib.eval recipe
                            s.toHTML = -> null
                            s

