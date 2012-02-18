###
    PkgMgr is organized around the concept of Values With Metadata (VWM).
    See corelib for details.

    Packages are VWM's, as are the objects contained within.
    Deeper in the object hierarchy there can be "plain old objects" as well.
###
define [], ->
    (dt) ->
        VWM = (dt 'v internals').corelib.VWM

        class Pkg extends VWM
            constructor: (pkgSpec) ->
                super pkgSpec
                if not @hasAttributes ["author", "description", "url"]
                    throw new Error "InvalidPackageSpecification"
                for own key, obj of @value
                    @save new VWM key, obj
            save: (vwm) ->
                if not vwm.hasAttributes ["description"]
                    throw new Error "InvalidObjectSpecification"
                @value[vwm.name] = vwm
                if vwm.attr.makePublic is on 
                    dt[vwm.name] = @value[vwm.name].value
                    # add an identifier to the obj so help() and other conveniences work:
                    dt[vwm.name]['\u0111id'] = @name + ':' + vwm.name
            load: (name) ->
                @value[name]

        class PkgMgr
            constructor: (@store = {}) ->
            definePackage: (pkgSpec) ->
                pkg = new Pkg pkgSpec
                if @store[pkg.name]? then throw new Error "PkgExists"
                @store[pkg.name] = pkg
                true
            save: (pkg, args...) =>
                @pkgDefinedGuard pkg, ->
                    @store[pkg].save new VWM args
                    true
            load: (pkg, name) =>
                @pkgDefinedGuard pkg, ->
                    @store[pkg].load(name)
            pkgDefinedGuard: (pkgName, fn) ->
                if not @store[pkgName]? then throw new Error "UndefinedPackage"
                fn.call @

