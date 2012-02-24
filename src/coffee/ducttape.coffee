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

   ducttape.coffee - main source file, defines the ducttape function.

###

define ['cmd', 'keybindings', 'ui', 'pkgmgr', 'objectviewer', 'fs', 'shellutils', 'help'], (Cmd, KeyBindings, ui, PkgMgr, objectviewer, fs, shellUtils, help) ->
    class DuctTape
        constructor: (@config) ->
            # sanitize configuration:
            @config ?= {}
            @config.globalRef ?= "\u0111"
            @config.initial_buffer ?= ""
            @config.showGeneratedJS ?= false
            # fields:
            @internals =
                cmd: new (Cmd(@))()
            @session =
                history: []
                keybindings: new KeyBindings()

    # instantiate our DuctTape class
    dtobj = new DuctTape(window.ducttape_config ? {})

    # main DuctTape function
    dt = dtobj.exec = -> dtobj.internals.cmd.exec.apply dtobj.cmd, arguments

    dtobj.internals.pkgmgr = new (PkgMgr(dt))()

    # load builtin packages:
    dtobj.internals.pkgmgr.definePackage(objectviewer(dt))
    dtobj.internals.pkgmgr.definePackage(ui(dt))
    dtobj.internals.pkgmgr.definePackage(fs(dt))
    dtobj.internals.pkgmgr.definePackage(shellUtils(dt))
    dtobj.internals.pkgmgr.definePackage(help(dt))

    dt.toHTML = -> (dt 'o help:help').value 'intro'

    # Registers global reference
    window[dtobj.config.globalRef] = dt

    dt

