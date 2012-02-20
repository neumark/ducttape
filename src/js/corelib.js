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
  
     corelib.coffee - Classes and functions used by DuctTape internally.
  
  */  var __slice = Array.prototype.slice;
  define([], function() {
    var VWM;
    return {
      VWM: VWM = (function() {
        VWM.prototype.doc = "A VWM has 3 parts:\n- name              unique id (within namespace) - string\n- attr              attributes - object (dictionary)\n- value             the actual value - any truthy javascript value";
        function VWM() {
          var vwm, _ref;
          vwm = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          _ref = (function() {
            var _ref, _ref2, _ref3, _ref4, _ref5, _ref6;
            switch (vwm != null ? vwm.length : void 0) {
              case 1:
                if ((((_ref = vwm[0]) != null ? _ref.length : void 0) != null) === 3) {
                  return vwm[0];
                } else {
                  return [(_ref2 = vwm[0]) != null ? _ref2.name : void 0, (_ref3 = vwm[0]) != null ? _ref3.attr : void 0, (_ref4 = vwm[0]) != null ? _ref4.value : void 0];
                }
                break;
              case 2:
                return [vwm != null ? vwm[0] : void 0, vwm != null ? (_ref5 = vwm[1]) != null ? _ref5.attr : void 0 : void 0, vwm != null ? (_ref6 = vwm[1]) != null ? _ref6.value : void 0 : void 0];
              case 3:
                return vwm;
              default:
                return [];
            }
          })(), this.name = _ref[0], this.attr = _ref[1], this.value = _ref[2];
          if ((!(this.name != null)) || (!(this.attr != null)) || (!this.value)) {
            throw new Error("Bad VWM format");
          }
          if ((typeof this.attr) !== "object") {
            throw new Error("VWM attr field must be an object");
          }
        }
        VWM.prototype.hasAttributes = function(attrList) {
          var f, missing;
          missing = (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = attrList.length; _i < _len; _i++) {
              f = attrList[_i];
              if (!(this.attr[f] != null)) {
                _results.push(f);
              }
            }
            return _results;
          }).call(this);
          return missing.length === 0;
        };
        return VWM;
      })(),
      compile: function(src) {
        if (src.length === 0) {
          return src;
        } else {
          return CoffeeScript.compile(src, {
            'bare': true
          });
        }
      },
      execJS: function(jsSrc) {
        return window.eval(jsSrc.replace(/\n/g, "") + "\n");
      }
    };
  });
}).call(this);
