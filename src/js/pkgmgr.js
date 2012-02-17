(function() {
  /*
      PkgMgr is organized around the concept of Objects With Metadata (OWM).
      See corelib for details.
  
      Packages are OWM's, as are the objects contained within.
      Deeper in the object hierarchy there can be "plain old objects" as well.
  */  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __slice = Array.prototype.slice;
  define([], function() {
    return function(dt) {
      var OWM, Pkg, PkgMgr;
      OWM = (dt('v internals')).corelib.OWM;
      Pkg = (function() {
        __extends(Pkg, OWM);
        function Pkg(pkgdata) {
          var key, obj, _len, _ref;
          this.pkgdata = pkgdata;
          if (!this.pkgdata.hasAttributes(["author", "description", "url"])) {
            throw new Error("InvalidPackageSpecification");
          }
          _ref = this.pkgdata.value;
          for (obj = 0, _len = _ref.length; obj < _len; obj++) {
            key = _ref[obj];
            this.save(new OWM(key, obj));
          }
        }
        Pkg.prototype.save = function(owm) {
          if (!owm.hasAttributes(["description"])) {
            throw new Error("InvalidObjectSpecification");
          }
          this.pkgdata.content[owm.name] = owm;
          if (owm.attr.export_fun === true) {
            dt[owm.name] = this.pkgdata[owm.name].value;
            return dt[owm.name]['\u0111id'] = this.pkgdata.name + ':' + owm.name;
          }
        };
        Pkg.prototype.load = function(name) {
          return this.pkgdata[name];
        };
        return Pkg;
      })();
      return PkgMgr = (function() {
        function PkgMgr(store) {
          this.store = store != null ? store : {};
          this.load = __bind(this.load, this);
          this.save = __bind(this.save, this);
        }
        PkgMgr.prototype.definePackage = function(pkgSpec) {
          var pkg;
          pkg = new OWM(pkgSpec);
          if (this.store[pkg.name] != null) {
            throw new Error("PkgExists");
          }
          this.store[pkg.name] = pkg;
          return true;
        };
        PkgMgr.prototype.save = function() {
          var args, pkg;
          pkg = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
          return this.pkgDefinedGuard(pkg, function() {
            this.store[pkg].save(new OWM(args));
            return true;
          });
        };
        PkgMgr.prototype.load = function(pkg, name) {
          return this.pkgDefinedGuard(pkg, function() {
            return this.store[pkg].load(name);
          });
        };
        PkgMgr.prototype.pkgDefinedGuard = function(pkgName, fn) {
          if (!(this.store[pkgName] != null)) {
            throw new Error("UndefinedPackage");
          }
          return fn.call(this);
        };
        return PkgMgr;
      })();
    };
  });
}).call(this);
