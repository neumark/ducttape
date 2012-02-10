(function() {
  var DuctTape;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  DuctTape = (function() {
    function DuctTape() {
      this.session = {
        history: [],
        last_exception: null,
        last_result: null,
        last_evaluated_js: null
      };
      this.editor = 0;
      this.coffee_source = "";
      this.js_source = "";
      this.eval_context = {};
      this.init_ace();
      this.init_ui();
      this.update();
    }
    DuctTape.prototype.init_ace = function() {
      this.editor = ace.edit("editor");
      this.editor.getSession().setMode(new (require("ace/mode/coffee").Mode)());
      this.editor.getSession().setTabSize(4);
      this.editor.getSession().setUseSoftTabs(true);
      this.editor.getSession().setUseWrapMode(false);
      this.editor.setHighlightActiveLine(true);
      this.editor.setShowPrintMargin(false);
      this.editor.renderer.setShowGutter(false);
      this.editor.renderer.setHScrollBarAlwaysVisible(false);
      this.editor.getSession().on("change", __bind(function() {
        return this.update();
      }, this));
      return this.editor.setKeyboardHandler({
        handleKeyboard: __bind(function(_1, _2, _3, keyCode, modifiers) {
          if (keyCode === 13 && !((modifiers != null ? modifiers.shiftKey : void 0) === true)) {
            if (this.js_source.length > 0) {
              this.execute(this.coffee_source, this.js_source);
              this.clear_src_buffers();
              this.reset_editor_contents();
              return this.scroll_to_bottom();
            }
          }
        }, this)
      });
    };
    DuctTape.prototype.init_ui = function() {
      $('#editor_wrapper').height($('#editor').height());
      $('#editor_wrapper').width($('#editor').width());
      $('#parseerror').width($('#editor').width());
      return $('#menuhelp').click(__bind(function() {
        this.run('help');
        return false;
      }, this));
    };
    DuctTape.prototype.compile = function(src) {
      if (src.length === 0) {
        return src;
      } else {
        return CoffeeScript.compile(src, {
          'bare': true
        });
      }
    };
    DuctTape.prototype.update = function() {
      var _ref;
      this.coffee_source = this.editor.getSession().getValue().trim();
      try {
        this.js_source = (_ref = this.compile(this.coffee_source)) != null ? _ref.trim() : void 0;
        $("#ok").show();
        return $("#parseerror").hide();
      } catch (error) {
        this.js_source = "";
        $("#ok").hide();
        return $("#parseerror").show().text(error.message);
      }
    };
    DuctTape.prototype.format_ex = function(ex) {
      var _ref, _ref2;
      return $("<div class=\"eval_result\"><span class=\"label-warning\"> <strong>Exception</strong> (" + ((_ref = ex.type) != null ? _ref : "") + ") </span>&nbsp;<strong>" + ((_ref2 = ex.message) != null ? _ref2 : "") + "</strong></div>");
    };
    DuctTape.prototype.format_retval = function(val) {
      if (val instanceof HTMLElement) {
        return val;
      } else {
        return $("<div class=\"eval_result\">" + val + "</div>");
      }
    };
    DuctTape.prototype.clear_src_buffers = function() {
      this.js_source = "";
      return this.coffee_source = "";
    };
    DuctTape.prototype.reset_editor_contents = function() {
      this.editor.getSession().setValue("");
      this.editor.moveCursorToPosition({
        column: 0,
        row: 0
      });
      return this.editor.gotoLine(0);
    };
    DuctTape.prototype.scroll_to_bottom = function() {
      return $("html, body").animate({
        scrollTop: $(document).height()
      }, 200);
    };
    DuctTape.prototype.execute = function(coffee_stmt, js_stmt) {
      var code, evalexpr, result;
      evalexpr = js_stmt != null ? js_stmt : this.compile(coffee_stmt);
      result = null;
      try {
        return result = this.format_retval(window.eval(evalexpr.replace(/\n/g, "") + "\n"));
      } catch (error) {
        return result = this.format_ex(error);
      } finally {
        code = $("<pre class=\"executed\"></pre>");
        code.text(coffee_stmt);
        $('#interactions').append(code);
        $('#interactions').append(result);
      }
    };
    DuctTape.prototype.run = function(expr) {
      return this.execute(expr);
    };
    return DuctTape;
  })();
  $(function() {
    return window.dt = new DuctTape();
  });
}).call(this);
