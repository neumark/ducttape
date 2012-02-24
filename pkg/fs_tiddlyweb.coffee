define ['corelib'], (corelib) ->
    (dt) ->
        root = (host) ->

            class TWObj
                constructor: (@name) ->
                    @obj = new (tiddlyweb[@type])(@name, host)
                    @contentObj = null
                    @childList = null
                request: (that, ajaxFun, attribute, transform) =>
                    if @[attribute]? then @[attribute] else 
                        promise = new corelib.Promise
                            ajaxFun: ajaxFun
                            that: that
                            transform: transform 
                        promise.twRequest = ajaxFun.apply that, [
                            (value) -> promise.fulfill true, value
                            (args...) -> 
                                # TODO: better error msg
                                (dt 'o ui:display').value args
                                promise.fulfill false, args
                        ]
                        promise
                # default content request class .get()
                contents: => 
                    @request @obj, @obj.get, 'contentObj'

            class TopLevel extends TWObj # bags, recipes 
                constructor: (name) -> 
                    @type = 'Collection'
                    super(name)
                contents: -> null
                # Children are collections (bags or recipes)
                children: ->
                    promise = null
                    promise = @request @obj, @obj.get, 'childList', (val) ->
                        if promise.isSuccessful 
                            (new SecondLevel (
                                collectionName
                                switch @name
                                    when 'bags' then 'Bag'
                                    when 'recipes' then 'Recipe'
                                    else
                                        throw new Error 'Unknown top level child: ' + @name
                            ) for i in val)
                        else val

            class SecondLevel extends TWObj # a Bag or Recipe
                constructor: (name, @type) -> 
                    super(name)
                # children are tiddlers
                children: =>
                    @request obj.tiddlers(), obj.tiddlers().get, 'childList', @mkChild
                mkChild: (title) => new TiddlerWrapper (title)

            class TiddlerWrapper extends TWObj
                constructor: (name) ->
                    @type = 'Tiddler'
                children: -> []
                # TODO: revisions, fields, tags could be further children

            class Root extends TWObj
                constructor: ->
                    @childList = [new TopLevel('bags'), new TopLevel('recipes')]
                contents: -> host
                children: => @childList

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
