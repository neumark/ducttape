(function() {
  var __slice = Array.prototype.slice;
  define([], function() {
    var OWM;
    return {
      OWM: OWM = (function() {
        OWM.prototype.doc = "An OWM has 3 parts:\n- name              string\n- attributes        object (dictionary)\n- object itself     any truthy javascript value";
        function OWM() {
          var owm, _ref;
          owm = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          _ref = (function() {
            var _ref, _ref2, _ref3, _ref4, _ref5;
            switch (owm != null ? owm.length : void 0) {
              case 1:
                return [(_ref = owm[0]) != null ? _ref.name : void 0, (_ref2 = owm[0]) != null ? _ref2.attr : void 0, (_ref3 = owm[0]) != null ? _ref3.value : void 0];
              case 2:
                return [owm != null ? owm[0] : void 0, owm != null ? (_ref4 = owm[1]) != null ? _ref4.attr : void 0 : void 0, owm != null ? (_ref5 = owm[1]) != null ? _ref5.value : void 0 : void 0];
              case 3:
                return owm;
              default:
                return [];
            }
          })(), this.name = _ref[0], this.attr = _ref[1], this.value = _ref[2];
          if ((!(this.name != null)) || (!(this.attr != null)) || (!this.value)) {
            throw new Error("Bad OWM format");
          }
        }
        OWM.prototype.hasAttributes = function(attrList) {
          var f, missing;
          missing = (function() {
            var _i, _len, _ref, _results;
            _ref = this.attrList;
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              f = _ref[_i];
              if (!(this.attr[f] != null)) {
                _results.push(f);
              }
            }
            return _results;
          }).call(this);
          return missing.length === 0;
        };
        return OWM;
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
