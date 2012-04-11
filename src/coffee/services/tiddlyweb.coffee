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

define ['corelib'], (corelib) ->
    (dt) ->
        fslib = dt.pkgGet('fs','lib').value
        makeMountPoint = (mountName, mountParent, options) ->
            host = options.url
            class TWObj extends fslib.Node
                constructor: (name, parent=null, filters=null) ->
                    super name, parent
                    @obj ?= new (tiddlyweb[@attr.type])(@name, host, filters)
                    @contentObj = null
                    @childList = null
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
                    @attr = type: 'Collection'
                    @attr.__defineSetter__ 'children', -> throw new Error 'NotImplemented'
                    @attr.__defineGetter__ 'children', =>
                        t = switch @name
                            when 'bags' then 'Bag'
                            when 'recipes' then 'Recipe'
                            else
                                throw new Error 'Unknown top level child: ' + @name
                        ns = @fullname()
                        @request @obj, @obj.get, 'childList', (val) =>
                            new fslib.NodeSet ({
                                    key: i
                                    value: new SecondLevel(i, t, @)
                                } for i in val)
                    @value = true
                    super(name, parent)

            class SecondLevel extends TWObj # a Bag or Recipe
                constructor: (name, type, parent) -> 
                    # Define a setter for the value property
                    @__defineSetter__ 'value', -> throw new Error 'NotImplemented'
                    @__defineGetter__ "value", =>
                        @request @obj, @obj.get, 'contentObj'
                    @attr = type: type
                    @attr.__defineSetter__ 'children', -> throw new Error 'NotImplemented'
                    @attr.__defineGetter__ 'children', => 
                        @request(
                            @obj.tiddlers()
                            (cb1, cb2) => @obj.tiddlers().get cb1, cb2, "fat=1"
                            'childList',
                            (tiddlerList) -> new fslib.NodeSet(({
                                    key: tiddler.title
                                    value: new TiddlerWrapper(tiddler, @)
                                } for tiddler in tiddlerList))
                        )
                    super(name, parent)

            class TiddlerWrapper extends TWObj
                constructor: (@tiddler, @parent) ->
                    @name = @tiddler.title
                    @attr = type: 'Tiddler'
                    @value = @tiddler
                    #@__defineSetter__ 'value', -> throw new Error 'NotImplemented'
                    #@__defineGetter__ "value", => @tiddler
                    # TODO: revisions, fields, tags could be further children

            class Root extends TWObj
                constructor: ->
                    @name = mountName
                    @attr = 
                        type: 'root'
                        parent: mountParent
                    @attr.children = new fslib.NodeSet ({
                            value: new TopLevel(i, @),
                            key: i
                        } for i in ['bags', 'recipes'])
                    @value = true
            twebRoot = new Root()

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
