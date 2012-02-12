(function() {
  var __slice = Array.prototype.slice;
  define(['cmd'], function(Cmd) {
    var badCommand, cmd, dtFun;
    cmd = new Cmd();
    badCommand = function() {
      return "No such command";
    };
    dtFun = function() {
      var argv, fn;
      argv = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (argv.length > 0) {
        fn = cmd.get(argv[0]);
        return (fn != null ? fn : badCommand)();
      }
    };
    dtFun.session = {
      history: [],
      config: {
        initial_buffer: "\u0111",
        keybindings: [
          {
            keyCode: 13,
            shiftKey: false
          }, {
            keyCode: 68,
            altKey: true
          }
        ]
      }
    };
    dtFun.lib = {
      compile: function(src) {
        if (src.length === 0) {
          return src;
        } else {
          return CoffeeScript.compile(src, {
            'bare': true
          });
        }
      }
    };
    cmd.add('last', function() {
      return dtFun.session.history[dtFun.session.history.length - 1];
    });
    return dtFun;
  });
}).call(this);
