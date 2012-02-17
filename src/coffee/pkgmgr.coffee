###
    PkgMgr is organized around the concept of Objects With Metadata (OWM).
    See corelib for details.

    Packages are OWM's, as are the objects contained within.
    Deeper in the object hierarchy there can be "plain old objects" as well.
###
define [], ->
    (dt) ->
        OWM = (dt 'v internals').corelib.OWM
        class Pkg extends OWM
            constructor: (@pkgdata) ->
                if not @pkgdata.hasAttributes ["author", "description", "url"]
                    throw new Error "InvalidPackageSpecification"
                for own key, obj in @pkgdata.value
                    @save new OWM key, obj
            save: (owm) ->
                if not owm.hasAttributes ["description"]
                    throw new Error "InvalidObjectSpecification"
                @pkgdata.content[owm.name] = owm
                if owm.attr.export_fun is on 
                    dt[owm.name] = @pkgdata[owm.name].value
                    # add an identifier to the obj so help() and other conveniences work:
                    dt[owm.name]['\u0111id'] = @pkgdata.name + ':' + owm.name
            load: (name) ->
                @pkgdata[name]

        class PkgMgr
            constructor: (@store = {}) ->
            definePackage: (pkgSpec) ->
                pkg = new OWM pkgSpec
                if @store[pkg.name]? then throw new Error "PkgExists"
                @store[pkg.name] = pkg
                true
            save: (pkg, args...) =>
                @pkgDefinedGuard pkg, ->
                    @store[pkg].save new OWM args
                    true
            load: (pkg, name) =>
                @pkgDefinedGuard pkg, ->
                    @store[pkg].load(name)
            pkgDefinedGuard: (pkgName, fn) ->
                if not @store[pkgName]? then throw new Error "UndefinedPackage"
                fn.call @

