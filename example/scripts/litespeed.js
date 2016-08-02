/**
 * Container
 *
 * Uses as container for application services
 */
var container = function() {

    // FIXME add support for singelton

    var stock = [];

    return {

        /**
         * Register
         *
         * Adds a new service definition to application services stack.
         *
         * @param name string
         * @param object callback|object
         * @param singelton bool
         * @returns container
         */
        register: function(name, object, singelton) {
            if(typeof name !== 'string') {
                throw new Error('var name must be of type string');
            }

            if(typeof object !== 'function' && (typeof object !== 'object')) {
                throw new Error('var object "' + name + '" must be of type function or object');
            }

            if(typeof singelton !== 'boolean') {
                throw new Error('var singelton "' + name + '" must be of type boolean');
            }

            stock[name] = {
                name: name,
                object: object,
                singleton: singelton,
                instance: null
            };

            return this;
        },

        /**
         * Get Service
         *
         * Return service instance
         *
         * @param name
         * @returns {*}
         */
        get: function(name) {
            var service = (undefined !== stock[name]) ? stock[name] : null;

            if(null === service) {
                throw new Error('service \'' + name + '\' is not registered');
            }

            if(service.instance === null) {
                var instance  = (typeof service.object == 'function') ? service.object() : service.object;

                if(service.singleton) {
                    service.instance = instance;
                }

                return instance;
            }

            return service.instance;
        }
    }
}();
var http = function() {

    /**
     *
     * @param method string
     * @param url string
     * @param headers string
     * @param body string
     * @returns Promise
     */
    var request = function(method, url, headers, body) {

        var host    = '';

        if(-1 == ['GET', 'POST', 'PUT', 'DELETE', 'TRACE', 'HEAD', 'OPTIONS', 'CONNECT', 'PATCH'].indexOf(method)) {
            throw new Error('var method must contain a valid HTTP method name');
        }

        if(typeof url !== 'string') {
            throw new Error('var url must be of type string');
        }

        if(typeof headers !== 'object') {
            throw new Error('var headers must be of type object');
        }

        if(typeof url !== 'string') {
            throw new Error('var url must be of type string');
        }

        return new Promise(
            function(resolve, reject) {

                var xmlhttp = new XMLHttpRequest();

                xmlhttp.open(method, url, true);

                // Set Headers
                for (var key in headers) {
                    if (headers.hasOwnProperty(key)) {
                        xmlhttp.setRequestHeader(key, headers[key]);
                    }
                }

                xmlhttp.onload = function() {
                    if (4 == xmlhttp.readyState && 200 == xmlhttp.status) {
                        resolve(xmlhttp.response);
                    }

                    reject(Error(xmlhttp.statusText));
                };

                // Handle network errors
                xmlhttp.onerror = function() {
                    reject(Error("Network Error"));
                };

                xmlhttp.send(body);
            }
        )
    };

    return {
        'get': function(url) {
            return request('GET', url, {}, '')
        },
        'post': function(url, headers, params) {
            return request('POST', url, {'Content-type': 'application/x-www-form-urlencoded'}, '')
        },
        'put': function(url) {
            return request('PUT', url, {}, '')
        },
        'delete': function(url) {
            return request('DELETE', url, {}, '')
        }
    }
}();
Object.path = function(object, path, value) {
    path = path.split('.');

    // Iterating path
    while (path.length > 1) {
        object = object[path.shift()];
    }

    // Set new value
    if(undefined !== value) {
        return object[path.shift()] = value;
    }

    // Return null when missing path
    if(undefined == object) {
        return null;
    }

    return object[path.shift()];
};

Object.merge = function(obj1, obj2) {
    var obj3 = {}, attrname;

    for (attrname in obj1) {
        if (obj1.hasOwnProperty(attrname)) {
            obj3[attrname] = obj1[attrname];
        }
    }

    for (attrname in obj2) {
        if (obj2.hasOwnProperty(attrname)) {
            obj3[attrname] = obj2[attrname];
        }
    }

    return obj3;
};

Object.observe = function(obj) {
    var keys = Object.keys(obj);

    for(var k=0; k < keys.length; k++) {

        var key = keys[k];

        (function(key){

            var keyName = key+'value';
            var oldKeyName = 'old'+key+'value';

            obj[oldKeyName] = obj[key];

            Object.defineProperty(obj, key, {
                get: function() { return this[keyName]; },
                set: function(newValue) {

                    console.log('old-value: ',this[oldKeyName]);
                    console.log('new-value: ',newValue);

                    this[keyName] = newValue;
                    this[oldKeyName] = this[keyName];

                }
            });



        })(key);
    }
};

Object.observeNested = function(obj, callback) {
    Object.observe(obj, function(changes){
        changes.forEach(function(change) {
            if (typeof obj[change.name] == 'object') {
                Object.observeNested(obj[change.name], callback);
            }
        });

        callback.apply(this, arguments);
    });
};

/**
 * Router
 *
 * Holds application states and match logic
 */
var router = function() {

    var states  = [],
        before  = function() {},
        after   = function() {}
    ;

    return {

        /**
         * State
         *
         * Adds a new application state.
         *
         * @param path string
         * @param view object
         * @returns router
         */
        state: function(path, view) {

            /**
             * Validation
             */
            if(typeof path !== 'string') {
                throw new Error('var path must be of type string');
            }

            if(typeof view !== 'object') {
                throw new Error('var view must be of type object');
            }

            states[states.length++] = {/* string */ path: path, /* object */ view: view};

            return this;
        },

        /**
         * Match
         *
         * Compare current location and application states to find a match.
         *
         * @param url string
         * @return value object|null
         */
        match: function(url) {
            var result = null;

            for (var i = 0; i < states.length; i++) {
                var value   = states[i],
                    match   = new RegExp(value.path.replace(/:[^\s/]+/g, '([\\w-]+)'));

;                if('/' == value.path && value.path != url) {
                    continue;
                }

                if(url.match(match)) {
                    result = value;
                }
            }

            return result
        }
    }

}();
/**
 * View
 *
 * Manage application scopes and different views
 */
var view = function() {

    var stock = {},
        i = 0;

    return {

        /**
         * Add View
         *
         * Adds a new comp definition to application comp stack.
         *
         * @param object
         * @returns view
         */
        add: function(object) {

            if(typeof object !== 'object') {
                throw new Error('var object must be of type object');
            }

            var key = (object.singelton) ? object.name : object.name + '-' + i++;

            stock[key] = object;

            return this;
        },

        /**
         * Render
         *
         * Render all view components in a given scope.
         *
         * @param scope
         * @param container
         * @returns view
         */
        render: function(scope, container) {
            var view = this;

            for (var key in stock) { // Iterate all registered views
                if (stock.hasOwnProperty(key)) {
                    var value       = stock[key],
                        elements    = scope.querySelectorAll('[' + value.selector + ']'),
                        postRender  = function(view, element, container) {
                            view.controller(element, container); // Execute controller

                            if(true !== value.repeat) { // Remove view that should not repeat itself
                                element.removeAttribute(view.selector);
                            }
                        };

                    for (var i = 0; i < elements.length; i++) {
                        var element = elements[i];

                        if(!value.template) {
                            postRender(value, element, container);
                            continue;
                        }

                        // Load new view template
                        var result = http
                            .get(value.template)
                            .then(function(element, value) {
                                return function(data){
                                    element.innerHTML = data;

                                    postRender(value, element, container);

                                    // re-render specific scope
                                    view.render(element, container);
                                }
                            }(element, value),
                            function(error) {
                                console.error("Failed!", error);
                            }
                        );

                    }
                }
            }

            return this;
        }
    }
}();
var app = function() {
    return {
        run: function(window) {
            try {
                // Register all core services
                this.container
                    .register('window', window, true)
                    .register('view', view, true)
                    .register('router', router, true)
                    .register('http', http, true)
                ;

                // Trigger reclusive app rendering
                this.view.render(window.document, container);
            }
            catch (error) {
                //TODO add custom error handling
                console.error('error', error.message, error.stack, error.toString());
            }
        },
        container: container,
        view: view,
        http: http,
        router: router
    }
};
view.add({
    name: 'ls-app',
    selector: 'data-ls-app',
    template: false,
    repeat: true,
    controller: function(element, container) {
        var window  = container.get('window'),
            router  = container.get('router'),
            route   = router.match(window.location.pathname),
            view    = container.get('view'),
            http    = container.get('http'),
            scope   = {
                name: 'ls-scope',
                selector: 'data-ls-scope',
                template: false,
                repeat: true,
                controller: function() {},
                state: true
            },
            init    = function(route) {
                // Merge
                scope.template      = (undefined !== route.view.template) ? route.view.template : null;
                scope.controller    = (undefined !== route.view.controller) ? route.view.controller : function() {};
                scope.state         = (undefined !== route.view.state) ? route.view.state : true;

                view.render(element, container);
            };

        view.add(scope);

        window.document.addEventListener('click', function(event) { // Handle user navigation

            if(!event.target.href) { // Just a normal click not an href
                return false;
            }

            var route = router.match(event.target.href);

            if(null === route) { // No match. this link is not related to our app
                return false;
            }

            event.preventDefault(); // Stop normal browser behavior. Start to act as single page

            if(window.location == event.target.href) { // Same link. Don't re-execute a thing
                return false;
            }

            route.view.state = (undefined === route.view.state) ? true : route.view.state;

            if(true === route.view.state) {
                window.history.pushState({}, 'Unknown', event.target.href);
            }

            init(route);

            return true;
        });

        window.addEventListener('popstate', function(e) { // Handle back button behavior
            init(router.match(window.location.pathname));
        });

        init(router.match(window.location.pathname)); // Handle first start
    }
});
view.add({
    name: 'ls-bind',
    selector: 'data-ls-bind',
    template: false,
    controller: function(element, container) {
        var reference   = element.dataset['lsBind']
                .replace('[\'', '.')
                .replace('\']', '')
                .split('.'), // Make syntax consistent using only dot nesting
            service     = container.get(reference.shift()),
            path        = reference.join('.')
        ;

        if(
            element.tagName == 'INPUT' ||
            element.tagName == 'SELECT' ||
            element.tagName == 'BUTTON' ||
            element.tagName == 'TEXTAREA'
        ) {
            element.value = Object.path(service, path);
        }
        else {
            element.innerHTML = Object.path(service, path);
        }
    }
});
view.add({
    name: 'ls-eval',
    selector: 'data-ls-eval',
    template: false,
    controller: function(element, container) {
        var statement   = element.dataset['lsEval'];
        eval(statement);
    }
});
view.add({
    name: 'ls-loop',
    selector: 'data-ls-loop',
    template: false,
    controller: function(element) {
        var reference   = element.dataset['lsLoop']
                .replace('[\'', '.')
                .replace('\']', '')
                .split('.'), // Make syntax consistent using only dot nesting
            template    = element.innerHTML,
            service     = container.get(reference.shift()),
            path        = reference.join('.'),
            array       = Object.path(service, path)
        ;

        array = (null == array) ? [] : array; // Cast null to empty array

        var render = function(element, array, template) {
            var output = '';

            for (var prop in array) {
                if (!array.hasOwnProperty(prop)) {
                    continue
                }

                var keys = Object.keys(array[prop]);

                for (var key in keys) {
                    if (!keys.hasOwnProperty(key)) {
                        continue
                    }

                    template = template.replace('{{ element.' + keys[key] + ' }}', array[prop][keys[key]]);
                }

                output += template
                    .replace(/{{ /g, '{{')
                    .replace(/ }}/g, '}}')
                    .replace(/{{value}}/g, array[prop])
                    .replace(/{{key}}/g, prop)
                ;
            }

            element.innerHTML = output;
        };

        element.innerHTML = '';

        if(typeof array !== 'array' && typeof array !== 'object') {
            throw new Error('Reference \'' + path + '\' value must be array or object. ' + (typeof array) + ' given');
        }

        render(element, array, template);
/*

        var dragSrcEl = null;

        function handleDragStart(e) {
            // Target (this) element is the source node.
            this.style.opacity = '0.4';

            dragSrcEl = this;

            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', this.innerHTML);
        }

        function handleDragOver(e) {
            if (e.preventDefault) {
                e.preventDefault(); // Necessary. Allows us to drop.
            }

            e.dataTransfer.dropEffect = 'move';  // See the section on the DataTransfer object.

            return false;
        }

        function handleDragEnter(e) {
            // this / e.target is the current hover target.
            this.classList.add('over');
        }

        function handleDragLeave(e) {
            this.classList.remove('over');  // this / e.target is previous target element.
        }

        function handleDrop(e) {
            // this/e.target is current target element.

            if (e.stopPropagation) {
                e.stopPropagation(); // Stops some browsers from redirecting.
            }

            // Don't do anything if dropping the same column we're dragging.
            if (dragSrcEl != this) {
                // Set the source column's HTML to the HTML of the column we dropped on.
                dragSrcEl.innerHTML = this.innerHTML;
                this.innerHTML = e.dataTransfer.getData('text/html');
            }

            return false;
        }

        function handleDragEnd(e) {
            this.style.opacity = '1';

            // this/e.target is the source node.

            [].forEach.call(element.children, function (node) {
                node.classList.remove('over');
            });
        }

        var start = function() {
            [].forEach.call(element.children, function(node) {
                node.addEventListener('dragstart',  handleDragStart, false);
                node.addEventListener('dragenter',  handleDragEnter, false);
                node.addEventListener('dragover',   handleDragOver, false);
                node.addEventListener('dragleave',  handleDragLeave, false);
                node.addEventListener('drop',       handleDrop, false);
                node.addEventListener('dragend',    handleDragEnd, false);
            });
        };

        start();
*/
    }
});
/**
 * Code solution inspired by:
 * http://codereview.stackexchange.com/questions/13443/jquery-plugin-node-tojson-convert-html-form-to-js-object
 */
view.add({
    name: 'ls-submit',
    selector: 'data-ls-submit',
    template: false,
    controller: function(element) {
        function parse(element) {
            var elements = element.children;

            if(!elements.length) {
                return element.value;
            }
            else if('SELECT' == element.tagName) {
                return element.children[element.selectedIndex].value;
            }

            var json = {};

            Array.prototype.forEach.call(elements, function(value, key) {
                if (!value.hasAttribute('name')) {
                    return;
                }

                var name        = value.getAttribute('name');
                var type        = value.getAttribute('type');
                var siblings    = 0;

                for (var i = 0; i < value.parentNode.children.length; i++) {
                    if(value.parentNode.children[i].getAttribute('name') == name) {
                        siblings++;
                    }
                }

                if(1 < siblings) { // Handle array
                    if( type == 'checkbox' && !value.checked) return true;
                    if( type == 'radio' && !value.checked) return true;
                    if(!json[name]) json[name] = [];

                    json[name].push(parse(value));
                }
                else { // Handle single key - value pair
                    json[name] = parse(value);
                }
            });

            return json;
        }

        element.addEventListener('submit', function(event) {
            event.preventDefault();
            console.log(parse(element));
        });
    }
});
view.add({
    name: 'ls-placeholder',
    selector: 'data-ls-placeholder',
    template: false,
    controller: function(element, container) {
        var reference   = element.dataset['lsPlaceholder']
            .replace('[\'', '.')
            .replace('\']', '')
            .split('.'), // Make syntax consistent using only dot nesting
            service     = container.get(reference.shift()),
            path        = reference.join('.');

        element.innerHTML = Object.path(service, path);
    }
});