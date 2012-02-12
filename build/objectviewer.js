(function() {
  var __hasProp = Object.prototype.hasOwnProperty, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  define(['ducktape'], function(dt) {
    var exports;
    exports = {
      showValue: function(val, container) {
        container = container != null ? container : $("<div class=\"eval_result\"></div>");
        if (val instanceof HTMLElement) {
          container.append(val);
        } else {
          try {
            container.text(exports.stringValue(val));
          } catch (e) {
            if ((e.type != null) === "complexTypeError") {
              container.append(exports.objectViewer(val));
            } else {
              container.text("(error converting value to string)");
            }
          }
        }
        return container;
      },
      simpleValue: function(val) {
        switch (typeof val) {
          case "string":
          case "number":
          case "boolean":
          case "undefined":
            return val + "";
          case "object":
            if (val.toString !== Object.prototype.toString) {
              return val.toString();
            } else {
              throw new Error("complexTypeError");
            }
            break;
          default:
            return "(cannot display " + (typeof val) + ")";
        }
      },
      objectViewer: function(obj) {
        var get_children, get_node_data, mk_node, object_viewer;
        mk_node = function(key, value) {
          return {
            data: {
              title: key,
              attr: {
                object_key: key
              }
            },
            state: "closed",
            children: []
          };
        };
        get_children = function(parent) {
          var key, kl, _i, _len, _results;
          kl = (function() {
            var _results;
            _results = [];
            for (key in parent) {
              if (!__hasProp.call(parent, key)) continue;
              _results.push(key);
            }
            return _results;
          })();
          if ((parent != null) && '__proto__' in parent) {
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
          if (nodeid === -1) {
            return {
              data: {
                title: "Object"
              },
              state: "open",
              children: get_children(obj)
            };
          } else {
            keylist = (function() {
              var _i, _len, _ref, _results;
              _ref = nodeid.parents('li');
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                i = _ref[_i];
                if ($(i).attr('object_key') !== void 0) {
                  _results.push($(i).attr('object_key'));
                }
              }
              return _results;
            })();
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
            nodedata = mk_node(keylist[keylist.length - 1], node);
            return nodedata.children = get_children(node);
          }
        };
        object_viewer = $("<div class='eval_result'></div>");
        object_viewer.jstree({
          json_data: {
            data: function(nodeid, cb) {
              var nodedata;
              nodedata = get_node_data(nodeid);
              console.dir(nodedata);
              return cb(nodedata);
            }
          },
          plugins: ["themes", "json_data", "crrm"],
          html_titles: true
        });
        return object_viewer;
      },
      format_command: __bind(function() {
        var div_inner, div_outer, lines;
        lines = $('div.ace_content', this.editor_div).find('div.ace_line').clone();
        div_inner = $("<div class='highlighted_expr ace_editor ace_text-layer'></div>");
        div_inner.append(lines);
        div_outer = $("<div class='" + (this.editor.getTheme().cssClass) + " alert alert-info'></div>");
        div_outer.append(div_inner);
        return div_outer;
      }, this)
    };
    return exports;
  });
}).call(this);
