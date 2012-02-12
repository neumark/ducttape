define ['ducttape'], (dt) ->
    # format is a set of functions which can be used to format values
    objectViewer_MAXSTRLEN = 40
    exports = 
        htmlEncode: (str) -> jQuery('<div />').text(str).html()
        showValue: (val, container) ->
            container = container ? $("<div class=\"eval_result\"></div>")
            if val.jquery? or (val instanceof HTMLElement)
                container.append(val)
            else
                try
                    container.text exports.stringValue val 
                catch e
                    if e.message? and (e.message == "complexTypeError") then container.append exports.objectViewer val
                    else throw e
            return container
        stringValue: (val) ->
            switch (typeof val)
                when "string" then '"' + val + '"'
                when "number", "boolean", "undefined", "function"
                    val + ""
                when "object" 
                    if val?
                        if val.constructor == Array.prototype.constructor
                            "[" + (exports.stringValue i for i in val).join(", ") + "]"
                        else if val.toString != Object.prototype.toString
                            val.toString()
                        else
                            throw new Error "complexTypeError"
                    else
                        "null"
                else
                    "(cannot display #{ typeof val })"
        objectType: (obj) ->
            obj?.constructor?.name ? 'Unknown'
        hasChildren: (obj) ->
            obj? 
        objectViewer: (obj) ->
            # TODO: handle Array, Date, Regexp and a couple other builtin objects
            mk_node = (key, value) ->
                value_str = null
                try
                    value_str = exports.stringValue value
                catch e
                    value_str = "Object of type #{ exports.objectType value }"
                if value_str.length > objectViewer_MAXSTRLEN then value_str = value_str.substr(0, objectViewer_MAXSTRLEN) + "..."
                ret = 
                    data:
                        title: "<span class='objectViewer_key'>#{ key }</span>: <span class='objectViewer_value'>#{ value_str }</span>",
                        attr:
                            object_key: key
                if exports.hasChildren value
                    ret.state = "closed"
                    ret.children = []
                ret
            get_children = (parent) ->
                kl = null
                try
                    kl = Object.getOwnPropertyNames parent
                catch e
                    if not o? then return []
                    kl = (key for own key of o)
                if parent? and parent['__proto__']? 
                    kl.push('__proto__')
                (mk_node(key, parent[key]) for key in kl)

            get_node_data = (nodeid) ->
                nodedata = null
                if nodeid == -1
                    nodedata = mk_node 'Object', obj
                    nodedata.state = "open"
                    delete nodedata.data.attr.object_key
                    nodedata.children = get_children obj
                else
                    keylist = ($(i).attr('object_key') for i in nodeid.parents('li').children('a') when ($(i).attr('object_key') != undefined)).reverse()
                    keylist.push(nodeid.find('a').attr('object_key'))
                    node = obj
                    node = ((node = node[k]) for k in keylist)[keylist.length - 1]
                    nodedata = get_children node
                nodedata

            object_viewer = $("<div class='eval_result'></div>")
            object_viewer.jstree 
                json_data:
                    data: (nodeid, cb) -> 
                        nodedata = get_node_data nodeid
                        cb nodedata
                core:
                    html_titles: true
                plugins : [ "themes", "json_data", "crrm" ]
            object_viewer
    # put objectViewer in lib
    dt.lib.ov = exports.objectViewer
    exports        
