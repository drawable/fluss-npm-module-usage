(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Created by Stephan on 11.01.2015.
 */

"use strict";

var Store = require("fluss").Store;

var array = Store.array();

array.newItems.forEach(function(update) {
    document.write(update.value + " was added.<br>")
});

document.write("<h1>fluss - commonJS, browserify, Javascript</h1>");

array.push("One");
array.push(2);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQ29tbW9uSlNCcm93c2VyaWZ5X0pTXFxtYWluLmpzIiwibm9kZV9tb2R1bGVzXFxmbHVzc1xcaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcclxuICogQ3JlYXRlZCBieSBTdGVwaGFuIG9uIDExLjAxLjIwMTUuXHJcbiAqL1xyXG5cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgU3RvcmUgPSByZXF1aXJlKFwiZmx1c3NcIikuU3RvcmU7XHJcblxyXG52YXIgYXJyYXkgPSBTdG9yZS5hcnJheSgpO1xyXG5cclxuYXJyYXkubmV3SXRlbXMuZm9yRWFjaChmdW5jdGlvbih1cGRhdGUpIHtcclxuICAgIGRvY3VtZW50LndyaXRlKHVwZGF0ZS52YWx1ZSArIFwiIHdhcyBhZGRlZC48YnI+XCIpXHJcbn0pO1xyXG5cclxuZG9jdW1lbnQud3JpdGUoXCI8aDE+Zmx1c3MgLSBjb21tb25KUywgYnJvd3NlcmlmeSwgSmF2YXNjcmlwdDwvaDE+XCIpO1xyXG5cclxuYXJyYXkucHVzaChcIk9uZVwiKTtcclxuYXJyYXkucHVzaCgyKTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgU3RlcGhhbi5TbW9sYSBvbiAzMC4xMC4yMDE0LlxuICovXG5cInVzZSBzdHJpY3RcIjtcbnZhciBGbHVzcztcbihmdW5jdGlvbiAoRmx1c3MpIHtcbiAgICB2YXIgVG9vbHM7XG4gICAgKGZ1bmN0aW9uIChUb29scykge1xuICAgICAgICAvKipcbiAgICAgICAgICogRGV0ZXJtaW5lIHRoZSBzY3JlZW4gcG9zaXRpb24gYW5kIHNpemUgb2YgYW4gZWxlbWVudCBpbiB0aGUgRE9NXG4gICAgICAgICAqIEBwYXJhbSBlbGVtZW50XG4gICAgICAgICAqIEByZXR1cm5zIHt7eDogbnVtYmVyLCB5OiBudW1iZXIsIHc6IG51bWJlciwgaDogbnVtYmVyfX1cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIGVsZW1lbnRQb3NpdGlvbkFuZFNpemUoZWxlbWVudCkge1xuICAgICAgICAgICAgdmFyIHJlY3QgPSBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICAgICAgcmV0dXJuIHsgeDogcmVjdC5sZWZ0LCB5OiByZWN0LnRvcCwgdzogcmVjdC53aWR0aCwgaDogcmVjdC5oZWlnaHQgfTtcbiAgICAgICAgfVxuICAgICAgICBUb29scy5lbGVtZW50UG9zaXRpb25BbmRTaXplID0gZWxlbWVudFBvc2l0aW9uQW5kU2l6ZTtcbiAgICAgICAgdmFyIHBmeCA9IFtcbiAgICAgICAgICAgIHsgaWQ6IFwid2Via2l0XCIsIGNhbWVsQ2FzZTogdHJ1ZSB9LFxuICAgICAgICAgICAgeyBpZDogXCJNU1wiLCBjYW1lbENhc2U6IHRydWUgfSxcbiAgICAgICAgICAgIHsgaWQ6IFwib1wiLCBjYW1lbENhc2U6IHRydWUgfSxcbiAgICAgICAgICAgIHsgaWQ6IFwiXCIsIGNhbWVsQ2FzZTogZmFsc2UgfVxuICAgICAgICBdO1xuICAgICAgICAvKipcbiAgICAgICAgICogQWRkIGV2ZW50IGxpc3RlbmVyIGZvciBwcmVmaXhlZCBldmVudHMuIEFzIHRoZSBjYW1lbCBjYXNpbmcgb2YgdGhlIGV2ZW50IGxpc3RlbmVycyBpcyBkaWZmZXJlbnRcbiAgICAgICAgICogYWNyb3NzIGJyb3dzZXJzIHlvdSBuZWVkIHRvIHNwZWNpZnkgdGhlIHR5cGUgY2FtZWxjYXNlZCBzdGFydGluZyB3aXRoIGEgY2FwaXRhbCBsZXR0ZXIuIFRoZSBmdW5jdGlvblxuICAgICAgICAgKiB0aGVuIHRha2VzIGNhcmUgb2YgdGhlIGJyb3dzZXIgc3BlY2lmaWNzLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0gZWxlbWVudFxuICAgICAgICAgKiBAcGFyYW0gdHlwZVxuICAgICAgICAgKiBAcGFyYW0gY2FsbGJhY2tcbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIGFkZFByZWZpeGVkRXZlbnRMaXN0ZW5lcihlbGVtZW50LCB0eXBlLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgZm9yICh2YXIgcCA9IDA7IHAgPCBwZngubGVuZ3RoOyBwKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoIXBmeFtwXS5jYW1lbENhc2UpXG4gICAgICAgICAgICAgICAgICAgIHR5cGUgPSB0eXBlLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKHBmeFtwXS5pZCArIHR5cGUsIGNhbGxiYWNrLCBmYWxzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgVG9vbHMuYWRkUHJlZml4ZWRFdmVudExpc3RlbmVyID0gYWRkUHJlZml4ZWRFdmVudExpc3RlbmVyO1xuICAgICAgICAvKipcbiAgICAgICAgICogQ29udmVuaWVuY2UgbWV0aG9kIGZvciBjYWxsaW5nIGNhbGxiYWNrc1xuICAgICAgICAgKiBAcGFyYW0gY2IgICAgVGhlIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGNhbGxcbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIGNhbGxDYWxsYmFjayhjYikge1xuICAgICAgICAgICAgdmFyIGFueSA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAxOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgICAgICBhbnlbX2kgLSAxXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY2IpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIChjYikgPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhcmdzID0gW107XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmdzLnB1c2goYXJndW1lbnRzW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2IuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYWxsYmFjayBpcyBub3QgYSBmdW5jdGlvbiFcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFRvb2xzLmNhbGxDYWxsYmFjayA9IGNhbGxDYWxsYmFjaztcbiAgICAgICAgLyoqXG4gICAgICAgICAqIENoZWNrIGlmIHNvbWV0aGluZyBpcyBhbiBhcnJheS5cbiAgICAgICAgICogQHBhcmFtIHRoaW5nXG4gICAgICAgICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gaXNBcnJheSh0aGluZykge1xuICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh0aGluZykgPT09ICdbb2JqZWN0IEFycmF5XSc7XG4gICAgICAgIH1cbiAgICAgICAgVG9vbHMuaXNBcnJheSA9IGlzQXJyYXk7XG4gICAgICAgIHZhciBPSURfUFJPUCA9IFwiX19JRF9fXCI7XG4gICAgICAgIHZhciBvaWRzID0gMTAwMDA7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDcmVhdGUgYW5kIHJldHVybiBhIHVuaXF1ZSBpZCBvbiBhIEphdmFTY3JpcHQgb2JqZWN0LiBUaGlzIGFkZHMgYSBuZXcgcHJvcGVydHlcbiAgICAgICAgICogX19JRF9fIHRvIHRoYXQgb2JqZWN0LiBJZHMgYXJlIG51bWJlcnMuXG4gICAgICAgICAqXG4gICAgICAgICAqIFRoZSBJRCBpcyBjcmVhdGVkIHRoZSBmaXJzdCB0aW1lIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGZvciB0aGF0IG9iamVjdCBhbmQgdGhlblxuICAgICAgICAgKiB3aWxsIHNpbXBseSBiZSByZXR1cm5lZCBvbiBhbGwgc3Vic2VxdWVudCBjYWxscy5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIG9ialxuICAgICAgICAgKiBAcmV0dXJucyB7YW55fVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gb2lkKG9iaikge1xuICAgICAgICAgICAgaWYgKG9iaikge1xuICAgICAgICAgICAgICAgIGlmICghb2JqLmhhc093blByb3BlcnR5KE9JRF9QUk9QKSkge1xuICAgICAgICAgICAgICAgICAgICBvYmpbT0lEX1BST1BdID0gb2lkcysrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gb2JqW09JRF9QUk9QXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBUb29scy5vaWQgPSBvaWQ7XG4gICAgICAgIGZ1bmN0aW9uIGFwcGx5TWl4aW5zKGRlcml2ZWRDdG9yLCBiYXNlQ3RvcnMpIHtcbiAgICAgICAgICAgIGJhc2VDdG9ycy5mb3JFYWNoKGZ1bmN0aW9uIChiYXNlQ3Rvcikge1xuICAgICAgICAgICAgICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGJhc2VDdG9yKS5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlcml2ZWRDdG9yLnByb3RvdHlwZVtuYW1lXSA9IGJhc2VDdG9yW25hbWVdO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFVzZSB0aGlzIHRvIHN1YmNsYXNzIGEgdHlwZXNjcmlwdCBjbGFzcyB1c2luZyBwbGFpbiBKYXZhU2NyaXB0LiBTcGVjIGlzIGFuIG9iamVjdFxuICAgICAgICAgKiBjb250YWluaW5nIHByb3BlcnRpZXMgYW5kIG1ldGhvZHMgb2YgdGhlIG5ldyBjbGFzcy4gTWV0aG9kcyBpbiBzcGVjIHdpbGwgb3ZlcnJpZGVcbiAgICAgICAgICogbWV0aG9kcyBpbiBiYXNlQ2xhc3MuXG4gICAgICAgICAqXG4gICAgICAgICAqIFlvdSB3aWxsIE5PVCBiZSBhYmxlIHRvIG1ha2Ugc3VwZXIgY2FsbHMgaW4gdGhlIHN1YmNsYXNzLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0gc3BlY1xuICAgICAgICAgKiBAcGFyYW0gYmFzZUNsYXNzXG4gICAgICAgICAqIEByZXR1cm5zIHthbnl9XG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBzdWJjbGFzcyhzcGVjLCBiYXNlQ2xhc3MpIHtcbiAgICAgICAgICAgIHZhciBjb25zdHJ1Y3RvcjtcbiAgICAgICAgICAgIGlmIChzcGVjLmhhc093blByb3BlcnR5KFwiY29uc3RydWN0b3JcIikpIHtcbiAgICAgICAgICAgICAgICBjb25zdHJ1Y3RvciA9IHNwZWNbXCJjb25zdHJ1Y3RvclwiXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0cnVjdG9yID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBiYXNlQ2xhc3MucHJvdG90eXBlLmNvbnN0cnVjdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0cnVjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoYmFzZUNsYXNzLnByb3RvdHlwZSk7XG4gICAgICAgICAgICBhcHBseU1peGlucyhjb25zdHJ1Y3RvciwgW3NwZWNdKTtcbiAgICAgICAgICAgIHJldHVybiBjb25zdHJ1Y3RvcjtcbiAgICAgICAgfVxuICAgICAgICBUb29scy5zdWJjbGFzcyA9IHN1YmNsYXNzO1xuICAgIH0pKFRvb2xzID0gRmx1c3MuVG9vbHMgfHwgKEZsdXNzLlRvb2xzID0ge30pKTtcbn0pKEZsdXNzIHx8IChGbHVzcyA9IHt9KSk7XG5pZiAodHlwZW9mIGV4cG9ydHMgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBleHBvcnRzLlRvb2xzID0gRmx1c3MuVG9vbHM7XG59XG5pZiAodHlwZW9mIHRoaXNbXCJkZWZpbmVcIl0gPT09IFwiZnVuY3Rpb25cIikge1xuICAgIHRoaXNbXCJkZWZpbmVcIl0oW10sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIEZsdXNzLlRvb2xzO1xuICAgIH0pO1xufVxuXG4vKipcbiAqIENyZWF0ZWQgYnkgU3RlcGhhbi5TbW9sYSBvbiAyOC4xMC4yMDE0LlxuICovXG5cInVzZSBzdHJpY3RcIjtcbnZhciBGbHVzcztcbihmdW5jdGlvbiAoRmx1c3MpIHtcbiAgICB2YXIgRW1pdHRlcjtcbiAgICAoZnVuY3Rpb24gKF9FbWl0dGVyKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBbiBldmVudC1lbWl0dGVyXG4gICAgICAgICAqL1xuICAgICAgICB2YXIgRW1pdHRlciA9IChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBmdW5jdGlvbiBFbWl0dGVyKCkge1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgRW1pdHRlci5wcm90b3R5cGUuc3Vic2NyaWJlID0gZnVuY3Rpb24gKGV2ZW50LCBoYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9ldmVudEhhbmRsZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50SGFuZGxlcnMgPSB7fTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9ldmVudEhhbmRsZXJzW2V2ZW50XSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudEhhbmRsZXJzW2V2ZW50XSA9IFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLl9ldmVudEhhbmRsZXJzW2V2ZW50XS5wdXNoKGhhbmRsZXIpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIEVtaXR0ZXIucHJvdG90eXBlLnVuc3Vic2NyaWJlID0gZnVuY3Rpb24gKGV2ZW50LCBoYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9ldmVudEhhbmRsZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2V2ZW50SGFuZGxlcnNbZXZlbnRdKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50SGFuZGxlcnNbZXZlbnRdLnNwbGljZSh0aGlzLl9ldmVudEhhbmRsZXJzW2V2ZW50XS5pbmRleE9mKGhhbmRsZXIpLCAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEVtaXR0ZXIucHJvdG90eXBlLCBcImV2ZW50SGFuZGxlcnNcIiwge1xuICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fZXZlbnRIYW5kbGVycztcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICB2YXIgYXJncyA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIF9pID0gMTsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGFyZ3NbX2kgLSAxXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fZXZlbnRIYW5kbGVycyAmJiB0aGlzLl9ldmVudEhhbmRsZXJzW2V2ZW50XSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudEhhbmRsZXJzW2V2ZW50XS5mb3JFYWNoKGZ1bmN0aW9uIChoYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVyLmFwcGx5KHRoYXQsIGFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgRW1pdHRlci5wcm90b3R5cGUucmVsYXkgPSBmdW5jdGlvbiAoZW1pdHRlciwgc3Vic2NyaWJpbmdFdmVudCwgZW1pdHRpbmdFdmVudCkge1xuICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICAgICBlbWl0dGVyLnN1YnNjcmliZShzdWJzY3JpYmluZ0V2ZW50LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhcmdzID0gW107XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmdzW19pIC0gMF0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoYXQuZW1pdC5hcHBseSh0aGF0LCBbZW1pdHRpbmdFdmVudF0uY29uY2F0KGFyZ3MpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gRW1pdHRlcjtcbiAgICAgICAgfSkoKTtcbiAgICAgICAgX0VtaXR0ZXIuRW1pdHRlciA9IEVtaXR0ZXI7XG4gICAgfSkoRW1pdHRlciA9IEZsdXNzLkVtaXR0ZXIgfHwgKEZsdXNzLkVtaXR0ZXIgPSB7fSkpO1xufSkoRmx1c3MgfHwgKEZsdXNzID0ge30pKTtcbmlmICh0eXBlb2YgZXhwb3J0cyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgIGV4cG9ydHMuRW1pdHRlciA9IEZsdXNzLkVtaXR0ZXI7XG59XG5pZiAodHlwZW9mIHRoaXNbXCJkZWZpbmVcIl0gPT09IFwiZnVuY3Rpb25cIikge1xuICAgIHRoaXNbXCJkZWZpbmVcIl0oW10sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIEZsdXNzLkVtaXR0ZXI7XG4gICAgfSk7XG59XG5cbi8qKlxuICogQ3JlYXRlZCBieSBTdGVwaGFuIG9uIDI3LjEyLjIwMTQuXG4gKlxuICogQSBzaW1wbGUgaW1wbGVtZW50YXRpb24gb2YgYSBjb2xsZWN0aW9uIHN0cmVhbSB0aGF0IHN1cHBvcnRzIHJlYWN0aXZlIHBhdHRlcm5zLlxuICpcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgRmx1c3M7XG4oZnVuY3Rpb24gKEZsdXNzKSB7XG4gICAgdmFyIFN0cmVhbTtcbiAgICAoZnVuY3Rpb24gKF9TdHJlYW0pIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEJhc2UgaW1wbGVtZW50YXRpb24gb2YgdGhlIGNvbGxlY3Rpb24gc3RyZWFtXG4gICAgICAgICAqL1xuICAgICAgICB2YXIgU3RyZWFtID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGZ1bmN0aW9uIFN0cmVhbShfbmFtZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX25hbWUgPSBfbmFtZTtcbiAgICAgICAgICAgICAgICB0aGlzLl9idWZmZXIgPSBbXTtcbiAgICAgICAgICAgICAgICB0aGlzLl9tZXRob2RzID0gW107XG4gICAgICAgICAgICAgICAgdGhpcy5fZXJyb3JNZXRob2RzID0gW107XG4gICAgICAgICAgICAgICAgdGhpcy5fY2xvc2VNZXRob2RzID0gW107XG4gICAgICAgICAgICAgICAgdGhpcy5fY2xvc2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdGhpcy5fbGVuZ3RoID0gMDtcbiAgICAgICAgICAgICAgICB0aGlzLl9tYXhMZW5ndGggPSAwO1xuICAgICAgICAgICAgICAgIHRoaXMuX25leHRTdHJlYW1zID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU3RyZWFtLnByb3RvdHlwZSwgXCJuYW1lXCIsIHtcbiAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX25hbWU7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU3RyZWFtLnByb3RvdHlwZSwgXCJsZW5ndGhcIiwge1xuICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fbGVuZ3RoO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgU3RyZWFtLnByb3RvdHlwZS5jYWxsQ2xvc2VNZXRob2RzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICAgICB0aGlzLl9jbG9zZU1ldGhvZHMuZm9yRWFjaChmdW5jdGlvbiAobSkge1xuICAgICAgICAgICAgICAgICAgICBtLmNhbGwodGhhdCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgU3RyZWFtLnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX2Nsb3NlZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jbG9zZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbGxDbG9zZU1ldGhvZHMoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFN0cmVhbS5wcm90b3R5cGUuZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fbWV0aG9kcyA9IFtdO1xuICAgICAgICAgICAgICAgIHRoaXMuX2J1ZmZlciA9IFtdO1xuICAgICAgICAgICAgICAgIHRoaXMuX2Nsb3NlTWV0aG9kcyA9IFtdO1xuICAgICAgICAgICAgICAgIHRoaXMuX2Vycm9yTWV0aG9kcyA9IFtdO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFN0cmVhbS5wcm90b3R5cGUudGltZXMgPSBmdW5jdGlvbiAobWF4TGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fbWF4TGVuZ3RoID0gbWF4TGVuZ3RoO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFN0cmVhbS5wcm90b3R5cGUudW50aWwgPSBmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgICAgIGlmIChzdHJlYW0pIHtcbiAgICAgICAgICAgICAgICAgICAgc3RyZWFtLmZvckVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5jbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFN0cmVhbS5wcm90b3R5cGUsIFwiY2xvc2VkXCIsIHtcbiAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2Nsb3NlZDtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFN0cmVhbS5wcm90b3R5cGUuYWRkVG9CdWZmZXIgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9idWZmZXIudW5zaGlmdCh2YWx1ZSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgU3RyZWFtLnByb3RvdHlwZS5wcm9jZXNzQnVmZmVyID0gZnVuY3Rpb24gKGJ1ZmZlciwgbWV0aG9kcywgYmFzZUluZGV4KSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2Nsb3NlZClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgaWYgKCFtZXRob2RzLmxlbmd0aClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgdmFyIGwgPSBidWZmZXIubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICAgICB2YXIgZXJyb3JzID0gW107XG4gICAgICAgICAgICAgICAgd2hpbGUgKGwtLSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBidWZmZXIucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZHMuZm9yRWFjaChmdW5jdGlvbiAobSwgaSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtLmNhbGwodGhhdCwgdmFsdWUsIGkgKyBiYXNlSW5kZXgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcnMucHVzaChlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBlcnJvcnM7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgU3RyZWFtLnByb3RvdHlwZS5wcm9jZXNzQnVmZmVycyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgZXJyb3JzID0gdGhpcy5wcm9jZXNzQnVmZmVyKHRoaXMuX2J1ZmZlciwgdGhpcy5fbWV0aG9kcywgdGhpcy5fbGVuZ3RoIC0gdGhpcy5fYnVmZmVyLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgaWYgKGVycm9ycyAmJiBlcnJvcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9lcnJvck1ldGhvZHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2Nlc3NCdWZmZXIoZXJyb3JzLCB0aGlzLl9lcnJvck1ldGhvZHMsIDApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JzLmZvckVhY2goZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgU3RyZWFtLnByb3RvdHlwZS5hZGRNZXRob2QgPSBmdW5jdGlvbiAobWV0aG9kKSB7XG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0TWV0aG9kID0gdGhpcy5fbWV0aG9kcy5sZW5ndGggPT09IDA7XG4gICAgICAgICAgICAgICAgdGhpcy5fbWV0aG9kcy5wdXNoKG1ldGhvZCk7XG4gICAgICAgICAgICAgICAgaWYgKGZpcnN0TWV0aG9kKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvY2Vzc0J1ZmZlcnMoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgU3RyZWFtLnByb3RvdHlwZS5yZW1vdmVNZXRob2QgPSBmdW5jdGlvbiAobWV0aG9kKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fbWV0aG9kcy5pbmRleE9mKG1ldGhvZCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgU3RyZWFtLnByb3RvdHlwZS5hZGRFcnJvck1ldGhvZCA9IGZ1bmN0aW9uIChtZXRob2QpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9lcnJvck1ldGhvZHMucHVzaChtZXRob2QpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFN0cmVhbS5wcm90b3R5cGUuYWRkQ2xvc2VNZXRob2QgPSBmdW5jdGlvbiAobWV0aG9kKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY2xvc2VkKSB7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZC5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2xvc2VNZXRob2RzLnB1c2gobWV0aG9kKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgU3RyZWFtLnByb3RvdHlwZS5wdXNoID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9jbG9zZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRUb0J1ZmZlcih2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2xlbmd0aCsrO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2Nlc3NCdWZmZXJzKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9sZW5ndGggPT09IHRoaXMuX21heExlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFN0cmVhbS5wcm90b3R5cGUucHVzaEVycm9yID0gZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgLy8gSWYgd2UgY2FuJ3QgaGFuZGxlIHRoZSBlcnJvciBvdXJzZWx2ZXMgd2UgdGhyb3cgaXQgYWdhaW4uIFRoYXQgd2lsbCBnaXZlIHByZWNlZGluZyBzdHJlYW1zIHRoZSBjaGFuY2UgdG8gaGFuZGxlIHRoZXNlXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9lcnJvck1ldGhvZHMgfHwgIXRoaXMuX2Vycm9yTWV0aG9kcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMucHJvY2Vzc0J1ZmZlcihbZXJyb3JdLCB0aGlzLl9lcnJvck1ldGhvZHMsIDApO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFN0cmVhbS5wcm90b3R5cGUuZm9yRWFjaCA9IGZ1bmN0aW9uIChtZXRob2QpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZE1ldGhvZChtZXRob2QpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFN0cmVhbS5wcm90b3R5cGUucmVnaXN0ZXJOZXh0U3RyZWFtID0gZnVuY3Rpb24gKG5leHRTdHJlYW0pIHtcbiAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgdGhpcy5fbmV4dFN0cmVhbXMucHVzaChuZXh0U3RyZWFtKTtcbiAgICAgICAgICAgICAgICBuZXh0U3RyZWFtLm9uQ2xvc2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaSA9IHRoYXQuX25leHRTdHJlYW1zLmluZGV4T2YobmV4dFN0cmVhbSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5fbmV4dFN0cmVhbXMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGF0Ll9uZXh0U3RyZWFtcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBTdHJlYW0ucHJvdG90eXBlLmFkZE1ldGhvZFRvTmV4dFN0cmVhbSA9IGZ1bmN0aW9uIChuZXh0U3RyZWFtLCBtZXRob2QsIG9uQ2xvc2UpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgdmFyIGZuID0gZnVuY3Rpb24gKHZhbHVlLCBpbmRleCkge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kLmNhbGwodGhhdCwgdmFsdWUsIGluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5wdXNoRXJyb3IoZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkTWV0aG9kKGZuKTtcbiAgICAgICAgICAgICAgICBuZXh0U3RyZWFtLm9uQ2xvc2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB0aGF0LnJlbW92ZU1ldGhvZChmbik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZWdpc3Rlck5leHRTdHJlYW0obmV4dFN0cmVhbSk7XG4gICAgICAgICAgICAgICAgaWYgKCFvbkNsb3NlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25DbG9zZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0U3RyZWFtLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbkNsb3NlKG9uQ2xvc2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBTdHJlYW0ucHJvdG90eXBlLmZpbHRlciA9IGZ1bmN0aW9uIChtZXRob2QpIHtcbiAgICAgICAgICAgICAgICB2YXIgbmV4dFN0cmVhbSA9IG5ldyBTdHJlYW0odGhpcy5fbmFtZSArIFwiLmZpbHRlclwiKTtcbiAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBtZXRob2QgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZE1ldGhvZFRvTmV4dFN0cmVhbShuZXh0U3RyZWFtLCBmdW5jdGlvbiAodmFsdWUsIGluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobWV0aG9kLmNhbGwodGhhdCwgdmFsdWUsIGluZGV4KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5leHRTdHJlYW0ucHVzaCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRNZXRob2RUb05leHRTdHJlYW0obmV4dFN0cmVhbSwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobWV0aG9kID09IHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5wdXNoKHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9jbG9zZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5jbG9zZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbmV4dFN0cmVhbTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBTdHJlYW0ucHJvdG90eXBlLm1hcCA9IGZ1bmN0aW9uIChtZXRob2QpIHtcbiAgICAgICAgICAgICAgICB2YXIgbmV4dFN0cmVhbSA9IG5ldyBTdHJlYW0odGhpcy5fbmFtZSArIFwiLm1hcFwiKTtcbiAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBtZXRob2QgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZE1ldGhvZFRvTmV4dFN0cmVhbShuZXh0U3RyZWFtLCBmdW5jdGlvbiAodmFsdWUsIGluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0U3RyZWFtLnB1c2gobWV0aG9kLmNhbGwodGhhdCwgdmFsdWUsIGluZGV4KSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRNZXRob2RUb05leHRTdHJlYW0obmV4dFN0cmVhbSwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0U3RyZWFtLnB1c2gobWV0aG9kKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9jbG9zZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5jbG9zZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbmV4dFN0cmVhbTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBTdHJlYW0ucHJvdG90eXBlLnNjYW4gPSBmdW5jdGlvbiAobWV0aG9kLCBzZWVkKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5leHRTdHJlYW0gPSBuZXcgU3RyZWFtKHRoaXMuX25hbWUgKyBcIi5zY2FuXCIpO1xuICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICAgICB2YXIgc2Nhbm5lZCA9IHNlZWQ7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRNZXRob2RUb05leHRTdHJlYW0obmV4dFN0cmVhbSwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjYW5uZWQgPSBtZXRob2QuY2FsbCh0aGF0LCBzY2FubmVkLCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIG5leHRTdHJlYW0ucHVzaChzY2FubmVkKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBuZXh0U3RyZWFtLnB1c2goc2Nhbm5lZCk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2Nsb3NlZCkge1xuICAgICAgICAgICAgICAgICAgICBuZXh0U3RyZWFtLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBuZXh0U3RyZWFtO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFN0cmVhbS5wcm90b3R5cGUucmVkdWNlID0gZnVuY3Rpb24gKG1ldGhvZCwgc2VlZCkge1xuICAgICAgICAgICAgICAgIHZhciBuZXh0U3RyZWFtID0gbmV3IFN0cmVhbSh0aGlzLl9uYW1lICsgXCIucmVkdWNlXCIpO1xuICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICAgICB2YXIgcmVkdWNlZCA9IHNlZWQ7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRNZXRob2RUb05leHRTdHJlYW0obmV4dFN0cmVhbSwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlZHVjZWQgPSBtZXRob2QuY2FsbCh0aGF0LCByZWR1Y2VkLCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBuZXh0U3RyZWFtLnB1c2gocmVkdWNlZCk7XG4gICAgICAgICAgICAgICAgICAgIG5leHRTdHJlYW0uY2xvc2UoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fY2xvc2VkKSB7XG4gICAgICAgICAgICAgICAgICAgIG5leHRTdHJlYW0uY2xvc2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5yZWdpc3Rlck5leHRTdHJlYW0obmV4dFN0cmVhbSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5leHRTdHJlYW07XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgU3RyZWFtLnByb3RvdHlwZS5jb25jYXQgPSBmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5leHRTdHJlYW0gPSBuZXcgU3RyZWFtKHRoaXMuX25hbWUgKyBcIi5jb25jYXRcIik7XG4gICAgICAgICAgICAgICAgdmFyIGJ1ZmZlciA9IG51bGw7XG4gICAgICAgICAgICAgICAgLy8gV2hlbiB0aGlzIGlzIGFscmVhZHkgY2xvc2VkLCB3ZSBvbmx5IGNhcmUgZm9yIHRoZSBvdGhlciBzdHJlYW1cbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX2Nsb3NlZCkge1xuICAgICAgICAgICAgICAgICAgICBidWZmZXIgPSBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdHJlYW0uY2xvc2VkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0U3RyZWFtLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gV2UgbmVlZCB0byBidWZmZXIsIGJlY2F1c2UgdGhpcyBtYXkgbm90IGJlIHRoZSBmaXJzdFxuICAgICAgICAgICAgICAgIC8vIG1ldGhvZCBhdHRhY2hlZCB0byB0aGUgc3RyZWFtLiBPdGhlcndpc2UgYW55IGRhdGEgdGhhdFxuICAgICAgICAgICAgICAgIC8vIGlzIHB1c2hlZCB0byBzdHJlYW0gYmVmb3JlIHRoZSBvcmlnaW5hbCBpcyBjbG9zZWQgd291bGRcbiAgICAgICAgICAgICAgICAvLyBiZSBsb3N0IGZvciB0aGUgY29uY2F0LlxuICAgICAgICAgICAgICAgIHN0cmVhbS5mb3JFYWNoKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYnVmZmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBidWZmZXIucHVzaCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0U3RyZWFtLnB1c2godmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgc3RyZWFtLm9uQ2xvc2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWJ1ZmZlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5jbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRNZXRob2RUb05leHRTdHJlYW0obmV4dFN0cmVhbSwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIG5leHRTdHJlYW0ucHVzaCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYnVmZmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBidWZmZXIuZm9yRWFjaChmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXh0U3RyZWFtLnB1c2godmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0cmVhbS5jbG9zZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5leHRTdHJlYW0uY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBidWZmZXIgPSBudWxsO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9jbG9zZWQgJiYgc3RyZWFtLmNsb3NlZCkge1xuICAgICAgICAgICAgICAgICAgICBuZXh0U3RyZWFtLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBuZXh0U3RyZWFtO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFN0cmVhbS5wcm90b3R5cGUuY29uY2F0QWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBuZXh0U3RyZWFtID0gbmV3IFN0cmVhbSh0aGlzLl9uYW1lICsgXCIuY29uY2F0QWxsXCIpO1xuICAgICAgICAgICAgICAgIHZhciBxdWV1ZSA9IFtdO1xuICAgICAgICAgICAgICAgIHZhciBjdXJzb3IgPSBudWxsO1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIG5leHRJblF1ZXVlKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbCA9IHF1ZXVlLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGwtLSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yID0gcXVldWVbbF07XG4gICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdXJzb3IuZG9uZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXVlLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gdXBkYXRlKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY3Vyc29yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbCA9IGN1cnNvci5kYXRhLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChsLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXh0U3RyZWFtLnB1c2goY3Vyc29yLmRhdGEucG9wKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGNvbmNhdFN0cmVhbShzdHJlYW0pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN1YkJ1ZmZlciA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgZG9uZTogZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgcXVldWUudW5zaGlmdChzdWJCdWZmZXIpO1xuICAgICAgICAgICAgICAgICAgICBzdHJlYW0uZm9yRWFjaChmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1YkJ1ZmZlci5kYXRhLnVuc2hpZnQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlKCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBzdHJlYW0ub25DbG9zZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJCdWZmZXIuZG9uZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0SW5RdWV1ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yID0gc3ViQnVmZmVyO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbiAoc3ViU3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbmNhdFN0cmVhbShzdWJTdHJlYW0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMub25DbG9zZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIG5leHRTdHJlYW0uY2xvc2UoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fY2xvc2VkKSB7XG4gICAgICAgICAgICAgICAgICAgIG5leHRTdHJlYW0uY2xvc2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5yZWdpc3Rlck5leHRTdHJlYW0obmV4dFN0cmVhbSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5leHRTdHJlYW07XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgU3RyZWFtLnByb3RvdHlwZS5jb21iaW5lID0gZnVuY3Rpb24gKHN0cmVhbSkge1xuICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICAgICB2YXIgbmV4dFN0cmVhbSA9IG5ldyBTdHJlYW0odGhpcy5fbmFtZSArIFwiLmNvbWJpbmVcIik7XG4gICAgICAgICAgICAgICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBuZXh0U3RyZWFtLnB1c2godmFsdWUpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHN0cmVhbS5mb3JFYWNoKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBuZXh0U3RyZWFtLnB1c2godmFsdWUpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMub25DbG9zZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdHJlYW0uY2xvc2VkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0U3RyZWFtLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBzdHJlYW0ub25DbG9zZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGF0Ll9jbG9zZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5leHRTdHJlYW0uY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9jbG9zZWQgJiYgc3RyZWFtLmNsb3NlZCkge1xuICAgICAgICAgICAgICAgICAgICBuZXh0U3RyZWFtLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMucmVnaXN0ZXJOZXh0U3RyZWFtKG5leHRTdHJlYW0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXh0U3RyZWFtO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFN0cmVhbS5wcm90b3R5cGUub25DbG9zZSA9IGZ1bmN0aW9uIChtZXRob2QpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZENsb3NlTWV0aG9kKG1ldGhvZCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgU3RyZWFtLnByb3RvdHlwZS5vbkVycm9yID0gZnVuY3Rpb24gKG1ldGhvZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkRXJyb3JNZXRob2QobWV0aG9kKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gU3RyZWFtO1xuICAgICAgICB9KSgpO1xuICAgICAgICBfU3RyZWFtLlN0cmVhbSA9IFN0cmVhbTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIENyZWF0ZSBhIG5ldyBzdHJlYW0uIFRoZSBuYW1lIGlzIG1vc3RseSBmb3IgZGVidWdnaW5nIHB1cnBvc2VzIGFuZCBjYW4gYmUgb21pdHRlZC4gSXQgZGVmYXVsdHMgdG8gJ3N0cmVhbScgdGhlbi5cbiAgICAgICAgICogQHBhcmFtIG5hbWVcbiAgICAgICAgICogQHJldHVybnMge1N0cmVhbX1cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZVN0cmVhbShuYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFN0cmVhbShuYW1lIHx8IFwic3RyZWFtXCIpO1xuICAgICAgICB9XG4gICAgICAgIF9TdHJlYW0uY3JlYXRlU3RyZWFtID0gY3JlYXRlU3RyZWFtO1xuICAgIH0pKFN0cmVhbSA9IEZsdXNzLlN0cmVhbSB8fCAoRmx1c3MuU3RyZWFtID0ge30pKTtcbn0pKEZsdXNzIHx8IChGbHVzcyA9IHt9KSk7XG5pZiAodHlwZW9mIGV4cG9ydHMgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBleHBvcnRzLlN0cmVhbSA9IEZsdXNzLlN0cmVhbTtcbn1cbmlmICh0eXBlb2YgdGhpc1tcImRlZmluZVwiXSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgdGhpc1tcImRlZmluZVwiXShbXSwgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gRmx1c3MuU3RyZWFtO1xuICAgIH0pO1xufVxuXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi90b29scy50c1wiIC8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9zdHJlYW0udHNcIiAvPlxuLyoqXG4gKiBDcmVhdGVkIGJ5IFN0ZXBoYW4gb24gMjkuMTIuMjAxNC5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19leHRlbmRzID0gdGhpcy5fX2V4dGVuZHMgfHwgZnVuY3Rpb24gKGQsIGIpIHtcbiAgICBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTtcbiAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICBfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZTtcbiAgICBkLnByb3RvdHlwZSA9IG5ldyBfXygpO1xufTtcbnZhciBGbHVzcztcbihmdW5jdGlvbiAoRmx1c3MpIHtcbiAgICB2YXIgU3RvcmU7XG4gICAgKGZ1bmN0aW9uIChfU3RvcmUpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRlc3QgaWYgc29tZXRoaW5nIGlzIGEgc3RvcmUuXG4gICAgICAgICAqIEBwYXJhbSB0aGluZ1xuICAgICAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIGlzU3RvcmUodGhpbmcpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGluZyBpbnN0YW5jZW9mIFJlY29yZFN0b3JlIHx8IHRoaW5nIGluc3RhbmNlb2YgQXJyYXlTdG9yZSB8fCB0aGluZyBpbnN0YW5jZW9mIEltbXV0YWJsZVJlY29yZCB8fCB0aGluZyBpbnN0YW5jZW9mIEltbXV0YWJsZUFycmF5O1xuICAgICAgICB9XG4gICAgICAgIF9TdG9yZS5pc1N0b3JlID0gaXNTdG9yZTtcbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlVXBkYXRlSW5mbyhpdGVtLCB2YWx1ZSwgc3RvcmUsIHBhdGgsIHJvb3RJdGVtKSB7XG4gICAgICAgICAgICB2YXIgciA9IHtcbiAgICAgICAgICAgICAgICBpdGVtOiBpdGVtLFxuICAgICAgICAgICAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgICAgICAgICAgICBzdG9yZTogc3RvcmVcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAocGF0aCkge1xuICAgICAgICAgICAgICAgIHJbXCJwYXRoXCJdID0gcGF0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChyb290SXRlbSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcltcInJvb3RJdGVtXCJdID0gcm9vdEl0ZW07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByW1wicm9vdEl0ZW1cIl0gPSBpdGVtO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHI7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIFN0b3JlID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGZ1bmN0aW9uIFN0b3JlKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2FkZEl0ZW1zU3RyZWFtcyA9IFtdO1xuICAgICAgICAgICAgICAgIHRoaXMuX3JlbW92ZUl0ZW1zU3RyZWFtcyA9IFtdO1xuICAgICAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVN0cmVhbXMgPSBbXTtcbiAgICAgICAgICAgICAgICB0aGlzLl9kaXNwb3NpbmdTdHJlYW1zID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU3RvcmUucHJvdG90eXBlLCBcImlzSW1tdXRhYmxlXCIsIHtcbiAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgU3RvcmUucHJvdG90eXBlLnJlbW92ZVN0cmVhbSA9IGZ1bmN0aW9uIChsaXN0LCBzdHJlYW0pIHtcbiAgICAgICAgICAgICAgICB2YXIgaSA9IGxpc3QuaW5kZXhPZihzdHJlYW0pO1xuICAgICAgICAgICAgICAgIGlmIChpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBsaXN0LnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFN0b3JlLnByb3RvdHlwZSwgXCJuZXdJdGVtc1wiLCB7XG4gICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgdmFyIHMgPSBGbHVzcy5TdHJlYW0uY3JlYXRlU3RyZWFtKFwiYWRkUHJvcGVydHlcIik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2FkZEl0ZW1zU3RyZWFtcy5wdXNoKHMpO1xuICAgICAgICAgICAgICAgICAgICBzLm9uQ2xvc2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5yZW1vdmVTdHJlYW0odGhhdC5fYWRkSXRlbXNTdHJlYW1zLCBzKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFN0b3JlLnByb3RvdHlwZSwgXCJyZW1vdmVkSXRlbXNcIiwge1xuICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzID0gRmx1c3MuU3RyZWFtLmNyZWF0ZVN0cmVhbShcInJlbW92ZVByb3BlcnR5XCIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZW1vdmVJdGVtc1N0cmVhbXMucHVzaChzKTtcbiAgICAgICAgICAgICAgICAgICAgcy5vbkNsb3NlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQucmVtb3ZlU3RyZWFtKHRoYXQuX3JlbW92ZUl0ZW1zU3RyZWFtcywgcyk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBzLnVudGlsKHRoaXMuaXNEaXNwb3NpbmcpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcztcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTdG9yZS5wcm90b3R5cGUsIFwidXBkYXRlc1wiLCB7XG4gICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgdmFyIHMgPSBGbHVzcy5TdHJlYW0uY3JlYXRlU3RyZWFtKFwidXBkYXRlUHJvcGVydHlcIik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVN0cmVhbXMucHVzaChzKTtcbiAgICAgICAgICAgICAgICAgICAgcy5vbkNsb3NlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQucmVtb3ZlU3RyZWFtKHRoYXQuX3VwZGF0ZVN0cmVhbXMsIHMpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHM7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU3RvcmUucHJvdG90eXBlLCBcImFsbENoYW5nZXNcIiwge1xuICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy51cGRhdGVzLmNvbWJpbmUodGhpcy5uZXdJdGVtcykuY29tYmluZSh0aGlzLnJlbW92ZWRJdGVtcyk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU3RvcmUucHJvdG90eXBlLCBcImlzRGlzcG9zaW5nXCIsIHtcbiAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcyA9IEZsdXNzLlN0cmVhbS5jcmVhdGVTdHJlYW0oXCJkaXNwb3NpbmdcIik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2Rpc3Bvc2luZ1N0cmVhbXMucHVzaChzKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHM7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBTdG9yZS5wcm90b3R5cGUuZGlzcG9zZVN0cmVhbXMgPSBmdW5jdGlvbiAoc3RyZWFtTGlzdCkge1xuICAgICAgICAgICAgICAgIHN0cmVhbUxpc3QuZm9yRWFjaChmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbS5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgc3RyZWFtTGlzdCA9IFtdO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFN0b3JlLnByb3RvdHlwZS5kaXNwb3NlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2Rpc3Bvc2luZ1N0cmVhbXMuZm9yRWFjaChmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbS5wdXNoKHRydWUpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zZVN0cmVhbXModGhpcy5fcmVtb3ZlSXRlbXNTdHJlYW1zKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2VTdHJlYW1zKHRoaXMuX3VwZGF0ZVN0cmVhbXMpO1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zZVN0cmVhbXModGhpcy5fYWRkSXRlbXNTdHJlYW1zKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2VTdHJlYW1zKHRoaXMuX2Rpc3Bvc2luZ1N0cmVhbXMpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTdG9yZS5wcm90b3R5cGUsIFwiaW1tdXRhYmxlXCIsIHtcbiAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBTdG9yZS5wcm90b3R5cGUuaXRlbSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gU3RvcmU7XG4gICAgICAgIH0pKCk7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBCYXNlIGNsYXNzIGZvciBpbW11dGFibGUgc3RvcmVzLlxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIEltbXV0YWJsZVN0b3JlID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICAgICAgICAgIF9fZXh0ZW5kcyhJbW11dGFibGVTdG9yZSwgX3N1cGVyKTtcbiAgICAgICAgICAgIGZ1bmN0aW9uIEltbXV0YWJsZVN0b3JlKCkge1xuICAgICAgICAgICAgICAgIF9zdXBlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIEltbXV0YWJsZVN0b3JlO1xuICAgICAgICB9KShTdG9yZSk7XG4gICAgICAgIHZhciBSZWNvcmRTdG9yZSA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgICAgICAgICBfX2V4dGVuZHMoUmVjb3JkU3RvcmUsIF9zdXBlcik7XG4gICAgICAgICAgICBmdW5jdGlvbiBSZWNvcmRTdG9yZShpbml0aWFsKSB7XG4gICAgICAgICAgICAgICAgX3N1cGVyLmNhbGwodGhpcyk7XG4gICAgICAgICAgICAgICAgdGhpcy5fZGF0YSA9IHt9O1xuICAgICAgICAgICAgICAgIHRoaXMuX3N1YlN0cmVhbXMgPSB7fTtcbiAgICAgICAgICAgICAgICBpZiAoaW5pdGlhbCkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBwcm9wIGluIGluaXRpYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbml0aWFsLmhhc093blByb3BlcnR5KHByb3ApKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRJdGVtKHByb3AsIGluaXRpYWxbcHJvcF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgUmVjb3JkU3RvcmUucHJvdG90eXBlLmNoZWNrTmFtZUFsbG93ZWQgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFJlY29yZFN0b3JlLnByb3RvdHlwZS5zZXR1cFN1YlN0cmVhbSA9IGZ1bmN0aW9uIChuYW1lLCB2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zZVN1YlN0cmVhbShuYW1lKTtcbiAgICAgICAgICAgICAgICBpZiAoaXNTdG9yZSh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN1YlN0cmVhbTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICBzdWJTdHJlYW0gPSB2YWx1ZS51cGRhdGVzO1xuICAgICAgICAgICAgICAgICAgICBzdWJTdHJlYW0uZm9yRWFjaChmdW5jdGlvbiAodXBkYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaW5mbyA9IGNyZWF0ZVVwZGF0ZUluZm8odXBkYXRlLml0ZW0sIHVwZGF0ZS52YWx1ZSwgdXBkYXRlLnN0b3JlLCB1cGRhdGUucGF0aCA/IG5hbWUgKyBcIi5cIiArIHVwZGF0ZS5wYXRoIDogbmFtZSArIFwiLlwiICsgdXBkYXRlLml0ZW0sIG5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5fdXBkYXRlU3RyZWFtcy5mb3JFYWNoKGZ1bmN0aW9uIChzdHJlYW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJlYW0ucHVzaChpbmZvKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3ViU3RyZWFtc1tuYW1lXSA9IHN1YlN0cmVhbTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgUmVjb3JkU3RvcmUucHJvdG90eXBlLmRpc3Bvc2VTdWJTdHJlYW0gPSBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgICAgIHZhciBzdWJTdHJlYW0gPSB0aGlzLl9zdWJTdHJlYW1zW25hbWVdO1xuICAgICAgICAgICAgICAgIGlmIChzdWJTdHJlYW0pIHtcbiAgICAgICAgICAgICAgICAgICAgc3ViU3RyZWFtLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgUmVjb3JkU3RvcmUucHJvdG90eXBlLmFkZEl0ZW0gPSBmdW5jdGlvbiAobmFtZSwgaW5pdGlhbCkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5jaGVja05hbWVBbGxvd2VkKG5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5hbWUgJ1wiICsgbmFtZSArIFwiJyBub3QgYWxsb3dlZCBmb3IgcHJvcGVydHkgb2Ygb2JqZWN0IHN0b3JlLlwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBuYW1lLCB7XG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhhdC5fZGF0YVtuYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuX2RhdGFbbmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB1cGRhdGVJbmZvID0gY3JlYXRlVXBkYXRlSW5mbyhuYW1lLCB2YWx1ZSwgdGhhdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnNldHVwU3ViU3RyZWFtKG5hbWUsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuX3VwZGF0ZVN0cmVhbXMuZm9yRWFjaChmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RyZWFtLnB1c2godXBkYXRlSW5mbyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuX2RhdGFbbmFtZV0gPSBpbml0aWFsO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0dXBTdWJTdHJlYW0obmFtZSwgaW5pdGlhbCk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2FkZEl0ZW1zU3RyZWFtcykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9hZGRJdGVtc1N0cmVhbXMuZm9yRWFjaChmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHJlYW0ucHVzaChjcmVhdGVVcGRhdGVJbmZvKG5hbWUsIGluaXRpYWwsIHRoYXQpKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFJlY29yZFN0b3JlLnByb3RvdHlwZS5yZW1vdmVJdGVtID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fZGF0YS5oYXNPd25Qcm9wZXJ0eShuYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgdGhpc1tuYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuX2RhdGFbbmFtZV07XG4gICAgICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NlU3ViU3RyZWFtKG5hbWUpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZW1vdmVJdGVtc1N0cmVhbXMuZm9yRWFjaChmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHJlYW0ucHVzaChjcmVhdGVVcGRhdGVJbmZvKG5hbWUsIG51bGwsIHRoYXQpKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmtub3duIHByb3BlcnR5ICdcIiArIG5hbWUgKyBcIicuXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoUmVjb3JkU3RvcmUucHJvdG90eXBlLCBcImltbXV0YWJsZVwiLCB7XG4gICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5faW1tdXRhYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9pbW11dGFibGUgPSBuZXcgSW1tdXRhYmxlUmVjb3JkKHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9pbW11dGFibGU7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoUmVjb3JkU3RvcmUucHJvdG90eXBlLCBcImtleXNcIiwge1xuICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgciA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBrIGluIHRoaXMuX2RhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHIucHVzaChrKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcjtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFJlY29yZFN0b3JlLnByb3RvdHlwZS5kaXNwb3NlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICAgICB0aGlzLmtleXMuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc1N0b3JlKHRoYXRba2V5XSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXRba2V5XS5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHRoYXRba2V5XTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLl9kYXRhID0gbnVsbDtcbiAgICAgICAgICAgICAgICBfc3VwZXIucHJvdG90eXBlLmRpc3Bvc2UuY2FsbCh0aGlzKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gUmVjb3JkU3RvcmU7XG4gICAgICAgIH0pKFN0b3JlKTtcbiAgICAgICAgdmFyIEltbXV0YWJsZVJlY29yZCA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgICAgICAgICBfX2V4dGVuZHMoSW1tdXRhYmxlUmVjb3JkLCBfc3VwZXIpO1xuICAgICAgICAgICAgZnVuY3Rpb24gSW1tdXRhYmxlUmVjb3JkKF9wYXJlbnQpIHtcbiAgICAgICAgICAgICAgICBfc3VwZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9wYXJlbnQgPSBfcGFyZW50O1xuICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICAgICBfcGFyZW50LmtleXMuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQuYWRkSXRlbShrZXkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIF9wYXJlbnQubmV3SXRlbXMuZm9yRWFjaChmdW5jdGlvbiAodXBkYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQuYWRkSXRlbSh1cGRhdGUuaXRlbSk7XG4gICAgICAgICAgICAgICAgfSkudW50aWwoX3BhcmVudC5pc0Rpc3Bvc2luZyk7XG4gICAgICAgICAgICAgICAgX3BhcmVudC5yZW1vdmVkSXRlbXMuZm9yRWFjaChmdW5jdGlvbiAodXBkYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQucmVtb3ZlSXRlbSh1cGRhdGUuaXRlbSk7XG4gICAgICAgICAgICAgICAgfSkudW50aWwoX3BhcmVudC5pc0Rpc3Bvc2luZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoSW1tdXRhYmxlUmVjb3JkLnByb3RvdHlwZSwgXCJpc0ltbXV0YWJsZVwiLCB7XG4gICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEltbXV0YWJsZVJlY29yZC5wcm90b3R5cGUsIFwiaW1tdXRhYmxlXCIsIHtcbiAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBJbW11dGFibGVSZWNvcmQucHJvdG90eXBlLmFkZEl0ZW0gPSBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgbmFtZSwge1xuICAgICAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzU3RvcmUodGhhdC5fcGFyZW50W25hbWVdKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGF0Ll9wYXJlbnRbbmFtZV0uaW1tdXRhYmxlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoYXQuX3BhcmVudFtuYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIEltbXV0YWJsZVJlY29yZC5wcm90b3R5cGUucmVtb3ZlSXRlbSA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXNbbmFtZV07XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEltbXV0YWJsZVJlY29yZC5wcm90b3R5cGUsIFwia2V5c1wiLCB7XG4gICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9wYXJlbnQua2V5cztcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIEltbXV0YWJsZVJlY29yZC5wcm90b3R5cGUuc3Vic2NyaWJlUGFyZW50U3RyZWFtID0gZnVuY3Rpb24gKHBhcmVudFN0cmVhbSkge1xuICAgICAgICAgICAgICAgIHZhciBzdHJlYW0gPSBGbHVzcy5TdHJlYW0uY3JlYXRlU3RyZWFtKCk7XG4gICAgICAgICAgICAgICAgcGFyZW50U3RyZWFtLmZvckVhY2goZnVuY3Rpb24gKHVwZGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICBzdHJlYW0ucHVzaCh1cGRhdGUpO1xuICAgICAgICAgICAgICAgIH0pLnVudGlsKHRoaXMuX3BhcmVudC5pc0Rpc3Bvc2luZyk7XG4gICAgICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVN0cmVhbXMucHVzaChzdHJlYW0pO1xuICAgICAgICAgICAgICAgIHN0cmVhbS5vbkNsb3NlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5yZW1vdmVTdHJlYW0odGhhdC5fdXBkYXRlU3RyZWFtcywgc3RyZWFtKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RyZWFtO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShJbW11dGFibGVSZWNvcmQucHJvdG90eXBlLCBcInVwZGF0ZXNcIiwge1xuICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zdWJzY3JpYmVQYXJlbnRTdHJlYW0odGhpcy5fcGFyZW50LnVwZGF0ZXMpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEltbXV0YWJsZVJlY29yZC5wcm90b3R5cGUsIFwibmV3SXRlbXNcIiwge1xuICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zdWJzY3JpYmVQYXJlbnRTdHJlYW0odGhpcy5fcGFyZW50Lm5ld0l0ZW1zKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShJbW11dGFibGVSZWNvcmQucHJvdG90eXBlLCBcInJlbW92ZWRJdGVtc1wiLCB7XG4gICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnN1YnNjcmliZVBhcmVudFN0cmVhbSh0aGlzLl9wYXJlbnQucmVtb3ZlZEl0ZW1zKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShJbW11dGFibGVSZWNvcmQucHJvdG90eXBlLCBcImlzRGlzcG9zaW5nXCIsIHtcbiAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3Vic2NyaWJlUGFyZW50U3RyZWFtKHRoaXMuX3BhcmVudC5pc0Rpc3Bvc2luZyk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gSW1tdXRhYmxlUmVjb3JkO1xuICAgICAgICB9KShJbW11dGFibGVTdG9yZSk7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZWN1cnNpdmVseSBidWlsZCBhIG5lc3RlZCBzdG9yZS5cbiAgICAgICAgICogQHBhcmFtIHZhbHVlXG4gICAgICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gYnVpbGREZWVwKHZhbHVlKSB7XG4gICAgICAgICAgICBmdW5jdGlvbiBnZXRJdGVtKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHY7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoRmx1c3MuVG9vbHMuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHYgPSBidWlsZEFycmF5KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHYgPSBidWlsZFJlY29yZCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHYgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHY7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmdW5jdGlvbiBidWlsZEFycmF5KHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0b3JlID0gbmV3IEFycmF5U3RvcmUoKTtcbiAgICAgICAgICAgICAgICB2YWx1ZS5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0b3JlLnB1c2goZ2V0SXRlbShpdGVtKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3JlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZnVuY3Rpb24gYnVpbGRSZWNvcmQodmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0b3JlID0gbmV3IFJlY29yZFN0b3JlKCk7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHZhbHVlcykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWVzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0b3JlLmFkZEl0ZW0oa2V5LCBnZXRJdGVtKHZhbHVlc1trZXldKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3JlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgICAgIGlmIChGbHVzcy5Ub29scy5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYnVpbGRBcnJheSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYnVpbGRSZWNvcmQodmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDcmVhdGUgYSBuZXcgcmVjb3JkLiBJZiBhbiBpbml0aWFsIHZhbHVlIGlzIGdpdmVuIGl0IHdpbGwgaGF2ZSB0aGUgZW51bWVyYWJsZSBwcm9wZXJ0aWVzIG9mIHRoYXQgdmFsdWUuIFlvdSBjYW5cbiAgICAgICAgICogY3JlYXRlIG5lc3RlZCBzdG9yZXMgYnkgcHJvdmlkaW5nIGEgY29tcGxleCBvYmplY3QgYXMgYW4gaW5pdGlhbCB2YWx1ZS5cbiAgICAgICAgICogQHBhcmFtIGluaXRpYWxcbiAgICAgICAgICogQHJldHVybnMgeyp9XG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiByZWNvcmQoaW5pdGlhbCkge1xuICAgICAgICAgICAgaWYgKGluaXRpYWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYnVpbGREZWVwKGluaXRpYWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBSZWNvcmRTdG9yZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIF9TdG9yZS5yZWNvcmQgPSByZWNvcmQ7XG4gICAgICAgIHZhciBBcnJheVN0b3JlID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICAgICAgICAgIF9fZXh0ZW5kcyhBcnJheVN0b3JlLCBfc3VwZXIpO1xuICAgICAgICAgICAgZnVuY3Rpb24gQXJyYXlTdG9yZShpbml0aWFsLCBhZGRlciwgcmVtb3ZlciwgdXBkYXRlcikge1xuICAgICAgICAgICAgICAgIF9zdXBlci5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3N1YnN0cmVhbXMgPSB7fTtcbiAgICAgICAgICAgICAgICB0aGlzLl9kYXRhID0gaW5pdGlhbCB8fCBbXTtcbiAgICAgICAgICAgICAgICB0aGlzLl9tYXhQcm9wcyA9IDA7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVQcm9wZXJ0aWVzKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fc3luY2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgaWYgKGFkZGVyKSB7XG4gICAgICAgICAgICAgICAgICAgIGFkZGVyLmZvckVhY2goZnVuY3Rpb24gKHVwZGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5zcGxpY2UodXBkYXRlLml0ZW0sIDAsIHVwZGF0ZS52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pLnVudGlsKHRoaXMuaXNEaXNwb3NpbmcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocmVtb3Zlcikge1xuICAgICAgICAgICAgICAgICAgICByZW1vdmVyLmZvckVhY2goZnVuY3Rpb24gKHVwZGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5zcGxpY2UodXBkYXRlLml0ZW0sIDEpO1xuICAgICAgICAgICAgICAgICAgICB9KS51bnRpbCh0aGlzLmlzRGlzcG9zaW5nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHVwZGF0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlci5mb3JFYWNoKGZ1bmN0aW9uICh1cGRhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXRbdXBkYXRlLml0ZW1dID0gdXBkYXRlLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB9KS51bnRpbCh0aGlzLmlzRGlzcG9zaW5nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBBcnJheVN0b3JlLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fZGF0YS50b1N0cmluZygpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIEFycmF5U3RvcmUucHJvdG90eXBlLnRvTG9jYWxlU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9kYXRhLnRvTG9jYWxlU3RyaW5nKCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgQXJyYXlTdG9yZS5wcm90b3R5cGUuZm9yRWFjaCA9IGZ1bmN0aW9uIChjYWxsYmFja2ZuLCB0aGlzQXJnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZGF0YS5mb3JFYWNoKGNhbGxiYWNrZm4sIHRoaXNBcmcpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIEFycmF5U3RvcmUucHJvdG90eXBlLmV2ZXJ5ID0gZnVuY3Rpb24gKGNhbGxiYWNrZm4sIHRoaXNBcmcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fZGF0YS5ldmVyeShjYWxsYmFja2ZuLCB0aGlzQXJnKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBBcnJheVN0b3JlLnByb3RvdHlwZS5zb21lID0gZnVuY3Rpb24gKGNhbGxiYWNrZm4sIHRoaXNBcmcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fZGF0YS5zb21lKGNhbGxiYWNrZm4sIHRoaXNBcmcpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIEFycmF5U3RvcmUucHJvdG90eXBlLmluZGV4T2YgPSBmdW5jdGlvbiAodmFsdWUsIGZyb21JbmRleCkge1xuICAgICAgICAgICAgICAgIGlmIChpc1N0b3JlKHZhbHVlKSAmJiB2YWx1ZS5pc0ltbXV0YWJsZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fZGF0YS5pbmRleE9mKHZhbHVlW1wiX3BhcmVudFwiXSwgZnJvbUluZGV4KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9kYXRhLmluZGV4T2YodmFsdWUsIGZyb21JbmRleCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIEFycmF5U3RvcmUucHJvdG90eXBlLmxhc3RJbmRleE9mID0gZnVuY3Rpb24gKHNlYXJjaEVsZW1lbnQsIGZyb21JbmRleCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9kYXRhLmxhc3RJbmRleE9mKHNlYXJjaEVsZW1lbnQsIGZyb21JbmRleCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgQXJyYXlTdG9yZS5wcm90b3R5cGUuam9pbiA9IGZ1bmN0aW9uIChzZXBhcmF0b3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fZGF0YS5qb2luKHNlcGFyYXRvcik7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgQXJyYXlTdG9yZS5wcm90b3R5cGUubWFwID0gZnVuY3Rpb24gKGNhbGxiYWNrZm4sIHRoaXNBcmcpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWFwcGVkID0gdGhpcy5fZGF0YS5tYXAoY2FsbGJhY2tmbiwgdGhpc0FyZyk7XG4gICAgICAgICAgICAgICAgdmFyIGFkZGVyID0gRmx1c3MuU3RyZWFtLmNyZWF0ZVN0cmVhbSgpO1xuICAgICAgICAgICAgICAgIHZhciByZW1vdmVyID0gRmx1c3MuU3RyZWFtLmNyZWF0ZVN0cmVhbSgpO1xuICAgICAgICAgICAgICAgIHZhciB1cGRhdGVyID0gRmx1c3MuU3RyZWFtLmNyZWF0ZVN0cmVhbSgpO1xuICAgICAgICAgICAgICAgIHZhciBtYXBwZWRTdG9yZSA9IG5ldyBBcnJheVN0b3JlKG1hcHBlZCwgYWRkZXIsIHJlbW92ZXIsIHVwZGF0ZXIpO1xuICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZXMuZm9yRWFjaChmdW5jdGlvbiAodXBkYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZXIucHVzaChjcmVhdGVVcGRhdGVJbmZvKHVwZGF0ZS5yb290SXRlbSwgY2FsbGJhY2tmbih0aGF0Ll9kYXRhW3VwZGF0ZS5yb290SXRlbV0sIHVwZGF0ZS5yb290SXRlbSwgdGhhdC5fZGF0YSksIHVwZGF0ZS5zdG9yZSkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMubmV3SXRlbXMuZm9yRWFjaChmdW5jdGlvbiAodXBkYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIGFkZGVyLnB1c2goY3JlYXRlVXBkYXRlSW5mbyh1cGRhdGUucm9vdEl0ZW0sIGNhbGxiYWNrZm4odGhhdC5fZGF0YVt1cGRhdGUucm9vdEl0ZW1dLCB1cGRhdGUucm9vdEl0ZW0sIHRoYXQuX2RhdGEpLCB1cGRhdGUuc3RvcmUpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZWRJdGVtcy5mb3JFYWNoKGZ1bmN0aW9uICh1cGRhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVtb3Zlci5wdXNoKGNyZWF0ZVVwZGF0ZUluZm8odXBkYXRlLnJvb3RJdGVtLCB1cGRhdGUudmFsdWUsIHVwZGF0ZS5zdG9yZSkpOyAvLyBUaGUgdmFsdWUgZG9lcyBub3QgbWF0dGVyIGhlcmUsIHNhdmUgdGhlIGNhbGwgdG8gdGhlIGNhbGxiYWNrXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hcHBlZFN0b3JlO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIEFycmF5U3RvcmUucHJvdG90eXBlLmZpbHRlciA9IGZ1bmN0aW9uIChjYWxsYmFja2ZuLCBub1VwZGF0ZXMsIHRoaXNBcmcpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgdmFyIGFkZGVyO1xuICAgICAgICAgICAgICAgIHZhciByZW1vdmVyO1xuICAgICAgICAgICAgICAgIHZhciB1cGRhdGVyO1xuICAgICAgICAgICAgICAgIHZhciBmaWx0ZXJlZFN0b3JlO1xuICAgICAgICAgICAgICAgIHZhciBpbmRleE1hcCA9IFtdO1xuICAgICAgICAgICAgICAgIHZhciBmaWx0ZXJlZCA9IFtdO1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIG1hcChmb3JJbmRleCwgdG9JbmRleCkge1xuICAgICAgICAgICAgICAgICAgICBpbmRleE1hcFtmb3JJbmRleF0gPSB0b0luZGV4O1xuICAgICAgICAgICAgICAgICAgICBpZiAodG9JbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSBmb3JJbmRleCArIDE7IGkgPCBpbmRleE1hcC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbmRleE1hcFtpXSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXBbaV0gKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gYWRkTWFwKGZyb21JbmRleCwgdG9JbmRleCkge1xuICAgICAgICAgICAgICAgICAgICBpbmRleE1hcC5zcGxpY2UoZnJvbUluZGV4LCAwLCB0b0luZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRvSW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gZnJvbUluZGV4ICsgMTsgaSA8IGluZGV4TWFwLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4TWFwW2ldICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hcFtpXSArPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiB1bm1hcChmb3JJbmRleCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZG93bnNoaWZ0ID0gaXNNYXBwZWQoZm9ySW5kZXgpO1xuICAgICAgICAgICAgICAgICAgICBpbmRleE1hcFtmb3JJbmRleF0gPSAtMTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRvd25zaGlmdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IGZvckluZGV4ICsgMTsgaSA8IGluZGV4TWFwLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4TWFwW2ldICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hcFtpXSAtPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiByZW1vdmVNYXAoZm9ySW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRvd25zaGlmdCA9IGlzTWFwcGVkKGZvckluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXAuc3BsaWNlKGZvckluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRvd25zaGlmdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IGZvckluZGV4OyBpIDwgaW5kZXhNYXAubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXhNYXBbaV0gIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4TWFwW2ldIC09IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIG1hcEluZGV4KGZyb21JbmRleCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaW5kZXhNYXBbZnJvbUluZGV4XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gaXNNYXBwZWQoaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGluZGV4IDwgaW5kZXhNYXAubGVuZ3RoICYmIGluZGV4TWFwW2luZGV4XSAhPT0gLTE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGdldENsb3Nlc3RMZWZ0TWFwKGZvckluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpID0gZm9ySW5kZXg7XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlICgoaSA+PSBpbmRleE1hcC5sZW5ndGggfHwgaW5kZXhNYXBbaV0gPT09IC0xKSAmJiBpID4gLTIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGktLTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoaSA8IDApXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtYXBJbmRleChpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5fZGF0YS5mb3JFYWNoKGZ1bmN0aW9uICh2YWx1ZSwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrZm4odmFsdWUsIGluZGV4LCB0aGF0Ll9kYXRhKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWRkTWFwKGluZGV4LCBmaWx0ZXJlZC5sZW5ndGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyZWQucHVzaCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRNYXAoaW5kZXgsIC0xKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGlmICghbm9VcGRhdGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGFkZGVyID0gRmx1c3MuU3RyZWFtLmNyZWF0ZVN0cmVhbSgpO1xuICAgICAgICAgICAgICAgICAgICByZW1vdmVyID0gRmx1c3MuU3RyZWFtLmNyZWF0ZVN0cmVhbSgpO1xuICAgICAgICAgICAgICAgICAgICB1cGRhdGVyID0gRmx1c3MuU3RyZWFtLmNyZWF0ZVN0cmVhbSgpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm5ld0l0ZW1zLmZvckVhY2goZnVuY3Rpb24gKHVwZGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrZm4odGhhdC5fZGF0YVt1cGRhdGUucm9vdEl0ZW1dLCB1cGRhdGUucm9vdEl0ZW0sIHRoYXQuX2RhdGEpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzTWFwcGVkKHVwZGF0ZS5yb290SXRlbSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkZXIucHVzaChjcmVhdGVVcGRhdGVJbmZvKG1hcEluZGV4KHVwZGF0ZS5yb290SXRlbSksIHRoYXQuX2RhdGFbdXBkYXRlLnJvb3RJdGVtXSwgdXBkYXRlLnN0b3JlKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRlci5wdXNoKGNyZWF0ZVVwZGF0ZUluZm8oZ2V0Q2xvc2VzdExlZnRNYXAodXBkYXRlLnJvb3RJdGVtKSArIDEsIHRoYXQuX2RhdGFbdXBkYXRlLnJvb3RJdGVtXSwgdXBkYXRlLnN0b3JlKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZE1hcCh1cGRhdGUucm9vdEl0ZW0sIGZpbHRlcmVkU3RvcmUuaW5kZXhPZih0aGF0Ll9kYXRhW3VwZGF0ZS5yb290SXRlbV0pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZE1hcCh1cGRhdGUucm9vdEl0ZW0sIC0xKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlZEl0ZW1zLmZvckVhY2goZnVuY3Rpb24gKHVwZGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzTWFwcGVkKHVwZGF0ZS5yb290SXRlbSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVyLnB1c2goY3JlYXRlVXBkYXRlSW5mbyhtYXBJbmRleCh1cGRhdGUucm9vdEl0ZW0pLCB0aGF0Ll9kYXRhW3VwZGF0ZS5yb290SXRlbV0sIHVwZGF0ZS5zdG9yZSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlTWFwKHVwZGF0ZS5yb290SXRlbSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZXMuZm9yRWFjaChmdW5jdGlvbiAodXBkYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2tmbih0aGF0Ll9kYXRhW3VwZGF0ZS5yb290SXRlbV0sIHVwZGF0ZS5yb290SXRlbSwgdGhhdC5fZGF0YSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNNYXBwZWQodXBkYXRlLnJvb3RJdGVtKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVyLnB1c2goY3JlYXRlVXBkYXRlSW5mbyhtYXBJbmRleCh1cGRhdGUucm9vdEl0ZW0pLCB0aGF0Ll9kYXRhW3VwZGF0ZS5yb290SXRlbV0sIHVwZGF0ZS5zdG9yZSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkZXIucHVzaChjcmVhdGVVcGRhdGVJbmZvKGdldENsb3Nlc3RMZWZ0TWFwKHVwZGF0ZS5yb290SXRlbSkgKyAxLCB0aGF0Ll9kYXRhW3VwZGF0ZS5yb290SXRlbV0sIHVwZGF0ZS5zdG9yZSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXAodXBkYXRlLnJvb3RJdGVtLCBmaWx0ZXJlZFN0b3JlLmluZGV4T2YodGhhdC5fZGF0YVt1cGRhdGUucm9vdEl0ZW1dKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzTWFwcGVkKHVwZGF0ZS5yb290SXRlbSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3Zlci5wdXNoKGNyZWF0ZVVwZGF0ZUluZm8obWFwSW5kZXgodXBkYXRlLnJvb3RJdGVtKSwgdGhhdC5fZGF0YVt1cGRhdGUucm9vdEl0ZW1dLCB1cGRhdGUuc3RvcmUpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5tYXAodXBkYXRlLnJvb3RJdGVtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcCh1cGRhdGUucm9vdEl0ZW0sIC0xKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmaWx0ZXJlZFN0b3JlID0gbmV3IEFycmF5U3RvcmUoZmlsdGVyZWQsIGFkZGVyLCByZW1vdmVyLCB1cGRhdGVyKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlsdGVyZWRTdG9yZTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBBcnJheVN0b3JlLnByb3RvdHlwZS5yZWR1Y2UgPSBmdW5jdGlvbiAoY2FsbGJhY2tmbiwgaW5pdGlhbFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGEucmVkdWNlKGNhbGxiYWNrZm4sIGluaXRpYWxWYWx1ZSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgQXJyYXlTdG9yZS5wcm90b3R5cGUuc29ydCA9IGZ1bmN0aW9uIChjb21wYXJlRm4pIHtcbiAgICAgICAgICAgICAgICB2YXIgY29weSA9IHRoaXMuX2RhdGEubWFwKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpdGVtO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvcHkuc29ydChjb21wYXJlRm4pO1xuICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICAgICBjb3B5LmZvckVhY2goZnVuY3Rpb24gKHZhbHVlLCBpbmRleCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgIT09IHRoYXQuX2RhdGFbaW5kZXhdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0W2luZGV4XSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgQXJyYXlTdG9yZS5wcm90b3R5cGUucmV2ZXJzZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgY29weSA9IHRoaXMuX2RhdGEubWFwKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpdGVtO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvcHkucmV2ZXJzZSgpO1xuICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICAgICBjb3B5LmZvckVhY2goZnVuY3Rpb24gKHZhbHVlLCBpbmRleCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgIT09IHRoYXQuX2RhdGFbaW5kZXhdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0W2luZGV4XSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgQXJyYXlTdG9yZS5wcm90b3R5cGUuY29uY2F0ID0gZnVuY3Rpb24gKGFycmF5KSB7XG4gICAgICAgICAgICAgICAgdmFyIG5ld0FycmF5O1xuICAgICAgICAgICAgICAgIGlmIChhcnJheSBpbnN0YW5jZW9mIEFycmF5U3RvcmUpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV3QXJyYXkgPSB0aGlzLl9kYXRhLmNvbmNhdChhcnJheVtcIl9kYXRhXCJdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG5ld0FycmF5ID0gdGhpcy5fZGF0YS5jb25jYXQoYXJyYXkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEFycmF5U3RvcmUobmV3QXJyYXkpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIEFycmF5U3RvcmUucHJvdG90eXBlLmNvbmNhdElucGxhY2UgPSBmdW5jdGlvbiAoYXJyYXkpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXJyYXkgaW5zdGFuY2VvZiBBcnJheVN0b3JlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3BsaWNlLmFwcGx5KHRoaXMsIFt0aGlzLmxlbmd0aCwgMF0uY29uY2F0KGFycmF5W1wiX2RhdGFcIl0pKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3BsaWNlLmFwcGx5KHRoaXMsIFt0aGlzLmxlbmd0aCwgMF0uY29uY2F0KGFycmF5KSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShBcnJheVN0b3JlLnByb3RvdHlwZSwgXCJsZW5ndGhcIiwge1xuICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fZGF0YS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBBcnJheVN0b3JlLnByb3RvdHlwZS5zZXR1cFN1YlN0cmVhbXMgPSBmdW5jdGlvbiAoaXRlbSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgaWYgKGlzU3RvcmUodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzdWJzdHJlYW0gPSB0aGlzLl9zdWJzdHJlYW1zW0ZsdXNzLlRvb2xzLm9pZCh2YWx1ZSldO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3Vic3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJzdHJlYW0udXBkYXRlcy5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc3Vic3RyZWFtID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlczogdmFsdWUudXBkYXRlc1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBzdWJzdHJlYW0udXBkYXRlcy5mb3JFYWNoKGZ1bmN0aW9uICh1cGRhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB1cGRhdGVJbmZvID0gY3JlYXRlVXBkYXRlSW5mbyh1cGRhdGUuaXRlbSwgdXBkYXRlLnZhbHVlLCB0aGF0LCB1cGRhdGUucGF0aCA/IGl0ZW0gKyBcIi5cIiArIHVwZGF0ZS5wYXRoIDogaXRlbSArIFwiLlwiICsgdXBkYXRlLml0ZW0sIGl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5fdXBkYXRlU3RyZWFtcy5mb3JFYWNoKGZ1bmN0aW9uIChzdHJlYW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJlYW0ucHVzaCh1cGRhdGVJbmZvKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3Vic3RyZWFtc1tGbHVzcy5Ub29scy5vaWQodmFsdWUpXSA9IHN1YnN0cmVhbTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBDYWxsIGFmdGVyIHJlbW92YWwhXG4gICAgICAgICAgICAgKiBAcGFyYW0gdmFsdWVcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgQXJyYXlTdG9yZS5wcm90b3R5cGUuZGlzcG9zZVN1YnN0cmVhbSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIGlmIChpc1N0b3JlKHZhbHVlKSAmJiB0aGlzLl9kYXRhLmluZGV4T2YodmFsdWUpID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgc3ViU3RyZWFtID0gdGhpcy5fc3Vic3RyZWFtc1tGbHVzcy5Ub29scy5vaWQodmFsdWUpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN1YlN0cmVhbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3ViU3RyZWFtLnVwZGF0ZXMuZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuX3N1YnN0cmVhbXNbRmx1c3MuVG9vbHMub2lkKHZhbHVlKV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgQXJyYXlTdG9yZS5wcm90b3R5cGUudXBkYXRlUHJvcGVydGllcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgdmFyIGk7XG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMuX2RhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5zZXR1cFN1YlN0cmVhbXMoaSwgdGhpcy5fZGF0YVtpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZvciAoaSA9IHRoaXMuX21heFByb3BzOyBpIDwgdGhpcy5fZGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAoZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhhdCwgXCJcIiArIGluZGV4LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhhdC5fZGF0YVtpbmRleF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgb2xkID0gdGhhdC5fZGF0YVtpbmRleF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gb2xkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0Ll9kYXRhW2luZGV4XSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5kaXNwb3NlU3Vic3RyZWFtKG9sZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnNldHVwU3ViU3RyZWFtcyhpbmRleCwgdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5fdXBkYXRlU3RyZWFtcy5mb3JFYWNoKGZ1bmN0aW9uIChzdHJlYW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJlYW0ucHVzaChjcmVhdGVVcGRhdGVJbmZvKGluZGV4LCB0aGF0Ll9kYXRhW2luZGV4XSwgdGhhdCwgbnVsbCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSkoaSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuX21heFByb3BzID0gdGhpcy5fZGF0YS5sZW5ndGg7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgQXJyYXlTdG9yZS5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgdmFsdWVzID0gW107XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzW19pIC0gMF0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSB0aGlzLl9kYXRhLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgdmFsdWVzLmZvckVhY2goZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQuX2RhdGEucHVzaCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQuX2FkZEl0ZW1zU3RyZWFtcy5mb3JFYWNoKGZ1bmN0aW9uIChzdHJlYW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0cmVhbS5wdXNoKGNyZWF0ZVVwZGF0ZUluZm8oaW5kZXgsIHRoYXQuX2RhdGFbaW5kZXhdLCB0aGF0KSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBpbmRleCsrO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUHJvcGVydGllcygpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIEFycmF5U3RvcmUucHJvdG90eXBlLnVuc2hpZnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHZhbHVlcyA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlc1tfaSAtIDBdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgICAgIHZhciBsID0gdmFsdWVzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB3aGlsZSAobC0tKSB7XG4gICAgICAgICAgICAgICAgICAgIChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9kYXRhLnVuc2hpZnQodmFsdWVzWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX25ld0l0ZW1TdHJlYW1zLmZvckVhY2goZnVuY3Rpb24gKHN0cmVhbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cmVhbS5wdXNoKGNyZWF0ZVVwZGF0ZUluZm8oMCwgdGhhdC5fZGF0YVswXSwgdGhhdCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUHJvcGVydGllcygpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIEFycmF5U3RvcmUucHJvdG90eXBlLnBvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgciA9IHRoaXMuX2RhdGEucG9wKCk7XG4gICAgICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zZVN1YnN0cmVhbShyKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZW1vdmVJdGVtc1N0cmVhbXMuZm9yRWFjaChmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbS5wdXNoKGNyZWF0ZVVwZGF0ZUluZm8odGhhdC5fZGF0YS5sZW5ndGgsIG51bGwsIHRoYXQpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcjtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBBcnJheVN0b3JlLnByb3RvdHlwZS5zaGlmdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgciA9IHRoaXMuX2RhdGEuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NlU3Vic3RyZWFtKHIpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3JlbW92ZUl0ZW1zU3RyZWFtcy5mb3JFYWNoKGZ1bmN0aW9uIChzdHJlYW0pIHtcbiAgICAgICAgICAgICAgICAgICAgc3RyZWFtLnB1c2goY3JlYXRlVXBkYXRlSW5mbygwLCBudWxsLCB0aGF0KSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHI7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgQXJyYXlTdG9yZS5wcm90b3R5cGUuc3BsaWNlID0gZnVuY3Rpb24gKHN0YXJ0LCBkZWxldGVDb3VudCkge1xuICAgICAgICAgICAgICAgIHZhciB2YWx1ZXMgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBfaSA9IDI7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZXNbX2kgLSAyXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciByZW1vdmVkID0gdGhpcy5fZGF0YS5zcGxpY2UuYXBwbHkodGhpcy5fZGF0YSwgW3N0YXJ0LCBkZWxldGVDb3VudF0uY29uY2F0KHZhbHVlcykpO1xuICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IHN0YXJ0O1xuICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICAgICBpZiAodGhhdC5fcmVtb3ZlSXRlbXNTdHJlYW1zLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICByZW1vdmVkLmZvckVhY2goZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0LmRpc3Bvc2VTdWJzdHJlYW0odmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5fcmVtb3ZlSXRlbXNTdHJlYW1zLmZvckVhY2goZnVuY3Rpb24gKHN0cmVhbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cmVhbS5wdXNoKGNyZWF0ZVVwZGF0ZUluZm8oaW5kZXgsIHZhbHVlLCB0aGF0KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4Kys7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpbmRleCA9IHN0YXJ0O1xuICAgICAgICAgICAgICAgIHZhbHVlcy5mb3JFYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5fYWRkSXRlbXNTdHJlYW1zLmZvckVhY2goZnVuY3Rpb24gKHN0cmVhbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RyZWFtLnB1c2goY3JlYXRlVXBkYXRlSW5mbyhpbmRleCwgdGhhdC5fZGF0YVtpbmRleF0sIHRoYXQpKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGluZGV4Kys7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgLyogUmVtb3ZlZC4gVGhpcyBzaG91bGQgbm90IGJlIG5lY2Vzc2FyeSBhbmQgaXQgc2ltcGxpZmllcyB0aGUgcmVhY3RpdmUgYXJyYXlcbiAgICAgICAgICAgICAgICAgLy8gSW5kZXggaXMgbm93IGF0IHRoZSBmaXJzdCBpdGVtIGFmdGVyIHRoZSBsYXN0IGluc2VydGVkIHZhbHVlLiBTbyBpZiBkZWxldGVDb3VudCAhPSB2YWx1ZXMubGVuZ3RoXG4gICAgICAgICAgICAgICAgIC8vIHRoZSBpdGVtcyBhZnRlciB0aGUgaW5zZXJ0L3JlbW92ZSBtb3ZlZCBhcm91bmRcbiAgICAgICAgICAgICAgICAgaWYgKGRlbGV0ZUNvdW50ICE9PSB2YWx1ZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgIC8vdmFyIGRpc3RhbmNlID0gdmFsdWVzLmxlbmd0aCAtIGRlbGV0ZUNvdW50O1xuICAgICAgICAgICAgICAgICBmb3IgKGluZGV4OyBpbmRleCA8IHRoaXMuX2RhdGEubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgICAgICAgIHRoYXQuX3VwZGF0ZVN0cmVhbXMuZm9yRWFjaChmdW5jdGlvbihzdHJlYW0pIHtcbiAgICAgICAgICAgICAgICAgc3RyZWFtLnB1c2goY3JlYXRlVXBkYXRlSW5mbzxudW1iZXI+KGluZGV4LCB0aGF0Ll9kYXRhW2luZGV4XSwgdGhhdCkpO1xuICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVByb3BlcnRpZXMoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVtb3ZlZDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBBcnJheVN0b3JlLnByb3RvdHlwZS5pbnNlcnQgPSBmdW5jdGlvbiAoYXRJbmRleCkge1xuICAgICAgICAgICAgICAgIHZhciB2YWx1ZXMgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBfaSA9IDE7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZXNbX2kgLSAxXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuc3BsaWNlLmFwcGx5KHRoaXMsIFthdEluZGV4LCAwXS5jb25jYXQodmFsdWVzKSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgQXJyYXlTdG9yZS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gKGF0SW5kZXgsIGNvdW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKGNvdW50ID09PSB2b2lkIDApIHsgY291bnQgPSAxOyB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3BsaWNlKGF0SW5kZXgsIGNvdW50KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBBcnJheVN0b3JlLnByb3RvdHlwZS5kaXNwb3NlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNTdG9yZSh0aGlzW2ldKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1tpXS5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHRoaXNbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuX2RhdGEgPSBudWxsO1xuICAgICAgICAgICAgICAgIF9zdXBlci5wcm90b3R5cGUuZGlzcG9zZS5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShBcnJheVN0b3JlLnByb3RvdHlwZSwgXCJpbW11dGFibGVcIiwge1xuICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX2ltbXV0YWJsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5faW1tdXRhYmxlID0gbmV3IEltbXV0YWJsZUFycmF5KHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9pbW11dGFibGU7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBBcnJheVN0b3JlLnByb3RvdHlwZS5pdGVtID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGkgPSB0aGlzLmluZGV4T2YodmFsdWUpO1xuICAgICAgICAgICAgICAgIGlmIChpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpc1tpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIEFycmF5U3RvcmU7XG4gICAgICAgIH0pKFN0b3JlKTtcbiAgICAgICAgdmFyIEltbXV0YWJsZUFycmF5ID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICAgICAgICAgIF9fZXh0ZW5kcyhJbW11dGFibGVBcnJheSwgX3N1cGVyKTtcbiAgICAgICAgICAgIGZ1bmN0aW9uIEltbXV0YWJsZUFycmF5KF9wYXJlbnQpIHtcbiAgICAgICAgICAgICAgICBfc3VwZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9wYXJlbnQgPSBfcGFyZW50O1xuICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICAgICBfcGFyZW50Lm5ld0l0ZW1zLmZvckVhY2goZnVuY3Rpb24gKHVwZGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGF0LnVwZGF0ZVByb3BlcnRpZXMoKTtcbiAgICAgICAgICAgICAgICB9KS51bnRpbChfcGFyZW50LmlzRGlzcG9zaW5nKTtcbiAgICAgICAgICAgICAgICAvLyBXZSBkbyBub3RoaW5nIHdoZW4gcmVtb3ZpbmcgaXRlbXMuIFRoZSBnZXR0ZXIgd2lsbCByZXR1cm4gdW5kZWZpbmVkLlxuICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgIF9hcnJheS5yZW1vdmVkSXRlbXMoKS5mb3JFYWNoKGZ1bmN0aW9uKHVwZGF0ZSkge1xuXG4gICAgICAgICAgICAgICAgIH0pLnVudGlsKF9hcnJheS5kaXNwb3NpbmcoKSk7XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgdGhpcy5fbWF4UHJvcHMgPSAwO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUHJvcGVydGllcygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgSW1tdXRhYmxlQXJyYXkucHJvdG90eXBlLnVwZGF0ZVByb3BlcnRpZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgICAgIHZhciBpO1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IHRoaXMuX21heFByb3BzOyBpIDwgdGhpcy5fcGFyZW50Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIChmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGF0LCBcIlwiICsgaW5kZXgsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc1N0b3JlKHRoYXQuX3BhcmVudFtpbmRleF0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhhdC5fcGFyZW50W2luZGV4XS5pbW11dGFibGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoYXQuX3BhcmVudFtpbmRleF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KShpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5fbWF4UHJvcHMgPSB0aGlzLl9wYXJlbnQubGVuZ3RoO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIEltbXV0YWJsZUFycmF5LnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fcGFyZW50LnRvU3RyaW5nKCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgSW1tdXRhYmxlQXJyYXkucHJvdG90eXBlLnRvTG9jYWxlU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9wYXJlbnQudG9TdHJpbmcoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBJbW11dGFibGVBcnJheS5wcm90b3R5cGUuZm9yRWFjaCA9IGZ1bmN0aW9uIChjYWxsYmFja2ZuLCB0aGlzQXJnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudC5mb3JFYWNoKGNhbGxiYWNrZm4pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIEltbXV0YWJsZUFycmF5LnByb3RvdHlwZS5ldmVyeSA9IGZ1bmN0aW9uIChjYWxsYmFja2ZuLCB0aGlzQXJnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudC5ldmVyeShjYWxsYmFja2ZuKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBJbW11dGFibGVBcnJheS5wcm90b3R5cGUuc29tZSA9IGZ1bmN0aW9uIChjYWxsYmFja2ZuLCB0aGlzQXJnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudC5mb3JFYWNoKGNhbGxiYWNrZm4pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIEltbXV0YWJsZUFycmF5LnByb3RvdHlwZS5pbmRleE9mID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudC5pbmRleE9mKHZhbHVlKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBJbW11dGFibGVBcnJheS5wcm90b3R5cGUubGFzdEluZGV4T2YgPSBmdW5jdGlvbiAoc2VhcmNoRWxlbWVudCwgZnJvbUluZGV4KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudC5sYXN0SW5kZXhPZihzZWFyY2hFbGVtZW50LCBmcm9tSW5kZXgpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIEltbXV0YWJsZUFycmF5LnByb3RvdHlwZS5qb2luID0gZnVuY3Rpb24gKHNlcGFyYXRvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9wYXJlbnQuam9pbihzZXBhcmF0b3IpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIEltbXV0YWJsZUFycmF5LnByb3RvdHlwZS5tYXAgPSBmdW5jdGlvbiAoY2FsbGJhY2tmbiwgdGhpc0FyZykge1xuICAgICAgICAgICAgICAgIC8vVGhpcyBpcyBkaXJ0eSBidXQgYW55dGhpbmcgZWxzZSB3b3VsZCBiZSBpbnBlcmZvcm1hbnQganVzdCBiZWNhdXNlIHR5cGVzY3JpcHQgZG9lcyBub3QgaGF2ZSBwcm90ZWN0ZWQgc2NvcGVcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fcGFyZW50W1wiX2RhdGFcIl0ubWFwKGNhbGxiYWNrZm4pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIEltbXV0YWJsZUFycmF5LnByb3RvdHlwZS5maWx0ZXIgPSBmdW5jdGlvbiAoY2FsbGJhY2tmbiwgdGhpc0FyZykge1xuICAgICAgICAgICAgICAgIC8vVGhpcyBpcyBkaXJ0eSBidXQgYW55dGhpbmcgZWxzZSB3b3VsZCBiZSBpbnBlcmZvcm1hbnQganVzdCBiZWNhdXNlIHR5cGVzY3JpcHQgZG9lcyBub3QgaGF2ZSBwcm90ZWN0ZWQgc2NvcGVcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fcGFyZW50W1wiX2RhdGFcIl0uZmlsdGVyKGNhbGxiYWNrZm4pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIEltbXV0YWJsZUFycmF5LnByb3RvdHlwZS5yZWR1Y2UgPSBmdW5jdGlvbiAoY2FsbGJhY2tmbiwgaW5pdGlhbFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudC5yZWR1Y2UoY2FsbGJhY2tmbiwgaW5pdGlhbFZhbHVlKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoSW1tdXRhYmxlQXJyYXkucHJvdG90eXBlLCBcImxlbmd0aFwiLCB7XG4gICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9wYXJlbnQubGVuZ3RoO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgSW1tdXRhYmxlQXJyYXkucHJvdG90eXBlLnN1YnNjcmliZVBhcmVudFN0cmVhbSA9IGZ1bmN0aW9uIChwYXJlbnRTdHJlYW0pIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RyZWFtID0gRmx1c3MuU3RyZWFtLmNyZWF0ZVN0cmVhbSgpO1xuICAgICAgICAgICAgICAgIHBhcmVudFN0cmVhbS5mb3JFYWNoKGZ1bmN0aW9uICh1cGRhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RyZWFtLnB1c2godXBkYXRlKTtcbiAgICAgICAgICAgICAgICB9KS51bnRpbCh0aGlzLl9wYXJlbnQuaXNEaXNwb3NpbmcpO1xuICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICAgICB0aGlzLl91cGRhdGVTdHJlYW1zLnB1c2goc3RyZWFtKTtcbiAgICAgICAgICAgICAgICBzdHJlYW0ub25DbG9zZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQucmVtb3ZlU3RyZWFtKHRoYXQuX3VwZGF0ZVN0cmVhbXMsIHN0cmVhbSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0cmVhbTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoSW1tdXRhYmxlQXJyYXkucHJvdG90eXBlLCBcInVwZGF0ZXNcIiwge1xuICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zdWJzY3JpYmVQYXJlbnRTdHJlYW0odGhpcy5fcGFyZW50LnVwZGF0ZXMpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEltbXV0YWJsZUFycmF5LnByb3RvdHlwZSwgXCJuZXdJdGVtc1wiLCB7XG4gICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnN1YnNjcmliZVBhcmVudFN0cmVhbSh0aGlzLl9wYXJlbnQubmV3SXRlbXMpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEltbXV0YWJsZUFycmF5LnByb3RvdHlwZSwgXCJyZW1vdmVkSXRlbXNcIiwge1xuICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zdWJzY3JpYmVQYXJlbnRTdHJlYW0odGhpcy5fcGFyZW50LnJlbW92ZWRJdGVtcyk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoSW1tdXRhYmxlQXJyYXkucHJvdG90eXBlLCBcImRpc3Bvc2luZ1wiLCB7XG4gICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnN1YnNjcmliZVBhcmVudFN0cmVhbSh0aGlzLl9wYXJlbnQuaXNEaXNwb3NpbmcpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEltbXV0YWJsZUFycmF5LnByb3RvdHlwZSwgXCJpbW11dGFibGVcIiwge1xuICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBJbW11dGFibGVBcnJheTtcbiAgICAgICAgfSkoSW1tdXRhYmxlU3RvcmUpO1xuICAgICAgICAvKipcbiAgICAgICAgICogQ3JlYXRlIGFuIGFycmF5IHN0b3JlLiBJZiBhbiBpbml0aWFsIHZhbHVlIGlzIHByb3ZpZGVkIGl0IHdpbGwgaW5pdGlhbGl6ZSB0aGUgYXJyYXlcbiAgICAgICAgICogd2l0aCBpdC4gVGhlIGluaXRpYWwgdmFsdWUgY2FuIGJlIGEgSmF2YVNjcmlwdCBhcnJheSBvZiBlaXRoZXIgc2ltcGxlIHZhbHVlcyBvciBwbGFpbiBvYmplY3RzLlxuICAgICAgICAgKiBJdCB0aGUgYXJyYXkgaGFzIHBsYWluIG9iamVjdHMgYSBuZXN0ZWQgc3RvcmUgd2lsbCBiZSBjcmVhdGVkLlxuICAgICAgICAgKiBAcGFyYW0gaW5pdGlhbFxuICAgICAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIGFycmF5KGluaXRpYWwpIHtcbiAgICAgICAgICAgIGlmIChpbml0aWFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGJ1aWxkRGVlcChpbml0aWFsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQXJyYXlTdG9yZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIF9TdG9yZS5hcnJheSA9IGFycmF5O1xuICAgIH0pKFN0b3JlID0gRmx1c3MuU3RvcmUgfHwgKEZsdXNzLlN0b3JlID0ge30pKTtcbn0pKEZsdXNzIHx8IChGbHVzcyA9IHt9KSk7XG5pZiAodHlwZW9mIGV4cG9ydHMgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBleHBvcnRzLlN0b3JlID0gRmx1c3MuU3RvcmU7XG59XG5pZiAodHlwZW9mIHRoaXNbXCJkZWZpbmVcIl0gPT09IFwiZnVuY3Rpb25cIikge1xuICAgIHRoaXNbXCJkZWZpbmVcIl0oW10sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIEZsdXNzLlN0b3JlO1xuICAgIH0pO1xufVxuXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9zdHJlYW0udHNcIiAvPlxuLyoqXG4gKiBDcmVhdGVkIGJ5IFN0ZXBoYW4gb24gMTAuMDEuMjAxNS5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgRmx1c3M7XG4oZnVuY3Rpb24gKEZsdXNzKSB7XG4gICAgdmFyIFJlYWN0TWl4aW5zO1xuICAgIChmdW5jdGlvbiAoUmVhY3RNaXhpbnMpIHtcbiAgICAgICAgUmVhY3RNaXhpbnMuY29tcG9uZW50TGlmZWN5Y2xlID0ge1xuICAgICAgICAgICAgX3dpbGxVbm1vdW50OiBudWxsLFxuICAgICAgICAgICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl93aWxsVW5tb3VudCA9IEZsdXNzLlN0cmVhbS5jcmVhdGVTdHJlYW0oXCJjb21wb25lbnQtdW5tb3VudFwiKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3dpbGxVbm1vdW50LnB1c2godHJ1ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fd2lsbFVubW91bnQuZGlzcG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0pKFJlYWN0TWl4aW5zID0gRmx1c3MuUmVhY3RNaXhpbnMgfHwgKEZsdXNzLlJlYWN0TWl4aW5zID0ge30pKTtcbn0pKEZsdXNzIHx8IChGbHVzcyA9IHt9KSk7XG5pZiAodHlwZW9mIGV4cG9ydHMgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBleHBvcnRzLlJlYWN0TWl4aW5zID0gRmx1c3MuUmVhY3RNaXhpbnM7XG59XG5pZiAodHlwZW9mIHRoaXNbXCJkZWZpbmVcIl0gPT09IFwiZnVuY3Rpb25cIikge1xuICAgIHRoaXNbXCJkZWZpbmVcIl0oW10sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIEZsdXNzLlJlYWN0TWl4aW5zO1xuICAgIH0pO1xufVxuXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9lbWl0dGVyLnRzXCIgLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL3N0cmVhbS50c1wiIC8+XG4vKipcbiAqIENyZWF0ZWQgYnkgU3RlcGhhbi5TbW9sYSBvbiAyOC4xMC4yMDE0LlxuICovXG5cInVzZSBzdHJpY3RcIjtcbnZhciBfX2V4dGVuZHMgPSB0aGlzLl9fZXh0ZW5kcyB8fCBmdW5jdGlvbiAoZCwgYikge1xuICAgIGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdO1xuICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgIF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlO1xuICAgIGQucHJvdG90eXBlID0gbmV3IF9fKCk7XG59O1xudmFyIEZsdXNzO1xuKGZ1bmN0aW9uIChGbHVzcykge1xuICAgIHZhciBFdmVudENoYW5uZWw7XG4gICAgKGZ1bmN0aW9uIChfRXZlbnRDaGFubmVsKSB7XG4gICAgICAgIHZhciBFdmVudENoYW5uZWwgPSAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZnVuY3Rpb24gRXZlbnRDaGFubmVsKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50SGFuZGxlcnMgPSB7fTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIEV2ZW50Q2hhbm5lbC5wcm90b3R5cGUuc3Vic2NyaWJlID0gZnVuY3Rpb24gKGVtaXR0ZXIsIGV2ZW50LCBoYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9ldmVudEhhbmRsZXJzW2VtaXR0ZXJdKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50SGFuZGxlcnNbZW1pdHRlcl0gPSB7fTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9ldmVudEhhbmRsZXJzW2VtaXR0ZXJdW2V2ZW50XSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudEhhbmRsZXJzW2VtaXR0ZXJdW2V2ZW50XSA9IFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLl9ldmVudEhhbmRsZXJzW2VtaXR0ZXJdW2V2ZW50XS5wdXNoKGhhbmRsZXIpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIEV2ZW50Q2hhbm5lbC5wcm90b3R5cGUudW5zdWJzY3JpYmUgPSBmdW5jdGlvbiAoZW1pdHRlciwgZXZlbnQsIGhhbmRsZXIpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fZXZlbnRIYW5kbGVyc1tlbWl0dGVyXSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fZXZlbnRIYW5kbGVyc1tlbWl0dGVyXVtldmVudF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50SGFuZGxlcnNbZW1pdHRlcl1bZXZlbnRdLnNwbGljZSh0aGlzLl9ldmVudEhhbmRsZXJzW2VtaXR0ZXJdW2V2ZW50XS5pbmRleE9mKGhhbmRsZXIpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBFdmVudENoYW5uZWwucHJvdG90eXBlLmNoYW5uZWxFbWl0ID0gZnVuY3Rpb24gKGVtaXR0ZXIsIGVtaXR0ZXJJRCwgZXZlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fZXZlbnRIYW5kbGVycyAmJiB0aGlzLl9ldmVudEhhbmRsZXJzW2VtaXR0ZXJJRF0gJiYgdGhpcy5fZXZlbnRIYW5kbGVyc1tlbWl0dGVySURdW2V2ZW50XSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudEhhbmRsZXJzW2VtaXR0ZXJJRF1bZXZlbnRdLmZvckVhY2goZnVuY3Rpb24gKGhhbmRsZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZXIuYXBwbHkoZW1pdHRlciwgYXJncyk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBFdmVudENoYW5uZWwucHJvdG90eXBlLnVuc3Vic2NyaWJlQWxsID0gZnVuY3Rpb24gKGVtaXR0ZXJJRCkge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudEhhbmRsZXJzW2VtaXR0ZXJJRF07XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIEV2ZW50Q2hhbm5lbDtcbiAgICAgICAgfSkoKTtcbiAgICAgICAgdmFyIGV2ZW50Q2hhbm5lbCA9IG5ldyBFdmVudENoYW5uZWwoKTtcbiAgICAgICAgLy9leHBvcnQgdmFyIGNoYW5uZWw6SUV2ZW50Q2hhbm5lbCA9IGV2ZW50Q2hhbm5lbDtcbiAgICAgICAgZnVuY3Rpb24gZ2V0Q2hhbm5lbCgpIHtcbiAgICAgICAgICAgIHJldHVybiBldmVudENoYW5uZWw7XG4gICAgICAgIH1cbiAgICAgICAgX0V2ZW50Q2hhbm5lbC5nZXRDaGFubmVsID0gZ2V0Q2hhbm5lbDtcbiAgICAgICAgZnVuY3Rpb24gc3Vic2NyaWJlKGVtaXR0ZXIsIGV2ZW50LCBoYW5kbGVyKSB7XG4gICAgICAgICAgICBldmVudENoYW5uZWwuc3Vic2NyaWJlKGVtaXR0ZXIsIGV2ZW50LCBoYW5kbGVyKTtcbiAgICAgICAgfVxuICAgICAgICBfRXZlbnRDaGFubmVsLnN1YnNjcmliZSA9IHN1YnNjcmliZTtcbiAgICAgICAgZnVuY3Rpb24gdW5zdWJzY3JpYmUoZW1pdHRlciwgZXZlbnQsIGhhbmRsZXIpIHtcbiAgICAgICAgICAgIGV2ZW50Q2hhbm5lbC51bnN1YnNjcmliZShlbWl0dGVyLCBldmVudCwgaGFuZGxlcik7XG4gICAgICAgIH1cbiAgICAgICAgX0V2ZW50Q2hhbm5lbC51bnN1YnNjcmliZSA9IHVuc3Vic2NyaWJlO1xuICAgICAgICBmdW5jdGlvbiBjaGFubmVsRW1pdChlbWl0dGVySUQsIGV2ZW50KSB7XG4gICAgICAgICAgICB2YXIgYXJncyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAyOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgICAgICBhcmdzW19pIC0gMl0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZXZlbnRDaGFubmVsLmNoYW5uZWxFbWl0KG51bGwsIGVtaXR0ZXJJRCwgZXZlbnQsIGFyZ3MpO1xuICAgICAgICB9XG4gICAgICAgIF9FdmVudENoYW5uZWwuY2hhbm5lbEVtaXQgPSBjaGFubmVsRW1pdDtcbiAgICAgICAgZnVuY3Rpb24gdW5zdWJzY3JpYmVBbGwoZW1pdHRlcklEKSB7XG4gICAgICAgICAgICBldmVudENoYW5uZWwudW5zdWJzY3JpYmVBbGwoZW1pdHRlcklEKTtcbiAgICAgICAgfVxuICAgICAgICBfRXZlbnRDaGFubmVsLnVuc3Vic2NyaWJlQWxsID0gdW5zdWJzY3JpYmVBbGw7XG4gICAgICAgIHZhciBlbWl0dGVySURzID0gW107XG4gICAgICAgIHZhciBDaGFubmVsZWRFbWl0dGVyID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICAgICAgICAgIF9fZXh0ZW5kcyhDaGFubmVsZWRFbWl0dGVyLCBfc3VwZXIpO1xuICAgICAgICAgICAgZnVuY3Rpb24gQ2hhbm5lbGVkRW1pdHRlcihfZW1pdHRlcklEKSB7XG4gICAgICAgICAgICAgICAgX3N1cGVyLmNhbGwodGhpcyk7XG4gICAgICAgICAgICAgICAgaWYgKF9lbWl0dGVySUQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0dGVySUQgPSBfZW1pdHRlcklEO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0dGVySUQgPSBcIkVtaXR0ZXJcIiArIGVtaXR0ZXJJRHMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZW1pdHRlcklEcy5pbmRleE9mKHRoaXMuZW1pdHRlcklEKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRHVwbGljYXRlIGVtaXR0ZXJJRC4gVGhpcyBpcyBub3Qgc3VwcG9ydGVkXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIENoYW5uZWxlZEVtaXR0ZXIucHJvdG90eXBlLnN1YnNjcmliZSA9IGZ1bmN0aW9uIChldmVudCwgaGFuZGxlcikge1xuICAgICAgICAgICAgICAgIF9zdXBlci5wcm90b3R5cGUuc3Vic2NyaWJlLmNhbGwodGhpcywgZXZlbnQsIGhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coXCJDb25zaWRlciB1c2luZyB0aGUgRXZlbnRDaGFubmVsIGluc3RlYWQgb2Ygc3Vic2NyaWJpbmcgZGlyZWN0bHkgdG8gdGhlIFwiICsgdGhpcy5lbWl0dGVySUQpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIENoYW5uZWxlZEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICB2YXIgYXJncyA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIF9pID0gMTsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGFyZ3NbX2kgLSAxXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIE5vIHN1cGVyIGNhbGwgYmVjYXVzZSBwYXNzaW5nIHJlc3QgcGFyYW1ldGVycyB0byBhIHN1cGVyIG1ldGhvZCBpcyBraW5kIG9mIGF3a3dhcmQgYW5kIGhhY2t5XG4gICAgICAgICAgICAgICAgLy8gaHR0cHM6Ly90eXBlc2NyaXB0LmNvZGVwbGV4LmNvbS9kaXNjdXNzaW9ucy81NDQ3OTdcbiAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZXZlbnRIYW5kbGVycyAmJiB0aGlzLmV2ZW50SGFuZGxlcnNbZXZlbnRdKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXZlbnRIYW5kbGVyc1tldmVudF0uZm9yRWFjaChmdW5jdGlvbiAoaGFuZGxlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlci5hcHBseSh0aGF0LCBhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGV2ZW50Q2hhbm5lbC5jaGFubmVsRW1pdCh0aGlzLCB0aGlzLmVtaXR0ZXJJRCwgZXZlbnQsIGFyZ3MpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiBDaGFubmVsZWRFbWl0dGVyO1xuICAgICAgICB9KShGbHVzcy5FbWl0dGVyLkVtaXR0ZXIpO1xuICAgICAgICBfRXZlbnRDaGFubmVsLkNoYW5uZWxlZEVtaXR0ZXIgPSBDaGFubmVsZWRFbWl0dGVyO1xuICAgICAgICB2YXIgRXZlbnRTdHJlYW0gPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgICAgICAgICAgX19leHRlbmRzKEV2ZW50U3RyZWFtLCBfc3VwZXIpO1xuICAgICAgICAgICAgZnVuY3Rpb24gRXZlbnRTdHJlYW0obmFtZSwgX2VtaXR0ZXJJRCwgX2V2ZW50KSB7XG4gICAgICAgICAgICAgICAgX3N1cGVyLmNhbGwodGhpcywgbmFtZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fZW1pdHRlcklEID0gX2VtaXR0ZXJJRDtcbiAgICAgICAgICAgICAgICB0aGlzLl9ldmVudCA9IF9ldmVudDtcbiAgICAgICAgICAgICAgICB0aGlzLl9oYW5kbGVyID0gdGhpcy5oYW5kbGVFdmVudC5iaW5kKHRoaXMpO1xuICAgICAgICAgICAgICAgIHN1YnNjcmliZSh0aGlzLl9lbWl0dGVySUQsIF9ldmVudCwgdGhpcy5faGFuZGxlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBFdmVudFN0cmVhbS5wcm90b3R5cGUuaGFuZGxlRXZlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgICAgICAgICBhcmdzW19pIC0gMF0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBlbWl0dGVyOiB0aGlzLl9lbWl0dGVySUQsXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50OiB0aGlzLl9ldmVudCxcbiAgICAgICAgICAgICAgICAgICAgYXJnczogYXJnc1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIEV2ZW50U3RyZWFtLnByb3RvdHlwZS5kaXNwb3NlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIF9zdXBlci5wcm90b3R5cGUuZGlzcG9zZS5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgICAgIHVuc3Vic2NyaWJlKHRoaXMuX2VtaXR0ZXJJRCwgdGhpcy5fZXZlbnQsIHRoaXMuX2hhbmRsZXIpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiBFdmVudFN0cmVhbTtcbiAgICAgICAgfSkoRmx1c3MuU3RyZWFtLlN0cmVhbSk7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDcmVhdGVzIGEgc3RyZWFtIGZvciBhIGNoYW5uZWxlZCBldmVudC4gSWYgIG1vciB0aGFuIG9uZSBldmVudCBpcyBnaXZlbiwgYSBjb21iaW5lZFxuICAgICAgICAgKiBzdHJlYW0gZm9yIGFsbCBldmVudHMgaXMgY3JlYXRlZFxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0gbmFtZVxuICAgICAgICAgKiBAcGFyYW0gZW1pdHRlcklEXG4gICAgICAgICAqIEBwYXJhbSBldmVudHNcbiAgICAgICAgICogQHJldHVybnMge251bGx9XG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBjcmVhdGVFdmVudFN0cmVhbShlbWl0dGVySUQpIHtcbiAgICAgICAgICAgIHZhciBldmVudHMgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIF9pID0gMTsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICAgICAgZXZlbnRzW19pIC0gMV0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHN0cmVhbSA9IG51bGw7XG4gICAgICAgICAgICBldmVudHMuZm9yRWFjaChmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICB2YXIgZVN0cmVhbSA9IG5ldyBFdmVudFN0cmVhbShlbWl0dGVySUQgKyBcIi1cIiArIGV2ZW50LCBlbWl0dGVySUQsIGV2ZW50KTtcbiAgICAgICAgICAgICAgICBpZiAoc3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbSA9IHN0cmVhbS5jb21iaW5lKGVTdHJlYW0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc3RyZWFtID0gZVN0cmVhbTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBzdHJlYW07XG4gICAgICAgIH1cbiAgICAgICAgX0V2ZW50Q2hhbm5lbC5jcmVhdGVFdmVudFN0cmVhbSA9IGNyZWF0ZUV2ZW50U3RyZWFtO1xuICAgIH0pKEV2ZW50Q2hhbm5lbCA9IEZsdXNzLkV2ZW50Q2hhbm5lbCB8fCAoRmx1c3MuRXZlbnRDaGFubmVsID0ge30pKTtcbn0pKEZsdXNzIHx8IChGbHVzcyA9IHt9KSk7XG5pZiAodHlwZW9mIGV4cG9ydHMgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBleHBvcnRzLkV2ZW50Q2hhbm5lbCA9IEZsdXNzLkV2ZW50Q2hhbm5lbDtcbn1cbmlmICh0eXBlb2YgdGhpc1tcImRlZmluZVwiXSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgdGhpc1tcImRlZmluZVwiXShbXSwgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gRmx1c3MuRXZlbnRDaGFubmVsO1xuICAgIH0pO1xufVxuXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9ldmVudENoYW5uZWwudHNcIiAvPlxuLyoqXG4gKiBDcmVhdGVkIGJ5IFN0ZXBoYW4uU21vbGEgb24gMzAuMTAuMjAxNC5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19leHRlbmRzID0gdGhpcy5fX2V4dGVuZHMgfHwgZnVuY3Rpb24gKGQsIGIpIHtcbiAgICBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTtcbiAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICBfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZTtcbiAgICBkLnByb3RvdHlwZSA9IG5ldyBfXygpO1xufTtcbnZhciBGbHVzcztcbihmdW5jdGlvbiAoRmx1c3MpIHtcbiAgICB2YXIgRXJyb3JzO1xuICAgIChmdW5jdGlvbiAoRXJyb3JzKSB7XG4gICAgICAgIChmdW5jdGlvbiAoRVZFTlRTKSB7XG4gICAgICAgICAgICBFVkVOVFNbRVZFTlRTW1wiRVJST1JcIl0gPSAwXSA9IFwiRVJST1JcIjtcbiAgICAgICAgICAgIEVWRU5UU1tFVkVOVFNbXCJGQVRBTFwiXSA9IDFdID0gXCJGQVRBTFwiO1xuICAgICAgICAgICAgRVZFTlRTW0VWRU5UU1tcIkZSQU1FV09SS1wiXSA9IDJdID0gXCJGUkFNRVdPUktcIjtcbiAgICAgICAgICAgIEVWRU5UU1tFVkVOVFNbXCJDTEVBUlwiXSA9IDNdID0gXCJDTEVBUlwiO1xuICAgICAgICB9KShFcnJvcnMuRVZFTlRTIHx8IChFcnJvcnMuRVZFTlRTID0ge30pKTtcbiAgICAgICAgdmFyIEVWRU5UUyA9IEVycm9ycy5FVkVOVFM7XG4gICAgICAgIHZhciBFcnJvckhhbmRsZXIgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgICAgICAgICAgX19leHRlbmRzKEVycm9ySGFuZGxlciwgX3N1cGVyKTtcbiAgICAgICAgICAgIGZ1bmN0aW9uIEVycm9ySGFuZGxlcigpIHtcbiAgICAgICAgICAgICAgICBfc3VwZXIuY2FsbCh0aGlzLCBcIkVSUk9SXCIpO1xuICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgIGlmICh3aW5kb3cpIHtcbiAgICAgICAgICAgICAgICAgd2luZG93Lm9uZXJyb3IgPSBmdW5jdGlvbihlcnJvciwgdXJsLCBsaW5lKSB7XG4gICAgICAgICAgICAgICAgIHRoaXMuZmF0YWwoZXJyb3IgKyBcIlxcbmluOiBcIiArIHVybCArIFwiXFxubGluZTogXCIgKyBsaW5lLCB3aW5kb3cpO1xuICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIEVycm9ySGFuZGxlci5wcm90b3R5cGUuZXJyb3IgPSBmdW5jdGlvbiAobWVzc2FnZSwgdGhhdCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgwIC8qIEVSUk9SICovLCBtZXNzYWdlLCB0aGF0KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBFcnJvckhhbmRsZXIucHJvdG90eXBlLmZhdGFsID0gZnVuY3Rpb24gKG1lc3NhZ2UsIHRoYXQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoMSAvKiBGQVRBTCAqLywgbWVzc2FnZSwgdGhhdCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgRXJyb3JIYW5kbGVyLnByb3RvdHlwZS5mcmFtZXdvcmsgPSBmdW5jdGlvbiAobWVzc2FnZSwgZXhjZXB0aW9uLCB0aGF0KSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgZXhjZXB0aW9uO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiBFcnJvckhhbmRsZXI7XG4gICAgICAgIH0pKEZsdXNzLkV2ZW50Q2hhbm5lbC5DaGFubmVsZWRFbWl0dGVyKTtcbiAgICAgICAgdmFyIGVycm9ySGFuZGxlciA9IG5ldyBFcnJvckhhbmRsZXIoKTtcbiAgICAgICAgZnVuY3Rpb24gZ2V0RXJyb3JIYW5kbGVyKCkge1xuICAgICAgICAgICAgcmV0dXJuIGVycm9ySGFuZGxlcjtcbiAgICAgICAgfVxuICAgICAgICBFcnJvcnMuZ2V0RXJyb3JIYW5kbGVyID0gZ2V0RXJyb3JIYW5kbGVyO1xuICAgICAgICBmdW5jdGlvbiBlcnJvcihtZXNzYWdlLCB0aGF0KSB7XG4gICAgICAgICAgICByZXR1cm4gZXJyb3JIYW5kbGVyLmVycm9yKG1lc3NhZ2UsIHRoYXQpO1xuICAgICAgICB9XG4gICAgICAgIEVycm9ycy5lcnJvciA9IGVycm9yO1xuICAgICAgICBmdW5jdGlvbiBmYXRhbChtZXNzYWdlLCB0aGF0KSB7XG4gICAgICAgICAgICByZXR1cm4gZXJyb3JIYW5kbGVyLmZhdGFsKG1lc3NhZ2UsIHRoYXQpO1xuICAgICAgICB9XG4gICAgICAgIEVycm9ycy5mYXRhbCA9IGZhdGFsO1xuICAgICAgICBmdW5jdGlvbiBmcmFtZXdvcmsobWVzc2FnZSwgZXhjZW90aW9uLCB0aGF0KSB7XG4gICAgICAgICAgICByZXR1cm4gZXJyb3JIYW5kbGVyLmZyYW1ld29yayhtZXNzYWdlLCBleGNlb3Rpb24sIHRoYXQpO1xuICAgICAgICB9XG4gICAgICAgIEVycm9ycy5mcmFtZXdvcmsgPSBmcmFtZXdvcms7XG4gICAgfSkoRXJyb3JzID0gRmx1c3MuRXJyb3JzIHx8IChGbHVzcy5FcnJvcnMgPSB7fSkpO1xufSkoRmx1c3MgfHwgKEZsdXNzID0ge30pKTtcbmlmICh0eXBlb2YgZXhwb3J0cyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgIGV4cG9ydHMuRXJyb3JzID0gRmx1c3MuRXJyb3JzO1xufVxuaWYgKHR5cGVvZiB0aGlzW1wiZGVmaW5lXCJdID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICB0aGlzW1wiZGVmaW5lXCJdKFtdLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBGbHVzcy5FcnJvcnM7XG4gICAgfSk7XG59XG5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2Rpc3BhdGNoZXIudHNcIiAvPlxuLyoqXG4gKiBDcmVhdGVkIGJ5IFN0ZXBoYW4uU21vbGEgb24gMjguMTAuMjAxNC5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgRmx1c3M7XG4oZnVuY3Rpb24gKEZsdXNzKSB7XG4gICAgdmFyIEJhc2VBY3Rpb25zO1xuICAgIChmdW5jdGlvbiAoQmFzZUFjdGlvbnMpIHtcbiAgICAgICAgKGZ1bmN0aW9uIChBQ1RJT05TKSB7XG4gICAgICAgICAgICBBQ1RJT05TW0FDVElPTlNbXCJfX0FOWV9fXCJdID0gLTEwMDBdID0gXCJfX0FOWV9fXCI7XG4gICAgICAgICAgICBBQ1RJT05TW0FDVElPTlNbXCJVTkRPXCJdID0gLTIwMDBdID0gXCJVTkRPXCI7XG4gICAgICAgIH0pKEJhc2VBY3Rpb25zLkFDVElPTlMgfHwgKEJhc2VBY3Rpb25zLkFDVElPTlMgPSB7fSkpO1xuICAgICAgICB2YXIgQUNUSU9OUyA9IEJhc2VBY3Rpb25zLkFDVElPTlM7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZW5lcmljIGFjdGlvbiB0cmlnZ2VyIHRoYXQgY2FuIGJlIGZlZCBieSBwYXNzaW5nIHRoZSBhY3Rpb24gaWQgYW5kIHBhcmFtZXRlcnMuXG4gICAgICAgICAqIENhbiBiZSB1c2VkIGluIHNpdHVhdGlvbnMgd2hlcmUgYWN0aW9ucyBhcmUgdHJpZ2dlcmVkIGJhc2VkIG9uIGEgY29uZmlndXJhdGlvbi5cbiAgICAgICAgICpcbiAgICAgICAgICogRXhwbGljaXQgRnVuY3Rpb25zIGFyZSByZWNvbW1lbmRlZCBmb3IgYWxsIGFjdGlvbnMsIGJlY2F1c2UgdGhleSBtYWtlIGNvZGluZyBlYXNpZXJcbiAgICAgICAgICogYW5kIGNvZGUgbW9yZSByZWFkYWJsZVxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0gYWN0aW9uXG4gICAgICAgICAqIEBwYXJhbSBhcmdzXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiB0cmlnZ2VyQWN0aW9uKGFjdGlvbikge1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIF9pID0gMTsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICAgICAgYXJnc1tfaSAtIDFdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIEZsdXNzLkRpc3BhdGNoZXIuZ2V0RGlzcGF0Y2hlcigpLmRpc3BhdGNoQWN0aW9uLmFwcGx5KEZsdXNzLkRpc3BhdGNoZXIuZ2V0RGlzcGF0Y2hlcigpLCBbYWN0aW9uXS5jb25jYXQoYXJncykpO1xuICAgICAgICB9XG4gICAgICAgIEJhc2VBY3Rpb25zLnRyaWdnZXJBY3Rpb24gPSB0cmlnZ2VyQWN0aW9uO1xuICAgICAgICBmdW5jdGlvbiB1bmRvKCkge1xuICAgICAgICAgICAgRmx1c3MuRGlzcGF0Y2hlci5nZXREaXNwYXRjaGVyKCkuZGlzcGF0Y2hBY3Rpb24oLTIwMDAgLyogVU5ETyAqLyk7XG4gICAgICAgIH1cbiAgICAgICAgQmFzZUFjdGlvbnMudW5kbyA9IHVuZG87XG4gICAgfSkoQmFzZUFjdGlvbnMgPSBGbHVzcy5CYXNlQWN0aW9ucyB8fCAoRmx1c3MuQmFzZUFjdGlvbnMgPSB7fSkpO1xufSkoRmx1c3MgfHwgKEZsdXNzID0ge30pKTtcbmlmICh0eXBlb2YgZXhwb3J0cyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgIGV4cG9ydHMuQmFzZUFjdGlvbnMgPSBGbHVzcy5CYXNlQWN0aW9ucztcbn1cbmlmICh0eXBlb2YgdGhpc1tcImRlZmluZVwiXSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgdGhpc1tcImRlZmluZVwiXShbXSwgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gRmx1c3MuQmFzZUFjdGlvbnM7XG4gICAgfSk7XG59XG5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2Vycm9ycy50c1wiIC8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9ldmVudENoYW5uZWwudHNcIiAvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vYmFzZUFjdGlvbnMudHNcIiAvPlxuLyoqXG4gKiBDcmVhdGVkIGJ5IFN0ZXBoYW4uU21vbGEgb24gMjguMTAuMjAxNC5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19leHRlbmRzID0gdGhpcy5fX2V4dGVuZHMgfHwgZnVuY3Rpb24gKGQsIGIpIHtcbiAgICBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTtcbiAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICBfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZTtcbiAgICBkLnByb3RvdHlwZSA9IG5ldyBfXygpO1xufTtcbnZhciBGbHVzcztcbihmdW5jdGlvbiAoRmx1c3MpIHtcbiAgICB2YXIgRGlzcGF0Y2hlcjtcbiAgICAoZnVuY3Rpb24gKF9EaXNwYXRjaGVyKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDcmVhdGUgYSBtZW1lbnRvIG9iamVjdC5cbiAgICAgICAgICogQHBhcmFtIGluc3RhbmNlXG4gICAgICAgICAqIEBwYXJhbSBkYXRhXG4gICAgICAgICAqIEBwYXJhbSByZWRvXG4gICAgICAgICAqIEBwYXJhbSB1bmRvICAgICAgT3B0aW9uYWxseSB5b3UgY2FuIHByb3ZpZGUgYW4gYWN0aW9uIGZvciB1bmRvaW5nLCBpZiB0aGF0IGlzIHNpbXBsZXIgdGhhbiBzdG9yaW5nIGRhdGFcbiAgICAgICAgICogQHJldHVybnMge3tkYXRhOiBhbnksIHJlZG86IElBY3Rpb24sIGluc3RhbmNlOiBJVW5kb2FibGV9fVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlTWVtZW50byhpbnN0YW5jZSwgZGF0YSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBhY3Rpb246IC0xLFxuICAgICAgICAgICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgICAgICAgICAgcmVkbzogbnVsbCxcbiAgICAgICAgICAgICAgICB1bmRvOiBudWxsLFxuICAgICAgICAgICAgICAgIGluc3RhbmNlOiBpbnN0YW5jZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBfRGlzcGF0Y2hlci5jcmVhdGVNZW1lbnRvID0gY3JlYXRlTWVtZW50bztcbiAgICAgICAgLyoqXG4gICAgICAgICAqIENyZWF0ZSBhIHJlZG8gb2JqZWN0LlxuICAgICAgICAgKiBAcGFyYW0gYWN0aW9uXG4gICAgICAgICAqIEBwYXJhbSBkYXRhXG4gICAgICAgICAqIEByZXR1cm5zIHt7YWN0aW9uOiBudW1iZXIsIGRhdGE6IGFueX19XG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBjcmVhdGVSZWRvKGFjdGlvbiwgZGF0YSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBhY3Rpb246IGFjdGlvbixcbiAgICAgICAgICAgICAgICBkYXRhOiBkYXRhXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIF9EaXNwYXRjaGVyLmNyZWF0ZVJlZG8gPSBjcmVhdGVSZWRvO1xuICAgICAgICBmdW5jdGlvbiBjcmVhdGVVbmRvQWN0aW9uKGFjdGlvbikge1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIF9pID0gMTsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICAgICAgYXJnc1tfaSAtIDFdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgYWN0aW9uOiAtMSxcbiAgICAgICAgICAgICAgICBkYXRhOiBudWxsLFxuICAgICAgICAgICAgICAgIHJlZG86IG51bGwsXG4gICAgICAgICAgICAgICAgdW5kbzoge1xuICAgICAgICAgICAgICAgICAgICBhY3Rpb246IGFjdGlvbixcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogYXJnc1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgaW5zdGFuY2U6IG51bGxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgX0Rpc3BhdGNoZXIuY3JlYXRlVW5kb0FjdGlvbiA9IGNyZWF0ZVVuZG9BY3Rpb247XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBFdmVudHMgdGhhdCBhcmUgcmFpc2VkIGJ5IHRoZSB1bmRvIG1hbmFnZXIuXG4gICAgICAgICAqL1xuICAgICAgICAoZnVuY3Rpb24gKEVWRU5UUykge1xuICAgICAgICAgICAgRVZFTlRTW0VWRU5UU1tcIlVORE9cIl0gPSAwXSA9IFwiVU5ET1wiO1xuICAgICAgICAgICAgRVZFTlRTW0VWRU5UU1tcIlJFRE9cIl0gPSAxXSA9IFwiUkVET1wiO1xuICAgICAgICAgICAgRVZFTlRTW0VWRU5UU1tcIk1FTUVOVE9fU1RPUkVEXCJdID0gMl0gPSBcIk1FTUVOVE9fU1RPUkVEXCI7XG4gICAgICAgICAgICBFVkVOVFNbRVZFTlRTW1wiQ0xFQVJcIl0gPSAzXSA9IFwiQ0xFQVJcIjtcbiAgICAgICAgfSkoX0Rpc3BhdGNoZXIuRVZFTlRTIHx8IChfRGlzcGF0Y2hlci5FVkVOVFMgPSB7fSkpO1xuICAgICAgICB2YXIgRVZFTlRTID0gX0Rpc3BhdGNoZXIuRVZFTlRTO1xuICAgICAgICAvKipcbiAgICAgICAgICogSW1wbGVtZW50YXRpb24gb2YgYSBkaXNwYXRjaGVyIGFzIGRlc2NyaWJlZCBieSB0aGUgRkxVWCBwYXR0ZXJuLlxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIERpc3BhdGNoZXIgPSAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZnVuY3Rpb24gRGlzcGF0Y2hlcigpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9oYW5kbGVycyA9IHt9O1xuICAgICAgICAgICAgICAgIHRoaXMuX2Rpc3BhdGNoaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdGhpcy5fdW5kb2luZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHRoaXMuX2Rpc2FibGVkID0ge307XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBEaXNwYXRjaGVyLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2hhbmRsZXJzID0ge307XG4gICAgICAgICAgICAgICAgdGhpcy5fZGlzcGF0Y2hpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB0aGlzLl91bmRvaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdGhpcy5fZGlzYWJsZWQgPSB7fTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoRGlzcGF0Y2hlci5wcm90b3R5cGUsIFwidW5kb2luZ1wiLCB7XG4gICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl91bmRvaW5nO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBUaGUgYWN0dWFsIGRpc3BhdGNoXG4gICAgICAgICAgICAgKiBAcGFyYW0gZG9NZW1lbnRvXG4gICAgICAgICAgICAgKiBAcGFyYW0gdHlwZVxuICAgICAgICAgICAgICogQHBhcmFtIGFyZ3NcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgRGlzcGF0Y2hlci5wcm90b3R5cGUuZGlzcGF0Y2ggPSBmdW5jdGlvbiAoZG9NZW1lbnRvLCB0eXBlLCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1lbWVudG9zID0gW107XG4gICAgICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRvaXQgPSBmdW5jdGlvbiAoX190eXBlLCBkaXNwYXRjaCwgdHJ1ZVR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGF0Ll9oYW5kbGVyc1tfX3R5cGVdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5faGFuZGxlcnNbX190eXBlXS5mb3JFYWNoKGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkb01lbWVudG8gJiYgZFsxXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1lbWVudG8gPSBkWzFdLmFwcGx5KHRoYXQsIFt0cnVlVHlwZSB8fCBfX3R5cGVdLmNvbmNhdChhcmdzKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobWVtZW50bykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobWVtZW50bykgPT09IFwiW29iamVjdCBBcnJheV1cIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseShtZW1lbnRvcywgbWVtZW50byk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZW1lbnRvcy5wdXNoKG1lbWVudG8pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNwYXRjaChkWzBdLCBhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgZG9pdCh0eXBlLCBmdW5jdGlvbiAoaGFuZGxlciwgYXJncykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGRvaXQoLTEwMDAgLyogX19BTllfXyAqLywgZnVuY3Rpb24gKGhhbmRsZXIsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgW3R5cGUsIGFyZ3NdKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgdHlwZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtZW1lbnRvcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdldFVuZG9NYW5hZ2VyKCkuc3RvcmVNZW1lbnRvcyhtZW1lbnRvcywgdHlwZSwgY3JlYXRlUmVkbyh0eXBlLCBhcmdzKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1zZyA9IFwiSW50ZXJuYWwgZXJyb3IuIElmIHRoaXMgaGFwcGVucyBwbGVhc2UgY2hlY2sgaWYgaXQgd2FzIGEgdXNlciBlcnJvciBcXG5cIiArIFwidGhhdCBjYW4gYmUgZWl0aGVyIHByZXZlbnRlZCBvciBncmFjZWZ1bGx5IGhhbmRsZWQuXFxuXFxuXCI7XG4gICAgICAgICAgICAgICAgICAgIG1zZyArPSBcIkhhbmRsZWQgYWN0aW9uOiBcIiArIHR5cGUgKyBcIlxcblwiO1xuICAgICAgICAgICAgICAgICAgICBtc2cgKz0gXCJDcmVhdGUgbWVtZW50bzogXCIgKyAoZG9NZW1lbnRvID8gXCJ5ZXNcXG5cIiA6IFwibm9cXG5cIik7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhcmdTdHIgPSBcIlwiO1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXJnU3RyID0gSlNPTi5zdHJpbmdpZnkoYXJncywgbnVsbCwgMik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ1N0ciA9IFwiSXQncyBhIGNpcmN1bGFyIHN0cnVjdHVyZSA6LShcIjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBtc2cgKz0gXCJBcmd1bWVudHMgICAgIDogXCIgKyBhcmdTdHIgKyBcIlxcblwiO1xuICAgICAgICAgICAgICAgICAgICBtc2cgKz0gXCJNZW1lbnRvcyAgICAgIDogXCIgKyAobWVtZW50b3MgPyBKU09OLnN0cmluZ2lmeShtZW1lbnRvcywgbnVsbCwgMikgOiBcIm5vbmVcIikgKyBcIlxcblwiO1xuICAgICAgICAgICAgICAgICAgICBtc2cgKz0gXCJFeGNlcHRpb24gICAgIDogXCIgKyBlLm1lc3NhZ2UgKyBcIlxcblwiO1xuICAgICAgICAgICAgICAgICAgICBtc2cgKz0gXCJTdGFjayB0cmFjZSAgIDpcXG5cIiArIGUuc3RhY2sgKyBcIlxcblwiO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhtc2cpO1xuICAgICAgICAgICAgICAgICAgICBGbHVzcy5FcnJvcnMuZnJhbWV3b3JrKGUubWVzc2FnZSwgZSwgdGhhdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogRGlzcGF0Y2ggYW4gdW5kbyBhY3Rpb24uIFRoaXMgaXMgYmFzaWNhbGx5IHRoZSBzYW1lIGFzIGRpc3BhdGNoaW5nIGEgcmVndWxhclxuICAgICAgICAgICAgICogYWN0aW9uLCBidXQgdGhlIG1lbWVudG8gd2lsbCBub3QgYmUgY3JlYXRlZC5cbiAgICAgICAgICAgICAqIEBwYXJhbSB0eXBlXG4gICAgICAgICAgICAgKiBAcGFyYW0gYXJnc1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBEaXNwYXRjaGVyLnByb3RvdHlwZS5kaXNwYXRjaFVuZG9BY3Rpb24gPSBmdW5jdGlvbiAoYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBfaSA9IDE7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgICAgICAgICBhcmdzW19pIC0gMV0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX2Rpc2FibGVkW2FjdGlvbl0pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fdW5kb2luZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3BhdGNoKGZhbHNlLCBhY3Rpb24sIGFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGZpbmFsbHkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fdW5kb2luZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogRGlzcGF0Y2gsIGkuZS4gYnJvYWRjYXN0IGFuIGFjdGlvbiB0byBhbnlvbmUgdGhhdCdzIGludGVyZXN0ZWQuXG4gICAgICAgICAgICAgKiBAcGFyYW0gdHlwZVxuICAgICAgICAgICAgICogQHBhcmFtIGRhdGFcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgRGlzcGF0Y2hlci5wcm90b3R5cGUuZGlzcGF0Y2hBY3Rpb24gPSBmdW5jdGlvbiAoYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBfaSA9IDE7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgICAgICAgICBhcmdzW19pIC0gMV0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX2Rpc2FibGVkW2FjdGlvbl0pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwYXRjaCh0cnVlLCBhY3Rpb24sIGFyZ3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFN1YnNjcmliZSB0byBhbiBhY3Rpb24uXG4gICAgICAgICAgICAgKiBAcGFyYW0gYWN0aW9uXG4gICAgICAgICAgICAgKiBAcGFyYW0gaGFuZGxlclxuICAgICAgICAgICAgICogQHBhcmFtIG1lbWVudG9Qcm92aWRlclxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBEaXNwYXRjaGVyLnByb3RvdHlwZS5zdWJzY3JpYmVBY3Rpb24gPSBmdW5jdGlvbiAoYWN0aW9uLCBoYW5kbGVyLCBtZW1lbnRvUHJvdmlkZXIpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX2hhbmRsZXJzW2FjdGlvbl0pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5faGFuZGxlcnNbYWN0aW9uXSA9IFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5faGFuZGxlcnNbYWN0aW9uXS5pbmRleE9mKGhhbmRsZXIpID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9oYW5kbGVyc1thY3Rpb25dLnB1c2goW2hhbmRsZXIsIG1lbWVudG9Qcm92aWRlcl0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFVuc3Vic2NyaWJlIGFuIGFjdGlvbiBoYW5kbGVyLiBUaGlzIHJlbW92ZXMgYSBwb3RlbnRpYWwgbWVtZW50b1Byb3ZpZGVyIGFsc28uXG4gICAgICAgICAgICAgKiBAcGFyYW0gYWN0aW9uXG4gICAgICAgICAgICAgKiBAcGFyYW0gaGFuZGxlclxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBEaXNwYXRjaGVyLnByb3RvdHlwZS51bnN1YnNjcmliZUFjdGlvbiA9IGZ1bmN0aW9uIChhY3Rpb24sIGhhbmRsZXIpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5faGFuZGxlcnNbYWN0aW9uXSkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX2hhbmRsZXJzW2FjdGlvbl0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9oYW5kbGVyc1thY3Rpb25dW2ldWzBdID09PSBoYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5faGFuZGxlcnNbYWN0aW9uXS5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIERpc3BhdGNoZXIucHJvdG90eXBlLmRpc2FibGVBY3Rpb24gPSBmdW5jdGlvbiAoYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZGlzYWJsZWRbYWN0aW9uXSA9IHRydWU7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgRGlzcGF0Y2hlci5wcm90b3R5cGUuZW5hYmxlQWN0aW9uID0gZnVuY3Rpb24gKGFjdGlvbikge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9kaXNhYmxlZFthY3Rpb25dKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9kaXNhYmxlZFthY3Rpb25dO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gRGlzcGF0Y2hlcjtcbiAgICAgICAgfSkoKTtcbiAgICAgICAgdmFyIGRpc3BhdGNoZXIgPSBuZXcgRGlzcGF0Y2hlcigpO1xuICAgICAgICBmdW5jdGlvbiBnZXREaXNwYXRjaGVyKCkge1xuICAgICAgICAgICAgcmV0dXJuIGRpc3BhdGNoZXI7XG4gICAgICAgIH1cbiAgICAgICAgX0Rpc3BhdGNoZXIuZ2V0RGlzcGF0Y2hlciA9IGdldERpc3BhdGNoZXI7XG4gICAgICAgIGZ1bmN0aW9uIGRpc3BhdGNoKGFjdGlvbikge1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIF9pID0gMTsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICAgICAgYXJnc1tfaSAtIDFdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRpc3BhdGNoZXIuZGlzcGF0Y2hBY3Rpb24uYXBwbHkoZGlzcGF0Y2hlciwgW2FjdGlvbl0uY29uY2F0KGFyZ3MpKTtcbiAgICAgICAgfVxuICAgICAgICBfRGlzcGF0Y2hlci5kaXNwYXRjaCA9IGRpc3BhdGNoO1xuICAgICAgICBmdW5jdGlvbiBzdWJzY3JpYmVBY3Rpb24oYWN0aW9uLCBoYW5kbGVyLCBtZW1lbnRvUHJvdmlkZXIpIHtcbiAgICAgICAgICAgIGRpc3BhdGNoZXIuc3Vic2NyaWJlQWN0aW9uKGFjdGlvbiwgaGFuZGxlciwgbWVtZW50b1Byb3ZpZGVyKTtcbiAgICAgICAgfVxuICAgICAgICBfRGlzcGF0Y2hlci5zdWJzY3JpYmVBY3Rpb24gPSBzdWJzY3JpYmVBY3Rpb247XG4gICAgICAgIGZ1bmN0aW9uIHVuc3Vic2NyaWJlQWN0aW9uKGFjdGlvbiwgaGFuZGxlcikge1xuICAgICAgICAgICAgZGlzcGF0Y2hlci51bnN1YnNjcmliZUFjdGlvbihhY3Rpb24sIGhhbmRsZXIpO1xuICAgICAgICB9XG4gICAgICAgIF9EaXNwYXRjaGVyLnVuc3Vic2NyaWJlQWN0aW9uID0gdW5zdWJzY3JpYmVBY3Rpb247XG4gICAgICAgIGZ1bmN0aW9uIGRpc2FibGVBY3Rpb24oYWN0aW9uKSB7XG4gICAgICAgICAgICBkaXNwYXRjaGVyLmRpc2FibGVBY3Rpb24oYWN0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICBfRGlzcGF0Y2hlci5kaXNhYmxlQWN0aW9uID0gZGlzYWJsZUFjdGlvbjtcbiAgICAgICAgZnVuY3Rpb24gZW5hYmxlQWN0aW9uKGFjdGlvbikge1xuICAgICAgICAgICAgZGlzcGF0Y2hlci5lbmFibGVBY3Rpb24oYWN0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICBfRGlzcGF0Y2hlci5lbmFibGVBY3Rpb24gPSBlbmFibGVBY3Rpb247XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXNldHMgZXZlcnl0aGluZy4gTm8gcHJldmlvdXNseSBzdWJzY3JpYmVkIGhhbmRsZXIgd2lsbCBiZSBjYWxsZWQuXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiByZXNldCgpIHtcbiAgICAgICAgICAgIGRpc3BhdGNoZXIuZGVzdHJveSgpO1xuICAgICAgICAgICAgZGlzcGF0Y2hlciA9IG5ldyBEaXNwYXRjaGVyKCk7XG4gICAgICAgIH1cbiAgICAgICAgX0Rpc3BhdGNoZXIucmVzZXQgPSByZXNldDtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFVuZG8gbWFuYWdlciBpbXBsZW1lbnRhdGlvbnMuIEl0IHV0aWxpc2VzIHR3byBzdGFja3MgKHVuZG8sIHJlZG8pIHRvIHByb3ZpZGUgdGhlXG4gICAgICAgICAqIG5lY2Vzc2FyeSBtZWFucyB0byB1bmRvIGFuZCByZWRvIGFjdGlvbnMuXG4gICAgICAgICAqL1xuICAgICAgICB2YXIgVW5kb01hbmFnZXIgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgICAgICAgICAgX19leHRlbmRzKFVuZG9NYW5hZ2VyLCBfc3VwZXIpO1xuICAgICAgICAgICAgZnVuY3Rpb24gVW5kb01hbmFnZXIoKSB7XG4gICAgICAgICAgICAgICAgX3N1cGVyLmNhbGwodGhpcywgXCJVbmRvTWFuYWdlclwiKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgZ2V0RGlzcGF0Y2hlcigpLnN1YnNjcmliZUFjdGlvbigtMjAwMCAvKiBVTkRPICovLCB0aGlzLnVuZG8uYmluZCh0aGlzKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFN0b3JlIGEgbWVtZW50by4gVGhpcyBpcyBwdXQgb24gYSBzdGFjayB0aGF0IGlzIHVzZWQgZm9yIHVuZG9cbiAgICAgICAgICAgICAqIEBwYXJhbSBtZW1lbnRvc1xuICAgICAgICAgICAgICogQHBhcmFtIGFjdGlvbiAgICAgICAgdGhlIGFjdGlvbiB0aGF0IGNyZWF0ZWQgdGhlIG1lbWVudG9cbiAgICAgICAgICAgICAqIEBwYXJhbSByZWRvICAgICAgICAgIHRoZSBkYXRhIHRoYXQgY2FuIGJlIHVzZWQgdG8gcmVjcmVhdGUgdGhlIGFjdGlvblxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBVbmRvTWFuYWdlci5wcm90b3R5cGUuc3RvcmVNZW1lbnRvcyA9IGZ1bmN0aW9uIChtZW1lbnRvcywgYWN0aW9uLCByZWRvKSB7XG4gICAgICAgICAgICAgICAgaWYgKG1lbWVudG9zKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lbWVudG9zLmZvckVhY2goZnVuY3Rpb24gKG0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbS5yZWRvID0gcmVkbztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtLmFjdGlvbiA9IGFjdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWVtZW50b3MucHVzaChtZW1lbnRvcyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVkb3MgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KDIgLyogTUVNRU5UT19TVE9SRUQgKi8sIG1lbWVudG9zKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBVbmRvLiBQb3AgdGhlIGxhdGVzdCBtZW1lbnRvIGZyb20gdGhlIHN0YWNrIGFuZCByZXN0b3JlIHRoZSBhY2NvcmRpbmcgb2JqZWN0LiBUaGlzIHB1c2hlcyB0aGUgcmVkby1pbmZvXG4gICAgICAgICAgICAgKiBmcm9tIHRoZSBtZW1lbnRvIG9udG8gdGhlIHJlZG8gc3RhY2sgdG8gdXNlIGluIHJlZG8uXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFVuZG9NYW5hZ2VyLnByb3RvdHlwZS51bmRvID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciB1cyA9IHRoaXMubWVtZW50b3MucG9wKCk7XG4gICAgICAgICAgICAgICAgaWYgKHVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZWRvcyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICB1cy5mb3JFYWNoKGZ1bmN0aW9uICh1LCBpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodS51bmRvKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0RGlzcGF0Y2hlcigpLmRpc3BhdGNoVW5kb0FjdGlvbi5hcHBseShnZXREaXNwYXRjaGVyKCksIFt1LnVuZG8uYWN0aW9uXS5jb25jYXQodS51bmRvLmRhdGEpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHUuaW5zdGFuY2UucmVzdG9yZUZyb21NZW1lbnRvKHUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVkb3MucHVzaCh1LnJlZG8pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZWRvcy5wdXNoKHJlZG9zKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KDAgLyogVU5ETyAqLywgdXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFJlZG8uIFBvcCB0aGUgbGF0ZXN0IHJlZG8gYWN0aW9uIGZyb20gdGhlIHN0YWNrIGFuZCBkaXNwYXRjaCBpdC4gVGhpcyBkb2VzIG5vdCBzdG9yZSBhbnkgdW5kbyBkYXRhLFxuICAgICAgICAgICAgICogYXMgdGhlIGRpc3BhdGNoZXIgd2lsbCBkbyB0aGF0IHdoZW4gZGlzcGF0Y2hpbmcgdGhlIGFjdGlvbi5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgVW5kb01hbmFnZXIucHJvdG90eXBlLnJlZG8gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJzID0gdGhpcy5yZWRvcy5wb3AoKTtcbiAgICAgICAgICAgICAgICBpZiAocnMpIHtcbiAgICAgICAgICAgICAgICAgICAgcnMuZm9yRWFjaChmdW5jdGlvbiAocikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ2V0RGlzcGF0Y2hlcigpLmRpc3BhdGNoQWN0aW9uLmFwcGx5KGdldERpc3BhdGNoZXIoKSwgW3IuYWN0aW9uXS5jb25jYXQoci5kYXRhKSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoMSAvKiBSRURPICovLCBycyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ2xlYXIgYWxsIHN0YWNrc1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBVbmRvTWFuYWdlci5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5tZW1lbnRvcyA9IFtdO1xuICAgICAgICAgICAgICAgIHRoaXMucmVkb3MgPSBbXTtcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoMyAvKiBDTEVBUiAqLyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgVW5kb01hbmFnZXIucHJvdG90eXBlLmdldE1lbWVudG9zID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm1lbWVudG9zO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiBVbmRvTWFuYWdlcjtcbiAgICAgICAgfSkoRmx1c3MuRXZlbnRDaGFubmVsLkNoYW5uZWxlZEVtaXR0ZXIpO1xuICAgICAgICAvKipcbiAgICAgICAgICogU2luZ2xldG9uLlxuICAgICAgICAgKiBAdHlwZSB7VW5kb01hbmFnZXJ9XG4gICAgICAgICAqL1xuICAgICAgICB2YXIgdW0gPSBuZXcgVW5kb01hbmFnZXIoKTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCB0aGUgdW5kbyBtYW5hZ2VyLiBSZXR1cm5zIHRoZSBzaW5nbGUgaW5zdGFuY2UuXG4gICAgICAgICAqIEByZXR1cm5zIHtVbmRvTWFuYWdlcn1cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIGdldFVuZG9NYW5hZ2VyKCkge1xuICAgICAgICAgICAgcmV0dXJuIHVtO1xuICAgICAgICB9XG4gICAgICAgIF9EaXNwYXRjaGVyLmdldFVuZG9NYW5hZ2VyID0gZ2V0VW5kb01hbmFnZXI7XG4gICAgfSkoRGlzcGF0Y2hlciA9IEZsdXNzLkRpc3BhdGNoZXIgfHwgKEZsdXNzLkRpc3BhdGNoZXIgPSB7fSkpO1xufSkoRmx1c3MgfHwgKEZsdXNzID0ge30pKTtcbmlmICh0eXBlb2YgZXhwb3J0cyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgIGV4cG9ydHMuRGlzcGF0Y2hlciA9IEZsdXNzLkRpc3BhdGNoZXI7XG59XG5pZiAodHlwZW9mIHRoaXNbXCJkZWZpbmVcIl0gPT09IFwiZnVuY3Rpb25cIikge1xuICAgIHRoaXNbXCJkZWZpbmVcIl0oW10sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIEZsdXNzLkRpc3BhdGNoZXI7XG4gICAgfSk7XG59XG5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2Rpc3BhdGNoZXIudHNcIiAvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vZXZlbnRDaGFubmVsLnRzXCIgLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2Jhc2VBY3Rpb25zLnRzXCIgLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL3Rvb2xzLnRzXCIgLz5cbi8qKlxuICogQ3JlYXRlZCBieSBzdGVwaGFuIG9uIDAxLjExLjE0LlxuICovXG5cInVzZSBzdHJpY3RcIjtcbnZhciBfX2V4dGVuZHMgPSB0aGlzLl9fZXh0ZW5kcyB8fCBmdW5jdGlvbiAoZCwgYikge1xuICAgIGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdO1xuICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgIF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlO1xuICAgIGQucHJvdG90eXBlID0gbmV3IF9fKCk7XG59O1xudmFyIEZsdXNzO1xuKGZ1bmN0aW9uIChGbHVzcykge1xuICAgIHZhciBQbHVnaW5zO1xuICAgIChmdW5jdGlvbiAoUGx1Z2lucykge1xuICAgICAgICAvKipcbiAgICAgICAgICogQmFzZSBpbXBsZW1lbnRhdGlvbiBmb3IgYSBwbHVnaW4uIERvZXMgYWJzb2x1dGVseSBub3RoaW5nLlxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIEJhc2VQbHVnaW4gPSAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZnVuY3Rpb24gQmFzZVBsdWdpbigpIHtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIEJhc2VQbHVnaW4ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIChjb250YWluZXIsIGFjdGlvbikge1xuICAgICAgICAgICAgICAgIHZhciBhcmdzID0gW107XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAyOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgICAgICAgICAgYXJnc1tfaSAtIDJdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgQmFzZVBsdWdpbi5wcm90b3R5cGUuYWZ0ZXJGaW5pc2ggPSBmdW5jdGlvbiAoY29udGFpbmVyLCBhY3Rpb24pIHtcbiAgICAgICAgICAgICAgICB2YXIgYXJncyA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIF9pID0gMjsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGFyZ3NbX2kgLSAyXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIEJhc2VQbHVnaW4ucHJvdG90eXBlLmFmdGVyQWJvcnQgPSBmdW5jdGlvbiAoY29udGFpbmVyLCBhY3Rpb24pIHtcbiAgICAgICAgICAgICAgICB2YXIgYXJncyA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIF9pID0gMjsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGFyZ3NbX2kgLSAyXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIEJhc2VQbHVnaW4ucHJvdG90eXBlLmdldE1lbWVudG8gPSBmdW5jdGlvbiAoY29udGFpbmVyLCBhY3Rpb24pIHtcbiAgICAgICAgICAgICAgICB2YXIgYXJncyA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIF9pID0gMjsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGFyZ3NbX2kgLSAyXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIEJhc2VQbHVnaW4ucHJvdG90eXBlLnJlc3RvcmVGcm9tTWVtZW50byA9IGZ1bmN0aW9uIChjb250YWluZXIsIG1lbWVudG8pIHtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBCYXNlUGx1Z2luLnByb3RvdHlwZS5ob2xkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIEJhc2VQbHVnaW4ucHJvdG90eXBlLnJlbGVhc2UgPSBmdW5jdGlvbiAoYWN0aW9uKSB7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgQmFzZVBsdWdpbi5wcm90b3R5cGUuYWJvcnQgPSBmdW5jdGlvbiAoYWN0aW9uKSB7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIEJhc2VQbHVnaW47XG4gICAgICAgIH0pKCk7XG4gICAgICAgIFBsdWdpbnMuQmFzZVBsdWdpbiA9IEJhc2VQbHVnaW47XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDcmVhdGUgYSBQbHVnaW4uIFVzZSB0aGlzIHdoZW4geW91J3JlIHVzaW5nIHBsYWluIEphdmFTY3JpcHQuXG4gICAgICAgICAqIEBwYXJhbSBzcGVjXG4gICAgICAgICAqIEByZXR1cm5zIHthbnl9XG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBjcmVhdGVQbHVnaW4oc3BlYykge1xuICAgICAgICAgICAgcmV0dXJuIEZsdXNzLlRvb2xzLnN1YmNsYXNzKHNwZWMsIEJhc2VQbHVnaW4pO1xuICAgICAgICB9XG4gICAgICAgIFBsdWdpbnMuY3JlYXRlUGx1Z2luID0gY3JlYXRlUGx1Z2luO1xuICAgICAgICAvKipcbiAgICAgICAgICogQmFzZSBpbXBsZW1lbnRhdGlvbiBmb3IgYSBwbHVnaW4gY29udGFpbmVyLlxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIFBsdWdpbkNvbnRhaW5lciA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgICAgICAgICBfX2V4dGVuZHMoUGx1Z2luQ29udGFpbmVyLCBfc3VwZXIpO1xuICAgICAgICAgICAgZnVuY3Rpb24gUGx1Z2luQ29udGFpbmVyKGVtaXR0ZXJJZCkge1xuICAgICAgICAgICAgICAgIF9zdXBlci5jYWxsKHRoaXMsIGVtaXR0ZXJJZCB8fCBcIkNvbnRhaW5lclwiICsgRmx1c3MuVG9vbHMub2lkKHRoaXMpKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9wbHVnaW5zID0ge307XG4gICAgICAgICAgICAgICAgdGhpcy5fYW55UGx1Z2lucyA9IFtdO1xuICAgICAgICAgICAgICAgIHRoaXMuX3Byb3RvY29scyA9IHt9O1xuICAgICAgICAgICAgICAgIHRoaXMuX3J1bm5pbmdQbHVnaW5zID0ge307XG4gICAgICAgICAgICAgICAgdGhpcy5fbWVtZW50b3MgPSB7fTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xNjA2Nzk3L3VzZS1vZi1hcHBseS13aXRoLW5ldy1vcGVyYXRvci1pcy10aGlzLXBvc3NpYmxlXG4gICAgICAgICAgICAgKiBAcGFyYW0gY29uZmlnXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFBsdWdpbkNvbnRhaW5lci5wcm90b3R5cGUuY29uZmlndXJlID0gZnVuY3Rpb24gKGNvbmZpZykge1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGNvbnN0cnVjdChjb25zdHJ1Y3RvciwgYXJncykge1xuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBGKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3RydWN0b3IuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgRi5wcm90b3R5cGUgPSBjb25zdHJ1Y3Rvci5wcm90b3R5cGU7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgY29uZmlnLmZvckVhY2goZnVuY3Rpb24gKGFjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBhY3Rpb24ucGx1Z2lucy5mb3JFYWNoKGZ1bmN0aW9uIChwbHVnaW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwbHVnaW4ucGx1Z2luKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC53cmFwKGFjdGlvbi5hY3Rpb24sIGNvbnN0cnVjdChwbHVnaW4ucGx1Z2luLCBwbHVnaW4ucGFyYW1ldGVycykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC53cmFwKGFjdGlvbi5hY3Rpb24sIG5ldyBwbHVnaW4oKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFBsdWdpbkNvbnRhaW5lci5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBhY3Rpb24gaW4gdGhpcy5fcGx1Z2lucykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fcGx1Z2lucy5oYXNPd25Qcm9wZXJ0eShhY3Rpb24pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbCA9IHRoaXMuX3BsdWdpbnNbYWN0aW9uXS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAobC0tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kZXRhY2goYWN0aW9uLCB0aGlzLl9wbHVnaW5zW2FjdGlvbl1bbF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuX2FueVBsdWdpbnMgPSBbXTtcbiAgICAgICAgICAgICAgICB0aGlzLl9ydW5uaW5nUGx1Z2lucyA9IHt9O1xuICAgICAgICAgICAgICAgIC8vVE9ETzogRmluZCBhIHdheSB0byB1bnN1YnNjcmliZSBmcm9tIHRoZSBEaXNwYXRjaGVyXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgUGx1Z2luQ29udGFpbmVyLnByb3RvdHlwZS5wbHVnaW5Eb25lID0gZnVuY3Rpb24gKGFjdGlvbiwgYWJvcnQpIHtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBQbHVnaW5Db250YWluZXIucHJvdG90eXBlLmFib3J0QWN0aW9uID0gZnVuY3Rpb24gKGFjdGlvbikge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9ydW5uaW5nUGx1Z2luc1thY3Rpb25dICYmIHRoaXMuX3J1bm5pbmdQbHVnaW5zW2FjdGlvbl0ubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwbGcgPSB0aGlzLl9ydW5uaW5nUGx1Z2luc1thY3Rpb25dW3RoaXMuX3J1bm5pbmdQbHVnaW5zW2FjdGlvbl0ubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICAgICAgICAgIGlmIChwbGcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBsZy5hYm9ydChhY3Rpb24pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuX3J1bm5pbmdQbHVnaW5zW2FjdGlvbl0gPSBudWxsO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFBsdWdpbkNvbnRhaW5lci5wcm90b3R5cGUuYWJvcnQgPSBmdW5jdGlvbiAoYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBhY3Rpb24gPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgYWN0aW9uS2V5IGluIHRoaXMuX3Byb3RvY29scykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX3Byb3RvY29scy5oYXNPd25Qcm9wZXJ0eShhY3Rpb25LZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hYm9ydEFjdGlvbihhY3Rpb25LZXkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fcHJvdG9jb2xzW2FjdGlvbl0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWJvcnRBY3Rpb24oYWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFRoaXMgaGFuZGxlcyBhbiBhY3Rpb24gc2VudCBieSB0aGUgZGlzcGF0Y2hlciBhbmQgZGVsZWdhdGVzIGl0IHRvIHRoZSBwbHVnaW5zLlxuICAgICAgICAgICAgICogUGx1Z2lucyBhcmUgXCJ3cmFwcGVkXCIgYXJvdW5kIGVhY2ggb3RoZXIuIFRoZXkgYnVpbGQga2luZCBvZiBicmFja2V0cyBkZWZpbmVkIGJ5IHR3byBvZlxuICAgICAgICAgICAgICogdGhlaXIgbWV0aG9kczogcnVuIC0gb3BlbnMgdGhlIGJyYWNrZXRzXG4gICAgICAgICAgICAgKiAgICAgICAgICAgICAgICBmaW5pc2gvYWJvcnQgLSBjbG9zZXMgdGhlIGJyYWNrZXRzLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIFdlJ2xsIHRhbGsgYWJvdXQgZmluaXNoIGZyb20gbm93IG9uLiBUaGF0IGNhbiBiZSByZXBsYWNlZCBieSBhYm9ydCBldmVyeXdoZXJlLiBUaGUgZmlyc3QgcGx1Z2luIHRvIGFib3J0XG4gICAgICAgICAgICAgKiBmb3JjZXMgYWxsIHN1Y2NlZWRpbmcgcGx1Z2lucyB0byBhYm9ydCBhcyB3ZWxsLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIFNvIHdyYXBwaW5nIGluIHRoZSBvcmRlciBBLT5CLT5DIGxlYWRzIHRvIHRoZXNlIGJyYWNrZXRzOlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqICBydW5DLXJ1bkItcnVuQS1maW5pc2hBLWZpbmlzaEItZmluaXNoQ1xuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIGZpbmlzaCBpcyBvbmx5IGNhbGxlZCB3aGVuIHRoZSBwbHVnaW4gY2FsbHMgdGhlIGRvbmUtY2FsbGJhY2sgdGhhdCBpcyBwcm92aWRlZCB0byBpdHMgcnVuLW1ldGhvZC5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBTbyB0byBjb3JyZWN0bHkgZXhlY3V0ZSB0aGlzIFwiY2hhaW5cIiB3ZSBuZWVkIHRvIHdhaXQgZm9yIHRoZSBwbHVnaW5zIHRvIGNhbGwgdGhlaXIgZG9uZS1jYWxsYmFja3MgYmVmb3JlXG4gICAgICAgICAgICAgKiB3ZSBjYW4gcHJvY2VlZC4gQmVjYXVzZSB0aGUgcGx1Z2lucyBtYXkgY2FsbCB0aGVpciBkb25lLWNhbGxiYWNrIG91dHNpZGUgdGhlaXIgcnVuLW1ldGhvZCwgZS5nLiB0cmlnZ2VyZWQgYnlcbiAgICAgICAgICAgICAqIHVzZXIgaW50ZXJhY3Rpb24sIHdlIG5lZWQgdG8ga2VlcCB0cmFjayBvZiB3aGF0IHRoZSBwbHVnaW5zIGRpZCB1c2luZyBhIHByb3RvY29sLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIFRoYXQgcHJvdG9jb2wgbG9va3MgbGlrZSB0aGlzOlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqICB7XG4gICAgICogICAgaTogeyBkb25lOiBBIGZ1bmN0aW9uIHRoYXQgY2FsbHMgZWl0aGVyIGZpbmlzaCBvciBhYm9ydCBvbiB0aGUgaS10aCBwbHVnaW4sXG4gICAgICogICAgICAgICBhYm9ydDogZGlkIHRoZSBwbHVnaW4gYWJvcnQ/XG4gICAgICpcbiAgICAgKiAgICBpKzE6IC4uLlxuICAgICAqICB9XG4gICAgICpcbiAgICAgKiB0aGlzIHByb3RvY29sIGlzIGluaXRpYWxpemVkIGJ5IG51bGwgZW50cmllcyBmb3IgYWxsIHBsdWdpbnMuIFRoZW4gdGhlIHJ1bi1tZXRob2RzIGZvciBhbGwgcGx1Z2lucyBhcmUgY2FsbGVkLCBnaXZpbmcgdGhlbSBhIGRvbmVcbiAgICAgKiBjYWxsYmFjaywgdGhhdCBmaWxscyB0aGUgcHJvdG9jb2wuXG4gICAgICpcbiAgICAgKiBBZnRlciBldmVyeSBydW4tbWV0aG9kIHdlIGNoZWNrIGlmIHdlJ3JlIGF0IHRoZSBpbm5lcm1vc3QgcGx1Z2luIChBIGluIHRoZSBleGFtcGxlIGFib3ZlLCB0aGUgb25lIHRoYXQgZmlyc3Qgd3JhcHBlZCB0aGUgYWN0aW9uKS5cbiAgICAgKiBJZiB3ZSBhcmUsIHdlIHdvcmsgdGhyb3VnaCB0aGUgcHJvdG9jb2wgYXMgbG9uZyBhcyB0aGVyZSBhcmUgdmFsaWQgZW50cmllcy4gVGhlbiB3ZSB3YWl0IGZvciB0aGUgbmV4dCBkb25lLWNhbGxiYWNrIHRvIGJlIGNhbGxlZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBhY3Rpb25cbiAgICAgICAgICAgICAqIEBwYXJhbSBhcmdzXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFBsdWdpbkNvbnRhaW5lci5wcm90b3R5cGUuZG9IYW5kbGVBY3Rpb24gPSBmdW5jdGlvbiAocGx1Z2lucywgYWN0aW9uLCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3J1bm5pbmdQbHVnaW5zW2FjdGlvbl0gJiYgdGhpcy5fcnVubmluZ1BsdWdpbnNbYWN0aW9uXS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRVJST1IgY2FsbGluZyBhY3Rpb24gXCIgKyBhY3Rpb24gKyBcIi4gU2FtZSBhY3Rpb24gY2Fubm90IGJlIGNhbGxlZCBpbnNpZGUgaXRzZWxmIVwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgICAgIHZhciBjb21wb3NlQXJncyA9IGZ1bmN0aW9uIChwbHVnaW4sIGFjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW3RoYXQsIGFjdGlvbl0uY29uY2F0KGFyZ3MpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdGhpcy5fbWVtZW50b3NbYWN0aW9uXSA9IFtdO1xuICAgICAgICAgICAgICAgIHRoaXMuX3J1bm5pbmdQbHVnaW5zW2FjdGlvbl0gPSBbXTtcbiAgICAgICAgICAgICAgICB0aGlzLl9wcm90b2NvbHNbYWN0aW9uXSA9IFtdO1xuICAgICAgICAgICAgICAgIHBsdWdpbnMuZm9yRWFjaChmdW5jdGlvbiAocGx1Z2luKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQuX3Byb3RvY29sc1thY3Rpb25dLnB1c2goMCk7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQuX3J1bm5pbmdQbHVnaW5zW2FjdGlvbl0ucHVzaChwbHVnaW4pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHZhciBhYm9ydGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgcGx1Z2lucy5mb3JFYWNoKGZ1bmN0aW9uIChwbHVnaW4sIGkpIHtcbiAgICAgICAgICAgICAgICAgICAgKGZ1bmN0aW9uIChpbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRvbmUgPSBmdW5jdGlvbiAoYWJvcnQsIGRvbmVBY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleCA9IHRoYXQuZ2V0UGx1Z2luc0ZvckFjdGlvbihkb25lQWN0aW9uKS5pbmRleE9mKHBsdWdpbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5fcHJvdG9jb2xzW2RvbmVBY3Rpb25dW2luZGV4XSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGx1Z2luOiBwbHVnaW4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvbmU6IGZ1bmN0aW9uIChhYm9ydCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFib3J0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGx1Z2luLmFmdGVyQWJvcnQuYXBwbHkocGx1Z2luLCBjb21wb3NlQXJncyhwbHVnaW4sIGRvbmVBY3Rpb24pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBsdWdpbi5hZnRlckZpbmlzaC5hcHBseShwbHVnaW4sIGNvbXBvc2VBcmdzKHBsdWdpbiwgZG9uZUFjdGlvbikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhYm9ydDogYWJvcnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsYXN0ID0gdGhhdC5fcHJvdG9jb2xzW2RvbmVBY3Rpb25dLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAobGFzdC0tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGF0Ll9wcm90b2NvbHNbZG9uZUFjdGlvbl1bbGFzdF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFib3J0IHw9IHRoYXQuX3Byb3RvY29sc1tkb25lQWN0aW9uXVtsYXN0XS5hYm9ydDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuX3Byb3RvY29sc1tkb25lQWN0aW9uXVtsYXN0XS5kb25lKGFib3J0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuX3Byb3RvY29sc1tkb25lQWN0aW9uXS5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGF0Ll9ydW5uaW5nUGx1Z2luc1tkb25lQWN0aW9uXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuX3J1bm5pbmdQbHVnaW5zW2RvbmVBY3Rpb25dLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGF0Ll9ydW5uaW5nUGx1Z2luc1tkb25lQWN0aW9uXSB8fCAhdGhhdC5fcnVubmluZ1BsdWdpbnNbZG9uZUFjdGlvbl0ubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuZmluYWxpemVBY3Rpb24oZG9uZUFjdGlvbiwgYWJvcnQsIHRoYXQuZ2V0UGx1Z2luc0ZvckFjdGlvbihkb25lQWN0aW9uKSwgdGhhdC5fbWVtZW50b3NbZG9uZUFjdGlvbl0sIGFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaG9sZHMgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkb25lcyA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgcGx1Z2luW1wiaG9sZFwiXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBob2xkcyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgcGx1Z2luW1wiYWJvcnRcIl0gPSBmdW5jdGlvbiAoYWJvcnRBY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYWN0ID0gdHlwZW9mIGFib3J0QWN0aW9uID09PSBcInVuZGVmaW5lZFwiID8gYWN0aW9uIDogYWJvcnRBY3Rpb247XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9uZXNbYWN0XSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9uZSh0cnVlLCBhY3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFib3J0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBsdWdpbltcInJlbGVhc2VcIl0gPSBmdW5jdGlvbiAocmVsZWFzZUFjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhY3QgPSB0eXBlb2YgcmVsZWFzZUFjdGlvbiA9PT0gXCJ1bmRlZmluZWRcIiA/IGFjdGlvbiA6IHJlbGVhc2VBY3Rpb247XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRvbmVzW2FjdF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUGx1Z2luIHJlbGVhc2VkIHR3aWNlIGZvciBhY3Rpb24gXCIgKyBhY3QgKyBcIiEgUG9zc2libHkgY2FsbGVkIHJlbGVhc2UgYWZ0ZXIgYWJvcnQgb3IgdmljZSB2ZXJzYS5cIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb25lKGZhbHNlLCBhY3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb25lc1thY3RdID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFhYm9ydGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1lbWVudG8gPSBwbHVnaW4uZ2V0TWVtZW50by5hcHBseShwbHVnaW4sIGNvbXBvc2VBcmdzKHBsdWdpbiwgYWN0aW9uKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1lbWVudG8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVtZW50by5pbnN0YW5jZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3RvcmVGcm9tTWVtZW50bzogZnVuY3Rpb24gKG1lbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBsdWdpbi5yZXN0b3JlRnJvbU1lbWVudG8odGhhdCwgbWVtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5fbWVtZW50b3NbYWN0aW9uXS5wdXNoKG1lbWVudG8pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB3ZSBhYm9ydGVkOiBDbGVhbiB1cDogQWxsIFBsdWdpbnMgdGhhdCB3aGVyZSBzdGFydGVkIHVudGlsIG5vdyAob3V0ZXIpIHdpbGwgYmUgYWJvcnRlZC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPdGhlcnMgdGhhdCB3b3VsZCBoYXZlIGJlZW4gc3RhcnRlZCBhZnRlcndhcmRzIChpbm5lcikgd29uJ3QgYmUgY2FsbGVkIGF0IGFsbC4gKHNlZSBpZi1zdGF0ZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBhYm92ZSB0aGlzIGNvbW1lbnQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGx1Z2luLnJ1bi5hcHBseShwbHVnaW4sIGNvbXBvc2VBcmdzKHBsdWdpbiwgYWN0aW9uKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFib3J0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxhc3QgPSAodGhhdC5fcHJvdG9jb2xzW2FjdGlvbl0gJiYgdGhhdC5fcHJvdG9jb2xzW2FjdGlvbl0ubGVuZ3RoKSB8fCAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAobGFzdC0tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhhdC5fcHJvdG9jb2xzW2FjdGlvbl1bbGFzdF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0Ll9wcm90b2NvbHNbYWN0aW9uXVtsYXN0XS5kb25lKHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuX3Byb3RvY29sc1thY3Rpb25dLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5maW5hbGl6ZUFjdGlvbihhY3Rpb24sIHRydWUsIHRoYXQuZ2V0UGx1Z2luc0ZvckFjdGlvbihhY3Rpb24pLCBudWxsLCBhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaG9sZHMgJiYgIWRvbmVzW2FjdGlvbl0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb25lKGZhbHNlLCBhY3Rpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSkoaSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgUGx1Z2luQ29udGFpbmVyLnByb3RvdHlwZS5nZXRQbHVnaW5zRm9yQWN0aW9uID0gZnVuY3Rpb24gKGFjdGlvbikge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9wbHVnaW5zW2FjdGlvbl0gJiYgdGhpcy5fcGx1Z2luc1thY3Rpb25dLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fcGx1Z2luc1thY3Rpb25dO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0aGlzLl9hbnlQbHVnaW5zICYmIHRoaXMuX2FueVBsdWdpbnMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9hbnlQbHVnaW5zO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBQbHVnaW5Db250YWluZXIucHJvdG90eXBlLmhhbmRsZUFjdGlvbiA9IGZ1bmN0aW9uIChhY3Rpb24sIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvSGFuZGxlQWN0aW9uKHRoaXMuZ2V0UGx1Z2luc0ZvckFjdGlvbihhY3Rpb24pLCBhY3Rpb24sIGFyZ3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFib3J0KCk7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFBsdWdpbkNvbnRhaW5lci5wcm90b3R5cGUuZmluYWxpemVBY3Rpb24gPSBmdW5jdGlvbiAoYWN0aW9uLCBhYm9ydCwgcGx1Z2lucywgbWVtZW50b3MsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWFib3J0KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtZW1lbnRvcyAmJiBtZW1lbnRvcy5sZW5ndGggJiYgIUZsdXNzLkRpc3BhdGNoZXIuZ2V0RGlzcGF0Y2hlcigpLnVuZG9pbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIEZsdXNzLkRpc3BhdGNoZXIuZ2V0VW5kb01hbmFnZXIoKS5zdG9yZU1lbWVudG9zKG1lbWVudG9zLCBhY3Rpb24sIEZsdXNzLkRpc3BhdGNoZXIuY3JlYXRlUmVkbyhhY3Rpb24sIGFyZ3MpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLl9tZW1lbnRvc1thY3Rpb25dID0gbnVsbDtcbiAgICAgICAgICAgICAgICB0aGlzLl9ydW5uaW5nUGx1Z2luc1thY3Rpb25dID0gbnVsbDtcbiAgICAgICAgICAgICAgICB0aGlzLl9wcm90b2NvbHNbYWN0aW9uXSA9IG51bGw7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgUGx1Z2luQ29udGFpbmVyLnByb3RvdHlwZS5wcm92aWRlTWVtZW50b3MgPSBmdW5jdGlvbiAoYWN0aW9uLCBwbHVnaW5zLCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHBsdWdpbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJldCA9IFtdO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIHBsdWdpbnMuZm9yRWFjaChmdW5jdGlvbiAocGx1Z2luKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbWVtZW50byA9IHBsdWdpbi5nZXRNZW1lbnRvLmFwcGx5KHBsdWdpbiwgW3RoYXQsIGFjdGlvbl0uY29uY2F0KGFyZ3MpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtZW1lbnRvKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVtZW50by5pbnN0YW5jZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdG9yZUZyb21NZW1lbnRvOiBmdW5jdGlvbiAobWVtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwbHVnaW4ucmVzdG9yZUZyb21NZW1lbnRvKHRoYXQsIG1lbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldC5wdXNoKG1lbWVudG8pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJldC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIEZsdXNzLkRpc3BhdGNoZXIuZ2V0VW5kb01hbmFnZXIoKS5zdG9yZU1lbWVudG9zKHJldCwgYWN0aW9uLCBGbHVzcy5EaXNwYXRjaGVyLmNyZWF0ZVJlZG8oYWN0aW9uLCBhcmdzKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBUaGlzIHdyYXBzIHRoZSBoYW5kbGVyIGFyb3VuZCB0aGUgZXhpc3RpbmcgaGFuZGxlcnMgdGhlIGFjdGlvbiwgbWFraW5nIHRoZSBnaXZlbiBoYW5kbGVyIHRoZSBmaXJzdCB0byBiZSBjYWxsZWRcbiAgICAgICAgICAgICAqIGZvciB0aGF0IGFjdGlvbi5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBJZiB0aGUgQU5ZLUFjdGlvbiBpcyBnaXZlblxuICAgICAgICAgICAgICogICAqIFRoZSBoYW5kbGVyIGlzIHdyYXBwZWQgZm9yIGV2ZXJ5IGFjdGlvbiB0aGVyZSBhbHJlYWR5IGlzIGFub3RoZXIgaGFuZGxlclxuICAgICAgICAgICAgICogICAqIFRoZSBoYW5kbGVyIGlzIHdyYXBwZWQgYXJvdW5kIGFsbCBvdGhlciBhbnktaGFuZGxlciwgYW5kIHRoZXNlIGFyZSBjYWxsZWQgZm9yIGFsbCBhY3Rpb25zIHdpdGhvdXQgcmVndWxhciBoYW5kbGVyc1xuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIElmIGEgcmVndWxhciBhY3Rpb24gaXMgZ2l2ZW4gYW5kIGFueS1oYW5kbGVycyBleGlzdCB0aGUgZ2l2ZW4gaGFuZGxlciBpcyB3cmFwcGVkIGFyb3VuZCBhbGwgYW55LWhhbmRsZXJzIGZvciB0aGVcbiAgICAgICAgICAgICAqIGdpdmVuIGFjdGlvbi5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0gYWN0aW9uXG4gICAgICAgICAgICAgKiBAcGFyYW0gaGFuZGxlclxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBQbHVnaW5Db250YWluZXIucHJvdG90eXBlLndyYXAgPSBmdW5jdGlvbiAoYWN0aW9uLCBoYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbiA9PT0gLTEwMDAgLyogX19BTllfXyAqLykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fYW55UGx1Z2lucy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgICAgIEZsdXNzLkRpc3BhdGNoZXIuc3Vic2NyaWJlQWN0aW9uKC0xMDAwIC8qIF9fQU5ZX18gKi8sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYXJncyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3NbX2kgLSAwXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhY3QgPSBhcmdzLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoYXQuX3BsdWdpbnNbYWN0XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuaGFuZGxlQWN0aW9uKGFjdCwgYXJncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAodHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhcmdzID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAxOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJnc1tfaSAtIDFdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7IC8vIFdoZSBoYW5kbGUgdGhlIG1lbWVudG9zIG91cnNlbHZlc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGF0Ll9wbHVnaW5zW3R5cGVdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhhdC5wcm92aWRlTWVtZW50b3ModHlwZSwgYXJncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBhIGluIHRoaXMuX3BsdWdpbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9wbHVnaW5zLmhhc093blByb3BlcnR5KGEpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kb1dyYXAoYSwgaGFuZGxlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYW55UGx1Z2lucy51bnNoaWZ0KGhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9wbHVnaW5zW2FjdGlvbl0gJiYgdGhpcy5fYW55UGx1Z2lucy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsID0gdGhpcy5fYW55UGx1Z2lucy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAobC0tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kb1dyYXAoYWN0aW9uLCB0aGlzLl9hbnlQbHVnaW5zW2xdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvV3JhcChhY3Rpb24sIGhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBQbHVnaW5Db250YWluZXIucHJvdG90eXBlLmRvV3JhcCA9IGZ1bmN0aW9uIChhY3Rpb24sIGhhbmRsZXIpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX3BsdWdpbnNbYWN0aW9uXSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wbHVnaW5zW2FjdGlvbl0gPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICBGbHVzcy5EaXNwYXRjaGVyLnN1YnNjcmliZUFjdGlvbihhY3Rpb24sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhcmdzID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3NbX2kgLSAwXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0LmhhbmRsZUFjdGlvbihhY3Rpb24sIGFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAodHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIF9pID0gMTsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJnc1tfaSAtIDFdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsOyAvL3JldHVybiB0aGF0LnByb3ZpZGVNZW1lbnRvcyhhY3Rpb24sIGFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3BsdWdpbnNbYWN0aW9uXS5pbmRleE9mKGhhbmRsZXIpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJQbHVnaW4gaW5zdGFuY2VzIGNhbiBvbmx5IGJlIHVzZWQgb25jZSBwZXIgYWN0aW9uIVwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5fcGx1Z2luc1thY3Rpb25dLnVuc2hpZnQoaGFuZGxlcik7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgUGx1Z2luQ29udGFpbmVyLnByb3RvdHlwZS5kZXRhY2ggPSBmdW5jdGlvbiAoYWN0aW9uLCBoYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbiA9PT0gLTEwMDAgLyogX19BTllfXyAqLykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9hbnlQbHVnaW5zLnNwbGljZSh0aGlzLl9hbnlQbHVnaW5zLmluZGV4T2YoaGFuZGxlciksIDEpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBhIGluIHRoaXMuX3BsdWdpbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9wbHVnaW5zLmhhc093blByb3BlcnR5KGEpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcGx1Z2luc1thXS5zcGxpY2UodGhpcy5fcGx1Z2luc1thXS5pbmRleE9mKGhhbmRsZXIpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX3BsdWdpbnNbYWN0aW9uXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcGx1Z2luc1thY3Rpb25dLnNwbGljZSh0aGlzLl9wbHVnaW5zW2FjdGlvbl0uaW5kZXhPZihoYW5kbGVyKSwgMSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIFBsdWdpbkNvbnRhaW5lcjtcbiAgICAgICAgfSkoRmx1c3MuRXZlbnRDaGFubmVsLkNoYW5uZWxlZEVtaXR0ZXIpO1xuICAgICAgICBQbHVnaW5zLlBsdWdpbkNvbnRhaW5lciA9IFBsdWdpbkNvbnRhaW5lcjtcbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlQ29udGFpbmVyKHNwZWMpIHtcbiAgICAgICAgICAgIHJldHVybiBGbHVzcy5Ub29scy5zdWJjbGFzcyhzcGVjLCBQbHVnaW5Db250YWluZXIpO1xuICAgICAgICB9XG4gICAgICAgIFBsdWdpbnMuY3JlYXRlQ29udGFpbmVyID0gY3JlYXRlQ29udGFpbmVyO1xuICAgIH0pKFBsdWdpbnMgPSBGbHVzcy5QbHVnaW5zIHx8IChGbHVzcy5QbHVnaW5zID0ge30pKTtcbn0pKEZsdXNzIHx8IChGbHVzcyA9IHt9KSk7XG5pZiAodHlwZW9mIGV4cG9ydHMgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBleHBvcnRzLlBsdWdpbnMgPSBGbHVzcy5QbHVnaW5zO1xufVxuaWYgKHR5cGVvZiB0aGlzW1wiZGVmaW5lXCJdID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICB0aGlzW1wiZGVmaW5lXCJdKFtdLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBGbHVzcy5QbHVnaW5zO1xuICAgIH0pO1xufVxuIl19
