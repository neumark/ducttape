
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
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  define(['http://mutable-state.tiddlyspace.com/mutable-state.js'], function(with_mutable_state) {
    return function(dt) {
      var corelib, fslib, makeMountPoint, pkg;
      corelib = dt.pkgGet('core', 'internals').value.corelib;
      fslib = dt.pkgGet('fs', 'lib').value;
      makeMountPoint = function(mountName, mountParent, options) {
        var Root, SecondLevel, TWObj, TiddlerWrapper, TopLevel, host, tiddylweb, twebPromise, twebRoot;
        host = options.url;
        tiddylweb = null;
        twebPromise = new corelib.Promise();
        with_mutable_state(function(t) {
          var tiddlyweb;
          tiddlyweb = t;
          return twebPromise.fulfill(true, t);
        });
        TWObj = (function(_super) {

          __extends(TWObj, _super);

          function TWObj(name, parent, filters) {
            if (parent == null) parent = null;
            if (filters == null) filters = null;
            this.request = __bind(this.request, this);
            TWObj.__super__.constructor.call(this, name, parent);
            if (this.obj == null) {
              this.obj = this.mkTwebObj(this.attr.type, this.name, filters);
            }
            this.contentObj = null;
            this.childList = null;
          }

          TWObj.prototype.mkTwebObj = function(type, name, filters) {
            return new this.tw[type](name, host, filters);
          };

          TWObj.prototype.destroy = function() {
            var p;
            p = new corelib.Promise();
            corelib.promiseApply((function(obj) {
              return obj["delete"].apply(obj, p.defaultHandlers());
            }), [this.obj]);
            this.removeChild(p);
            return p;
          };

          TWObj.prototype.removeChild = function(destroyPromise) {
            var oldChildList, _ref, _ref2,
              _this = this;
            if (((_ref = this.attr) != null ? (_ref2 = _ref.parent) != null ? _ref2.childList : void 0 : void 0) != null) {
              oldChildList = this.attr.parent.childList;
              return this.attr.parent.childList = corelib.promiseApply((function(childList) {
                return childList.removeNode(node.name);
              }), [oldChildList, destroyPromise]);
            }
          };

          TWObj.prototype.insertChild = function(creationPromise) {
            var oldChildList,
              _this = this;
            if (this.childList != null) {
              oldChildList = this.childList;
              return this.childList = corelib.promiseApply((function(obj, list) {
                return list.addNode({
                  key: obj.name,
                  value: obj
                });
              }), [creationPromise, oldChildList]);
            }
          };

          TWObj.prototype.request = function(that, ajaxFun, attribute, transform) {
            var ajaxPromise;
            if (transform == null) {
              transform = function(x) {
                return x;
              };
            }
            if (!(this[attribute] != null)) {
              ajaxPromise = new corelib.Promise({
                ajaxFun: ajaxFun,
                that: that
              });
              ajaxFun.apply(that, ajaxPromise.defaultHandlers());
              this[attribute] = ajaxPromise.apply(transform);
            }
            return this[attribute];
          };

          return TWObj;

        })(fslib.Node);
        TopLevel = (function(_super) {

          __extends(TopLevel, _super);

          function TopLevel(name, parent) {
            var _this = this;
            this.attr = {
              type: 'Collection',
              children: function() {
                return _this.request(_this.obj, _this.obj.get, 'childList', function(val) {
                  var i;
                  return new fslib.NodeSet((function() {
                    var _i, _len, _results;
                    _results = [];
                    for (_i = 0, _len = val.length; _i < _len; _i++) {
                      i = val[_i];
                      _results.push({
                        key: i,
                        value: new SecondLevel(i, this.getType(), this)
                      });
                    }
                    return _results;
                  }).call(_this));
                });
              }
            };
            this.value = true;
            TopLevel.__super__.constructor.call(this, name, parent);
          }

          TopLevel.prototype.getType = function() {
            switch (this.name) {
              case 'bags':
                return 'Bag';
              case 'recipes':
                return 'Recipe';
              default:
                throw new Error('Unknown top level child: ' + this.name);
            }
          };

          TopLevel.prototype.createChild = function(name, spec) {
            var creationPromise, newObj;
            if (spec == null) spec = {};
            newObj = this.mkTwebObj(this.getType(), name);
            if (spec.desc != null) newObj.desc = spec.desc;
            if (spec.policy != null) {
              newObj.policy = $.extend(newObj.policy, spec.policy);
            }
            if (spec.recipe != null) newObj.recipe = spec.recipe;
            creationPromise = new corelib.Promise();
            newObj.put.apply(newObj, creationPromise.defaultHandlers());
            this.insertChild(creationPromise);
            return creationPromise;
          };

          return TopLevel;

        })(TWObj);
        SecondLevel = (function(_super) {

          __extends(SecondLevel, _super);

          function SecondLevel(name, type, parent) {
            var _this = this;
            this.__defineSetter__('value', function() {
              throw new Error('NotImplemented');
            });
            this.__defineGetter__('value', function() {
              return _this.request(_this.obj, _this.obj.get, 'contentObj');
            });
            this.attr = {
              type: type,
              children: function() {
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
              }
            };
            SecondLevel.__super__.constructor.call(this, name, parent);
          }

          SecondLevel.prototype.createChild = function(name, spec) {
            var creationPromise, newObj;
            if (spec == null) spec = {};
            if (this.attr.type !== 'Bag') {
              throw new Error('Cannot create child here.');
            }
            newObj = this.mkTwebObj('Tiddler', name);
            newObj.bag = this.obj;
            newObj.text = spec.text;
            if (spec.tags != null) newObj.tags = spec.tags;
            if (spec.fields != null) {
              newObj.fields = $.extend(newObj.fields, spec.fields);
            }
            creationPromise = new corelib.Promise();
            newObj.put.apply(newObj, creationPromise.defaultHandlers());
            this.insertChild(creationPromise);
            return creationPromise;
          };

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
            this.value = this.obj = this.tiddler;
          }

          TiddlerWrapper.prototype.save = function() {
            var promise;
            promise = new corelib.Promise();
            this.tiddler.put.apply(this.tiddler, promise.defaultHandlers());
            return promise;
          };

          return TiddlerWrapper;

        })(TWObj);
        Root = (function(_super) {

          __extends(Root, _super);

          function Root(tw) {
            var i,
              _this = this;
            TWObj.prototype.tw = tw;
            this.name = mountName;
            this.childSet = new fslib.NodeSet((function() {
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
            this.attr = {
              type: 'root',
              parent: mountParent,
              children: function() {
                return _this.childSet;
              }
            };
            this.value = true;
          }

          return Root;

        })(TWObj);
        return twebRoot = twebPromise.apply(function(tiddlyweb) {
          return new Root(tiddlyweb);
        });
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
