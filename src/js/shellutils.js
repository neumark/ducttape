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
  
     shellutils.coffee - "shell utility functions", to make the DuctTape
     command more convenient for users.
  
  */  var __slice = Array.prototype.slice;
  define([], function() {
    return function(dt) {
      var pkg;
      return pkg = {
        name: 'shellUtils',
        attr: {
          description: 'Utilities functions to make DuctTape more shell-like.',
          author: 'Peter Neumark',
          url: 'https://github.com/neumark/ducttape',
          version: '1.0'
        },
        value: {
          last: {
            attr: {
              description: 'Displays the last executed command and result.',
              makePublic: true
            },
            value: function() {
              var h;
              h = (dt('v session')).history;
              if (h.length > 0) {
                return h[h.length - 1];
              } else {
                return "This is the first command.";
              }
            }
          },
          clear: {
            attr: {
              description: 'Clears prior interactions from the display.',
              makePublic: true
            },
            value: function() {
              $('#interactions').children().remove();
              return null;
            }
          },
          symbol: {
            attr: {
              description: 'Returns global name of DuctTape function.',
              makePublic: true
            },
            value: function() {
              return (dt('v config')).globalRef + '';
            }
          },
          history: {
            attr: {
              description: 'Prints history of formerly executed commands.',
              makePublic: true
            },
            value: function() {
              var c, h, uiLib, _fn, _i, _len, _ref;
              uiLib = (dt('o ui:lib')).value;
              c = $('<div class="eval_result"></div>');
              _ref = (dt('v session')).history;
              _fn = function(h) {
                return c.append($("<span><a style='display:block;' href='#'>" + h.coffee + "</a></span>").find('a').click(function(ev) {
                  uiLib.captureEvent(ev);
                  return uiLib.run(h.coffee);
                }));
              };
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                h = _ref[_i];
                _fn(h);
              }
              return c;
            }
          },
          setvar: {
            attr: {
              description: 'Sets window.varName to the given value.',
              makePublic: true
            },
            value: function(name, value) {
              return window[name] = value;
            }
          },
          curry: {
            attr: {
              description: 'Curries functions, setting this to window'
            },
            value: function() {
              var args, fun;
              fun = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
              return function() {
                var laterArgs;
                laterArgs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
                return function() {
                  var laterArgs;
                  laterArgs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
                  return fun.apply(window, args.concat(laterArgs));
                };
              };
            }
          },
          lib: {
            attr: {
              description: 'Library of functions useful for command-line programs'
            },
            value: {
              log: function(expr, source, level) {
                if (source == null) {
                  source = '';
                }
                if (level == null) {
                  level = 'info';
                }
                return (dt('o ui:display')).value(expr);
              }
            }
          }
        }
      };
    };
  });
}).call(this);
