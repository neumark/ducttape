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
    corelib = {} 
    corelib.NAV = 
        class
            doc: """
                 A NAV has 3 parts:
                 - name              unique id (within namespace) - string
                 - attr              attributes - object (dictionary)
                 - value             the actual value - any truthy javascript value
                 """
            constructor: (nav...) ->
                # - {name: ..., attr: ..., value: ...}
                # - [name, attr, value]
                # - [name, {attr: ..., value: ...}]
                [@name, @attr, @value] = switch nav?.length
                    when 1 
                        if nav[0]?.length? == 3 then nav[0] else [nav[0]?.name, nav[0]?.attr, nav[0]?.value]
                    when 2 then [nav?[0], nav?[1]?.attr, nav?[1]?.value]
                    when 3 then nav
                    else []
                if (not @name?) or (not @attr?) or (not @value) then throw new Error "Bad NAV format"
                if (typeof @attr) != "object" then throw new Error "NAV attr field must be an object"
            hasAttributes: (attrList) ->
                missing = (f for f in attrList when (not @attr[f]?))
                missing.length == 0
    corelib.Promise =
        class
            constructor: (@spec = {}) ->
                # TODO: timeout in spec
                @value = null
                @made = new Date()
                _.extend @, Backbone.Events
                if 'value' of @spec then @fulfill (@spec.isSuccess ? true), @spec.value
            fulfill: (@isSuccess, @value)=>
                @fulfilled = new Date()
                @trigger (if @isSuccess then "success" else "failure"), @value
            afterSuccess: (cb) ->
                if @isSuccess == true then cb(@value) else @on("success", cb)
            afterFailure: (cb) ->
                if @isSuccess == false then cb(@value) else @on("failure", cb)
            afterFulfilled: (cb) ->
                if @fulfilled? then cb(@value) else @on("success failure", cb)
            apply: (fun, that, spec) ->
                appliedPromise = new corelib.Promise spec
                @afterFailure -> appliedPromise.fulfill false, @value
                @afterSuccess ->
                    try
                        appliedPromise.fulfill true, fun.apply that, [val]
                    catch e
                        appliedPromise.fulfill false, e
                appliedPromise

    corelib.PromiseChain =
            class extends corelib.Promise
                constructor: (@initialPromiseOrValue, spec = {}) -> 
                    # chain is for debugging only, the actual "chaining"
                    # of promises is done through the event handlers.
                    @chain = []
                    fun =
                        processValue: (val) ->
                            val = if spec.valueTransform? 
                                    try
                                        corelib.promiseApply spec.valueTransform, spec.that, val, spec.newPromiseSpec
                                    catch e
                                        @fulfill false, e
                                        null
                                else val
                            if val instanceof corelib.Promise
                                fun.addPromise val
                            else
                                @fulfill true, val
                        addPromise: (promise) ->
                            @chain.push promise
                            # The failure of any promise in the chain means failure
                            # for the entire chain.
                            promise.on "failure", => @fulfill false
                            promise.on "success", (val) => fun.processValue val
                    fun.processValue @initialPromiseOrValue
    # Always returns a promise to the result of the function
    corelib.promiseApply = (fun, that, val, spec) ->
        if val instanceof corelib.Promise
            val.apply fun, that, spec
        else
            [success, value] = 
                try
                    [true, fun.apply that, [val]]
                catch e
                    [false, e]
            new corelib.Promise (
                isSuccess: success 
                value: value
            )
    corelib.compile = (src) ->
        if src.length == 0 then src else CoffeeScript.compile(src, {'bare': on})
    corelib.execJS = (jsSrc) -> window.eval jsSrc.replace(/\n/g, "") + "\n"
    corelib

