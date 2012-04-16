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
   Note: It is assumed that chrjs is included and that the AJAX calls will be
   successful (because ducttape is hosted from the same domain, CORS or an
   iframe hack).
###
# The mutable-state dependancy is a hack to make CRUD operations work on tiddlyspace!
define ['build/js/corelib.js', 'http://mutable-state.tiddlyspace.com/mutable-state.js'], (corelib, with_mutable_state) ->
    (dt) ->
        fslib = dt.pkgGet('fs','lib').value
        makeMountPoint = (mountName, mountParent, options) ->
            host = options.url
            tiddylweb = null
            twebPromise = new corelib.Promise()
            with_mutable_state (t) -> 
                tiddlyweb = t
                twebPromise.fulfill true, t
            class TWObj extends fslib.Node
                constructor: (name, parent=null, filters=null) ->
                    super name, parent
                    @obj ?= @mkTwebObj @attr.type, @name, filters
                    @contentObj = null
                    @childList = null
                mkTwebObj: (type, name, filters) -> new (@tw[type])(name, host, filters)
                destroy: -> 
                    promise = new corelib.Promise()
                    # TODO: update nodelist if delete is successful
                    # TODO: give decent error msg otherwise
                    @obj.delete \
                        ((status) -> promise.fulfill true, status),
                        ((err) -> promise.fulfill false, err)
                    promise    
                request: (that, ajaxFun, attribute, transform = (x)->x) =>
                    if @[attribute]? then @[attribute] else 
                        promise = new corelib.Promise
                            ajaxFun: ajaxFun
                            that: that
                        promise.twRequest = ajaxFun.apply that, [
                            (value) => 
                                @[attribute] = transform(value)
                                promise.fulfill true, @[attribute]
                            (args...) => 
                                # TODO: better error msg
                                (dt 'o ui:display').value args
                                promise.fulfill false, args
                        ]
                        promise

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
                createChild: (name, desc, policy, recipe) ->
                    newObj = @mkTwebObj @getType(), name
                    if desc? then newObj.desc = desc
                    if policy? then newObj.policy = $.extend newObj.policy, policy
                    if recipe? then newObj.recipe = recipe
                    creationPromise = new corelib.Promise()
                    newObj.put \
                            (obj) -> creationPromise.fulfill true, obj
                            (err...) -> creationPromise.fulfill false, err
                    # TODO: add newObj to child set.
                    creationPromise
 
            class SecondLevel extends TWObj # a Bag or Recipe
                constructor: (name, type, parent) -> 
                    # Define a setter for the value property
                    @__defineSetter__ 'value', -> throw new Error 'NotImplemented'
                    @__defineGetter__ "value", =>
                        @request @obj, @obj.get, 'contentObj'
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
                createChild: (name, text, tags, fields) ->
                    # TODO: if @ is a recipe, we should add tiddler to last bag in recipe
                    if @attr.type != 'Bag' then throw new Error 'Cannot create child here.'
                    newObj = @mkTwebObj 'Tiddler', name
                    newObj.bag = @obj
                    newObj.text = text
                    if tags? then newObj.tags = tags
                    if fields? then newObj.fields = $.extend newObj.fields, fields
                    creationPromise = new corelib.Promise()
                    newObj.put \
                            (obj) -> creationPromise.fulfill true, obj
                            (err...) -> creationPromise.fulfill false, err
                    # TODO: add newObj to child set.
                    creationPromise
                   
            class TiddlerWrapper extends TWObj
                constructor: (@tiddler, @parent) ->
                    @name = @tiddler.title
                    @attr = type: 'Tiddler'
                    @value = @tiddler
                    #@__defineSetter__ 'value', -> throw new Error 'NotImplemented'
                    #@__defineGetter__ "value", => @tiddler
                    # TODO: revisions, fields, tags could be further children

            class Root extends TWObj
                constructor: (tw) ->
                    TWObj::tw = tw
                    @name = mountName
                    @childSet = new fslib.NodeSet ({
                            value: new TopLevel(i, @),
                            key: i
                        } for i in ['bags', 'recipes'])
                    @attr = 
                        type: 'root'
                        parent: mountParent
                        children: => @childSet 
                    @value = true
            twebRoot = twebPromise.apply (tiddlyweb) -> new Root(tiddlyweb)
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
