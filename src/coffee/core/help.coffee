###
   Copyright 2012 Peter Neumark

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

   help.coffee - Contains code and content for the help system.

###

define ['corelib'], (corelib) ->
    (dt) ->
        uiLib = dt.pkgGet('ui','lib').value
        fixLinks = (div) ->
            div.find('a').replaceWith ->
                a = $ @
                switch a.attr 'href'
                    when "/pseudoURL/run"
                        link = $("<a href='#'>#{ if (a.attr 'title') then a.attr 'title' else a.text() }</a>")
                        link.click (ev) ->
                            uiLib.captureEvent ev
                            uiLib.run a.text()
                        link
                    when "/pseudoURL/insert"
                        link = $("<a href='#'>#{ if (a.attr 'title') then a.attr 'title' else a.text() }</a>")
                        link.click (ev) ->
                            uiLib.captureEvent ev
                            dt.pkgGet('ui','insertText').value a.text()
                        link
                    when "/pseudoURL/replace" then dt.pkgGet('objectViewer','show').value corelib.execJS corelib.compile a.text()
                    else $("<a href='#{ a.attr 'href' }' target='_blank'>#{ a.text() }</a>")
        displayMarkDown = (md) ->
            result = $ ("<div class='eval_result'>" + converter.makeHtml(md) + "</div>")
            fixLinks result
            result
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
                    value: (section) ->
                        if section?[(dt.symbol() + 'id')]?
                            try 
                                vwm = dt.pkgGet.apply @ section[(dt.symbol() + 'id')].split(':')
                            catch e
                                return "Error retrieving help for "+ section[(dt.symbol() + 'id')]
                            # Very bare bones at the moment...
                            if vwm.attr.description? then displayMarkDown vwm.attr.description else "No description for " + section[(dt.symbol() + 'id')]
                        else
                            section ?= 'main'
                            helpText = pkg.value.helpStore.value[section]
                            if helpText? then displayMarkDown helpText else "No such help item: " + section
                listSections:
                    attr:
                        description: 'Utility function for listing help sections.'
                    value: ->
                            dom = $ converter.makeHtml ("*   [\u0111.help '#{ key }'](/pseudoURL/run \"#{ key }\")" for own key of pkg.value.helpStore.value).join("\n")
                            fixLinks dom
                            dom
                displayMarkDown:
                    attr:
                        description: 'Returns a DOM element with parsed MarkDown, correctly links to DuctTape PseudoURLs.'
                    value: displayMarkDown
                helpStore:
                    attr:
                        description: 'Help contents stored in this object. Should be JSON.stringify-able.'
                    value:
                        main:
                            """
                            # DuctTape help #
                            this is the _main_ section, which can be reached via [\u0111.help()](/pseudoURL/run) or [\u0111.help main](/pseudoURL/run).

                            ## Available help sections  
                            [(\u0111 'o help:listSections').value()](/pseudoURL/replace)
                            ## Help for a function or object
                            For any DuctTape function or object, view the related documentation by typing **\u0111.help _function_**

                            Example: [\u0111.help \u0111.show](/pseudoURL/run)

                            """
                        intro:
                            """
                            # Welcome to DuctTape #
                            _DuctTape_ is an [open source](https://github.com/neumark/ducttape) [CoffeeScript](http://coffeescript.org) [REPL](http://en.wikipedia.org/wiki/REPL) for the web.

                            ## Getting Started ##
                            Any valid CoffeeScript expression typed into the console will be translated to JavaScript and executed.
                            DuctTape will display the result.
                            The [\u0111.help()](/pseudoURL/run) function can be used to get help about objects included in DuctTape.
                            For example, [\u0111.help \u0111.show](/pseudoURL/run) will describe the _show_ command.

                            ## Key bindings ##

                            <table><thead><tr><td><b>Key</b></td><td><b>Action</b></td></tr></thead>
                            <tbody>
                            <tr><td>Enter  </td><td>Executes current statement.</td></tr>
                            <tr><td>Shift+Enter &nbsp;</td><td> Start a new line (multiline expressions are allowed).</td></tr>
                            <tr><td>F2  </td><td>Toggles display of generated JavaScript source.</td></tr>
                            <tr><td>Alt+D  </td><td>Insert the <i>DuctTape symbol</i> (\u0111).</td></tr>
                            <tr><td>up  </td><td>Browse command history (go back).</td></tr>
                            <tr><td>down  </td><td>Browse command history (go forward).</td></tr>
                            </tbody></table>

                            ## Useful functions ##
                            DuctTape comes with a few convenience functions to make your life easier:
                            
                            [\u0111.history()](/pseudoURL/run): List previous commands.

                            [\u0111.last()](/pseudoURL/run): Get the last command issued, along with its result.

                            [\u0111.clear()](/pseudoURL/run): Erase the result of previous commands.

                            [\u0111.ov window](/pseudoURL/run): Browse any javascript object (in this case, _window_).

                            To view the list of all currently loaded packages and their contents, run [\u0111.listPackages()](/pseudoURL/run).

                            ## DuctTape is extensible ##
                            Thanks to it's modular architecture, anyone can add commands to DuctTape.
                            Write your own custom packages, and use DuctTape for whatever you want!

                            ## Get Involved! ##
                            Do you enjoy using DuctTape, have feature requests or need help developing custom packages?
                            
                            Let me know! You can find me on [GitHub](https://github.com/neumark).

                            **Have fun!**

                            """
