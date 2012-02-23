(function() {
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
  
  */  define(['cmd', 'keybindings', 'ui', 'pkgmgr', 'objectviewer', 'corelib', 'fs', 'shellutils', 'help'], function(Cmd, KeyBindings, ui, PkgMgr, objectviewer, corelib, fs, shellUtils, help) {
    var DuctTape, dt, dtobj, _ref;
    DuctTape = (function() {
      function DuctTape(config) {
        var _base, _base2, _base3, _ref, _ref2, _ref3, _ref4;
        this.config = config;
                if ((_ref = this.config) != null) {
          _ref;
        } else {
          this.config = {};
        };
                if ((_ref2 = (_base = this.config).globalRef) != null) {
          _ref2;
        } else {
          _base.globalRef = "\u0111";
        };
                if ((_ref3 = (_base2 = this.config).initial_buffer) != null) {
          _ref3;
        } else {
          _base2.initial_buffer = "";
        };
                if ((_ref4 = (_base3 = this.config).showGeneratedJS) != null) {
          _ref4;
        } else {
          _base3.showGeneratedJS = false;
        };
        this.internals = {
          cmd: new (Cmd(this))(),
          corelib: corelib
        };
        this.session = {
          history: [],
          keybindings: new KeyBindings()
        };
      }
      return DuctTape;
    })();
    dtobj = new DuctTape((_ref = window.ducttape_config) != null ? _ref : {});
    dt = dtobj.exec = function() {
      return dtobj.internals.cmd.exec.apply(dtobj.cmd, arguments);
    };
    dtobj.internals.pkgmgr = new (PkgMgr(dt))();
    dtobj.internals.pkgmgr.definePackage(objectviewer(dt));
    dtobj.internals.pkgmgr.definePackage(ui(dt));
    dtobj.internals.pkgmgr.definePackage(fs(dt));
    dtobj.internals.pkgmgr.definePackage(shellUtils(dt));
    dtobj.internals.pkgmgr.definePackage(help(dt));
    dt.toHTML = function() {
      return (dt('o help:help')).value('intro');
    };
    window[dtobj.config.globalRef] = dt;
    return dt;
  });
}).call(this);
