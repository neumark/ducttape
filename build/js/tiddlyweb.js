
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

   TiddlyWeb FS adaptor.
   This code allows one to mount a tiddlyweb host, accessible via the fs package.
   Note: It is assumed that chrjs is included and that the AJAX calls will be
   successful (because ducttape is hosted from the same domain, CORS or an
   iframe hack).
*/

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; },
    __slice = Array.prototype.slice;

  define(['corelib'], function(corelib) {
    return function(dt) {
      var fslib, makeMountPoint, pkg;
      fslib = dt.pkgGet('fs', 'lib').value;
      makeMountPoint = function(mountName, mountParent, options) {
        var Root, SecondLevel, TWObj, TiddlerWrapper, TopLevel, host, twebRoot;
        host = options.url;
        TWObj = (function(_super) {

          __extends(TWObj, _super);

          function TWObj(name, parent, filters) {
            if (parent == null) parent = null;
            if (filters == null) filters = null;
            this.request = __bind(this.request, this);
            TWObj.__super__.constructor.call(this, name, parent);
            if (this.obj == null) {
              this.obj = new tiddlyweb[this.attr.type](this.name, host, filters);
            }
            this.contentObj = null;
            this.childList = null;
          }

          TWObj.prototype.request = function(that, ajaxFun, attribute, transform) {
            var promise,
              _this = this;
            if (transform == null) {
              transform = function(x) {
                return x;
              };
            }
            if (this[attribute] != null) {
              return this[attribute];
            } else {
              promise = new corelib.Promise({
                ajaxFun: ajaxFun,
                that: that
              });
              promise.twRequest = ajaxFun.apply(that, [
                function(value) {
                  _this[attribute] = transform(value);
                  return promise.fulfill(true, _this[attribute]);
                }, function() {
                  var args;
                  args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
                  (dt('o ui:display')).value(args);
                  return promise.fulfill(false, args);
                }
              ]);
              return promise;
            }
          };

          return TWObj;

        })(fslib.Node);
        TopLevel = (function(_super) {

          __extends(TopLevel, _super);

          function TopLevel(name, parent) {
            var _this = this;
            this.attr = {
              type: 'Collection'
            };
            this.attr.__defineSetter__('children', function() {
              throw new Error('NotImplemented');
            });
            this.attr.__defineGetter__('children', function() {
              var ns, t;
              t = (function() {
                switch (this.name) {
                  case 'bags':
                    return 'Bag';
                  case 'recipes':
                    return 'Recipe';
                  default:
                    throw new Error('Unknown top level child: ' + this.name);
                }
              }).call(_this);
              ns = _this.fullname();
              return _this.request(_this.obj, _this.obj.get, 'childList', function(val) {
                var i;
                return new fslib.NodeSet((function() {
                  var _i, _len, _results;
                  _results = [];
                  for (_i = 0, _len = val.length; _i < _len; _i++) {
                    i = val[_i];
                    _results.push({
                      key: i,
                      value: new SecondLevel(i, t, this)
                    });
                  }
                  return _results;
                }).call(_this));
              });
            });
            this.value = true;
            TopLevel.__super__.constructor.call(this, name, parent);
          }

          return TopLevel;

        })(TWObj);
        SecondLevel = (function(_super) {

          __extends(SecondLevel, _super);

          function SecondLevel(name, type, parent) {
            var _this = this;
            this.__defineSetter__('value', function() {
              throw new Error('NotImplemented');
            });
            this.__defineGetter__("value", function() {
              return _this.request(_this.obj, _this.obj.get, 'contentObj');
            });
            this.attr = {
              type: type
            };
            this.attr.__defineSetter__('children', function() {
              throw new Error('NotImplemented');
            });
            this.attr.__defineGetter__('children', function() {
              return _this.request(_this.obj.tiddlers(), function(cb1, cb2) {
                return _this.obj.tiddlers().get(cb1, cb2, "fat=1");
              }, 'childList', function(tiddlerList) {
                var tiddler;
                return new fslib.NodeSet((function() {
                  var _i, _len, _results;
                  _results = [];
                  for (_i = 0, _len = tiddlerList.length; _i < _len; _i++) {
                    tiddler = tiddlerList[_i];
                    _results.push({
                      key: tiddler.title,
                      value: new TiddlerWrapper(tiddler, this)
                    });
                  }
                  return _results;
                }).call(this));
              });
            });
            SecondLevel.__super__.constructor.call(this, name, parent);
          }

          return SecondLevel;

        })(TWObj);
        TiddlerWrapper = (function(_super) {

          __extends(TiddlerWrapper, _super);

          function TiddlerWrapper(tiddler, parent) {
            this.tiddler = tiddler;
            this.parent = parent;
            this.name = this.tiddler.title;
            this.attr = {
              type: 'Tiddler'
            };
            this.value = this.tiddler;
          }

          return TiddlerWrapper;

        })(TWObj);
        Root = (function(_super) {

          __extends(Root, _super);

          function Root() {
            var i;
            this.name = mountName;
            this.attr = {
              type: 'root',
              parent: mountParent
            };
            this.attr.children = new fslib.NodeSet((function() {
              var _i, _len, _ref, _results;
              _ref = ['bags', 'recipes'];
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                i = _ref[_i];
                _results.push({
                  value: new TopLevel(i, this),
                  key: i
                });
              }
              return _results;
            }).call(this));
            this.value = true;
          }

          return Root;

        })(TWObj);
        return twebRoot = new Root();
      };
      return pkg = {
        name: "tiddlyweb",
        attr: {
          description: "TiddlyWeb fs adaptor package",
          author: "Peter Neumark",
          version: "1.0",
          url: "https://github.com/neumark/ducttape"
        },
        value: {
          makeMountPoint: {
            attr: {
              description: "Root node of tiddlyweb filesystem."
            },
            value: makeMountPoint
          }
        }
      };
    };
  });

}).call(this);
