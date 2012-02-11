(function() {
  /* 
      TODO: disable ACE keyboard shortcuts
      add prompt + navigate object graph using with(obj) {expr} in eval
  */  var DuctTape, capture_event;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  capture_event = function(ev) {
    ev.preventDefault();
    return ev.stopPropagation();
  };
  DuctTape = (function() {
    function DuctTape() {
      this.session = {
        history: [],
        last_exception: null,
        last_result: null,
        last_evaluated_js: null,
        config: {
          initial_buffer: "\u0111"
        }
      };
      this.editor = 0;
      this.coffee_source = "";
      this.js_source = "";
      this.eval_context = {};
      this.init_ace();
      this.init_ui();
      this.reset_editor_contents();
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
    DuctTape.prototype.update = function(ev) {
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
      return $("<div class=\"eval_result\"><span class=\"label label-warning\"> <strong>Exception</strong> (" + ((_ref = ex.type) != null ? _ref : "") + ") </span>&nbsp;<strong>" + ((_ref2 = ex.message) != null ? _ref2 : "") + "</strong></div>");
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
      this.editor.gotoLine(0);
      this.editor.getSession().setValue(this.session.config.initial_buffer);
      return this.editor.moveCursorToPosition({
        column: 1,
        row: 0
      });
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
      this.execute(expr);
      return this.scroll_to_bottom();
    };
    return DuctTape;
  })();
  $(function() {
    return window["\u0111"] = new DuctTape();
  });
}).call(this);
