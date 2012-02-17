(function() {
  define(['cmd', 'keybindings', 'ui', 'pkgmgr', 'objectviewer', 'corelib', 'shellutils', 'help'], function(Cmd, KeyBindings, ui, PkgMgr, objectviewer, corelib, shellUtils, help) {
    return function(config) {
      var DuctTape, dt, dtobj;
      DuctTape = (function() {
        function DuctTape(config) {
          var _base, _base2, _base3, _ref, _ref2, _ref3, _ref4;
          this.config = config != null ? config : {};
                    if ((_ref = this.config) != null) {
            _ref;
          } else {
            this.config = {};
          };
                    if ((_ref2 = (_base = this.config).global_ref) != null) {
            _ref2;
          } else {
            _base.global_ref = "\u0111";
          };
                    if ((_ref3 = (_base2 = this.config).initial_buffer) != null) {
            _ref3;
          } else {
            _base2.initial_buffer = config.global_ref;
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
      dtobj = new DuctTape(config);
      dt = dtobj.exec = function() {
        return dtobj.internals.cmd.exec.apply(dtobj.cmd, arguments);
      };
      dt.toHTML = function() {
        return $("<span>TODO: run help function</span>");
      };
      dtobj.internals.pkgmgr = new (PkgMgr(dt))();
      dtobj.internals.pkgmgr.definePackage(objectviewer(dt));
      dtobj.internals.pkgmgr.definePackage(ui(dt));
      dtobj.internals.pkgmgr.definePackage(shellUtils(dt));
      dtobj.internals.pkgmgr.definePackage(help(dt));
      $(function() {
        return (dt('o ui:init'))(dtObj.config.init);
      });
      return window[config.global_ref] = dt;
    };
  });
}).call(this);
