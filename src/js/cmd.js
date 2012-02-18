(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __slice = Array.prototype.slice;
  define([], function() {
    return function(dtObj) {
      var Cmd, badCommand;
      badCommand = function(name) {
        return function() {
          return "No such command: " + name;
        };
      };
      return Cmd = (function() {
        function Cmd() {
          this.exec = __bind(this.exec, this);          this.cmdStore = {
            v: {
              attr: {
                description: "Get a DuctTape system variable."
              },
              value: function(varName) {
                if (varName in dtObj) {
                  return dtObj[varName];
                } else {
                  throw new Error("No such system variable: " + varName);
                }
              }
            },
            o: {
              attr: {
                description: "Get a DuctTape object from the package manager."
              },
              value: function(fullName) {
                var tmp;
                tmp = fullName.split(':');
                return dtObj.internals.pkgmgr.load(tmp[0], tmp[1]);
              }
            }
          };
        }
        Cmd.prototype.exec = function() {
          var args, command, fn, tmp, _ref;
          command = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
          if (command != null) {
            if (args.length === 0) {
              tmp = command.split(' ');
              command = tmp[0];
              args = tmp.slice(1);
            }
            fn = (_ref = this.cmdStore[command]) != null ? _ref.value : void 0;
            return (fn != null ? fn : badCommand(command)).apply(this, args);
          } else {
            return "DuctTape pre 0.001; Welcome!\n(TODO: redirect to help.)";
          }
        };
        return Cmd;
      })();
    };
  });
}).call(this);
