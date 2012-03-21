
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

   cmd.coffee - The DuctTape command interpreter.
*/

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __slice = Array.prototype.slice;

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
          var args, command, fn, ret, tmp, _ref;
          command = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
          if ((command != null) && ("string" === typeof command)) {
            if (args.length === 0) {
              tmp = command.split(' ');
              command = tmp[0];
              args = tmp.slice(1);
            }
            fn = (_ref = this.cmdStore[command]) != null ? _ref.value : void 0;
            return (fn != null ? fn : badCommand(command)).apply(this, args);
          } else {
            return ret = "Sorry, can't help you with that! No action registered for value '" + command + "'!";
          }
        };

        return Cmd;

      })();
    };
  });

}).call(this);
