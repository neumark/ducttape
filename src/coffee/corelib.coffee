define [], ->
    VWM:
        class VWM
            doc: """
                 A VWM has 3 parts:
                 - name              unique id (within namespace) - string
                 - attr              attributes - object (dictionary)
                 - value             the actual value - any truthy javascript value
                 """
            constructor: (vwm...) ->
                # - {name: ..., attr: ..., value: ...}
                # - [name, attr, value]
                # - [name, {attr: ..., value: ...}]
                [@name, @attr, @value] = switch vwm?.length
                    when 1 
                        if vwm[0]?.length? == 3 then vwm[0] else [vwm[0]?.name, vwm[0]?.attr, vwm[0]?.value]
                    when 2 then [vwm?[0], vwm?[1]?.attr, vwm?[1]?.value]
                    when 3 then vwm
                    else []
                if (not @name?) or (not @attr?) or (not @value) then throw new Error "Bad VWM format"
                if (typeof @attr) != "object" then throw new Error "VWM attr field must be an object"
            hasAttributes: (attrList) ->
                missing = (f for f in attrList when (not @attr[f]?))
                missing.length == 0
    compile: (src) ->
        if src.length == 0 then src else CoffeeScript.compile(src, {'bare': on})

