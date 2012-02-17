define [], ->
    OWM:
        class OWM
            doc: """
                 An OWM has 3 parts:
                 - name              string
                 - attributes        object (dictionary)
                 - object itself     any truthy javascript value
                 """
            constructor: (owm...) ->
                # - {name: ..., attr: ..., value: ...}
                # - [name, attr, value]
                # - [name, {attr: ..., value: ...}]
                [@name, @attr, @value] = switch owm?.length
                    when 1 
                        [owm[0]?.name, owm[0]?.attr, owm[0]?.value]
                    when 2 then [owm?[0], owm?[1]?.attr, owm?[1]?.value]
                    when 3 then owm
                    else []
                if (not @name?) or (not @attr?) or (not @value) then throw new Error "Bad OWM format"
            hasAttributes: (attrList) ->
                missing = (f for f in @attrList when (not @attr[f]?))
                missing.length == 0
    compile: (src) ->
        if src.length == 0 then src else CoffeeScript.compile(src, {'bare': on})

