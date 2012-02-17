(function() {
  var __slice = Array.prototype.slice;
  define([], function() {
    return function(dt) {
      var pkg;
      return pkg = {
        name: 'help',
        attr: {
          description: {
            type: "html",
            data: "Contains the DuctTape help system. Use this package to add documentation for your own packages.<br />\nThe most important item in this package is the " + ((dt('o ui:lib')).commandLinkStr('help')) + " command."
          },
          author: 'Peter Neumark',
          url: 'https://github.com/neumark/ducttape',
          version: '1.0'
        },
        value: {
          help: {
            attr: {
              description: 'Function implementing the help command.',
              make_public: true
            },
            value: function() {
              var section;
              section = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
              return pkg.content.helpStore.content.main;
            }
          },
          helpStore: {
            attr: {
              description: 'Help contents stored in this object. Should be JSON.stringify-able.'
            },
            value: {
              main: "Main help section. To be updated."
            }
          }
        }
      };
    };
  });
}).call(this);
