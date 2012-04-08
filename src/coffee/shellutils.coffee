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

   shellutils.coffee - "shell utility functions", to make the DuctTape
   command more convenient for users.

###

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
                        h = dt.pkgGet('core','session').value.history
                        if h.length > 0 then h[h.length - 1] else "This is the first command."
                clear:
                    attr:
                        description: 'Clears prior interactions from the display.'
                        makePublic: true
                    value: ->
                        $('#interactions').children().remove()
                        null
                symbol:
                    attr:
                        description: 'Returns global name of DuctTape function.'
                        makePublic: true
                    value: -> dt.pkgGet('core','config').value.globalRef + ''
                history:
                    attr:
                        description: 'Prints history of formerly executed commands.'
                        makePublic: true
                    value: ->
                        uiLib = dt.pkgGet('ui','lib').value
                        c = $('<div class="eval_result"></div>')
                        for h in dt.pkgGet('core','session').value.history
                            do (h) ->
                                c.append $("<span><a style='display:block;' href='#'>#{ h.coffee }</a></span>").find('a').click (ev) ->
                                    uiLib.captureEvent ev
                                    uiLib.run h.coffee
                        c
                setvar:
                    attr:
                        description: 'Sets window.varName to the given value.'
                        makePublic: true
                    value: (name, value)->
                        window[name] = value
                curry:
                    attr:
                        description: 'Curries functions, setting this to window'
                    value: (fun, args...) ->
                        (laterArgs...) ->
                            (laterArgs...) -> fun.apply window, args.concat laterArgs
                lib:
                    attr:
                        description: 'Library of functions useful for command-line programs'
                    value:
                        log: (expr, source='', level='info') ->
                            # TODO: change decorator based on source and level
                            pkgGet('ui','display').value expr

