
(function() {
  define('cmd',[], function() {
    var Cmd;
    return Cmd = (function() {
      function Cmd(cmdStore) {
        var _ref;
        this.cmdStore = cmdStore;
                if ((_ref = this.cmdStore) != null) {
          _ref;
        } else {
          this.cmdStore = {};
        };
      }
      Cmd.prototype.add = function(cmd, fn) {
        return this.cmdStore[cmd] = fn;
      };
      Cmd.prototype.get = function(cmd) {
        return this.cmdStore[cmd];
      };
      return Cmd;
    })();
  });
}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty;
  define('keybindings',[], function() {
    var KeyBindings;
    return KeyBindings = (function() {
      function KeyBindings(store) {
        this.store = store != null ? store : {};
        this.trigger = __bind(this.trigger, this);
        this.bind = __bind(this.bind, this);
      }
      KeyBindings.prototype.bind = function(ev) {
        if (!((ev != null ? ev.keyCode : void 0) != null)) {
          throw new Error("keyCode of key event descriptor must be set");
        }
        if (!(this.store[ev.keyCode] != null)) {
          this.store[ev.keyCode] = [];
        }
        return this.store[ev.keyCode].push(ev);
      };
      KeyBindings.prototype.trigger = function(ev) {
        var attr, differences, i, l, val;
        if ((!((ev != null ? ev.keyCode : void 0) != null)) || (!(this.store[ev.keyCode] != null))) {
          return false;
        }
        l = this.store[ev.keyCode];
        i = 0;
        attr = null;
        while (i < l.length) {
          differences = (function() {
            var _ref, _results;
            _ref = l[i];
            _results = [];
            for (attr in _ref) {
              if (!__hasProp.call(_ref, attr)) continue;
              val = _ref[attr];
              if ((ev[attr] != null) && ev[attr] !== val) {
                _results.push(attr);
              }
            }
            return _results;
          })();
          if (differences.length === 0) {
            return l[i].action(ev);
          }
          i++;
        }
        return false;
      };
      return KeyBindings;
    })();
  });
}).call(this);

(function() {
  /* 
      TODO: disable ACE keyboard shortcuts
  */  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  define('ui',[], function() {
    return function(dt) {
      var HistoryBrowser, UI, config, session;
      config = dt('config');
      session = dt('session');
      HistoryBrowser = (function() {
        function HistoryBrowser(ui) {
          this.ui = ui;
          this.editBuffer = this.ui.editor.getSession().getValue();
          this.pos = null;
        }
        HistoryBrowser.prototype.back = function() {
          if (!(this.pos != null)) {
            this.pos = session.history.length;
          }
          if (this.pos > 0) {
            this.pos--;
          }
          return this.ui.resetEditorContents(session.history[this.pos].coffee);
        };
        return HistoryBrowser;
      })();
      UI = (function() {
        function UI(editor_div_id) {
          this.editor_div_id = editor_div_id != null ? editor_div_id : "editor";
          this.run = __bind(this.run, this);
          this.format_command = __bind(this.format_command, this);
          this.update = __bind(this.update, this);
          this.updateTimeout = __bind(this.updateTimeout, this);
          this.editor = null;
          this.editor_div = document.getElementById(this.editor_div_id);
          this.coffee_source = "";
          this.js_source = "";
          this.timeoutHandle = null;
          this.UPDATE_DELAY = 300;
          this.historyBrowser = null;
        }
        UI.prototype.captureEvent = function(ev) {
          ev.preventDefault();
          return ev.stopPropagation();
        };
        UI.prototype.init = function() {
          this.init_ace();
          this.init_ui();
          return this.resetEditorContents();
        };
        UI.prototype.init_ace = function() {
          var bind, trigger;
          this.editor = ace.edit(this.editor_div_id);
          this.editor.getSession().setMode(new (ace.require("ace/mode/coffee").Mode)());
          this.editor.getSession().setTabSize(4);
          this.editor.getSession().setUseSoftTabs(true);
          this.editor.getSession().setUseWrapMode(false);
          this.editor.setHighlightActiveLine(true);
          this.editor.setShowPrintMargin(false);
          this.editor.renderer.setShowGutter(false);
          this.editor.renderer.setHScrollBarAlwaysVisible(false);
          this.editor.getSession().on("change", this.updateTimeout);
          bind = session.keybindings.bind;
          trigger = session.keybindings.trigger;
          this.editor.setKeyboardHandler({
            handleKeyboard: __bind(function(_1, _2, _3, _4, ev) {
              if ((ev != null) && trigger(ev)) {
                return this.captureEvent(ev);
              }
            }, this)
          });
          bind({
            description: 'Execute contents of buffer.',
            keyCode: 13,
            shiftKey: false,
            action: __bind(function() {
              if (this.js_source.length > 0) {
                this.update();
                this.execute(this.coffee_source, this.js_source);
                this.clear_src_buffers();
                this.resetEditorContents();
                this.scrollToBottom();
              }
              return true;
            }, this)
          });
          bind({
            description: 'Insert DuctTape symbol (\u0111).',
            keyCode: 68,
            altKey: true,
            action: __bind(function() {
              this.editor.insert('\u0111');
              return true;
            }, this)
          });
          bind({
            description: 'Toggle generated javascript window.',
            keyCode: 113,
            action: __bind(function() {
              if (config.showGeneratedJS) {
                $('#jsSource').hide();
              } else {
                this.updateGeneratedJS();
                $('#jsSource').show();
                this.scrollToBottom();
              }
              config.showGeneratedJS = !config.showGeneratedJS;
              return true;
            }, this)
          });
          bind({
            description: 'Browse command history (previous).',
            keyCode: 38,
            action: __bind(function() {
              var x, y, _ref, _ref2;
              _ref = this.editor.getCursorPosition(), x = _ref.column, y = _ref.row;
              if ((x === 0) && (y === 0)) {
                                if ((_ref2 = this.historyBrowser) != null) {
                  _ref2;
                } else {
                  this.historyBrowser = new HistoryBrowser(this);
                };
                this.historyBrowser.back();
                return true;
              } else {
                return false;
              }
            }, this)
          });
          return bind({
            description: 'Browse command history (next).',
            keyCode: 40,
            action: __bind(function() {}, this)
          });
        };
        UI.prototype.init_ui = function() {
          return $('#menuhelp').click(__bind(function(ev) {
            captureEvent(ev);
            this.run('help');
            return false;
          }, this));
        };
        UI.prototype.updateGeneratedJS = function() {
          return $('#jsSource pre').text(this.js_source);
        };
        UI.prototype.updateTimeout = function() {
          if (this.timeoutHandle != null) {
            window.clearTimeout(this.timeoutHandle);
          }
          return this.timeoutHandle = setTimeout(this.update, this.UPDATE_DELAY);
        };
        UI.prototype.update = function() {
          var _ref;
          if (this.timeoutHandle != null) {
            window.clearTimeout(this.timeoutHandle);
          }
          this.timeoutHandle = null;
          this.coffee_source = this.editor.getSession().getValue().trim();
          try {
            this.js_source = (_ref = (dt('internals')).pkgmgr.apply('builtin', 'compile', null, this.coffee_source)) != null ? _ref.trim() : void 0;
            $("#ok").show();
            $("#parseerror").hide();
            if (config.showGeneratedJS) {
              return this.updateGeneratedJS();
            }
          } catch (error) {
            this.js_source = "";
            $("#ok").hide();
            $("#parseerror").show().text(error.message);
            return this.scrollToBottom();
          }
        };
        UI.prototype.clear_src_buffers = function() {
          this.js_source = "";
          return this.coffee_source = "";
        };
        UI.prototype.insertText = function(text) {
          var currentValue;
          currentValue = this.editor.getSession().getValue();
          this.editor.getSession().setValue(currentValue === (dt('config')).initial_buffer ? text : currentValue + text);
          return this.scrollToBottom();
        };
        UI.prototype.resetEditorContents = function(newContents) {
          var lines;
          if (newContents == null) {
            newContents = config.initial_buffer;
          }
          lines = newContents.split('\n');
          this.editor.gotoLine(0);
          this.editor.getSession().setValue(newContents);
          return this.editor.moveCursorToPosition({
            column: lines[lines.length - 1].length,
            row: lines.length - 1
          });
        };
        UI.prototype.scrollToBottom = function() {
          return $("html, body").animate({
            scrollTop: $(document).height()
          }, 200);
        };
        UI.prototype.formatEx = function(ex) {
          var _ref, _ref2;
          return $("<div class=\"eval_result\"><span class=\"label label-warning\"> <strong>Exception</strong> (" + ((_ref = ex != null ? ex.type : void 0) != null ? _ref : "") + ") </span>&nbsp;<strong>" + ((_ref2 = ex != null ? ex.message : void 0) != null ? _ref2 : "") + "</strong>" + ((ex != null ? ex.stack : void 0) != null ? '<pre>' + ex.stack + '</pre>' : '') + "</div>");
        };
        UI.prototype.execute = function(coffee_stmt, js_stmt, silent) {
          var evalexpr, exception, rendered, result;
          if (silent == null) {
            silent = false;
          }
          evalexpr = js_stmt != null ? js_stmt : (dt('internals')).pkgmgr.apply('builtin', 'compile', null, coffee_stmt);
          exception = null;
          result = null;
          try {
            return result = window.eval(evalexpr.replace(/\n/g, "") + "\n");
          } catch (error) {
            return exception = error;
          } finally {
            rendered = null;
            try {
              rendered = exception != null ? this.formatEx(exception) : (dt('internals')).pkgmgr.apply('builtin', 'show', null, result);
            } catch (renderErr) {
              exception = renderErr;
              rendered = $('<div><h3>Error displaying value</h3></div>').append(this.formatEx(exception));
            }
            (dt('session')).history.push({
              js: js_stmt,
              coffee: coffee_stmt,
              value: exception != null ? exception : result
            });
            if (silent === false) {
              $('#interactions').append(this.format_command);
            }
            $('#interactions').append(rendered);
          }
        };
        UI.prototype.format_command = function() {
          var div_inner, div_outer, lines;
          lines = $('div.ace_content', this.editor_div).find('div.ace_line').clone();
          div_inner = $("<div class='highlighted_expr ace_editor ace_text-layer'></div>");
          div_inner.append(lines);
          div_outer = $("<div class='" + (this.editor.getTheme().cssClass) + " alert alert-info'></div>");
          div_outer.append(div_inner);
          return div_outer;
        };
        UI.prototype.run = function(expr, silent) {
          var div;
          if (silent == null) {
            silent = false;
          }
          if (silent === false) {
            div = $("<div class='alert alert-info'></div>");
            div.text(expr);
            $("#interactions").append(div);
          }
          this.execute(expr, null, true);
          return this.scrollToBottom();
        };
        return UI;
      })();
      return UI;
    };
  });
}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __slice = Array.prototype.slice;
  define('pkgmgr',[], function() {
    return function(dt) {
      var Pkg, PkgMgr;
      Pkg = (function() {
        function Pkg(name, attributes) {
          this.name = name;
          this.attributes = attributes;
          this.funs = {};
        }
        Pkg.prototype.addFun = function(descriptor, body, export_fun) {
          var _ref, _ref2;
          if (export_fun == null) {
            export_fun = true;
          }
          if (!((descriptor != null ? descriptor.name : void 0) != null)) {
            throw new Error("InvalidFunctionDescriptor");
          }
          this.funs[descriptor.name] = {
            body: body,
            args: (_ref = descriptor.args) != null ? _ref : [],
            description: (_ref2 = descriptor.description) != null ? _ref2 : "No description provided"
          };
          this.funs[descriptor.name].body.descriptor = descriptor;
          if (export_fun === true) {
            return dt[descriptor.name] = this.funs[descriptor.name].body;
          }
        };
        Pkg.prototype.getFun = function(name) {
          if (!(this.funs[name] != null)) {
            throw new Error("UndefinedFunction");
          }
          return this.funs[name];
        };
        return Pkg;
      })();
      return PkgMgr = (function() {
        function PkgMgr(dt, store) {
          this.dt = dt;
          this.store = store != null ? store : {};
          this.apply = __bind(this.apply, this);
          this.getFun = __bind(this.getFun, this);
          this.addFun = __bind(this.addFun, this);
        }
        PkgMgr.prototype.pkgNameGuard = function(pkgName, fn) {
          if (!(this.store[pkgName] != null)) {
            throw new Error("UndefinedPackage");
          }
          return fn.call(this);
        };
        PkgMgr.prototype.def = function(name, descr) {
          if (descr == null) {
            descr = {};
          }
          this.store[name] = new Pkg(name, descr);
          return true;
        };
        PkgMgr.prototype.addFun = function() {
          var args, pkg;
          pkg = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
          return this.pkgNameGuard(pkg, function() {
            this.store[pkg].addFun.apply(this.store[pkg], args);
            return true;
          });
        };
        PkgMgr.prototype.getFun = function(pkg, funName) {
          return this.pkgNameGuard(pkg, function() {
            return this.store[pkg].getFun(funName);
          });
        };
        PkgMgr.prototype.apply = function() {
          var args, funName, pkg, that;
          pkg = arguments[0], funName = arguments[1], that = arguments[2], args = 4 <= arguments.length ? __slice.call(arguments, 3) : [];
          if (that == null) {
            that = this;
          }
          return this.getFun(pkg, funName).body.apply(that, args);
        };
        return PkgMgr;
      })();
    };
  });
}).call(this);

(function() {
  var __hasProp = Object.prototype.hasOwnProperty, __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  };
  define('objectviewer',[], function() {
    return function(dt) {
      var exports, objectViewer_MAXSTRLEN;
      objectViewer_MAXSTRLEN = 40;
      exports = {
        htmlEncode: function(str) {
          return jQuery('<div />').text(str).html();
        },
        showValue: function(val, container) {
          container = container != null ? container : $("<div class=\"eval_result\"></div>");
          if (((val != null ? val.jquery : void 0) != null) || (val instanceof HTMLElement)) {
            container.append(val);
          } else {
            try {
              container.text(exports.stringValue(val));
            } catch (e) {
              if ((e.message != null) && (e.message === "complexTypeError")) {
                container.append(exports.objectViewer(val));
              } else {
                throw e;
              }
            }
          }
          return container;
        },
        stringValue: function(val) {
          var i;
          switch (typeof val) {
            case "string":
              return '"' + val + '"';
            case "number":
            case "boolean":
            case "undefined":
            case "function":
              return val + "";
            case "object":
              if (val != null) {
                if (val.constructor === Array.prototype.constructor) {
                  return "[" + ((function() {
                    var _i, _len, _results;
                    _results = [];
                    for (_i = 0, _len = val.length; _i < _len; _i++) {
                      i = val[_i];
                      _results.push(exports.stringValue(i));
                    }
                    return _results;
                  })()).join(", ") + "]";
                } else if (val.toString !== Object.prototype.toString) {
                  return val.toString();
                } else {
                  throw new Error("complexTypeError");
                }
              } else {
                return "null";
              }
              break;
            default:
              return "(cannot display " + (typeof val) + ")";
          }
        },
        objectType: function(obj) {
          var n, _ref, _ref2;
          n = (_ref = obj != null ? (_ref2 = obj.constructor) != null ? _ref2.name : void 0 : void 0) != null ? _ref : 'Unknown';
          if ((n === "") && (obj != null ? obj.constructor : void 0) === $) {
            n = "jQuery";
          }
          return n;
        },
        hasChildren: function(obj) {
          return obj != null;
        },
        objectViewer: function(obj) {
          var get_children, get_node_data, mk_keylist, mk_node, object_viewer, refname;
          refname = "(" + (dt('config')).global_ref + " 'internals').pkgmgr.getFun('builtin', 'ov').body.cache[" + exports.objectViewer.cache.length + "]";
          exports.objectViewer.cache.push(obj);
          mk_node = function(key, value, visible) {
            var ret, value_str;
            if (visible == null) {
              visible = true;
            }
            value_str = null;
            try {
              value_str = exports.stringValue(value);
            } catch (e) {
              value_str = "Object of type " + (exports.objectType(value));
            }
            if (value_str.length > objectViewer_MAXSTRLEN) {
              value_str = value_str.substr(0, objectViewer_MAXSTRLEN) + "...";
            }
            ret = {
              data: {
                title: "<span class='objectViewer_" + (visible === true ? "" : "hidden") + "key'>" + key + "</span>: <span class='objectViewer_value'>" + value_str + "</span>",
                attr: {
                  object_key: key,
                  "class": 'objectViewer_item'
                }
              }
            };
            if (exports.hasChildren(value)) {
              ret.state = "closed";
              ret.children = [];
            }
            return ret;
          };
          get_children = function(parent) {
            var key, kl, visible, _i, _len, _results;
            kl = null;
            try {
              kl = Object.getOwnPropertyNames(parent);
            } catch (e) {
              if (!(typeof o !== "undefined" && o !== null)) {
                return [];
              }
              kl = (function() {
                var _results;
                _results = [];
                for (key in o) {
                  if (!__hasProp.call(o, key)) continue;
                  _results.push(key);
                }
                return _results;
              })();
            }
            if ((parent != null) && (parent['__proto__'] != null)) {
              kl.push('__proto__');
            }
            visible = Object.keys(parent);
            _results = [];
            for (_i = 0, _len = kl.length; _i < _len; _i++) {
              key = kl[_i];
              _results.push(mk_node(key, parent[key], __indexOf.call(visible, key) >= 0));
            }
            return _results;
          };
          mk_keylist = function(domnode) {
            var i;
            return ((function() {
              var _i, _len, _ref, _results;
              _ref = domnode.parents('li').children('a');
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                i = _ref[_i];
                if ($(i).attr('object_key') !== void 0) {
                  _results.push($(i).attr('object_key'));
                }
              }
              return _results;
            })()).reverse();
          };
          get_node_data = function(nodeid) {
            var k, keylist, node, nodedata;
            nodedata = null;
            if (nodeid === -1) {
              nodedata = mk_node('Object', obj);
              nodedata.state = "open";
              delete nodedata.data.attr.object_key;
              nodedata.children = get_children(obj);
            } else {
              keylist = mk_keylist(nodeid.children('a').first());
              node = obj;
              node = ((function() {
                var _i, _len, _results;
                _results = [];
                for (_i = 0, _len = keylist.length; _i < _len; _i++) {
                  k = keylist[_i];
                  _results.push((node = node[k]));
                }
                return _results;
              })())[keylist.length - 1];
              nodedata = get_children(node);
            }
            return nodedata;
          };
          object_viewer = $("<div class='eval_result'></div>");
          object_viewer.jstree({
            json_data: {
              data: function(nodeid, cb) {
                var nodedata;
                nodedata = get_node_data(nodeid);
                return cb(nodedata);
              }
            },
            core: {
              html_titles: true
            },
            plugins: ["themes", "json_data", "crrm"]
          });
          object_viewer.on('click', 'a.objectViewer_item', function(ev) {
            var kl;
            kl = mk_keylist($(ev.currentTarget));
            return (dt('internals')).ui.insertText(kl.length === 0 ? refname : "" + refname + "['" + (kl.join("']['")) + "']");
          });
          return object_viewer;
        }
      };
      exports.objectViewer.cache = [];
      return exports;
    };
  });
}).call(this);

(function() {
  var __slice = Array.prototype.slice;
  define('ducttape',['cmd', 'keybindings', 'ui', 'pkgmgr', 'objectviewer'], function(Cmd, KeyBindings, UI, PkgMgr, objectviewer) {
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

define('dtmain',["ducttape"], function(dt_init) {
    dt_init(window['ducttape_config'])
});
