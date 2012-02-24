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
  
     ui.coffee - The DuctTape UI.
  
  */  var __slice = Array.prototype.slice, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  define(['corelib'], function(corelib) {
    return function(dt) {
      var HistoryBrowser, UI, config, lib, pkg, session, show, ui;
      config = dt('v config');
      session = dt('v session');
      show = (dt('o objectViewer:show')).value;
      corelib.Promise.prototype.toHTML = function() {
        var div, replaceContents;
        div = $('<div class="eval_result"><span>loading...<span></div>');
        replaceContents = __bind(function() {
          var values;
          values = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          div.children().remove();
          if (values.length === 0) {
            values = values[0];
          }
          return ui.display(values, false, div);
        }, this);
        if (this.value != null) {
          replaceContents(this.value);
        } else {
          this.on("success failure", __bind(function() {
            return replaceContents(this.value);
          }, this));
        }
        return div;
      };
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
          this.display = __bind(this.display, this);
          this.scrollToBottom = __bind(this.scrollToBottom, this);
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
        UI.prototype.init = function() {
          if (this.editor != null) {
            return false;
          }
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
            lib.run("(" + (dt.symbol()) + " 'o help:help').value()");
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
            this.js_source = (_ref = corelib.compile(this.coffee_source)) != null ? _ref.trim() : void 0;
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
          var currentValue, cursor;
          cursor = this.editor.getCursorPosition();
          cursor.column += text.length;
          currentValue = this.editor.getSession().getValue();
          this.editor.getSession().setValue(currentValue === (dt('config')).initial_buffer ? text : currentValue + text);
          this.scrollToBottom();
          return this.editor.moveCursorToPosition(cursor);
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
          $("html, body").animate({
            scrollTop: $(document).height()
          }, 200);
          return $('textarea', this.editor_div).focus();
        };
        UI.prototype.formatEx = function(ex) {
          var _ref, _ref2;
          return $("<div class=\"eval_result\"><span class=\"label label-warning\"> <strong>Exception</strong> (" + ((_ref = ex != null ? ex.type : void 0) != null ? _ref : "") + ") </span>&nbsp;<strong>" + ((_ref2 = ex != null ? ex.message : void 0) != null ? _ref2 : "") + "</strong>" + ((ex != null ? ex.stack : void 0) != null ? '<pre>' + ex.stack + '</pre>' : '') + "</div>");
        };
        UI.prototype.detach = function(content) {
          var msg, oldParent, _ref;
          if (((_ref = content.parents().last()) != null ? _ref[0] : void 0) instanceof HTMLHtmlElement) {
            oldParent = content.parents().first();
            msg = $("<div class='eval_result'><h2>This content has been moved!</h2>Sorry, it seems the content that used to be here is now somewhere else. No worries, though, <a href='#'>you can always get it back</a>.</div>");
            msg.find('a').click(__bind(function(ev) {
              lib.captureEvent(ev);
              this.detach(content);
              content.appendTo(oldParent);
              return msg.detach();
            }, this));
            content.detach();
            msg.appendTo(oldParent);
          }
          return content;
        };
        UI.prototype.display = function(expr, where, decorator) {
          var div;
          if (where == null) {
            where = $('#interactions');
          }
          if (decorator == null) {
            decorator = $('<div class="eval_result"></div>');
          }
          div = decorator.append(this.detach(show(expr)));
          if (typeof where === "object") {
            where.append(div);
          }
          return null;
        };
        UI.prototype.execute = function(coffee_stmt, js_stmt, silent) {
          var evalexpr, exception, historyEntry, result;
          if (silent == null) {
            silent = false;
          }
          evalexpr = js_stmt != null ? js_stmt : corelib.compile(coffee_stmt);
          exception = null;
          result = null;
          try {
            return result = corelib.execJS(evalexpr);
          } catch (error) {
            return exception = error;
          } finally {
            (dt('v session')).history.push(historyEntry = {
              js: js_stmt,
              coffee: coffee_stmt,
              value: exception != null ? exception : result,
              timestamp: new Date()
            });
            if (silent === false) {
              $('#interactions').append(this.format_command);
            }
            if ((result !== null) || (exception !== null)) {
              this.display((function() {
                try {
                  if (exception != null) {
                    return this.formatEx(exception);
                  } else {
                    return result;
                  }
                } catch (renderEx) {
                  historyEntry.renderEx = renderEx;
                  return $('<div><h3>Error displaying value</h3></div>').append(this.formatEx(renderEx));
                }
              }).call(this));
            }
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
        run: function(expr, silent) {
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
        },
        asyncValue: function(loadingMsg) {
          var div;
          if (loadingMsg == null) {
            loadingMsg = 'loading...';
          }
          div = $('<div class="eval_result"></div>');
          ui.display(loadingMsg, $('#interactions'), div);
          return function() {
            var values;
            values = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
            div.children().remove();
            if (values.length === 0) {
              values = values[0];
            }
            return ui.display(values, false, div);
          };
        }
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
              description: 'Initialializes the DuctTape user interface.',
              makePublic: true
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
          },
          display: {
            attr: {
              description: 'Displays the result of an expression in the interactions window.',
              makePublic: true
            },
            value: ui.display
          }
        }
      };
    };
  });
}).call(this);
