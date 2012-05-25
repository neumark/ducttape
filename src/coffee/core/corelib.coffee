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
            defaultSpec:
                timeout: 0
            constructor: (@spec = corelib.Promise::defaultSpec) ->
                @debug =
                    createdStacktrace: printStackTrace?()
                @value = null
                @made = new Date()
                _.extend @, Backbone.Events
                if 'value' of @spec then @fulfill (@spec.isSuccess ? true), @spec.value
                if @spec.afterSuccess? then @afterSuccess @spec.afterSuccess
                if @spec.afterFailure? then @afterFailure @spec.afterFailure
                if @spec.afterFulfilled? then @afterFulfilled @spec.afterFulfilled
                if @spec.timeout > 0
                    @timeoutHandle = setTimeout \
                        ( => if !@hasOwnProperty 'fulfilled' 
                            @timeoutOccurred = true
                            # post-timeout fulfills should not
                            # throw an exception like they do now.
                            # TODO: log to the the error stream instead of console:
                            @fulfill false, new Error "timeout"
                            @fulfill = @handlePostTimeoutFulfill
                        ),
                        @spec.timeout * 1000
            handlePostTimeoutFulfill: (isSuccess, value) ->
                console?.log "attempted post-timeout fulfill of promise " + isSuccess + " " + value
            fulfill: (@isSuccess, @value) ->
                if @fulfilled? 
                    throw new Error 'Attempt to fulfill the same promise twice.'
                else
                    @debug.fulfilledStacktrace = printStackTrace?()
                    @fulfilled = new Date()
                    @trigger (if @isSuccess then "success" else "failure"), @value
            afterSuccess: (cb) ->
                if @isSuccess == true then cb @value else @on "success", cb, @
            afterFailure: (cb) ->
                if @isSuccess == false then cb @value else @on "failure", cb, @
            afterFulfilled: (cb) ->
                if @fulfilled? then cb @value else @on "success failure", cb, @
            apply: (fun, that, spec) ->
                corelib.promiseApply fun, [@], that, spec
            defaultHandlers: ->
                [
                    ((val) => @fulfill true, val)
                    ((err) => @fulfill false, err)
                ]

    corelib.sequence = (funs, seed, spec) ->
        seqContFn = (input) ->
            output =  (funs.shift()).apply null, [input]
            [
                if funs.length > 0 then seqContFn else true
                output
            ]
        seqChain = corelib.continuationChain [seqContFn, seed], spec
        
    corelib.continuationChain = (initialCont, spec) -> 
        # chain is for debugging only, the actual "chaining"
        # of promises is done through the event handlers.
        chain = []
        processContinuation = (cont) =>
            chain.push cont
            # For valid continuations, cont is type [function, *]
            # If the first parameter is a boolean, fulfill the continuationChain.
            corelib.promiseApply \
                ((tag, val) -> 
                    if typeof tag == "boolean" then val
                    else if typeof tag == "function"
                        processContinuation tag.apply null, [val]
                    else throw new Error "continuationChain: invalid continuation format!"
                ),
                cont,
                null,
                spec
        result = processContinuation initialCont
        result.chain = chain
        result

    corelib.promiseArray = (pArray, spec) ->
        promise = new corelib.Promise spec
        promise.pArray = pArray
        pending = {}
        numPending = pArray.length
        resultArray = (pending for num in [0..(pArray.length-1)])
        assign = (ix, val) ->
            resultArray[ix] = val
            numPending--
        maybeFinish = ->
            if numPending == 0 and !promise.hasOwnProperty('fulfilled')
                promise.fulfill true, resultArray
        handleValue = (ix, val) ->
            if val instanceof corelib.Promise 
                if !val.hasOwnProperty('fulfilled')
                    val.afterFailure promise.defaultHandlers()[1]
                    val.afterSuccess (value) -> handleValue ix, value
                else # the fulfilled promise case
                    if val.isSuccess == false 
                        promise.fulfill false, val.value
                    else 
                        assign ix, val.value
            else
                assign ix, val
            maybeFinish()
        handleValue i, pArray[i] for i in [0..(pArray.length - 1)]
        promise

   # Always returns a promise to the result of the function
    corelib.promiseApply = (fun, fnargs, that, spec) ->
        evaluatedPromise = new corelib.Promise spec
        args = if fnargs instanceof Array then fnargs.slice(0) else []
        args.push fun
        args.push that
        # Is fulfilled when the arguments are ready
        argPromise = corelib.promiseArray args
        argPromise.afterFailure evaluatedPromise.defaultHandlers()[1]
        argPromise.afterSuccess (val) ->
            t = val.pop()
            f = val.pop()
            try
                # resultPromise could be a promise or a regular value
                resultPromise = f.apply t, val
                evaluatedResultP = corelib.promiseArray [resultPromise]
                evaluatedResultP.afterFailure (err) -> evaluatedPromise.fulfill false, err
                evaluatedResultP.afterSuccess (res) -> evaluatedPromise.fulfill true, res[0]
            catch e
                evaluatedPromise.debug.exceptionCaught = e
                evaluatedPromise.fulfill false, e
        evaluatedPromise.waitingOn = argPromise
        evaluatedPromise.willApply = fun
        evaluatedPromise

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
    corelib.require = (modules, spec) ->
        modulePromise = new corelib.Promise spec
        require modules, -> modulePromise.fulfill true, arguments
        modulePromise
    corelib

