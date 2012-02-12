define ['cmd'], (Cmd) ->
    # variables
    cmd = new Cmd()

    # helper functions
    badCommand = ->
        "No such command"
    # main DuckTape function
    dtFun = (argv...) ->
        # temporary
        if argv.length > 0 
            fn = cmd.get argv[0]
            (fn ? badCommand)()

    dtFun.session = 
        history: []
        config:
            initial_buffer: "\u0111"
            keybindings: [
               {keyCode: 13, shiftKey: false}
               {keyCode: 68, altKey: true}
            ]

    dtFun.lib = 
        compile: (src) ->
            if src.length == 0
                src 
            else
                CoffeeScript.compile(src, {'bare': on})

    # Just a hack to get a command working
    cmd.add 'last', ->
        dtFun.session.history[dtFun.session.history.length - 1]

    # Returns the DuctTape function
    dtFun
