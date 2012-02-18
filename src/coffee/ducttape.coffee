define ['cmd', 'keybindings', 'ui', 'pkgmgr', 'objectviewer', 'corelib', 'shellutils', 'help'], (Cmd, KeyBindings, ui, PkgMgr, objectviewer, corelib, shellUtils, help) ->
    (config) ->
        class DuctTape
            constructor: (@config = {}) ->
                # sanitize configuration:
                @config ?= {}
                @config.global_ref ?= "\u0111"
                @config.initial_buffer ?= config.global_ref
                @config.showGeneratedJS ?= false
                # fields:
                @internals =
                    cmd: new (Cmd(@))()
                    corelib: corelib 
                @session =
                    history: []
                    keybindings: new KeyBindings()

        # instantiate our DuctTape class
        dtobj = new DuctTape(config)

        # main DuctTape function
        dt = dtobj.exec = -> dtobj.internals.cmd.exec.apply dtobj.cmd, arguments
        dt.toHTML = -> $ "<span>TODO: run help function</span>"

        dtobj.internals.pkgmgr = new (PkgMgr(dt))()

        # load builtin packages:
        dtobj.internals.pkgmgr.definePackage(objectviewer(dt))
        dtobj.internals.pkgmgr.definePackage(ui(dt))
        dtobj.internals.pkgmgr.definePackage(shellUtils(dt))
        dtobj.internals.pkgmgr.definePackage(help(dt))

        # initialize UI when DOM is ready:
        $ -> 
            (dt 'o ui:init').value dtobj.config.init

        # Registers global reference
        window[config.global_ref] = dt
