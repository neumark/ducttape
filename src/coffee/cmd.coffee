define [], ->
    class Cmd
        constructor: (@cmdStore) ->
            @cmdStore ?= {}
        add: (cmd, fn) ->
            @cmdStore[cmd] = fn
        get: (cmd) ->
            @cmdStore[cmd]
            
