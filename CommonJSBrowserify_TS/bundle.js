(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/// <reference path="../node_modules/fluss/fluss.d.ts" />
/**
 * Created by Stephan on 11.01.2015.
 */
"use strict";
var Fluss = require("fluss");
var array = Fluss.Store.array();
array.newItems.forEach(function (update) {
    document.write(update.value + " was added.<br>");
});
document.write("<h1>fluss - commonJS, browserify, Typescript</h1>");
array.push("One");
array.push(2);

//# sourceMappingURL=main.js.map
},{"fluss":2}],2:[function(require,module,exports){
/**
 * Created by Stephan.Smola on 30.10.2014.
 */
"use strict";
var Fluss;
(function (Fluss) {
    var Tools;
    (function (Tools) {
        /**
         * Determine the screen position and size of an element in the DOM
         * @param element
         * @returns {{x: number, y: number, w: number, h: number}}
         */
        function elementPositionAndSize(element) {
            var rect = element.getBoundingClientRect();
            return { x: rect.left, y: rect.top, w: rect.width, h: rect.height };
        }
        Tools.elementPositionAndSize = elementPositionAndSize;
        var pfx = [
            { id: "webkit", camelCase: true },
            { id: "MS", camelCase: true },
            { id: "o", camelCase: true },
            { id: "", camelCase: false }
        ];
        /**
         * Add event listener for prefixed events. As the camel casing of the event listeners is different
         * across browsers you need to specify the type camelcased starting with a capital letter. The function
         * then takes care of the browser specifics.
         *
         * @param element
         * @param type
         * @param callback
         */
        function addPrefixedEventListener(element, type, callback) {
            for (var p = 0; p < pfx.length; p++) {
                if (!pfx[p].camelCase)
                    type = type.toLowerCase();
                element.addEventListener(pfx[p].id + type, callback, false);
            }
        }
        Tools.addPrefixedEventListener = addPrefixedEventListener;
        /**
         * Convenience method for calling callbacks
         * @param cb    The callback function to call
         */
        function callCallback(cb) {
            var any = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                any[_i - 1] = arguments[_i];
            }
            if (cb) {
                if (typeof (cb) == "function") {
                    var args = [];
                    for (var i = 1; i < arguments.length; i++) {
                        args.push(arguments[i]);
                    }
                    return cb.apply(this, args);
                }
                else {
                    throw new Error("Callback is not a function!");
                }
            }
        }
        Tools.callCallback = callCallback;
        /**
         * Check if something is an array.
         * @param thing
         * @returns {boolean}
         */
        function isArray(thing) {
            return Object.prototype.toString.call(thing) === '[object Array]';
        }
        Tools.isArray = isArray;
        var OID_PROP = "__ID__";
        var oids = 10000;
        /**
         * Create and return a unique id on a JavaScript object. This adds a new property
         * __ID__ to that object. Ids are numbers.
         *
         * The ID is created the first time this function is called for that object and then
         * will simply be returned on all subsequent calls.
         *
         * @param obj
         * @returns {any}
         */
        function oid(obj) {
            if (obj) {
                if (!obj.hasOwnProperty(OID_PROP)) {
                    obj[OID_PROP] = oids++;
                }
                return obj[OID_PROP];
            }
        }
        Tools.oid = oid;
        function applyMixins(derivedCtor, baseCtors) {
            baseCtors.forEach(function (baseCtor) {
                Object.getOwnPropertyNames(baseCtor).forEach(function (name) {
                    derivedCtor.prototype[name] = baseCtor[name];
                });
            });
        }
        /**
         * Use this to subclass a typescript class using plain JavaScript. Spec is an object
         * containing properties and methods of the new class. Methods in spec will override
         * methods in baseClass.
         *
         * You will NOT be able to make super calls in the subclass.
         *
         * @param spec
         * @param baseClass
         * @returns {any}
         */
        function subclass(spec, baseClass) {
            var constructor;
            if (spec.hasOwnProperty("constructor")) {
                constructor = spec["constructor"];
            }
            else {
                constructor = function () {
                    baseClass.prototype.constructor.apply(this, arguments);
                };
            }
            constructor.prototype = Object.create(baseClass.prototype);
            applyMixins(constructor, [spec]);
            return constructor;
        }
        Tools.subclass = subclass;
    })(Tools = Fluss.Tools || (Fluss.Tools = {}));
})(Fluss || (Fluss = {}));
if (typeof exports !== "undefined") {
    exports.Tools = Fluss.Tools;
}
if (typeof this["define"] === "function") {
    this["define"]([], function () {
        return Fluss.Tools;
    });
}

/**
 * Created by Stephan.Smola on 28.10.2014.
 */
"use strict";
var Fluss;
(function (Fluss) {
    var Emitter;
    (function (_Emitter) {
        /**
         * An event-emitter
         */
        var Emitter = (function () {
            function Emitter() {
            }
            Emitter.prototype.subscribe = function (event, handler) {
                if (!this._eventHandlers) {
                    this._eventHandlers = {};
                }
                if (!this._eventHandlers[event]) {
                    this._eventHandlers[event] = [];
                }
                this._eventHandlers[event].push(handler);
            };
            Emitter.prototype.unsubscribe = function (event, handler) {
                if (!this._eventHandlers) {
                    return;
                }
                if (this._eventHandlers[event]) {
                    this._eventHandlers[event].splice(this._eventHandlers[event].indexOf(handler), 1);
                }
            };
            Object.defineProperty(Emitter.prototype, "eventHandlers", {
                get: function () {
                    return this._eventHandlers;
                },
                enumerable: true,
                configurable: true
            });
            Emitter.prototype.emit = function (event) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                var that = this;
                if (this._eventHandlers && this._eventHandlers[event]) {
                    this._eventHandlers[event].forEach(function (handler) {
                        handler.apply(that, args);
                    });
                }
            };
            Emitter.prototype.relay = function (emitter, subscribingEvent, emittingEvent) {
                var that = this;
                emitter.subscribe(subscribingEvent, function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i - 0] = arguments[_i];
                    }
                    that.emit.apply(that, [emittingEvent].concat(args));
                });
            };
            return Emitter;
        })();
        _Emitter.Emitter = Emitter;
    })(Emitter = Fluss.Emitter || (Fluss.Emitter = {}));
})(Fluss || (Fluss = {}));
if (typeof exports !== "undefined") {
    exports.Emitter = Fluss.Emitter;
}
if (typeof this["define"] === "function") {
    this["define"]([], function () {
        return Fluss.Emitter;
    });
}

/**
 * Created by Stephan on 27.12.2014.
 *
 * A simple implementation of a collection stream that supports reactive patterns.
 *
 */
"use strict";
var Fluss;
(function (Fluss) {
    var Stream;
    (function (_Stream) {
        /**
         * Base implementation of the collection stream
         */
        var Stream = (function () {
            function Stream(_name) {
                this._name = _name;
                this._buffer = [];
                this._methods = [];
                this._errorMethods = [];
                this._closeMethods = [];
                this._closed = false;
                this._length = 0;
                this._maxLength = 0;
                this._nextStreams = [];
            }
            Object.defineProperty(Stream.prototype, "name", {
                get: function () {
                    return this._name;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Stream.prototype, "length", {
                get: function () {
                    return this._length;
                },
                enumerable: true,
                configurable: true
            });
            Stream.prototype.callCloseMethods = function () {
                var that = this;
                this._closeMethods.forEach(function (m) {
                    m.call(that);
                });
            };
            Stream.prototype.close = function () {
                if (!this._closed) {
                    this._closed = true;
                    this.callCloseMethods();
                    this.dispose();
                }
            };
            Stream.prototype.dispose = function () {
                this.close();
                this._methods = [];
                this._buffer = [];
                this._closeMethods = [];
                this._errorMethods = [];
            };
            Stream.prototype.times = function (maxLength) {
                this._maxLength = maxLength;
                return this;
            };
            Stream.prototype.until = function (stream) {
                var that = this;
                if (stream) {
                    stream.forEach(function () {
                        that.close();
                    });
                }
                return this;
            };
            Object.defineProperty(Stream.prototype, "closed", {
                get: function () {
                    return this._closed;
                },
                enumerable: true,
                configurable: true
            });
            Stream.prototype.addToBuffer = function (value) {
                this._buffer.unshift(value);
            };
            Stream.prototype.processBuffer = function (buffer, methods, baseIndex) {
                if (this._closed)
                    return null;
                if (!methods.length)
                    return null;
                var l = buffer.length;
                var that = this;
                var errors = [];
                while (l--) {
                    var value = buffer.pop();
                    methods.forEach(function (m, i) {
                        try {
                            m.call(that, value, i + baseIndex);
                        }
                        catch (e) {
                            errors.push(e);
                        }
                    });
                }
                return errors;
            };
            Stream.prototype.processBuffers = function () {
                var errors = this.processBuffer(this._buffer, this._methods, this._length - this._buffer.length);
                if (errors && errors.length) {
                    if (this._errorMethods.length) {
                        this.processBuffer(errors, this._errorMethods, 0);
                    }
                    else {
                        errors.forEach(function (e) {
                            throw e;
                        });
                    }
                }
            };
            Stream.prototype.addMethod = function (method) {
                var firstMethod = this._methods.length === 0;
                this._methods.push(method);
                if (firstMethod) {
                    this.processBuffers();
                }
            };
            Stream.prototype.removeMethod = function (method) {
                this._methods.indexOf(method);
            };
            Stream.prototype.addErrorMethod = function (method) {
                this._errorMethods.push(method);
            };
            Stream.prototype.addCloseMethod = function (method) {
                if (this.closed) {
                    method.call(this);
                }
                else {
                    this._closeMethods.push(method);
                }
            };
            Stream.prototype.push = function (value) {
                if (!this._closed) {
                    this.addToBuffer(value);
                    this._length++;
                    this.processBuffers();
                    if (this._length === this._maxLength) {
                        this.close();
                    }
                }
            };
            Stream.prototype.pushError = function (error) {
                // If we can't handle the error ourselves we throw it again. That will give preceding streams the chance to handle these
                if (!this._errorMethods || !this._errorMethods.length) {
                    throw error;
                }
                this.processBuffer([error], this._errorMethods, 0);
            };
            Stream.prototype.forEach = function (method) {
                this.addMethod(method);
                return this;
            };
            Stream.prototype.registerNextStream = function (nextStream) {
                var that = this;
                this._nextStreams.push(nextStream);
                nextStream.onClose(function () {
                    var i = that._nextStreams.indexOf(nextStream);
                    if (i !== -1) {
                        that._nextStreams.splice(i, 1);
                        if (!that._nextStreams.length) {
                            that.close();
                        }
                    }
                });
            };
            Stream.prototype.addMethodToNextStream = function (nextStream, method, onClose) {
                var that = this;
                var fn = function (value, index) {
                    try {
                        method.call(that, value, index);
                    }
                    catch (e) {
                        nextStream.pushError(e);
                    }
                };
                this.addMethod(fn);
                nextStream.onClose(function () {
                    that.removeMethod(fn);
                });
                this.registerNextStream(nextStream);
                if (!onClose) {
                    this.onClose(function () {
                        nextStream.close();
                    });
                }
                else {
                    this.onClose(onClose);
                }
            };
            Stream.prototype.filter = function (method) {
                var nextStream = new Stream(this._name + ".filter");
                var that = this;
                if (typeof method === "function") {
                    this.addMethodToNextStream(nextStream, function (value, index) {
                        if (method.call(that, value, index)) {
                            nextStream.push(value);
                        }
                    });
                }
                else {
                    this.addMethodToNextStream(nextStream, function (value) {
                        if (method == value) {
                            nextStream.push(value);
                        }
                    });
                }
                if (this._closed) {
                    nextStream.close();
                }
                return nextStream;
            };
            Stream.prototype.map = function (method) {
                var nextStream = new Stream(this._name + ".map");
                var that = this;
                if (typeof method === "function") {
                    this.addMethodToNextStream(nextStream, function (value, index) {
                        nextStream.push(method.call(that, value, index));
                    });
                }
                else {
                    this.addMethodToNextStream(nextStream, function (value) {
                        nextStream.push(method);
                    });
                }
                if (this._closed) {
                    nextStream.close();
                }
                return nextStream;
            };
            Stream.prototype.scan = function (method, seed) {
                var nextStream = new Stream(this._name + ".scan");
                var that = this;
                var scanned = seed;
                this.addMethodToNextStream(nextStream, function (value) {
                    scanned = method.call(that, scanned, value);
                    nextStream.push(scanned);
                });
                nextStream.push(scanned);
                if (this._closed) {
                    nextStream.close();
                }
                return nextStream;
            };
            Stream.prototype.reduce = function (method, seed) {
                var nextStream = new Stream(this._name + ".reduce");
                var that = this;
                var reduced = seed;
                this.addMethodToNextStream(nextStream, function (value) {
                    reduced = method.call(that, reduced, value);
                }, function () {
                    nextStream.push(reduced);
                    nextStream.close();
                });
                if (this._closed) {
                    nextStream.close();
                }
                this.registerNextStream(nextStream);
                return nextStream;
            };
            Stream.prototype.concat = function (stream) {
                var nextStream = new Stream(this._name + ".concat");
                var buffer = null;
                // When this is already closed, we only care for the other stream
                if (!this._closed) {
                    buffer = [];
                }
                else {
                    if (stream.closed) {
                        nextStream.close();
                    }
                }
                // We need to buffer, because this may not be the first
                // method attached to the stream. Otherwise any data that
                // is pushed to stream before the original is closed would
                // be lost for the concat.
                stream.forEach(function (value) {
                    if (buffer) {
                        buffer.push(value);
                    }
                    else {
                        nextStream.push(value);
                    }
                });
                stream.onClose(function () {
                    if (!buffer) {
                        nextStream.close();
                    }
                });
                this.addMethodToNextStream(nextStream, function (value) {
                    nextStream.push(value);
                }, function () {
                    if (buffer) {
                        buffer.forEach(function (value) {
                            nextStream.push(value);
                        });
                    }
                    if (stream.closed) {
                        nextStream.close();
                    }
                    buffer = null;
                });
                if (this._closed && stream.closed) {
                    nextStream.close();
                }
                return nextStream;
            };
            Stream.prototype.concatAll = function () {
                var nextStream = new Stream(this._name + ".concatAll");
                var queue = [];
                var cursor = null;
                function nextInQueue() {
                    var l = queue.length;
                    while (l--) {
                        cursor = queue[l];
                        update();
                        if (cursor.done) {
                            queue.pop();
                        }
                        else {
                            update();
                            break;
                        }
                    }
                }
                function update() {
                    if (cursor) {
                        var l = cursor.data.length;
                        while (l--) {
                            nextStream.push(cursor.data.pop());
                        }
                    }
                }
                function concatStream(stream) {
                    var subBuffer = {
                        data: [],
                        done: false
                    };
                    queue.unshift(subBuffer);
                    stream.forEach(function (value) {
                        subBuffer.data.unshift(value);
                        update();
                    });
                    stream.onClose(function () {
                        subBuffer.done = true;
                        nextInQueue();
                    });
                    if (queue.length === 1) {
                        cursor = subBuffer;
                    }
                }
                this.forEach(function (subStream) {
                    concatStream(subStream);
                });
                this.onClose(function () {
                    nextStream.close();
                });
                if (this._closed) {
                    nextStream.close();
                }
                this.registerNextStream(nextStream);
                return nextStream;
            };
            Stream.prototype.combine = function (stream) {
                var that = this;
                var nextStream = new Stream(this._name + ".combine");
                this.forEach(function (value) {
                    nextStream.push(value);
                });
                stream.forEach(function (value) {
                    nextStream.push(value);
                });
                this.onClose(function () {
                    if (stream.closed) {
                        nextStream.close();
                    }
                });
                stream.onClose(function () {
                    if (that._closed) {
                        nextStream.close();
                    }
                });
                if (this._closed && stream.closed) {
                    nextStream.close();
                }
                this.registerNextStream(nextStream);
                return nextStream;
            };
            Stream.prototype.onClose = function (method) {
                this.addCloseMethod(method);
                return this;
            };
            Stream.prototype.onError = function (method) {
                this.addErrorMethod(method);
                return this;
            };
            return Stream;
        })();
        _Stream.Stream = Stream;
        /**
         * Create a new stream. The name is mostly for debugging purposes and can be omitted. It defaults to 'stream' then.
         * @param name
         * @returns {Stream}
         */
        function createStream(name) {
            return new Stream(name || "stream");
        }
        _Stream.createStream = createStream;
    })(Stream = Fluss.Stream || (Fluss.Stream = {}));
})(Fluss || (Fluss = {}));
if (typeof exports !== "undefined") {
    exports.Stream = Fluss.Stream;
}
if (typeof this["define"] === "function") {
    this["define"]([], function () {
        return Fluss.Stream;
    });
}

/// <reference path="./tools.ts" />
/// <reference path="./stream.ts" />
/**
 * Created by Stephan on 29.12.2014.
 */
"use strict";
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Fluss;
(function (Fluss) {
    var Store;
    (function (_Store) {
        /**
         * Test if something is a store.
         * @param thing
         * @returns {boolean}
         */
        function isStore(thing) {
            return thing instanceof RecordStore || thing instanceof ArrayStore || thing instanceof ImmutableRecord || thing instanceof ImmutableArray;
        }
        _Store.isStore = isStore;
        function createUpdateInfo(item, value, store, path, rootItem) {
            var r = {
                item: item,
                value: value,
                store: store
            };
            if (path) {
                r["path"] = path;
            }
            if (rootItem != null) {
                r["rootItem"] = rootItem;
            }
            else {
                r["rootItem"] = item;
            }
            return r;
        }
        var Store = (function () {
            function Store() {
                this._addItemsStreams = [];
                this._removeItemsStreams = [];
                this._updateStreams = [];
                this._disposingStreams = [];
            }
            Object.defineProperty(Store.prototype, "isImmutable", {
                get: function () {
                    return false;
                },
                enumerable: true,
                configurable: true
            });
            Store.prototype.removeStream = function (list, stream) {
                var i = list.indexOf(stream);
                if (i !== -1) {
                    list.splice(i, 1);
                }
            };
            Object.defineProperty(Store.prototype, "newItems", {
                get: function () {
                    var that = this;
                    var s = Fluss.Stream.createStream("addProperty");
                    this._addItemsStreams.push(s);
                    s.onClose(function () {
                        that.removeStream(that._addItemsStreams, s);
                    });
                    return s;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Store.prototype, "removedItems", {
                get: function () {
                    var that = this;
                    var s = Fluss.Stream.createStream("removeProperty");
                    this._removeItemsStreams.push(s);
                    s.onClose(function () {
                        that.removeStream(that._removeItemsStreams, s);
                    });
                    s.until(this.isDisposing);
                    return s;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Store.prototype, "updates", {
                get: function () {
                    var that = this;
                    var s = Fluss.Stream.createStream("updateProperty");
                    this._updateStreams.push(s);
                    s.onClose(function () {
                        that.removeStream(that._updateStreams, s);
                    });
                    return s;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Store.prototype, "allChanges", {
                get: function () {
                    return this.updates.combine(this.newItems).combine(this.removedItems);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Store.prototype, "isDisposing", {
                get: function () {
                    var that = this;
                    var s = Fluss.Stream.createStream("disposing");
                    this._disposingStreams.push(s);
                    return s;
                },
                enumerable: true,
                configurable: true
            });
            Store.prototype.disposeStreams = function (streamList) {
                streamList.forEach(function (stream) {
                    stream.dispose();
                });
                streamList = [];
            };
            Store.prototype.dispose = function () {
                this._disposingStreams.forEach(function (stream) {
                    stream.push(true);
                });
                this.disposeStreams(this._removeItemsStreams);
                this.disposeStreams(this._updateStreams);
                this.disposeStreams(this._addItemsStreams);
                this.disposeStreams(this._disposingStreams);
            };
            Object.defineProperty(Store.prototype, "immutable", {
                get: function () {
                    return null;
                },
                enumerable: true,
                configurable: true
            });
            Store.prototype.item = function (value) {
                return value;
            };
            return Store;
        })();
        /**
         * Base class for immutable stores.
         */
        var ImmutableStore = (function (_super) {
            __extends(ImmutableStore, _super);
            function ImmutableStore() {
                _super.apply(this, arguments);
            }
            return ImmutableStore;
        })(Store);
        var RecordStore = (function (_super) {
            __extends(RecordStore, _super);
            function RecordStore(initial) {
                _super.call(this);
                this._data = {};
                this._subStreams = {};
                if (initial) {
                    for (var prop in initial) {
                        if (initial.hasOwnProperty(prop)) {
                            this.addItem(prop, initial[prop]);
                        }
                    }
                }
            }
            RecordStore.prototype.checkNameAllowed = function (name) {
                return true;
            };
            RecordStore.prototype.setupSubStream = function (name, value) {
                this.disposeSubStream(name);
                if (isStore(value)) {
                    var subStream;
                    var that = this;
                    subStream = value.updates;
                    subStream.forEach(function (update) {
                        var info = createUpdateInfo(update.item, update.value, update.store, update.path ? name + "." + update.path : name + "." + update.item, name);
                        that._updateStreams.forEach(function (stream) {
                            stream.push(info);
                        });
                    });
                    this._subStreams[name] = subStream;
                }
            };
            RecordStore.prototype.disposeSubStream = function (name) {
                var subStream = this._subStreams[name];
                if (subStream) {
                    subStream.dispose();
                }
            };
            RecordStore.prototype.addItem = function (name, initial) {
                if (!this.checkNameAllowed(name)) {
                    throw new Error("Name '" + name + "' not allowed for property of object store.");
                }
                var that = this;
                Object.defineProperty(this, name, {
                    configurable: true,
                    get: function () {
                        return that._data[name];
                    },
                    set: function (value) {
                        that._data[name] = value;
                        var updateInfo = createUpdateInfo(name, value, that);
                        that.setupSubStream(name, value);
                        that._updateStreams.forEach(function (stream) {
                            stream.push(updateInfo);
                        });
                    }
                });
                this._data[name] = initial;
                this.setupSubStream(name, initial);
                if (this._addItemsStreams) {
                    this._addItemsStreams.forEach(function (stream) {
                        stream.push(createUpdateInfo(name, initial, that));
                    });
                }
            };
            RecordStore.prototype.removeItem = function (name) {
                if (this._data.hasOwnProperty(name)) {
                    delete this[name];
                    delete this._data[name];
                    var that = this;
                    this.disposeSubStream(name);
                    this._removeItemsStreams.forEach(function (stream) {
                        stream.push(createUpdateInfo(name, null, that));
                    });
                }
                else {
                    throw new Error("Unknown property '" + name + "'.");
                }
            };
            Object.defineProperty(RecordStore.prototype, "immutable", {
                get: function () {
                    if (!this._immutable) {
                        this._immutable = new ImmutableRecord(this);
                    }
                    return this._immutable;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(RecordStore.prototype, "keys", {
                get: function () {
                    var r = [];
                    for (var k in this._data) {
                        r.push(k);
                    }
                    return r;
                },
                enumerable: true,
                configurable: true
            });
            RecordStore.prototype.dispose = function () {
                var that = this;
                this.keys.forEach(function (key) {
                    if (isStore(that[key])) {
                        that[key].dispose();
                    }
                    delete that[key];
                });
                this._data = null;
                _super.prototype.dispose.call(this);
            };
            return RecordStore;
        })(Store);
        var ImmutableRecord = (function (_super) {
            __extends(ImmutableRecord, _super);
            function ImmutableRecord(_parent) {
                _super.call(this);
                this._parent = _parent;
                var that = this;
                _parent.keys.forEach(function (key) {
                    that.addItem(key);
                });
                _parent.newItems.forEach(function (update) {
                    that.addItem(update.item);
                }).until(_parent.isDisposing);
                _parent.removedItems.forEach(function (update) {
                    that.removeItem(update.item);
                }).until(_parent.isDisposing);
            }
            Object.defineProperty(ImmutableRecord.prototype, "isImmutable", {
                get: function () {
                    return true;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ImmutableRecord.prototype, "immutable", {
                get: function () {
                    return this;
                },
                enumerable: true,
                configurable: true
            });
            ImmutableRecord.prototype.addItem = function (name) {
                var that = this;
                Object.defineProperty(this, name, {
                    configurable: true,
                    get: function () {
                        if (isStore(that._parent[name])) {
                            return that._parent[name].immutable;
                        }
                        return that._parent[name];
                    },
                    set: function (value) {
                    }
                });
            };
            ImmutableRecord.prototype.removeItem = function (name) {
                delete this[name];
            };
            Object.defineProperty(ImmutableRecord.prototype, "keys", {
                get: function () {
                    return this._parent.keys;
                },
                enumerable: true,
                configurable: true
            });
            ImmutableRecord.prototype.subscribeParentStream = function (parentStream) {
                var stream = Fluss.Stream.createStream();
                parentStream.forEach(function (update) {
                    stream.push(update);
                }).until(this._parent.isDisposing);
                var that = this;
                this._updateStreams.push(stream);
                stream.onClose(function () {
                    that.removeStream(that._updateStreams, stream);
                });
                return stream;
            };
            Object.defineProperty(ImmutableRecord.prototype, "updates", {
                get: function () {
                    return this.subscribeParentStream(this._parent.updates);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ImmutableRecord.prototype, "newItems", {
                get: function () {
                    return this.subscribeParentStream(this._parent.newItems);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ImmutableRecord.prototype, "removedItems", {
                get: function () {
                    return this.subscribeParentStream(this._parent.removedItems);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ImmutableRecord.prototype, "isDisposing", {
                get: function () {
                    return this.subscribeParentStream(this._parent.isDisposing);
                },
                enumerable: true,
                configurable: true
            });
            return ImmutableRecord;
        })(ImmutableStore);
        /**
         * Recursively build a nested store.
         * @param value
         * @returns {*}
         */
        function buildDeep(value) {
            function getItem(value) {
                var v;
                if (typeof value === "object") {
                    if (Fluss.Tools.isArray(value)) {
                        v = buildArray(value);
                    }
                    else {
                        v = buildRecord(value);
                    }
                }
                else {
                    v = value;
                }
                return v;
            }
            function buildArray(value) {
                var store = new ArrayStore();
                value.forEach(function (item) {
                    store.push(getItem(item));
                });
                return store;
            }
            function buildRecord(values) {
                var store = new RecordStore();
                for (var key in values) {
                    if (values.hasOwnProperty(key)) {
                        store.addItem(key, getItem(values[key]));
                    }
                }
                return store;
            }
            if (typeof value === "object") {
                if (Fluss.Tools.isArray(value)) {
                    return buildArray(value);
                }
                else {
                    return buildRecord(value);
                }
            }
            else {
                return null;
            }
        }
        /**
         * Create a new record. If an initial value is given it will have the enumerable properties of that value. You can
         * create nested stores by providing a complex object as an initial value.
         * @param initial
         * @returns {*}
         */
        function record(initial) {
            if (initial) {
                return buildDeep(initial);
            }
            else {
                return new RecordStore();
            }
        }
        _Store.record = record;
        var ArrayStore = (function (_super) {
            __extends(ArrayStore, _super);
            function ArrayStore(initial, adder, remover, updater) {
                _super.call(this);
                this._substreams = {};
                this._data = initial || [];
                this._maxProps = 0;
                this.updateProperties();
                this._synced = true;
                var that = this;
                if (adder) {
                    adder.forEach(function (update) {
                        that.splice(update.item, 0, update.value);
                    }).until(this.isDisposing);
                }
                if (remover) {
                    remover.forEach(function (update) {
                        that.splice(update.item, 1);
                    }).until(this.isDisposing);
                }
                if (updater) {
                    updater.forEach(function (update) {
                        that[update.item] = update.value;
                    }).until(this.isDisposing);
                }
            }
            ArrayStore.prototype.toString = function () {
                return this._data.toString();
            };
            ArrayStore.prototype.toLocaleString = function () {
                return this._data.toLocaleString();
            };
            ArrayStore.prototype.forEach = function (callbackfn, thisArg) {
                this._data.forEach(callbackfn, thisArg);
            };
            ArrayStore.prototype.every = function (callbackfn, thisArg) {
                return this._data.every(callbackfn, thisArg);
            };
            ArrayStore.prototype.some = function (callbackfn, thisArg) {
                return this._data.some(callbackfn, thisArg);
            };
            ArrayStore.prototype.indexOf = function (value, fromIndex) {
                if (isStore(value) && value.isImmutable) {
                    return this._data.indexOf(value["_parent"], fromIndex);
                }
                else {
                    return this._data.indexOf(value, fromIndex);
                }
            };
            ArrayStore.prototype.lastIndexOf = function (searchElement, fromIndex) {
                return this._data.lastIndexOf(searchElement, fromIndex);
            };
            ArrayStore.prototype.join = function (separator) {
                return this._data.join(separator);
            };
            ArrayStore.prototype.map = function (callbackfn, thisArg) {
                var mapped = this._data.map(callbackfn, thisArg);
                var adder = Fluss.Stream.createStream();
                var remover = Fluss.Stream.createStream();
                var updater = Fluss.Stream.createStream();
                var mappedStore = new ArrayStore(mapped, adder, remover, updater);
                var that = this;
                this.updates.forEach(function (update) {
                    updater.push(createUpdateInfo(update.rootItem, callbackfn(that._data[update.rootItem], update.rootItem, that._data), update.store));
                });
                this.newItems.forEach(function (update) {
                    adder.push(createUpdateInfo(update.rootItem, callbackfn(that._data[update.rootItem], update.rootItem, that._data), update.store));
                });
                this.removedItems.forEach(function (update) {
                    remover.push(createUpdateInfo(update.rootItem, update.value, update.store)); // The value does not matter here, save the call to the callback
                });
                return mappedStore;
            };
            ArrayStore.prototype.filter = function (callbackfn, noUpdates, thisArg) {
                var that = this;
                var adder;
                var remover;
                var updater;
                var filteredStore;
                var indexMap = [];
                var filtered = [];
                function map(forIndex, toIndex) {
                    indexMap[forIndex] = toIndex;
                    if (toIndex !== -1) {
                        for (var i = forIndex + 1; i < indexMap.length; i++) {
                            if (indexMap[i] !== -1) {
                                indexMap[i] += 1;
                            }
                        }
                    }
                }
                function addMap(fromIndex, toIndex) {
                    indexMap.splice(fromIndex, 0, toIndex);
                    if (toIndex !== -1) {
                        for (var i = fromIndex + 1; i < indexMap.length; i++) {
                            if (indexMap[i] !== -1) {
                                indexMap[i] += 1;
                            }
                        }
                    }
                }
                function unmap(forIndex) {
                    var downshift = isMapped(forIndex);
                    indexMap[forIndex] = -1;
                    if (downshift) {
                        for (var i = forIndex + 1; i < indexMap.length; i++) {
                            if (indexMap[i] !== -1) {
                                indexMap[i] -= 1;
                            }
                        }
                    }
                }
                function removeMap(forIndex) {
                    var downshift = isMapped(forIndex);
                    indexMap.splice(forIndex, 1);
                    if (downshift) {
                        for (var i = forIndex; i < indexMap.length; i++) {
                            if (indexMap[i] !== -1) {
                                indexMap[i] -= 1;
                            }
                        }
                    }
                }
                function mapIndex(fromIndex) {
                    return indexMap[fromIndex];
                }
                function isMapped(index) {
                    return index < indexMap.length && indexMap[index] !== -1;
                }
                function getClosestLeftMap(forIndex) {
                    var i = forIndex;
                    while ((i >= indexMap.length || indexMap[i] === -1) && i > -2) {
                        i--;
                    }
                    if (i < 0)
                        return -1;
                    return mapIndex(i);
                }
                this._data.forEach(function (value, index) {
                    if (callbackfn(value, index, that._data)) {
                        addMap(index, filtered.length);
                        filtered.push(value);
                    }
                    else {
                        addMap(index, -1);
                    }
                });
                if (!noUpdates) {
                    adder = Fluss.Stream.createStream();
                    remover = Fluss.Stream.createStream();
                    updater = Fluss.Stream.createStream();
                    this.newItems.forEach(function (update) {
                        if (callbackfn(that._data[update.rootItem], update.rootItem, that._data)) {
                            if (isMapped(update.rootItem)) {
                                adder.push(createUpdateInfo(mapIndex(update.rootItem), that._data[update.rootItem], update.store));
                            }
                            else {
                                adder.push(createUpdateInfo(getClosestLeftMap(update.rootItem) + 1, that._data[update.rootItem], update.store));
                            }
                            addMap(update.rootItem, filteredStore.indexOf(that._data[update.rootItem]));
                        }
                        else {
                            addMap(update.rootItem, -1);
                        }
                    });
                    this.removedItems.forEach(function (update) {
                        if (isMapped(update.rootItem)) {
                            remover.push(createUpdateInfo(mapIndex(update.rootItem), that._data[update.rootItem], update.store));
                        }
                        removeMap(update.rootItem);
                    });
                    this.updates.forEach(function (update) {
                        if (callbackfn(that._data[update.rootItem], update.rootItem, that._data)) {
                            if (isMapped(update.rootItem)) {
                                updater.push(createUpdateInfo(mapIndex(update.rootItem), that._data[update.rootItem], update.store));
                            }
                            else {
                                adder.push(createUpdateInfo(getClosestLeftMap(update.rootItem) + 1, that._data[update.rootItem], update.store));
                                map(update.rootItem, filteredStore.indexOf(that._data[update.rootItem]));
                            }
                        }
                        else {
                            if (isMapped(update.rootItem)) {
                                remover.push(createUpdateInfo(mapIndex(update.rootItem), that._data[update.rootItem], update.store));
                                unmap(update.rootItem);
                            }
                            else {
                                map(update.rootItem, -1);
                            }
                        }
                    });
                }
                filteredStore = new ArrayStore(filtered, adder, remover, updater);
                return filteredStore;
            };
            ArrayStore.prototype.reduce = function (callbackfn, initialValue) {
                return this._data.reduce(callbackfn, initialValue);
            };
            ArrayStore.prototype.sort = function (compareFn) {
                var copy = this._data.map(function (item) {
                    return item;
                });
                copy.sort(compareFn);
                var that = this;
                copy.forEach(function (value, index) {
                    if (value !== that._data[index]) {
                        that[index] = value;
                    }
                });
            };
            ArrayStore.prototype.reverse = function () {
                var copy = this._data.map(function (item) {
                    return item;
                });
                copy.reverse();
                var that = this;
                copy.forEach(function (value, index) {
                    if (value !== that._data[index]) {
                        that[index] = value;
                    }
                });
            };
            ArrayStore.prototype.concat = function (array) {
                var newArray;
                if (array instanceof ArrayStore) {
                    newArray = this._data.concat(array["_data"]);
                }
                else {
                    newArray = this._data.concat(array);
                }
                return new ArrayStore(newArray);
            };
            ArrayStore.prototype.concatInplace = function (array) {
                if (array instanceof ArrayStore) {
                    this.splice.apply(this, [this.length, 0].concat(array["_data"]));
                }
                else {
                    this.splice.apply(this, [this.length, 0].concat(array));
                }
            };
            Object.defineProperty(ArrayStore.prototype, "length", {
                get: function () {
                    return this._data.length;
                },
                enumerable: true,
                configurable: true
            });
            ArrayStore.prototype.setupSubStreams = function (item, value) {
                var that = this;
                if (isStore(value)) {
                    var substream = this._substreams[Fluss.Tools.oid(value)];
                    if (substream) {
                        substream.updates.dispose();
                    }
                    substream = {
                        updates: value.updates
                    };
                    substream.updates.forEach(function (update) {
                        var updateInfo = createUpdateInfo(update.item, update.value, that, update.path ? item + "." + update.path : item + "." + update.item, item);
                        that._updateStreams.forEach(function (stream) {
                            stream.push(updateInfo);
                        });
                    });
                    this._substreams[Fluss.Tools.oid(value)] = substream;
                }
            };
            /**
             * Call after removal!
             * @param value
             */
            ArrayStore.prototype.disposeSubstream = function (value) {
                if (isStore(value) && this._data.indexOf(value) === -1) {
                    var subStream = this._substreams[Fluss.Tools.oid(value)];
                    if (subStream) {
                        subStream.updates.dispose();
                        delete this._substreams[Fluss.Tools.oid(value)];
                    }
                }
            };
            ArrayStore.prototype.updateProperties = function () {
                var that = this;
                var i;
                for (i = 0; i < this._data.length; i++) {
                    that.setupSubStreams(i, this._data[i]);
                }
                for (i = this._maxProps; i < this._data.length; i++) {
                    (function (index) {
                        Object.defineProperty(that, "" + index, {
                            configurable: true,
                            get: function () {
                                return that._data[index];
                            },
                            set: function (value) {
                                var old = that._data[index];
                                if (value !== old) {
                                    that._data[index] = value;
                                    that.disposeSubstream(old);
                                    that.setupSubStreams(index, value);
                                    that._updateStreams.forEach(function (stream) {
                                        stream.push(createUpdateInfo(index, that._data[index], that, null));
                                    });
                                }
                            }
                        });
                    })(i);
                }
                this._maxProps = this._data.length;
            };
            ArrayStore.prototype.push = function () {
                var values = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    values[_i - 0] = arguments[_i];
                }
                var index = this._data.length;
                var that = this;
                values.forEach(function (value) {
                    that._data.push(value);
                    that._addItemsStreams.forEach(function (stream) {
                        stream.push(createUpdateInfo(index, that._data[index], that));
                    });
                    index++;
                });
                this.updateProperties();
            };
            ArrayStore.prototype.unshift = function () {
                var values = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    values[_i - 0] = arguments[_i];
                }
                var that = this;
                var l = values.length;
                while (l--) {
                    (function () {
                        this._data.unshift(values[0]);
                        this._newItemStreams.forEach(function (stream) {
                            stream.push(createUpdateInfo(0, that._data[0], that));
                        });
                    })();
                }
                this.updateProperties();
            };
            ArrayStore.prototype.pop = function () {
                var r = this._data.pop();
                var that = this;
                this.disposeSubstream(r);
                this._removeItemsStreams.forEach(function (stream) {
                    stream.push(createUpdateInfo(that._data.length, null, that));
                });
                return r;
            };
            ArrayStore.prototype.shift = function () {
                var r = this._data.shift();
                var that = this;
                this.disposeSubstream(r);
                this._removeItemsStreams.forEach(function (stream) {
                    stream.push(createUpdateInfo(0, null, that));
                });
                return r;
            };
            ArrayStore.prototype.splice = function (start, deleteCount) {
                var values = [];
                for (var _i = 2; _i < arguments.length; _i++) {
                    values[_i - 2] = arguments[_i];
                }
                var removed = this._data.splice.apply(this._data, [start, deleteCount].concat(values));
                var index = start;
                var that = this;
                if (that._removeItemsStreams.length) {
                    removed.forEach(function (value) {
                        that.disposeSubstream(value);
                        that._removeItemsStreams.forEach(function (stream) {
                            stream.push(createUpdateInfo(index, value, that));
                        });
                        index++;
                    });
                }
                index = start;
                values.forEach(function () {
                    that._addItemsStreams.forEach(function (stream) {
                        stream.push(createUpdateInfo(index, that._data[index], that));
                    });
                    index++;
                });
                /* Removed. This should not be necessary and it simplifies the reactive array
                 // Index is now at the first item after the last inserted value. So if deleteCount != values.length
                 // the items after the insert/remove moved around
                 if (deleteCount !== values.length) {
                 //var distance = values.length - deleteCount;
                 for (index; index < this._data.length; index++) {
                 that._updateStreams.forEach(function(stream) {
                 stream.push(createUpdateInfo<number>(index, that._data[index], that));
                 })
                 }
                 }
                 */
                this.updateProperties();
                return removed;
            };
            ArrayStore.prototype.insert = function (atIndex) {
                var values = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    values[_i - 1] = arguments[_i];
                }
                this.splice.apply(this, [atIndex, 0].concat(values));
            };
            ArrayStore.prototype.remove = function (atIndex, count) {
                if (count === void 0) { count = 1; }
                return this.splice(atIndex, count);
            };
            ArrayStore.prototype.dispose = function () {
                for (var i = 0; i < this.length; i++) {
                    if (isStore(this[i])) {
                        this[i].dispose();
                    }
                    delete this[i];
                }
                this._data = null;
                _super.prototype.dispose.call(this);
            };
            Object.defineProperty(ArrayStore.prototype, "immutable", {
                get: function () {
                    if (!this._immutable) {
                        this._immutable = new ImmutableArray(this);
                    }
                    return this._immutable;
                },
                enumerable: true,
                configurable: true
            });
            ArrayStore.prototype.item = function (value) {
                var i = this.indexOf(value);
                if (i !== -1) {
                    return this[i];
                }
                return null;
            };
            return ArrayStore;
        })(Store);
        var ImmutableArray = (function (_super) {
            __extends(ImmutableArray, _super);
            function ImmutableArray(_parent) {
                _super.call(this);
                this._parent = _parent;
                var that = this;
                _parent.newItems.forEach(function (update) {
                    that.updateProperties();
                }).until(_parent.isDisposing);
                // We do nothing when removing items. The getter will return undefined.
                /*
                 _array.removedItems().forEach(function(update) {

                 }).until(_array.disposing());
                 */
                this._maxProps = 0;
                this.updateProperties();
            }
            ImmutableArray.prototype.updateProperties = function () {
                var that = this;
                var i;
                for (i = this._maxProps; i < this._parent.length; i++) {
                    (function (index) {
                        Object.defineProperty(that, "" + index, {
                            configurable: true,
                            get: function () {
                                if (isStore(that._parent[index])) {
                                    return that._parent[index].immutable;
                                }
                                return that._parent[index];
                            },
                            set: function (value) {
                            }
                        });
                    })(i);
                }
                this._maxProps = this._parent.length;
            };
            ImmutableArray.prototype.toString = function () {
                return this._parent.toString();
            };
            ImmutableArray.prototype.toLocaleString = function () {
                return this._parent.toString();
            };
            ImmutableArray.prototype.forEach = function (callbackfn, thisArg) {
                return this._parent.forEach(callbackfn);
            };
            ImmutableArray.prototype.every = function (callbackfn, thisArg) {
                return this._parent.every(callbackfn);
            };
            ImmutableArray.prototype.some = function (callbackfn, thisArg) {
                return this._parent.forEach(callbackfn);
            };
            ImmutableArray.prototype.indexOf = function (value) {
                return this._parent.indexOf(value);
            };
            ImmutableArray.prototype.lastIndexOf = function (searchElement, fromIndex) {
                return this._parent.lastIndexOf(searchElement, fromIndex);
            };
            ImmutableArray.prototype.join = function (separator) {
                return this._parent.join(separator);
            };
            ImmutableArray.prototype.map = function (callbackfn, thisArg) {
                //This is dirty but anything else would be inperformant just because typescript does not have protected scope
                return this._parent["_data"].map(callbackfn);
            };
            ImmutableArray.prototype.filter = function (callbackfn, thisArg) {
                //This is dirty but anything else would be inperformant just because typescript does not have protected scope
                return this._parent["_data"].filter(callbackfn);
            };
            ImmutableArray.prototype.reduce = function (callbackfn, initialValue) {
                return this._parent.reduce(callbackfn, initialValue);
            };
            Object.defineProperty(ImmutableArray.prototype, "length", {
                get: function () {
                    return this._parent.length;
                },
                enumerable: true,
                configurable: true
            });
            ImmutableArray.prototype.subscribeParentStream = function (parentStream) {
                var stream = Fluss.Stream.createStream();
                parentStream.forEach(function (update) {
                    stream.push(update);
                }).until(this._parent.isDisposing);
                var that = this;
                this._updateStreams.push(stream);
                stream.onClose(function () {
                    that.removeStream(that._updateStreams, stream);
                });
                return stream;
            };
            Object.defineProperty(ImmutableArray.prototype, "updates", {
                get: function () {
                    return this.subscribeParentStream(this._parent.updates);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ImmutableArray.prototype, "newItems", {
                get: function () {
                    return this.subscribeParentStream(this._parent.newItems);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ImmutableArray.prototype, "removedItems", {
                get: function () {
                    return this.subscribeParentStream(this._parent.removedItems);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ImmutableArray.prototype, "disposing", {
                get: function () {
                    return this.subscribeParentStream(this._parent.isDisposing);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ImmutableArray.prototype, "immutable", {
                get: function () {
                    return this;
                },
                enumerable: true,
                configurable: true
            });
            return ImmutableArray;
        })(ImmutableStore);
        /**
         * Create an array store. If an initial value is provided it will initialize the array
         * with it. The initial value can be a JavaScript array of either simple values or plain objects.
         * It the array has plain objects a nested store will be created.
         * @param initial
         * @returns {*}
         */
        function array(initial) {
            if (initial) {
                return buildDeep(initial);
            }
            else {
                return new ArrayStore();
            }
        }
        _Store.array = array;
    })(Store = Fluss.Store || (Fluss.Store = {}));
})(Fluss || (Fluss = {}));
if (typeof exports !== "undefined") {
    exports.Store = Fluss.Store;
}
if (typeof this["define"] === "function") {
    this["define"]([], function () {
        return Fluss.Store;
    });
}

/// <reference path="./stream.ts" />
/**
 * Created by Stephan on 10.01.2015.
 */
"use strict";
var Fluss;
(function (Fluss) {
    var ReactMixins;
    (function (ReactMixins) {
        ReactMixins.componentLifecycle = {
            _willUnmount: null,
            componentDidMount: function () {
                this._willUnmount = Fluss.Stream.createStream("component-unmount");
            },
            componentWillUnmount: function () {
                this._willUnmount.push(true);
                this._willUnmount.dispose();
            }
        };
    })(ReactMixins = Fluss.ReactMixins || (Fluss.ReactMixins = {}));
})(Fluss || (Fluss = {}));
if (typeof exports !== "undefined") {
    exports.ReactMixins = Fluss.ReactMixins;
}
if (typeof this["define"] === "function") {
    this["define"]([], function () {
        return Fluss.ReactMixins;
    });
}

/// <reference path="./emitter.ts" />
/// <reference path="./stream.ts" />
/**
 * Created by Stephan.Smola on 28.10.2014.
 */
"use strict";
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Fluss;
(function (Fluss) {
    var EventChannel;
    (function (_EventChannel) {
        var EventChannel = (function () {
            function EventChannel() {
                this._eventHandlers = {};
            }
            EventChannel.prototype.subscribe = function (emitter, event, handler) {
                if (!this._eventHandlers[emitter]) {
                    this._eventHandlers[emitter] = {};
                }
                if (!this._eventHandlers[emitter][event]) {
                    this._eventHandlers[emitter][event] = [];
                }
                this._eventHandlers[emitter][event].push(handler);
            };
            EventChannel.prototype.unsubscribe = function (emitter, event, handler) {
                if (this._eventHandlers[emitter]) {
                    if (this._eventHandlers[emitter][event]) {
                        this._eventHandlers[emitter][event].splice(this._eventHandlers[emitter][event].indexOf(handler), 1);
                    }
                }
            };
            EventChannel.prototype.channelEmit = function (emitter, emitterID, event, args) {
                if (this._eventHandlers && this._eventHandlers[emitterID] && this._eventHandlers[emitterID][event]) {
                    this._eventHandlers[emitterID][event].forEach(function (handler) {
                        handler.apply(emitter, args);
                    });
                }
            };
            EventChannel.prototype.unsubscribeAll = function (emitterID) {
                delete this._eventHandlers[emitterID];
            };
            return EventChannel;
        })();
        var eventChannel = new EventChannel();
        //export var channel:IEventChannel = eventChannel;
        function getChannel() {
            return eventChannel;
        }
        _EventChannel.getChannel = getChannel;
        function subscribe(emitter, event, handler) {
            eventChannel.subscribe(emitter, event, handler);
        }
        _EventChannel.subscribe = subscribe;
        function unsubscribe(emitter, event, handler) {
            eventChannel.unsubscribe(emitter, event, handler);
        }
        _EventChannel.unsubscribe = unsubscribe;
        function channelEmit(emitterID, event) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            eventChannel.channelEmit(null, emitterID, event, args);
        }
        _EventChannel.channelEmit = channelEmit;
        function unsubscribeAll(emitterID) {
            eventChannel.unsubscribeAll(emitterID);
        }
        _EventChannel.unsubscribeAll = unsubscribeAll;
        var emitterIDs = [];
        var ChanneledEmitter = (function (_super) {
            __extends(ChanneledEmitter, _super);
            function ChanneledEmitter(_emitterID) {
                _super.call(this);
                if (_emitterID) {
                    this.emitterID = _emitterID;
                }
                else {
                    this.emitterID = "Emitter" + emitterIDs.length;
                }
                if (emitterIDs.indexOf(this.emitterID) !== -1) {
                    throw new Error("Duplicate emitterID. This is not supported");
                }
            }
            ChanneledEmitter.prototype.subscribe = function (event, handler) {
                _super.prototype.subscribe.call(this, event, handler);
                //console.log("Consider using the EventChannel instead of subscribing directly to the " + this.emitterID);
            };
            ChanneledEmitter.prototype.emit = function (event) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                // No super call because passing rest parameters to a super method is kind of awkward and hacky
                // https://typescript.codeplex.com/discussions/544797
                var that = this;
                if (this.eventHandlers && this.eventHandlers[event]) {
                    this.eventHandlers[event].forEach(function (handler) {
                        handler.apply(that, args);
                    });
                }
                eventChannel.channelEmit(this, this.emitterID, event, args);
            };
            return ChanneledEmitter;
        })(Fluss.Emitter.Emitter);
        _EventChannel.ChanneledEmitter = ChanneledEmitter;
        var EventStream = (function (_super) {
            __extends(EventStream, _super);
            function EventStream(name, _emitterID, _event) {
                _super.call(this, name);
                this._emitterID = _emitterID;
                this._event = _event;
                this._handler = this.handleEvent.bind(this);
                subscribe(this._emitterID, _event, this._handler);
            }
            EventStream.prototype.handleEvent = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i - 0] = arguments[_i];
                }
                this.push({
                    emitter: this._emitterID,
                    event: this._event,
                    args: args
                });
            };
            EventStream.prototype.dispose = function () {
                _super.prototype.dispose.call(this);
                unsubscribe(this._emitterID, this._event, this._handler);
            };
            return EventStream;
        })(Fluss.Stream.Stream);
        /**
         * Creates a stream for a channeled event. If  mor than one event is given, a combined
         * stream for all events is created
         *
         * @param name
         * @param emitterID
         * @param events
         * @returns {null}
         */
        function createEventStream(emitterID) {
            var events = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                events[_i - 1] = arguments[_i];
            }
            var stream = null;
            events.forEach(function (event) {
                var eStream = new EventStream(emitterID + "-" + event, emitterID, event);
                if (stream) {
                    stream = stream.combine(eStream);
                }
                else {
                    stream = eStream;
                }
            });
            return stream;
        }
        _EventChannel.createEventStream = createEventStream;
    })(EventChannel = Fluss.EventChannel || (Fluss.EventChannel = {}));
})(Fluss || (Fluss = {}));
if (typeof exports !== "undefined") {
    exports.EventChannel = Fluss.EventChannel;
}
if (typeof this["define"] === "function") {
    this["define"]([], function () {
        return Fluss.EventChannel;
    });
}

/// <reference path="./eventChannel.ts" />
/**
 * Created by Stephan.Smola on 30.10.2014.
 */
"use strict";
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Fluss;
(function (Fluss) {
    var Errors;
    (function (Errors) {
        (function (EVENTS) {
            EVENTS[EVENTS["ERROR"] = 0] = "ERROR";
            EVENTS[EVENTS["FATAL"] = 1] = "FATAL";
            EVENTS[EVENTS["FRAMEWORK"] = 2] = "FRAMEWORK";
            EVENTS[EVENTS["CLEAR"] = 3] = "CLEAR";
        })(Errors.EVENTS || (Errors.EVENTS = {}));
        var EVENTS = Errors.EVENTS;
        var ErrorHandler = (function (_super) {
            __extends(ErrorHandler, _super);
            function ErrorHandler() {
                _super.call(this, "ERROR");
                /*
                 if (window) {
                 window.onerror = function(error, url, line) {
                 this.fatal(error + "\nin: " + url + "\nline: " + line, window);
                 }
                 }
                 */
            }
            ErrorHandler.prototype.error = function (message, that) {
                this.emit(0 /* ERROR */, message, that);
            };
            ErrorHandler.prototype.fatal = function (message, that) {
                this.emit(1 /* FATAL */, message, that);
            };
            ErrorHandler.prototype.framework = function (message, exception, that) {
                throw exception;
            };
            return ErrorHandler;
        })(Fluss.EventChannel.ChanneledEmitter);
        var errorHandler = new ErrorHandler();
        function getErrorHandler() {
            return errorHandler;
        }
        Errors.getErrorHandler = getErrorHandler;
        function error(message, that) {
            return errorHandler.error(message, that);
        }
        Errors.error = error;
        function fatal(message, that) {
            return errorHandler.fatal(message, that);
        }
        Errors.fatal = fatal;
        function framework(message, exceotion, that) {
            return errorHandler.framework(message, exceotion, that);
        }
        Errors.framework = framework;
    })(Errors = Fluss.Errors || (Fluss.Errors = {}));
})(Fluss || (Fluss = {}));
if (typeof exports !== "undefined") {
    exports.Errors = Fluss.Errors;
}
if (typeof this["define"] === "function") {
    this["define"]([], function () {
        return Fluss.Errors;
    });
}

/// <reference path="./dispatcher.ts" />
/**
 * Created by Stephan.Smola on 28.10.2014.
 */
"use strict";
var Fluss;
(function (Fluss) {
    var BaseActions;
    (function (BaseActions) {
        (function (ACTIONS) {
            ACTIONS[ACTIONS["__ANY__"] = -1000] = "__ANY__";
            ACTIONS[ACTIONS["UNDO"] = -2000] = "UNDO";
        })(BaseActions.ACTIONS || (BaseActions.ACTIONS = {}));
        var ACTIONS = BaseActions.ACTIONS;
        /**
         * Generic action trigger that can be fed by passing the action id and parameters.
         * Can be used in situations where actions are triggered based on a configuration.
         *
         * Explicit Functions are recommended for all actions, because they make coding easier
         * and code more readable
         *
         * @param action
         * @param args
         */
        function triggerAction(action) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            Fluss.Dispatcher.getDispatcher().dispatchAction.apply(Fluss.Dispatcher.getDispatcher(), [action].concat(args));
        }
        BaseActions.triggerAction = triggerAction;
        function undo() {
            Fluss.Dispatcher.getDispatcher().dispatchAction(-2000 /* UNDO */);
        }
        BaseActions.undo = undo;
    })(BaseActions = Fluss.BaseActions || (Fluss.BaseActions = {}));
})(Fluss || (Fluss = {}));
if (typeof exports !== "undefined") {
    exports.BaseActions = Fluss.BaseActions;
}
if (typeof this["define"] === "function") {
    this["define"]([], function () {
        return Fluss.BaseActions;
    });
}

/// <reference path="./errors.ts" />
/// <reference path="./eventChannel.ts" />
/// <reference path="./baseActions.ts" />
/**
 * Created by Stephan.Smola on 28.10.2014.
 */
"use strict";
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Fluss;
(function (Fluss) {
    var Dispatcher;
    (function (_Dispatcher) {
        /**
         * Create a memento object.
         * @param instance
         * @param data
         * @param redo
         * @param undo      Optionally you can provide an action for undoing, if that is simpler than storing data
         * @returns {{data: any, redo: IAction, instance: IUndoable}}
         */
        function createMemento(instance, data) {
            return {
                action: -1,
                data: data,
                redo: null,
                undo: null,
                instance: instance
            };
        }
        _Dispatcher.createMemento = createMemento;
        /**
         * Create a redo object.
         * @param action
         * @param data
         * @returns {{action: number, data: any}}
         */
        function createRedo(action, data) {
            return {
                action: action,
                data: data
            };
        }
        _Dispatcher.createRedo = createRedo;
        function createUndoAction(action) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            return {
                action: -1,
                data: null,
                redo: null,
                undo: {
                    action: action,
                    data: args
                },
                instance: null
            };
        }
        _Dispatcher.createUndoAction = createUndoAction;
        /**
         * Events that are raised by the undo manager.
         */
        (function (EVENTS) {
            EVENTS[EVENTS["UNDO"] = 0] = "UNDO";
            EVENTS[EVENTS["REDO"] = 1] = "REDO";
            EVENTS[EVENTS["MEMENTO_STORED"] = 2] = "MEMENTO_STORED";
            EVENTS[EVENTS["CLEAR"] = 3] = "CLEAR";
        })(_Dispatcher.EVENTS || (_Dispatcher.EVENTS = {}));
        var EVENTS = _Dispatcher.EVENTS;
        /**
         * Implementation of a dispatcher as described by the FLUX pattern.
         */
        var Dispatcher = (function () {
            function Dispatcher() {
                this._handlers = {};
                this._dispatching = false;
                this._undoing = false;
                this._disabled = {};
            }
            Dispatcher.prototype.destroy = function () {
                this._handlers = {};
                this._dispatching = false;
                this._undoing = false;
                this._disabled = {};
            };
            Object.defineProperty(Dispatcher.prototype, "undoing", {
                get: function () {
                    return this._undoing;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * The actual dispatch
             * @param doMemento
             * @param type
             * @param args
             */
            Dispatcher.prototype.dispatch = function (doMemento, type, args) {
                try {
                    var mementos = [];
                    var that = this;
                    var doit = function (__type, dispatch, trueType) {
                        if (that._handlers[__type]) {
                            that._handlers[__type].forEach(function (d) {
                                if (doMemento && d[1]) {
                                    var memento = d[1].apply(that, [trueType || __type].concat(args));
                                    if (memento) {
                                        if (Object.prototype.toString.call(memento) === "[object Array]") {
                                            Array.prototype.push.apply(mementos, memento);
                                        }
                                        else {
                                            mementos.push(memento);
                                        }
                                    }
                                }
                                dispatch(d[0], args);
                            });
                        }
                    };
                    doit(type, function (handler, args) {
                        handler.apply(this, args);
                    });
                    doit(-1000 /* __ANY__ */, function (handler, args) {
                        handler.apply(this, [type, args]);
                    }, type);
                    if (mementos.length) {
                        getUndoManager().storeMementos(mementos, type, createRedo(type, args));
                    }
                }
                catch (e) {
                    var msg = "Internal error. If this happens please check if it was a user error \n" + "that can be either prevented or gracefully handled.\n\n";
                    msg += "Handled action: " + type + "\n";
                    msg += "Create memento: " + (doMemento ? "yes\n" : "no\n");
                    var argStr = "";
                    try {
                        argStr = JSON.stringify(args, null, 2);
                    }
                    catch (e) {
                        argStr = "It's a circular structure :-(";
                    }
                    msg += "Arguments     : " + argStr + "\n";
                    msg += "Mementos      : " + (mementos ? JSON.stringify(mementos, null, 2) : "none") + "\n";
                    msg += "Exception     : " + e.message + "\n";
                    msg += "Stack trace   :\n" + e.stack + "\n";
                    console.log(msg);
                    Fluss.Errors.framework(e.message, e, that);
                }
            };
            /**
             * Dispatch an undo action. This is basically the same as dispatching a regular
             * action, but the memento will not be created.
             * @param type
             * @param args
             */
            Dispatcher.prototype.dispatchUndoAction = function (action) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                if (!this._disabled[action]) {
                    this._undoing = true;
                    try {
                        this.dispatch(false, action, args);
                    }
                    finally {
                        this._undoing = false;
                    }
                }
            };
            /**
             * Dispatch, i.e. broadcast an action to anyone that's interested.
             * @param type
             * @param data
             */
            Dispatcher.prototype.dispatchAction = function (action) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                if (!this._disabled[action]) {
                    this.dispatch(true, action, args);
                }
            };
            /**
             * Subscribe to an action.
             * @param action
             * @param handler
             * @param mementoProvider
             */
            Dispatcher.prototype.subscribeAction = function (action, handler, mementoProvider) {
                if (!this._handlers[action]) {
                    this._handlers[action] = [];
                }
                if (this._handlers[action].indexOf(handler) === -1) {
                    this._handlers[action].push([handler, mementoProvider]);
                }
            };
            /**
             * Unsubscribe an action handler. This removes a potential mementoProvider also.
             * @param action
             * @param handler
             */
            Dispatcher.prototype.unsubscribeAction = function (action, handler) {
                if (this._handlers[action]) {
                    for (var i = 0; i < this._handlers[action].length; i++) {
                        if (this._handlers[action][i][0] === handler) {
                            this._handlers[action].splice(i, 1);
                            return;
                        }
                    }
                }
            };
            Dispatcher.prototype.disableAction = function (action) {
                this._disabled[action] = true;
            };
            Dispatcher.prototype.enableAction = function (action) {
                if (this._disabled[action]) {
                    delete this._disabled[action];
                }
            };
            return Dispatcher;
        })();
        var dispatcher = new Dispatcher();
        function getDispatcher() {
            return dispatcher;
        }
        _Dispatcher.getDispatcher = getDispatcher;
        function dispatch(action) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            dispatcher.dispatchAction.apply(dispatcher, [action].concat(args));
        }
        _Dispatcher.dispatch = dispatch;
        function subscribeAction(action, handler, mementoProvider) {
            dispatcher.subscribeAction(action, handler, mementoProvider);
        }
        _Dispatcher.subscribeAction = subscribeAction;
        function unsubscribeAction(action, handler) {
            dispatcher.unsubscribeAction(action, handler);
        }
        _Dispatcher.unsubscribeAction = unsubscribeAction;
        function disableAction(action) {
            dispatcher.disableAction(action);
        }
        _Dispatcher.disableAction = disableAction;
        function enableAction(action) {
            dispatcher.enableAction(action);
        }
        _Dispatcher.enableAction = enableAction;
        /**
         * Resets everything. No previously subscribed handler will be called.
         */
        function reset() {
            dispatcher.destroy();
            dispatcher = new Dispatcher();
        }
        _Dispatcher.reset = reset;
        /**
         * Undo manager implementations. It utilises two stacks (undo, redo) to provide the
         * necessary means to undo and redo actions.
         */
        var UndoManager = (function (_super) {
            __extends(UndoManager, _super);
            function UndoManager() {
                _super.call(this, "UndoManager");
                this.clear();
                getDispatcher().subscribeAction(-2000 /* UNDO */, this.undo.bind(this));
            }
            /**
             * Store a memento. This is put on a stack that is used for undo
             * @param mementos
             * @param action        the action that created the memento
             * @param redo          the data that can be used to recreate the action
             */
            UndoManager.prototype.storeMementos = function (mementos, action, redo) {
                if (mementos) {
                    mementos.forEach(function (m) {
                        if (m) {
                            m.redo = redo;
                            m.action = action;
                        }
                    });
                    this.mementos.push(mementos);
                    this.redos = [];
                    this.emit(2 /* MEMENTO_STORED */, mementos);
                }
            };
            /**
             * Undo. Pop the latest memento from the stack and restore the according object. This pushes the redo-info
             * from the memento onto the redo stack to use in redo.
             */
            UndoManager.prototype.undo = function () {
                var us = this.mementos.pop();
                if (us) {
                    var redos = [];
                    us.forEach(function (u, i) {
                        if (u.undo) {
                            getDispatcher().dispatchUndoAction.apply(getDispatcher(), [u.undo.action].concat(u.undo.data));
                        }
                        else {
                            u.instance.restoreFromMemento(u);
                        }
                        if (!i) {
                            redos.push(u.redo);
                        }
                    });
                    this.redos.push(redos);
                    this.emit(0 /* UNDO */, us);
                }
            };
            /**
             * Redo. Pop the latest redo action from the stack and dispatch it. This does not store any undo data,
             * as the dispatcher will do that when dispatching the action.
             */
            UndoManager.prototype.redo = function () {
                var rs = this.redos.pop();
                if (rs) {
                    rs.forEach(function (r) {
                        getDispatcher().dispatchAction.apply(getDispatcher(), [r.action].concat(r.data));
                    });
                    this.emit(1 /* REDO */, rs);
                }
            };
            /**
             * Clear all stacks
             */
            UndoManager.prototype.clear = function () {
                this.mementos = [];
                this.redos = [];
                this.emit(3 /* CLEAR */);
            };
            UndoManager.prototype.getMementos = function () {
                return this.mementos;
            };
            return UndoManager;
        })(Fluss.EventChannel.ChanneledEmitter);
        /**
         * Singleton.
         * @type {UndoManager}
         */
        var um = new UndoManager();
        /**
         * Get the undo manager. Returns the single instance.
         * @returns {UndoManager}
         */
        function getUndoManager() {
            return um;
        }
        _Dispatcher.getUndoManager = getUndoManager;
    })(Dispatcher = Fluss.Dispatcher || (Fluss.Dispatcher = {}));
})(Fluss || (Fluss = {}));
if (typeof exports !== "undefined") {
    exports.Dispatcher = Fluss.Dispatcher;
}
if (typeof this["define"] === "function") {
    this["define"]([], function () {
        return Fluss.Dispatcher;
    });
}

/// <reference path="./dispatcher.ts" />
/// <reference path="./eventChannel.ts" />
/// <reference path="./baseActions.ts" />
/// <reference path="./tools.ts" />
/**
 * Created by stephan on 01.11.14.
 */
"use strict";
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Fluss;
(function (Fluss) {
    var Plugins;
    (function (Plugins) {
        /**
         * Base implementation for a plugin. Does absolutely nothing.
         */
        var BasePlugin = (function () {
            function BasePlugin() {
            }
            BasePlugin.prototype.run = function (container, action) {
                var args = [];
                for (var _i = 2; _i < arguments.length; _i++) {
                    args[_i - 2] = arguments[_i];
                }
            };
            BasePlugin.prototype.afterFinish = function (container, action) {
                var args = [];
                for (var _i = 2; _i < arguments.length; _i++) {
                    args[_i - 2] = arguments[_i];
                }
            };
            BasePlugin.prototype.afterAbort = function (container, action) {
                var args = [];
                for (var _i = 2; _i < arguments.length; _i++) {
                    args[_i - 2] = arguments[_i];
                }
            };
            BasePlugin.prototype.getMemento = function (container, action) {
                var args = [];
                for (var _i = 2; _i < arguments.length; _i++) {
                    args[_i - 2] = arguments[_i];
                }
                return null;
            };
            BasePlugin.prototype.restoreFromMemento = function (container, memento) {
            };
            BasePlugin.prototype.hold = function () {
            };
            BasePlugin.prototype.release = function (action) {
            };
            BasePlugin.prototype.abort = function (action) {
            };
            return BasePlugin;
        })();
        Plugins.BasePlugin = BasePlugin;
        /**
         * Create a Plugin. Use this when you're using plain JavaScript.
         * @param spec
         * @returns {any}
         */
        function createPlugin(spec) {
            return Fluss.Tools.subclass(spec, BasePlugin);
        }
        Plugins.createPlugin = createPlugin;
        /**
         * Base implementation for a plugin container.
         */
        var PluginContainer = (function (_super) {
            __extends(PluginContainer, _super);
            function PluginContainer(emitterId) {
                _super.call(this, emitterId || "Container" + Fluss.Tools.oid(this));
                this._plugins = {};
                this._anyPlugins = [];
                this._protocols = {};
                this._runningPlugins = {};
                this._mementos = {};
            }
            /**
             * http://stackoverflow.com/questions/1606797/use-of-apply-with-new-operator-is-this-possible
             * @param config
             */
            PluginContainer.prototype.configure = function (config) {
                function construct(constructor, args) {
                    function F() {
                        constructor.apply(this, args);
                    }
                    F.prototype = constructor.prototype;
                    return new F();
                }
                var that = this;
                config.forEach(function (action) {
                    action.plugins.forEach(function (plugin) {
                        if (plugin.plugin) {
                            that.wrap(action.action, construct(plugin.plugin, plugin.parameters));
                        }
                        else {
                            that.wrap(action.action, new plugin());
                        }
                    });
                });
            };
            PluginContainer.prototype.destroy = function () {
                for (var action in this._plugins) {
                    if (this._plugins.hasOwnProperty(action)) {
                        var l = this._plugins[action].length;
                        while (l--) {
                            this.detach(action, this._plugins[action][l]);
                        }
                    }
                }
                this._anyPlugins = [];
                this._runningPlugins = {};
                //TODO: Find a way to unsubscribe from the Dispatcher
            };
            PluginContainer.prototype.pluginDone = function (action, abort) {
            };
            PluginContainer.prototype.abortAction = function (action) {
                if (this._runningPlugins[action] && this._runningPlugins[action].length) {
                    var plg = this._runningPlugins[action][this._runningPlugins[action].length - 1];
                    if (plg) {
                        plg.abort(action);
                    }
                }
                this._runningPlugins[action] = null;
            };
            PluginContainer.prototype.abort = function (action) {
                if (typeof action === "undefined") {
                    for (var actionKey in this._protocols) {
                        if (this._protocols.hasOwnProperty(actionKey)) {
                            this.abortAction(actionKey);
                        }
                    }
                }
                else {
                    if (this._protocols[action]) {
                        this.abortAction(action);
                    }
                }
            };
            /**
             * This handles an action sent by the dispatcher and delegates it to the plugins.
             * Plugins are "wrapped" around each other. They build kind of brackets defined by two of
             * their methods: run - opens the brackets
             *                finish/abort - closes the brackets.
             *
             * We'll talk about finish from now on. That can be replaced by abort everywhere. The first plugin to abort
             * forces all succeeding plugins to abort as well.
             *
             * So wrapping in the order A->B->C leads to these brackets:
             *
             *  runC-runB-runA-finishA-finishB-finishC
             *
             * finish is only called when the plugin calls the done-callback that is provided to its run-method.
             *
             * So to correctly execute this "chain" we need to wait for the plugins to call their done-callbacks before
             * we can proceed. Because the plugins may call their done-callback outside their run-method, e.g. triggered by
             * user interaction, we need to keep track of what the plugins did using a protocol.
             *
             * That protocol looks like this:
             *
             *  {
     *    i: { done: A function that calls either finish or abort on the i-th plugin,
     *         abort: did the plugin abort?
     *
     *    i+1: ...
     *  }
     *
     * this protocol is initialized by null entries for all plugins. Then the run-methods for all plugins are called, giving them a done
     * callback, that fills the protocol.
     *
     * After every run-method we check if we're at the innermost plugin (A in the example above, the one that first wrapped the action).
     * If we are, we work through the protocol as long as there are valid entries. Then we wait for the next done-callback to be called.
     *
     * @param action
             * @param args
             */
            PluginContainer.prototype.doHandleAction = function (plugins, action, args) {
                if (this._runningPlugins[action] && this._runningPlugins[action].length) {
                    throw new Error("ERROR calling action " + action + ". Same action cannot be called inside itself!");
                }
                var that = this;
                var composeArgs = function (plugin, action) {
                    return [that, action].concat(args);
                };
                this._mementos[action] = [];
                this._runningPlugins[action] = [];
                this._protocols[action] = [];
                plugins.forEach(function (plugin) {
                    that._protocols[action].push(0);
                    that._runningPlugins[action].push(plugin);
                });
                var aborted = false;
                plugins.forEach(function (plugin, i) {
                    (function (index) {
                        var done = function (abort, doneAction) {
                            index = that.getPluginsForAction(doneAction).indexOf(plugin);
                            that._protocols[doneAction][index] = {
                                plugin: plugin,
                                done: function (abort) {
                                    if (abort) {
                                        plugin.afterAbort.apply(plugin, composeArgs(plugin, doneAction));
                                    }
                                    else {
                                        plugin.afterFinish.apply(plugin, composeArgs(plugin, doneAction));
                                    }
                                },
                                abort: abort
                            };
                            var last = that._protocols[doneAction].length;
                            while (last--) {
                                if (that._protocols[doneAction][last]) {
                                    abort |= that._protocols[doneAction][last].abort;
                                    that._protocols[doneAction][last].done(abort);
                                    that._protocols[doneAction].pop();
                                    if (that._runningPlugins[doneAction]) {
                                        that._runningPlugins[doneAction].pop();
                                    }
                                }
                                else {
                                    break;
                                }
                            }
                            if (!that._runningPlugins[doneAction] || !that._runningPlugins[doneAction].length) {
                                that.finalizeAction(doneAction, abort, that.getPluginsForAction(doneAction), that._mementos[doneAction], args);
                            }
                        };
                        var holds = false;
                        var dones = {};
                        plugin["hold"] = function () {
                            holds = true;
                        };
                        plugin["abort"] = function (abortAction) {
                            var act = typeof abortAction === "undefined" ? action : abortAction;
                            dones[act] = true;
                            done(true, act);
                            aborted = true;
                        };
                        plugin["release"] = function (releaseAction) {
                            var act = typeof releaseAction === "undefined" ? action : releaseAction;
                            if (dones[act]) {
                                throw new Error("Plugin released twice for action " + act + "! Possibly called release after abort or vice versa.");
                            }
                            else {
                                done(false, act);
                                dones[act] = true;
                            }
                        };
                        if (!aborted) {
                            var memento = plugin.getMemento.apply(plugin, composeArgs(plugin, action));
                            if (memento) {
                                memento.instance = {
                                    restoreFromMemento: function (mem) {
                                        plugin.restoreFromMemento(that, mem);
                                    }
                                };
                                that._mementos[action].push(memento);
                            }
                            // If we aborted: Clean up: All Plugins that where started until now (outer) will be aborted.
                            // Others that would have been started afterwards (inner) won't be called at all. (see if-statement
                            // above this comment)
                            plugin.run.apply(plugin, composeArgs(plugin, action));
                            if (aborted) {
                                var last = (that._protocols[action] && that._protocols[action].length) || 0;
                                while (last--) {
                                    if (that._protocols[action][last]) {
                                        that._protocols[action][last].done(true);
                                        that._protocols[action].pop();
                                    }
                                    else {
                                    }
                                }
                                that.finalizeAction(action, true, that.getPluginsForAction(action), null, args);
                            }
                            else {
                                if (!holds && !dones[action])
                                    done(false, action);
                            }
                        }
                    })(i);
                });
            };
            PluginContainer.prototype.getPluginsForAction = function (action) {
                if (this._plugins[action] && this._plugins[action].length) {
                    return this._plugins[action];
                }
                else if (this._anyPlugins && this._anyPlugins.length) {
                    return this._anyPlugins;
                }
                else
                    return [];
            };
            PluginContainer.prototype.handleAction = function (action, args) {
                try {
                    this.doHandleAction(this.getPluginsForAction(action), action, args);
                }
                catch (e) {
                    this.abort();
                    throw e;
                }
            };
            PluginContainer.prototype.finalizeAction = function (action, abort, plugins, mementos, args) {
                if (!abort) {
                    if (mementos && mementos.length && !Fluss.Dispatcher.getDispatcher().undoing) {
                        Fluss.Dispatcher.getUndoManager().storeMementos(mementos, action, Fluss.Dispatcher.createRedo(action, args));
                    }
                }
                this._mementos[action] = null;
                this._runningPlugins[action] = null;
                this._protocols[action] = null;
            };
            PluginContainer.prototype.provideMementos = function (action, plugins, args) {
                if (plugins) {
                    var ret = [];
                    var that = this;
                    plugins.forEach(function (plugin) {
                        var memento = plugin.getMemento.apply(plugin, [that, action].concat(args));
                        if (memento) {
                            memento.instance = {
                                restoreFromMemento: function (mem) {
                                    plugin.restoreFromMemento(that, mem);
                                }
                            };
                            ret.push(memento);
                        }
                    });
                    if (ret.length) {
                        Fluss.Dispatcher.getUndoManager().storeMementos(ret, action, Fluss.Dispatcher.createRedo(action, args));
                    }
                }
                return null;
            };
            /**
             * This wraps the handler around the existing handlers the action, making the given handler the first to be called
             * for that action.
             *
             * If the ANY-Action is given
             *   * The handler is wrapped for every action there already is another handler
             *   * The handler is wrapped around all other any-handler, and these are called for all actions without regular handlers
             *
             * If a regular action is given and any-handlers exist the given handler is wrapped around all any-handlers for the
             * given action.
             *
             * @param action
             * @param handler
             */
            PluginContainer.prototype.wrap = function (action, handler) {
                if (action === -1000 /* __ANY__ */) {
                    if (this._anyPlugins.length === 0) {
                        var that = this;
                        Fluss.Dispatcher.subscribeAction(-1000 /* __ANY__ */, function () {
                            var args = [];
                            for (var _i = 0; _i < arguments.length; _i++) {
                                args[_i - 0] = arguments[_i];
                            }
                            var act = args.shift();
                            if (that._plugins[act]) {
                                return;
                            }
                            that.handleAction(act, args);
                        }, function (type) {
                            var args = [];
                            for (var _i = 1; _i < arguments.length; _i++) {
                                args[_i - 1] = arguments[_i];
                            }
                            return null; // Whe handle the mementos ourselves
                            /*
                             if (that._plugins[type]) {
                             return;
                             }
                             return that.provideMementos(type, args);
                             */
                        });
                    }
                    for (var a in this._plugins) {
                        if (this._plugins.hasOwnProperty(a)) {
                            this.doWrap(a, handler);
                        }
                    }
                    this._anyPlugins.unshift(handler);
                }
                else {
                    if (!this._plugins[action] && this._anyPlugins.length) {
                        var l = this._anyPlugins.length;
                        while (l--) {
                            this.doWrap(action, this._anyPlugins[l]);
                        }
                    }
                    this.doWrap(action, handler);
                }
            };
            PluginContainer.prototype.doWrap = function (action, handler) {
                if (!this._plugins[action]) {
                    this._plugins[action] = [];
                    var that = this;
                    Fluss.Dispatcher.subscribeAction(action, function () {
                        var args = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            args[_i - 0] = arguments[_i];
                        }
                        that.handleAction(action, args);
                    }, function (type) {
                        var args = [];
                        for (var _i = 1; _i < arguments.length; _i++) {
                            args[_i - 1] = arguments[_i];
                        }
                        return null; //return that.provideMementos(action, args);
                    });
                }
                if (this._plugins[action].indexOf(handler) !== -1) {
                    throw new Error("Plugin instances can only be used once per action!");
                }
                this._plugins[action].unshift(handler);
            };
            PluginContainer.prototype.detach = function (action, handler) {
                if (action === -1000 /* __ANY__ */) {
                    this._anyPlugins.splice(this._anyPlugins.indexOf(handler), 1);
                    for (var a in this._plugins) {
                        if (this._plugins.hasOwnProperty(a)) {
                            this._plugins[a].splice(this._plugins[a].indexOf(handler), 1);
                        }
                    }
                }
                else {
                    if (this._plugins[action]) {
                        this._plugins[action].splice(this._plugins[action].indexOf(handler), 1);
                    }
                }
            };
            return PluginContainer;
        })(Fluss.EventChannel.ChanneledEmitter);
        Plugins.PluginContainer = PluginContainer;
        function createContainer(spec) {
            return Fluss.Tools.subclass(spec, PluginContainer);
        }
        Plugins.createContainer = createContainer;
    })(Plugins = Fluss.Plugins || (Fluss.Plugins = {}));
})(Fluss || (Fluss = {}));
if (typeof exports !== "undefined") {
    exports.Plugins = Fluss.Plugins;
}
if (typeof this["define"] === "function") {
    this["define"]([], function () {
        return Fluss.Plugins;
    });
}

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQ29tbW9uSlNCcm93c2VyaWZ5X1RTXFxtYWluLmpzIiwibm9kZV9tb2R1bGVzXFxmbHVzc1xcaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9ub2RlX21vZHVsZXMvZmx1c3MvZmx1c3MuZC50c1wiIC8+XG4vKipcbiAqIENyZWF0ZWQgYnkgU3RlcGhhbiBvbiAxMS4wMS4yMDE1LlxuICovXG5cInVzZSBzdHJpY3RcIjtcbnZhciBGbHVzcyA9IHJlcXVpcmUoXCJmbHVzc1wiKTtcbnZhciBhcnJheSA9IEZsdXNzLlN0b3JlLmFycmF5KCk7XG5hcnJheS5uZXdJdGVtcy5mb3JFYWNoKGZ1bmN0aW9uICh1cGRhdGUpIHtcbiAgICBkb2N1bWVudC53cml0ZSh1cGRhdGUudmFsdWUgKyBcIiB3YXMgYWRkZWQuPGJyPlwiKTtcbn0pO1xuZG9jdW1lbnQud3JpdGUoXCI8aDE+Zmx1c3MgLSBjb21tb25KUywgYnJvd3NlcmlmeSwgVHlwZXNjcmlwdDwvaDE+XCIpO1xuYXJyYXkucHVzaChcIk9uZVwiKTtcbmFycmF5LnB1c2goMik7XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW1haW4uanMubWFwIiwiLyoqXG4gKiBDcmVhdGVkIGJ5IFN0ZXBoYW4uU21vbGEgb24gMzAuMTAuMjAxNC5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgRmx1c3M7XG4oZnVuY3Rpb24gKEZsdXNzKSB7XG4gICAgdmFyIFRvb2xzO1xuICAgIChmdW5jdGlvbiAoVG9vbHMpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIERldGVybWluZSB0aGUgc2NyZWVuIHBvc2l0aW9uIGFuZCBzaXplIG9mIGFuIGVsZW1lbnQgaW4gdGhlIERPTVxuICAgICAgICAgKiBAcGFyYW0gZWxlbWVudFxuICAgICAgICAgKiBAcmV0dXJucyB7e3g6IG51bWJlciwgeTogbnVtYmVyLCB3OiBudW1iZXIsIGg6IG51bWJlcn19XG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBlbGVtZW50UG9zaXRpb25BbmRTaXplKGVsZW1lbnQpIHtcbiAgICAgICAgICAgIHZhciByZWN0ID0gZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgIHJldHVybiB7IHg6IHJlY3QubGVmdCwgeTogcmVjdC50b3AsIHc6IHJlY3Qud2lkdGgsIGg6IHJlY3QuaGVpZ2h0IH07XG4gICAgICAgIH1cbiAgICAgICAgVG9vbHMuZWxlbWVudFBvc2l0aW9uQW5kU2l6ZSA9IGVsZW1lbnRQb3NpdGlvbkFuZFNpemU7XG4gICAgICAgIHZhciBwZnggPSBbXG4gICAgICAgICAgICB7IGlkOiBcIndlYmtpdFwiLCBjYW1lbENhc2U6IHRydWUgfSxcbiAgICAgICAgICAgIHsgaWQ6IFwiTVNcIiwgY2FtZWxDYXNlOiB0cnVlIH0sXG4gICAgICAgICAgICB7IGlkOiBcIm9cIiwgY2FtZWxDYXNlOiB0cnVlIH0sXG4gICAgICAgICAgICB7IGlkOiBcIlwiLCBjYW1lbENhc2U6IGZhbHNlIH1cbiAgICAgICAgXTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFkZCBldmVudCBsaXN0ZW5lciBmb3IgcHJlZml4ZWQgZXZlbnRzLiBBcyB0aGUgY2FtZWwgY2FzaW5nIG9mIHRoZSBldmVudCBsaXN0ZW5lcnMgaXMgZGlmZmVyZW50XG4gICAgICAgICAqIGFjcm9zcyBicm93c2VycyB5b3UgbmVlZCB0byBzcGVjaWZ5IHRoZSB0eXBlIGNhbWVsY2FzZWQgc3RhcnRpbmcgd2l0aCBhIGNhcGl0YWwgbGV0dGVyLiBUaGUgZnVuY3Rpb25cbiAgICAgICAgICogdGhlbiB0YWtlcyBjYXJlIG9mIHRoZSBicm93c2VyIHNwZWNpZmljcy5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIGVsZW1lbnRcbiAgICAgICAgICogQHBhcmFtIHR5cGVcbiAgICAgICAgICogQHBhcmFtIGNhbGxiYWNrXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBhZGRQcmVmaXhlZEV2ZW50TGlzdGVuZXIoZWxlbWVudCwgdHlwZSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGZvciAodmFyIHAgPSAwOyBwIDwgcGZ4Lmxlbmd0aDsgcCsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFwZnhbcF0uY2FtZWxDYXNlKVxuICAgICAgICAgICAgICAgICAgICB0eXBlID0gdHlwZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihwZnhbcF0uaWQgKyB0eXBlLCBjYWxsYmFjaywgZmFsc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFRvb2xzLmFkZFByZWZpeGVkRXZlbnRMaXN0ZW5lciA9IGFkZFByZWZpeGVkRXZlbnRMaXN0ZW5lcjtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIENvbnZlbmllbmNlIG1ldGhvZCBmb3IgY2FsbGluZyBjYWxsYmFja3NcbiAgICAgICAgICogQHBhcmFtIGNiICAgIFRoZSBjYWxsYmFjayBmdW5jdGlvbiB0byBjYWxsXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBjYWxsQ2FsbGJhY2soY2IpIHtcbiAgICAgICAgICAgIHZhciBhbnkgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIF9pID0gMTsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICAgICAgYW55W19pIC0gMV0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNiKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiAoY2IpID09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYXJncyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXJncy5wdXNoKGFyZ3VtZW50c1tpXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNiLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2FsbGJhY2sgaXMgbm90IGEgZnVuY3Rpb24hXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBUb29scy5jYWxsQ2FsbGJhY2sgPSBjYWxsQ2FsbGJhY2s7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDaGVjayBpZiBzb21ldGhpbmcgaXMgYW4gYXJyYXkuXG4gICAgICAgICAqIEBwYXJhbSB0aGluZ1xuICAgICAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIGlzQXJyYXkodGhpbmcpIHtcbiAgICAgICAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodGhpbmcpID09PSAnW29iamVjdCBBcnJheV0nO1xuICAgICAgICB9XG4gICAgICAgIFRvb2xzLmlzQXJyYXkgPSBpc0FycmF5O1xuICAgICAgICB2YXIgT0lEX1BST1AgPSBcIl9fSURfX1wiO1xuICAgICAgICB2YXIgb2lkcyA9IDEwMDAwO1xuICAgICAgICAvKipcbiAgICAgICAgICogQ3JlYXRlIGFuZCByZXR1cm4gYSB1bmlxdWUgaWQgb24gYSBKYXZhU2NyaXB0IG9iamVjdC4gVGhpcyBhZGRzIGEgbmV3IHByb3BlcnR5XG4gICAgICAgICAqIF9fSURfXyB0byB0aGF0IG9iamVjdC4gSWRzIGFyZSBudW1iZXJzLlxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGUgSUQgaXMgY3JlYXRlZCB0aGUgZmlyc3QgdGltZSB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBmb3IgdGhhdCBvYmplY3QgYW5kIHRoZW5cbiAgICAgICAgICogd2lsbCBzaW1wbHkgYmUgcmV0dXJuZWQgb24gYWxsIHN1YnNlcXVlbnQgY2FsbHMuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSBvYmpcbiAgICAgICAgICogQHJldHVybnMge2FueX1cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIG9pZChvYmopIHtcbiAgICAgICAgICAgIGlmIChvYmopIHtcbiAgICAgICAgICAgICAgICBpZiAoIW9iai5oYXNPd25Qcm9wZXJ0eShPSURfUFJPUCkpIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqW09JRF9QUk9QXSA9IG9pZHMrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9ialtPSURfUFJPUF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgVG9vbHMub2lkID0gb2lkO1xuICAgICAgICBmdW5jdGlvbiBhcHBseU1peGlucyhkZXJpdmVkQ3RvciwgYmFzZUN0b3JzKSB7XG4gICAgICAgICAgICBiYXNlQ3RvcnMuZm9yRWFjaChmdW5jdGlvbiAoYmFzZUN0b3IpIHtcbiAgICAgICAgICAgICAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhiYXNlQ3RvcikuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBkZXJpdmVkQ3Rvci5wcm90b3R5cGVbbmFtZV0gPSBiYXNlQ3RvcltuYW1lXTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBVc2UgdGhpcyB0byBzdWJjbGFzcyBhIHR5cGVzY3JpcHQgY2xhc3MgdXNpbmcgcGxhaW4gSmF2YVNjcmlwdC4gU3BlYyBpcyBhbiBvYmplY3RcbiAgICAgICAgICogY29udGFpbmluZyBwcm9wZXJ0aWVzIGFuZCBtZXRob2RzIG9mIHRoZSBuZXcgY2xhc3MuIE1ldGhvZHMgaW4gc3BlYyB3aWxsIG92ZXJyaWRlXG4gICAgICAgICAqIG1ldGhvZHMgaW4gYmFzZUNsYXNzLlxuICAgICAgICAgKlxuICAgICAgICAgKiBZb3Ugd2lsbCBOT1QgYmUgYWJsZSB0byBtYWtlIHN1cGVyIGNhbGxzIGluIHRoZSBzdWJjbGFzcy5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHNwZWNcbiAgICAgICAgICogQHBhcmFtIGJhc2VDbGFzc1xuICAgICAgICAgKiBAcmV0dXJucyB7YW55fVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gc3ViY2xhc3Moc3BlYywgYmFzZUNsYXNzKSB7XG4gICAgICAgICAgICB2YXIgY29uc3RydWN0b3I7XG4gICAgICAgICAgICBpZiAoc3BlYy5oYXNPd25Qcm9wZXJ0eShcImNvbnN0cnVjdG9yXCIpKSB7XG4gICAgICAgICAgICAgICAgY29uc3RydWN0b3IgPSBzcGVjW1wiY29uc3RydWN0b3JcIl07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdHJ1Y3RvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgYmFzZUNsYXNzLnByb3RvdHlwZS5jb25zdHJ1Y3Rvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdHJ1Y3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKGJhc2VDbGFzcy5wcm90b3R5cGUpO1xuICAgICAgICAgICAgYXBwbHlNaXhpbnMoY29uc3RydWN0b3IsIFtzcGVjXSk7XG4gICAgICAgICAgICByZXR1cm4gY29uc3RydWN0b3I7XG4gICAgICAgIH1cbiAgICAgICAgVG9vbHMuc3ViY2xhc3MgPSBzdWJjbGFzcztcbiAgICB9KShUb29scyA9IEZsdXNzLlRvb2xzIHx8IChGbHVzcy5Ub29scyA9IHt9KSk7XG59KShGbHVzcyB8fCAoRmx1c3MgPSB7fSkpO1xuaWYgKHR5cGVvZiBleHBvcnRzICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgZXhwb3J0cy5Ub29scyA9IEZsdXNzLlRvb2xzO1xufVxuaWYgKHR5cGVvZiB0aGlzW1wiZGVmaW5lXCJdID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICB0aGlzW1wiZGVmaW5lXCJdKFtdLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBGbHVzcy5Ub29scztcbiAgICB9KTtcbn1cblxuLyoqXG4gKiBDcmVhdGVkIGJ5IFN0ZXBoYW4uU21vbGEgb24gMjguMTAuMjAxNC5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgRmx1c3M7XG4oZnVuY3Rpb24gKEZsdXNzKSB7XG4gICAgdmFyIEVtaXR0ZXI7XG4gICAgKGZ1bmN0aW9uIChfRW1pdHRlcikge1xuICAgICAgICAvKipcbiAgICAgICAgICogQW4gZXZlbnQtZW1pdHRlclxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIEVtaXR0ZXIgPSAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZnVuY3Rpb24gRW1pdHRlcigpIHtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIEVtaXR0ZXIucHJvdG90eXBlLnN1YnNjcmliZSA9IGZ1bmN0aW9uIChldmVudCwgaGFuZGxlcikge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5fZXZlbnRIYW5kbGVycykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudEhhbmRsZXJzID0ge307XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5fZXZlbnRIYW5kbGVyc1tldmVudF0pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRIYW5kbGVyc1tldmVudF0gPSBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRIYW5kbGVyc1tldmVudF0ucHVzaChoYW5kbGVyKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBFbWl0dGVyLnByb3RvdHlwZS51bnN1YnNjcmliZSA9IGZ1bmN0aW9uIChldmVudCwgaGFuZGxlcikge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5fZXZlbnRIYW5kbGVycykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9ldmVudEhhbmRsZXJzW2V2ZW50XSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudEhhbmRsZXJzW2V2ZW50XS5zcGxpY2UodGhpcy5fZXZlbnRIYW5kbGVyc1tldmVudF0uaW5kZXhPZihoYW5kbGVyKSwgMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFbWl0dGVyLnByb3RvdHlwZSwgXCJldmVudEhhbmRsZXJzXCIsIHtcbiAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2V2ZW50SGFuZGxlcnM7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBfaSA9IDE7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgICAgICAgICBhcmdzW19pIC0gMV0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2V2ZW50SGFuZGxlcnMgJiYgdGhpcy5fZXZlbnRIYW5kbGVyc1tldmVudF0pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRIYW5kbGVyc1tldmVudF0uZm9yRWFjaChmdW5jdGlvbiAoaGFuZGxlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlci5hcHBseSh0aGF0LCBhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIEVtaXR0ZXIucHJvdG90eXBlLnJlbGF5ID0gZnVuY3Rpb24gKGVtaXR0ZXIsIHN1YnNjcmliaW5nRXZlbnQsIGVtaXR0aW5nRXZlbnQpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgZW1pdHRlci5zdWJzY3JpYmUoc3Vic2NyaWJpbmdFdmVudCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYXJncyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXJnc1tfaSAtIDBdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGF0LmVtaXQuYXBwbHkodGhhdCwgW2VtaXR0aW5nRXZlbnRdLmNvbmNhdChhcmdzKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIEVtaXR0ZXI7XG4gICAgICAgIH0pKCk7XG4gICAgICAgIF9FbWl0dGVyLkVtaXR0ZXIgPSBFbWl0dGVyO1xuICAgIH0pKEVtaXR0ZXIgPSBGbHVzcy5FbWl0dGVyIHx8IChGbHVzcy5FbWl0dGVyID0ge30pKTtcbn0pKEZsdXNzIHx8IChGbHVzcyA9IHt9KSk7XG5pZiAodHlwZW9mIGV4cG9ydHMgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBleHBvcnRzLkVtaXR0ZXIgPSBGbHVzcy5FbWl0dGVyO1xufVxuaWYgKHR5cGVvZiB0aGlzW1wiZGVmaW5lXCJdID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICB0aGlzW1wiZGVmaW5lXCJdKFtdLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBGbHVzcy5FbWl0dGVyO1xuICAgIH0pO1xufVxuXG4vKipcbiAqIENyZWF0ZWQgYnkgU3RlcGhhbiBvbiAyNy4xMi4yMDE0LlxuICpcbiAqIEEgc2ltcGxlIGltcGxlbWVudGF0aW9uIG9mIGEgY29sbGVjdGlvbiBzdHJlYW0gdGhhdCBzdXBwb3J0cyByZWFjdGl2ZSBwYXR0ZXJucy5cbiAqXG4gKi9cblwidXNlIHN0cmljdFwiO1xudmFyIEZsdXNzO1xuKGZ1bmN0aW9uIChGbHVzcykge1xuICAgIHZhciBTdHJlYW07XG4gICAgKGZ1bmN0aW9uIChfU3RyZWFtKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBCYXNlIGltcGxlbWVudGF0aW9uIG9mIHRoZSBjb2xsZWN0aW9uIHN0cmVhbVxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIFN0cmVhbSA9IChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBmdW5jdGlvbiBTdHJlYW0oX25hbWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9uYW1lID0gX25hbWU7XG4gICAgICAgICAgICAgICAgdGhpcy5fYnVmZmVyID0gW107XG4gICAgICAgICAgICAgICAgdGhpcy5fbWV0aG9kcyA9IFtdO1xuICAgICAgICAgICAgICAgIHRoaXMuX2Vycm9yTWV0aG9kcyA9IFtdO1xuICAgICAgICAgICAgICAgIHRoaXMuX2Nsb3NlTWV0aG9kcyA9IFtdO1xuICAgICAgICAgICAgICAgIHRoaXMuX2Nsb3NlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHRoaXMuX2xlbmd0aCA9IDA7XG4gICAgICAgICAgICAgICAgdGhpcy5fbWF4TGVuZ3RoID0gMDtcbiAgICAgICAgICAgICAgICB0aGlzLl9uZXh0U3RyZWFtcyA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFN0cmVhbS5wcm90b3R5cGUsIFwibmFtZVwiLCB7XG4gICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9uYW1lO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFN0cmVhbS5wcm90b3R5cGUsIFwibGVuZ3RoXCIsIHtcbiAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2xlbmd0aDtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFN0cmVhbS5wcm90b3R5cGUuY2FsbENsb3NlTWV0aG9kcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgdGhpcy5fY2xvc2VNZXRob2RzLmZvckVhY2goZnVuY3Rpb24gKG0pIHtcbiAgICAgICAgICAgICAgICAgICAgbS5jYWxsKHRoYXQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFN0cmVhbS5wcm90b3R5cGUuY2xvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9jbG9zZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2xvc2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYWxsQ2xvc2VNZXRob2RzKCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBTdHJlYW0ucHJvdG90eXBlLmRpc3Bvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuX21ldGhvZHMgPSBbXTtcbiAgICAgICAgICAgICAgICB0aGlzLl9idWZmZXIgPSBbXTtcbiAgICAgICAgICAgICAgICB0aGlzLl9jbG9zZU1ldGhvZHMgPSBbXTtcbiAgICAgICAgICAgICAgICB0aGlzLl9lcnJvck1ldGhvZHMgPSBbXTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBTdHJlYW0ucHJvdG90eXBlLnRpbWVzID0gZnVuY3Rpb24gKG1heExlbmd0aCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX21heExlbmd0aCA9IG1heExlbmd0aDtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBTdHJlYW0ucHJvdG90eXBlLnVudGlsID0gZnVuY3Rpb24gKHN0cmVhbSkge1xuICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICAgICBpZiAoc3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbS5mb3JFYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTdHJlYW0ucHJvdG90eXBlLCBcImNsb3NlZFwiLCB7XG4gICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9jbG9zZWQ7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBTdHJlYW0ucHJvdG90eXBlLmFkZFRvQnVmZmVyID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fYnVmZmVyLnVuc2hpZnQodmFsdWUpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFN0cmVhbS5wcm90b3R5cGUucHJvY2Vzc0J1ZmZlciA9IGZ1bmN0aW9uIChidWZmZXIsIG1ldGhvZHMsIGJhc2VJbmRleCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9jbG9zZWQpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIGlmICghbWV0aG9kcy5sZW5ndGgpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIHZhciBsID0gYnVmZmVyLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgdmFyIGVycm9ycyA9IFtdO1xuICAgICAgICAgICAgICAgIHdoaWxlIChsLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gYnVmZmVyLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICBtZXRob2RzLmZvckVhY2goZnVuY3Rpb24gKG0sIGkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbS5jYWxsKHRoYXQsIHZhbHVlLCBpICsgYmFzZUluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JzLnB1c2goZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyb3JzO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFN0cmVhbS5wcm90b3R5cGUucHJvY2Vzc0J1ZmZlcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVycm9ycyA9IHRoaXMucHJvY2Vzc0J1ZmZlcih0aGlzLl9idWZmZXIsIHRoaXMuX21ldGhvZHMsIHRoaXMuX2xlbmd0aCAtIHRoaXMuX2J1ZmZlci5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIGlmIChlcnJvcnMgJiYgZXJyb3JzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fZXJyb3JNZXRob2RzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9jZXNzQnVmZmVyKGVycm9ycywgdGhpcy5fZXJyb3JNZXRob2RzLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9ycy5mb3JFYWNoKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFN0cmVhbS5wcm90b3R5cGUuYWRkTWV0aG9kID0gZnVuY3Rpb24gKG1ldGhvZCkge1xuICAgICAgICAgICAgICAgIHZhciBmaXJzdE1ldGhvZCA9IHRoaXMuX21ldGhvZHMubGVuZ3RoID09PSAwO1xuICAgICAgICAgICAgICAgIHRoaXMuX21ldGhvZHMucHVzaChtZXRob2QpO1xuICAgICAgICAgICAgICAgIGlmIChmaXJzdE1ldGhvZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2Nlc3NCdWZmZXJzKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFN0cmVhbS5wcm90b3R5cGUucmVtb3ZlTWV0aG9kID0gZnVuY3Rpb24gKG1ldGhvZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX21ldGhvZHMuaW5kZXhPZihtZXRob2QpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFN0cmVhbS5wcm90b3R5cGUuYWRkRXJyb3JNZXRob2QgPSBmdW5jdGlvbiAobWV0aG9kKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZXJyb3JNZXRob2RzLnB1c2gobWV0aG9kKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBTdHJlYW0ucHJvdG90eXBlLmFkZENsb3NlTWV0aG9kID0gZnVuY3Rpb24gKG1ldGhvZCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNsb3NlZCkge1xuICAgICAgICAgICAgICAgICAgICBtZXRob2QuY2FsbCh0aGlzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2Nsb3NlTWV0aG9kcy5wdXNoKG1ldGhvZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFN0cmVhbS5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5fY2xvc2VkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkVG9CdWZmZXIodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9sZW5ndGgrKztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9jZXNzQnVmZmVycygpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fbGVuZ3RoID09PSB0aGlzLl9tYXhMZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBTdHJlYW0ucHJvdG90eXBlLnB1c2hFcnJvciA9IGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgICAgIC8vIElmIHdlIGNhbid0IGhhbmRsZSB0aGUgZXJyb3Igb3Vyc2VsdmVzIHdlIHRocm93IGl0IGFnYWluLiBUaGF0IHdpbGwgZ2l2ZSBwcmVjZWRpbmcgc3RyZWFtcyB0aGUgY2hhbmNlIHRvIGhhbmRsZSB0aGVzZVxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5fZXJyb3JNZXRob2RzIHx8ICF0aGlzLl9lcnJvck1ldGhvZHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnByb2Nlc3NCdWZmZXIoW2Vycm9yXSwgdGhpcy5fZXJyb3JNZXRob2RzLCAwKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBTdHJlYW0ucHJvdG90eXBlLmZvckVhY2ggPSBmdW5jdGlvbiAobWV0aG9kKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRNZXRob2QobWV0aG9kKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBTdHJlYW0ucHJvdG90eXBlLnJlZ2lzdGVyTmV4dFN0cmVhbSA9IGZ1bmN0aW9uIChuZXh0U3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgICAgIHRoaXMuX25leHRTdHJlYW1zLnB1c2gobmV4dFN0cmVhbSk7XG4gICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5vbkNsb3NlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGkgPSB0aGF0Ll9uZXh0U3RyZWFtcy5pbmRleE9mKG5leHRTdHJlYW0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuX25leHRTdHJlYW1zLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGhhdC5fbmV4dFN0cmVhbXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5jbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgU3RyZWFtLnByb3RvdHlwZS5hZGRNZXRob2RUb05leHRTdHJlYW0gPSBmdW5jdGlvbiAobmV4dFN0cmVhbSwgbWV0aG9kLCBvbkNsb3NlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgICAgIHZhciBmbiA9IGZ1bmN0aW9uICh2YWx1ZSwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZC5jYWxsKHRoYXQsIHZhbHVlLCBpbmRleCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5leHRTdHJlYW0ucHVzaEVycm9yKGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZE1ldGhvZChmbik7XG4gICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5vbkNsb3NlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5yZW1vdmVNZXRob2QoZm4pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMucmVnaXN0ZXJOZXh0U3RyZWFtKG5leHRTdHJlYW0pO1xuICAgICAgICAgICAgICAgIGlmICghb25DbG9zZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uQ2xvc2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5jbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25DbG9zZShvbkNsb3NlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgU3RyZWFtLnByb3RvdHlwZS5maWx0ZXIgPSBmdW5jdGlvbiAobWV0aG9kKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5leHRTdHJlYW0gPSBuZXcgU3RyZWFtKHRoaXMuX25hbWUgKyBcIi5maWx0ZXJcIik7XG4gICAgICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbWV0aG9kID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRNZXRob2RUb05leHRTdHJlYW0obmV4dFN0cmVhbSwgZnVuY3Rpb24gKHZhbHVlLCBpbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1ldGhvZC5jYWxsKHRoYXQsIHZhbHVlLCBpbmRleCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXh0U3RyZWFtLnB1c2godmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkTWV0aG9kVG9OZXh0U3RyZWFtKG5leHRTdHJlYW0sIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1ldGhvZCA9PSB2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5leHRTdHJlYW0ucHVzaCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fY2xvc2VkKSB7XG4gICAgICAgICAgICAgICAgICAgIG5leHRTdHJlYW0uY2xvc2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5leHRTdHJlYW07XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgU3RyZWFtLnByb3RvdHlwZS5tYXAgPSBmdW5jdGlvbiAobWV0aG9kKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5leHRTdHJlYW0gPSBuZXcgU3RyZWFtKHRoaXMuX25hbWUgKyBcIi5tYXBcIik7XG4gICAgICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbWV0aG9kID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRNZXRob2RUb05leHRTdHJlYW0obmV4dFN0cmVhbSwgZnVuY3Rpb24gKHZhbHVlLCBpbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5wdXNoKG1ldGhvZC5jYWxsKHRoYXQsIHZhbHVlLCBpbmRleCkpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkTWV0aG9kVG9OZXh0U3RyZWFtKG5leHRTdHJlYW0sIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5wdXNoKG1ldGhvZCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fY2xvc2VkKSB7XG4gICAgICAgICAgICAgICAgICAgIG5leHRTdHJlYW0uY2xvc2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5leHRTdHJlYW07XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgU3RyZWFtLnByb3RvdHlwZS5zY2FuID0gZnVuY3Rpb24gKG1ldGhvZCwgc2VlZCkge1xuICAgICAgICAgICAgICAgIHZhciBuZXh0U3RyZWFtID0gbmV3IFN0cmVhbSh0aGlzLl9uYW1lICsgXCIuc2NhblwiKTtcbiAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgdmFyIHNjYW5uZWQgPSBzZWVkO1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkTWV0aG9kVG9OZXh0U3RyZWFtKG5leHRTdHJlYW0sIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBzY2FubmVkID0gbWV0aG9kLmNhbGwodGhhdCwgc2Nhbm5lZCwgdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBuZXh0U3RyZWFtLnB1c2goc2Nhbm5lZCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5wdXNoKHNjYW5uZWQpO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9jbG9zZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5jbG9zZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbmV4dFN0cmVhbTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBTdHJlYW0ucHJvdG90eXBlLnJlZHVjZSA9IGZ1bmN0aW9uIChtZXRob2QsIHNlZWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgbmV4dFN0cmVhbSA9IG5ldyBTdHJlYW0odGhpcy5fbmFtZSArIFwiLnJlZHVjZVwiKTtcbiAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgdmFyIHJlZHVjZWQgPSBzZWVkO1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkTWV0aG9kVG9OZXh0U3RyZWFtKG5leHRTdHJlYW0sIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICByZWR1Y2VkID0gbWV0aG9kLmNhbGwodGhhdCwgcmVkdWNlZCwgdmFsdWUpO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5wdXNoKHJlZHVjZWQpO1xuICAgICAgICAgICAgICAgICAgICBuZXh0U3RyZWFtLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2Nsb3NlZCkge1xuICAgICAgICAgICAgICAgICAgICBuZXh0U3RyZWFtLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMucmVnaXN0ZXJOZXh0U3RyZWFtKG5leHRTdHJlYW0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXh0U3RyZWFtO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFN0cmVhbS5wcm90b3R5cGUuY29uY2F0ID0gZnVuY3Rpb24gKHN0cmVhbSkge1xuICAgICAgICAgICAgICAgIHZhciBuZXh0U3RyZWFtID0gbmV3IFN0cmVhbSh0aGlzLl9uYW1lICsgXCIuY29uY2F0XCIpO1xuICAgICAgICAgICAgICAgIHZhciBidWZmZXIgPSBudWxsO1xuICAgICAgICAgICAgICAgIC8vIFdoZW4gdGhpcyBpcyBhbHJlYWR5IGNsb3NlZCwgd2Ugb25seSBjYXJlIGZvciB0aGUgb3RoZXIgc3RyZWFtXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9jbG9zZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgYnVmZmVyID0gW107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3RyZWFtLmNsb3NlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5jbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIFdlIG5lZWQgdG8gYnVmZmVyLCBiZWNhdXNlIHRoaXMgbWF5IG5vdCBiZSB0aGUgZmlyc3RcbiAgICAgICAgICAgICAgICAvLyBtZXRob2QgYXR0YWNoZWQgdG8gdGhlIHN0cmVhbS4gT3RoZXJ3aXNlIGFueSBkYXRhIHRoYXRcbiAgICAgICAgICAgICAgICAvLyBpcyBwdXNoZWQgdG8gc3RyZWFtIGJlZm9yZSB0aGUgb3JpZ2luYWwgaXMgY2xvc2VkIHdvdWxkXG4gICAgICAgICAgICAgICAgLy8gYmUgbG9zdCBmb3IgdGhlIGNvbmNhdC5cbiAgICAgICAgICAgICAgICBzdHJlYW0uZm9yRWFjaChmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGJ1ZmZlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyLnB1c2godmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5wdXNoKHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHN0cmVhbS5vbkNsb3NlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFidWZmZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5leHRTdHJlYW0uY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkTWV0aG9kVG9OZXh0U3RyZWFtKG5leHRTdHJlYW0sIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBuZXh0U3RyZWFtLnB1c2godmFsdWUpO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGJ1ZmZlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyLmZvckVhY2goZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5wdXNoKHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdHJlYW0uY2xvc2VkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0U3RyZWFtLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnVmZmVyID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fY2xvc2VkICYmIHN0cmVhbS5jbG9zZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5jbG9zZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbmV4dFN0cmVhbTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBTdHJlYW0ucHJvdG90eXBlLmNvbmNhdEFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgbmV4dFN0cmVhbSA9IG5ldyBTdHJlYW0odGhpcy5fbmFtZSArIFwiLmNvbmNhdEFsbFwiKTtcbiAgICAgICAgICAgICAgICB2YXIgcXVldWUgPSBbXTtcbiAgICAgICAgICAgICAgICB2YXIgY3Vyc29yID0gbnVsbDtcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBuZXh0SW5RdWV1ZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGwgPSBxdWV1ZS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChsLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnNvciA9IHF1ZXVlW2xdO1xuICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3Vyc29yLmRvbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWV1ZS5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHVwZGF0ZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnNvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGwgPSBjdXJzb3IuZGF0YS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAobC0tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5wdXNoKGN1cnNvci5kYXRhLnBvcCgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBjb25jYXRTdHJlYW0oc3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzdWJCdWZmZXIgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiBbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvbmU6IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHF1ZXVlLnVuc2hpZnQoc3ViQnVmZmVyKTtcbiAgICAgICAgICAgICAgICAgICAgc3RyZWFtLmZvckVhY2goZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJCdWZmZXIuZGF0YS51bnNoaWZ0KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgc3RyZWFtLm9uQ2xvc2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3ViQnVmZmVyLmRvbmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dEluUXVldWUoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnNvciA9IHN1YkJ1ZmZlcjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmZvckVhY2goZnVuY3Rpb24gKHN1YlN0cmVhbSkge1xuICAgICAgICAgICAgICAgICAgICBjb25jYXRTdHJlYW0oc3ViU3RyZWFtKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLm9uQ2xvc2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBuZXh0U3RyZWFtLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2Nsb3NlZCkge1xuICAgICAgICAgICAgICAgICAgICBuZXh0U3RyZWFtLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMucmVnaXN0ZXJOZXh0U3RyZWFtKG5leHRTdHJlYW0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXh0U3RyZWFtO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFN0cmVhbS5wcm90b3R5cGUuY29tYmluZSA9IGZ1bmN0aW9uIChzdHJlYW0pIHtcbiAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgdmFyIG5leHRTdHJlYW0gPSBuZXcgU3RyZWFtKHRoaXMuX25hbWUgKyBcIi5jb21iaW5lXCIpO1xuICAgICAgICAgICAgICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5wdXNoKHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBzdHJlYW0uZm9yRWFjaChmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5wdXNoKHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLm9uQ2xvc2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3RyZWFtLmNsb3NlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5jbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgc3RyZWFtLm9uQ2xvc2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhhdC5fY2xvc2VkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0U3RyZWFtLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fY2xvc2VkICYmIHN0cmVhbS5jbG9zZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5jbG9zZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnJlZ2lzdGVyTmV4dFN0cmVhbShuZXh0U3RyZWFtKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV4dFN0cmVhbTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBTdHJlYW0ucHJvdG90eXBlLm9uQ2xvc2UgPSBmdW5jdGlvbiAobWV0aG9kKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRDbG9zZU1ldGhvZChtZXRob2QpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFN0cmVhbS5wcm90b3R5cGUub25FcnJvciA9IGZ1bmN0aW9uIChtZXRob2QpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEVycm9yTWV0aG9kKG1ldGhvZCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIFN0cmVhbTtcbiAgICAgICAgfSkoKTtcbiAgICAgICAgX1N0cmVhbS5TdHJlYW0gPSBTdHJlYW07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDcmVhdGUgYSBuZXcgc3RyZWFtLiBUaGUgbmFtZSBpcyBtb3N0bHkgZm9yIGRlYnVnZ2luZyBwdXJwb3NlcyBhbmQgY2FuIGJlIG9taXR0ZWQuIEl0IGRlZmF1bHRzIHRvICdzdHJlYW0nIHRoZW4uXG4gICAgICAgICAqIEBwYXJhbSBuYW1lXG4gICAgICAgICAqIEByZXR1cm5zIHtTdHJlYW19XG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBjcmVhdGVTdHJlYW0obmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBTdHJlYW0obmFtZSB8fCBcInN0cmVhbVwiKTtcbiAgICAgICAgfVxuICAgICAgICBfU3RyZWFtLmNyZWF0ZVN0cmVhbSA9IGNyZWF0ZVN0cmVhbTtcbiAgICB9KShTdHJlYW0gPSBGbHVzcy5TdHJlYW0gfHwgKEZsdXNzLlN0cmVhbSA9IHt9KSk7XG59KShGbHVzcyB8fCAoRmx1c3MgPSB7fSkpO1xuaWYgKHR5cGVvZiBleHBvcnRzICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgZXhwb3J0cy5TdHJlYW0gPSBGbHVzcy5TdHJlYW07XG59XG5pZiAodHlwZW9mIHRoaXNbXCJkZWZpbmVcIl0gPT09IFwiZnVuY3Rpb25cIikge1xuICAgIHRoaXNbXCJkZWZpbmVcIl0oW10sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIEZsdXNzLlN0cmVhbTtcbiAgICB9KTtcbn1cblxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vdG9vbHMudHNcIiAvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vc3RyZWFtLnRzXCIgLz5cbi8qKlxuICogQ3JlYXRlZCBieSBTdGVwaGFuIG9uIDI5LjEyLjIwMTQuXG4gKi9cblwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9IHRoaXMuX19leHRlbmRzIHx8IGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07XG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XG4gICAgX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGU7XG4gICAgZC5wcm90b3R5cGUgPSBuZXcgX18oKTtcbn07XG52YXIgRmx1c3M7XG4oZnVuY3Rpb24gKEZsdXNzKSB7XG4gICAgdmFyIFN0b3JlO1xuICAgIChmdW5jdGlvbiAoX1N0b3JlKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUZXN0IGlmIHNvbWV0aGluZyBpcyBhIHN0b3JlLlxuICAgICAgICAgKiBAcGFyYW0gdGhpbmdcbiAgICAgICAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBpc1N0b3JlKHRoaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpbmcgaW5zdGFuY2VvZiBSZWNvcmRTdG9yZSB8fCB0aGluZyBpbnN0YW5jZW9mIEFycmF5U3RvcmUgfHwgdGhpbmcgaW5zdGFuY2VvZiBJbW11dGFibGVSZWNvcmQgfHwgdGhpbmcgaW5zdGFuY2VvZiBJbW11dGFibGVBcnJheTtcbiAgICAgICAgfVxuICAgICAgICBfU3RvcmUuaXNTdG9yZSA9IGlzU3RvcmU7XG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZVVwZGF0ZUluZm8oaXRlbSwgdmFsdWUsIHN0b3JlLCBwYXRoLCByb290SXRlbSkge1xuICAgICAgICAgICAgdmFyIHIgPSB7XG4gICAgICAgICAgICAgICAgaXRlbTogaXRlbSxcbiAgICAgICAgICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgICAgICAgICAgc3RvcmU6IHN0b3JlXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKHBhdGgpIHtcbiAgICAgICAgICAgICAgICByW1wicGF0aFwiXSA9IHBhdGg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocm9vdEl0ZW0gIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJbXCJyb290SXRlbVwiXSA9IHJvb3RJdGVtO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcltcInJvb3RJdGVtXCJdID0gaXRlbTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByO1xuICAgICAgICB9XG4gICAgICAgIHZhciBTdG9yZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBmdW5jdGlvbiBTdG9yZSgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9hZGRJdGVtc1N0cmVhbXMgPSBbXTtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZW1vdmVJdGVtc1N0cmVhbXMgPSBbXTtcbiAgICAgICAgICAgICAgICB0aGlzLl91cGRhdGVTdHJlYW1zID0gW107XG4gICAgICAgICAgICAgICAgdGhpcy5fZGlzcG9zaW5nU3RyZWFtcyA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFN0b3JlLnByb3RvdHlwZSwgXCJpc0ltbXV0YWJsZVwiLCB7XG4gICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFN0b3JlLnByb3RvdHlwZS5yZW1vdmVTdHJlYW0gPSBmdW5jdGlvbiAobGlzdCwgc3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgdmFyIGkgPSBsaXN0LmluZGV4T2Yoc3RyZWFtKTtcbiAgICAgICAgICAgICAgICBpZiAoaSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgbGlzdC5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTdG9yZS5wcm90b3R5cGUsIFwibmV3SXRlbXNcIiwge1xuICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzID0gRmx1c3MuU3RyZWFtLmNyZWF0ZVN0cmVhbShcImFkZFByb3BlcnR5XCIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9hZGRJdGVtc1N0cmVhbXMucHVzaChzKTtcbiAgICAgICAgICAgICAgICAgICAgcy5vbkNsb3NlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQucmVtb3ZlU3RyZWFtKHRoYXQuX2FkZEl0ZW1zU3RyZWFtcywgcyk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcztcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTdG9yZS5wcm90b3R5cGUsIFwicmVtb3ZlZEl0ZW1zXCIsIHtcbiAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcyA9IEZsdXNzLlN0cmVhbS5jcmVhdGVTdHJlYW0oXCJyZW1vdmVQcm9wZXJ0eVwiKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcmVtb3ZlSXRlbXNTdHJlYW1zLnB1c2gocyk7XG4gICAgICAgICAgICAgICAgICAgIHMub25DbG9zZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnJlbW92ZVN0cmVhbSh0aGF0Ll9yZW1vdmVJdGVtc1N0cmVhbXMsIHMpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcy51bnRpbCh0aGlzLmlzRGlzcG9zaW5nKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHM7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU3RvcmUucHJvdG90eXBlLCBcInVwZGF0ZXNcIiwge1xuICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzID0gRmx1c3MuU3RyZWFtLmNyZWF0ZVN0cmVhbShcInVwZGF0ZVByb3BlcnR5XCIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl91cGRhdGVTdHJlYW1zLnB1c2gocyk7XG4gICAgICAgICAgICAgICAgICAgIHMub25DbG9zZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnJlbW92ZVN0cmVhbSh0aGF0Ll91cGRhdGVTdHJlYW1zLCBzKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFN0b3JlLnByb3RvdHlwZSwgXCJhbGxDaGFuZ2VzXCIsIHtcbiAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudXBkYXRlcy5jb21iaW5lKHRoaXMubmV3SXRlbXMpLmNvbWJpbmUodGhpcy5yZW1vdmVkSXRlbXMpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFN0b3JlLnByb3RvdHlwZSwgXCJpc0Rpc3Bvc2luZ1wiLCB7XG4gICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgdmFyIHMgPSBGbHVzcy5TdHJlYW0uY3JlYXRlU3RyZWFtKFwiZGlzcG9zaW5nXCIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9kaXNwb3NpbmdTdHJlYW1zLnB1c2gocyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgU3RvcmUucHJvdG90eXBlLmRpc3Bvc2VTdHJlYW1zID0gZnVuY3Rpb24gKHN0cmVhbUxpc3QpIHtcbiAgICAgICAgICAgICAgICBzdHJlYW1MaXN0LmZvckVhY2goZnVuY3Rpb24gKHN0cmVhbSkge1xuICAgICAgICAgICAgICAgICAgICBzdHJlYW0uZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHN0cmVhbUxpc3QgPSBbXTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBTdG9yZS5wcm90b3R5cGUuZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9kaXNwb3NpbmdTdHJlYW1zLmZvckVhY2goZnVuY3Rpb24gKHN0cmVhbSkge1xuICAgICAgICAgICAgICAgICAgICBzdHJlYW0ucHVzaCh0cnVlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2VTdHJlYW1zKHRoaXMuX3JlbW92ZUl0ZW1zU3RyZWFtcyk7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NlU3RyZWFtcyh0aGlzLl91cGRhdGVTdHJlYW1zKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2VTdHJlYW1zKHRoaXMuX2FkZEl0ZW1zU3RyZWFtcyk7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NlU3RyZWFtcyh0aGlzLl9kaXNwb3NpbmdTdHJlYW1zKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU3RvcmUucHJvdG90eXBlLCBcImltbXV0YWJsZVwiLCB7XG4gICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgU3RvcmUucHJvdG90eXBlLml0ZW0gPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIFN0b3JlO1xuICAgICAgICB9KSgpO1xuICAgICAgICAvKipcbiAgICAgICAgICogQmFzZSBjbGFzcyBmb3IgaW1tdXRhYmxlIHN0b3Jlcy5cbiAgICAgICAgICovXG4gICAgICAgIHZhciBJbW11dGFibGVTdG9yZSA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgICAgICAgICBfX2V4dGVuZHMoSW1tdXRhYmxlU3RvcmUsIF9zdXBlcik7XG4gICAgICAgICAgICBmdW5jdGlvbiBJbW11dGFibGVTdG9yZSgpIHtcbiAgICAgICAgICAgICAgICBfc3VwZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBJbW11dGFibGVTdG9yZTtcbiAgICAgICAgfSkoU3RvcmUpO1xuICAgICAgICB2YXIgUmVjb3JkU3RvcmUgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgICAgICAgICAgX19leHRlbmRzKFJlY29yZFN0b3JlLCBfc3VwZXIpO1xuICAgICAgICAgICAgZnVuY3Rpb24gUmVjb3JkU3RvcmUoaW5pdGlhbCkge1xuICAgICAgICAgICAgICAgIF9zdXBlci5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2RhdGEgPSB7fTtcbiAgICAgICAgICAgICAgICB0aGlzLl9zdWJTdHJlYW1zID0ge307XG4gICAgICAgICAgICAgICAgaWYgKGluaXRpYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBpbml0aWFsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5pdGlhbC5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkSXRlbShwcm9wLCBpbml0aWFsW3Byb3BdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFJlY29yZFN0b3JlLnByb3RvdHlwZS5jaGVja05hbWVBbGxvd2VkID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBSZWNvcmRTdG9yZS5wcm90b3R5cGUuc2V0dXBTdWJTdHJlYW0gPSBmdW5jdGlvbiAobmFtZSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2VTdWJTdHJlYW0obmFtZSk7XG4gICAgICAgICAgICAgICAgaWYgKGlzU3RvcmUodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzdWJTdHJlYW07XG4gICAgICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgc3ViU3RyZWFtID0gdmFsdWUudXBkYXRlcztcbiAgICAgICAgICAgICAgICAgICAgc3ViU3RyZWFtLmZvckVhY2goZnVuY3Rpb24gKHVwZGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGluZm8gPSBjcmVhdGVVcGRhdGVJbmZvKHVwZGF0ZS5pdGVtLCB1cGRhdGUudmFsdWUsIHVwZGF0ZS5zdG9yZSwgdXBkYXRlLnBhdGggPyBuYW1lICsgXCIuXCIgKyB1cGRhdGUucGF0aCA6IG5hbWUgKyBcIi5cIiArIHVwZGF0ZS5pdGVtLCBuYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuX3VwZGF0ZVN0cmVhbXMuZm9yRWFjaChmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RyZWFtLnB1c2goaW5mbyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N1YlN0cmVhbXNbbmFtZV0gPSBzdWJTdHJlYW07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFJlY29yZFN0b3JlLnByb3RvdHlwZS5kaXNwb3NlU3ViU3RyZWFtID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3ViU3RyZWFtID0gdGhpcy5fc3ViU3RyZWFtc1tuYW1lXTtcbiAgICAgICAgICAgICAgICBpZiAoc3ViU3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1YlN0cmVhbS5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFJlY29yZFN0b3JlLnByb3RvdHlwZS5hZGRJdGVtID0gZnVuY3Rpb24gKG5hbWUsIGluaXRpYWwpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuY2hlY2tOYW1lQWxsb3dlZChuYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOYW1lICdcIiArIG5hbWUgKyBcIicgbm90IGFsbG93ZWQgZm9yIHByb3BlcnR5IG9mIG9iamVjdCBzdG9yZS5cIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgbmFtZSwge1xuICAgICAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoYXQuX2RhdGFbbmFtZV07XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0Ll9kYXRhW25hbWVdID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdXBkYXRlSW5mbyA9IGNyZWF0ZVVwZGF0ZUluZm8obmFtZSwgdmFsdWUsIHRoYXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5zZXR1cFN1YlN0cmVhbShuYW1lLCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0Ll91cGRhdGVTdHJlYW1zLmZvckVhY2goZnVuY3Rpb24gKHN0cmVhbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cmVhbS5wdXNoKHVwZGF0ZUluZm8pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLl9kYXRhW25hbWVdID0gaW5pdGlhbDtcbiAgICAgICAgICAgICAgICB0aGlzLnNldHVwU3ViU3RyZWFtKG5hbWUsIGluaXRpYWwpO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9hZGRJdGVtc1N0cmVhbXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYWRkSXRlbXNTdHJlYW1zLmZvckVhY2goZnVuY3Rpb24gKHN0cmVhbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RyZWFtLnB1c2goY3JlYXRlVXBkYXRlSW5mbyhuYW1lLCBpbml0aWFsLCB0aGF0KSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBSZWNvcmRTdG9yZS5wcm90b3R5cGUucmVtb3ZlSXRlbSA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2RhdGEuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHRoaXNbbmFtZV07XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9kYXRhW25hbWVdO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zZVN1YlN0cmVhbShuYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcmVtb3ZlSXRlbXNTdHJlYW1zLmZvckVhY2goZnVuY3Rpb24gKHN0cmVhbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RyZWFtLnB1c2goY3JlYXRlVXBkYXRlSW5mbyhuYW1lLCBudWxsLCB0aGF0KSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5rbm93biBwcm9wZXJ0eSAnXCIgKyBuYW1lICsgXCInLlwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFJlY29yZFN0b3JlLnByb3RvdHlwZSwgXCJpbW11dGFibGVcIiwge1xuICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX2ltbXV0YWJsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5faW1tdXRhYmxlID0gbmV3IEltbXV0YWJsZVJlY29yZCh0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5faW1tdXRhYmxlO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFJlY29yZFN0b3JlLnByb3RvdHlwZSwgXCJrZXlzXCIsIHtcbiAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHIgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgayBpbiB0aGlzLl9kYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByLnB1c2goayk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHI7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBSZWNvcmRTdG9yZS5wcm90b3R5cGUuZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgdGhpcy5rZXlzLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNTdG9yZSh0aGF0W2tleV0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0W2tleV0uZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGF0W2tleV07XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fZGF0YSA9IG51bGw7XG4gICAgICAgICAgICAgICAgX3N1cGVyLnByb3RvdHlwZS5kaXNwb3NlLmNhbGwodGhpcyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIFJlY29yZFN0b3JlO1xuICAgICAgICB9KShTdG9yZSk7XG4gICAgICAgIHZhciBJbW11dGFibGVSZWNvcmQgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgICAgICAgICAgX19leHRlbmRzKEltbXV0YWJsZVJlY29yZCwgX3N1cGVyKTtcbiAgICAgICAgICAgIGZ1bmN0aW9uIEltbXV0YWJsZVJlY29yZChfcGFyZW50KSB7XG4gICAgICAgICAgICAgICAgX3N1cGVyLmNhbGwodGhpcyk7XG4gICAgICAgICAgICAgICAgdGhpcy5fcGFyZW50ID0gX3BhcmVudDtcbiAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgX3BhcmVudC5rZXlzLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgICAgICAgICB0aGF0LmFkZEl0ZW0oa2V5KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBfcGFyZW50Lm5ld0l0ZW1zLmZvckVhY2goZnVuY3Rpb24gKHVwZGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGF0LmFkZEl0ZW0odXBkYXRlLml0ZW0pO1xuICAgICAgICAgICAgICAgIH0pLnVudGlsKF9wYXJlbnQuaXNEaXNwb3NpbmcpO1xuICAgICAgICAgICAgICAgIF9wYXJlbnQucmVtb3ZlZEl0ZW1zLmZvckVhY2goZnVuY3Rpb24gKHVwZGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGF0LnJlbW92ZUl0ZW0odXBkYXRlLml0ZW0pO1xuICAgICAgICAgICAgICAgIH0pLnVudGlsKF9wYXJlbnQuaXNEaXNwb3NpbmcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEltbXV0YWJsZVJlY29yZC5wcm90b3R5cGUsIFwiaXNJbW11dGFibGVcIiwge1xuICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShJbW11dGFibGVSZWNvcmQucHJvdG90eXBlLCBcImltbXV0YWJsZVwiLCB7XG4gICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgSW1tdXRhYmxlUmVjb3JkLnByb3RvdHlwZS5hZGRJdGVtID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIG5hbWUsIHtcbiAgICAgICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc1N0b3JlKHRoYXQuX3BhcmVudFtuYW1lXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhhdC5fcGFyZW50W25hbWVdLmltbXV0YWJsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGF0Ll9wYXJlbnRbbmFtZV07XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBJbW11dGFibGVSZWNvcmQucHJvdG90eXBlLnJlbW92ZUl0ZW0gPSBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzW25hbWVdO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShJbW11dGFibGVSZWNvcmQucHJvdG90eXBlLCBcImtleXNcIiwge1xuICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fcGFyZW50LmtleXM7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBJbW11dGFibGVSZWNvcmQucHJvdG90eXBlLnN1YnNjcmliZVBhcmVudFN0cmVhbSA9IGZ1bmN0aW9uIChwYXJlbnRTdHJlYW0pIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RyZWFtID0gRmx1c3MuU3RyZWFtLmNyZWF0ZVN0cmVhbSgpO1xuICAgICAgICAgICAgICAgIHBhcmVudFN0cmVhbS5mb3JFYWNoKGZ1bmN0aW9uICh1cGRhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RyZWFtLnB1c2godXBkYXRlKTtcbiAgICAgICAgICAgICAgICB9KS51bnRpbCh0aGlzLl9wYXJlbnQuaXNEaXNwb3NpbmcpO1xuICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICAgICB0aGlzLl91cGRhdGVTdHJlYW1zLnB1c2goc3RyZWFtKTtcbiAgICAgICAgICAgICAgICBzdHJlYW0ub25DbG9zZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQucmVtb3ZlU3RyZWFtKHRoYXQuX3VwZGF0ZVN0cmVhbXMsIHN0cmVhbSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0cmVhbTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoSW1tdXRhYmxlUmVjb3JkLnByb3RvdHlwZSwgXCJ1cGRhdGVzXCIsIHtcbiAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3Vic2NyaWJlUGFyZW50U3RyZWFtKHRoaXMuX3BhcmVudC51cGRhdGVzKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShJbW11dGFibGVSZWNvcmQucHJvdG90eXBlLCBcIm5ld0l0ZW1zXCIsIHtcbiAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3Vic2NyaWJlUGFyZW50U3RyZWFtKHRoaXMuX3BhcmVudC5uZXdJdGVtcyk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoSW1tdXRhYmxlUmVjb3JkLnByb3RvdHlwZSwgXCJyZW1vdmVkSXRlbXNcIiwge1xuICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zdWJzY3JpYmVQYXJlbnRTdHJlYW0odGhpcy5fcGFyZW50LnJlbW92ZWRJdGVtcyk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoSW1tdXRhYmxlUmVjb3JkLnByb3RvdHlwZSwgXCJpc0Rpc3Bvc2luZ1wiLCB7XG4gICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnN1YnNjcmliZVBhcmVudFN0cmVhbSh0aGlzLl9wYXJlbnQuaXNEaXNwb3NpbmcpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIEltbXV0YWJsZVJlY29yZDtcbiAgICAgICAgfSkoSW1tdXRhYmxlU3RvcmUpO1xuICAgICAgICAvKipcbiAgICAgICAgICogUmVjdXJzaXZlbHkgYnVpbGQgYSBuZXN0ZWQgc3RvcmUuXG4gICAgICAgICAqIEBwYXJhbSB2YWx1ZVxuICAgICAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIGJ1aWxkRGVlcCh2YWx1ZSkge1xuICAgICAgICAgICAgZnVuY3Rpb24gZ2V0SXRlbSh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHZhciB2O1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKEZsdXNzLlRvb2xzLmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2ID0gYnVpbGRBcnJheSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2ID0gYnVpbGRSZWNvcmQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2ID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB2O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZnVuY3Rpb24gYnVpbGRBcnJheSh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHZhciBzdG9yZSA9IG5ldyBBcnJheVN0b3JlKCk7XG4gICAgICAgICAgICAgICAgdmFsdWUuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgICAgICAgICBzdG9yZS5wdXNoKGdldEl0ZW0oaXRlbSkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBzdG9yZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZ1bmN0aW9uIGJ1aWxkUmVjb3JkKHZhbHVlcykge1xuICAgICAgICAgICAgICAgIHZhciBzdG9yZSA9IG5ldyBSZWNvcmRTdG9yZSgpO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiB2YWx1ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdG9yZS5hZGRJdGVtKGtleSwgZ2V0SXRlbSh2YWx1ZXNba2V5XSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBzdG9yZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgICAgICBpZiAoRmx1c3MuVG9vbHMuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGJ1aWxkQXJyYXkodmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGJ1aWxkUmVjb3JkKHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvKipcbiAgICAgICAgICogQ3JlYXRlIGEgbmV3IHJlY29yZC4gSWYgYW4gaW5pdGlhbCB2YWx1ZSBpcyBnaXZlbiBpdCB3aWxsIGhhdmUgdGhlIGVudW1lcmFibGUgcHJvcGVydGllcyBvZiB0aGF0IHZhbHVlLiBZb3UgY2FuXG4gICAgICAgICAqIGNyZWF0ZSBuZXN0ZWQgc3RvcmVzIGJ5IHByb3ZpZGluZyBhIGNvbXBsZXggb2JqZWN0IGFzIGFuIGluaXRpYWwgdmFsdWUuXG4gICAgICAgICAqIEBwYXJhbSBpbml0aWFsXG4gICAgICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gcmVjb3JkKGluaXRpYWwpIHtcbiAgICAgICAgICAgIGlmIChpbml0aWFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGJ1aWxkRGVlcChpbml0aWFsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUmVjb3JkU3RvcmUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBfU3RvcmUucmVjb3JkID0gcmVjb3JkO1xuICAgICAgICB2YXIgQXJyYXlTdG9yZSA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgICAgICAgICBfX2V4dGVuZHMoQXJyYXlTdG9yZSwgX3N1cGVyKTtcbiAgICAgICAgICAgIGZ1bmN0aW9uIEFycmF5U3RvcmUoaW5pdGlhbCwgYWRkZXIsIHJlbW92ZXIsIHVwZGF0ZXIpIHtcbiAgICAgICAgICAgICAgICBfc3VwZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9zdWJzdHJlYW1zID0ge307XG4gICAgICAgICAgICAgICAgdGhpcy5fZGF0YSA9IGluaXRpYWwgfHwgW107XG4gICAgICAgICAgICAgICAgdGhpcy5fbWF4UHJvcHMgPSAwO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUHJvcGVydGllcygpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3N5bmNlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgICAgIGlmIChhZGRlcikge1xuICAgICAgICAgICAgICAgICAgICBhZGRlci5mb3JFYWNoKGZ1bmN0aW9uICh1cGRhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuc3BsaWNlKHVwZGF0ZS5pdGVtLCAwLCB1cGRhdGUudmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9KS51bnRpbCh0aGlzLmlzRGlzcG9zaW5nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHJlbW92ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVtb3Zlci5mb3JFYWNoKGZ1bmN0aW9uICh1cGRhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuc3BsaWNlKHVwZGF0ZS5pdGVtLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgfSkudW50aWwodGhpcy5pc0Rpc3Bvc2luZyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh1cGRhdGVyKSB7XG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZXIuZm9yRWFjaChmdW5jdGlvbiAodXBkYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0W3VwZGF0ZS5pdGVtXSA9IHVwZGF0ZS52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSkudW50aWwodGhpcy5pc0Rpc3Bvc2luZyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgQXJyYXlTdG9yZS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGEudG9TdHJpbmcoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBBcnJheVN0b3JlLnByb3RvdHlwZS50b0xvY2FsZVN0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fZGF0YS50b0xvY2FsZVN0cmluZygpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIEFycmF5U3RvcmUucHJvdG90eXBlLmZvckVhY2ggPSBmdW5jdGlvbiAoY2FsbGJhY2tmbiwgdGhpc0FyZykge1xuICAgICAgICAgICAgICAgIHRoaXMuX2RhdGEuZm9yRWFjaChjYWxsYmFja2ZuLCB0aGlzQXJnKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBBcnJheVN0b3JlLnByb3RvdHlwZS5ldmVyeSA9IGZ1bmN0aW9uIChjYWxsYmFja2ZuLCB0aGlzQXJnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGEuZXZlcnkoY2FsbGJhY2tmbiwgdGhpc0FyZyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgQXJyYXlTdG9yZS5wcm90b3R5cGUuc29tZSA9IGZ1bmN0aW9uIChjYWxsYmFja2ZuLCB0aGlzQXJnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGEuc29tZShjYWxsYmFja2ZuLCB0aGlzQXJnKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBBcnJheVN0b3JlLnByb3RvdHlwZS5pbmRleE9mID0gZnVuY3Rpb24gKHZhbHVlLCBmcm9tSW5kZXgpIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNTdG9yZSh2YWx1ZSkgJiYgdmFsdWUuaXNJbW11dGFibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGEuaW5kZXhPZih2YWx1ZVtcIl9wYXJlbnRcIl0sIGZyb21JbmRleCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fZGF0YS5pbmRleE9mKHZhbHVlLCBmcm9tSW5kZXgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBBcnJheVN0b3JlLnByb3RvdHlwZS5sYXN0SW5kZXhPZiA9IGZ1bmN0aW9uIChzZWFyY2hFbGVtZW50LCBmcm9tSW5kZXgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fZGF0YS5sYXN0SW5kZXhPZihzZWFyY2hFbGVtZW50LCBmcm9tSW5kZXgpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIEFycmF5U3RvcmUucHJvdG90eXBlLmpvaW4gPSBmdW5jdGlvbiAoc2VwYXJhdG9yKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGEuam9pbihzZXBhcmF0b3IpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIEFycmF5U3RvcmUucHJvdG90eXBlLm1hcCA9IGZ1bmN0aW9uIChjYWxsYmFja2ZuLCB0aGlzQXJnKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1hcHBlZCA9IHRoaXMuX2RhdGEubWFwKGNhbGxiYWNrZm4sIHRoaXNBcmcpO1xuICAgICAgICAgICAgICAgIHZhciBhZGRlciA9IEZsdXNzLlN0cmVhbS5jcmVhdGVTdHJlYW0oKTtcbiAgICAgICAgICAgICAgICB2YXIgcmVtb3ZlciA9IEZsdXNzLlN0cmVhbS5jcmVhdGVTdHJlYW0oKTtcbiAgICAgICAgICAgICAgICB2YXIgdXBkYXRlciA9IEZsdXNzLlN0cmVhbS5jcmVhdGVTdHJlYW0oKTtcbiAgICAgICAgICAgICAgICB2YXIgbWFwcGVkU3RvcmUgPSBuZXcgQXJyYXlTdG9yZShtYXBwZWQsIGFkZGVyLCByZW1vdmVyLCB1cGRhdGVyKTtcbiAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVzLmZvckVhY2goZnVuY3Rpb24gKHVwZGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICB1cGRhdGVyLnB1c2goY3JlYXRlVXBkYXRlSW5mbyh1cGRhdGUucm9vdEl0ZW0sIGNhbGxiYWNrZm4odGhhdC5fZGF0YVt1cGRhdGUucm9vdEl0ZW1dLCB1cGRhdGUucm9vdEl0ZW0sIHRoYXQuX2RhdGEpLCB1cGRhdGUuc3RvcmUpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLm5ld0l0ZW1zLmZvckVhY2goZnVuY3Rpb24gKHVwZGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICBhZGRlci5wdXNoKGNyZWF0ZVVwZGF0ZUluZm8odXBkYXRlLnJvb3RJdGVtLCBjYWxsYmFja2ZuKHRoYXQuX2RhdGFbdXBkYXRlLnJvb3RJdGVtXSwgdXBkYXRlLnJvb3RJdGVtLCB0aGF0Ll9kYXRhKSwgdXBkYXRlLnN0b3JlKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVkSXRlbXMuZm9yRWFjaChmdW5jdGlvbiAodXBkYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZXIucHVzaChjcmVhdGVVcGRhdGVJbmZvKHVwZGF0ZS5yb290SXRlbSwgdXBkYXRlLnZhbHVlLCB1cGRhdGUuc3RvcmUpKTsgLy8gVGhlIHZhbHVlIGRvZXMgbm90IG1hdHRlciBoZXJlLCBzYXZlIHRoZSBjYWxsIHRvIHRoZSBjYWxsYmFja1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBtYXBwZWRTdG9yZTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBBcnJheVN0b3JlLnByb3RvdHlwZS5maWx0ZXIgPSBmdW5jdGlvbiAoY2FsbGJhY2tmbiwgbm9VcGRhdGVzLCB0aGlzQXJnKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgICAgIHZhciBhZGRlcjtcbiAgICAgICAgICAgICAgICB2YXIgcmVtb3ZlcjtcbiAgICAgICAgICAgICAgICB2YXIgdXBkYXRlcjtcbiAgICAgICAgICAgICAgICB2YXIgZmlsdGVyZWRTdG9yZTtcbiAgICAgICAgICAgICAgICB2YXIgaW5kZXhNYXAgPSBbXTtcbiAgICAgICAgICAgICAgICB2YXIgZmlsdGVyZWQgPSBbXTtcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBtYXAoZm9ySW5kZXgsIHRvSW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXBbZm9ySW5kZXhdID0gdG9JbmRleDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRvSW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gZm9ySW5kZXggKyAxOyBpIDwgaW5kZXhNYXAubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXhNYXBbaV0gIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4TWFwW2ldICs9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGFkZE1hcChmcm9tSW5kZXgsIHRvSW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXAuc3BsaWNlKGZyb21JbmRleCwgMCwgdG9JbmRleCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0b0luZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IGZyb21JbmRleCArIDE7IGkgPCBpbmRleE1hcC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbmRleE1hcFtpXSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXBbaV0gKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gdW5tYXAoZm9ySW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRvd25zaGlmdCA9IGlzTWFwcGVkKGZvckluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXBbZm9ySW5kZXhdID0gLTE7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkb3duc2hpZnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSBmb3JJbmRleCArIDE7IGkgPCBpbmRleE1hcC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbmRleE1hcFtpXSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXBbaV0gLT0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gcmVtb3ZlTWFwKGZvckluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkb3duc2hpZnQgPSBpc01hcHBlZChmb3JJbmRleCk7XG4gICAgICAgICAgICAgICAgICAgIGluZGV4TWFwLnNwbGljZShmb3JJbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkb3duc2hpZnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSBmb3JJbmRleDsgaSA8IGluZGV4TWFwLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4TWFwW2ldICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hcFtpXSAtPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBtYXBJbmRleChmcm9tSW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGluZGV4TWFwW2Zyb21JbmRleF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGlzTWFwcGVkKGluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpbmRleCA8IGluZGV4TWFwLmxlbmd0aCAmJiBpbmRleE1hcFtpbmRleF0gIT09IC0xO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBnZXRDbG9zZXN0TGVmdE1hcChmb3JJbmRleCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaSA9IGZvckluZGV4O1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoKGkgPj0gaW5kZXhNYXAubGVuZ3RoIHx8IGluZGV4TWFwW2ldID09PSAtMSkgJiYgaSA+IC0yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpLS07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGkgPCAwKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWFwSW5kZXgoaSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuX2RhdGEuZm9yRWFjaChmdW5jdGlvbiAodmFsdWUsIGluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjYWxsYmFja2ZuKHZhbHVlLCBpbmRleCwgdGhhdC5fZGF0YSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZE1hcChpbmRleCwgZmlsdGVyZWQubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlcmVkLnB1c2godmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWRkTWFwKGluZGV4LCAtMSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpZiAoIW5vVXBkYXRlcykge1xuICAgICAgICAgICAgICAgICAgICBhZGRlciA9IEZsdXNzLlN0cmVhbS5jcmVhdGVTdHJlYW0oKTtcbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZlciA9IEZsdXNzLlN0cmVhbS5jcmVhdGVTdHJlYW0oKTtcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlciA9IEZsdXNzLlN0cmVhbS5jcmVhdGVTdHJlYW0oKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXdJdGVtcy5mb3JFYWNoKGZ1bmN0aW9uICh1cGRhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjYWxsYmFja2ZuKHRoYXQuX2RhdGFbdXBkYXRlLnJvb3RJdGVtXSwgdXBkYXRlLnJvb3RJdGVtLCB0aGF0Ll9kYXRhKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc01hcHBlZCh1cGRhdGUucm9vdEl0ZW0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZGVyLnB1c2goY3JlYXRlVXBkYXRlSW5mbyhtYXBJbmRleCh1cGRhdGUucm9vdEl0ZW0pLCB0aGF0Ll9kYXRhW3VwZGF0ZS5yb290SXRlbV0sIHVwZGF0ZS5zdG9yZSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkZXIucHVzaChjcmVhdGVVcGRhdGVJbmZvKGdldENsb3Nlc3RMZWZ0TWFwKHVwZGF0ZS5yb290SXRlbSkgKyAxLCB0aGF0Ll9kYXRhW3VwZGF0ZS5yb290SXRlbV0sIHVwZGF0ZS5zdG9yZSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRNYXAodXBkYXRlLnJvb3RJdGVtLCBmaWx0ZXJlZFN0b3JlLmluZGV4T2YodGhhdC5fZGF0YVt1cGRhdGUucm9vdEl0ZW1dKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRNYXAodXBkYXRlLnJvb3RJdGVtLCAtMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZWRJdGVtcy5mb3JFYWNoKGZ1bmN0aW9uICh1cGRhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc01hcHBlZCh1cGRhdGUucm9vdEl0ZW0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3Zlci5wdXNoKGNyZWF0ZVVwZGF0ZUluZm8obWFwSW5kZXgodXBkYXRlLnJvb3RJdGVtKSwgdGhhdC5fZGF0YVt1cGRhdGUucm9vdEl0ZW1dLCB1cGRhdGUuc3RvcmUpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZU1hcCh1cGRhdGUucm9vdEl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVzLmZvckVhY2goZnVuY3Rpb24gKHVwZGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrZm4odGhhdC5fZGF0YVt1cGRhdGUucm9vdEl0ZW1dLCB1cGRhdGUucm9vdEl0ZW0sIHRoYXQuX2RhdGEpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzTWFwcGVkKHVwZGF0ZS5yb290SXRlbSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlci5wdXNoKGNyZWF0ZVVwZGF0ZUluZm8obWFwSW5kZXgodXBkYXRlLnJvb3RJdGVtKSwgdGhhdC5fZGF0YVt1cGRhdGUucm9vdEl0ZW1dLCB1cGRhdGUuc3RvcmUpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZGVyLnB1c2goY3JlYXRlVXBkYXRlSW5mbyhnZXRDbG9zZXN0TGVmdE1hcCh1cGRhdGUucm9vdEl0ZW0pICsgMSwgdGhhdC5fZGF0YVt1cGRhdGUucm9vdEl0ZW1dLCB1cGRhdGUuc3RvcmUpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFwKHVwZGF0ZS5yb290SXRlbSwgZmlsdGVyZWRTdG9yZS5pbmRleE9mKHRoYXQuX2RhdGFbdXBkYXRlLnJvb3RJdGVtXSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc01hcHBlZCh1cGRhdGUucm9vdEl0ZW0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZXIucHVzaChjcmVhdGVVcGRhdGVJbmZvKG1hcEluZGV4KHVwZGF0ZS5yb290SXRlbSksIHRoYXQuX2RhdGFbdXBkYXRlLnJvb3RJdGVtXSwgdXBkYXRlLnN0b3JlKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVubWFwKHVwZGF0ZS5yb290SXRlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXAodXBkYXRlLnJvb3RJdGVtLCAtMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZmlsdGVyZWRTdG9yZSA9IG5ldyBBcnJheVN0b3JlKGZpbHRlcmVkLCBhZGRlciwgcmVtb3ZlciwgdXBkYXRlcik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbHRlcmVkU3RvcmU7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgQXJyYXlTdG9yZS5wcm90b3R5cGUucmVkdWNlID0gZnVuY3Rpb24gKGNhbGxiYWNrZm4sIGluaXRpYWxWYWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9kYXRhLnJlZHVjZShjYWxsYmFja2ZuLCBpbml0aWFsVmFsdWUpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIEFycmF5U3RvcmUucHJvdG90eXBlLnNvcnQgPSBmdW5jdGlvbiAoY29tcGFyZUZuKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvcHkgPSB0aGlzLl9kYXRhLm1hcChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlbTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb3B5LnNvcnQoY29tcGFyZUZuKTtcbiAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgY29weS5mb3JFYWNoKGZ1bmN0aW9uICh2YWx1ZSwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlICE9PSB0aGF0Ll9kYXRhW2luZGV4XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdFtpbmRleF0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIEFycmF5U3RvcmUucHJvdG90eXBlLnJldmVyc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvcHkgPSB0aGlzLl9kYXRhLm1hcChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlbTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb3B5LnJldmVyc2UoKTtcbiAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgY29weS5mb3JFYWNoKGZ1bmN0aW9uICh2YWx1ZSwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlICE9PSB0aGF0Ll9kYXRhW2luZGV4XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdFtpbmRleF0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIEFycmF5U3RvcmUucHJvdG90eXBlLmNvbmNhdCA9IGZ1bmN0aW9uIChhcnJheSkge1xuICAgICAgICAgICAgICAgIHZhciBuZXdBcnJheTtcbiAgICAgICAgICAgICAgICBpZiAoYXJyYXkgaW5zdGFuY2VvZiBBcnJheVN0b3JlKSB7XG4gICAgICAgICAgICAgICAgICAgIG5ld0FycmF5ID0gdGhpcy5fZGF0YS5jb25jYXQoYXJyYXlbXCJfZGF0YVwiXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBuZXdBcnJheSA9IHRoaXMuX2RhdGEuY29uY2F0KGFycmF5KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBBcnJheVN0b3JlKG5ld0FycmF5KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBBcnJheVN0b3JlLnByb3RvdHlwZS5jb25jYXRJbnBsYWNlID0gZnVuY3Rpb24gKGFycmF5KSB7XG4gICAgICAgICAgICAgICAgaWYgKGFycmF5IGluc3RhbmNlb2YgQXJyYXlTdG9yZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNwbGljZS5hcHBseSh0aGlzLCBbdGhpcy5sZW5ndGgsIDBdLmNvbmNhdChhcnJheVtcIl9kYXRhXCJdKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNwbGljZS5hcHBseSh0aGlzLCBbdGhpcy5sZW5ndGgsIDBdLmNvbmNhdChhcnJheSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQXJyYXlTdG9yZS5wcm90b3R5cGUsIFwibGVuZ3RoXCIsIHtcbiAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGEubGVuZ3RoO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgQXJyYXlTdG9yZS5wcm90b3R5cGUuc2V0dXBTdWJTdHJlYW1zID0gZnVuY3Rpb24gKGl0ZW0sIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgICAgIGlmIChpc1N0b3JlKHZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgc3Vic3RyZWFtID0gdGhpcy5fc3Vic3RyZWFtc1tGbHVzcy5Ub29scy5vaWQodmFsdWUpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN1YnN0cmVhbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3Vic3RyZWFtLnVwZGF0ZXMuZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHN1YnN0cmVhbSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZXM6IHZhbHVlLnVwZGF0ZXNcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgc3Vic3RyZWFtLnVwZGF0ZXMuZm9yRWFjaChmdW5jdGlvbiAodXBkYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdXBkYXRlSW5mbyA9IGNyZWF0ZVVwZGF0ZUluZm8odXBkYXRlLml0ZW0sIHVwZGF0ZS52YWx1ZSwgdGhhdCwgdXBkYXRlLnBhdGggPyBpdGVtICsgXCIuXCIgKyB1cGRhdGUucGF0aCA6IGl0ZW0gKyBcIi5cIiArIHVwZGF0ZS5pdGVtLCBpdGVtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuX3VwZGF0ZVN0cmVhbXMuZm9yRWFjaChmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RyZWFtLnB1c2godXBkYXRlSW5mbyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N1YnN0cmVhbXNbRmx1c3MuVG9vbHMub2lkKHZhbHVlKV0gPSBzdWJzdHJlYW07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ2FsbCBhZnRlciByZW1vdmFsIVxuICAgICAgICAgICAgICogQHBhcmFtIHZhbHVlXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIEFycmF5U3RvcmUucHJvdG90eXBlLmRpc3Bvc2VTdWJzdHJlYW0gPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNTdG9yZSh2YWx1ZSkgJiYgdGhpcy5fZGF0YS5pbmRleE9mKHZhbHVlKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN1YlN0cmVhbSA9IHRoaXMuX3N1YnN0cmVhbXNbRmx1c3MuVG9vbHMub2lkKHZhbHVlKV07XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdWJTdHJlYW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1YlN0cmVhbS51cGRhdGVzLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9zdWJzdHJlYW1zW0ZsdXNzLlRvb2xzLm9pZCh2YWx1ZSldO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIEFycmF5U3RvcmUucHJvdG90eXBlLnVwZGF0ZVByb3BlcnRpZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgICAgIHZhciBpO1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLl9kYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQuc2V0dXBTdWJTdHJlYW1zKGksIHRoaXMuX2RhdGFbaV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmb3IgKGkgPSB0aGlzLl9tYXhQcm9wczsgaSA8IHRoaXMuX2RhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgKGZ1bmN0aW9uIChpbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoYXQsIFwiXCIgKyBpbmRleCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoYXQuX2RhdGFbaW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG9sZCA9IHRoYXQuX2RhdGFbaW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgIT09IG9sZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5fZGF0YVtpbmRleF0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuZGlzcG9zZVN1YnN0cmVhbShvbGQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5zZXR1cFN1YlN0cmVhbXMoaW5kZXgsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuX3VwZGF0ZVN0cmVhbXMuZm9yRWFjaChmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RyZWFtLnB1c2goY3JlYXRlVXBkYXRlSW5mbyhpbmRleCwgdGhhdC5fZGF0YVtpbmRleF0sIHRoYXQsIG51bGwpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pKGkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLl9tYXhQcm9wcyA9IHRoaXMuX2RhdGEubGVuZ3RoO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIEFycmF5U3RvcmUucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHZhbHVlcyA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlc1tfaSAtIDBdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5fZGF0YS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgICAgIHZhbHVlcy5mb3JFYWNoKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGF0Ll9kYXRhLnB1c2godmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB0aGF0Ll9hZGRJdGVtc1N0cmVhbXMuZm9yRWFjaChmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHJlYW0ucHVzaChjcmVhdGVVcGRhdGVJbmZvKGluZGV4LCB0aGF0Ll9kYXRhW2luZGV4XSwgdGhhdCkpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgaW5kZXgrKztcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVByb3BlcnRpZXMoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBBcnJheVN0b3JlLnByb3RvdHlwZS51bnNoaWZ0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciB2YWx1ZXMgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZXNbX2kgLSAwXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICAgICB2YXIgbCA9IHZhbHVlcy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgd2hpbGUgKGwtLSkge1xuICAgICAgICAgICAgICAgICAgICAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZGF0YS51bnNoaWZ0KHZhbHVlc1swXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9uZXdJdGVtU3RyZWFtcy5mb3JFYWNoKGZ1bmN0aW9uIChzdHJlYW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJlYW0ucHVzaChjcmVhdGVVcGRhdGVJbmZvKDAsIHRoYXQuX2RhdGFbMF0sIHRoYXQpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVByb3BlcnRpZXMoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBBcnJheVN0b3JlLnByb3RvdHlwZS5wb3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHIgPSB0aGlzLl9kYXRhLnBvcCgpO1xuICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2VTdWJzdHJlYW0ocik7XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVtb3ZlSXRlbXNTdHJlYW1zLmZvckVhY2goZnVuY3Rpb24gKHN0cmVhbSkge1xuICAgICAgICAgICAgICAgICAgICBzdHJlYW0ucHVzaChjcmVhdGVVcGRhdGVJbmZvKHRoYXQuX2RhdGEubGVuZ3RoLCBudWxsLCB0aGF0KSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHI7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgQXJyYXlTdG9yZS5wcm90b3R5cGUuc2hpZnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHIgPSB0aGlzLl9kYXRhLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zZVN1YnN0cmVhbShyKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZW1vdmVJdGVtc1N0cmVhbXMuZm9yRWFjaChmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbS5wdXNoKGNyZWF0ZVVwZGF0ZUluZm8oMCwgbnVsbCwgdGhhdCkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiByO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIEFycmF5U3RvcmUucHJvdG90eXBlLnNwbGljZSA9IGZ1bmN0aW9uIChzdGFydCwgZGVsZXRlQ291bnQpIHtcbiAgICAgICAgICAgICAgICB2YXIgdmFsdWVzID0gW107XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAyOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzW19pIC0gMl0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgcmVtb3ZlZCA9IHRoaXMuX2RhdGEuc3BsaWNlLmFwcGx5KHRoaXMuX2RhdGEsIFtzdGFydCwgZGVsZXRlQ291bnRdLmNvbmNhdCh2YWx1ZXMpKTtcbiAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSBzdGFydDtcbiAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgaWYgKHRoYXQuX3JlbW92ZUl0ZW1zU3RyZWFtcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZlZC5mb3JFYWNoKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5kaXNwb3NlU3Vic3RyZWFtKHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuX3JlbW92ZUl0ZW1zU3RyZWFtcy5mb3JFYWNoKGZ1bmN0aW9uIChzdHJlYW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJlYW0ucHVzaChjcmVhdGVVcGRhdGVJbmZvKGluZGV4LCB2YWx1ZSwgdGhhdCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleCsrO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaW5kZXggPSBzdGFydDtcbiAgICAgICAgICAgICAgICB2YWx1ZXMuZm9yRWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQuX2FkZEl0ZW1zU3RyZWFtcy5mb3JFYWNoKGZ1bmN0aW9uIChzdHJlYW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0cmVhbS5wdXNoKGNyZWF0ZVVwZGF0ZUluZm8oaW5kZXgsIHRoYXQuX2RhdGFbaW5kZXhdLCB0aGF0KSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBpbmRleCsrO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIC8qIFJlbW92ZWQuIFRoaXMgc2hvdWxkIG5vdCBiZSBuZWNlc3NhcnkgYW5kIGl0IHNpbXBsaWZpZXMgdGhlIHJlYWN0aXZlIGFycmF5XG4gICAgICAgICAgICAgICAgIC8vIEluZGV4IGlzIG5vdyBhdCB0aGUgZmlyc3QgaXRlbSBhZnRlciB0aGUgbGFzdCBpbnNlcnRlZCB2YWx1ZS4gU28gaWYgZGVsZXRlQ291bnQgIT0gdmFsdWVzLmxlbmd0aFxuICAgICAgICAgICAgICAgICAvLyB0aGUgaXRlbXMgYWZ0ZXIgdGhlIGluc2VydC9yZW1vdmUgbW92ZWQgYXJvdW5kXG4gICAgICAgICAgICAgICAgIGlmIChkZWxldGVDb3VudCAhPT0gdmFsdWVzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAvL3ZhciBkaXN0YW5jZSA9IHZhbHVlcy5sZW5ndGggLSBkZWxldGVDb3VudDtcbiAgICAgICAgICAgICAgICAgZm9yIChpbmRleDsgaW5kZXggPCB0aGlzLl9kYXRhLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgICAgICAgICB0aGF0Ll91cGRhdGVTdHJlYW1zLmZvckVhY2goZnVuY3Rpb24oc3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgIHN0cmVhbS5wdXNoKGNyZWF0ZVVwZGF0ZUluZm88bnVtYmVyPihpbmRleCwgdGhhdC5fZGF0YVtpbmRleF0sIHRoYXQpKTtcbiAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVQcm9wZXJ0aWVzKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlbW92ZWQ7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgQXJyYXlTdG9yZS5wcm90b3R5cGUuaW5zZXJ0ID0gZnVuY3Rpb24gKGF0SW5kZXgpIHtcbiAgICAgICAgICAgICAgICB2YXIgdmFsdWVzID0gW107XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAxOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzW19pIC0gMV0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnNwbGljZS5hcHBseSh0aGlzLCBbYXRJbmRleCwgMF0uY29uY2F0KHZhbHVlcykpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIEFycmF5U3RvcmUucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChhdEluZGV4LCBjb3VudCkge1xuICAgICAgICAgICAgICAgIGlmIChjb3VudCA9PT0gdm9pZCAwKSB7IGNvdW50ID0gMTsgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNwbGljZShhdEluZGV4LCBjb3VudCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgQXJyYXlTdG9yZS5wcm90b3R5cGUuZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzU3RvcmUodGhpc1tpXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNbaV0uZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzW2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLl9kYXRhID0gbnVsbDtcbiAgICAgICAgICAgICAgICBfc3VwZXIucHJvdG90eXBlLmRpc3Bvc2UuY2FsbCh0aGlzKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQXJyYXlTdG9yZS5wcm90b3R5cGUsIFwiaW1tdXRhYmxlXCIsIHtcbiAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9pbW11dGFibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2ltbXV0YWJsZSA9IG5ldyBJbW11dGFibGVBcnJheSh0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5faW1tdXRhYmxlO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgQXJyYXlTdG9yZS5wcm90b3R5cGUuaXRlbSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHZhciBpID0gdGhpcy5pbmRleE9mKHZhbHVlKTtcbiAgICAgICAgICAgICAgICBpZiAoaSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiBBcnJheVN0b3JlO1xuICAgICAgICB9KShTdG9yZSk7XG4gICAgICAgIHZhciBJbW11dGFibGVBcnJheSA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgICAgICAgICBfX2V4dGVuZHMoSW1tdXRhYmxlQXJyYXksIF9zdXBlcik7XG4gICAgICAgICAgICBmdW5jdGlvbiBJbW11dGFibGVBcnJheShfcGFyZW50KSB7XG4gICAgICAgICAgICAgICAgX3N1cGVyLmNhbGwodGhpcyk7XG4gICAgICAgICAgICAgICAgdGhpcy5fcGFyZW50ID0gX3BhcmVudDtcbiAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgX3BhcmVudC5uZXdJdGVtcy5mb3JFYWNoKGZ1bmN0aW9uICh1cGRhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhhdC51cGRhdGVQcm9wZXJ0aWVzKCk7XG4gICAgICAgICAgICAgICAgfSkudW50aWwoX3BhcmVudC5pc0Rpc3Bvc2luZyk7XG4gICAgICAgICAgICAgICAgLy8gV2UgZG8gbm90aGluZyB3aGVuIHJlbW92aW5nIGl0ZW1zLiBUaGUgZ2V0dGVyIHdpbGwgcmV0dXJuIHVuZGVmaW5lZC5cbiAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICBfYXJyYXkucmVtb3ZlZEl0ZW1zKCkuZm9yRWFjaChmdW5jdGlvbih1cGRhdGUpIHtcblxuICAgICAgICAgICAgICAgICB9KS51bnRpbChfYXJyYXkuZGlzcG9zaW5nKCkpO1xuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHRoaXMuX21heFByb3BzID0gMDtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVByb3BlcnRpZXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIEltbXV0YWJsZUFycmF5LnByb3RvdHlwZS51cGRhdGVQcm9wZXJ0aWVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICAgICB2YXIgaTtcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSB0aGlzLl9tYXhQcm9wczsgaSA8IHRoaXMuX3BhcmVudC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAoZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhhdCwgXCJcIiArIGluZGV4LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNTdG9yZSh0aGF0Ll9wYXJlbnRbaW5kZXhdKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoYXQuX3BhcmVudFtpbmRleF0uaW1tdXRhYmxlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGF0Ll9wYXJlbnRbaW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSkoaSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuX21heFByb3BzID0gdGhpcy5fcGFyZW50Lmxlbmd0aDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBJbW11dGFibGVBcnJheS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudC50b1N0cmluZygpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIEltbXV0YWJsZUFycmF5LnByb3RvdHlwZS50b0xvY2FsZVN0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fcGFyZW50LnRvU3RyaW5nKCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgSW1tdXRhYmxlQXJyYXkucHJvdG90eXBlLmZvckVhY2ggPSBmdW5jdGlvbiAoY2FsbGJhY2tmbiwgdGhpc0FyZykge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9wYXJlbnQuZm9yRWFjaChjYWxsYmFja2ZuKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBJbW11dGFibGVBcnJheS5wcm90b3R5cGUuZXZlcnkgPSBmdW5jdGlvbiAoY2FsbGJhY2tmbiwgdGhpc0FyZykge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9wYXJlbnQuZXZlcnkoY2FsbGJhY2tmbik7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgSW1tdXRhYmxlQXJyYXkucHJvdG90eXBlLnNvbWUgPSBmdW5jdGlvbiAoY2FsbGJhY2tmbiwgdGhpc0FyZykge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9wYXJlbnQuZm9yRWFjaChjYWxsYmFja2ZuKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBJbW11dGFibGVBcnJheS5wcm90b3R5cGUuaW5kZXhPZiA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9wYXJlbnQuaW5kZXhPZih2YWx1ZSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgSW1tdXRhYmxlQXJyYXkucHJvdG90eXBlLmxhc3RJbmRleE9mID0gZnVuY3Rpb24gKHNlYXJjaEVsZW1lbnQsIGZyb21JbmRleCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9wYXJlbnQubGFzdEluZGV4T2Yoc2VhcmNoRWxlbWVudCwgZnJvbUluZGV4KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBJbW11dGFibGVBcnJheS5wcm90b3R5cGUuam9pbiA9IGZ1bmN0aW9uIChzZXBhcmF0b3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fcGFyZW50LmpvaW4oc2VwYXJhdG9yKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBJbW11dGFibGVBcnJheS5wcm90b3R5cGUubWFwID0gZnVuY3Rpb24gKGNhbGxiYWNrZm4sIHRoaXNBcmcpIHtcbiAgICAgICAgICAgICAgICAvL1RoaXMgaXMgZGlydHkgYnV0IGFueXRoaW5nIGVsc2Ugd291bGQgYmUgaW5wZXJmb3JtYW50IGp1c3QgYmVjYXVzZSB0eXBlc2NyaXB0IGRvZXMgbm90IGhhdmUgcHJvdGVjdGVkIHNjb3BlXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudFtcIl9kYXRhXCJdLm1hcChjYWxsYmFja2ZuKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBJbW11dGFibGVBcnJheS5wcm90b3R5cGUuZmlsdGVyID0gZnVuY3Rpb24gKGNhbGxiYWNrZm4sIHRoaXNBcmcpIHtcbiAgICAgICAgICAgICAgICAvL1RoaXMgaXMgZGlydHkgYnV0IGFueXRoaW5nIGVsc2Ugd291bGQgYmUgaW5wZXJmb3JtYW50IGp1c3QgYmVjYXVzZSB0eXBlc2NyaXB0IGRvZXMgbm90IGhhdmUgcHJvdGVjdGVkIHNjb3BlXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudFtcIl9kYXRhXCJdLmZpbHRlcihjYWxsYmFja2ZuKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBJbW11dGFibGVBcnJheS5wcm90b3R5cGUucmVkdWNlID0gZnVuY3Rpb24gKGNhbGxiYWNrZm4sIGluaXRpYWxWYWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9wYXJlbnQucmVkdWNlKGNhbGxiYWNrZm4sIGluaXRpYWxWYWx1ZSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEltbXV0YWJsZUFycmF5LnByb3RvdHlwZSwgXCJsZW5ndGhcIiwge1xuICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fcGFyZW50Lmxlbmd0aDtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIEltbXV0YWJsZUFycmF5LnByb3RvdHlwZS5zdWJzY3JpYmVQYXJlbnRTdHJlYW0gPSBmdW5jdGlvbiAocGFyZW50U3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0cmVhbSA9IEZsdXNzLlN0cmVhbS5jcmVhdGVTdHJlYW0oKTtcbiAgICAgICAgICAgICAgICBwYXJlbnRTdHJlYW0uZm9yRWFjaChmdW5jdGlvbiAodXBkYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbS5wdXNoKHVwZGF0ZSk7XG4gICAgICAgICAgICAgICAgfSkudW50aWwodGhpcy5fcGFyZW50LmlzRGlzcG9zaW5nKTtcbiAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgdGhpcy5fdXBkYXRlU3RyZWFtcy5wdXNoKHN0cmVhbSk7XG4gICAgICAgICAgICAgICAgc3RyZWFtLm9uQ2xvc2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB0aGF0LnJlbW92ZVN0cmVhbSh0aGF0Ll91cGRhdGVTdHJlYW1zLCBzdHJlYW0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBzdHJlYW07XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEltbXV0YWJsZUFycmF5LnByb3RvdHlwZSwgXCJ1cGRhdGVzXCIsIHtcbiAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3Vic2NyaWJlUGFyZW50U3RyZWFtKHRoaXMuX3BhcmVudC51cGRhdGVzKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShJbW11dGFibGVBcnJheS5wcm90b3R5cGUsIFwibmV3SXRlbXNcIiwge1xuICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zdWJzY3JpYmVQYXJlbnRTdHJlYW0odGhpcy5fcGFyZW50Lm5ld0l0ZW1zKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShJbW11dGFibGVBcnJheS5wcm90b3R5cGUsIFwicmVtb3ZlZEl0ZW1zXCIsIHtcbiAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3Vic2NyaWJlUGFyZW50U3RyZWFtKHRoaXMuX3BhcmVudC5yZW1vdmVkSXRlbXMpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEltbXV0YWJsZUFycmF5LnByb3RvdHlwZSwgXCJkaXNwb3NpbmdcIiwge1xuICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zdWJzY3JpYmVQYXJlbnRTdHJlYW0odGhpcy5fcGFyZW50LmlzRGlzcG9zaW5nKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShJbW11dGFibGVBcnJheS5wcm90b3R5cGUsIFwiaW1tdXRhYmxlXCIsIHtcbiAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gSW1tdXRhYmxlQXJyYXk7XG4gICAgICAgIH0pKEltbXV0YWJsZVN0b3JlKTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIENyZWF0ZSBhbiBhcnJheSBzdG9yZS4gSWYgYW4gaW5pdGlhbCB2YWx1ZSBpcyBwcm92aWRlZCBpdCB3aWxsIGluaXRpYWxpemUgdGhlIGFycmF5XG4gICAgICAgICAqIHdpdGggaXQuIFRoZSBpbml0aWFsIHZhbHVlIGNhbiBiZSBhIEphdmFTY3JpcHQgYXJyYXkgb2YgZWl0aGVyIHNpbXBsZSB2YWx1ZXMgb3IgcGxhaW4gb2JqZWN0cy5cbiAgICAgICAgICogSXQgdGhlIGFycmF5IGhhcyBwbGFpbiBvYmplY3RzIGEgbmVzdGVkIHN0b3JlIHdpbGwgYmUgY3JlYXRlZC5cbiAgICAgICAgICogQHBhcmFtIGluaXRpYWxcbiAgICAgICAgICogQHJldHVybnMgeyp9XG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBhcnJheShpbml0aWFsKSB7XG4gICAgICAgICAgICBpZiAoaW5pdGlhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBidWlsZERlZXAoaW5pdGlhbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEFycmF5U3RvcmUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBfU3RvcmUuYXJyYXkgPSBhcnJheTtcbiAgICB9KShTdG9yZSA9IEZsdXNzLlN0b3JlIHx8IChGbHVzcy5TdG9yZSA9IHt9KSk7XG59KShGbHVzcyB8fCAoRmx1c3MgPSB7fSkpO1xuaWYgKHR5cGVvZiBleHBvcnRzICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgZXhwb3J0cy5TdG9yZSA9IEZsdXNzLlN0b3JlO1xufVxuaWYgKHR5cGVvZiB0aGlzW1wiZGVmaW5lXCJdID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICB0aGlzW1wiZGVmaW5lXCJdKFtdLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBGbHVzcy5TdG9yZTtcbiAgICB9KTtcbn1cblxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vc3RyZWFtLnRzXCIgLz5cbi8qKlxuICogQ3JlYXRlZCBieSBTdGVwaGFuIG9uIDEwLjAxLjIwMTUuXG4gKi9cblwidXNlIHN0cmljdFwiO1xudmFyIEZsdXNzO1xuKGZ1bmN0aW9uIChGbHVzcykge1xuICAgIHZhciBSZWFjdE1peGlucztcbiAgICAoZnVuY3Rpb24gKFJlYWN0TWl4aW5zKSB7XG4gICAgICAgIFJlYWN0TWl4aW5zLmNvbXBvbmVudExpZmVjeWNsZSA9IHtcbiAgICAgICAgICAgIF93aWxsVW5tb3VudDogbnVsbCxcbiAgICAgICAgICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fd2lsbFVubW91bnQgPSBGbHVzcy5TdHJlYW0uY3JlYXRlU3RyZWFtKFwiY29tcG9uZW50LXVubW91bnRcIik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl93aWxsVW5tb3VudC5wdXNoKHRydWUpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3dpbGxVbm1vdW50LmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KShSZWFjdE1peGlucyA9IEZsdXNzLlJlYWN0TWl4aW5zIHx8IChGbHVzcy5SZWFjdE1peGlucyA9IHt9KSk7XG59KShGbHVzcyB8fCAoRmx1c3MgPSB7fSkpO1xuaWYgKHR5cGVvZiBleHBvcnRzICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgZXhwb3J0cy5SZWFjdE1peGlucyA9IEZsdXNzLlJlYWN0TWl4aW5zO1xufVxuaWYgKHR5cGVvZiB0aGlzW1wiZGVmaW5lXCJdID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICB0aGlzW1wiZGVmaW5lXCJdKFtdLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBGbHVzcy5SZWFjdE1peGlucztcbiAgICB9KTtcbn1cblxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vZW1pdHRlci50c1wiIC8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9zdHJlYW0udHNcIiAvPlxuLyoqXG4gKiBDcmVhdGVkIGJ5IFN0ZXBoYW4uU21vbGEgb24gMjguMTAuMjAxNC5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19leHRlbmRzID0gdGhpcy5fX2V4dGVuZHMgfHwgZnVuY3Rpb24gKGQsIGIpIHtcbiAgICBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTtcbiAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICBfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZTtcbiAgICBkLnByb3RvdHlwZSA9IG5ldyBfXygpO1xufTtcbnZhciBGbHVzcztcbihmdW5jdGlvbiAoRmx1c3MpIHtcbiAgICB2YXIgRXZlbnRDaGFubmVsO1xuICAgIChmdW5jdGlvbiAoX0V2ZW50Q2hhbm5lbCkge1xuICAgICAgICB2YXIgRXZlbnRDaGFubmVsID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGZ1bmN0aW9uIEV2ZW50Q2hhbm5lbCgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9ldmVudEhhbmRsZXJzID0ge307XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBFdmVudENoYW5uZWwucHJvdG90eXBlLnN1YnNjcmliZSA9IGZ1bmN0aW9uIChlbWl0dGVyLCBldmVudCwgaGFuZGxlcikge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5fZXZlbnRIYW5kbGVyc1tlbWl0dGVyXSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudEhhbmRsZXJzW2VtaXR0ZXJdID0ge307XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5fZXZlbnRIYW5kbGVyc1tlbWl0dGVyXVtldmVudF0pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRIYW5kbGVyc1tlbWl0dGVyXVtldmVudF0gPSBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRIYW5kbGVyc1tlbWl0dGVyXVtldmVudF0ucHVzaChoYW5kbGVyKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBFdmVudENoYW5uZWwucHJvdG90eXBlLnVuc3Vic2NyaWJlID0gZnVuY3Rpb24gKGVtaXR0ZXIsIGV2ZW50LCBoYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2V2ZW50SGFuZGxlcnNbZW1pdHRlcl0pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX2V2ZW50SGFuZGxlcnNbZW1pdHRlcl1bZXZlbnRdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudEhhbmRsZXJzW2VtaXR0ZXJdW2V2ZW50XS5zcGxpY2UodGhpcy5fZXZlbnRIYW5kbGVyc1tlbWl0dGVyXVtldmVudF0uaW5kZXhPZihoYW5kbGVyKSwgMSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgRXZlbnRDaGFubmVsLnByb3RvdHlwZS5jaGFubmVsRW1pdCA9IGZ1bmN0aW9uIChlbWl0dGVyLCBlbWl0dGVySUQsIGV2ZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2V2ZW50SGFuZGxlcnMgJiYgdGhpcy5fZXZlbnRIYW5kbGVyc1tlbWl0dGVySURdICYmIHRoaXMuX2V2ZW50SGFuZGxlcnNbZW1pdHRlcklEXVtldmVudF0pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRIYW5kbGVyc1tlbWl0dGVySURdW2V2ZW50XS5mb3JFYWNoKGZ1bmN0aW9uIChoYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVyLmFwcGx5KGVtaXR0ZXIsIGFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgRXZlbnRDaGFubmVsLnByb3RvdHlwZS51bnN1YnNjcmliZUFsbCA9IGZ1bmN0aW9uIChlbWl0dGVySUQpIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5fZXZlbnRIYW5kbGVyc1tlbWl0dGVySURdO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiBFdmVudENoYW5uZWw7XG4gICAgICAgIH0pKCk7XG4gICAgICAgIHZhciBldmVudENoYW5uZWwgPSBuZXcgRXZlbnRDaGFubmVsKCk7XG4gICAgICAgIC8vZXhwb3J0IHZhciBjaGFubmVsOklFdmVudENoYW5uZWwgPSBldmVudENoYW5uZWw7XG4gICAgICAgIGZ1bmN0aW9uIGdldENoYW5uZWwoKSB7XG4gICAgICAgICAgICByZXR1cm4gZXZlbnRDaGFubmVsO1xuICAgICAgICB9XG4gICAgICAgIF9FdmVudENoYW5uZWwuZ2V0Q2hhbm5lbCA9IGdldENoYW5uZWw7XG4gICAgICAgIGZ1bmN0aW9uIHN1YnNjcmliZShlbWl0dGVyLCBldmVudCwgaGFuZGxlcikge1xuICAgICAgICAgICAgZXZlbnRDaGFubmVsLnN1YnNjcmliZShlbWl0dGVyLCBldmVudCwgaGFuZGxlcik7XG4gICAgICAgIH1cbiAgICAgICAgX0V2ZW50Q2hhbm5lbC5zdWJzY3JpYmUgPSBzdWJzY3JpYmU7XG4gICAgICAgIGZ1bmN0aW9uIHVuc3Vic2NyaWJlKGVtaXR0ZXIsIGV2ZW50LCBoYW5kbGVyKSB7XG4gICAgICAgICAgICBldmVudENoYW5uZWwudW5zdWJzY3JpYmUoZW1pdHRlciwgZXZlbnQsIGhhbmRsZXIpO1xuICAgICAgICB9XG4gICAgICAgIF9FdmVudENoYW5uZWwudW5zdWJzY3JpYmUgPSB1bnN1YnNjcmliZTtcbiAgICAgICAgZnVuY3Rpb24gY2hhbm5lbEVtaXQoZW1pdHRlcklELCBldmVudCkge1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIF9pID0gMjsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICAgICAgYXJnc1tfaSAtIDJdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGV2ZW50Q2hhbm5lbC5jaGFubmVsRW1pdChudWxsLCBlbWl0dGVySUQsIGV2ZW50LCBhcmdzKTtcbiAgICAgICAgfVxuICAgICAgICBfRXZlbnRDaGFubmVsLmNoYW5uZWxFbWl0ID0gY2hhbm5lbEVtaXQ7XG4gICAgICAgIGZ1bmN0aW9uIHVuc3Vic2NyaWJlQWxsKGVtaXR0ZXJJRCkge1xuICAgICAgICAgICAgZXZlbnRDaGFubmVsLnVuc3Vic2NyaWJlQWxsKGVtaXR0ZXJJRCk7XG4gICAgICAgIH1cbiAgICAgICAgX0V2ZW50Q2hhbm5lbC51bnN1YnNjcmliZUFsbCA9IHVuc3Vic2NyaWJlQWxsO1xuICAgICAgICB2YXIgZW1pdHRlcklEcyA9IFtdO1xuICAgICAgICB2YXIgQ2hhbm5lbGVkRW1pdHRlciA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgICAgICAgICBfX2V4dGVuZHMoQ2hhbm5lbGVkRW1pdHRlciwgX3N1cGVyKTtcbiAgICAgICAgICAgIGZ1bmN0aW9uIENoYW5uZWxlZEVtaXR0ZXIoX2VtaXR0ZXJJRCkge1xuICAgICAgICAgICAgICAgIF9zdXBlci5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgICAgIGlmIChfZW1pdHRlcklEKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdHRlcklEID0gX2VtaXR0ZXJJRDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdHRlcklEID0gXCJFbWl0dGVyXCIgKyBlbWl0dGVySURzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGVtaXR0ZXJJRHMuaW5kZXhPZih0aGlzLmVtaXR0ZXJJRCkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkR1cGxpY2F0ZSBlbWl0dGVySUQuIFRoaXMgaXMgbm90IHN1cHBvcnRlZFwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBDaGFubmVsZWRFbWl0dGVyLnByb3RvdHlwZS5zdWJzY3JpYmUgPSBmdW5jdGlvbiAoZXZlbnQsIGhhbmRsZXIpIHtcbiAgICAgICAgICAgICAgICBfc3VwZXIucHJvdG90eXBlLnN1YnNjcmliZS5jYWxsKHRoaXMsIGV2ZW50LCBoYW5kbGVyKTtcbiAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKFwiQ29uc2lkZXIgdXNpbmcgdGhlIEV2ZW50Q2hhbm5lbCBpbnN0ZWFkIG9mIHN1YnNjcmliaW5nIGRpcmVjdGx5IHRvIHRoZSBcIiArIHRoaXMuZW1pdHRlcklEKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBDaGFubmVsZWRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBfaSA9IDE7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgICAgICAgICBhcmdzW19pIC0gMV0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBObyBzdXBlciBjYWxsIGJlY2F1c2UgcGFzc2luZyByZXN0IHBhcmFtZXRlcnMgdG8gYSBzdXBlciBtZXRob2QgaXMga2luZCBvZiBhd2t3YXJkIGFuZCBoYWNreVxuICAgICAgICAgICAgICAgIC8vIGh0dHBzOi8vdHlwZXNjcmlwdC5jb2RlcGxleC5jb20vZGlzY3Vzc2lvbnMvNTQ0Nzk3XG4gICAgICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmV2ZW50SGFuZGxlcnMgJiYgdGhpcy5ldmVudEhhbmRsZXJzW2V2ZW50XSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmV2ZW50SGFuZGxlcnNbZXZlbnRdLmZvckVhY2goZnVuY3Rpb24gKGhhbmRsZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZXIuYXBwbHkodGhhdCwgYXJncyk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBldmVudENoYW5uZWwuY2hhbm5lbEVtaXQodGhpcywgdGhpcy5lbWl0dGVySUQsIGV2ZW50LCBhcmdzKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gQ2hhbm5lbGVkRW1pdHRlcjtcbiAgICAgICAgfSkoRmx1c3MuRW1pdHRlci5FbWl0dGVyKTtcbiAgICAgICAgX0V2ZW50Q2hhbm5lbC5DaGFubmVsZWRFbWl0dGVyID0gQ2hhbm5lbGVkRW1pdHRlcjtcbiAgICAgICAgdmFyIEV2ZW50U3RyZWFtID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICAgICAgICAgIF9fZXh0ZW5kcyhFdmVudFN0cmVhbSwgX3N1cGVyKTtcbiAgICAgICAgICAgIGZ1bmN0aW9uIEV2ZW50U3RyZWFtKG5hbWUsIF9lbWl0dGVySUQsIF9ldmVudCkge1xuICAgICAgICAgICAgICAgIF9zdXBlci5jYWxsKHRoaXMsIG5hbWUpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2VtaXR0ZXJJRCA9IF9lbWl0dGVySUQ7XG4gICAgICAgICAgICAgICAgdGhpcy5fZXZlbnQgPSBfZXZlbnQ7XG4gICAgICAgICAgICAgICAgdGhpcy5faGFuZGxlciA9IHRoaXMuaGFuZGxlRXZlbnQuYmluZCh0aGlzKTtcbiAgICAgICAgICAgICAgICBzdWJzY3JpYmUodGhpcy5fZW1pdHRlcklELCBfZXZlbnQsIHRoaXMuX2hhbmRsZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgRXZlbnRTdHJlYW0ucHJvdG90eXBlLmhhbmRsZUV2ZW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBhcmdzID0gW107XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgICAgICAgICAgYXJnc1tfaSAtIDBdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgZW1pdHRlcjogdGhpcy5fZW1pdHRlcklELFxuICAgICAgICAgICAgICAgICAgICBldmVudDogdGhpcy5fZXZlbnQsXG4gICAgICAgICAgICAgICAgICAgIGFyZ3M6IGFyZ3NcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBFdmVudFN0cmVhbS5wcm90b3R5cGUuZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBfc3VwZXIucHJvdG90eXBlLmRpc3Bvc2UuY2FsbCh0aGlzKTtcbiAgICAgICAgICAgICAgICB1bnN1YnNjcmliZSh0aGlzLl9lbWl0dGVySUQsIHRoaXMuX2V2ZW50LCB0aGlzLl9oYW5kbGVyKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gRXZlbnRTdHJlYW07XG4gICAgICAgIH0pKEZsdXNzLlN0cmVhbS5TdHJlYW0pO1xuICAgICAgICAvKipcbiAgICAgICAgICogQ3JlYXRlcyBhIHN0cmVhbSBmb3IgYSBjaGFubmVsZWQgZXZlbnQuIElmICBtb3IgdGhhbiBvbmUgZXZlbnQgaXMgZ2l2ZW4sIGEgY29tYmluZWRcbiAgICAgICAgICogc3RyZWFtIGZvciBhbGwgZXZlbnRzIGlzIGNyZWF0ZWRcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIG5hbWVcbiAgICAgICAgICogQHBhcmFtIGVtaXR0ZXJJRFxuICAgICAgICAgKiBAcGFyYW0gZXZlbnRzXG4gICAgICAgICAqIEByZXR1cm5zIHtudWxsfVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlRXZlbnRTdHJlYW0oZW1pdHRlcklEKSB7XG4gICAgICAgICAgICB2YXIgZXZlbnRzID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBfaSA9IDE7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgICAgIGV2ZW50c1tfaSAtIDFdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBzdHJlYW0gPSBudWxsO1xuICAgICAgICAgICAgZXZlbnRzLmZvckVhY2goZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgdmFyIGVTdHJlYW0gPSBuZXcgRXZlbnRTdHJlYW0oZW1pdHRlcklEICsgXCItXCIgKyBldmVudCwgZW1pdHRlcklELCBldmVudCk7XG4gICAgICAgICAgICAgICAgaWYgKHN0cmVhbSkge1xuICAgICAgICAgICAgICAgICAgICBzdHJlYW0gPSBzdHJlYW0uY29tYmluZShlU3RyZWFtKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbSA9IGVTdHJlYW07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gc3RyZWFtO1xuICAgICAgICB9XG4gICAgICAgIF9FdmVudENoYW5uZWwuY3JlYXRlRXZlbnRTdHJlYW0gPSBjcmVhdGVFdmVudFN0cmVhbTtcbiAgICB9KShFdmVudENoYW5uZWwgPSBGbHVzcy5FdmVudENoYW5uZWwgfHwgKEZsdXNzLkV2ZW50Q2hhbm5lbCA9IHt9KSk7XG59KShGbHVzcyB8fCAoRmx1c3MgPSB7fSkpO1xuaWYgKHR5cGVvZiBleHBvcnRzICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgZXhwb3J0cy5FdmVudENoYW5uZWwgPSBGbHVzcy5FdmVudENoYW5uZWw7XG59XG5pZiAodHlwZW9mIHRoaXNbXCJkZWZpbmVcIl0gPT09IFwiZnVuY3Rpb25cIikge1xuICAgIHRoaXNbXCJkZWZpbmVcIl0oW10sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIEZsdXNzLkV2ZW50Q2hhbm5lbDtcbiAgICB9KTtcbn1cblxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vZXZlbnRDaGFubmVsLnRzXCIgLz5cbi8qKlxuICogQ3JlYXRlZCBieSBTdGVwaGFuLlNtb2xhIG9uIDMwLjEwLjIwMTQuXG4gKi9cblwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9IHRoaXMuX19leHRlbmRzIHx8IGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07XG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XG4gICAgX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGU7XG4gICAgZC5wcm90b3R5cGUgPSBuZXcgX18oKTtcbn07XG52YXIgRmx1c3M7XG4oZnVuY3Rpb24gKEZsdXNzKSB7XG4gICAgdmFyIEVycm9ycztcbiAgICAoZnVuY3Rpb24gKEVycm9ycykge1xuICAgICAgICAoZnVuY3Rpb24gKEVWRU5UUykge1xuICAgICAgICAgICAgRVZFTlRTW0VWRU5UU1tcIkVSUk9SXCJdID0gMF0gPSBcIkVSUk9SXCI7XG4gICAgICAgICAgICBFVkVOVFNbRVZFTlRTW1wiRkFUQUxcIl0gPSAxXSA9IFwiRkFUQUxcIjtcbiAgICAgICAgICAgIEVWRU5UU1tFVkVOVFNbXCJGUkFNRVdPUktcIl0gPSAyXSA9IFwiRlJBTUVXT1JLXCI7XG4gICAgICAgICAgICBFVkVOVFNbRVZFTlRTW1wiQ0xFQVJcIl0gPSAzXSA9IFwiQ0xFQVJcIjtcbiAgICAgICAgfSkoRXJyb3JzLkVWRU5UUyB8fCAoRXJyb3JzLkVWRU5UUyA9IHt9KSk7XG4gICAgICAgIHZhciBFVkVOVFMgPSBFcnJvcnMuRVZFTlRTO1xuICAgICAgICB2YXIgRXJyb3JIYW5kbGVyID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICAgICAgICAgIF9fZXh0ZW5kcyhFcnJvckhhbmRsZXIsIF9zdXBlcik7XG4gICAgICAgICAgICBmdW5jdGlvbiBFcnJvckhhbmRsZXIoKSB7XG4gICAgICAgICAgICAgICAgX3N1cGVyLmNhbGwodGhpcywgXCJFUlJPUlwiKTtcbiAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICBpZiAod2luZG93KSB7XG4gICAgICAgICAgICAgICAgIHdpbmRvdy5vbmVycm9yID0gZnVuY3Rpb24oZXJyb3IsIHVybCwgbGluZSkge1xuICAgICAgICAgICAgICAgICB0aGlzLmZhdGFsKGVycm9yICsgXCJcXG5pbjogXCIgKyB1cmwgKyBcIlxcbmxpbmU6IFwiICsgbGluZSwgd2luZG93KTtcbiAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBFcnJvckhhbmRsZXIucHJvdG90eXBlLmVycm9yID0gZnVuY3Rpb24gKG1lc3NhZ2UsIHRoYXQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoMCAvKiBFUlJPUiAqLywgbWVzc2FnZSwgdGhhdCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgRXJyb3JIYW5kbGVyLnByb3RvdHlwZS5mYXRhbCA9IGZ1bmN0aW9uIChtZXNzYWdlLCB0aGF0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KDEgLyogRkFUQUwgKi8sIG1lc3NhZ2UsIHRoYXQpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIEVycm9ySGFuZGxlci5wcm90b3R5cGUuZnJhbWV3b3JrID0gZnVuY3Rpb24gKG1lc3NhZ2UsIGV4Y2VwdGlvbiwgdGhhdCkge1xuICAgICAgICAgICAgICAgIHRocm93IGV4Y2VwdGlvbjtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gRXJyb3JIYW5kbGVyO1xuICAgICAgICB9KShGbHVzcy5FdmVudENoYW5uZWwuQ2hhbm5lbGVkRW1pdHRlcik7XG4gICAgICAgIHZhciBlcnJvckhhbmRsZXIgPSBuZXcgRXJyb3JIYW5kbGVyKCk7XG4gICAgICAgIGZ1bmN0aW9uIGdldEVycm9ySGFuZGxlcigpIHtcbiAgICAgICAgICAgIHJldHVybiBlcnJvckhhbmRsZXI7XG4gICAgICAgIH1cbiAgICAgICAgRXJyb3JzLmdldEVycm9ySGFuZGxlciA9IGdldEVycm9ySGFuZGxlcjtcbiAgICAgICAgZnVuY3Rpb24gZXJyb3IobWVzc2FnZSwgdGhhdCkge1xuICAgICAgICAgICAgcmV0dXJuIGVycm9ySGFuZGxlci5lcnJvcihtZXNzYWdlLCB0aGF0KTtcbiAgICAgICAgfVxuICAgICAgICBFcnJvcnMuZXJyb3IgPSBlcnJvcjtcbiAgICAgICAgZnVuY3Rpb24gZmF0YWwobWVzc2FnZSwgdGhhdCkge1xuICAgICAgICAgICAgcmV0dXJuIGVycm9ySGFuZGxlci5mYXRhbChtZXNzYWdlLCB0aGF0KTtcbiAgICAgICAgfVxuICAgICAgICBFcnJvcnMuZmF0YWwgPSBmYXRhbDtcbiAgICAgICAgZnVuY3Rpb24gZnJhbWV3b3JrKG1lc3NhZ2UsIGV4Y2VvdGlvbiwgdGhhdCkge1xuICAgICAgICAgICAgcmV0dXJuIGVycm9ySGFuZGxlci5mcmFtZXdvcmsobWVzc2FnZSwgZXhjZW90aW9uLCB0aGF0KTtcbiAgICAgICAgfVxuICAgICAgICBFcnJvcnMuZnJhbWV3b3JrID0gZnJhbWV3b3JrO1xuICAgIH0pKEVycm9ycyA9IEZsdXNzLkVycm9ycyB8fCAoRmx1c3MuRXJyb3JzID0ge30pKTtcbn0pKEZsdXNzIHx8IChGbHVzcyA9IHt9KSk7XG5pZiAodHlwZW9mIGV4cG9ydHMgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBleHBvcnRzLkVycm9ycyA9IEZsdXNzLkVycm9ycztcbn1cbmlmICh0eXBlb2YgdGhpc1tcImRlZmluZVwiXSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgdGhpc1tcImRlZmluZVwiXShbXSwgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gRmx1c3MuRXJyb3JzO1xuICAgIH0pO1xufVxuXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9kaXNwYXRjaGVyLnRzXCIgLz5cbi8qKlxuICogQ3JlYXRlZCBieSBTdGVwaGFuLlNtb2xhIG9uIDI4LjEwLjIwMTQuXG4gKi9cblwidXNlIHN0cmljdFwiO1xudmFyIEZsdXNzO1xuKGZ1bmN0aW9uIChGbHVzcykge1xuICAgIHZhciBCYXNlQWN0aW9ucztcbiAgICAoZnVuY3Rpb24gKEJhc2VBY3Rpb25zKSB7XG4gICAgICAgIChmdW5jdGlvbiAoQUNUSU9OUykge1xuICAgICAgICAgICAgQUNUSU9OU1tBQ1RJT05TW1wiX19BTllfX1wiXSA9IC0xMDAwXSA9IFwiX19BTllfX1wiO1xuICAgICAgICAgICAgQUNUSU9OU1tBQ1RJT05TW1wiVU5ET1wiXSA9IC0yMDAwXSA9IFwiVU5ET1wiO1xuICAgICAgICB9KShCYXNlQWN0aW9ucy5BQ1RJT05TIHx8IChCYXNlQWN0aW9ucy5BQ1RJT05TID0ge30pKTtcbiAgICAgICAgdmFyIEFDVElPTlMgPSBCYXNlQWN0aW9ucy5BQ1RJT05TO1xuICAgICAgICAvKipcbiAgICAgICAgICogR2VuZXJpYyBhY3Rpb24gdHJpZ2dlciB0aGF0IGNhbiBiZSBmZWQgYnkgcGFzc2luZyB0aGUgYWN0aW9uIGlkIGFuZCBwYXJhbWV0ZXJzLlxuICAgICAgICAgKiBDYW4gYmUgdXNlZCBpbiBzaXR1YXRpb25zIHdoZXJlIGFjdGlvbnMgYXJlIHRyaWdnZXJlZCBiYXNlZCBvbiBhIGNvbmZpZ3VyYXRpb24uXG4gICAgICAgICAqXG4gICAgICAgICAqIEV4cGxpY2l0IEZ1bmN0aW9ucyBhcmUgcmVjb21tZW5kZWQgZm9yIGFsbCBhY3Rpb25zLCBiZWNhdXNlIHRoZXkgbWFrZSBjb2RpbmcgZWFzaWVyXG4gICAgICAgICAqIGFuZCBjb2RlIG1vcmUgcmVhZGFibGVcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIGFjdGlvblxuICAgICAgICAgKiBAcGFyYW0gYXJnc1xuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gdHJpZ2dlckFjdGlvbihhY3Rpb24pIHtcbiAgICAgICAgICAgIHZhciBhcmdzID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBfaSA9IDE7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgICAgIGFyZ3NbX2kgLSAxXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBGbHVzcy5EaXNwYXRjaGVyLmdldERpc3BhdGNoZXIoKS5kaXNwYXRjaEFjdGlvbi5hcHBseShGbHVzcy5EaXNwYXRjaGVyLmdldERpc3BhdGNoZXIoKSwgW2FjdGlvbl0uY29uY2F0KGFyZ3MpKTtcbiAgICAgICAgfVxuICAgICAgICBCYXNlQWN0aW9ucy50cmlnZ2VyQWN0aW9uID0gdHJpZ2dlckFjdGlvbjtcbiAgICAgICAgZnVuY3Rpb24gdW5kbygpIHtcbiAgICAgICAgICAgIEZsdXNzLkRpc3BhdGNoZXIuZ2V0RGlzcGF0Y2hlcigpLmRpc3BhdGNoQWN0aW9uKC0yMDAwIC8qIFVORE8gKi8pO1xuICAgICAgICB9XG4gICAgICAgIEJhc2VBY3Rpb25zLnVuZG8gPSB1bmRvO1xuICAgIH0pKEJhc2VBY3Rpb25zID0gRmx1c3MuQmFzZUFjdGlvbnMgfHwgKEZsdXNzLkJhc2VBY3Rpb25zID0ge30pKTtcbn0pKEZsdXNzIHx8IChGbHVzcyA9IHt9KSk7XG5pZiAodHlwZW9mIGV4cG9ydHMgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBleHBvcnRzLkJhc2VBY3Rpb25zID0gRmx1c3MuQmFzZUFjdGlvbnM7XG59XG5pZiAodHlwZW9mIHRoaXNbXCJkZWZpbmVcIl0gPT09IFwiZnVuY3Rpb25cIikge1xuICAgIHRoaXNbXCJkZWZpbmVcIl0oW10sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIEZsdXNzLkJhc2VBY3Rpb25zO1xuICAgIH0pO1xufVxuXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9lcnJvcnMudHNcIiAvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vZXZlbnRDaGFubmVsLnRzXCIgLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2Jhc2VBY3Rpb25zLnRzXCIgLz5cbi8qKlxuICogQ3JlYXRlZCBieSBTdGVwaGFuLlNtb2xhIG9uIDI4LjEwLjIwMTQuXG4gKi9cblwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9IHRoaXMuX19leHRlbmRzIHx8IGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07XG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XG4gICAgX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGU7XG4gICAgZC5wcm90b3R5cGUgPSBuZXcgX18oKTtcbn07XG52YXIgRmx1c3M7XG4oZnVuY3Rpb24gKEZsdXNzKSB7XG4gICAgdmFyIERpc3BhdGNoZXI7XG4gICAgKGZ1bmN0aW9uIChfRGlzcGF0Y2hlcikge1xuICAgICAgICAvKipcbiAgICAgICAgICogQ3JlYXRlIGEgbWVtZW50byBvYmplY3QuXG4gICAgICAgICAqIEBwYXJhbSBpbnN0YW5jZVxuICAgICAgICAgKiBAcGFyYW0gZGF0YVxuICAgICAgICAgKiBAcGFyYW0gcmVkb1xuICAgICAgICAgKiBAcGFyYW0gdW5kbyAgICAgIE9wdGlvbmFsbHkgeW91IGNhbiBwcm92aWRlIGFuIGFjdGlvbiBmb3IgdW5kb2luZywgaWYgdGhhdCBpcyBzaW1wbGVyIHRoYW4gc3RvcmluZyBkYXRhXG4gICAgICAgICAqIEByZXR1cm5zIHt7ZGF0YTogYW55LCByZWRvOiBJQWN0aW9uLCBpbnN0YW5jZTogSVVuZG9hYmxlfX1cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZU1lbWVudG8oaW5zdGFuY2UsIGRhdGEpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgYWN0aW9uOiAtMSxcbiAgICAgICAgICAgICAgICBkYXRhOiBkYXRhLFxuICAgICAgICAgICAgICAgIHJlZG86IG51bGwsXG4gICAgICAgICAgICAgICAgdW5kbzogbnVsbCxcbiAgICAgICAgICAgICAgICBpbnN0YW5jZTogaW5zdGFuY2VcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgX0Rpc3BhdGNoZXIuY3JlYXRlTWVtZW50byA9IGNyZWF0ZU1lbWVudG87XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDcmVhdGUgYSByZWRvIG9iamVjdC5cbiAgICAgICAgICogQHBhcmFtIGFjdGlvblxuICAgICAgICAgKiBAcGFyYW0gZGF0YVxuICAgICAgICAgKiBAcmV0dXJucyB7e2FjdGlvbjogbnVtYmVyLCBkYXRhOiBhbnl9fVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlUmVkbyhhY3Rpb24sIGRhdGEpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgYWN0aW9uOiBhY3Rpb24sXG4gICAgICAgICAgICAgICAgZGF0YTogZGF0YVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBfRGlzcGF0Y2hlci5jcmVhdGVSZWRvID0gY3JlYXRlUmVkbztcbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlVW5kb0FjdGlvbihhY3Rpb24pIHtcbiAgICAgICAgICAgIHZhciBhcmdzID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBfaSA9IDE7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgICAgIGFyZ3NbX2kgLSAxXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGFjdGlvbjogLTEsXG4gICAgICAgICAgICAgICAgZGF0YTogbnVsbCxcbiAgICAgICAgICAgICAgICByZWRvOiBudWxsLFxuICAgICAgICAgICAgICAgIHVuZG86IHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiBhY3Rpb24sXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGFyZ3NcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGluc3RhbmNlOiBudWxsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIF9EaXNwYXRjaGVyLmNyZWF0ZVVuZG9BY3Rpb24gPSBjcmVhdGVVbmRvQWN0aW9uO1xuICAgICAgICAvKipcbiAgICAgICAgICogRXZlbnRzIHRoYXQgYXJlIHJhaXNlZCBieSB0aGUgdW5kbyBtYW5hZ2VyLlxuICAgICAgICAgKi9cbiAgICAgICAgKGZ1bmN0aW9uIChFVkVOVFMpIHtcbiAgICAgICAgICAgIEVWRU5UU1tFVkVOVFNbXCJVTkRPXCJdID0gMF0gPSBcIlVORE9cIjtcbiAgICAgICAgICAgIEVWRU5UU1tFVkVOVFNbXCJSRURPXCJdID0gMV0gPSBcIlJFRE9cIjtcbiAgICAgICAgICAgIEVWRU5UU1tFVkVOVFNbXCJNRU1FTlRPX1NUT1JFRFwiXSA9IDJdID0gXCJNRU1FTlRPX1NUT1JFRFwiO1xuICAgICAgICAgICAgRVZFTlRTW0VWRU5UU1tcIkNMRUFSXCJdID0gM10gPSBcIkNMRUFSXCI7XG4gICAgICAgIH0pKF9EaXNwYXRjaGVyLkVWRU5UUyB8fCAoX0Rpc3BhdGNoZXIuRVZFTlRTID0ge30pKTtcbiAgICAgICAgdmFyIEVWRU5UUyA9IF9EaXNwYXRjaGVyLkVWRU5UUztcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEltcGxlbWVudGF0aW9uIG9mIGEgZGlzcGF0Y2hlciBhcyBkZXNjcmliZWQgYnkgdGhlIEZMVVggcGF0dGVybi5cbiAgICAgICAgICovXG4gICAgICAgIHZhciBEaXNwYXRjaGVyID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGZ1bmN0aW9uIERpc3BhdGNoZXIoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5faGFuZGxlcnMgPSB7fTtcbiAgICAgICAgICAgICAgICB0aGlzLl9kaXNwYXRjaGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHRoaXMuX3VuZG9pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB0aGlzLl9kaXNhYmxlZCA9IHt9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgRGlzcGF0Y2hlci5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9oYW5kbGVycyA9IHt9O1xuICAgICAgICAgICAgICAgIHRoaXMuX2Rpc3BhdGNoaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdGhpcy5fdW5kb2luZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHRoaXMuX2Rpc2FibGVkID0ge307XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KERpc3BhdGNoZXIucHJvdG90eXBlLCBcInVuZG9pbmdcIiwge1xuICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fdW5kb2luZztcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogVGhlIGFjdHVhbCBkaXNwYXRjaFxuICAgICAgICAgICAgICogQHBhcmFtIGRvTWVtZW50b1xuICAgICAgICAgICAgICogQHBhcmFtIHR5cGVcbiAgICAgICAgICAgICAqIEBwYXJhbSBhcmdzXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIERpc3BhdGNoZXIucHJvdG90eXBlLmRpc3BhdGNoID0gZnVuY3Rpb24gKGRvTWVtZW50bywgdHlwZSwgYXJncykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBtZW1lbnRvcyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkb2l0ID0gZnVuY3Rpb24gKF9fdHlwZSwgZGlzcGF0Y2gsIHRydWVUeXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhhdC5faGFuZGxlcnNbX190eXBlXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuX2hhbmRsZXJzW19fdHlwZV0uZm9yRWFjaChmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZG9NZW1lbnRvICYmIGRbMV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtZW1lbnRvID0gZFsxXS5hcHBseSh0aGF0LCBbdHJ1ZVR5cGUgfHwgX190eXBlXS5jb25jYXQoYXJncykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1lbWVudG8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG1lbWVudG8pID09PSBcIltvYmplY3QgQXJyYXldXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkobWVtZW50b3MsIG1lbWVudG8pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVtZW50b3MucHVzaChtZW1lbnRvKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGF0Y2goZFswXSwgYXJncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGRvaXQodHlwZSwgZnVuY3Rpb24gKGhhbmRsZXIsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBkb2l0KC0xMDAwIC8qIF9fQU5ZX18gKi8sIGZ1bmN0aW9uIChoYW5kbGVyLCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVyLmFwcGx5KHRoaXMsIFt0eXBlLCBhcmdzXSk7XG4gICAgICAgICAgICAgICAgICAgIH0sIHR5cGUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobWVtZW50b3MubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBnZXRVbmRvTWFuYWdlcigpLnN0b3JlTWVtZW50b3MobWVtZW50b3MsIHR5cGUsIGNyZWF0ZVJlZG8odHlwZSwgYXJncykpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBtc2cgPSBcIkludGVybmFsIGVycm9yLiBJZiB0aGlzIGhhcHBlbnMgcGxlYXNlIGNoZWNrIGlmIGl0IHdhcyBhIHVzZXIgZXJyb3IgXFxuXCIgKyBcInRoYXQgY2FuIGJlIGVpdGhlciBwcmV2ZW50ZWQgb3IgZ3JhY2VmdWxseSBoYW5kbGVkLlxcblxcblwiO1xuICAgICAgICAgICAgICAgICAgICBtc2cgKz0gXCJIYW5kbGVkIGFjdGlvbjogXCIgKyB0eXBlICsgXCJcXG5cIjtcbiAgICAgICAgICAgICAgICAgICAgbXNnICs9IFwiQ3JlYXRlIG1lbWVudG86IFwiICsgKGRvTWVtZW50byA/IFwieWVzXFxuXCIgOiBcIm5vXFxuXCIpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYXJnU3RyID0gXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ1N0ciA9IEpTT04uc3RyaW5naWZ5KGFyZ3MsIG51bGwsIDIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmdTdHIgPSBcIkl0J3MgYSBjaXJjdWxhciBzdHJ1Y3R1cmUgOi0oXCI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbXNnICs9IFwiQXJndW1lbnRzICAgICA6IFwiICsgYXJnU3RyICsgXCJcXG5cIjtcbiAgICAgICAgICAgICAgICAgICAgbXNnICs9IFwiTWVtZW50b3MgICAgICA6IFwiICsgKG1lbWVudG9zID8gSlNPTi5zdHJpbmdpZnkobWVtZW50b3MsIG51bGwsIDIpIDogXCJub25lXCIpICsgXCJcXG5cIjtcbiAgICAgICAgICAgICAgICAgICAgbXNnICs9IFwiRXhjZXB0aW9uICAgICA6IFwiICsgZS5tZXNzYWdlICsgXCJcXG5cIjtcbiAgICAgICAgICAgICAgICAgICAgbXNnICs9IFwiU3RhY2sgdHJhY2UgICA6XFxuXCIgKyBlLnN0YWNrICsgXCJcXG5cIjtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cobXNnKTtcbiAgICAgICAgICAgICAgICAgICAgRmx1c3MuRXJyb3JzLmZyYW1ld29yayhlLm1lc3NhZ2UsIGUsIHRoYXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIERpc3BhdGNoIGFuIHVuZG8gYWN0aW9uLiBUaGlzIGlzIGJhc2ljYWxseSB0aGUgc2FtZSBhcyBkaXNwYXRjaGluZyBhIHJlZ3VsYXJcbiAgICAgICAgICAgICAqIGFjdGlvbiwgYnV0IHRoZSBtZW1lbnRvIHdpbGwgbm90IGJlIGNyZWF0ZWQuXG4gICAgICAgICAgICAgKiBAcGFyYW0gdHlwZVxuICAgICAgICAgICAgICogQHBhcmFtIGFyZ3NcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgRGlzcGF0Y2hlci5wcm90b3R5cGUuZGlzcGF0Y2hVbmRvQWN0aW9uID0gZnVuY3Rpb24gKGFjdGlvbikge1xuICAgICAgICAgICAgICAgIHZhciBhcmdzID0gW107XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAxOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgICAgICAgICAgYXJnc1tfaSAtIDFdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9kaXNhYmxlZFthY3Rpb25dKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3VuZG9pbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwYXRjaChmYWxzZSwgYWN0aW9uLCBhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3VuZG9pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIERpc3BhdGNoLCBpLmUuIGJyb2FkY2FzdCBhbiBhY3Rpb24gdG8gYW55b25lIHRoYXQncyBpbnRlcmVzdGVkLlxuICAgICAgICAgICAgICogQHBhcmFtIHR5cGVcbiAgICAgICAgICAgICAqIEBwYXJhbSBkYXRhXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIERpc3BhdGNoZXIucHJvdG90eXBlLmRpc3BhdGNoQWN0aW9uID0gZnVuY3Rpb24gKGFjdGlvbikge1xuICAgICAgICAgICAgICAgIHZhciBhcmdzID0gW107XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAxOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgICAgICAgICAgYXJnc1tfaSAtIDFdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9kaXNhYmxlZFthY3Rpb25dKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2godHJ1ZSwgYWN0aW9uLCBhcmdzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBTdWJzY3JpYmUgdG8gYW4gYWN0aW9uLlxuICAgICAgICAgICAgICogQHBhcmFtIGFjdGlvblxuICAgICAgICAgICAgICogQHBhcmFtIGhhbmRsZXJcbiAgICAgICAgICAgICAqIEBwYXJhbSBtZW1lbnRvUHJvdmlkZXJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgRGlzcGF0Y2hlci5wcm90b3R5cGUuc3Vic2NyaWJlQWN0aW9uID0gZnVuY3Rpb24gKGFjdGlvbiwgaGFuZGxlciwgbWVtZW50b1Byb3ZpZGVyKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9oYW5kbGVyc1thY3Rpb25dKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2hhbmRsZXJzW2FjdGlvbl0gPSBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2hhbmRsZXJzW2FjdGlvbl0uaW5kZXhPZihoYW5kbGVyKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5faGFuZGxlcnNbYWN0aW9uXS5wdXNoKFtoYW5kbGVyLCBtZW1lbnRvUHJvdmlkZXJdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBVbnN1YnNjcmliZSBhbiBhY3Rpb24gaGFuZGxlci4gVGhpcyByZW1vdmVzIGEgcG90ZW50aWFsIG1lbWVudG9Qcm92aWRlciBhbHNvLlxuICAgICAgICAgICAgICogQHBhcmFtIGFjdGlvblxuICAgICAgICAgICAgICogQHBhcmFtIGhhbmRsZXJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgRGlzcGF0Y2hlci5wcm90b3R5cGUudW5zdWJzY3JpYmVBY3Rpb24gPSBmdW5jdGlvbiAoYWN0aW9uLCBoYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2hhbmRsZXJzW2FjdGlvbl0pIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl9oYW5kbGVyc1thY3Rpb25dLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5faGFuZGxlcnNbYWN0aW9uXVtpXVswXSA9PT0gaGFuZGxlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2hhbmRsZXJzW2FjdGlvbl0uc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBEaXNwYXRjaGVyLnByb3RvdHlwZS5kaXNhYmxlQWN0aW9uID0gZnVuY3Rpb24gKGFjdGlvbikge1xuICAgICAgICAgICAgICAgIHRoaXMuX2Rpc2FibGVkW2FjdGlvbl0gPSB0cnVlO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIERpc3BhdGNoZXIucHJvdG90eXBlLmVuYWJsZUFjdGlvbiA9IGZ1bmN0aW9uIChhY3Rpb24pIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fZGlzYWJsZWRbYWN0aW9uXSkge1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5fZGlzYWJsZWRbYWN0aW9uXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIERpc3BhdGNoZXI7XG4gICAgICAgIH0pKCk7XG4gICAgICAgIHZhciBkaXNwYXRjaGVyID0gbmV3IERpc3BhdGNoZXIoKTtcbiAgICAgICAgZnVuY3Rpb24gZ2V0RGlzcGF0Y2hlcigpIHtcbiAgICAgICAgICAgIHJldHVybiBkaXNwYXRjaGVyO1xuICAgICAgICB9XG4gICAgICAgIF9EaXNwYXRjaGVyLmdldERpc3BhdGNoZXIgPSBnZXREaXNwYXRjaGVyO1xuICAgICAgICBmdW5jdGlvbiBkaXNwYXRjaChhY3Rpb24pIHtcbiAgICAgICAgICAgIHZhciBhcmdzID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBfaSA9IDE7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgICAgIGFyZ3NbX2kgLSAxXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkaXNwYXRjaGVyLmRpc3BhdGNoQWN0aW9uLmFwcGx5KGRpc3BhdGNoZXIsIFthY3Rpb25dLmNvbmNhdChhcmdzKSk7XG4gICAgICAgIH1cbiAgICAgICAgX0Rpc3BhdGNoZXIuZGlzcGF0Y2ggPSBkaXNwYXRjaDtcbiAgICAgICAgZnVuY3Rpb24gc3Vic2NyaWJlQWN0aW9uKGFjdGlvbiwgaGFuZGxlciwgbWVtZW50b1Byb3ZpZGVyKSB7XG4gICAgICAgICAgICBkaXNwYXRjaGVyLnN1YnNjcmliZUFjdGlvbihhY3Rpb24sIGhhbmRsZXIsIG1lbWVudG9Qcm92aWRlcik7XG4gICAgICAgIH1cbiAgICAgICAgX0Rpc3BhdGNoZXIuc3Vic2NyaWJlQWN0aW9uID0gc3Vic2NyaWJlQWN0aW9uO1xuICAgICAgICBmdW5jdGlvbiB1bnN1YnNjcmliZUFjdGlvbihhY3Rpb24sIGhhbmRsZXIpIHtcbiAgICAgICAgICAgIGRpc3BhdGNoZXIudW5zdWJzY3JpYmVBY3Rpb24oYWN0aW9uLCBoYW5kbGVyKTtcbiAgICAgICAgfVxuICAgICAgICBfRGlzcGF0Y2hlci51bnN1YnNjcmliZUFjdGlvbiA9IHVuc3Vic2NyaWJlQWN0aW9uO1xuICAgICAgICBmdW5jdGlvbiBkaXNhYmxlQWN0aW9uKGFjdGlvbikge1xuICAgICAgICAgICAgZGlzcGF0Y2hlci5kaXNhYmxlQWN0aW9uKGFjdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgX0Rpc3BhdGNoZXIuZGlzYWJsZUFjdGlvbiA9IGRpc2FibGVBY3Rpb247XG4gICAgICAgIGZ1bmN0aW9uIGVuYWJsZUFjdGlvbihhY3Rpb24pIHtcbiAgICAgICAgICAgIGRpc3BhdGNoZXIuZW5hYmxlQWN0aW9uKGFjdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgX0Rpc3BhdGNoZXIuZW5hYmxlQWN0aW9uID0gZW5hYmxlQWN0aW9uO1xuICAgICAgICAvKipcbiAgICAgICAgICogUmVzZXRzIGV2ZXJ5dGhpbmcuIE5vIHByZXZpb3VzbHkgc3Vic2NyaWJlZCBoYW5kbGVyIHdpbGwgYmUgY2FsbGVkLlxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gcmVzZXQoKSB7XG4gICAgICAgICAgICBkaXNwYXRjaGVyLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIGRpc3BhdGNoZXIgPSBuZXcgRGlzcGF0Y2hlcigpO1xuICAgICAgICB9XG4gICAgICAgIF9EaXNwYXRjaGVyLnJlc2V0ID0gcmVzZXQ7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBVbmRvIG1hbmFnZXIgaW1wbGVtZW50YXRpb25zLiBJdCB1dGlsaXNlcyB0d28gc3RhY2tzICh1bmRvLCByZWRvKSB0byBwcm92aWRlIHRoZVxuICAgICAgICAgKiBuZWNlc3NhcnkgbWVhbnMgdG8gdW5kbyBhbmQgcmVkbyBhY3Rpb25zLlxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIFVuZG9NYW5hZ2VyID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICAgICAgICAgIF9fZXh0ZW5kcyhVbmRvTWFuYWdlciwgX3N1cGVyKTtcbiAgICAgICAgICAgIGZ1bmN0aW9uIFVuZG9NYW5hZ2VyKCkge1xuICAgICAgICAgICAgICAgIF9zdXBlci5jYWxsKHRoaXMsIFwiVW5kb01hbmFnZXJcIik7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhcigpO1xuICAgICAgICAgICAgICAgIGdldERpc3BhdGNoZXIoKS5zdWJzY3JpYmVBY3Rpb24oLTIwMDAgLyogVU5ETyAqLywgdGhpcy51bmRvLmJpbmQodGhpcykpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBTdG9yZSBhIG1lbWVudG8uIFRoaXMgaXMgcHV0IG9uIGEgc3RhY2sgdGhhdCBpcyB1c2VkIGZvciB1bmRvXG4gICAgICAgICAgICAgKiBAcGFyYW0gbWVtZW50b3NcbiAgICAgICAgICAgICAqIEBwYXJhbSBhY3Rpb24gICAgICAgIHRoZSBhY3Rpb24gdGhhdCBjcmVhdGVkIHRoZSBtZW1lbnRvXG4gICAgICAgICAgICAgKiBAcGFyYW0gcmVkbyAgICAgICAgICB0aGUgZGF0YSB0aGF0IGNhbiBiZSB1c2VkIHRvIHJlY3JlYXRlIHRoZSBhY3Rpb25cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgVW5kb01hbmFnZXIucHJvdG90eXBlLnN0b3JlTWVtZW50b3MgPSBmdW5jdGlvbiAobWVtZW50b3MsIGFjdGlvbiwgcmVkbykge1xuICAgICAgICAgICAgICAgIGlmIChtZW1lbnRvcykge1xuICAgICAgICAgICAgICAgICAgICBtZW1lbnRvcy5mb3JFYWNoKGZ1bmN0aW9uIChtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0ucmVkbyA9IHJlZG87XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbS5hY3Rpb24gPSBhY3Rpb247XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm1lbWVudG9zLnB1c2gobWVtZW50b3MpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlZG9zID0gW107XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgyIC8qIE1FTUVOVE9fU1RPUkVEICovLCBtZW1lbnRvcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogVW5kby4gUG9wIHRoZSBsYXRlc3QgbWVtZW50byBmcm9tIHRoZSBzdGFjayBhbmQgcmVzdG9yZSB0aGUgYWNjb3JkaW5nIG9iamVjdC4gVGhpcyBwdXNoZXMgdGhlIHJlZG8taW5mb1xuICAgICAgICAgICAgICogZnJvbSB0aGUgbWVtZW50byBvbnRvIHRoZSByZWRvIHN0YWNrIHRvIHVzZSBpbiByZWRvLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBVbmRvTWFuYWdlci5wcm90b3R5cGUudW5kbyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgdXMgPSB0aGlzLm1lbWVudG9zLnBvcCgpO1xuICAgICAgICAgICAgICAgIGlmICh1cykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcmVkb3MgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgdXMuZm9yRWFjaChmdW5jdGlvbiAodSwgaSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHUudW5kbykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldERpc3BhdGNoZXIoKS5kaXNwYXRjaFVuZG9BY3Rpb24uYXBwbHkoZ2V0RGlzcGF0Y2hlcigpLCBbdS51bmRvLmFjdGlvbl0uY29uY2F0KHUudW5kby5kYXRhKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1Lmluc3RhbmNlLnJlc3RvcmVGcm9tTWVtZW50byh1KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZG9zLnB1c2godS5yZWRvKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVkb3MucHVzaChyZWRvcyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgwIC8qIFVORE8gKi8sIHVzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBSZWRvLiBQb3AgdGhlIGxhdGVzdCByZWRvIGFjdGlvbiBmcm9tIHRoZSBzdGFjayBhbmQgZGlzcGF0Y2ggaXQuIFRoaXMgZG9lcyBub3Qgc3RvcmUgYW55IHVuZG8gZGF0YSxcbiAgICAgICAgICAgICAqIGFzIHRoZSBkaXNwYXRjaGVyIHdpbGwgZG8gdGhhdCB3aGVuIGRpc3BhdGNoaW5nIHRoZSBhY3Rpb24uXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFVuZG9NYW5hZ2VyLnByb3RvdHlwZS5yZWRvID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBycyA9IHRoaXMucmVkb3MucG9wKCk7XG4gICAgICAgICAgICAgICAgaWYgKHJzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJzLmZvckVhY2goZnVuY3Rpb24gKHIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdldERpc3BhdGNoZXIoKS5kaXNwYXRjaEFjdGlvbi5hcHBseShnZXREaXNwYXRjaGVyKCksIFtyLmFjdGlvbl0uY29uY2F0KHIuZGF0YSkpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KDEgLyogUkVETyAqLywgcnMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIENsZWFyIGFsbCBzdGFja3NcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgVW5kb01hbmFnZXIucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMubWVtZW50b3MgPSBbXTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlZG9zID0gW107XG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KDMgLyogQ0xFQVIgKi8pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFVuZG9NYW5hZ2VyLnByb3RvdHlwZS5nZXRNZW1lbnRvcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5tZW1lbnRvcztcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gVW5kb01hbmFnZXI7XG4gICAgICAgIH0pKEZsdXNzLkV2ZW50Q2hhbm5lbC5DaGFubmVsZWRFbWl0dGVyKTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNpbmdsZXRvbi5cbiAgICAgICAgICogQHR5cGUge1VuZG9NYW5hZ2VyfVxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIHVtID0gbmV3IFVuZG9NYW5hZ2VyKCk7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgdGhlIHVuZG8gbWFuYWdlci4gUmV0dXJucyB0aGUgc2luZ2xlIGluc3RhbmNlLlxuICAgICAgICAgKiBAcmV0dXJucyB7VW5kb01hbmFnZXJ9XG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBnZXRVbmRvTWFuYWdlcigpIHtcbiAgICAgICAgICAgIHJldHVybiB1bTtcbiAgICAgICAgfVxuICAgICAgICBfRGlzcGF0Y2hlci5nZXRVbmRvTWFuYWdlciA9IGdldFVuZG9NYW5hZ2VyO1xuICAgIH0pKERpc3BhdGNoZXIgPSBGbHVzcy5EaXNwYXRjaGVyIHx8IChGbHVzcy5EaXNwYXRjaGVyID0ge30pKTtcbn0pKEZsdXNzIHx8IChGbHVzcyA9IHt9KSk7XG5pZiAodHlwZW9mIGV4cG9ydHMgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBleHBvcnRzLkRpc3BhdGNoZXIgPSBGbHVzcy5EaXNwYXRjaGVyO1xufVxuaWYgKHR5cGVvZiB0aGlzW1wiZGVmaW5lXCJdID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICB0aGlzW1wiZGVmaW5lXCJdKFtdLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBGbHVzcy5EaXNwYXRjaGVyO1xuICAgIH0pO1xufVxuXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9kaXNwYXRjaGVyLnRzXCIgLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2V2ZW50Q2hhbm5lbC50c1wiIC8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9iYXNlQWN0aW9ucy50c1wiIC8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi90b29scy50c1wiIC8+XG4vKipcbiAqIENyZWF0ZWQgYnkgc3RlcGhhbiBvbiAwMS4xMS4xNC5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19leHRlbmRzID0gdGhpcy5fX2V4dGVuZHMgfHwgZnVuY3Rpb24gKGQsIGIpIHtcbiAgICBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTtcbiAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICBfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZTtcbiAgICBkLnByb3RvdHlwZSA9IG5ldyBfXygpO1xufTtcbnZhciBGbHVzcztcbihmdW5jdGlvbiAoRmx1c3MpIHtcbiAgICB2YXIgUGx1Z2lucztcbiAgICAoZnVuY3Rpb24gKFBsdWdpbnMpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEJhc2UgaW1wbGVtZW50YXRpb24gZm9yIGEgcGx1Z2luLiBEb2VzIGFic29sdXRlbHkgbm90aGluZy5cbiAgICAgICAgICovXG4gICAgICAgIHZhciBCYXNlUGx1Z2luID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGZ1bmN0aW9uIEJhc2VQbHVnaW4oKSB7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBCYXNlUGx1Z2luLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoY29udGFpbmVyLCBhY3Rpb24pIHtcbiAgICAgICAgICAgICAgICB2YXIgYXJncyA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIF9pID0gMjsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGFyZ3NbX2kgLSAyXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIEJhc2VQbHVnaW4ucHJvdG90eXBlLmFmdGVyRmluaXNoID0gZnVuY3Rpb24gKGNvbnRhaW5lciwgYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBfaSA9IDI7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgICAgICAgICBhcmdzW19pIC0gMl0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBCYXNlUGx1Z2luLnByb3RvdHlwZS5hZnRlckFib3J0ID0gZnVuY3Rpb24gKGNvbnRhaW5lciwgYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBfaSA9IDI7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgICAgICAgICBhcmdzW19pIC0gMl0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBCYXNlUGx1Z2luLnByb3RvdHlwZS5nZXRNZW1lbnRvID0gZnVuY3Rpb24gKGNvbnRhaW5lciwgYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBfaSA9IDI7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgICAgICAgICBhcmdzW19pIC0gMl0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBCYXNlUGx1Z2luLnByb3RvdHlwZS5yZXN0b3JlRnJvbU1lbWVudG8gPSBmdW5jdGlvbiAoY29udGFpbmVyLCBtZW1lbnRvKSB7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgQmFzZVBsdWdpbi5wcm90b3R5cGUuaG9sZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBCYXNlUGx1Z2luLnByb3RvdHlwZS5yZWxlYXNlID0gZnVuY3Rpb24gKGFjdGlvbikge1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIEJhc2VQbHVnaW4ucHJvdG90eXBlLmFib3J0ID0gZnVuY3Rpb24gKGFjdGlvbikge1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiBCYXNlUGx1Z2luO1xuICAgICAgICB9KSgpO1xuICAgICAgICBQbHVnaW5zLkJhc2VQbHVnaW4gPSBCYXNlUGx1Z2luO1xuICAgICAgICAvKipcbiAgICAgICAgICogQ3JlYXRlIGEgUGx1Z2luLiBVc2UgdGhpcyB3aGVuIHlvdSdyZSB1c2luZyBwbGFpbiBKYXZhU2NyaXB0LlxuICAgICAgICAgKiBAcGFyYW0gc3BlY1xuICAgICAgICAgKiBAcmV0dXJucyB7YW55fVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlUGx1Z2luKHNwZWMpIHtcbiAgICAgICAgICAgIHJldHVybiBGbHVzcy5Ub29scy5zdWJjbGFzcyhzcGVjLCBCYXNlUGx1Z2luKTtcbiAgICAgICAgfVxuICAgICAgICBQbHVnaW5zLmNyZWF0ZVBsdWdpbiA9IGNyZWF0ZVBsdWdpbjtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEJhc2UgaW1wbGVtZW50YXRpb24gZm9yIGEgcGx1Z2luIGNvbnRhaW5lci5cbiAgICAgICAgICovXG4gICAgICAgIHZhciBQbHVnaW5Db250YWluZXIgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgICAgICAgICAgX19leHRlbmRzKFBsdWdpbkNvbnRhaW5lciwgX3N1cGVyKTtcbiAgICAgICAgICAgIGZ1bmN0aW9uIFBsdWdpbkNvbnRhaW5lcihlbWl0dGVySWQpIHtcbiAgICAgICAgICAgICAgICBfc3VwZXIuY2FsbCh0aGlzLCBlbWl0dGVySWQgfHwgXCJDb250YWluZXJcIiArIEZsdXNzLlRvb2xzLm9pZCh0aGlzKSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fcGx1Z2lucyA9IHt9O1xuICAgICAgICAgICAgICAgIHRoaXMuX2FueVBsdWdpbnMgPSBbXTtcbiAgICAgICAgICAgICAgICB0aGlzLl9wcm90b2NvbHMgPSB7fTtcbiAgICAgICAgICAgICAgICB0aGlzLl9ydW5uaW5nUGx1Z2lucyA9IHt9O1xuICAgICAgICAgICAgICAgIHRoaXMuX21lbWVudG9zID0ge307XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTYwNjc5Ny91c2Utb2YtYXBwbHktd2l0aC1uZXctb3BlcmF0b3ItaXMtdGhpcy1wb3NzaWJsZVxuICAgICAgICAgICAgICogQHBhcmFtIGNvbmZpZ1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBQbHVnaW5Db250YWluZXIucHJvdG90eXBlLmNvbmZpZ3VyZSA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBjb25zdHJ1Y3QoY29uc3RydWN0b3IsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gRigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0cnVjdG9yLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIEYucHJvdG90eXBlID0gY29uc3RydWN0b3IucHJvdG90eXBlO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEYoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgICAgIGNvbmZpZy5mb3JFYWNoKGZ1bmN0aW9uIChhY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uLnBsdWdpbnMuZm9yRWFjaChmdW5jdGlvbiAocGx1Z2luKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGx1Z2luLnBsdWdpbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQud3JhcChhY3Rpb24uYWN0aW9uLCBjb25zdHJ1Y3QocGx1Z2luLnBsdWdpbiwgcGx1Z2luLnBhcmFtZXRlcnMpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQud3JhcChhY3Rpb24uYWN0aW9uLCBuZXcgcGx1Z2luKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBQbHVnaW5Db250YWluZXIucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgYWN0aW9uIGluIHRoaXMuX3BsdWdpbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX3BsdWdpbnMuaGFzT3duUHJvcGVydHkoYWN0aW9uKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGwgPSB0aGlzLl9wbHVnaW5zW2FjdGlvbl0ubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGwtLSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGV0YWNoKGFjdGlvbiwgdGhpcy5fcGx1Z2luc1thY3Rpb25dW2xdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLl9hbnlQbHVnaW5zID0gW107XG4gICAgICAgICAgICAgICAgdGhpcy5fcnVubmluZ1BsdWdpbnMgPSB7fTtcbiAgICAgICAgICAgICAgICAvL1RPRE86IEZpbmQgYSB3YXkgdG8gdW5zdWJzY3JpYmUgZnJvbSB0aGUgRGlzcGF0Y2hlclxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFBsdWdpbkNvbnRhaW5lci5wcm90b3R5cGUucGx1Z2luRG9uZSA9IGZ1bmN0aW9uIChhY3Rpb24sIGFib3J0KSB7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgUGx1Z2luQ29udGFpbmVyLnByb3RvdHlwZS5hYm9ydEFjdGlvbiA9IGZ1bmN0aW9uIChhY3Rpb24pIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fcnVubmluZ1BsdWdpbnNbYWN0aW9uXSAmJiB0aGlzLl9ydW5uaW5nUGx1Z2luc1thY3Rpb25dLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcGxnID0gdGhpcy5fcnVubmluZ1BsdWdpbnNbYWN0aW9uXVt0aGlzLl9ydW5uaW5nUGx1Z2luc1thY3Rpb25dLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgICAgICAgICBpZiAocGxnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwbGcuYWJvcnQoYWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLl9ydW5uaW5nUGx1Z2luc1thY3Rpb25dID0gbnVsbDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBQbHVnaW5Db250YWluZXIucHJvdG90eXBlLmFib3J0ID0gZnVuY3Rpb24gKGFjdGlvbikge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgYWN0aW9uID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGFjdGlvbktleSBpbiB0aGlzLl9wcm90b2NvbHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9wcm90b2NvbHMuaGFzT3duUHJvcGVydHkoYWN0aW9uS2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWJvcnRBY3Rpb24oYWN0aW9uS2V5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX3Byb3RvY29sc1thY3Rpb25dKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFib3J0QWN0aW9uKGFjdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBUaGlzIGhhbmRsZXMgYW4gYWN0aW9uIHNlbnQgYnkgdGhlIGRpc3BhdGNoZXIgYW5kIGRlbGVnYXRlcyBpdCB0byB0aGUgcGx1Z2lucy5cbiAgICAgICAgICAgICAqIFBsdWdpbnMgYXJlIFwid3JhcHBlZFwiIGFyb3VuZCBlYWNoIG90aGVyLiBUaGV5IGJ1aWxkIGtpbmQgb2YgYnJhY2tldHMgZGVmaW5lZCBieSB0d28gb2ZcbiAgICAgICAgICAgICAqIHRoZWlyIG1ldGhvZHM6IHJ1biAtIG9wZW5zIHRoZSBicmFja2V0c1xuICAgICAgICAgICAgICogICAgICAgICAgICAgICAgZmluaXNoL2Fib3J0IC0gY2xvc2VzIHRoZSBicmFja2V0cy5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBXZSdsbCB0YWxrIGFib3V0IGZpbmlzaCBmcm9tIG5vdyBvbi4gVGhhdCBjYW4gYmUgcmVwbGFjZWQgYnkgYWJvcnQgZXZlcnl3aGVyZS4gVGhlIGZpcnN0IHBsdWdpbiB0byBhYm9ydFxuICAgICAgICAgICAgICogZm9yY2VzIGFsbCBzdWNjZWVkaW5nIHBsdWdpbnMgdG8gYWJvcnQgYXMgd2VsbC5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBTbyB3cmFwcGluZyBpbiB0aGUgb3JkZXIgQS0+Qi0+QyBsZWFkcyB0byB0aGVzZSBicmFja2V0czpcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiAgcnVuQy1ydW5CLXJ1bkEtZmluaXNoQS1maW5pc2hCLWZpbmlzaENcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBmaW5pc2ggaXMgb25seSBjYWxsZWQgd2hlbiB0aGUgcGx1Z2luIGNhbGxzIHRoZSBkb25lLWNhbGxiYWNrIHRoYXQgaXMgcHJvdmlkZWQgdG8gaXRzIHJ1bi1tZXRob2QuXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogU28gdG8gY29ycmVjdGx5IGV4ZWN1dGUgdGhpcyBcImNoYWluXCIgd2UgbmVlZCB0byB3YWl0IGZvciB0aGUgcGx1Z2lucyB0byBjYWxsIHRoZWlyIGRvbmUtY2FsbGJhY2tzIGJlZm9yZVxuICAgICAgICAgICAgICogd2UgY2FuIHByb2NlZWQuIEJlY2F1c2UgdGhlIHBsdWdpbnMgbWF5IGNhbGwgdGhlaXIgZG9uZS1jYWxsYmFjayBvdXRzaWRlIHRoZWlyIHJ1bi1tZXRob2QsIGUuZy4gdHJpZ2dlcmVkIGJ5XG4gICAgICAgICAgICAgKiB1c2VyIGludGVyYWN0aW9uLCB3ZSBuZWVkIHRvIGtlZXAgdHJhY2sgb2Ygd2hhdCB0aGUgcGx1Z2lucyBkaWQgdXNpbmcgYSBwcm90b2NvbC5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBUaGF0IHByb3RvY29sIGxvb2tzIGxpa2UgdGhpczpcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiAge1xuICAgICAqICAgIGk6IHsgZG9uZTogQSBmdW5jdGlvbiB0aGF0IGNhbGxzIGVpdGhlciBmaW5pc2ggb3IgYWJvcnQgb24gdGhlIGktdGggcGx1Z2luLFxuICAgICAqICAgICAgICAgYWJvcnQ6IGRpZCB0aGUgcGx1Z2luIGFib3J0P1xuICAgICAqXG4gICAgICogICAgaSsxOiAuLi5cbiAgICAgKiAgfVxuICAgICAqXG4gICAgICogdGhpcyBwcm90b2NvbCBpcyBpbml0aWFsaXplZCBieSBudWxsIGVudHJpZXMgZm9yIGFsbCBwbHVnaW5zLiBUaGVuIHRoZSBydW4tbWV0aG9kcyBmb3IgYWxsIHBsdWdpbnMgYXJlIGNhbGxlZCwgZ2l2aW5nIHRoZW0gYSBkb25lXG4gICAgICogY2FsbGJhY2ssIHRoYXQgZmlsbHMgdGhlIHByb3RvY29sLlxuICAgICAqXG4gICAgICogQWZ0ZXIgZXZlcnkgcnVuLW1ldGhvZCB3ZSBjaGVjayBpZiB3ZSdyZSBhdCB0aGUgaW5uZXJtb3N0IHBsdWdpbiAoQSBpbiB0aGUgZXhhbXBsZSBhYm92ZSwgdGhlIG9uZSB0aGF0IGZpcnN0IHdyYXBwZWQgdGhlIGFjdGlvbikuXG4gICAgICogSWYgd2UgYXJlLCB3ZSB3b3JrIHRocm91Z2ggdGhlIHByb3RvY29sIGFzIGxvbmcgYXMgdGhlcmUgYXJlIHZhbGlkIGVudHJpZXMuIFRoZW4gd2Ugd2FpdCBmb3IgdGhlIG5leHQgZG9uZS1jYWxsYmFjayB0byBiZSBjYWxsZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYWN0aW9uXG4gICAgICAgICAgICAgKiBAcGFyYW0gYXJnc1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBQbHVnaW5Db250YWluZXIucHJvdG90eXBlLmRvSGFuZGxlQWN0aW9uID0gZnVuY3Rpb24gKHBsdWdpbnMsIGFjdGlvbiwgYXJncykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9ydW5uaW5nUGx1Z2luc1thY3Rpb25dICYmIHRoaXMuX3J1bm5pbmdQbHVnaW5zW2FjdGlvbl0ubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkVSUk9SIGNhbGxpbmcgYWN0aW9uIFwiICsgYWN0aW9uICsgXCIuIFNhbWUgYWN0aW9uIGNhbm5vdCBiZSBjYWxsZWQgaW5zaWRlIGl0c2VsZiFcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICAgICB2YXIgY29tcG9zZUFyZ3MgPSBmdW5jdGlvbiAocGx1Z2luLCBhY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFt0aGF0LCBhY3Rpb25dLmNvbmNhdChhcmdzKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHRoaXMuX21lbWVudG9zW2FjdGlvbl0gPSBbXTtcbiAgICAgICAgICAgICAgICB0aGlzLl9ydW5uaW5nUGx1Z2luc1thY3Rpb25dID0gW107XG4gICAgICAgICAgICAgICAgdGhpcy5fcHJvdG9jb2xzW2FjdGlvbl0gPSBbXTtcbiAgICAgICAgICAgICAgICBwbHVnaW5zLmZvckVhY2goZnVuY3Rpb24gKHBsdWdpbikge1xuICAgICAgICAgICAgICAgICAgICB0aGF0Ll9wcm90b2NvbHNbYWN0aW9uXS5wdXNoKDApO1xuICAgICAgICAgICAgICAgICAgICB0aGF0Ll9ydW5uaW5nUGx1Z2luc1thY3Rpb25dLnB1c2gocGx1Z2luKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB2YXIgYWJvcnRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHBsdWdpbnMuZm9yRWFjaChmdW5jdGlvbiAocGx1Z2luLCBpKSB7XG4gICAgICAgICAgICAgICAgICAgIChmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkb25lID0gZnVuY3Rpb24gKGFib3J0LCBkb25lQWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXggPSB0aGF0LmdldFBsdWdpbnNGb3JBY3Rpb24oZG9uZUFjdGlvbikuaW5kZXhPZihwbHVnaW4pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuX3Byb3RvY29sc1tkb25lQWN0aW9uXVtpbmRleF0gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBsdWdpbjogcGx1Z2luLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb25lOiBmdW5jdGlvbiAoYWJvcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhYm9ydCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBsdWdpbi5hZnRlckFib3J0LmFwcGx5KHBsdWdpbiwgY29tcG9zZUFyZ3MocGx1Z2luLCBkb25lQWN0aW9uKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwbHVnaW4uYWZ0ZXJGaW5pc2guYXBwbHkocGx1Z2luLCBjb21wb3NlQXJncyhwbHVnaW4sIGRvbmVBY3Rpb24pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWJvcnQ6IGFib3J0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGFzdCA9IHRoYXQuX3Byb3RvY29sc1tkb25lQWN0aW9uXS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGxhc3QtLSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhhdC5fcHJvdG9jb2xzW2RvbmVBY3Rpb25dW2xhc3RdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhYm9ydCB8PSB0aGF0Ll9wcm90b2NvbHNbZG9uZUFjdGlvbl1bbGFzdF0uYWJvcnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0Ll9wcm90b2NvbHNbZG9uZUFjdGlvbl1bbGFzdF0uZG9uZShhYm9ydCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0Ll9wcm90b2NvbHNbZG9uZUFjdGlvbl0ucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhhdC5fcnVubmluZ1BsdWdpbnNbZG9uZUFjdGlvbl0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0Ll9ydW5uaW5nUGx1Z2luc1tkb25lQWN0aW9uXS5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGhhdC5fcnVubmluZ1BsdWdpbnNbZG9uZUFjdGlvbl0gfHwgIXRoYXQuX3J1bm5pbmdQbHVnaW5zW2RvbmVBY3Rpb25dLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LmZpbmFsaXplQWN0aW9uKGRvbmVBY3Rpb24sIGFib3J0LCB0aGF0LmdldFBsdWdpbnNGb3JBY3Rpb24oZG9uZUFjdGlvbiksIHRoYXQuX21lbWVudG9zW2RvbmVBY3Rpb25dLCBhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGhvbGRzID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZG9uZXMgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBsdWdpbltcImhvbGRcIl0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaG9sZHMgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBsdWdpbltcImFib3J0XCJdID0gZnVuY3Rpb24gKGFib3J0QWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFjdCA9IHR5cGVvZiBhYm9ydEFjdGlvbiA9PT0gXCJ1bmRlZmluZWRcIiA/IGFjdGlvbiA6IGFib3J0QWN0aW9uO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvbmVzW2FjdF0gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvbmUodHJ1ZSwgYWN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhYm9ydGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBwbHVnaW5bXCJyZWxlYXNlXCJdID0gZnVuY3Rpb24gKHJlbGVhc2VBY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYWN0ID0gdHlwZW9mIHJlbGVhc2VBY3Rpb24gPT09IFwidW5kZWZpbmVkXCIgPyBhY3Rpb24gOiByZWxlYXNlQWN0aW9uO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkb25lc1thY3RdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlBsdWdpbiByZWxlYXNlZCB0d2ljZSBmb3IgYWN0aW9uIFwiICsgYWN0ICsgXCIhIFBvc3NpYmx5IGNhbGxlZCByZWxlYXNlIGFmdGVyIGFib3J0IG9yIHZpY2UgdmVyc2EuXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9uZShmYWxzZSwgYWN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9uZXNbYWN0XSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghYWJvcnRlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtZW1lbnRvID0gcGx1Z2luLmdldE1lbWVudG8uYXBwbHkocGx1Z2luLCBjb21wb3NlQXJncyhwbHVnaW4sIGFjdGlvbikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtZW1lbnRvKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lbWVudG8uaW5zdGFuY2UgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN0b3JlRnJvbU1lbWVudG86IGZ1bmN0aW9uIChtZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwbHVnaW4ucmVzdG9yZUZyb21NZW1lbnRvKHRoYXQsIG1lbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuX21lbWVudG9zW2FjdGlvbl0ucHVzaChtZW1lbnRvKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgd2UgYWJvcnRlZDogQ2xlYW4gdXA6IEFsbCBQbHVnaW5zIHRoYXQgd2hlcmUgc3RhcnRlZCB1bnRpbCBub3cgKG91dGVyKSB3aWxsIGJlIGFib3J0ZWQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT3RoZXJzIHRoYXQgd291bGQgaGF2ZSBiZWVuIHN0YXJ0ZWQgYWZ0ZXJ3YXJkcyAoaW5uZXIpIHdvbid0IGJlIGNhbGxlZCBhdCBhbGwuIChzZWUgaWYtc3RhdGVtZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYWJvdmUgdGhpcyBjb21tZW50KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBsdWdpbi5ydW4uYXBwbHkocGx1Z2luLCBjb21wb3NlQXJncyhwbHVnaW4sIGFjdGlvbikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhYm9ydGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsYXN0ID0gKHRoYXQuX3Byb3RvY29sc1thY3Rpb25dICYmIHRoYXQuX3Byb3RvY29sc1thY3Rpb25dLmxlbmd0aCkgfHwgMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGxhc3QtLSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoYXQuX3Byb3RvY29sc1thY3Rpb25dW2xhc3RdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5fcHJvdG9jb2xzW2FjdGlvbl1bbGFzdF0uZG9uZSh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0Ll9wcm90b2NvbHNbYWN0aW9uXS5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuZmluYWxpemVBY3Rpb24oYWN0aW9uLCB0cnVlLCB0aGF0LmdldFBsdWdpbnNGb3JBY3Rpb24oYWN0aW9uKSwgbnVsbCwgYXJncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWhvbGRzICYmICFkb25lc1thY3Rpb25dKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9uZShmYWxzZSwgYWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pKGkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFBsdWdpbkNvbnRhaW5lci5wcm90b3R5cGUuZ2V0UGx1Z2luc0ZvckFjdGlvbiA9IGZ1bmN0aW9uIChhY3Rpb24pIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fcGx1Z2luc1thY3Rpb25dICYmIHRoaXMuX3BsdWdpbnNbYWN0aW9uXS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3BsdWdpbnNbYWN0aW9uXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodGhpcy5fYW55UGx1Z2lucyAmJiB0aGlzLl9hbnlQbHVnaW5zLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fYW55UGx1Z2lucztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgUGx1Z2luQ29udGFpbmVyLnByb3RvdHlwZS5oYW5kbGVBY3Rpb24gPSBmdW5jdGlvbiAoYWN0aW9uLCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb0hhbmRsZUFjdGlvbih0aGlzLmdldFBsdWdpbnNGb3JBY3Rpb24oYWN0aW9uKSwgYWN0aW9uLCBhcmdzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hYm9ydCgpO1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBQbHVnaW5Db250YWluZXIucHJvdG90eXBlLmZpbmFsaXplQWN0aW9uID0gZnVuY3Rpb24gKGFjdGlvbiwgYWJvcnQsIHBsdWdpbnMsIG1lbWVudG9zLCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFhYm9ydCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobWVtZW50b3MgJiYgbWVtZW50b3MubGVuZ3RoICYmICFGbHVzcy5EaXNwYXRjaGVyLmdldERpc3BhdGNoZXIoKS51bmRvaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBGbHVzcy5EaXNwYXRjaGVyLmdldFVuZG9NYW5hZ2VyKCkuc3RvcmVNZW1lbnRvcyhtZW1lbnRvcywgYWN0aW9uLCBGbHVzcy5EaXNwYXRjaGVyLmNyZWF0ZVJlZG8oYWN0aW9uLCBhcmdzKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5fbWVtZW50b3NbYWN0aW9uXSA9IG51bGw7XG4gICAgICAgICAgICAgICAgdGhpcy5fcnVubmluZ1BsdWdpbnNbYWN0aW9uXSA9IG51bGw7XG4gICAgICAgICAgICAgICAgdGhpcy5fcHJvdG9jb2xzW2FjdGlvbl0gPSBudWxsO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFBsdWdpbkNvbnRhaW5lci5wcm90b3R5cGUucHJvdmlkZU1lbWVudG9zID0gZnVuY3Rpb24gKGFjdGlvbiwgcGx1Z2lucywgYXJncykge1xuICAgICAgICAgICAgICAgIGlmIChwbHVnaW5zKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZXQgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICBwbHVnaW5zLmZvckVhY2goZnVuY3Rpb24gKHBsdWdpbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1lbWVudG8gPSBwbHVnaW4uZ2V0TWVtZW50by5hcHBseShwbHVnaW4sIFt0aGF0LCBhY3Rpb25dLmNvbmNhdChhcmdzKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobWVtZW50bykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lbWVudG8uaW5zdGFuY2UgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3RvcmVGcm9tTWVtZW50bzogZnVuY3Rpb24gKG1lbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGx1Z2luLnJlc3RvcmVGcm9tTWVtZW50byh0aGF0LCBtZW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXQucHVzaChtZW1lbnRvKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXQubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBGbHVzcy5EaXNwYXRjaGVyLmdldFVuZG9NYW5hZ2VyKCkuc3RvcmVNZW1lbnRvcyhyZXQsIGFjdGlvbiwgRmx1c3MuRGlzcGF0Y2hlci5jcmVhdGVSZWRvKGFjdGlvbiwgYXJncykpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogVGhpcyB3cmFwcyB0aGUgaGFuZGxlciBhcm91bmQgdGhlIGV4aXN0aW5nIGhhbmRsZXJzIHRoZSBhY3Rpb24sIG1ha2luZyB0aGUgZ2l2ZW4gaGFuZGxlciB0aGUgZmlyc3QgdG8gYmUgY2FsbGVkXG4gICAgICAgICAgICAgKiBmb3IgdGhhdCBhY3Rpb24uXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogSWYgdGhlIEFOWS1BY3Rpb24gaXMgZ2l2ZW5cbiAgICAgICAgICAgICAqICAgKiBUaGUgaGFuZGxlciBpcyB3cmFwcGVkIGZvciBldmVyeSBhY3Rpb24gdGhlcmUgYWxyZWFkeSBpcyBhbm90aGVyIGhhbmRsZXJcbiAgICAgICAgICAgICAqICAgKiBUaGUgaGFuZGxlciBpcyB3cmFwcGVkIGFyb3VuZCBhbGwgb3RoZXIgYW55LWhhbmRsZXIsIGFuZCB0aGVzZSBhcmUgY2FsbGVkIGZvciBhbGwgYWN0aW9ucyB3aXRob3V0IHJlZ3VsYXIgaGFuZGxlcnNcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBJZiBhIHJlZ3VsYXIgYWN0aW9uIGlzIGdpdmVuIGFuZCBhbnktaGFuZGxlcnMgZXhpc3QgdGhlIGdpdmVuIGhhbmRsZXIgaXMgd3JhcHBlZCBhcm91bmQgYWxsIGFueS1oYW5kbGVycyBmb3IgdGhlXG4gICAgICAgICAgICAgKiBnaXZlbiBhY3Rpb24uXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIGFjdGlvblxuICAgICAgICAgICAgICogQHBhcmFtIGhhbmRsZXJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgUGx1Z2luQ29udGFpbmVyLnByb3RvdHlwZS53cmFwID0gZnVuY3Rpb24gKGFjdGlvbiwgaGFuZGxlcikge1xuICAgICAgICAgICAgICAgIGlmIChhY3Rpb24gPT09IC0xMDAwIC8qIF9fQU5ZX18gKi8pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX2FueVBsdWdpbnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgICAgICBGbHVzcy5EaXNwYXRjaGVyLnN1YnNjcmliZUFjdGlvbigtMTAwMCAvKiBfX0FOWV9fICovLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmdzW19pIC0gMF0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYWN0ID0gYXJncy5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGF0Ll9wbHVnaW5zW2FjdF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LmhhbmRsZUFjdGlvbihhY3QsIGFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKHR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYXJncyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIF9pID0gMTsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3NbX2kgLSAxXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsOyAvLyBXaGUgaGFuZGxlIHRoZSBtZW1lbnRvcyBvdXJzZWx2ZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhhdC5fcGx1Z2luc1t0eXBlXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoYXQucHJvdmlkZU1lbWVudG9zKHR5cGUsIGFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgYSBpbiB0aGlzLl9wbHVnaW5zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fcGx1Z2lucy5oYXNPd25Qcm9wZXJ0eShhKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZG9XcmFwKGEsIGhhbmRsZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2FueVBsdWdpbnMudW5zaGlmdChoYW5kbGVyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5fcGx1Z2luc1thY3Rpb25dICYmIHRoaXMuX2FueVBsdWdpbnMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbCA9IHRoaXMuX2FueVBsdWdpbnMubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGwtLSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZG9XcmFwKGFjdGlvbiwgdGhpcy5fYW55UGx1Z2luc1tsXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb1dyYXAoYWN0aW9uLCBoYW5kbGVyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgUGx1Z2luQ29udGFpbmVyLnByb3RvdHlwZS5kb1dyYXAgPSBmdW5jdGlvbiAoYWN0aW9uLCBoYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9wbHVnaW5zW2FjdGlvbl0pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcGx1Z2luc1thY3Rpb25dID0gW107XG4gICAgICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgRmx1c3MuRGlzcGF0Y2hlci5zdWJzY3JpYmVBY3Rpb24oYWN0aW9uLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYXJncyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmdzW19pIC0gMF0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5oYW5kbGVBY3Rpb24oYWN0aW9uLCBhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKHR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhcmdzID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBfaSA9IDE7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3NbX2kgLSAxXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDsgLy9yZXR1cm4gdGhhdC5wcm92aWRlTWVtZW50b3MoYWN0aW9uLCBhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9wbHVnaW5zW2FjdGlvbl0uaW5kZXhPZihoYW5kbGVyKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUGx1Z2luIGluc3RhbmNlcyBjYW4gb25seSBiZSB1c2VkIG9uY2UgcGVyIGFjdGlvbiFcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuX3BsdWdpbnNbYWN0aW9uXS51bnNoaWZ0KGhhbmRsZXIpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFBsdWdpbkNvbnRhaW5lci5wcm90b3R5cGUuZGV0YWNoID0gZnVuY3Rpb24gKGFjdGlvbiwgaGFuZGxlcikge1xuICAgICAgICAgICAgICAgIGlmIChhY3Rpb24gPT09IC0xMDAwIC8qIF9fQU5ZX18gKi8pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYW55UGx1Z2lucy5zcGxpY2UodGhpcy5fYW55UGx1Z2lucy5pbmRleE9mKGhhbmRsZXIpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgYSBpbiB0aGlzLl9wbHVnaW5zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fcGx1Z2lucy5oYXNPd25Qcm9wZXJ0eShhKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3BsdWdpbnNbYV0uc3BsaWNlKHRoaXMuX3BsdWdpbnNbYV0uaW5kZXhPZihoYW5kbGVyKSwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9wbHVnaW5zW2FjdGlvbl0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3BsdWdpbnNbYWN0aW9uXS5zcGxpY2UodGhpcy5fcGx1Z2luc1thY3Rpb25dLmluZGV4T2YoaGFuZGxlciksIDEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiBQbHVnaW5Db250YWluZXI7XG4gICAgICAgIH0pKEZsdXNzLkV2ZW50Q2hhbm5lbC5DaGFubmVsZWRFbWl0dGVyKTtcbiAgICAgICAgUGx1Z2lucy5QbHVnaW5Db250YWluZXIgPSBQbHVnaW5Db250YWluZXI7XG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZUNvbnRhaW5lcihzcGVjKSB7XG4gICAgICAgICAgICByZXR1cm4gRmx1c3MuVG9vbHMuc3ViY2xhc3Moc3BlYywgUGx1Z2luQ29udGFpbmVyKTtcbiAgICAgICAgfVxuICAgICAgICBQbHVnaW5zLmNyZWF0ZUNvbnRhaW5lciA9IGNyZWF0ZUNvbnRhaW5lcjtcbiAgICB9KShQbHVnaW5zID0gRmx1c3MuUGx1Z2lucyB8fCAoRmx1c3MuUGx1Z2lucyA9IHt9KSk7XG59KShGbHVzcyB8fCAoRmx1c3MgPSB7fSkpO1xuaWYgKHR5cGVvZiBleHBvcnRzICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgZXhwb3J0cy5QbHVnaW5zID0gRmx1c3MuUGx1Z2lucztcbn1cbmlmICh0eXBlb2YgdGhpc1tcImRlZmluZVwiXSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgdGhpc1tcImRlZmluZVwiXShbXSwgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gRmx1c3MuUGx1Z2lucztcbiAgICB9KTtcbn1cbiJdfQ==
