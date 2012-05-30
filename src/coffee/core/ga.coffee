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

   ga.coffee - Log interaction data in Google Analytics.

###
define [], ->
    (dt) ->
        gaQ = null
        pkg =
            name: "ga"
            attr:
                description: "Google Analytics interaction logging."
                author: "Peter Neumark"
                version: "1.0"
                url: "https://github.com/neumark/ducttape"
            value:
                setGAQ:
                    attr: 
                        description: "Set GA's API event queue."
                    value: (gaq) -> gaQ = gaq
                gaLog:
                    attr:
                        description: "Logs the arguments to GA"
                        makePublic: true
                    value: (cat, action, label) -> gaQ?.push ['_trackEvent', cat, action, label]
