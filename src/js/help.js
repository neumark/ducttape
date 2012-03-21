
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

   help.coffee - Contains code and content for the help system.
*/

(function() {
  var __hasProp = Object.prototype.hasOwnProperty;

  define(['corelib'], function(corelib) {
    return function(dt) {
      var converter, displayMarkDown, fixLinks, pkg, uiLib;
      uiLib = dt.pkgGet('ui', 'lib').value;
      fixLinks = function(div) {
        return div.find('a').replaceWith(function() {
          var a, link;
          a = $(this);
          switch (a.attr('href')) {
            case "/pseudoURL/run":
              link = $("<a href='#'>" + (a.attr('title') ? a.attr('title') : a.text()) + "</a>");
              link.click(function(ev) {
                uiLib.captureEvent(ev);
                return uiLib.run(a.text());
              });
              return link;
            case "/pseudoURL/insert":
              link = $("<a href='#'>" + (a.attr('title') ? a.attr('title') : a.text()) + "</a>");
              link.click(function(ev) {
                uiLib.captureEvent(ev);
                return dt.pkgGet('ui', 'insertText').value(a.text());
              });
              return link;
            case "/pseudoURL/replace":
              return dt.pkgGet('objectViewer', 'show').value(corelib.execJS(corelib.compile(a.text())));
            default:
              return $("<a href='" + (a.attr('href')) + "' target='_blank'>" + (a.text()) + "</a>");
          }
        });
      };
      displayMarkDown = function(md) {
        var result;
        result = $("<div class='eval_result'>" + converter.makeHtml(md) + "</div>");
        fixLinks(result);
        return result;
      };
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
            value: function(section) {
              var helpText, vwm;
              if ((section != null ? section[dt.symbol() + 'id'] : void 0) != null) {
                try {
                  vwm = dt.pkgGet.apply(this(section[dt.symbol() + 'id'].split(':')));
                } catch (e) {
                  return "Error retrieving help for " + section[dt.symbol() + 'id'];
                }
                if (vwm.attr.description != null) {
                  return displayMarkDown(vwm.attr.description);
                } else {
                  return "No description for " + section[dt.symbol() + 'id'];
                }
              } else {
                if (section == null) section = 'main';
                helpText = pkg.value.helpStore.value[section];
                if (helpText != null) {
                  return displayMarkDown(helpText);
                } else {
                  return "No such help item: " + section;
                }
              }
            }
          },
          listSections: {
            attr: {
              description: 'Utility function for listing help sections.'
            },
            value: function() {
              var dom, key;
              dom = $(converter.makeHtml(((function() {
                var _ref, _results;
                _ref = pkg.value.helpStore.value;
                _results = [];
                for (key in _ref) {
                  if (!__hasProp.call(_ref, key)) continue;
                  _results.push("*   [\u0111.help '" + key + "'](/pseudoURL/run \"" + key + "\")");
                }
                return _results;
              })()).join("\n")));
              fixLinks(dom);
              return dom;
            }
          },
          displayMarkDown: {
            attr: {
              description: 'Returns a DOM element with parsed MarkDown, correctly links to DuctTape PseudoURLs.'
            },
            value: displayMarkDown
          },
          helpStore: {
            attr: {
              description: 'Help contents stored in this object. Should be JSON.stringify-able.'
            },
            value: {
              main: "# DuctTape help #\nthis is the _main_ section, which can be reached via [\u0111.help()](/pseudoURL/run) or [\u0111.help main](/pseudoURL/run).\n\n## Available help sections  \n[(\u0111 'o help:listSections').value()](/pseudoURL/replace)\n## Help for a function or object\nFor any DuctTape function or object, view the related documentation by typing **\u0111.help _function_**\n\nExample: [\u0111.help \u0111.show](/pseudoURL/run)\n",
              intro: "# Welcome to DuctTape #\n_DuctTape_ is an [open source](https://github.com/neumark/ducttape) [CoffeeScript](http://coffeescript.org) [REPL](http://en.wikipedia.org/wiki/REPL) for the web.\n\n## Getting Started ##\nAny valid CoffeeScript expression typed into the console will be translated to JavaScript and executed.\nDuctTape will display the result.\nThe [\u0111.help()](/pseudoURL/run) function can be used to get help about objects included in DuctTape.\nFor example, [\u0111.help \u0111.show](/pseudoURL/run) will describe the _show_ command.\n\n## Key bindings ##\n\n<table><thead><tr><td><b>Key</b></td><td><b>Action</b></td></tr></thead>\n<tbody>\n<tr><td>Enter  </td><td>Executes current statement.</td></tr>\n<tr><td>Shift+Enter &nbsp;</td><td> Start a new line (multiline expressions are allowed).</td></tr>\n<tr><td>F2  </td><td>Toggles display of generated JavaScript source.</td></tr>\n<tr><td>Alt+D  </td><td>Insert the <i>DuctTape symbol</i> (\u0111).</td></tr>\n<tr><td>up  </td><td>Browse command history (go back).</td></tr>\n<tr><td>down  </td><td>Browse command history (go forward).</td></tr>\n</tbody></table>\n\n## Useful functions ##\nDuctTape comes with a few convenience functions to make your life easier:\n\n[\u0111.history()](/pseudoURL/run): List previous commands.\n\n[\u0111.last()](/pseudoURL/run): Get the last command issued, along with its result.\n\n[\u0111.clear()](/pseudoURL/run): Erase the result of previous commands.\n\n[\u0111.ov window](/pseudoURL/run): Browse any javascript object (in this case, _window_).\n\nTo view the list of all currently loaded packages and their contents, run [\u0111.listPackages()](/pseudoURL/run).\n\n## DuctTape is extensible ##\nThanks to it's modular architecture, anyone can add commands to DuctTape.\nWrite your own custom packages, and use DuctTape for whatever you want!\n\n## Get Involved! ##\nDo you enjoy using DuctTape, have feature requests or need help developing custom packages?\n\nLet me know! You can find me on [GitHub](https://github.com/neumark).\n\n**Have fun!**\n"
            }
          }
        }
      };
    };
  });

}).call(this);
