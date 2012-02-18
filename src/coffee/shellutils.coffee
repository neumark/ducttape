define [], ->
    (dt) ->
        pkg =
            name: 'shellUtils'
            attr:
                description: 'Utilities functions to make DuctTape more shell-like.'
                author: 'Peter Neumark'
                url: 'https://github.com/neumark/ducttape'
                version: '1.0'
            value:
                last:
                    attr:
                        description: 'Displays the last executed command and result.'
                        makePublic: true
                    value: ->
                        h = (dt 'v session').history
                        if h.length > 0 then h[h.length - 1] else "This is the first command."
                clear:
                    attr:
                        description: 'Clears prior interactions from the display.'
                        makePublic: true
                    value: ->
                        $('#interactions').children().remove()
                        null
                history:
                    attr:
                        description: 'Prints history of formerly executed commands.'
                        makePublic: true
                    value: ->
                        uiLib = (dt 'o ui:lib')
                        c = $('<div class="eval_result"></div>')
                        for h in (dt 'v session').history
                            do (h) ->
                                c.append $("<span><a style='display:block;' href='#'>#{ h.coffee }</a></span>").find('a').click (ev) ->
                                    uiLib.captureEvent ev
                                    uiLib.run h.coffee
                        c

