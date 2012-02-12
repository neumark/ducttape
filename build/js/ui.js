(function() {
  /* 
      TODO: disable ACE keyboard shortcuts
  */  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  define(['ducttape', 'objectviewer'], function(dt, ov) {
    var UI, capture_event;
    capture_event = function(ev) {
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
        return $("<div class=\"eval_result\"><span class=\"label label-warning\"> <strong>Exception</strong> (" + ((_ref = ex.type) != null ? _ref : "") + ") </span>&nbsp;<strong>" + ((_ref2 = ex.message) != null ? _ref2 : "") + "</strong></div>");
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
            if (result != null) {
              rendered = ov.showValue(result);
            } else {
              rendered = this.formatEx(exception);
            }
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
