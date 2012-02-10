class DuctTape
    constructor: () ->
        # Init fields
        @session = 
            history: []
            last_exception: null
            last_result: null
            last_evaluated_js: null
        @editor = 0
        @coffee_source = ""
        @js_source = ""
        @eval_context = {}
        # Init interface
        @init_ace()
        @init_ui()
        @update()

    init_ace: () ->
        @editor = ace.edit "editor"
        @editor.getSession().setMode(new (require("ace/mode/coffee").Mode)())
        #editor.setKeyboardHandler(require("ace/keyboard/keybinding/vim").Vim)
        @editor.getSession().setTabSize(4)
        @editor.getSession().setUseSoftTabs(true)
        @editor.getSession().setUseWrapMode(false)
        @editor.setHighlightActiveLine(true)
        @editor.setShowPrintMargin(false)
        @editor.renderer.setShowGutter(false)
        @editor.renderer.setHScrollBarAlwaysVisible(false)
        @editor.getSession().on "change", () => @update()
        @editor.setKeyboardHandler handleKeyboard: (_1, _2, _3, keyCode, modifiers) =>
            if (keyCode == 13 and not (modifiers?.shiftKey == true))
                if @js_source.length > 0
                    @execute(@coffee_source, @js_source)
                    @clear_src_buffers()
                    @reset_editor_contents()
                    @scroll_to_bottom()

    init_ui: () ->
        $('#editor_wrapper').height($('#editor').height())
        $('#editor_wrapper').width($('#editor').width())
        $('#parseerror').width($('#editor').width())
        $('#menuhelp').click () =>
            @run 'help'
            false

    compile: (src) ->
        if src.length == 0
            src 
        else
            CoffeeScript.compile(src, {'bare': on})

    update: () ->
        @coffee_source = @editor.getSession().getValue().trim()
        try 
            @js_source = (@compile(@coffee_source))?.trim()
            $("#ok").show()
            $("#parseerror").hide()
        catch error
            @js_source = ""
            $("#ok").hide()
            $("#parseerror").show().text(error.message)

    format_ex: (ex) ->
        $("<div class=\"eval_result\"><span class=\"label-warning\"> <strong>Exception</strong> (#{ ex.type ? ""}) </span>&nbsp;<strong>#{ ex.message ? ""}</strong></div>")
    format_retval: (val) ->
        if val instanceof HTMLElement
            val
        else
            $("<div class=\"eval_result\">#{ val }</div>")

    clear_src_buffers: () ->
        @js_source = ""
        @coffee_source = ""

    reset_editor_contents: () ->
        @editor.getSession().setValue("")
        @editor.moveCursorToPosition
            column: 0
            row:0
        @editor.gotoLine 0

    scroll_to_bottom: () ->
        $("html, body").animate({ scrollTop: $(document).height() }, 200)
       
    execute: (coffee_stmt, js_stmt) ->
        evalexpr = js_stmt ? @compile(coffee_stmt)
        result = null
        try 
            result = @format_retval window.eval evalexpr.replace(/\n/g, "") + "\n"
        catch error
            result = @format_ex error
        finally
            code = $ "<pre class=\"executed\"></pre>"
            code.text coffee_stmt
            $('#interactions').append code
            $('#interactions').append result

    run: (expr) ->
        @execute(expr)

$ () ->
    window.dt = new DuctTape()

