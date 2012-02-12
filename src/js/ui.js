(function() {
  /* 
      TODO: disable ACE keyboard shortcuts
  */  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  define([], function() {
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
          console.log(this.pos);
          return this.ui.resetEditorContents(session.history[this.pos].coffee);
        };
        HistoryBrowser.prototype.forward = function() {
          this.pos++;
          if (this.pos >= session.history.length) {
            this.ui.resetEditorContents(this.editBuffer);
            return false;
          } else {
            this.ui.resetEditorContents(session.history[this.pos].coffee);
            console.log(this.pos);
            return true;
          }
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
                  console.log("historyBrowser dtor");
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
