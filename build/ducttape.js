
(function() {
  define('ducttape',[], function() {
    var DuctTape;
    DuctTape = (function() {
      function DuctTape() {
        this.session = {
          history: [],
          config: {
            initial_buffer: "\u0111"
          }
        };
      }
      DuctTape.prototype.compile = function(src) {
        if (src.length === 0) {
          return src;
        } else {
          return CoffeeScript.compile(src, {
            'bare': true
          });
        }
      };
      return DuctTape;
    })();
    return new DuckTape();
  });
}).call(this);
