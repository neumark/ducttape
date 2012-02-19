define [], ->
    (dt) ->
        converter = new Showdown.converter() 
        pkg =
            name: 'help'
            attr:
                description: """
                             Contains the DuctTape help system. Use this package to add documentation for your own packages.<br />
                             The most important item in this package is the help command.
                             """
                author: 'Peter Neumark'
                url: 'https://github.com/neumark/ducttape'
                version: '1.0'
            value:
                help:
                    attr:
                        description: 'Function implementing the help command.'
                        makePublic: true
                    value: (sectionKey...) ->
                        sectionKey = if sectionKey?.length? < 1 then ['main'] else sectionKey
                        helpObj = pkg.value.helpStore.value
                        try 
                            for i in sectionKey
                                helpObj = helpObj[i]
                            if not helpObj? then throw new Error "NoSuchHelpSection"
                        catch err
                            return "No such help item: " + sectionKey.join(".")
                        $ ("<div class='eval_result'>" + converter.makeHtml(helpObj) + "</div>")
                helpStore:
                    attr:
                        description: 'Help contents stored in this object. Should be JSON.stringify-able.'
                    value:
                        main:
                            """
                            Main *help* section. To be updated.
                            """
                        intro:
                            """
                            Welcome to *DuctTape*, a new kind of terminal for the web.
                            """
