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
  
     keybindings.coffee - Defines and triggers keybindings.
  
  */  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty;
  define([], function() {
    var KeyBindings;
    return KeyBindings = (function() {
      function KeyBindings(store) {
        this.store = store != null ? store : {};
        this.trigger = __bind(this.trigger, this);
        this.bind = __bind(this.bind, this);
      }
      KeyBindings.prototype.bind = function(ev) {
        if (!((ev != null ? ev.keyCode : void 0) != null)) {
          throw new Error("keyCode of key event descriptor must be set");
        }
        if (!(this.store[ev.keyCode] != null)) {
          this.store[ev.keyCode] = [];
        }
        return this.store[ev.keyCode].push(ev);
      };
      KeyBindings.prototype.trigger = function(ev) {
        var attr, differences, i, l, val;
        if ((!((ev != null ? ev.keyCode : void 0) != null)) || (!(this.store[ev.keyCode] != null))) {
          return false;
        }
        l = this.store[ev.keyCode];
        i = 0;
        attr = null;
        while (i < l.length) {
          differences = (function() {
            var _ref, _results;
            _ref = l[i];
            _results = [];
            for (attr in _ref) {
              if (!__hasProp.call(_ref, attr)) continue;
              val = _ref[attr];
              if ((ev[attr] != null) && ev[attr] !== val) {
                _results.push(attr);
              }
            }
            return _results;
          })();
          if (differences.length === 0) {
            return l[i].action(ev);
          }
          i++;
        }
        return false;
      };
      return KeyBindings;
    })();
  });
}).call(this);
