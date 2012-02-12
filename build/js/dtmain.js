
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
  var __slice = Array.prototype.slice;
  define('ducttape',['cmd'], function(Cmd) {
    var badCommand, cmd, dtFun;
    cmd = new Cmd();
    badCommand = function() {
      return "No such command";
    };
    dtFun = function() {
      var argv, fn;
      argv = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (argv.length > 0) {
        fn = cmd.get(argv[0]);
        return (fn != null ? fn : badCommand)();
      }
    };
    dtFun.session = {
      history: [],
      config: {
        initial_buffer: "\u0111"
      }
    };
    dtFun.lib = {
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
    cmd.add('last', function() {
      return dtFun.session.history[dtFun.session.history.length - 1];
    });
    return dtFun;
  });
}).call(this);

(function() {
  var __hasProp = Object.prototype.hasOwnProperty, __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  };
  define('objectviewer',['ducttape'], function(dt) {
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
        refname = "\u0111.lib.ov.cache[" + dt.lib.ov.cache.length + "]";
        dt.lib.ov.cache.push(obj);
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
          return dt.ui.insertText(kl.length === 0 ? refname : "" + refname + "['" + (kl.join("']['")) + "']");
        });
        return object_viewer;
      }
    };
    dt.lib.ov = exports.objectViewer;
    dt.lib.ov.cache = [];
    return exports;
  });
}).call(this);

(function() {
  /* 
      TODO: disable ACE keyboard shortcuts
  */  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  define('ui',['ducttape', 'objectviewer'], function(dt, ov) {
    var UI, capture_event;
    dt.lib.capture_event = capture_event = function(ev) {
      ev.preventDefault();
      return ev.stopPropagation();
    };
    UI = (function() {
      function UI() {
        this.format_command = __bind(this.format_command, this);        dt.ui = this;
        this.editor = null;
        this.editor_div = document.getElementById("editor");
        this.coffee_source = "";
        this.js_source = "";
        this.init_ace();
        this.init_ui();
        this.reset_editor_contents();
      }
      UI.prototype.init_ace = function() {
        this.editor = ace.edit("editor");
        this.editor.getSession().setMode(new (ace.require("ace/mode/coffee").Mode)());
        this.editor.getSession().setTabSize(4);
        this.editor.getSession().setUseSoftTabs(true);
        this.editor.getSession().setUseWrapMode(false);
        this.editor.setHighlightActiveLine(true);
        this.editor.setShowPrintMargin(false);
        this.editor.renderer.setShowGutter(false);
        this.editor.renderer.setHScrollBarAlwaysVisible(false);
        this.editor.getSession().on("change", __bind(function(ev) {
          return this.update(ev);
        }, this));
        return this.editor.setKeyboardHandler({
          handleKeyboard: __bind(function(_1, _2, _3, keyCode, ev) {
            if (ev != null) {
              switch (ev.keyCode) {
                case 13:
                  if (ev.shiftKey === false) {
                    capture_event(ev);
                    if (this.js_source.length > 0) {
                      this.execute(this.coffee_source, this.js_source);
                      this.clear_src_buffers();
                      this.reset_editor_contents();
                      return this.scroll_to_bottom();
                    }
                  }
                  break;
                case 68:
                  if (ev.altKey === true) {
                    capture_event(ev);
                    return this.editor.insert('\u0111');
                  }
              }
            }
          }, this)
        });
      };
      UI.prototype.init_ui = function() {
        $('#editor_wrapper').height($('#editor').height());
        $('#editor_wrapper').width($('#editor').width());
        $('#parseerror').width($('#editor').width());
        return $('#menuhelp').click(__bind(function(ev) {
          capture_event(ev);
          this.run('help');
          return false;
        }, this));
      };
      UI.prototype.update = function(ev) {
        var _ref;
        this.coffee_source = this.editor.getSession().getValue().trim();
        try {
          this.js_source = (_ref = dt.lib.compile(this.coffee_source)) != null ? _ref.trim() : void 0;
          $("#ok").show();
          return $("#parseerror").hide();
        } catch (error) {
          this.js_source = "";
          $("#ok").hide();
          return $("#parseerror").show().text(error.message);
        }
      };
      UI.prototype.clear_src_buffers = function() {
        this.js_source = "";
        return this.coffee_source = "";
      };
      UI.prototype.insertText = function(text) {
        var currentValue;
        currentValue = this.editor.getSession().getValue();
        this.editor.getSession().setValue(currentValue === dt.session.config.initial_buffer ? text : currentValue + text);
        return this.scroll_to_bottom();
      };
      UI.prototype.reset_editor_contents = function() {
        this.editor.gotoLine(0);
        this.editor.getSession().setValue(dt.session.config.initial_buffer);
        return this.editor.moveCursorToPosition({
          column: 1,
          row: 0
        });
      };
      UI.prototype.scroll_to_bottom = function() {
        return $("html, body").animate({
          scrollTop: $(document).height()
        }, 200);
      };
      UI.prototype.formatEx = function(ex) {
        var _ref, _ref2;
        return $("<div class=\"eval_result\"><span class=\"label label-warning\"> <strong>Exception</strong> (" + ((_ref = ex != null ? ex.type : void 0) != null ? _ref : "") + ") </span>&nbsp;<strong>" + ((_ref2 = ex != null ? ex.message : void 0) != null ? _ref2 : "") + "</strong></div>");
      };
      UI.prototype.execute = function(coffee_stmt, js_stmt) {
        var evalexpr, exception, excpetion, rendered, result;
        evalexpr = js_stmt != null ? js_stmt : dt.lib.compile(coffee_stmt);
        excpetion = null;
        result = null;
        try {
          return result = window.eval(evalexpr.replace(/\n/g, "") + "\n");
        } catch (error) {
          return exception = error;
        } finally {
          rendered = null;
          try {
            rendered = exception != null ? this.formatEx(exception) : ov.showValue(result);
          } catch (renderErr) {
            exception = renderErr;
            rendered = $('<div><h3>Error displaying value</h3></div>').append(this.formatEx(exception));
          }
          dt.session.history.push({
            js: js_stmt,
            coffee: coffee_stmt,
            value: exception != null ? exception : result
          });
          $('#interactions').append(this.format_command());
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
      UI.prototype.run = function(expr) {
        this.execute(expr);
        return this.scroll_to_bottom();
      };
      return UI;
    })();
    return UI;
  });
}).call(this);

define('dtmain',["ducttape", "ui"], function(dt, ui) {
    // register DuckTape globally
    window["\u0111"] = dt;
    new ui();
});
