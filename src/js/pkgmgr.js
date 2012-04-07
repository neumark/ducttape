
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

   pkgmgr.coffee - the DuctTape package manager.
   PkgMgr is organized around the concept of Values With Metadata (NAV).
   See corelib for details.

   Packages are NAV's, as are the objects contained within.
   Deeper in the object hierarchy there can be "plain old objects" as well.
*/

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; },
    __slice = Array.prototype.slice;

  define(['corelib'], function(corelib) {
    return function(dt) {
      var Pkg, PkgMgr;
      Pkg = (function(_super) {

        __extends(Pkg, _super);

        function Pkg(pkgSpec) {
          this.toHTML = __bind(this.toHTML, this);
          var key, obj, _ref;
          Pkg.__super__.constructor.call(this, pkgSpec);
          if (!this.hasAttributes(["author", "description", "url"])) {
            throw new Error("InvalidPackageSpecification");
          }
          _ref = this.value;
          for (key in _ref) {
            if (!__hasProp.call(_ref, key)) continue;
            obj = _ref[key];
            this.save(new corelib.NAV(key, obj));
          }
        }

        Pkg.prototype.save = function(nav) {
          if (!nav.hasAttributes(["description"])) {
            throw new Error("InvalidObjectSpecification");
          }
          this.value[nav.name] = nav;
          if (nav.attr.makePublic === true) {
            dt[nav.name] = this.value[nav.name].value;
            return dt[nav.name]['\u0111id'] = this.name + ':' + nav.name;
          }
        };

        Pkg.prototype.load = function(name) {
          return this.value[name];
        };

        Pkg.prototype.toHTML = function() {
          var dl, name, pkgDesc, _fn, _ref, _ref2, _ref3,
            _this = this;
          pkgDesc = $(" <div>\n     <h2>" + this.name + "</h2>\n     <table>\n         <tr><td><b>Author&nbsp;</b></td><td>" + ((_ref = this.attr.author) != null ? _ref : "") + "</td></tr>\n         <tr><td><b>URL&nbsp;</b></td><td><a href=\"" + this.attr.url + "\" target='_blank'>" + this.attr.url + "</a></td></tr>\n         <tr><td><b>Version&nbsp;</b></td><td>" + ((_ref2 = this.attr.version) != null ? _ref2 : "") + "</td></tr>\n     </table>\n     <p><!-- description --></p>\n     <p>Package Contents:\n         <dl></dl>\n     </p>\n</div>");
          pkgDesc.find('p').first().append(dt.pkgGet('help', 'displayMarkDown').value(this.attr.description));
          dl = pkgDesc.find('dl');
          _ref3 = this.value;
          _fn = function(name) {
            var mdSrc;
            dl.append($("<dt>" + name + "</dt>"));
            mdSrc = _this.value[name].attr.makePublic === true ? "_Available as:_ [" + (dt.symbol()) + "." + name + "](/pseudoURL/insert)<br />" : "";
            mdSrc += _this.value[name].attr.description;
            return dl.append($("<dd></dd>").append(dt.pkgGet('help', 'displayMarkDown').value(mdSrc)));
          };
          for (name in _ref3) {
            if (!__hasProp.call(_ref3, name)) continue;
            _fn(name);
          }
          return pkgDesc;
        };

        return Pkg;

      })(corelib.NAV);
      return PkgMgr = (function() {

        function PkgMgr(store) {
          var _this = this;
          this.store = store != null ? store : {};
          this.pkgDef = __bind(this.pkgDef, this);
          this.pkgDef({
            name: 'pkgmgr',
            attr: {
              author: 'Peter Neumark',
              url: 'https://github.com/neumark/ducttape',
              version: '1.0',
              description: "Use this package to load custom packages into **DuctTape**."
            },
            value: {
              pkgDef: {
                attr: {
                  description: "loads a new package into DuctTape.",
                  makePublic: true
                },
                value: this.pkgDef
              },
              pkgSet: {
                attr: {
                  description: "Add a Value With Metadata to an existing package.",
                  makePublic: true
                },
                value: function() {
                  var args, pkg;
                  pkg = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
                  return _this.pkgDefinedGuard(pkg, function() {
                    this.store[pkg].save(new corelib.NAV(args));
                    return true;
                  });
                }
              },
              pkgGet: {
                attr: {
                  description: "Retrieve a reference to a Value With Metadata object.",
                  makePublic: true
                },
                value: function(pkg, name) {
                  return _this.pkgDefinedGuard(pkg, function() {
                    return this.store[pkg].load(name);
                  });
                }
              },
              pkgList: {
                attr: {
                  description: "Displays the list of currently loaded packages and their contents.",
                  makePublic: true
                },
                value: function() {
                  var out, pkgName, _fn, _ref;
                  out = $("<div />");
                  _ref = _this.store;
                  _fn = function(pkgName) {
                    out.append(_this.store[pkgName].toHTML());
                    return out.append("<hr />");
                  };
                  for (pkgName in _ref) {
                    if (!__hasProp.call(_ref, pkgName)) continue;
                    _fn(pkgName);
                  }
                  out.find("hr").last().detach();
                  return out;
                }
              }
            }
          });
        }

        PkgMgr.prototype.pkgDef = function(pkgSpec) {
          var initFun, pkg, _ref;
          pkg = new Pkg(pkgSpec);
          if (this.store[pkg.name] != null) throw new Error("PkgExists");
          initFun = (_ref = pkg.attr.init) != null ? _ref : function() {
            return true;
          };
          if (initFun()) {
            this.store[pkg.name] = pkg;
            return true;
          } else {
            return false;
          }
        };

        PkgMgr.prototype.pkgDefinedGuard = function(pkgName, fn) {
          if (!(this.store[pkgName] != null)) throw new Error("UndefinedPackage");
          return fn.call(this);
        };

        return PkgMgr;

      })();
    };
  });

}).call(this);
