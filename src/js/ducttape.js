
/*
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
*/

(function() {

  define(['cmd', 'keybindings', 'ui', 'pkgmgr', 'objectviewer', 'fs', 'shellutils', 'help'], function(Cmd, KeyBindings, ui, PkgMgr, objectviewer, fs, shellUtils, help) {
    var DuctTape, dt, dtobj, _ref;
    DuctTape = (function() {

      function DuctTape(config) {
        var _base, _base2, _base3;
        this.config = config;
        if (this.config == null) this.config = {};
        if ((_base = this.config).globalRef == null) _base.globalRef = "\u0111";
        if ((_base2 = this.config).initial_buffer == null) {
          _base2.initial_buffer = "";
        }
        if ((_base3 = this.config).showGeneratedJS == null) {
          _base3.showGeneratedJS = false;
        }
        this.internals = {
          cmd: new (Cmd(this))()
        };
        this.session = {
          history: [],
          keybindings: new KeyBindings()
        };
      }

      return DuctTape;

    })();
    dtobj = new DuctTape((_ref = window.ducttape_config) != null ? _ref : {});
    dt = function() {
      return dtobj.internals.cmd.exec.apply(dtobj.cmd, arguments);
    };
    dtobj.internals.pkgmgr = new (PkgMgr(dt))();
    dtobj.internals.pkgmgr.pkgDef({
      name: 'core',
      attr: {
        author: 'Peter Neumark',
        url: 'https://github.com/neumark/ducttape',
        version: '1.0',
        description: 'DuctTape internals.'
      },
      value: {
        session: {
          attr: {
            description: "Reference to session object"
          },
          value: dtobj.session
        },
        config: {
          attr: {
            description: "Reference to config object"
          },
          value: dtobj.config
        },
        exec: {
          attr: {
            description: "Parse and execute a command"
          },
          value: dt
        }
      }
    });
    dtobj.internals.pkgmgr.pkgDef(objectviewer(dt));
    dtobj.internals.pkgmgr.pkgDef(ui(dt));
    dtobj.internals.pkgmgr.pkgDef(fs(dt));
    dtobj.internals.pkgmgr.pkgDef(shellUtils(dt));
    dtobj.internals.pkgmgr.pkgDef(help(dt));
    dt.toHTML = function() {
      return dt.pkgGet('help', 'help').value('intro');
    };
    window[dtobj.config.globalRef] = dt;
    return dt;
  });

}).call(this);
