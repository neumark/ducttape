### 
    TODO: disable ACE keyboard shortcuts
### 

define [], () ->
    (dt) ->
        config = (dt 'config')
        session = (dt 'session')

        class HistoryBrowser
            constructor: (@ui) ->
                @editBuffer = @ui.editor.getSession().getValue()
                @pos = null
            back: ->
                if not @pos? then @pos = session.history.length
                if @pos > 0 then @pos--
                @ui.resetEditorContents session.history[@pos].coffee
                
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
            captureEvent: (ev) ->
                ev.preventDefault()
                ev.stopPropagation()
            init: () ->
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
                    if ev? and trigger(ev) then @captureEvent(ev)
                    #else  regular key pressed, see if we are editing history

                # install default keybindings
                bind 
                    description: 'Execute contents of buffer.'
                    keyCode: 13
                    shiftKey: false
                    action: => 
                        if @js_source.length > 0
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
                        {column: x, row: y} = @editor.getCursorPosition()
                        if (x == 0) and (y == 0)
                            @historyBrowser ?=  new HistoryBrowser(@)
                            @historyBrowser.back()
                            true
                        else
                            false

                bind 
                    description: 'Browse command history (next).'
                    keyCode: 40 # DOWN key
                    action: => 

            init_ui: () ->
                $('#menuhelp').click (ev) =>
                    captureEvent ev
                    @run 'help'
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
                    @js_source = (dt 'internals').pkgmgr.apply('builtin', 'compile', null, @coffee_source)?.trim()
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
            insertText: (text) ->
                currentValue = @editor.getSession().getValue()
                @editor.getSession().setValue(
                    if currentValue == (dt 'config').initial_buffer then text else currentValue + text)
                @scrollToBottom()
            resetEditorContents: (newContents = config.initial_buffer) ->
                lines = newContents.split('\n')
                @editor.gotoLine 0
                @editor.getSession().setValue newContents
                @editor.moveCursorToPosition
                    column: lines[lines.length - 1].length 
                    row: lines.length - 1
            scrollToBottom: () ->
                $("html, body").animate({ scrollTop: $(document).height() }, 200)
            formatEx: (ex) ->
                $("<div class=\"eval_result\"><span class=\"label label-warning\"> <strong>Exception</strong> (#{ ex?.type ? ""}) </span>&nbsp;<strong>#{ ex?.message ? ""}</strong>#{ if ex?.stack? then '<pre>'+ex.stack+'</pre>' else '' }</div>")
            execute: (coffee_stmt, js_stmt, silent = false) ->
                evalexpr = js_stmt ? (dt 'internals').pkgmgr.apply('builtin', 'compile', null, coffee_stmt)
                exception = null
                result = null
                try 
                    result = window.eval evalexpr.replace(/\n/g, "") + "\n"
                catch error
                    exception = error
                finally
                    rendered = null
                    try
                        rendered = if exception? then @formatEx exception else (dt 'internals').pkgmgr.apply('builtin', 'show', null, result)
                    catch renderErr
                        exception = renderErr
                        rendered = $('<div><h3>Error displaying value</h3></div>').append @formatEx exception
                    (dt 'session').history.push
                        js: js_stmt
                        coffee: coffee_stmt
                        value: exception ? result
                    if silent is off then $('#interactions').append @format_command 
                    $('#interactions').append rendered
            format_command: =>
                lines = $('div.ace_content', @editor_div).find('div.ace_line').clone()
                div_inner = $ "<div class='highlighted_expr ace_editor ace_text-layer'></div>" 
                div_inner.append(lines)
                div_outer = $ "<div class='#{ @editor.getTheme().cssClass } alert alert-info'></div>"
                div_outer.append(div_inner)
                div_outer
            run: (expr, silent = false) =>
                # TODO syntax highlighting in run
                if silent is off 
                    div =  $ "<div class='alert alert-info'></div>"
                    div.text expr
                    $("#interactions").append div
                @execute(expr, null, true)
                @scrollToBottom()

        UI #return the UI class
