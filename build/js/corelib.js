
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

   corelib.coffee - Classes and functions used by DuctTape internally.
*/

(function() {
  var __slice = Array.prototype.slice,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  define([], function() {
    var corelib;
    corelib = {};
    corelib.NAV = (function() {

      _Class.prototype.doc = "A NAV has 3 parts:\n- name              unique id (within namespace) - string\n- attr              attributes - object (dictionary)\n- value             the actual value - any truthy javascript value";

      function _Class() {
        var nav, _ref;
        nav = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        _ref = (function() {
          var _ref, _ref2, _ref3, _ref4, _ref5, _ref6;
          switch (nav != null ? nav.length : void 0) {
            case 1:
              if ((((_ref = nav[0]) != null ? _ref.length : void 0) != null) === 3) {
                return nav[0];
              } else {
                return [(_ref2 = nav[0]) != null ? _ref2.name : void 0, (_ref3 = nav[0]) != null ? _ref3.attr : void 0, (_ref4 = nav[0]) != null ? _ref4.value : void 0];
              }
              break;
            case 2:
              return [nav != null ? nav[0] : void 0, nav != null ? (_ref5 = nav[1]) != null ? _ref5.attr : void 0 : void 0, nav != null ? (_ref6 = nav[1]) != null ? _ref6.value : void 0 : void 0];
            case 3:
              return nav;
            default:
              return [];
          }
        })(), this.name = _ref[0], this.attr = _ref[1], this.value = _ref[2];
        if ((!(this.name != null)) || (!(this.attr != null)) || (!this.value)) {
          throw new Error("Bad NAV format");
        }
        if ((typeof this.attr) !== "object") {
          throw new Error("NAV attr field must be an object");
        }
      }

      _Class.prototype.hasAttributes = function(attrList) {
        var f, missing;
        missing = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = attrList.length; _i < _len; _i++) {
            f = attrList[_i];
            if (!(this.attr[f] != null)) _results.push(f);
          }
          return _results;
        }).call(this);
        return missing.length === 0;
      };

      return _Class;

    })();
    corelib.Promise = (function() {

      function _Class(spec) {
        var _ref;
        this.spec = spec != null ? spec : {};
        this.fulfill = __bind(this.fulfill, this);
        this.value = null;
        this.made = new Date();
        _.extend(this, Backbone.Events);
        if ('value' in this.spec) {
          this.fulfill((_ref = this.spec.isSuccess) != null ? _ref : true, this.spec.value);
        }
      }

      _Class.prototype.fulfill = function(isSuccess, value) {
        this.isSuccess = isSuccess;
        this.value = value;
        this.fulfilled = new Date();
        return this.trigger((this.isSuccess ? "success" : "failure"), this.value);
      };

      _Class.prototype.afterSuccess = function(cb) {
        if (this.isSuccess === true) {
          return cb(this.value);
        } else {
          return this.on("success", cb);
        }
      };

      _Class.prototype.afterFailure = function(cb) {
        if (this.isSuccess === false) {
          return cb(this.value);
        } else {
          return this.on("failure", cb);
        }
      };

      _Class.prototype.afterFulfilled = function(cb) {
        if (this.fulfilled != null) {
          return cb(this.value);
        } else {
          return this.on("success failure", cb);
        }
      };

      _Class.prototype.apply = function(fun, that, spec) {
        var appliedPromise,
          _this = this;
        appliedPromise = new corelib.Promise(spec);
        this.afterFailure(function() {
          return appliedPromise.fulfill(false, _this.value);
        });
        this.afterSuccess(function() {
          try {
            return appliedPromise.fulfill(true, fun.apply(that, [_this.value]));
          } catch (e) {
            return appliedPromise.fulfill(false, e);
          }
        });
        return appliedPromise;
      };

      return _Class;

    })();
    corelib.ContinuationChain = (function(_super) {

      __extends(_Class, _super);

      function _Class(initialCont, spec) {
        var fun,
          _this = this;
        _Class.__super__.constructor.call(this, spec);
        this.chain = [];
        fun = {
          applyFun: function(contFn, input) {
            try {
              return fun.processContinuation(contFn.apply(null, [input]));
            } catch (e) {
              return _this.fulfill(false, e);
            }
          },
          processContinuation: function(cont) {
            var contFn, input;
            if (typeof cont[0] === "boolean") {
              if (cont[1] instanceof corelib.Promise) {
                return cont[1].afterFulfilled(function(val) {
                  return _this.fulfill(cont[0] && _this.isSuccess, val);
                });
              } else {
                return _this.fulfill.apply(_this, cont);
              }
            } else if (typeof cont[0] === "function") {
              _this.chain.push(cont);
              contFn = cont[0], input = cont[1];
              if (input instanceof corelib.Promise) {
                input.afterSuccess(function(val) {
                  return fun.applyFun(contFn, val);
                });
                return input.afterFailure(function() {
                  var _this = this;
                  return function(err) {
                    return _this.fulfill(false, err);
                  };
                });
              } else {
                return fun.applyFun(contFn, input);
              }
            } else {
              throw new Error("continuationChain: invalid continuation format!");
            }
          }
        };
        fun.processContinuation(initialCont);
      }

      return _Class;

    })(corelib.Promise);
    corelib.promiseApply = function(fun, that, val, spec) {
      var success, value, _ref;
      if (val instanceof corelib.Promise) {
        return val.apply(fun, that, spec);
      } else {
        _ref = (function() {
          try {
            return [true, fun.apply(that, [val])];
          } catch (e) {
            return [false, e];
          }
        })(), success = _ref[0], value = _ref[1];
        return new corelib.Promise({
          isSuccess: success,
          value: value
        });
      }
    };
    corelib.compile = function(src) {
      if (src.length === 0) {
        return src;
      } else {
        return CoffeeScript.compile(src, {
          'bare': true
        });
      }
    };
    corelib.execJS = function(jsSrc) {
      return window.eval(jsSrc.replace(/\n/g, "") + "\n");
    };
    return corelib;
  });

}).call(this);
