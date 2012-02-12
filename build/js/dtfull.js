
(function() {
  define('ducttape',[], function() {
    var DuctTape;
    DuctTape = (function() {
      function DuctTape() {
        this.session = {
          history: [],
          config: {
            initial_buffer: "\u0111"
          }
        };
      }
      DuctTape.prototype.compile = function(src) {
        if (src.length === 0) {
          return src;
        } else {
          return CoffeeScript.compile(src, {
            'bare': true
          });
        }
      };
      return DuctTape;
    })();
    return new DuckTape();
  });
}).call(this);

(function() {
  var __hasProp = Object.prototype.hasOwnProperty, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  define('objectviewer',['ducttape'], function(dt) {
    var exports;
    exports = {
      showValue: function(val, container) {
        container = container != null ? container : $("<div class=\"eval_result\"></div>");
        if (val instanceof HTMLElement) {
          container.append(val);
        } else {
          try {
            container.text(exports.stringValue(val));
          } catch (e) {
            if ((e.type != null) === "complexTypeError") {
              container.append(exports.objectViewer(val));
            } else {
              container.text("(error converting value to string)");
            }
          }
        }
        return container;
      },
      simpleValue: function(val) {
        switch (typeof val) {
          case "string":
          case "number":
          case "boolean":
          case "undefined":
            return val + "";
          case "object":
            if (val.toString !== Object.prototype.toString) {
              return val.toString();
            } else {
              throw new Error("complexTypeError");
            }
            break;
          default:
            return "(cannot display " + (typeof val) + ")";
        }
      },
      objectViewer: function(obj) {
        var get_children, get_node_data, mk_node, object_viewer;
        mk_node = function(key, value) {
          return {
            data: {
              title: key,
              attr: {
                object_key: key
              }
            },
            state: "closed",
            children: []
          };
        };
        get_children = function(parent) {
          var key, kl, _i, _len, _results;
          kl = (function() {
            var _results;
            _results = [];
            for (key in parent) {
              if (!__hasProp.call(parent, key)) continue;
              _results.push(key);
            }
            return _results;
          })();
          if ((parent != null) && '__proto__' in parent) {
            kl.push('__proto__');
          }
          _results = [];
          for (_i = 0, _len = kl.length; _i < _len; _i++) {
            key = kl[_i];
            _results.push(mk_node(key, parent[key]));
          }
          return _results;
        };
        get_node_data = function(nodeid) {
          var i, k, keylist, node, nodedata;
          if (nodeid === -1) {
            return {
              data: {
                title: "Object"
              },
              state: "open",
              children: get_children(obj)
            };
          } else {
            keylist = (function() {
              var _i, _len, _ref, _results;
              _ref = nodeid.parents('li');
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                i = _ref[_i];
                if ($(i).attr('object_key') !== void 0) {
                  _results.push($(i).attr('object_key'));
                }
              }
              return _results;
            })();
            keylist.push(nodeid.find('a').attr('object_key'));
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
            nodedata = mk_node(keylist[keylist.length - 1], node);
            return nodedata.children = get_children(node);
          }
        };
        object_viewer = $("<div class='eval_result'></div>");
        object_viewer.jstree({
          json_data: {
            data: function(nodeid, cb) {
              var nodedata;
              nodedata = get_node_data(nodeid);
              console.dir(nodedata);
              return cb(nodedata);
            }
          },
          plugins: ["themes", "json_data", "crrm"],
          html_titles: true
        });
        return object_viewer;
      },
      format_command: __bind(function() {
        var div_inner, div_outer, lines;
        lines = $('div.ace_content', this.editor_div).find('div.ace_line').clone();
        div_inner = $("<div class='highlighted_expr ace_editor ace_text-layer'></div>");
        div_inner.append(lines);
        div_outer = $("<div class='" + (this.editor.getTheme().cssClass) + " alert alert-info'></div>");
        div_outer.append(div_inner);
        return div_outer;
      }, this)
    };
    return exports;
  });
}).call(this);

(function() {
  /* 
      TODO: disable ACE keyboard shortcuts
  */  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  define('ui',['ducttape', 'objectviewer'], function(dt, ov) {
    var UI, capture_event;
    capture_event = function(ev) {
      ev.preventDefault();
      return ev.stopPropagation();
    };
    UI = (function() {
      function UI() {
        dt.ui = this;
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
        this.editor.getSession().setMode(new (require("ace/mode/coffee").Mode)());
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
          this.js_source = (_ref = dt.compile(this.coffee_source)) != null ? _ref.trim() : void 0;
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
      UI.prototype.reset_editor_contents = function() {
        this.editor.gotoLine(0);
        this.editor.getSession().setValue(this.session.config.initial_buffer);
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
        return $("<div class=\"eval_result\"><span class=\"label label-warning\"> <strong>Exception</strong> (" + ((_ref = ex.type) != null ? _ref : "") + ") </span>&nbsp;<strong>" + ((_ref2 = ex.message) != null ? _ref2 : "") + "</strong></div>");
      };
      UI.prototype.execute = function(coffee_stmt, js_stmt) {
        var evalexpr, exception, excpetion, rendered, result;
        evalexpr = js_stmt != null ? js_stmt : dt.compile(coffee_stmt);
        excpetion = null;
        result = null;
        try {
          return result = window.eval(evalexpr.replace(/\n/g, "") + "\n");
        } catch (error) {
          return exception = error;
        } finally {
          rendered = null;
          try {
            if (typeof result === "function" ? result(rendered = ov.showValue(result)) : void 0) {} else {
              rendered = this.formatEx(exception);
            }
          } catch (renderErr) {
            rendered = $('<div><h3>Error displaying value</h3></div>').append(this.formatEx(renderErr));
          }
          $('#interactions').append(this.format_command());
          $('#interactions').append(rendered);
        }
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

define('dtfull',["ducttape", "ui"], function(dt, ui) {
    // register DuckTape globally
    window["\u0111"] = dt;
    new ui();
});
