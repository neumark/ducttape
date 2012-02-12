(function() {
  var __slice = Array.prototype.slice;
  define(['cmd', 'keybindings', 'ui', 'pkgmgr', 'objectviewer'], function(Cmd, KeyBindings, UI, PkgMgr, objectviewer) {
    return function(config) {
      var badCommand, dt, ov, specials, _ref, _ref2, _ref3;
      if (config == null) {
        config = {};
      }
            if (config != null) {
        config;
      } else {
        config = {};
      };
            if ((_ref = config.global_ref) != null) {
        _ref;
      } else {
        config.global_ref = "\u0111";
      };
            if ((_ref2 = config.initial_buffer) != null) {
        _ref2;
      } else {
        config.initial_buffer = config.global_ref;
      };
            if ((_ref3 = config.showGeneratedJS) != null) {
        _ref3;
      } else {
        config.showGeneratedJS = false;
      };
      dt = function() {
        return specials.internals.exec.apply(this, arguments);
      };
      specials = {
        config: config,
        internals: {},
        session: {
          history: []
        }
      };
      specials.internals.exec = function() {
        var args, command, fn;
        command = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        if (command != null) {
          if ((command in specials) && (args.length === 0)) {
            return specials[command];
          } else {
            fn = specials.internals.cmd.get(command);
            return (fn != null ? fn : badCommand(command)).apply(dt, args);
          }
        } else {
          return "DuctTape pre 0.001; Welcome!";
        }
      };
      specials.internals.cmd = new Cmd();
      specials.session.keybindings = new KeyBindings();
      specials.internals.pkgmgr = new (PkgMgr(dt))();
      specials.internals.ui = new (UI(dt))();
      ov = objectviewer(dt);
      specials.internals.pkgmgr.def("builtin", {
        description: "Contains stuff packaged with DuctTape.",
        author: "Peter Neumark",
        website: "http://peterneumark.com"
      });
      specials.internals.pkgmgr.addFun("builtin", {
        name: 'captureEvent',
        description: 'Prevents event bubbling',
        args: [
          {
            name: 'ev',
            description: 'JS event'
          }
        ]
      }, specials.internals.ui.captureEvent, false);
      specials.internals.pkgmgr.addFun("builtin", {
        name: 'last',
        description: 'Returns last evaluated command and the result'
      }, function() {
        return specials.session.history[specials.session.history.length - 1];
      });
      specials.internals.pkgmgr.addFun("builtin", {
        name: 'clear',
        description: 'Clears former interactions'
      }, function() {
        $('#interactions').children().remove();
        return "ok";
      });
      specials.internals.pkgmgr.addFun("builtin", {
        name: 'compile',
        args: [
          {
            name: 'src',
            description: 'CoffeeScript source'
          }
        ],
        description: 'Compiles CoffeeScript code to JavaScript.'
      }, function(src) {
        if (src.length === 0) {
          return src;
        } else {
          return CoffeeScript.compile(src, {
            'bare': true
          });
        }
      });
      specials.internals.pkgmgr.addFun("builtin", {
        name: 'stringValue',
        args: [
          {
            name: 'value',
            description: 'A JavaScript value to be converted to a string (if possible)'
          }
        ],
        description: 'Returns a string representation of the argument or throws and exception if not possible'
      }, ov.stringValue);
      specials.internals.pkgmgr.addFun("builtin", {
        name: 'ov',
        args: [
          {
            name: 'object',
            description: 'A JavaScript object to be displayed in a DOM element'
          }
        ],
        description: 'In objectviewer.coffee'
      }, ov.objectViewer);
      specials.internals.pkgmgr.addFun("builtin", {
        name: 'show',
        args: [
          {
            name: 'value',
            description: 'A JavaScript value to be displayed as a string or DOM element'
          }, {
            name: 'container',
            "default": null,
            description: 'A DOM container to use for rendering object tree (if necessary).'
          }
        ],
        description: 'In objectviewer.coffee'
      }, ov.showValue);
      specials.internals.pkgmgr.addFun("builtin", {
        name: 'run',
        args: [
          {
            name: 'expression',
            description: 'A CoffeeScript expression to be evaluated.'
          }, {
            name: 'container',
            "default": false,
            description: 'Set to true to show only the result of the expression.'
          }
        ],
        description: 'Run a coffeescript expression.'
      }, specials.internals.ui.run);
      specials.internals.pkgmgr.addFun("builtin", {
        name: 'history',
        description: 'Lists previous expressions'
      }, function() {
        var c, h, _fn, _i, _len, _ref4;
        c = $('<div class="eval_result"></div>');
        _ref4 = specials.session.history;
        _fn = function(h) {
          return c.append($("<span><a style='display:block;' href='#'>" + h.coffee + "</a></span>").find('a').click(function(ev) {
            specials.internals.ui.captureEvent(ev);
            return dt.run(h.coffee);
          }));
        };
        for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
          h = _ref4[_i];
          _fn(h);
        }
        return c;
      });
      $(function() {
        return specials.internals.ui.init();
      });
      badCommand = function(name) {
        return function() {
          return "No such command: '" + name + "'";
        };
      };
      window[config.global_ref] = dt;
      if ((config.init != null) && (typeof config.init === "function")) {
        config.init(dt);
      }
      return dt;
    };
  });
}).call(this);
