
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
*/

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  define([], function() {
    var twSpec;
    twSpec = {
      timeout: 2 * 60
    };
    return function(dt) {
      var corelib, fslib, getPolicy, getTiddlyWebApi, getUsername, makeMountPoint, pkg;
      corelib = dt.pkgGet('core', 'internals').value.corelib;
      fslib = dt.pkgGet('fs', 'lib').value;
      getPolicy = function(collection) {
        return corelib.sequence([
          (function(coll) {
            return coll.value;
          }), (function(twObj) {
            return twObj.policy;
          })
        ], dt(collection));
      };
      getUsername = function(root, spec) {
        var usernamePromise;
        usernamePromise = new corelib.Promise(spec);
        root.tw.ajaxCall({
          url: root.attr.host + '/status',
          type: "GET",
          success: function(status) {
            dt.pkgGet('ga', 'gaLog').value('command', 'tw.user', status.username);
            if (status.username !== 'GUEST') {
              return usernamePromise.fulfill(true, status.username);
            } else {
              return usernamePromise.fulfill(false, "not logged in");
            }
          },
          error: usernamePromise.defaultHandlers()[1]
        });
        return usernamePromise;
      };
      getTiddlyWebApi = function(apiUrl) {
        var twebPromise;
        twebPromise = new corelib.Promise();
        require([apiUrl], (function(apiObj) {
          if (typeof apiObj === 'function') {
            return apiObj(function(t) {
              return twebPromise.fulfill(true, t);
            });
          } else {
            return twebPromise.fulfill(true, apiObj);
          }
        }));
        return twebPromise;
      };
      makeMountPoint = function(mountName, mountParent, options) {
        var Root, SecondLevel, TWObj, TiddlerWrapper, TopLevel, host;
        host = options.url;
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

          TWObj.prototype.rm = function() {
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

          TWObj.prototype.insertChild = function(newChild) {
            var oldChildList,
              _this = this;
            if (this.childList != null) {
              oldChildList = this.childList;
              return this.childList = corelib.promiseApply((function(obj, list) {
                return list.addNode({
                  key: obj.name,
                  value: obj
                });
              }), [newChild, oldChildList]);
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
              ajaxPromise = new corelib.Promise(twSpec);
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

          TopLevel.prototype.mk = function(name, spec) {
            var creationPromise, newObj,
              _this = this;
            if (spec == null) spec = {};
            newObj = this.mkTwebObj(this.getType(), name);
            if (spec.desc != null) newObj.desc = spec.desc;
            if (spec.policy != null) {
              newObj.policy = $.extend(newObj.policy, spec.policy);
            }
            if (spec.recipe != null) newObj.recipe = spec.recipe;
            return creationPromise = corelib.sequence([
              (function(obj) {
                var p;
                p = new corelib.Promise();
                obj.put.apply(obj, p.defaultHandlers());
                return p;
              }), (function(twObj) {
                var wrapped;
                wrapped = new SecondLevel(twObj.name, _this.getType(), _this);
                wrapped.obj = twObj;
                _this.insertChild(wrapped);
                return wrapped;
              })
            ], newObj);
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
              var valueP;
              valueP = _this.request(_this.obj, _this.obj.get, 'contentObj');
              valueP.apply(function(v) {
                return $.extend(_this.obj, v);
              });
              return valueP;
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

          SecondLevel.prototype.save = function() {
            var _this = this;
            return corelib.promiseApply((function(collection) {
              var promise;
              promise = new corelib.Promise();
              collection.put.apply(collection, promise.defaultHandlers());
              return promise;
            }), [this.value]);
          };

          SecondLevel.prototype.mk = function(name, spec) {
            var creationPromise, fields, newObj,
              _this = this;
            if (spec == null) spec = {};
            if (this.attr.type !== 'Bag') {
              throw new Error('Cannot create child here.');
            }
            newObj = this.mkTwebObj('Tiddler', name);
            newObj.bag = this.obj;
            if (spec.text != null) newObj.text = spec.text;
            if (spec.tags != null) newObj.tags = spec.tags;
            if (spec.fields != null) {
              newObj.fields = $.extend(newObj.fields, spec.fields);
            }
            if (spec.original != null) {
              fields = newObj.fields;
              $.extend(newObj, JSON.parse(JSON.stringify(spec.original)));
              $.extend(newObj.fields, fields);
            }
            return creationPromise = corelib.sequence([
              (function(obj) {
                var p;
                p = new corelib.Promise();
                obj.put.apply(obj, p.defaultHandlers());
                return p;
              }), (function(twObj) {
                var wrapped;
                wrapped = new TiddlerWrapper(twObj, _this);
                _this.insertChild(wrapped);
                return wrapped;
              })
            ], newObj);
          };

          return SecondLevel;

        })(TWObj);
        TiddlerWrapper = (function(_super) {

          __extends(TiddlerWrapper, _super);

          function TiddlerWrapper(tiddler, parent) {
            this.tiddler = tiddler;
            if (parent == null) parent = null;
            this.name = this.tiddler.title;
            this.attr = {
              type: 'Tiddler',
              parent: parent
            };
            this.value = this.obj = this.tiddler;
          }

          TiddlerWrapper.prototype.save = function() {
            var _this = this;
            return corelib.sequence([
              (function() {
                var promise;
                promise = new corelib.Promise();
                _this.tiddler.put.apply(_this.tiddler, promise.defaultHandlers());
                return promise;
              }), (function() {
                return _this;
              })
            ]);
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
              host: host,
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
        return getTiddlyWebApi(options.api).apply(function(tiddlyweb) {
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
          },
          bootstrap: {
            attr: {
              description: "Returns the user's custom bootstrap script (if any)."
            },
            value: function(root, pathTemplate) {
              return corelib.sequence([
                (function(username) {
                  var path;
                  path = pathTemplate.replace('{ user }', username);
                  return dt(path);
                }), (function(node) {
                  return node.value;
                }), (function(tiddler) {
                  return corelib.execJS(corelib.compile(tiddler.text));
                })
              ], getUsername(root.host));
            }
          },
          tw: {
            attr: {
              description: "Utility functions for interacting with tiddlyweb servers.",
              makePublic: true
            },
            value: {
              policy: function() {
                dt.pkgGet('ga', 'gaLog').value('command', 'tw.policy', arguments[0]);
                return getPolicy.apply(null, arguments);
              },
              grant: function(priv, user, collection) {
                dt.pkgGet('ga', 'gaLog').value('command', 'tw.grant', collection(+", " + user + ", " + priv));
                return corelib.sequence([
                  (function(policy) {
                    if (!(policy[priv] != null)) {
                      throw new Error("No such privilege " + priv);
                    }
                    if (!policy[priv] instanceof Array) {
                      throw new Error("Grant cannot be used on privilege " + priv);
                    }
                    if (policy[priv].indexOf(user) >= 0) {
                      throw new Error("User " + user + " already has privilege " + priv + " on object");
                    }
                    return policy[priv].push(user);
                  }), (function() {
                    return dt.save(collection);
                  })
                ], getPolicy(collection));
              },
              revoke: function(priv, user, collection) {
                dt.pkgGet('ga', 'gaLog').value('command', 'tw.revoke', collection(+", " + user + ", " + priv));
                return corelib.sequence([
                  (function(policy) {
                    var i;
                    if (!(policy[priv] != null)) {
                      throw new Error("No such privilege " + priv);
                    }
                    if (!policy[priv] instanceof Array) {
                      throw new Error("Revoke cannot be used on privilege " + priv);
                    }
                    if (policy[priv].indexOf(user) < 0) {
                      throw new Error("User " + user + " already lacks privilege " + priv + " on object");
                    }
                    return policy[priv] = (function() {
                      var _i, _len, _ref, _results;
                      _ref = policy[priv];
                      _results = [];
                      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                        i = _ref[_i];
                        if (i !== user) _results.push(i);
                      }
                      return _results;
                    })();
                  }), (function() {
                    return dt.save(collection);
                  })
                ], getPolicy(collection));
              },
              text: function(tiddlerPath) {
                dt.pkgGet('ga', 'gaLog').value('command', 'tw.text', tiddlerPath);
                return corelib.sequence([
                  (function(wrapper) {
                    return wrapper.value;
                  }), (function(twObj) {
                    return twObj.text;
                  })
                ], dt(tiddlerPath));
              },
              user: function(root) {
                return getUsername(root);
              },
              editFields: function(tiddler) {
                var s, wrappedTiddler;
                wrappedTiddler = null;
                s = corelib.sequence([
                  (function(t) {
                    wrappedTiddler = t;
                    return t.value;
                  }), (function(twObj) {
                    return [twObj.fields];
                  }), (function(f) {
                    return dt.pkgGet('jsonedit', 'jsonedit').value(f);
                  }), (function() {
                    return wrappedTiddler.save();
                  })
                ], fslib.eval(tiddler));
                s.toHTML = function() {
                  return null;
                };
                return s;
              },
              editRecipe: function(recipe) {
                var rec, s;
                rec = null;
                s = corelib.sequence([
                  (function(r) {
                    return r.value;
                  }), (function(twObj) {
                    rec = twObj;
                    return twObj.recipe;
                  }), (function(recipe) {
                    return dt.pkgGet('jsonedit', 'jsonedit').value(recipe);
                  }), (function(newRecipe) {
                    rec.recipe = newRecipe;
                    return dt.save(recipe);
                  })
                ], fslib.eval(recipe));
                s.toHTML = function() {
                  return null;
                };
                return s;
              }
            }
          }
        }
      };
    };
  });

}).call(this);
