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

   ui.coffee - The DuctTape UI.

###

define [], ->
    (dt) ->
        config = (dt 'v config')
        session = (dt 'v session')
        show = (dt 'o objectViewer:show').value

        class HistoryBrowser
            constructor: (@ui) ->
                @editBuffer = @ui.editor.getSession().getValue()
                @pos = null
            back: ->
                if not @pos? then @pos = session.history.length
                if @pos > 0 then @pos--
                @ui.resetEditorContents session.history[@pos].coffee
            forward: ->
                @pos++
                if @pos >= session.history.length 
                    @ui.resetEditorContents @editBuffer
                    false
                else 
                    @ui.resetEditorContents session.history[@pos].coffee
                    true
               
        class UI
            constructor: (@editor_div_id = "editor") ->
                # register this object with DuctTape
                @editor = null
                @editor_div = document.getElementById @editor_div_id
                @coffee_source = ""
                @js_source = ""
                @timeoutHandle = null
                @UPDATE_DELAY = 300 # in miliseconds
                @historyBrowser = null
            init: () =>
                if @editor? then return false
                @init_ace()
                @init_ui()
                @resetEditorContents()
            init_ace: () ->
                @editor = ace.edit @editor_div_id
                @editor.getSession().setMode(new (ace.require("ace/mode/coffee").Mode)())
                @editor.getSession().setTabSize(4)
                @editor.getSession().setUseSoftTabs(true)
                @editor.getSession().setUseWrapMode(false)
                @editor.setHighlightActiveLine(true)
                @editor.setShowPrintMargin(false)
                @editor.renderer.setShowGutter(false)
                @editor.renderer.setHScrollBarAlwaysVisible(false)
                @editor.getSession().on "change", @updateTimeout
                bind = session.keybindings.bind
                trigger = session.keybindings.trigger
                @editor.setKeyboardHandler handleKeyboard: (_1, _2, _3, _4, ev) =>
                    if ev? and trigger(ev) then lib.captureEvent(ev)
                    #else  regular key pressed, see if we are editing history

                # install default keybindings
                bind 
                    description: 'Execute contents of buffer.'
                    keyCode: 13
                    shiftKey: false
                    action: => 
                        if @js_source.length > 0
                            @historyBrowser = null
                            @update()
                            @execute @coffee_source, @js_source
                            @clear_src_buffers()
                            @resetEditorContents()
                            @scrollToBottom()
                        true
                bind 
                    description: 'Insert DuctTape symbol (\u0111).'
                    keyCode: 68
                    altKey: true
                    action: =>
                        @editor.insert '\u0111'
                        true
                bind 
                    description: 'Toggle generated javascript window.'
                    keyCode: 113
                    action: =>
                        if config.showGeneratedJS
                            $('#jsSource').hide()
                        else
                            @updateGeneratedJS()
                            $('#jsSource').show()
                            @scrollToBottom()
                        config.showGeneratedJS = not config.showGeneratedJS
                        true

                # The UP/DOWN keys may be used for several things (history, autocomplete, etc).
                # We decide what to do within the event handler.
                bind
                    description: 'Browse command history (previous).'
                    keyCode: 38 # UP key
                    action: =>
                        if @editor.getCursorPosition().row == 0
                            @historyBrowser ?=  new HistoryBrowser(@)
                            @historyBrowser.back()
                            true
                        else
                            false

                bind 
                    description: 'Browse command history (next).'
                    keyCode: 40 # DOWN key
                    action: => 
                        if @historyBrowser? and @editor.getCursorPosition().row == (@editor.getSession().getValue().split('\n').length - 1)
                            if not @historyBrowser.forward() 
                                @historyBrowser = null
                            true
                        else
                            false

            init_ui: () ->
                $('#menuhelp').click (ev) =>
                    lib.captureEvent ev
                    lib.run "(#{ dt.symbol() } 'o help:help').value()"
                    false
            updateGeneratedJS: ->
                $('#jsSource pre').text(@js_source)
            updateTimeout: =>
                # Called when the user is typing.
                # If there's a scheduled timeout, clear it.
                if @timeoutHandle? then window.clearTimeout @timeoutHandle
                # set a new timeout
                @timeoutHandle = setTimeout @update, @UPDATE_DELAY
            update: =>
                # @timeoutHandle could be non-null if update() is called by the execution handler
                if @timeoutHandle? then window.clearTimeout @timeoutHandle
                @timeoutHandle = null
                @coffee_source = @editor.getSession().getValue().trim()
                try 
                    @js_source = ((dt 'v internals').corelib.compile @coffee_source)?.trim()
                    $("#ok").show()
                    $("#parseerror").hide()
                    if config.showGeneratedJS then @updateGeneratedJS()
                catch error
                    @js_source = ""
                    $("#ok").hide()
                    $("#parseerror").show().text(error.message)
                    @scrollToBottom()
            clear_src_buffers: () ->
                @js_source = ""
                @coffee_source = ""
            insertText: (text) =>
                cursor = @editor.getCursorPosition()
                cursor.column += text.length;
                currentValue = @editor.getSession().getValue()
                @editor.getSession().setValue(
                    if currentValue == (dt 'config').initial_buffer then text else currentValue + text)
                @scrollToBottom()
                @editor.moveCursorToPosition cursor
            resetEditorContents: (newContents = config.initial_buffer) =>
                lines = newContents.split('\n')
                @editor.gotoLine 0
                @editor.getSession().setValue newContents
                @editor.moveCursorToPosition
                    column: lines[lines.length - 1].length 
                    row: lines.length - 1
            scrollToBottom: () =>
                # Scroll
                $("html, body").animate({ scrollTop: $(document).height() }, 200)
                # Put focus on edit buffer
                $('textarea', @editor_div).focus()
            formatEx: (ex) ->
                $("<div class=\"eval_result\"><span class=\"label label-warning\"> <strong>Exception</strong> (#{ ex?.type ? ""}) </span>&nbsp;<strong>#{ ex?.message ? ""}</strong>#{ if ex?.stack? then '<pre>'+ex.stack+'</pre>' else '' }</div>")
            detach: (content) ->
                # note: if there are other children of the parent, the order will be messed up!
                # In the following case, the element being returned is a jQuery or vanilla DOM node
                # that is already attached to the DOM.
                # We need to locate the previous parent, and insert a "this content has moved, but you can
                # move it back" link.
                if content.parents().last()?[0] instanceof HTMLHtmlElement
                    oldParent = content.parents().first()
                    msg = $("<div class='eval_result'><h2>This content has been moved!</h2>Sorry, it seems the content that used to be here is now somewhere else. No worries, though, <a href='#'>you can always get it back</a>.</div>")
                    msg.find('a').click (ev) =>
                        lib.captureEvent ev
                        # detach from current parent
                        @detach(content)
                        content.appendTo oldParent
                        msg.detach()
                    content.detach()
                    msg.appendTo oldParent
                content
            display: (expr, where = $('#interactions'), decorator = $('<div class="eval_result"></div>')) =>
                div = decorator.append @detach show expr
                if typeof(where) == "object" then where.append div
                null
            execute: (coffee_stmt, js_stmt, silent = false) ->
                evalexpr = js_stmt ? (dt 'v internals').corelib.compile coffee_stmt
                exception = null
                result = null
                try 
                    result = (dt 'v internals').corelib.execJS evalexpr
                catch error
                    exception = error
                finally
                    # add to history
                    (dt 'v session').history.push historyEntry =
                        js: js_stmt
                        coffee: coffee_stmt
                        value: exception ? result
                        timestamp: new Date()
                    if silent is off then $('#interactions').append @format_command 
                    if (result != null) or (exception != null) then @display(
                        try
                            (if exception? then @formatEx exception else result)
                        catch renderEx
                            historyEntry.renderEx = renderEx
                            $('<div><h3>Error displaying value</h3></div>').append @formatEx renderEx
                    )
            format_command: =>
                lines = $('div.ace_content', @editor_div).find('div.ace_line').clone()
                div_inner = $ "<div class='highlighted_expr ace_editor ace_text-layer'></div>" 
                div_inner.append(lines)
                div_outer = $ "<div class='#{ @editor.getTheme().cssClass } alert alert-info'></div>"
                div_outer.append(div_inner)
                div_outer

        ui = new UI() #return the UI class
        lib = # contains regular JS functions
            captureEvent: (ev) ->
                ev.preventDefault()
                ev.stopPropagation()
            run: (expr, silent = false) ->
                # TODO syntax highlighting in run
                if silent is off 
                    div =  $ "<div class='alert alert-info'></div>"
                    div.text expr
                    $("#interactions").append div
                ui.execute(expr, null, true)
                ui.scrollToBottom()
            asyncValue: (loadingMsg = 'loading...') ->
                div = $ '<div class="eval_result"></div>'
                ui.display loadingMsg, $('#interactions'), div
                (values...) ->
                    div.children().remove()
                    if values.length == 0 then values = values[0]
                    ui.display values, false, div
        pkg =
            name: 'ui'
            attr:
                description: 'The User Interface package of DuctTape. The lib object contains the API of the DuctTape GUI.'
                author: 'Peter Neumark'
                url: 'https://github.com/neumark/ducttape'
                version: '1.0'
            value:
                init:
                    attr:
                        description: 'Initialializes the DuctTape user interface.'
                        makePublic: true
                    value: ui.init
                insertText:
                    attr:
                        description: 'Inserts text in the the edit buffer.'
                    value: ui.insertText
                setText:
                    attr:
                        description: 'Replaces the current edit buffer with the provided text'
                    value: ui.resetEditorContents
                lib:
                    attr:
                        description: 'A library of useful functions for programming the DuctTape UI.'
                    value: lib
                display:
                    attr:
                        description: 'Displays the result of an expression in the interactions window.'
                        makePublic: true
                    value: ui.display
