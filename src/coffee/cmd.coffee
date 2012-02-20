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

   cmd.coffee - The DuctTape command interpreter.

###

define [], ->
    (dtObj) ->

        # local helper functions
        badCommand = (name) ->
            -> "No such command: #{ name }"

        class Cmd
            constructor: () ->
                @cmdStore =
                    v:
                        attr:
                            description: "Get a DuctTape system variable."
                        value: (varName) ->
                            if (varName of dtObj) then dtObj[varName]
                            else throw new Error "No such system variable: "+ varName
                    o:
                        attr:
                            description: "Get a DuctTape object from the package manager."
                        value: (fullName) ->
                            tmp = fullName.split ':'
                            dtObj.internals.pkgmgr.load tmp[0], tmp[1]
            exec: (command, args...) =>
                if command? and ("string" == typeof(command))
                    if args.length == 0
                        # In this case, interpret the command variable as also containing a list of args
                        # TODO: perhaps make this a bit more sophisticated:
                        tmp = command.split ' '
                        command = tmp[0]
                        args = tmp[1..]
                    fn = @cmdStore[command]?.value
                    (fn ? badCommand(command)).apply @, args
                else
                    ret = "Sorry, can't help you with that! No action registered for value '#{ command }'!"

