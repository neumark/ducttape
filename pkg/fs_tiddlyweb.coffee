define ['corelib'], (corelib) ->
    (dt) ->
        root = (host) ->

            class TWObj extends corelib.NAV
                constructor: (@name, filters=null) ->
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
                constructor: (name) -> 
                    @attr = type: 'Collection'
                    @attr.__defineSetter__ 'children', -> throw new Error 'NotImplemented'
                    @attr.__defineGetter__ 'children', =>
                        t = switch @name
                            when 'bags' then 'Bag'
                            when 'recipes' then 'Recipe'
                            else
                                throw new Error 'Unknown top level child: ' + @name
                        @request @obj, @obj.get, 'childList', (val) =>
                            (new SecondLevel(i, t) for i in val)
                    @value = true
                    super(name)

            class SecondLevel extends TWObj # a Bag or Recipe
                constructor: (name, type) -> 
                    # Define a setter for the value property
                    @__defineSetter__ 'value', -> throw new Error 'NotImplemented'
                    @__defineGetter__ "value", =>
                        @request @obj, @obj.get, 'contentObj'
                    @attr = type: type
                    @attr.__defineSetter__ 'children', -> throw new Error 'NotImplemented'
                    @attr.__defineGetter__ 'children', => @request(
                            @obj.tiddlers()
                            (cb1, cb2) => @obj.tiddlers().get cb1, cb2, "fat=1"
                            'childList',
                            (tiddlerList) -> (new  TiddlerWrapper (tiddler) for tiddler in tiddlerList)
                        )
                    super(name)

            class TiddlerWrapper extends TWObj
                constructor: (@tiddler) ->
                    @name = @tiddler.title
                    @attr = type: 'Tiddler'
                    @value = @tiddler
                    #@__defineSetter__ 'value', -> throw new Error 'NotImplemented'
                    #@__defineGetter__ "value", => @tiddler
                    # TODO: revisions, fields, tags could be further children

            class Root extends TWObj
                constructor: ->
                    @name = '/'
                    @attr = 
                        type: 'root'
                        children: [new TopLevel('bags'), new TopLevel('recipes')]
                    @value = true
            new Root()

        pkg =
            name: "fs_tiddlyweb"
            attr:
                description: "TiddlyWeb fs adaptor package"
                author: "Peter Neumark"
                version: "1.0"
                url: "https://github.com/neumark/ducttape"
            value:
                root:
                    attr:
                        description: "Root node of tiddlyweb filesystem."                     
                    value: root
