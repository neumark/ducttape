(function() {
  /* 
      TODO: disable ACE keyboard shortcuts
  */  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  define([], function() {
    return function(dt) {
      var UI;
      UI = (function() {
        UI.prototype.captureEvent = function(ev) {
          ev.preventDefault();
          return ev.stopPropagation();
        };
        function UI(editor_div_id) {
          this.editor_div_id = editor_div_id != null ? editor_div_id : "editor";
          this.format_command = __bind(this.format_command, this);
          this.editor = null;
          this.editor_div = document.getElementById(this.editor_div_id);
          this.coffee_source = "";
          this.js_source = "";
        }
        UI.prototype.init = function() {
          this.init_ace();
          this.init_ui();
          return this.reset_editor_contents();
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
          this.editor.getSession().on("change", __bind(function(ev) {
            return this.update(ev);
          }, this));
          bind = (dt('session')).keybindings.bind;
          trigger = (dt('session')).keybindings.trigger;
          this.editor.setKeyboardHandler({
            handleKeyboard: __bind(function(_1, _2, _3, _4, ev) {
              if ((ev != null) && trigger(ev)) {
                return this.captureEvent(ev);
              }
            }, this)
          });
          bind({
            keyCode: 13,
            shiftKey: false,
            action: __bind(function() {
              if (this.js_source.length > 0) {
                this.execute(this.coffee_source, this.js_source);
                this.clear_src_buffers();
                this.reset_editor_contents();
                this.scroll_to_bottom();
              }
              return true;
            }, this)
          });
          return bind({
            keyCode: 68,
            altKey: true,
            action: __bind(function() {
              this.editor.insert('\u0111');
              return true;
            }, this)
          });
        };
        UI.prototype.init_ui = function() {
          $('#editor_wrapper').height($('#editor').height());
          $('#editor_wrapper').width($('#editor').width());
          $('#parseerror').width($('#editor').width());
          return $('#menuhelp').click(__bind(function(ev) {
            captureEvent(ev);
            this.run('help');
            return false;
          }, this));
        };
        UI.prototype.update = function(ev) {
          var _ref;
          this.coffee_source = this.editor.getSession().getValue().trim();
          try {
            this.js_source = (_ref = (dt('internals')).pkgmgr.apply('builtin', 'compile', null, this.coffee_source)) != null ? _ref.trim() : void 0;
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
          this.editor.getSession().setValue(currentValue === (dt('config')).initial_buffer ? text : currentValue + text);
          return this.scroll_to_bottom();
        };
        UI.prototype.reset_editor_contents = function() {
          this.editor.gotoLine(0);
          this.editor.getSession().setValue((dt('config')).initial_buffer);
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
          return $("<div class=\"eval_result\"><span class=\"label label-warning\"> <strong>Exception</strong> (" + ((_ref = ex != null ? ex.type : void 0) != null ? _ref : "") + ") </span>&nbsp;<strong>" + ((_ref2 = ex != null ? ex.message : void 0) != null ? _ref2 : "") + "</strong>" + ((ex != null ? ex.stack : void 0) != null ? '<pre>' + ex.stack + '</pre>' : '') + "</div>");
        };
        UI.prototype.execute = function(coffee_stmt, js_stmt) {
          var evalexpr, exception, rendered, result;
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
    };
  });
}).call(this);
