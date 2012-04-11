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

   keybindings.coffee - Defines and triggers keybindings.

###

define [], ->
    class KeyBindings
        constructor: (@store = {})->
        bind: (ev) =>
            if not ev?.keyCode? then throw new Error "keyCode of key event descriptor must be set"
            if not @store[ev.keyCode]? then @store[ev.keyCode] = []
            @store[ev.keyCode].push(ev)
        trigger: (ev) =>
            if (not ev?.keyCode?) or (not @store[ev.keyCode]?) then return false
            l = @store[ev.keyCode]
            i = 0
            attr = null
            while i < l.length
                differences = (attr for own attr, val of l[i] when (ev[attr]? and ev[attr] != val))
                if differences.length == 0 then return l[i].action(ev)
                i++
            false
                
             
