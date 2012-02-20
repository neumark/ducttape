###
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

   corelib.coffee - Classes and functions used by DuctTape internally.

###

define [], ->
    VWM:
        class VWM
            doc: """
                 A VWM has 3 parts:
                 - name              unique id (within namespace) - string
                 - attr              attributes - object (dictionary)
                 - value             the actual value - any truthy javascript value
                 """
            constructor: (vwm...) ->
                # - {name: ..., attr: ..., value: ...}
                # - [name, attr, value]
                # - [name, {attr: ..., value: ...}]
                [@name, @attr, @value] = switch vwm?.length
                    when 1 
                        if vwm[0]?.length? == 3 then vwm[0] else [vwm[0]?.name, vwm[0]?.attr, vwm[0]?.value]
                    when 2 then [vwm?[0], vwm?[1]?.attr, vwm?[1]?.value]
                    when 3 then vwm
                    else []
                if (not @name?) or (not @attr?) or (not @value) then throw new Error "Bad VWM format"
                if (typeof @attr) != "object" then throw new Error "VWM attr field must be an object"
            hasAttributes: (attrList) ->
                missing = (f for f in attrList when (not @attr[f]?))
                missing.length == 0
    compile: (src) ->
        if src.length == 0 then src else CoffeeScript.compile(src, {'bare': on})
    execJS: (jsSrc) -> window.eval jsSrc.replace(/\n/g, "") + "\n"


