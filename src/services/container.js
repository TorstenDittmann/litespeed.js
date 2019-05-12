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
            return function () {

            };
        }

        let self = this;
        let FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
        let text = target.toString() || '';
        let args = text.match(FN_ARGS)[1].split(',');

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

        path = path
            .replace(as + '.', prefix + '.')
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

        // Set new value
        if(value) {
            object[path.shift()] = value;
            return true;
        }

        // Return null when missing path
        if(!object) {
            return null;
        }

        let shift = path.shift();

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

        let event = path.replace(as + '.', prefix + '.') + '.changed';
        let service = event.split('.').slice(0,1).pop();

        listeners[service] = listeners[service] || {};

        listeners[service][event] = true;

        let printer = function () {
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

    set('container', container, true, false, false);

    return container;
}();