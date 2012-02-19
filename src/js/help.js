(function() {
  var __slice = Array.prototype.slice;
  define([], function() {
    return function(dt) {
      var converter, pkg;
      converter = new Showdown.converter();
      return pkg = {
        name: 'help',
        attr: {
          description: "Contains the DuctTape help system. Use this package to add documentation for your own packages.<br />\nThe most important item in this package is the help command.",
          author: 'Peter Neumark',
          url: 'https://github.com/neumark/ducttape',
          version: '1.0'
        },
        value: {
          help: {
            attr: {
              description: 'Function implementing the help command.',
              makePublic: true
            },
            value: function() {
              var helpObj, i, sectionKey, _i, _len;
              sectionKey = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
              sectionKey = ((sectionKey != null ? sectionKey.length : void 0) != null) < 1 ? ['main'] : sectionKey;
              helpObj = pkg.value.helpStore.value;
              try {
                for (_i = 0, _len = sectionKey.length; _i < _len; _i++) {
                  i = sectionKey[_i];
                  helpObj = helpObj[i];
                }
                if (!(helpObj != null)) {
                  throw new Error("NoSuchHelpSection");
                }
              } catch (err) {
                return "No such help item: " + sectionKey.join(".");
              }
              return $("<div class='eval_result'>" + converter.makeHtml(helpObj) + "</div>");
            }
          },
          helpStore: {
            attr: {
              description: 'Help contents stored in this object. Should be JSON.stringify-able.'
            },
            value: {
              main: "Main *help* section. To be updated.",
              intro: "Welcome to *DuctTape*, a new kind of terminal for the web."
            }
          }
        }
      };
    };
  });
}).call(this);
