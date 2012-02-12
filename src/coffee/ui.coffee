### 
    TODO: disable ACE keyboard shortcuts
### 

define ['ducttape', 'objectviewer'], (dt, ov) ->
    dt.lib.capture_event = capture_event = (ev) ->
        ev.preventDefault()
        ev.stopPropagation()

    class UI
        constructor: ->
            # register this object with DuctTape
            dt.ui = @
            @editor = null
            @editor_div = document.getElementById "editor"
            @coffee_source = ""
            @js_source = ""
            @init_ace()
            @init_ui()
            @reset_editor_contents()
        init_ace: () ->
            @editor = ace.edit "editor"
            @editor.getSession().setMode(new (ace.require("ace/mode/coffee").Mode)())
            @editor.getSession().setTabSize(4)
            @editor.getSession().setUseSoftTabs(true)
            @editor.getSession().setUseWrapMode(false)
            @editor.setHighlightActiveLine(true)
            @editor.setShowPrintMargin(false)
            @editor.renderer.setShowGutter(false)
            @editor.renderer.setHScrollBarAlwaysVisible(false)
            @editor.getSession().on "change", (ev) => @update(ev)
            @editor.setKeyboardHandler handleKeyboard: (_1, _2, _3, keyCode, ev) =>
                if ev?
                    switch ev.keyCode
                        when 13 # enter - to execute code in buffer
                            if ev.shiftKey is off
                                capture_event ev
                                if @js_source.length > 0
                                    @execute @coffee_source, @js_source
                                    @clear_src_buffers()
                                    @reset_editor_contents()
                                    @scroll_to_bottom()
                        when 68 # d - to insert DuctTape character
                            if ev.altKey is on
                                capture_event ev
                                @editor.insert '\u0111'
        init_ui: () ->
            $('#editor_wrapper').height($('#editor').height())
            $('#editor_wrapper').width($('#editor').width())
            $('#parseerror').width($('#editor').width())
            $('#menuhelp').click (ev) =>
                capture_event ev
                @run 'help'
                false
        update: (ev) ->
            @coffee_source = @editor.getSession().getValue().trim()
            try 
                @js_source = (dt.lib.compile(@coffee_source))?.trim()
                $("#ok").show()
                $("#parseerror").hide()
            catch error
                @js_source = ""
                $("#ok").hide()
                $("#parseerror").show().text(error.message)
        clear_src_buffers: () ->
            @js_source = ""
            @coffee_source = ""
        insertText: (text) ->
            currentValue = @editor.getSession().getValue()
            @editor.getSession().setValue(
                if currentValue == dt.session.config.initial_buffer then text else currentValue + text)
            @scroll_to_bottom()
        reset_editor_contents: () ->
            @editor.gotoLine 0
            @editor.getSession().setValue dt.session.config.initial_buffer
            @editor.moveCursorToPosition
                column: 1
                row:0
        scroll_to_bottom: () ->
            $("html, body").animate({ scrollTop: $(document).height() }, 200)
        formatEx: (ex) ->
            $("<div class=\"eval_result\"><span class=\"label label-warning\"> <strong>Exception</strong> (#{ ex?.type ? ""}) </span>&nbsp;<strong>#{ ex?.message ? ""}</strong></div>")
        execute: (coffee_stmt, js_stmt) ->
            evalexpr = js_stmt ? dt.lib.compile(coffee_stmt)
            excpetion = null
            result = null
            try 
                result = window.eval evalexpr.replace(/\n/g, "") + "\n"
            catch error
                exception = error
            finally
                rendered = null
                try
                    rendered = if exception? then @formatEx exception else ov.showValue result
                catch renderErr
                    exception = renderErr
                    rendered = $('<div><h3>Error displaying value</h3></div>').append @formatEx exception
                dt.session.history.push
                    js: js_stmt
                    coffee: coffee_stmt
                    value: exception ? result
                $('#interactions').append @format_command()
                $('#interactions').append rendered
        format_command: =>
            lines = $('div.ace_content', @editor_div).find('div.ace_line').clone()
            div_inner = $ "<div class='highlighted_expr ace_editor ace_text-layer'></div>" 
            div_inner.append(lines)
            div_outer = $ "<div class='#{ @editor.getTheme().cssClass } alert alert-info'></div>"
            div_outer.append(div_inner)
            div_outer
        run: (expr) ->
            @execute(expr)
            @scroll_to_bottom()

    UI #return the UI class
