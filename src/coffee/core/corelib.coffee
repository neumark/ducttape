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
                if @spec.afterSuccess? then @afterSuccess @spec.afterSuccess
                if @spec.afterFailure? then @afterFailure @spec.afterFailure
                if @spec.afterFulfilled? then @afterFulfilled @spec.afterFulfilled
            fulfill: (@isSuccess, @value)=>
                if @fulfilled? 
                    throw new Error 'Attempt to fulfill the same promise twice.'
                else
                    @fulfilled = new Date()
                    @trigger (if @isSuccess then "success" else "failure"), @value
            afterSuccess: (cb) ->
                if @isSuccess == true then cb @value else @on "success", cb, @
            afterFailure: (cb) ->
                if @isSuccess == false then cb @value else @on "failure", cb, @
            afterFulfilled: (cb) ->
                if @fulfilled? then cb @value else @on "success failure", cb, @
            apply: (fun, that, spec) ->
                appliedPromise = new corelib.Promise spec
                appliedPromise.waitingOn = @
                @afterFailure => appliedPromise.fulfill false, @value
                @afterSuccess =>
                    try
                        appliedPromise.fulfill true, fun.apply that, [@value]
                    catch e
                        appliedPromise.fulfill false, e
                appliedPromise

    corelib.PromiseChain =
        class extends corelib.Promise
            constructor: (initialPromise, spec) ->
                super spec
                @chain = []
                setupPromise = (p) =>
                    @chain.push p
                    p.afterFulfilled ->
                        if p.isSuccess and (p.value instanceof corelib.Promise)
                            setupPromise p.value
                        else
                            finalPromise.fulfill p.isSuccess, p.value
                setupPromise initialPromise

    corelib.ContinuationChain =
            class extends corelib.Promise
                constructor: (initialCont, spec) -> 
                    super spec
                    # chain is for debugging only, the actual "chaining"
                    # of promises is done through the event handlers.
                    @chain = []
                    fun =
                        applyFun: (contFn, input) =>
                            try
                                fun.processContinuation contFn.apply null, [input]
                            catch e
                                @fulfill false, e
                    
                        processContinuation: (cont) =>
                            # For valid continuations, cont is type [function, *]
                            # If the first parameter is a boolean, fulfill the continuationChain.
                            if typeof cont[0] == "boolean"
                                if cont[1] instanceof corelib.Promise
                                    cont[1].afterFulfilled (val) => @fulfill (cont[0] && @isSuccess), val
                                else
                                    @fulfill.apply @, cont
                            else if typeof cont[0] == "function"
                                @chain.push cont
                                # execute the continuation, or process asnynchronously if its a promise
                                [contFn, input] = cont
                                if input instanceof corelib.Promise
                                    input.afterSuccess  (val) -> fun.applyFun(contFn, val)
                                    input.afterFailure  -> (err) => @fulfill false, err
                                else
                                    fun.applyFun contFn, input
                            else
                                throw new Error "continuationChain: invalid continuation format!"
                    fun.processContinuation initialCont
    corelib.promiseArray = (pArray) ->
        promise = new corelib.Promise()
        pending = {}
        numFulfilled = 0
        resultArray = []
        _.each pArray, (val, ix) -> 
            resultArray.push \ 
                if val instanceof corelib.Promise
                    val.afterFulfilled ->
                        numFulfilled++
                        resultArray[ix] = val.value
                        if val.isSuccess == false then promise.fulfill false, resultArray
                        if numFulfilled == pArray.length and not promise.fulfilled
                            promise.fulfill true, resultArray
                    pending
                else
                    val
        # fulfill if there were no promises in pArray
        if (p for p in resultArray when p == pending).length == 0 then promise.fulfill true, resultArray
        promise
                            
   # Always returns a promise to the result of the function
    corelib.promiseApply = (fun, args, that, spec) ->
        args ?= []
        args.push fun
        args.push that
        argPromise = corelib.promiseArray args
        argPromise.apply (val) ->
            t = val.pop()
            f = val.pop()
            f.apply t, val

    corelib.Stream = class
        constructor: (@records = []) -> 
            _.extend @, Backbone.Events
            @__defineGetter__ "length", => @records.length
        append: (data) -> 
            @records.push data
            @trigger 'append', data
        flush: -> 
            @records = []
            @trigger 'flush'
        map: (fun, that) -> _.map(@records, fun, that)

    corelib.compile = (src) ->
        if src.length == 0 then src else CoffeeScript.compile(src, {'bare': on})
    corelib.execJS = (jsSrc) -> window.eval jsSrc.replace(/\n/g, "") + "\n"
    corelib

