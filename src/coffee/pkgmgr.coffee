define [], ->
    (dt) ->
        class Pkg
            constructor: (@name, @attributes) ->
                @funs = {}
            addFun: (descriptor, body, export_fun = true) ->
                if not descriptor?.name? then throw new Error "InvalidFunctionDescriptor"
                @funs[descriptor.name] = 
                    body: body
                    args: descriptor.args ? []
                    description: (descriptor.description ? "No description provided")
                if export_fun == true then dt[descriptor.name] = @funs[descriptor.name].body
            getFun: (name) ->
                if not @funs[name]? then throw new Error "UndefinedFunction"
                return @funs[name]

        class PkgMgr
            constructor: (@dt, @store = {}) ->
            pkgNameGuard: (pkgName, fn) ->
                if not @store[pkgName]? then throw new Error "UndefinedPackage"
                fn.call @
            def: (name, descr = {}) ->
                @store[name] = new Pkg name, descr
                true
            addFun: (pkg, args...) =>
                @pkgNameGuard pkg, ->
                    @store[pkg].addFun.apply @store[pkg], args
                    true
            getFun: (pkg, funName) =>
                @pkgNameGuard pkg, ->
                    @store[pkg].getFun(funName)
            apply: (pkg, funName, that = @, args...) =>
                @getFun(pkg, funName).body.apply that, args


