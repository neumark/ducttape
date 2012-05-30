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

   jsonedit.coffee - Edit javascript objects as JSON text.
###
define [], ->
    (dt) ->
        corelib = dt.pkgGet('core','internals').value.corelib
        fslib = dt.pkgGet('fs','lib').value
        display = dt.pkgGet('ui','display').value

        renderEditor = (text) ->
            # TODO move CSS out from here
            container = $ '<div>'+
                '<input type="button" class="jsoneditsave" value="save">' +
                '<input type="button" class="jsoneditcancel" value="cancel">' +
                '<div style="width:400px;height:400px;">'+
                '<div style="width:400px; height:400px" class="jsoneditace"></div>' +
                '</div></div>'
            closeEditor = -> container.remove()
            finishPromise = new corelib.Promise
            editor = ace.edit (container.find 'div.jsoneditace')[0]
            (container.find 'input.jsoneditsave').click -> 
                closeEditor()
                finishPromise.fulfill true, editor.getSession().getValue()
            (container.find 'input.jsoneditcancel').click -> 
                closeEditor()
                finishPromise.fulfill false, "no change"
            #editor.getSession().setMode(new (ace.require("ace/mode/javascript").Mode)())
            editor.getSession().setValue(text)
            editor.getSession().setTabSize(4)
            editor.getSession().setUseSoftTabs(true)
            editor.getSession().setUseWrapMode(false)
            editor.setHighlightActiveLine(true)
            [container, finishPromise]
        jsonedit = (obj) ->
            s = corelib.sequence [
                (-> obj)
                ((o) -> 
                    JSON.stringify obj)
                ((text) -> 
                    [div, editFinished] = renderEditor js_beautify text
                    display div
                    editFinished)
                ((changedText) -> JSON.parse changedText)
            ], corelib.require ['deps/js-beautify/beautify.js']
            # Previous line makes sure jsbeatuify has loaded.
            # Contents of the file loads from cache on subsequent calls.
            s.toHTML = -> null
            s
        pkg =
            name: 'jsonedit'
            attr:
                description: 'Edit javascript objects as JSON text.'
                author: 'Peter Neumark'
                url: 'https://github.com/neumark/ducttape'
                version: '1.0'
            value:
                jsonedit:
                    attr:
                        description: 'Open edit an object\'s properties as JSON text.'
                        makePublic: true
                    value: jsonedit
 
