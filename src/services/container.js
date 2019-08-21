window.ls = window.ls || {};

/**
 * Container
 *
 * Uses as container for application services
 */
window.ls.container = function() {

    let stock = {};

    let listeners = {};

    /**
     * Set Service
     *
     * Adds a new service definition to application services stack.
     *
     * @param name string
     * @param object callback|object
     * @param singleton bool
     * @param watch bool
     * @returns container
     */
    let set = function(name, object, singleton, watch = true) {
        if(typeof name !== 'string') {
            throw new Error('var name must be of type string');
        }

        if(typeof singleton !== 'boolean') {
            throw new Error('var singleton "' + singleton + '" of service "' + name + '" must be of type boolean');
        }

        stock[name] = {
            name: name,
            object: object,
            singleton: singleton,
            instance: null,
            watch: watch,
        };

        if(!watch) {
            return this;
        }

        let binds = listeners[name] || {};

        for (let key in binds) {
            if (binds.hasOwnProperty(key)) {
                document.dispatchEvent(new CustomEvent(key));
            }
        }

        return this;
    };

    /**
     * Get Service
     *
     * Return service instance
     *
     * @param name
     * @returns {*}
     */
    let get = function(name) {
        let service = (undefined !== stock[name]) ? stock[name] : null;

        if(null == service) {
            return null;
        }

        if(service.instance) {
            return service.instance;
        }

        let instance = (typeof service.object === 'function') ? this.resolve(service.object) : service.object;
        let skip = false;

        if(service.watch && name !== 'window' && name !== 'document' && name !== 'element' && typeof instance === 'object' && instance !== null) {
            let handler = {
                name: service.name,

                watch: function() {},

                get: function(target, key) {
                    if(key === "__name") {
                        return this.name;
                    }

                    if(key === "__watch") {
                        return this.watch;
                    }

                    if(key === "__proxy") {
                        return true;
                    }

                    if (typeof target[key] === 'object' && target[key] !== null && !target[key].__proxy) {
                        let handler = Object.assign({}, this);

                        handler.name = handler.name + '.' + key;

                        return new Proxy(target[key], handler)
                    }
                    else {
                        return target[key];
                    }
                },
                set: function(target, key, value, receiver) {
                    if(key === "__name") {
                        return this.name = value;
                    }

                    if(key === "__watch") {
                        return this.watch = value;
                    }

                    target[key] = value;

                    let path = receiver.__name + '.' + key;

                    //console.log('triggered', path + '.changed', key, value);

                    document.dispatchEvent(new CustomEvent(path + '.changed'));

                    if(skip) { // Avoid endless loop, when watch callback triggers changes itself
                        return true;
                    }

                    skip = true;

                    container.set('$prop', key, true);
                    container.set('$value', value, true);

                    container.resolve(this.watch);

                    container.set('$key', null, true);
                    container.set('$value', null, true);

                    skip = false;

                    return true;
                },
            };

            instance = new Proxy(instance, handler);
        }

        if(service.singleton) {
            service.instance = instance;
        }

        return instance;
    };

    /**
     * Resolve Callback
     *
     * Resolves callback dependencies and passes them as arguments to given callback
     *
     * @returns {*}
     * @param target callback
     */
    let resolve = function(target) {
        if(!target) {
            return () => {};
        }

        /*
        let self = this;
        let FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
        let text = target.toString() || '';
        let args = text.match(FN_ARGS)[1].split(',');*/

        let self = this;

        const REGEX_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
        const REGEX_FUNCTION_PARAMS = /(?:\s*(?:function\s*[^(]*)?\s*)((?:[^'"]|(?:(?:(['"])(?:(?:.*?[^\\]\2)|\2))))*?)\s*(?=(?:=>)|{)/m;
        const REGEX_PARAMETERS_VALUES = /\s*([\w\\$]+)\s*(?:=\s*((?:(?:(['"])(?:\3|(?:.*?[^\\]\3)))((\s*\+\s*)(?:(?:(['"])(?:\6|(?:.*?[^\\]\6)))|(?:[\w$]*)))*)|.*?))?\s*(?:,|$)/gm;

        /**
         * Original Solution From:
         * @see https://stackoverflow.com/a/41322698/2299554
         *  Notice: this version add support for $ sign in arg name.
         *
         * Retrieve a function's parameter names and default values
         * Notes:
         *  - parameters with default values will not show up in transpiler code (Babel) because the parameter is removed from the function.
         *  - does NOT support inline arrow functions as default values
         *      to clarify: ( name = "string", add = defaultAddFunction )   - is ok
         *                  ( name = "string", add = ( a )=> a + 1 )        - is NOT ok
         *  - does NOT support default string value that are appended with a non-standard ( word characters or $ ) variable name
         *      to clarify: ( name = "string" + b )         - is ok
         *                  ( name = "string" + $b )        - is ok
         *                  ( name = "string" + b + "!" )   - is ok
         *                  ( name = "string" + λ )         - is NOT ok
         * @param {function} func
         * @returns {Array} - An array of the given function's parameter [key, default value] pairs.
         */
        function getParams(func) {
            let functionAsString = func.toString();
            let params = [];
            let match;

            functionAsString = functionAsString.replace(REGEX_COMMENTS, '');
            functionAsString = functionAsString.match(REGEX_FUNCTION_PARAMS)[1];

            if (functionAsString.charAt(0) === '(') {
                functionAsString = functionAsString.slice(1, -1);
            }

            while (match = REGEX_PARAMETERS_VALUES.exec(functionAsString)) {
                //params.push([match[1], match[2]]); // with default values
                params.push(match[1]); // only with arg name
            }

            return params;
        }

        let args = getParams(target);

        return target.apply(target, args.map(function(value) {
            return self.get(value.trim());
        }));
    };

    /**
     * Get Path
     *
     * Return value from a service by a given path, nesting is supported by using the '.' delimiter.
     * When passing a value parameter the given path will be set with the new value. Use 'as' and 'prefix' parameters to define the service namespace.
     *
     * @returns {*}
     * @param path string
     * @param value mixed
     * @param as string
     * @param prefix string
     */
    let path = function(path, value, as, prefix) {
        as = (as) ? as : container.get('$as');
        prefix = (prefix) ? prefix : container.get('$prefix');

        path = ((path.indexOf('.') > -1) ? path.replace(as + '.', prefix + '.') : path.replace(as, prefix))
            .split('.');

        let name    = path.shift();
        let object  = this.get(name);
        let result  = null;

        // Iterating path
        while (path.length > 1) {
            if(!object) {
                return null;
            }

            object = object[path.shift()];
        }

        let shift = path.shift();

        // Set new value
        if(value !== null && value !== undefined && object && shift && object[shift]) { // Allow false or empty as legitimate input values
            object[shift] = value;
            return true;
        }

        // Return null when missing path
        if(!object) {
            return null;
        }

        if(!shift) {
            result = object;
        }
        else {
            return object[shift];
        }

        return result;
    };

    /**
     * Bind
     *
     * Binds an element to a path change. Every time a new value is set to given path the callback you passes to the function will be executed.
     * Use 'as' and 'prefix' parameters to define the service namespace.
     *
     * @returns {*}
     * @param element
     * @param path string
     * @param callback callback
     * @param as string
     * @param prefix string
     */
    let bind = function(element, path, callback, as, prefix) {
        as = (as) ? as : container.get('$as');
        prefix = (prefix) ? prefix : container.get('$prefix');

        let event = ((path.indexOf('.') > -1) ? path.replace(as + '.', prefix + '.') : path.replace(as, prefix)) + '.changed';
        let service = event.split('.').slice(0,1).pop();

        listeners[service] = listeners[service] || {};

        listeners[service][event] = true;

        let printer = () => {
            if(!document.body.contains(element)) { // Clean DOM
                element = null;
                document.removeEventListener(event, printer, false);

                return false;
            }

            //console.log('registered', event, element);

            callback();
        };

        document.addEventListener(event, printer);
    };

    let container = {
        set: set,
        get: get,
        resolve: resolve,
        path: path,
        bind: bind,
        stock: stock,
        listeners: listeners,
    };

    set('container', container, true, false);

    return container;
}();