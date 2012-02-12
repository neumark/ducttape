(function() {
  var __hasProp = Object.prototype.hasOwnProperty;
  define(['ducttape'], function(dt) {
    var exports, objectViewer_MAXSTRLEN;
    objectViewer_MAXSTRLEN = 40;
    exports = {
      htmlEncode: function(str) {
        return jQuery('<div />').text(str).html();
      },
      showValue: function(val, container) {
        container = container != null ? container : $("<div class=\"eval_result\"></div>");
        if ((val.jquery != null) || (val instanceof HTMLElement)) {
          container.append(val);
        } else {
          try {
            container.text(exports.stringValue(val));
          } catch (e) {
            if ((e.message != null) && (e.message === "complexTypeError")) {
              container.append(exports.objectViewer(val));
            } else {
              throw e;
            }
          }
        }
        return container;
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
                    _results.push(exports.stringValue(i));
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
        var _ref, _ref2;
        return (_ref = obj != null ? (_ref2 = obj.constructor) != null ? _ref2.name : void 0 : void 0) != null ? _ref : 'Unknown';
      },
      hasChildren: function(obj) {
        return obj != null;
      },
      objectViewer: function(obj) {
        var get_children, get_node_data, mk_node, object_viewer;
        mk_node = function(key, value) {
          var ret, value_str;
          value_str = null;
          try {
            value_str = exports.stringValue(value);
          } catch (e) {
            value_str = "Object of type " + (exports.objectType(value));
          }
          if (value_str.length > objectViewer_MAXSTRLEN) {
            value_str = value_str.substr(0, objectViewer_MAXSTRLEN) + "...";
          }
          ret = {
            data: {
              title: "<span class='objectViewer_key'>" + key + "</span>: <span class='objectViewer_value'>" + value_str + "</span>",
              attr: {
                object_key: key
              }
            }
          };
          if (exports.hasChildren(value)) {
            ret.state = "closed";
            ret.children = [];
          }
          return ret;
        };
        get_children = function(parent) {
          var key, kl, _i, _len, _results;
          kl = null;
          try {
            kl = Object.getOwnPropertyNames(parent);
          } catch (e) {
            if (!(typeof o !== "undefined" && o !== null)) {
              return [];
            }
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
          _results = [];
          for (_i = 0, _len = kl.length; _i < _len; _i++) {
            key = kl[_i];
            _results.push(mk_node(key, parent[key]));
          }
          return _results;
        };
        get_node_data = function(nodeid) {
          var i, k, keylist, node, nodedata;
          nodedata = null;
          if (nodeid === -1) {
            nodedata = mk_node('Object', obj);
            nodedata.state = "open";
            delete nodedata.data.attr.object_key;
            nodedata.children = get_children(obj);
          } else {
            keylist = ((function() {
              var _i, _len, _ref, _results;
              _ref = nodeid.parents('li').children('a');
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                i = _ref[_i];
                if ($(i).attr('object_key') !== void 0) {
                  _results.push($(i).attr('object_key'));
                }
              }
              return _results;
            })()).reverse();
            keylist.push(nodeid.find('a').attr('object_key'));
            node = obj;
            node = ((function() {
              var _i, _len, _results;
              _results = [];
              for (_i = 0, _len = keylist.length; _i < _len; _i++) {
                k = keylist[_i];
                _results.push((node = node[k]));
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
          plugins: ["themes", "json_data", "crrm"]
        });
        return object_viewer;
      }
    };
    dt.lib.ov = exports.objectViewer;
    return exports;
  });
}).call(this);
