
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

   FileSystem interface for DuctTape

   FS provides a uniform way of accessing hierarchical information like the unix
   filesystem or the DOM tree. It contains the following parts:
   * The UI: a small "prompt" which can show the current directory, or
     whatever you like.
   * Commands: commands to navigate and manipulate the filesystem:
     mount, unmount, ls, pwd, cd
   * The lib object, which provides the FSI API for modules whishing to
     implement access to a particular service.
*/

(function() {
  var __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  define(['corelib'], function(corelib) {
    var separator;
    separator = "/";
    return function(dt) {
      var fsState, lib, pkg, pkgInit, rootNode, _ref;
      fsState = (_ref = dt.pkgGet('core', 'internals').value.fs) != null ? _ref : {};
      lib = null;
      lib = {
        PathExprEx: (function(_super) {

          __extends(_Class, _super);

          function _Class(msg, obj, childName, originalEx) {
            this.msg = msg;
            this.obj = obj;
            this.childName = childName;
            this.originalEx = originalEx != null ? originalEx : null;
            _Class.__super__.constructor.call(this, this.msg);
          }

          return _Class;

        })(Error),
        PathExpr: (function() {

          function _Class(strExpr) {
            this.strExpr = strExpr;
            this.keyList = strExpr.split(separator);
          }

          _Class.prototype.evaluate = function() {
            var chain, currentObject, walk;
            walk = null;
            walk = function(keyList, obj) {
              var child, currentKey, nodeSet, _ref2;
              currentKey = keyList.shift();
              nodeSet = (obj != null ? (_ref2 = obj.attr) != null ? _ref2.children : void 0 : void 0) != null;
              if (!(nodeSet != null)) {
                throw new lib.PathExprEx("Object has no children", obj, currentKey, this.strExpr);
              }
              child = nodeSet.get(currentKey);
              if (!(child != null)) {
                throw new lib.PathExprEx("Parent does not have a unique child by that name", obj, currentKey, this.strExpr);
              }
              if (keyList.length > 0) {
                return walk(keyList, child);
              } else {
                return child;
              }
            };
            currentObject = this.keyList.length > 0 && keyList[0].length === 0 ? (keyList.shift(), fsState.root) : fsState.co;
            return chain = new corelib.PromiseChain(currentObject, {
              valueTransform: walk
            });
          };

          return _Class;

        })(),
        Node: (function(_super) {

          __extends(_Class, _super);

          function _Class(name, parent) {
            this.name = name;
            if (parent == null) parent = null;
            if (this.attr == null) this.attr = {};
            if (parent != null) this.attr.parent = parent;
          }

          _Class.prototype.fullname = function() {
            return lib.makeFullName((this.attr.parent != null ? this.attr.parent.fullname() : ""), this.name);
          };

          return _Class;

        })(corelib.NAV),
        NodeSet: (function() {

          function _Class(childList) {
            var nodeData, _i, _len, _ref2;
            this.nodeDict = {};
            this.length = 0;
            _ref2 = childList != null ? childList : [];
            for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
              nodeData = _ref2[_i];
              this.addNode(nodeData);
            }
          }

          _Class.prototype.addNode = function(nodeData, useFullName) {
            var name, tmp;
            if (useFullName == null) useFullName = false;
            name = useFullName ? nodeData.value.fullname() : nodeData.key;
            if (!this.nodeDict.hasOwnProperty(name)) {
              this.nodeDict[name] = nodeData;
              this.length++;
              return true;
            } else {
              if (!useFullName) {
                this.length--;
                tmp = this.nodeDict[name];
                delete this.nodeDict[name];
                this.addNode(tmp, true);
                return this.addNode(nodeData, true);
              } else {
                return false;
              }
            }
          };

          _Class.prototype.keys = function() {
            return Object.keys(nodeDict);
          };

          _Class.prototype.map = function(fn) {
            var key, value, _ref2, _results;
            _ref2 = this.nodeDict;
            _results = [];
            for (key in _ref2) {
              if (!__hasProp.call(_ref2, key)) continue;
              value = _ref2[key];
              _results.push(fn(key, value));
            }
            return _results;
          };

          _Class.prototype.get = function(key) {
            var _ref2;
            return (_ref2 = this.nodeDict[key]) != null ? _ref2.value : void 0;
          };

          return _Class;

        })(),
        splitFullName: function(fullName) {
          var keyPart, parts, val;
          parts = fullName.split(separator);
          keyPart = parts.pop();
          return val = {
            ns: parts.join(separator),
            key: keyPart
          };
        },
        makeFullName: function(ns, key) {
          return ns + separator + key;
        }
      };
      lib.__defineGetter__('separator', function() {
        return separator;
      });
      fsState.path = new lib.PathExpr("/");
      rootNode = new ((function(_super) {

        __extends(_Class, _super);

        function _Class() {
          _Class.__super__.constructor.call(this, "");
          this.value = true;
          this.attr = {
            parent: null,
            description: "Root node of ducttape filesystem.",
            children: new lib.NodeSet([], this)
          };
        }

        return _Class;

      })(lib.Node))();
      pkgInit = function() {
        var internals;
        internals = dt.pkgGet('core', 'internals').value;
        if (internals.fs == null) internals.fs = fsState;
        return true;
      };
      return pkg = {
        name: "fs",
        attr: {
          description: "FileSystem inteface package",
          author: "Peter Neumark",
          version: "1.0",
          url: "https://github.com/neumark/ducttape",
          init: pkgInit
        },
        value: {
          root: {
            attr: {
              description: "Root node of the ducttape filesystem."
            },
            value: rootNode
          },
          mount: {
            attr: {
              description: "Attach new FS adaptor.",
              makePublic: true
            },
            value: function(mountPoint, fsType, options) {
              if (options == null) options = {};
              return rootNode.attr.children.addNode({
                key: mountPoint,
                value: dt.pkgGet(fsType, 'makeMountPoint').value(mountPoint, rootNode, options)
              });
            }
          },
          pwd: {
            attr: {
              description: "Print current directory.",
              makePublic: true
            },
            value: function() {
              var _ref2, _ref3;
              return ((_ref2 = (_ref3 = session.fs) != null ? _ref3.currentPath : void 0) != null ? _ref2 : []).join('/');
            }
          },
          co: {
            attr: {
              description: "Displays current object.",
              makePublic: true
            },
            value: function() {
              var _ref2, _ref3;
              return (_ref2 = session.fs) != null ? (_ref3 = _ref2.currentObject) != null ? _ref3.contents() : void 0 : void 0;
            }
          },
          ls: {
            attr: {
              description: "Lists children of current object.",
              makePublic: true
            },
            value: function() {
              var _ref2, _ref3;
              return (_ref2 = session.fs) != null ? (_ref3 = _ref2.currentObject) != null ? _ref3.children() : void 0 : void 0;
            }
          },
          lib: {
            attr: {
              description: "Library of fs-related functions and classes."
            },
            value: lib
          }
        }
      };
    };
  });

}).call(this);
