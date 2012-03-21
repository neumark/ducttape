
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

   objectviewer.coffee - code for the objectViewer package, registered at
   startup in ducttape.coffee
*/

(function() {
  var __hasProp = Object.prototype.hasOwnProperty,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  define([], function() {
    return function(dt) {
      var objectViewer_MAXSTRLEN, ov, pkg;
      objectViewer_MAXSTRLEN = 40;
      ov = {
        htmlEncode: function(str) {
          return jQuery('<div />').text(str).html();
        },
        showValue: function(val, container) {
          if (((val != null ? val.toHTML : void 0) != null) && (typeof val.toHTML === "function")) {
            return val.toHTML();
          } else if (((val != null ? val.jquery : void 0) != null) || (val instanceof HTMLElement)) {
            return val;
          } else {
            try {
              return $("<span>" + (ov.htmlEncode(ov.stringValue(val))) + "</span>");
            } catch (e) {
              if ((e.message != null) && (e.message === "complexTypeError")) {
                return ov.objectViewer(val);
              } else {
                throw e;
              }
            }
          }
        },
        stringValue: function(val) {
          var i;
          switch (typeof val) {
            case "string":
              return '"' + val + '"';
            case "number":
            case "boolean":
            case "undefined":
            case "function":
              return val + "";
            case "object":
              if (val != null) {
                if (val.constructor === Array.prototype.constructor) {
                  return "[" + ((function() {
                    var _i, _len, _results;
                    _results = [];
                    for (_i = 0, _len = val.length; _i < _len; _i++) {
                      i = val[_i];
                      _results.push(ov.stringValue(i));
                    }
                    return _results;
                  })()).join(", ") + "]";
                } else if (val.toString !== Object.prototype.toString) {
                  return val.toString();
                } else {
                  throw new Error("complexTypeError");
                }
              } else {
                return "null";
              }
              break;
            default:
              return "(cannot display " + (typeof val) + ")";
          }
        },
        objectType: function(obj) {
          var n, _ref, _ref2;
          n = (_ref = obj != null ? (_ref2 = obj.constructor) != null ? _ref2.name : void 0 : void 0) != null ? _ref : 'Unknown';
          if ((n === "") && (obj != null ? obj.constructor : void 0) === $) {
            n = "jQuery";
          }
          return n;
        },
        hasChildren: function(obj) {
          return obj != null;
        },
        objectViewer: function(obj) {
          var get_children, get_node_data, mk_keylist, mk_node, object_viewer, refname;
          refname = "" + (dt.symbol()) + ".ov.cache[" + ov.objectViewer.cache.length + "]";
          ov.objectViewer.cache.push(obj);
          mk_node = function(key, value, visible) {
            var ret, value_str;
            if (visible == null) visible = true;
            value_str = null;
            try {
              value_str = ov.stringValue(value);
            } catch (e) {
              value_str = "Object of type " + (ov.objectType(value));
            }
            if (value_str.length > objectViewer_MAXSTRLEN) {
              value_str = value_str.substr(0, objectViewer_MAXSTRLEN) + "...";
            }
            ret = {
              data: {
                title: "<span class='objectViewer_" + (visible === true ? "" : "hidden") + "key'>" + key + "</span>: <span class='objectViewer_value'>" + value_str + "</span>",
                attr: {
                  object_key: key,
                  "class": 'objectViewer_item'
                }
              }
            };
            if (ov.hasChildren(value)) {
              ret.state = "closed";
              ret.children = [];
            }
            return ret;
          };
          get_children = function(parent) {
            var key, kl, visible, _i, _len, _results;
            kl = null;
            try {
              kl = Object.getOwnPropertyNames(parent);
            } catch (e) {
              if (!(typeof o !== "undefined" && o !== null)) return [];
              kl = (function() {
                var _results;
                _results = [];
                for (key in o) {
                  if (!__hasProp.call(o, key)) continue;
                  _results.push(key);
                }
                return _results;
              })();
            }
            if ((parent != null) && (parent['__proto__'] != null)) {
              kl.push('__proto__');
            }
            visible = Object.keys(parent);
            _results = [];
            for (_i = 0, _len = kl.length; _i < _len; _i++) {
              key = kl[_i];
              _results.push(mk_node(key, parent[key], __indexOf.call(visible, key) >= 0));
            }
            return _results;
          };
          mk_keylist = function(domnode) {
            var i;
            return ((function() {
              var _i, _len, _ref, _results;
              _ref = domnode.parents('li').children('a');
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                i = _ref[_i];
                if ($(i).attr('object_key') !== void 0) {
                  _results.push($(i).attr('object_key'));
                }
              }
              return _results;
            })()).reverse();
          };
          get_node_data = function(nodeid) {
            var k, keylist, node, nodedata;
            nodedata = null;
            if (nodeid === -1) {
              nodedata = mk_node('Object', obj);
              nodedata.state = "open";
              delete nodedata.data.attr.object_key;
              nodedata.children = get_children(obj);
            } else {
              keylist = mk_keylist(nodeid.children('a').first());
              node = obj;
              node = ((function() {
                var _i, _len, _results;
                _results = [];
                for (_i = 0, _len = keylist.length; _i < _len; _i++) {
                  k = keylist[_i];
                  _results.push(node = node[k]);
                }
                return _results;
              })())[keylist.length - 1];
              nodedata = get_children(node);
            }
            return nodedata;
          };
          object_viewer = $("<div class='eval_result'></div>");
          object_viewer.jstree({
            json_data: {
              data: function(nodeid, cb) {
                var nodedata;
                nodedata = get_node_data(nodeid);
                return cb(nodedata);
              }
            },
            core: {
              html_titles: true
            },
            themes: {
              icons: false
            },
            plugins: ["themes", "json_data", "crrm"]
          });
          object_viewer.on('click', 'a.objectViewer_item', function(ev) {
            var kl;
            kl = mk_keylist($(ev.currentTarget));
            (dt('o ui:lib')).value.captureEvent(ev);
            return (dt('o ui:insertText')).value(kl.length === 0 ? refname : "" + refname + "['" + (kl.join("']['")) + "']");
          });
          return object_viewer;
        }
      };
      ov.objectViewer.cache = [];
      return pkg = {
        name: 'objectViewer',
        attr: {
          description: 'A collection of functions for displaying JavaScript values.',
          author: 'Peter Neumark',
          url: 'https://github.com/neumark/ducttape',
          version: '1.0'
        },
        value: {
          ov: {
            attr: {
              description: 'Object Viewer',
              makePublic: true
            },
            value: ov.objectViewer
          },
          show: {
            attr: {
              description: 'Show a JavaScript value, regardless of type.',
              makePublic: true
            },
            value: ov.showValue
          }
        }
      };
    };
  });

}).call(this);
