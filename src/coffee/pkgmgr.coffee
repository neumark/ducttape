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

   pkgmgr.coffee - the DuctTape package manager.
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


