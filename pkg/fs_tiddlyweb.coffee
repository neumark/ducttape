define [], ->
    (dt) ->
        root = (host) ->

            class TWObj
                constructor: (@name) ->
                    @obj = new (tiddlyweb[@type])(@name, host)
                    @contents = null
                    @children = null
                # no children is the default
                childRequestFn: (cb) -> cb [] 
                getChildren: 
                    (cb, failureCb) => if @children? then cb @children else @childRequestFn (
                        (children) =>
                            @children = (@mkChild c for c in children) 
                            cb @children
                        (failureCb ? @failureCb)
                    )
                failureCb: (args...) =>
                    (dt 'o ui:display').value args
                getContents: (cb, failureCb) => if @contents? then cb contents else @obj.get(
                    (c) => 
                        @contents = c
                        cb c
                    (failureCb ? @failureCb)
                )

            class TopLevel extends TWObj # bags, recipes
                constructor: (name) -> 
                    @type = 'Collection'
                    super(name)
                childRequestFn: -> @obj.get.apply @ arguments
                getContents: (cb) -> cb null
                mkChild: 
                    (collectionName) ->
                        new SecondLevel (
                                collectionName
                                switch @name
                                    when 'bags' then 'Bag'
                                    when 'recipes' then 'Recipe'
                                    else
                                        throw new Error 'Unknown top level child: ' + @name
                        )

            class SecondLevel extends TWObj # a Bag or Recipe
                constructor: (name, @type) -> 
                    super(name)
                childRequestFn: -> 
                    that = @obj.tiddlers()
                    that.get.apply that arguments
                mkChild: (title) -> new Tiddler (title)

            class Tiddler extends TWObj
                constructor: (name) ->
                    @type = 'Tiddler'

            class Root extends TWObj
                constructor: ->
                getContents: (cb) -> cb host
                childRequestFn: (cb) -> cb ['bags', 'recipes']
                mkChild: (name) -> new TopLevel name

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
