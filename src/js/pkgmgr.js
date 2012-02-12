(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __slice = Array.prototype.slice;
  define([], function() {
    return function(dt) {
      var Pkg, PkgMgr;
      Pkg = (function() {
        function Pkg(name, attributes) {
          this.name = name;
          this.attributes = attributes;
          this.funs = {};
        }
        Pkg.prototype.addFun = function(descriptor, body, export_fun) {
          var _ref, _ref2;
          if (export_fun == null) {
            export_fun = true;
          }
          if (!((descriptor != null ? descriptor.name : void 0) != null)) {
            throw new Error("InvalidFunctionDescriptor");
          }
          this.funs[descriptor.name] = {
            body: body,
            args: (_ref = descriptor.args) != null ? _ref : [],
            description: (_ref2 = descriptor.description) != null ? _ref2 : "No description provided"
          };
          if (export_fun === true) {
            return dt[descriptor.name] = this.funs[descriptor.name].body;
          }
        };
        Pkg.prototype.getFun = function(name) {
          if (!(this.funs[name] != null)) {
            throw new Error("UndefinedFunction");
          }
          return this.funs[name];
        };
        return Pkg;
      })();
      return PkgMgr = (function() {
        function PkgMgr(dt, store) {
          this.dt = dt;
          this.store = store != null ? store : {};
          this.apply = __bind(this.apply, this);
          this.getFun = __bind(this.getFun, this);
          this.addFun = __bind(this.addFun, this);
        }
        PkgMgr.prototype.pkgNameGuard = function(pkgName, fn) {
          if (!(this.store[pkgName] != null)) {
            throw new Error("UndefinedPackage");
          }
          return fn.call(this);
        };
        PkgMgr.prototype.def = function(name, descr) {
          if (descr == null) {
            descr = {};
          }
          this.store[name] = new Pkg(name, descr);
          return true;
        };
        PkgMgr.prototype.addFun = function() {
          var args, pkg;
          pkg = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
          return this.pkgNameGuard(pkg, function() {
            this.store[pkg].addFun.apply(this.store[pkg], args);
            return true;
          });
        };
        PkgMgr.prototype.getFun = function(pkg, funName) {
          return this.pkgNameGuard(pkg, function() {
            return this.store[pkg].getFun(funName);
          });
        };
        PkgMgr.prototype.apply = function() {
          var args, funName, pkg, that;
          pkg = arguments[0], funName = arguments[1], that = arguments[2], args = 4 <= arguments.length ? __slice.call(arguments, 3) : [];
          if (that == null) {
            that = this;
          }
          return this.getFun(pkg, funName).body.apply(that, args);
        };
        return PkgMgr;
      })();
    };
  });
}).call(this);
