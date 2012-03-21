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

   FileSystem interface for DuctTape

   FS provides a uniform way of accessing hierarchical information like the unix
   filesystem or the DOM tree. It contains the following parts:
   * The UI: a small "prompt" which can show the current directory, or
     whatever you like.
   * Commands: commands to navigate and manipulate the filesystem:
     mount, unmount, ls, pwd, cd
   * The FSILib object, which provides the FSI API for modules whishing to
     implement access to a particular service.
###
define ['corelib'], (corelib) ->
    (dt) ->
        session = dt.pkgGet('core', 'session').value
        mkSessionData = (path, obj) ->
            currentPath: path
            currentObject: obj
        pkg =
            name: "fs"
            attr:
                description: "FileSystem inteface package"
                author: "Peter Neumark"
                version: "1.0"
                url: "https://github.com/neumark/ducttape"
            value:
                mount:
                    attr:
                        description: "Attach new FS adaptor."
                        makePublic: true
                    value: (root) ->
                        # TODO: mount shouldn't always apply to '/'
                        session.fs ?= mkSessionData([], root)
                pwd:
                    attr:
                        description: "Print current directory."
                        makePublic: true
                    value: -> (session.fs?.currentPath ? []).join('/')

                co:
                    attr:
                        description: "Displays current object."
                        makePublic: true
                    value: ->
                        session.fs?.currentObject?.contents()

                ls:
                    attr:
                        description: "Lists children of current object."
                        makePublic: true
                    value: ->
                        session.fs?.currentObject?.children()
                   
