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
                if command?
                    if args.length == 0
                        # In this case, interpret the command variable as also containing a list of args
                        # TODO: perhaps make this a bit more sophisticated:
                        tmp = command.split ' '
                        command = tmp[0]
                        args = tmp[1..]
                    fn = @cmdStore[command]?.value
                    (fn ? badCommand(command)).apply @, args
                else
                    "DuctTape pre 0.001; Welcome!\n(TODO: redirect to help.)"

