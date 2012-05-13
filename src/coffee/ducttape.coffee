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

define [
    'corelib',
    'keybindings'
    'ui'
    'pkgmgr'
    'objectviewer'
    'fs'
    'shellutils'
    'help'
    'dtview'
    ], (corelib, KeyBindings, ui, PkgMgr, objectviewer, fs, shellUtils, help, dtview) ->
        class DuctTape
            constructor: (@config) ->
                # sanitize configuration:
                @config ?= {}
                @config.globalRef ?= "\u0110"
                @config.initial_buffer ?= ""
                @config.showGeneratedJS ?= false
                # fields:
                @internals = 
                    corelib: corelib
                    mainFun: -> true 
                @session =
                    history: []
                    keybindings: new KeyBindings()

        # instantiate our DuctTape class
        dtobj = new DuctTape(window.ducttape_config ? {})

        # main DuctTape function
        dt = -> dtobj.internals.mainFun.apply dt, arguments
        dtobj.internals.pkgmgr = new (PkgMgr(dt))()

        # load builtin packages:
        dtobj.internals.pkgmgr.pkgDef
            name: 'core'
            attr:
                author: 'Peter Neumark'
                url: 'https://github.com/neumark/ducttape'
                version: '1.0'
                description: 'DuctTape internals.'
            value:
                session:
                    attr:
                        description: "Reference to session object"
                    value: dtobj.session 
                config:
                    attr:
                        description: "Reference to config object"
                    value: dtobj.config
                internals:
                    attr:
                        description: "Reference to internals object"
                    value: dtobj.internals
                corelib:
                    attr:
                        description: "Reference to core library (corelib)"
                        makePublic: true
                    value: dtobj.internals.corelib
                exec:
                    attr:
                        description: "Parse and execute a command"
                    value: dt
                symbol:
                    attr:
                        description: 'Returns global name of DuctTape function.'
                        makePublic: true
                    value: -> dtobj.config.globalRef + ''

        dtobj.internals.pkgmgr.pkgDef objectviewer dt
        dtobj.internals.pkgmgr.pkgDef ui dt
        dtobj.internals.pkgmgr.pkgDef fs dt
        dtobj.internals.pkgmgr.pkgDef shellUtils dt
        dtobj.internals.pkgmgr.pkgDef help dt

        dt.toHTML = -> dt.pkgGet('help', 'help').value 'intro'
        dtobj.internals.mainFun = (expr) -> dt.pkgGet('fs','lib').value.eval expr

        # Registers global reference
        window[dtobj.config.globalRef] = dt

        # Add presentation methods from dtview
        dtview dt
        dt
