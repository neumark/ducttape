define [], ->
    class KeyBindings
        constructor: (@store = {})->
        bind: (ev) =>
            if not ev?.keyCode? then throw new Error "keyCode of key event descriptor must be set"
            if not @store[ev.keyCode]? then @store[ev.keyCode] = []
            @store[ev.keyCode].push(ev)
        trigger: (ev) =>
            if (not ev?.keyCode?) or (not @store[ev.keyCode]?) then return false
            l = @store[ev.keyCode]
            i = 0
            attr = null
            while i < l.length
                differences = (attr for own attr, val of l[i] when (ev[attr]? and ev[attr] != val))
                if differences.length == 0 then return l[i].action(ev)
                i++
            false
                
             
