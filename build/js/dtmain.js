
(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __slice = Array.prototype.slice;
  define('cmd',[], function() {
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
      add the following: 
          lib.commandLinkStr
  */  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  define('ui',[], function() {
    return function(dt) {
      var HistoryBrowser, UI, config, lib, pkg, session, ui;
      config = dt('v config');
      session = dt('v session');
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
        HistoryBrowser.prototype.forward = function() {
          this.pos++;
          if (this.pos >= session.history.length) {
            this.ui.resetEditorContents(this.editBuffer);
            return false;
          } else {
            this.ui.resetEditorContents(session.history[this.pos].coffee);
            return true;
          }
        };
        return HistoryBrowser;
      })();
      UI = (function() {
        function UI(editor_div_id) {
          this.editor_div_id = editor_div_id != null ? editor_div_id : "editor";
          this.format_command = __bind(this.format_command, this);
          this.resetEditorContents = __bind(this.resetEditorContents, this);
          this.insertText = __bind(this.insertText, this);
          this.update = __bind(this.update, this);
          this.updateTimeout = __bind(this.updateTimeout, this);
          this.init = __bind(this.init, this);
          this.editor = null;
          this.editor_div = document.getElementById(this.editor_div_id);
          this.coffee_source = "";
          this.js_source = "";
          this.timeoutHandle = null;
          this.UPDATE_DELAY = 300;
          this.historyBrowser = null;
        }
        UI.prototype.init = function(runAfterInit) {
          this.init_ace();
          this.init_ui();
          this.resetEditorContents();
          if (runAfterInit != null) {
            return runAfterInit(dt);
          }
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
                return lib.captureEvent(ev);
              }
            }, this)
          });
          bind({
            description: 'Execute contents of buffer.',
            keyCode: 13,
            shiftKey: false,
            action: __bind(function() {
              if (this.js_source.length > 0) {
                this.historyBrowser = null;
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
              var _ref;
              if (this.editor.getCursorPosition().row === 0) {
                                if ((_ref = this.historyBrowser) != null) {
                  _ref;
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
            action: __bind(function() {
              if ((this.historyBrowser != null) && this.editor.getCursorPosition().row === (this.editor.getSession().getValue().split('\n').length - 1)) {
                if (!this.historyBrowser.forward()) {
                  this.historyBrowser = null;
                }
                return true;
              } else {
                return false;
              }
            }, this)
          });
        };
        UI.prototype.init_ui = function() {
          return $('#menuhelp').click(__bind(function(ev) {
            lib.captureEvent(ev);
            lib.run('help');
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
            this.js_source = (_ref = (dt('v internals')).corelib.compile(this.coffee_source)) != null ? _ref.trim() : void 0;
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
          evalexpr = js_stmt != null ? js_stmt : (dt('v internals')).corelib.compile(coffee_stmt);
          exception = null;
          result = null;
          try {
            return result = window.eval(evalexpr.replace(/\n/g, "") + "\n");
          } catch (error) {
            return exception = error;
          } finally {
            rendered = null;
            try {
              rendered = exception != null ? this.formatEx(exception) : (dt('o objectViewer:show')).value(result);
            } catch (renderErr) {
              exception = renderErr;
              rendered = $('<div><h3>Error displaying value</h3></div>').append(this.formatEx(exception));
            }
            (dt('v session')).history.push({
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
        return UI;
      })();
      ui = new UI();
      lib = {
        captureEvent: function(ev) {
          ev.preventDefault();
          return ev.stopPropagation();
        },
        run: __bind(function(expr, silent) {
          var div;
          if (silent == null) {
            silent = false;
          }
          if (silent === false) {
            div = $("<div class='alert alert-info'></div>");
            div.text(expr);
            $("#interactions").append(div);
          }
          ui.execute(expr, null, true);
          return ui.scrollToBottom();
        }, this)
      };
      return pkg = {
        name: 'ui',
        attr: {
          description: 'The User Interface package of DuctTape. The lib object contains the API of the DuctTape GUI.',
          author: 'Peter Neumark',
          url: 'https://github.com/neumark/ducttape',
          version: '1.0'
        },
        value: {
          init: {
            attr: {
              description: 'Initialializes the DuctTape user interface.'
            },
            value: ui.init
          },
          insertText: {
            attr: {
              description: 'Inserts text in the the edit buffer.'
            },
            value: ui.insertText
          },
          setText: {
            attr: {
              description: 'Replaces the current edit buffer with the provided text'
            },
            value: ui.resetEditorContents
          },
          lib: {
            attr: {
              description: 'A library of useful functions for programming the DuctTape UI.'
            },
            value: lib
          }
        }
      };
    };
  });
}).call(this);

(function() {
  /*
      PkgMgr is organized around the concept of Values With Metadata (VWM).
      See corelib for details.
  
      Packages are VWM's, as are the objects contained within.
      Deeper in the object hierarchy there can be "plain old objects" as well.
  */  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __slice = Array.prototype.slice;
  define('pkgmgr',[], function() {
    return function(dt) {
      var Pkg, PkgMgr, VWM;
      VWM = (dt('v internals')).corelib.VWM;
      Pkg = (function() {
        __extends(Pkg, VWM);
        function Pkg(pkgSpec) {
          var key, obj, _ref;
          Pkg.__super__.constructor.call(this, pkgSpec);
          if (!this.hasAttributes(["author", "description", "url"])) {
            throw new Error("InvalidPackageSpecification");
          }
          _ref = this.value;
          for (key in _ref) {
            if (!__hasProp.call(_ref, key)) continue;
            obj = _ref[key];
            this.save(new VWM(key, obj));
          }
        }
        Pkg.prototype.save = function(vwm) {
          if (!vwm.hasAttributes(["description"])) {
            throw new Error("InvalidObjectSpecification");
          }
          this.value[vwm.name] = vwm;
          if (vwm.attr.makePublic === true) {
            dt[vwm.name] = this.value[vwm.name].value;
            return dt[vwm.name]['\u0111id'] = this.name + ':' + vwm.name;
          }
        };
        Pkg.prototype.load = function(name) {
          return this.value[name];
        };
        return Pkg;
      })();
      return PkgMgr = (function() {
        function PkgMgr(store) {
          this.store = store != null ? store : {};
          this.load = __bind(this.load, this);
          this.save = __bind(this.save, this);
        }
        PkgMgr.prototype.definePackage = function(pkgSpec) {
          var pkg;
          pkg = new Pkg(pkgSpec);
          if (this.store[pkg.name] != null) {
            throw new Error("PkgExists");
          }
          this.store[pkg.name] = pkg;
          return true;
        };
        PkgMgr.prototype.save = function() {
          var args, pkg;
          pkg = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
          return this.pkgDefinedGuard(pkg, function() {
            this.store[pkg].save(new VWM(args));
            return true;
          });
        };
        PkgMgr.prototype.load = function(pkg, name) {
          return this.pkgDefinedGuard(pkg, function() {
            return this.store[pkg].load(name);
          });
        };
        PkgMgr.prototype.pkgDefinedGuard = function(pkgName, fn) {
          if (!(this.store[pkgName] != null)) {
            throw new Error("UndefinedPackage");
          }
          return fn.call(this);
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
      var objectViewer_MAXSTRLEN, ov, pkg;
      objectViewer_MAXSTRLEN = 40;
      ov = {
        htmlEncode: function(str) {
          return jQuery('<div />').text(str).html();
        },
        showValue: function(val, container) {
          container = container != null ? container : $("<div class=\"eval_result\"></div>");
          if (((val != null ? val.jquery : void 0) != null) || (val instanceof HTMLElement)) {
            container.append(val);
          } else {
            try {
              container.text(ov.stringValue(val));
            } catch (e) {
              if ((e.message != null) && (e.message === "complexTypeError")) {
                container.append(ov.objectViewer(val));
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
                      _results.push(ov.stringValue(i));
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
          refname = "(" + (dt('config')).global_ref + " 'internals').pkgmgr.getFun('builtin', 'ov').body.cache[" + ov.objectViewer.cache.length + "]";
          ov.objectViewer.cache.push(obj);
          mk_node = function(key, value, visible) {
            var ret, value_str;
            if (visible == null) {
              visible = true;
            }
            value_str = null;
            try {
              value_str = ov.stringValue(value);
            } catch (e) {
              value_str = "Object of type " + (ov.objectType(value));
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
            if (ov.hasChildren(value)) {
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
      ov.objectViewer.cache = [];
      return pkg = {
        name: 'objectViewer',
        attr: {
          description: 'A collection of functions for displaying JavaScript values.',
          author: 'Peter Neumark',
          url: 'https://github.com/neumark/ducttape',
          version: '1.0'
        },
        value: {
          ov: {
            attr: {
              description: 'Object Viewer',
              makePublic: true
            },
            value: ov.objectViewer
          },
          show: {
            attr: {
              description: 'Show a JavaScript value, regardless of type.',
              makePublic: true
            },
            value: ov.showValue
          }
        }
      };
    };
  });
}).call(this);

(function() {
  var __slice = Array.prototype.slice;
  define('corelib',[], function() {
    var VWM;
    return {
      VWM: VWM = (function() {
        VWM.prototype.doc = "A VWM has 3 parts:\n- name              unique id (within namespace) - string\n- attr              attributes - object (dictionary)\n- value             the actual value - any truthy javascript value";
        function VWM() {
          var vwm, _ref;
          vwm = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          _ref = (function() {
            var _ref, _ref2, _ref3, _ref4, _ref5, _ref6;
            switch (vwm != null ? vwm.length : void 0) {
              case 1:
                if ((((_ref = vwm[0]) != null ? _ref.length : void 0) != null) === 3) {
                  return vwm[0];
                } else {
                  return [(_ref2 = vwm[0]) != null ? _ref2.name : void 0, (_ref3 = vwm[0]) != null ? _ref3.attr : void 0, (_ref4 = vwm[0]) != null ? _ref4.value : void 0];
                }
                break;
              case 2:
                return [vwm != null ? vwm[0] : void 0, vwm != null ? (_ref5 = vwm[1]) != null ? _ref5.attr : void 0 : void 0, vwm != null ? (_ref6 = vwm[1]) != null ? _ref6.value : void 0 : void 0];
              case 3:
                return vwm;
              default:
                return [];
            }
          })(), this.name = _ref[0], this.attr = _ref[1], this.value = _ref[2];
          if ((!(this.name != null)) || (!(this.attr != null)) || (!this.value)) {
            throw new Error("Bad OWM format");
          }
        }
        VWM.prototype.hasAttributes = function(attrList) {
          var f, missing;
          missing = (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = attrList.length; _i < _len; _i++) {
              f = attrList[_i];
              if (!(this.attr[f] != null)) {
                _results.push(f);
              }
            }
            return _results;
          }).call(this);
          return missing.length === 0;
        };
        return VWM;
      })(),
      compile: function(src) {
        if (src.length === 0) {
          return src;
        } else {
          return CoffeeScript.compile(src, {
            'bare': true
          });
        }
      }
    };
  });
}).call(this);

(function() {
  define('shellutils',[], function() {
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
          history: {
            attr: {
              description: 'Prints history of formerly executed commands.',
              makePublic: true
            },
            value: function() {
              var c, h, uiLib, _fn, _i, _len, _ref;
              uiLib = dt('o ui:lib');
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
          }
        }
      };
    };
  });
}).call(this);

(function() {
  var __slice = Array.prototype.slice;
  define('help',[], function() {
    return function(dt) {
      var pkg;
      return pkg = {
        name: 'help',
        attr: {
          description: {
            type: "html",
            data: "Contains the DuctTape help system. Use this package to add documentation for your own packages.<br />\nThe most important item in this package is the help command."
          },
          author: 'Peter Neumark',
          url: 'https://github.com/neumark/ducttape',
          version: '1.0'
        },
        value: {
          help: {
            attr: {
              description: 'Function implementing the help command.',
              makePublic: true
            },
            value: function() {
              var section;
              section = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
              return pkg.value.helpStore.value.main;
            }
          },
          helpStore: {
            attr: {
              description: 'Help contents stored in this object. Should be JSON.stringify-able.'
            },
            value: {
              main: "Main help section. To be updated."
            }
          }
        }
      };
    };
  });
}).call(this);

(function() {
  define('ducttape',['cmd', 'keybindings', 'ui', 'pkgmgr', 'objectviewer', 'corelib', 'shellutils', 'help'], function(Cmd, KeyBindings, ui, PkgMgr, objectviewer, corelib, shellUtils, help) {
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
        return (dt('o ui:init')).value(dtobj.config.init);
      });
      return window[config.global_ref] = dt;
    };
  });
}).call(this);

define('dtmain',["ducttape"], function(dt_init) {
    dt_init(window['ducttape_config'])
});
