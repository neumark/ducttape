(function() {
  define([], function() {
    var Cmd;
    return Cmd = (function() {
      function Cmd(cmdStore) {
        var _ref;
        this.cmdStore = cmdStore;
                if ((_ref = this.cmdStore) != null) {
          _ref;
        } else {
          this.cmdStore = {};
        };
      }
      Cmd.prototype.add = function(cmd, fn) {
        return this.cmdStore[cmd] = fn;
      };
      Cmd.prototype.get = function(cmd) {
        return this.cmdStore[cmd];
      };
      return Cmd;
    })();
  });
}).call(this);
