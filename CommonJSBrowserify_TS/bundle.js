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
 * Created by Stephan on 13.01.2015.
 */
"use strict";
var mtools = require('./lib/tools');
var mdispatcher = require('./lib/dispatcher');
var mplugins = require('./lib/plugins');
var mreactMixins = require('./lib/reactMixins');
var mstore = require('./lib/store');
var mstream = require('./lib/stream');
var mbaseActions = require('./lib/baseActions');
exports.Tools = mtools;
exports.BaseActions = mbaseActions;
exports.Dispatcher = mdispatcher;
exports.Plugins = mplugins;
exports.Store = mstore;
exports.Stream = mstream;
exports.ReactMixins = mreactMixins;

},{"./lib/baseActions":3,"./lib/dispatcher":4,"./lib/plugins":8,"./lib/reactMixins":9,"./lib/store":10,"./lib/stream":11,"./lib/tools":12}],3:[function(require,module,exports){
/**
 * Created by Stephan.Smola on 28.10.2014.
 */
"use strict";
var Dispatcher = require("./dispatcher");
(function (ACTIONS) {
    ACTIONS[ACTIONS["__ANY__"] = -1000] = "__ANY__";
    ACTIONS[ACTIONS["UNDO"] = -2000] = "UNDO";
})(exports.ACTIONS || (exports.ACTIONS = {}));
var ACTIONS = exports.ACTIONS;
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
    Dispatcher.getDispatcher().dispatchAction.apply(Dispatcher.getDispatcher(), [action].concat(args));
}
exports.triggerAction = triggerAction;
function undo() {
    Dispatcher.getDispatcher().dispatchAction(-2000 /* UNDO */);
}
exports.undo = undo;

//# sourceMappingURL=baseActions.js.map
},{"./dispatcher":4}],4:[function(require,module,exports){
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
var Errors = require("./errors");
var EventChannel = require("./eventChannel");
var Actions = require("./baseActions");
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
exports.createMemento = createMemento;
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
exports.createRedo = createRedo;
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
exports.createUndoAction = createUndoAction;
/**
 * Events that are raised by the undo manager.
 */
(function (EVENTS) {
    EVENTS[EVENTS["UNDO"] = 0] = "UNDO";
    EVENTS[EVENTS["REDO"] = 1] = "REDO";
    EVENTS[EVENTS["MEMENTO_STORED"] = 2] = "MEMENTO_STORED";
    EVENTS[EVENTS["CLEAR"] = 3] = "CLEAR";
})(exports.EVENTS || (exports.EVENTS = {}));
var EVENTS = exports.EVENTS;
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
            Errors.framework(e.message, e, that);
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
exports.getDispatcher = getDispatcher;
function dispatch(action) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    dispatcher.dispatchAction.apply(dispatcher, [action].concat(args));
}
exports.dispatch = dispatch;
function subscribeAction(action, handler, mementoProvider) {
    dispatcher.subscribeAction(action, handler, mementoProvider);
}
exports.subscribeAction = subscribeAction;
function unsubscribeAction(action, handler) {
    dispatcher.unsubscribeAction(action, handler);
}
exports.unsubscribeAction = unsubscribeAction;
function disableAction(action) {
    dispatcher.disableAction(action);
}
exports.disableAction = disableAction;
function enableAction(action) {
    dispatcher.enableAction(action);
}
exports.enableAction = enableAction;
/**
 * Resets everything. No previously subscribed handler will be called.
 */
function reset() {
    dispatcher.destroy();
    dispatcher = new Dispatcher();
}
exports.reset = reset;
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
})(EventChannel.ChanneledEmitter);
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
exports.getUndoManager = getUndoManager;

//# sourceMappingURL=dispatcher.js.map
},{"./baseActions":3,"./errors":6,"./eventChannel":7}],5:[function(require,module,exports){
/**
 * Created by Stephan.Smola on 28.10.2014.
 */
"use strict";
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
exports.Emitter = Emitter;

//# sourceMappingURL=emitter.js.map
},{}],6:[function(require,module,exports){
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
var EventChannel = require("./eventChannel");
(function (EVENTS) {
    EVENTS[EVENTS["ERROR"] = 0] = "ERROR";
    EVENTS[EVENTS["FATAL"] = 1] = "FATAL";
    EVENTS[EVENTS["FRAMEWORK"] = 2] = "FRAMEWORK";
    EVENTS[EVENTS["CLEAR"] = 3] = "CLEAR";
})(exports.EVENTS || (exports.EVENTS = {}));
var EVENTS = exports.EVENTS;
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
})(EventChannel.ChanneledEmitter);
var errorHandler = new ErrorHandler();
function getErrorHandler() {
    return errorHandler;
}
exports.getErrorHandler = getErrorHandler;
function error(message, that) {
    return errorHandler.error(message, that);
}
exports.error = error;
function fatal(message, that) {
    return errorHandler.fatal(message, that);
}
exports.fatal = fatal;
function framework(message, exceotion, that) {
    return errorHandler.framework(message, exceotion, that);
}
exports.framework = framework;

//# sourceMappingURL=errors.js.map
},{"./eventChannel":7}],7:[function(require,module,exports){
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
var Emitter = require("./emitter");
var Stream = require("./stream");
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
exports.getChannel = getChannel;
function subscribe(emitter, event, handler) {
    eventChannel.subscribe(emitter, event, handler);
}
exports.subscribe = subscribe;
function unsubscribe(emitter, event, handler) {
    eventChannel.unsubscribe(emitter, event, handler);
}
exports.unsubscribe = unsubscribe;
function channelEmit(emitterID, event) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    eventChannel.channelEmit(null, emitterID, event, args);
}
exports.channelEmit = channelEmit;
function unsubscribeAll(emitterID) {
    eventChannel.unsubscribeAll(emitterID);
}
exports.unsubscribeAll = unsubscribeAll;
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
})(Emitter.Emitter);
exports.ChanneledEmitter = ChanneledEmitter;
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
})(Stream.Stream);
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
exports.createEventStream = createEventStream;

//# sourceMappingURL=eventChannel.js.map
},{"./emitter":5,"./stream":11}],8:[function(require,module,exports){
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
var Dispatcher = require("./dispatcher");
var EventChannel = require("./eventChannel");
var BaseActions = require("./baseActions");
var Tools = require("./tools");
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
exports.BasePlugin = BasePlugin;
/**
 * Create a Plugin. Use this when you're using plain JavaScript.
 * @param spec
 * @returns {any}
 */
function createPlugin(spec) {
    return Tools.subclass(spec, BasePlugin);
}
exports.createPlugin = createPlugin;
/**
 * Base implementation for a plugin container.
 */
var PluginContainer = (function (_super) {
    __extends(PluginContainer, _super);
    function PluginContainer(emitterId) {
        _super.call(this, emitterId || "Container" + Tools.oid(this));
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
            if (mementos && mementos.length && !Dispatcher.getDispatcher().undoing) {
                Dispatcher.getUndoManager().storeMementos(mementos, action, Dispatcher.createRedo(action, args));
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
                Dispatcher.getUndoManager().storeMementos(ret, action, Dispatcher.createRedo(action, args));
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
                Dispatcher.subscribeAction(-1000 /* __ANY__ */, function () {
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
            Dispatcher.subscribeAction(action, function () {
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
})(EventChannel.ChanneledEmitter);
exports.PluginContainer = PluginContainer;
function createContainer(spec) {
    return Tools.subclass(spec, PluginContainer);
}
exports.createContainer = createContainer;

//# sourceMappingURL=plugins.js.map
},{"./baseActions":3,"./dispatcher":4,"./eventChannel":7,"./tools":12}],9:[function(require,module,exports){
/**
 * Created by Stephan on 10.01.2015.
 */
"use strict";
var Stream = require("./stream");
exports.componentLifecycle = {
    _willUnmount: null,
    componentDidMount: function () {
        this._willUnmount = Stream.createStream("component-unmount");
    },
    componentWillUnmount: function () {
        this._willUnmount.push(true);
        this._willUnmount.dispose();
    }
};

//# sourceMappingURL=reactMixins.js.map
},{"./stream":11}],10:[function(require,module,exports){
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
var Tools = require("./tools");
var Stream = require("./stream");
/**
 * Test if something is a store.
 * @param thing
 * @returns {boolean}
 */
function isStore(thing) {
    return thing instanceof RecordStore || thing instanceof ArrayStore || thing instanceof ImmutableRecord || thing instanceof ImmutableArray;
}
exports.isStore = isStore;
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
            var s = Stream.createStream("addProperty");
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
            var s = Stream.createStream("removeProperty");
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
            var s = Stream.createStream("updateProperty");
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
            var s = Stream.createStream("disposing");
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
        var stream = Stream.createStream();
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
            if (Tools.isArray(value)) {
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
        if (Tools.isArray(value)) {
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
exports.record = record;
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
        var adder = Stream.createStream();
        var remover = Stream.createStream();
        var updater = Stream.createStream();
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
            adder = Stream.createStream();
            remover = Stream.createStream();
            updater = Stream.createStream();
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
            var substream = this._substreams[Tools.oid(value)];
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
            this._substreams[Tools.oid(value)] = substream;
        }
    };
    /**
     * Call after removal!
     * @param value
     */
    ArrayStore.prototype.disposeSubstream = function (value) {
        if (isStore(value) && this._data.indexOf(value) === -1) {
            var subStream = this._substreams[Tools.oid(value)];
            if (subStream) {
                subStream.updates.dispose();
                delete this._substreams[Tools.oid(value)];
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
        var stream = Stream.createStream();
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
exports.array = array;

//# sourceMappingURL=store.js.map
},{"./stream":11,"./tools":12}],11:[function(require,module,exports){
/**
 * Created by Stephan on 27.12.2014.
 *
 * A simple implementation of a collection stream that supports reactive patterns.
 *
 */
"use strict";
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
exports.Stream = Stream;
/**
 * Create a new stream. The name is mostly for debugging purposes and can be omitted. It defaults to 'stream' then.
 * @param name
 * @returns {Stream}
 */
function createStream(name) {
    return new Stream(name || "stream");
}
exports.createStream = createStream;

//# sourceMappingURL=stream.js.map
},{}],12:[function(require,module,exports){
/**
 * Created by Stephan.Smola on 30.10.2014.
 */
"use strict";
/**
 * Determine the screen position and size of an element in the DOM
 * @param element
 * @returns {{x: number, y: number, w: number, h: number}}
 */
function elementPositionAndSize(element) {
    var rect = element.getBoundingClientRect();
    return { x: rect.left, y: rect.top, w: rect.width, h: rect.height };
}
exports.elementPositionAndSize = elementPositionAndSize;
var pfx = [
    { id: "webkit", camelCase: true },
    { id: "MS", camelCase: true },
    { id: "o", camelCase: true },
    { id: "", camelCase: false }
];
/**
 * Add event listener for prefixed events. As the camel casing of the event listeners is different
 * across browsers you need to specifiy the type camelcased starting with a capital letter. The function
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
exports.addPrefixedEventListener = addPrefixedEventListener;
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
exports.callCallback = callCallback;
/**
 * Check if something is an array.
 * @param thing
 * @returns {boolean}
 */
function isArray(thing) {
    return Object.prototype.toString.call(thing) === '[object Array]';
}
exports.isArray = isArray;
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
exports.oid = oid;
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
exports.subclass = subclass;

//# sourceMappingURL=tools.js.map
},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQ29tbW9uSlNCcm93c2VyaWZ5X1RTXFxtYWluLmpzIiwibm9kZV9tb2R1bGVzXFxmbHVzc1xcaW5kZXguanMiLCJub2RlX21vZHVsZXNcXGZsdXNzXFxsaWJcXGJhc2VBY3Rpb25zLmpzIiwibm9kZV9tb2R1bGVzXFxmbHVzc1xcbGliXFxkaXNwYXRjaGVyLmpzIiwibm9kZV9tb2R1bGVzXFxmbHVzc1xcbGliXFxlbWl0dGVyLmpzIiwibm9kZV9tb2R1bGVzXFxmbHVzc1xcbGliXFxlcnJvcnMuanMiLCJub2RlX21vZHVsZXNcXGZsdXNzXFxsaWJcXGV2ZW50Q2hhbm5lbC5qcyIsIm5vZGVfbW9kdWxlc1xcZmx1c3NcXGxpYlxccGx1Z2lucy5qcyIsIm5vZGVfbW9kdWxlc1xcZmx1c3NcXGxpYlxccmVhY3RNaXhpbnMuanMiLCJub2RlX21vZHVsZXNcXGZsdXNzXFxsaWJcXHN0b3JlLmpzIiwibm9kZV9tb2R1bGVzXFxmbHVzc1xcbGliXFxzdHJlYW0uanMiLCJub2RlX21vZHVsZXNcXGZsdXNzXFxsaWJcXHRvb2xzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuV0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcmJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDai9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vbm9kZV9tb2R1bGVzL2ZsdXNzL2ZsdXNzLmQudHNcIiAvPlxuLyoqXG4gKiBDcmVhdGVkIGJ5IFN0ZXBoYW4gb24gMTEuMDEuMjAxNS5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgRmx1c3MgPSByZXF1aXJlKFwiZmx1c3NcIik7XG52YXIgYXJyYXkgPSBGbHVzcy5TdG9yZS5hcnJheSgpO1xuYXJyYXkubmV3SXRlbXMuZm9yRWFjaChmdW5jdGlvbiAodXBkYXRlKSB7XG4gICAgZG9jdW1lbnQud3JpdGUodXBkYXRlLnZhbHVlICsgXCIgd2FzIGFkZGVkLjxicj5cIik7XG59KTtcbmRvY3VtZW50LndyaXRlKFwiPGgxPmZsdXNzIC0gY29tbW9uSlMsIGJyb3dzZXJpZnksIFR5cGVzY3JpcHQ8L2gxPlwiKTtcbmFycmF5LnB1c2goXCJPbmVcIik7XG5hcnJheS5wdXNoKDIpO1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1tYWluLmpzLm1hcCIsIi8qKlxuICogQ3JlYXRlZCBieSBTdGVwaGFuIG9uIDEzLjAxLjIwMTUuXG4gKi9cblwidXNlIHN0cmljdFwiO1xudmFyIG10b29scyA9IHJlcXVpcmUoJy4vbGliL3Rvb2xzJyk7XG52YXIgbWRpc3BhdGNoZXIgPSByZXF1aXJlKCcuL2xpYi9kaXNwYXRjaGVyJyk7XG52YXIgbXBsdWdpbnMgPSByZXF1aXJlKCcuL2xpYi9wbHVnaW5zJyk7XG52YXIgbXJlYWN0TWl4aW5zID0gcmVxdWlyZSgnLi9saWIvcmVhY3RNaXhpbnMnKTtcbnZhciBtc3RvcmUgPSByZXF1aXJlKCcuL2xpYi9zdG9yZScpO1xudmFyIG1zdHJlYW0gPSByZXF1aXJlKCcuL2xpYi9zdHJlYW0nKTtcbnZhciBtYmFzZUFjdGlvbnMgPSByZXF1aXJlKCcuL2xpYi9iYXNlQWN0aW9ucycpO1xuZXhwb3J0cy5Ub29scyA9IG10b29scztcbmV4cG9ydHMuQmFzZUFjdGlvbnMgPSBtYmFzZUFjdGlvbnM7XG5leHBvcnRzLkRpc3BhdGNoZXIgPSBtZGlzcGF0Y2hlcjtcbmV4cG9ydHMuUGx1Z2lucyA9IG1wbHVnaW5zO1xuZXhwb3J0cy5TdG9yZSA9IG1zdG9yZTtcbmV4cG9ydHMuU3RyZWFtID0gbXN0cmVhbTtcbmV4cG9ydHMuUmVhY3RNaXhpbnMgPSBtcmVhY3RNaXhpbnM7XG4iLCIvKipcbiAqIENyZWF0ZWQgYnkgU3RlcGhhbi5TbW9sYSBvbiAyOC4xMC4yMDE0LlxuICovXG5cInVzZSBzdHJpY3RcIjtcbnZhciBEaXNwYXRjaGVyID0gcmVxdWlyZShcIi4vZGlzcGF0Y2hlclwiKTtcbihmdW5jdGlvbiAoQUNUSU9OUykge1xuICAgIEFDVElPTlNbQUNUSU9OU1tcIl9fQU5ZX19cIl0gPSAtMTAwMF0gPSBcIl9fQU5ZX19cIjtcbiAgICBBQ1RJT05TW0FDVElPTlNbXCJVTkRPXCJdID0gLTIwMDBdID0gXCJVTkRPXCI7XG59KShleHBvcnRzLkFDVElPTlMgfHwgKGV4cG9ydHMuQUNUSU9OUyA9IHt9KSk7XG52YXIgQUNUSU9OUyA9IGV4cG9ydHMuQUNUSU9OUztcbi8qKlxuICogR2VuZXJpYyBhY3Rpb24gdHJpZ2dlciB0aGF0IGNhbiBiZSBmZWQgYnkgcGFzc2luZyB0aGUgYWN0aW9uIGlkIGFuZCBwYXJhbWV0ZXJzLlxuICogQ2FuIGJlIHVzZWQgaW4gc2l0dWF0aW9ucyB3aGVyZSBhY3Rpb25zIGFyZSB0cmlnZ2VyZWQgYmFzZWQgb24gYSBjb25maWd1cmF0aW9uLlxuICpcbiAqIEV4cGxpY2l0IEZ1bmN0aW9ucyBhcmUgcmVjb21tZW5kZWQgZm9yIGFsbCBhY3Rpb25zLCBiZWNhdXNlIHRoZXkgbWFrZSBjb2RpbmcgZWFzaWVyXG4gKiBhbmQgY29kZSBtb3JlIHJlYWRhYmxlXG4gKlxuICogQHBhcmFtIGFjdGlvblxuICogQHBhcmFtIGFyZ3NcbiAqL1xuZnVuY3Rpb24gdHJpZ2dlckFjdGlvbihhY3Rpb24pIHtcbiAgICB2YXIgYXJncyA9IFtdO1xuICAgIGZvciAodmFyIF9pID0gMTsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgIGFyZ3NbX2kgLSAxXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgfVxuICAgIERpc3BhdGNoZXIuZ2V0RGlzcGF0Y2hlcigpLmRpc3BhdGNoQWN0aW9uLmFwcGx5KERpc3BhdGNoZXIuZ2V0RGlzcGF0Y2hlcigpLCBbYWN0aW9uXS5jb25jYXQoYXJncykpO1xufVxuZXhwb3J0cy50cmlnZ2VyQWN0aW9uID0gdHJpZ2dlckFjdGlvbjtcbmZ1bmN0aW9uIHVuZG8oKSB7XG4gICAgRGlzcGF0Y2hlci5nZXREaXNwYXRjaGVyKCkuZGlzcGF0Y2hBY3Rpb24oLTIwMDAgLyogVU5ETyAqLyk7XG59XG5leHBvcnRzLnVuZG8gPSB1bmRvO1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1iYXNlQWN0aW9ucy5qcy5tYXAiLCIvKipcbiAqIENyZWF0ZWQgYnkgU3RlcGhhbi5TbW9sYSBvbiAyOC4xMC4yMDE0LlxuICovXG5cInVzZSBzdHJpY3RcIjtcbnZhciBfX2V4dGVuZHMgPSB0aGlzLl9fZXh0ZW5kcyB8fCBmdW5jdGlvbiAoZCwgYikge1xuICAgIGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdO1xuICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgIF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlO1xuICAgIGQucHJvdG90eXBlID0gbmV3IF9fKCk7XG59O1xudmFyIEVycm9ycyA9IHJlcXVpcmUoXCIuL2Vycm9yc1wiKTtcbnZhciBFdmVudENoYW5uZWwgPSByZXF1aXJlKFwiLi9ldmVudENoYW5uZWxcIik7XG52YXIgQWN0aW9ucyA9IHJlcXVpcmUoXCIuL2Jhc2VBY3Rpb25zXCIpO1xuLyoqXG4gKiBDcmVhdGUgYSBtZW1lbnRvIG9iamVjdC5cbiAqIEBwYXJhbSBpbnN0YW5jZVxuICogQHBhcmFtIGRhdGFcbiAqIEBwYXJhbSByZWRvXG4gKiBAcGFyYW0gdW5kbyAgICAgIE9wdGlvbmFsbHkgeW91IGNhbiBwcm92aWRlIGFuIGFjdGlvbiBmb3IgdW5kb2luZywgaWYgdGhhdCBpcyBzaW1wbGVyIHRoYW4gc3RvcmluZyBkYXRhXG4gKiBAcmV0dXJucyB7e2RhdGE6IGFueSwgcmVkbzogSUFjdGlvbiwgaW5zdGFuY2U6IElVbmRvYWJsZX19XG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZU1lbWVudG8oaW5zdGFuY2UsIGRhdGEpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBhY3Rpb246IC0xLFxuICAgICAgICBkYXRhOiBkYXRhLFxuICAgICAgICByZWRvOiBudWxsLFxuICAgICAgICB1bmRvOiBudWxsLFxuICAgICAgICBpbnN0YW5jZTogaW5zdGFuY2VcbiAgICB9O1xufVxuZXhwb3J0cy5jcmVhdGVNZW1lbnRvID0gY3JlYXRlTWVtZW50bztcbi8qKlxuICogQ3JlYXRlIGEgcmVkbyBvYmplY3QuXG4gKiBAcGFyYW0gYWN0aW9uXG4gKiBAcGFyYW0gZGF0YVxuICogQHJldHVybnMge3thY3Rpb246IG51bWJlciwgZGF0YTogYW55fX1cbiAqL1xuZnVuY3Rpb24gY3JlYXRlUmVkbyhhY3Rpb24sIGRhdGEpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBhY3Rpb246IGFjdGlvbixcbiAgICAgICAgZGF0YTogZGF0YVxuICAgIH07XG59XG5leHBvcnRzLmNyZWF0ZVJlZG8gPSBjcmVhdGVSZWRvO1xuZnVuY3Rpb24gY3JlYXRlVW5kb0FjdGlvbihhY3Rpb24pIHtcbiAgICB2YXIgYXJncyA9IFtdO1xuICAgIGZvciAodmFyIF9pID0gMTsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgIGFyZ3NbX2kgLSAxXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIGFjdGlvbjogLTEsXG4gICAgICAgIGRhdGE6IG51bGwsXG4gICAgICAgIHJlZG86IG51bGwsXG4gICAgICAgIHVuZG86IHtcbiAgICAgICAgICAgIGFjdGlvbjogYWN0aW9uLFxuICAgICAgICAgICAgZGF0YTogYXJnc1xuICAgICAgICB9LFxuICAgICAgICBpbnN0YW5jZTogbnVsbFxuICAgIH07XG59XG5leHBvcnRzLmNyZWF0ZVVuZG9BY3Rpb24gPSBjcmVhdGVVbmRvQWN0aW9uO1xuLyoqXG4gKiBFdmVudHMgdGhhdCBhcmUgcmFpc2VkIGJ5IHRoZSB1bmRvIG1hbmFnZXIuXG4gKi9cbihmdW5jdGlvbiAoRVZFTlRTKSB7XG4gICAgRVZFTlRTW0VWRU5UU1tcIlVORE9cIl0gPSAwXSA9IFwiVU5ET1wiO1xuICAgIEVWRU5UU1tFVkVOVFNbXCJSRURPXCJdID0gMV0gPSBcIlJFRE9cIjtcbiAgICBFVkVOVFNbRVZFTlRTW1wiTUVNRU5UT19TVE9SRURcIl0gPSAyXSA9IFwiTUVNRU5UT19TVE9SRURcIjtcbiAgICBFVkVOVFNbRVZFTlRTW1wiQ0xFQVJcIl0gPSAzXSA9IFwiQ0xFQVJcIjtcbn0pKGV4cG9ydHMuRVZFTlRTIHx8IChleHBvcnRzLkVWRU5UUyA9IHt9KSk7XG52YXIgRVZFTlRTID0gZXhwb3J0cy5FVkVOVFM7XG4vKipcbiAqIEltcGxlbWVudGF0aW9uIG9mIGEgZGlzcGF0Y2hlciBhcyBkZXNjcmliZWQgYnkgdGhlIEZMVVggcGF0dGVybi5cbiAqL1xudmFyIERpc3BhdGNoZXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIERpc3BhdGNoZXIoKSB7XG4gICAgICAgIHRoaXMuX2hhbmRsZXJzID0ge307XG4gICAgICAgIHRoaXMuX2Rpc3BhdGNoaW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX3VuZG9pbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fZGlzYWJsZWQgPSB7fTtcbiAgICB9XG4gICAgRGlzcGF0Y2hlci5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5faGFuZGxlcnMgPSB7fTtcbiAgICAgICAgdGhpcy5fZGlzcGF0Y2hpbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fdW5kb2luZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9kaXNhYmxlZCA9IHt9O1xuICAgIH07XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KERpc3BhdGNoZXIucHJvdG90eXBlLCBcInVuZG9pbmdcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl91bmRvaW5nO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBUaGUgYWN0dWFsIGRpc3BhdGNoXG4gICAgICogQHBhcmFtIGRvTWVtZW50b1xuICAgICAqIEBwYXJhbSB0eXBlXG4gICAgICogQHBhcmFtIGFyZ3NcbiAgICAgKi9cbiAgICBEaXNwYXRjaGVyLnByb3RvdHlwZS5kaXNwYXRjaCA9IGZ1bmN0aW9uIChkb01lbWVudG8sIHR5cGUsIGFyZ3MpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHZhciBtZW1lbnRvcyA9IFtdO1xuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgdmFyIGRvaXQgPSBmdW5jdGlvbiAoX190eXBlLCBkaXNwYXRjaCwgdHJ1ZVR5cGUpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhhdC5faGFuZGxlcnNbX190eXBlXSkge1xuICAgICAgICAgICAgICAgICAgICB0aGF0Ll9oYW5kbGVyc1tfX3R5cGVdLmZvckVhY2goZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkb01lbWVudG8gJiYgZFsxXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtZW1lbnRvID0gZFsxXS5hcHBseSh0aGF0LCBbdHJ1ZVR5cGUgfHwgX190eXBlXS5jb25jYXQoYXJncykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtZW1lbnRvKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobWVtZW50bykgPT09IFwiW29iamVjdCBBcnJheV1cIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkobWVtZW50b3MsIG1lbWVudG8pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVtZW50b3MucHVzaChtZW1lbnRvKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BhdGNoKGRbMF0sIGFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgZG9pdCh0eXBlLCBmdW5jdGlvbiAoaGFuZGxlciwgYXJncykge1xuICAgICAgICAgICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGRvaXQoLTEwMDAgLyogX19BTllfXyAqLywgZnVuY3Rpb24gKGhhbmRsZXIsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICBoYW5kbGVyLmFwcGx5KHRoaXMsIFt0eXBlLCBhcmdzXSk7XG4gICAgICAgICAgICB9LCB0eXBlKTtcbiAgICAgICAgICAgIGlmIChtZW1lbnRvcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBnZXRVbmRvTWFuYWdlcigpLnN0b3JlTWVtZW50b3MobWVtZW50b3MsIHR5cGUsIGNyZWF0ZVJlZG8odHlwZSwgYXJncykpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICB2YXIgbXNnID0gXCJJbnRlcm5hbCBlcnJvci4gSWYgdGhpcyBoYXBwZW5zIHBsZWFzZSBjaGVjayBpZiBpdCB3YXMgYSB1c2VyIGVycm9yIFxcblwiICsgXCJ0aGF0IGNhbiBiZSBlaXRoZXIgcHJldmVudGVkIG9yIGdyYWNlZnVsbHkgaGFuZGxlZC5cXG5cXG5cIjtcbiAgICAgICAgICAgIG1zZyArPSBcIkhhbmRsZWQgYWN0aW9uOiBcIiArIHR5cGUgKyBcIlxcblwiO1xuICAgICAgICAgICAgbXNnICs9IFwiQ3JlYXRlIG1lbWVudG86IFwiICsgKGRvTWVtZW50byA/IFwieWVzXFxuXCIgOiBcIm5vXFxuXCIpO1xuICAgICAgICAgICAgdmFyIGFyZ1N0ciA9IFwiXCI7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGFyZ1N0ciA9IEpTT04uc3RyaW5naWZ5KGFyZ3MsIG51bGwsIDIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBhcmdTdHIgPSBcIkl0J3MgYSBjaXJjdWxhciBzdHJ1Y3R1cmUgOi0oXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtc2cgKz0gXCJBcmd1bWVudHMgICAgIDogXCIgKyBhcmdTdHIgKyBcIlxcblwiO1xuICAgICAgICAgICAgbXNnICs9IFwiTWVtZW50b3MgICAgICA6IFwiICsgKG1lbWVudG9zID8gSlNPTi5zdHJpbmdpZnkobWVtZW50b3MsIG51bGwsIDIpIDogXCJub25lXCIpICsgXCJcXG5cIjtcbiAgICAgICAgICAgIG1zZyArPSBcIkV4Y2VwdGlvbiAgICAgOiBcIiArIGUubWVzc2FnZSArIFwiXFxuXCI7XG4gICAgICAgICAgICBtc2cgKz0gXCJTdGFjayB0cmFjZSAgIDpcXG5cIiArIGUuc3RhY2sgKyBcIlxcblwiO1xuICAgICAgICAgICAgY29uc29sZS5sb2cobXNnKTtcbiAgICAgICAgICAgIEVycm9ycy5mcmFtZXdvcmsoZS5tZXNzYWdlLCBlLCB0aGF0KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogRGlzcGF0Y2ggYW4gdW5kbyBhY3Rpb24uIFRoaXMgaXMgYmFzaWNhbGx5IHRoZSBzYW1lIGFzIGRpc3BhdGNoaW5nIGEgcmVndWxhclxuICAgICAqIGFjdGlvbiwgYnV0IHRoZSBtZW1lbnRvIHdpbGwgbm90IGJlIGNyZWF0ZWQuXG4gICAgICogQHBhcmFtIHR5cGVcbiAgICAgKiBAcGFyYW0gYXJnc1xuICAgICAqL1xuICAgIERpc3BhdGNoZXIucHJvdG90eXBlLmRpc3BhdGNoVW5kb0FjdGlvbiA9IGZ1bmN0aW9uIChhY3Rpb24pIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgX2kgPSAxOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIGFyZ3NbX2kgLSAxXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLl9kaXNhYmxlZFthY3Rpb25dKSB7XG4gICAgICAgICAgICB0aGlzLl91bmRvaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwYXRjaChmYWxzZSwgYWN0aW9uLCBhcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3VuZG9pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogRGlzcGF0Y2gsIGkuZS4gYnJvYWRjYXN0IGFuIGFjdGlvbiB0byBhbnlvbmUgdGhhdCdzIGludGVyZXN0ZWQuXG4gICAgICogQHBhcmFtIHR5cGVcbiAgICAgKiBAcGFyYW0gZGF0YVxuICAgICAqL1xuICAgIERpc3BhdGNoZXIucHJvdG90eXBlLmRpc3BhdGNoQWN0aW9uID0gZnVuY3Rpb24gKGFjdGlvbikge1xuICAgICAgICB2YXIgYXJncyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDE7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgYXJnc1tfaSAtIDFdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuX2Rpc2FibGVkW2FjdGlvbl0pIHtcbiAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2godHJ1ZSwgYWN0aW9uLCBhcmdzKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogU3Vic2NyaWJlIHRvIGFuIGFjdGlvbi5cbiAgICAgKiBAcGFyYW0gYWN0aW9uXG4gICAgICogQHBhcmFtIGhhbmRsZXJcbiAgICAgKiBAcGFyYW0gbWVtZW50b1Byb3ZpZGVyXG4gICAgICovXG4gICAgRGlzcGF0Y2hlci5wcm90b3R5cGUuc3Vic2NyaWJlQWN0aW9uID0gZnVuY3Rpb24gKGFjdGlvbiwgaGFuZGxlciwgbWVtZW50b1Byb3ZpZGVyKSB7XG4gICAgICAgIGlmICghdGhpcy5faGFuZGxlcnNbYWN0aW9uXSkge1xuICAgICAgICAgICAgdGhpcy5faGFuZGxlcnNbYWN0aW9uXSA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9oYW5kbGVyc1thY3Rpb25dLmluZGV4T2YoaGFuZGxlcikgPT09IC0xKSB7XG4gICAgICAgICAgICB0aGlzLl9oYW5kbGVyc1thY3Rpb25dLnB1c2goW2hhbmRsZXIsIG1lbWVudG9Qcm92aWRlcl0pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBVbnN1YnNjcmliZSBhbiBhY3Rpb24gaGFuZGxlci4gVGhpcyByZW1vdmVzIGEgcG90ZW50aWFsIG1lbWVudG9Qcm92aWRlciBhbHNvLlxuICAgICAqIEBwYXJhbSBhY3Rpb25cbiAgICAgKiBAcGFyYW0gaGFuZGxlclxuICAgICAqL1xuICAgIERpc3BhdGNoZXIucHJvdG90eXBlLnVuc3Vic2NyaWJlQWN0aW9uID0gZnVuY3Rpb24gKGFjdGlvbiwgaGFuZGxlcikge1xuICAgICAgICBpZiAodGhpcy5faGFuZGxlcnNbYWN0aW9uXSkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl9oYW5kbGVyc1thY3Rpb25dLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2hhbmRsZXJzW2FjdGlvbl1baV1bMF0gPT09IGhhbmRsZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5faGFuZGxlcnNbYWN0aW9uXS5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIERpc3BhdGNoZXIucHJvdG90eXBlLmRpc2FibGVBY3Rpb24gPSBmdW5jdGlvbiAoYWN0aW9uKSB7XG4gICAgICAgIHRoaXMuX2Rpc2FibGVkW2FjdGlvbl0gPSB0cnVlO1xuICAgIH07XG4gICAgRGlzcGF0Y2hlci5wcm90b3R5cGUuZW5hYmxlQWN0aW9uID0gZnVuY3Rpb24gKGFjdGlvbikge1xuICAgICAgICBpZiAodGhpcy5fZGlzYWJsZWRbYWN0aW9uXSkge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX2Rpc2FibGVkW2FjdGlvbl07XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBEaXNwYXRjaGVyO1xufSkoKTtcbnZhciBkaXNwYXRjaGVyID0gbmV3IERpc3BhdGNoZXIoKTtcbmZ1bmN0aW9uIGdldERpc3BhdGNoZXIoKSB7XG4gICAgcmV0dXJuIGRpc3BhdGNoZXI7XG59XG5leHBvcnRzLmdldERpc3BhdGNoZXIgPSBnZXREaXNwYXRjaGVyO1xuZnVuY3Rpb24gZGlzcGF0Y2goYWN0aW9uKSB7XG4gICAgdmFyIGFyZ3MgPSBbXTtcbiAgICBmb3IgKHZhciBfaSA9IDE7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICBhcmdzW19pIC0gMV0gPSBhcmd1bWVudHNbX2ldO1xuICAgIH1cbiAgICBkaXNwYXRjaGVyLmRpc3BhdGNoQWN0aW9uLmFwcGx5KGRpc3BhdGNoZXIsIFthY3Rpb25dLmNvbmNhdChhcmdzKSk7XG59XG5leHBvcnRzLmRpc3BhdGNoID0gZGlzcGF0Y2g7XG5mdW5jdGlvbiBzdWJzY3JpYmVBY3Rpb24oYWN0aW9uLCBoYW5kbGVyLCBtZW1lbnRvUHJvdmlkZXIpIHtcbiAgICBkaXNwYXRjaGVyLnN1YnNjcmliZUFjdGlvbihhY3Rpb24sIGhhbmRsZXIsIG1lbWVudG9Qcm92aWRlcik7XG59XG5leHBvcnRzLnN1YnNjcmliZUFjdGlvbiA9IHN1YnNjcmliZUFjdGlvbjtcbmZ1bmN0aW9uIHVuc3Vic2NyaWJlQWN0aW9uKGFjdGlvbiwgaGFuZGxlcikge1xuICAgIGRpc3BhdGNoZXIudW5zdWJzY3JpYmVBY3Rpb24oYWN0aW9uLCBoYW5kbGVyKTtcbn1cbmV4cG9ydHMudW5zdWJzY3JpYmVBY3Rpb24gPSB1bnN1YnNjcmliZUFjdGlvbjtcbmZ1bmN0aW9uIGRpc2FibGVBY3Rpb24oYWN0aW9uKSB7XG4gICAgZGlzcGF0Y2hlci5kaXNhYmxlQWN0aW9uKGFjdGlvbik7XG59XG5leHBvcnRzLmRpc2FibGVBY3Rpb24gPSBkaXNhYmxlQWN0aW9uO1xuZnVuY3Rpb24gZW5hYmxlQWN0aW9uKGFjdGlvbikge1xuICAgIGRpc3BhdGNoZXIuZW5hYmxlQWN0aW9uKGFjdGlvbik7XG59XG5leHBvcnRzLmVuYWJsZUFjdGlvbiA9IGVuYWJsZUFjdGlvbjtcbi8qKlxuICogUmVzZXRzIGV2ZXJ5dGhpbmcuIE5vIHByZXZpb3VzbHkgc3Vic2NyaWJlZCBoYW5kbGVyIHdpbGwgYmUgY2FsbGVkLlxuICovXG5mdW5jdGlvbiByZXNldCgpIHtcbiAgICBkaXNwYXRjaGVyLmRlc3Ryb3koKTtcbiAgICBkaXNwYXRjaGVyID0gbmV3IERpc3BhdGNoZXIoKTtcbn1cbmV4cG9ydHMucmVzZXQgPSByZXNldDtcbi8qKlxuICogVW5kbyBtYW5hZ2VyIGltcGxlbWVudGF0aW9ucy4gSXQgdXRpbGlzZXMgdHdvIHN0YWNrcyAodW5kbywgcmVkbykgdG8gcHJvdmlkZSB0aGVcbiAqIG5lY2Vzc2FyeSBtZWFucyB0byB1bmRvIGFuZCByZWRvIGFjdGlvbnMuXG4gKi9cbnZhciBVbmRvTWFuYWdlciA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKFVuZG9NYW5hZ2VyLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIFVuZG9NYW5hZ2VyKCkge1xuICAgICAgICBfc3VwZXIuY2FsbCh0aGlzLCBcIlVuZG9NYW5hZ2VyXCIpO1xuICAgICAgICB0aGlzLmNsZWFyKCk7XG4gICAgICAgIGdldERpc3BhdGNoZXIoKS5zdWJzY3JpYmVBY3Rpb24oLTIwMDAgLyogVU5ETyAqLywgdGhpcy51bmRvLmJpbmQodGhpcykpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTdG9yZSBhIG1lbWVudG8uIFRoaXMgaXMgcHV0IG9uIGEgc3RhY2sgdGhhdCBpcyB1c2VkIGZvciB1bmRvXG4gICAgICogQHBhcmFtIG1lbWVudG9zXG4gICAgICogQHBhcmFtIGFjdGlvbiAgICAgICAgdGhlIGFjdGlvbiB0aGF0IGNyZWF0ZWQgdGhlIG1lbWVudG9cbiAgICAgKiBAcGFyYW0gcmVkbyAgICAgICAgICB0aGUgZGF0YSB0aGF0IGNhbiBiZSB1c2VkIHRvIHJlY3JlYXRlIHRoZSBhY3Rpb25cbiAgICAgKi9cbiAgICBVbmRvTWFuYWdlci5wcm90b3R5cGUuc3RvcmVNZW1lbnRvcyA9IGZ1bmN0aW9uIChtZW1lbnRvcywgYWN0aW9uLCByZWRvKSB7XG4gICAgICAgIGlmIChtZW1lbnRvcykge1xuICAgICAgICAgICAgbWVtZW50b3MuZm9yRWFjaChmdW5jdGlvbiAobSkge1xuICAgICAgICAgICAgICAgIGlmIChtKSB7XG4gICAgICAgICAgICAgICAgICAgIG0ucmVkbyA9IHJlZG87XG4gICAgICAgICAgICAgICAgICAgIG0uYWN0aW9uID0gYWN0aW9uO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5tZW1lbnRvcy5wdXNoKG1lbWVudG9zKTtcbiAgICAgICAgICAgIHRoaXMucmVkb3MgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuZW1pdCgyIC8qIE1FTUVOVE9fU1RPUkVEICovLCBtZW1lbnRvcyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFVuZG8uIFBvcCB0aGUgbGF0ZXN0IG1lbWVudG8gZnJvbSB0aGUgc3RhY2sgYW5kIHJlc3RvcmUgdGhlIGFjY29yZGluZyBvYmplY3QuIFRoaXMgcHVzaGVzIHRoZSByZWRvLWluZm9cbiAgICAgKiBmcm9tIHRoZSBtZW1lbnRvIG9udG8gdGhlIHJlZG8gc3RhY2sgdG8gdXNlIGluIHJlZG8uXG4gICAgICovXG4gICAgVW5kb01hbmFnZXIucHJvdG90eXBlLnVuZG8gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB1cyA9IHRoaXMubWVtZW50b3MucG9wKCk7XG4gICAgICAgIGlmICh1cykge1xuICAgICAgICAgICAgdmFyIHJlZG9zID0gW107XG4gICAgICAgICAgICB1cy5mb3JFYWNoKGZ1bmN0aW9uICh1LCBpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHUudW5kbykge1xuICAgICAgICAgICAgICAgICAgICBnZXREaXNwYXRjaGVyKCkuZGlzcGF0Y2hVbmRvQWN0aW9uLmFwcGx5KGdldERpc3BhdGNoZXIoKSwgW3UudW5kby5hY3Rpb25dLmNvbmNhdCh1LnVuZG8uZGF0YSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdS5pbnN0YW5jZS5yZXN0b3JlRnJvbU1lbWVudG8odSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghaSkge1xuICAgICAgICAgICAgICAgICAgICByZWRvcy5wdXNoKHUucmVkbyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLnJlZG9zLnB1c2gocmVkb3MpO1xuICAgICAgICAgICAgdGhpcy5lbWl0KDAgLyogVU5ETyAqLywgdXMpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBSZWRvLiBQb3AgdGhlIGxhdGVzdCByZWRvIGFjdGlvbiBmcm9tIHRoZSBzdGFjayBhbmQgZGlzcGF0Y2ggaXQuIFRoaXMgZG9lcyBub3Qgc3RvcmUgYW55IHVuZG8gZGF0YSxcbiAgICAgKiBhcyB0aGUgZGlzcGF0Y2hlciB3aWxsIGRvIHRoYXQgd2hlbiBkaXNwYXRjaGluZyB0aGUgYWN0aW9uLlxuICAgICAqL1xuICAgIFVuZG9NYW5hZ2VyLnByb3RvdHlwZS5yZWRvID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcnMgPSB0aGlzLnJlZG9zLnBvcCgpO1xuICAgICAgICBpZiAocnMpIHtcbiAgICAgICAgICAgIHJzLmZvckVhY2goZnVuY3Rpb24gKHIpIHtcbiAgICAgICAgICAgICAgICBnZXREaXNwYXRjaGVyKCkuZGlzcGF0Y2hBY3Rpb24uYXBwbHkoZ2V0RGlzcGF0Y2hlcigpLCBbci5hY3Rpb25dLmNvbmNhdChyLmRhdGEpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5lbWl0KDEgLyogUkVETyAqLywgcnMpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBDbGVhciBhbGwgc3RhY2tzXG4gICAgICovXG4gICAgVW5kb01hbmFnZXIucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLm1lbWVudG9zID0gW107XG4gICAgICAgIHRoaXMucmVkb3MgPSBbXTtcbiAgICAgICAgdGhpcy5lbWl0KDMgLyogQ0xFQVIgKi8pO1xuICAgIH07XG4gICAgVW5kb01hbmFnZXIucHJvdG90eXBlLmdldE1lbWVudG9zID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5tZW1lbnRvcztcbiAgICB9O1xuICAgIHJldHVybiBVbmRvTWFuYWdlcjtcbn0pKEV2ZW50Q2hhbm5lbC5DaGFubmVsZWRFbWl0dGVyKTtcbi8qKlxuICogU2luZ2xldG9uLlxuICogQHR5cGUge1VuZG9NYW5hZ2VyfVxuICovXG52YXIgdW0gPSBuZXcgVW5kb01hbmFnZXIoKTtcbi8qKlxuICogR2V0IHRoZSB1bmRvIG1hbmFnZXIuIFJldHVybnMgdGhlIHNpbmdsZSBpbnN0YW5jZS5cbiAqIEByZXR1cm5zIHtVbmRvTWFuYWdlcn1cbiAqL1xuZnVuY3Rpb24gZ2V0VW5kb01hbmFnZXIoKSB7XG4gICAgcmV0dXJuIHVtO1xufVxuZXhwb3J0cy5nZXRVbmRvTWFuYWdlciA9IGdldFVuZG9NYW5hZ2VyO1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1kaXNwYXRjaGVyLmpzLm1hcCIsIi8qKlxuICogQ3JlYXRlZCBieSBTdGVwaGFuLlNtb2xhIG9uIDI4LjEwLjIwMTQuXG4gKi9cblwidXNlIHN0cmljdFwiO1xuLyoqXG4gKiBBbiBldmVudC1lbWl0dGVyXG4gKi9cbnZhciBFbWl0dGVyID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBFbWl0dGVyKCkge1xuICAgIH1cbiAgICBFbWl0dGVyLnByb3RvdHlwZS5zdWJzY3JpYmUgPSBmdW5jdGlvbiAoZXZlbnQsIGhhbmRsZXIpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9ldmVudEhhbmRsZXJzKSB7XG4gICAgICAgICAgICB0aGlzLl9ldmVudEhhbmRsZXJzID0ge307XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLl9ldmVudEhhbmRsZXJzW2V2ZW50XSkge1xuICAgICAgICAgICAgdGhpcy5fZXZlbnRIYW5kbGVyc1tldmVudF0gPSBbXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9ldmVudEhhbmRsZXJzW2V2ZW50XS5wdXNoKGhhbmRsZXIpO1xuICAgIH07XG4gICAgRW1pdHRlci5wcm90b3R5cGUudW5zdWJzY3JpYmUgPSBmdW5jdGlvbiAoZXZlbnQsIGhhbmRsZXIpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9ldmVudEhhbmRsZXJzKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX2V2ZW50SGFuZGxlcnNbZXZlbnRdKSB7XG4gICAgICAgICAgICB0aGlzLl9ldmVudEhhbmRsZXJzW2V2ZW50XS5zcGxpY2UodGhpcy5fZXZlbnRIYW5kbGVyc1tldmVudF0uaW5kZXhPZihoYW5kbGVyKSwgMSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFbWl0dGVyLnByb3RvdHlwZSwgXCJldmVudEhhbmRsZXJzXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZXZlbnRIYW5kbGVycztcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgRW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgYXJncyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDE7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgYXJnc1tfaSAtIDFdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgIGlmICh0aGlzLl9ldmVudEhhbmRsZXJzICYmIHRoaXMuX2V2ZW50SGFuZGxlcnNbZXZlbnRdKSB7XG4gICAgICAgICAgICB0aGlzLl9ldmVudEhhbmRsZXJzW2V2ZW50XS5mb3JFYWNoKGZ1bmN0aW9uIChoYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgaGFuZGxlci5hcHBseSh0aGF0LCBhcmdzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBFbWl0dGVyLnByb3RvdHlwZS5yZWxheSA9IGZ1bmN0aW9uIChlbWl0dGVyLCBzdWJzY3JpYmluZ0V2ZW50LCBlbWl0dGluZ0V2ZW50KSB7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgZW1pdHRlci5zdWJzY3JpYmUoc3Vic2NyaWJpbmdFdmVudCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICAgICAgYXJnc1tfaSAtIDBdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoYXQuZW1pdC5hcHBseSh0aGF0LCBbZW1pdHRpbmdFdmVudF0uY29uY2F0KGFyZ3MpKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICByZXR1cm4gRW1pdHRlcjtcbn0pKCk7XG5leHBvcnRzLkVtaXR0ZXIgPSBFbWl0dGVyO1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1lbWl0dGVyLmpzLm1hcCIsIi8qKlxuICogQ3JlYXRlZCBieSBTdGVwaGFuLlNtb2xhIG9uIDMwLjEwLjIwMTQuXG4gKi9cblwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9IHRoaXMuX19leHRlbmRzIHx8IGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07XG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XG4gICAgX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGU7XG4gICAgZC5wcm90b3R5cGUgPSBuZXcgX18oKTtcbn07XG52YXIgRXZlbnRDaGFubmVsID0gcmVxdWlyZShcIi4vZXZlbnRDaGFubmVsXCIpO1xuKGZ1bmN0aW9uIChFVkVOVFMpIHtcbiAgICBFVkVOVFNbRVZFTlRTW1wiRVJST1JcIl0gPSAwXSA9IFwiRVJST1JcIjtcbiAgICBFVkVOVFNbRVZFTlRTW1wiRkFUQUxcIl0gPSAxXSA9IFwiRkFUQUxcIjtcbiAgICBFVkVOVFNbRVZFTlRTW1wiRlJBTUVXT1JLXCJdID0gMl0gPSBcIkZSQU1FV09SS1wiO1xuICAgIEVWRU5UU1tFVkVOVFNbXCJDTEVBUlwiXSA9IDNdID0gXCJDTEVBUlwiO1xufSkoZXhwb3J0cy5FVkVOVFMgfHwgKGV4cG9ydHMuRVZFTlRTID0ge30pKTtcbnZhciBFVkVOVFMgPSBleHBvcnRzLkVWRU5UUztcbnZhciBFcnJvckhhbmRsZXIgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhFcnJvckhhbmRsZXIsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gRXJyb3JIYW5kbGVyKCkge1xuICAgICAgICBfc3VwZXIuY2FsbCh0aGlzLCBcIkVSUk9SXCIpO1xuICAgICAgICAvKlxuICAgICAgICAgaWYgKHdpbmRvdykge1xuICAgICAgICAgd2luZG93Lm9uZXJyb3IgPSBmdW5jdGlvbihlcnJvciwgdXJsLCBsaW5lKSB7XG4gICAgICAgICB0aGlzLmZhdGFsKGVycm9yICsgXCJcXG5pbjogXCIgKyB1cmwgKyBcIlxcbmxpbmU6IFwiICsgbGluZSwgd2luZG93KTtcbiAgICAgICAgIH1cbiAgICAgICAgIH1cbiAgICAgICAgICovXG4gICAgfVxuICAgIEVycm9ySGFuZGxlci5wcm90b3R5cGUuZXJyb3IgPSBmdW5jdGlvbiAobWVzc2FnZSwgdGhhdCkge1xuICAgICAgICB0aGlzLmVtaXQoMCAvKiBFUlJPUiAqLywgbWVzc2FnZSwgdGhhdCk7XG4gICAgfTtcbiAgICBFcnJvckhhbmRsZXIucHJvdG90eXBlLmZhdGFsID0gZnVuY3Rpb24gKG1lc3NhZ2UsIHRoYXQpIHtcbiAgICAgICAgdGhpcy5lbWl0KDEgLyogRkFUQUwgKi8sIG1lc3NhZ2UsIHRoYXQpO1xuICAgIH07XG4gICAgRXJyb3JIYW5kbGVyLnByb3RvdHlwZS5mcmFtZXdvcmsgPSBmdW5jdGlvbiAobWVzc2FnZSwgZXhjZXB0aW9uLCB0aGF0KSB7XG4gICAgICAgIHRocm93IGV4Y2VwdGlvbjtcbiAgICB9O1xuICAgIHJldHVybiBFcnJvckhhbmRsZXI7XG59KShFdmVudENoYW5uZWwuQ2hhbm5lbGVkRW1pdHRlcik7XG52YXIgZXJyb3JIYW5kbGVyID0gbmV3IEVycm9ySGFuZGxlcigpO1xuZnVuY3Rpb24gZ2V0RXJyb3JIYW5kbGVyKCkge1xuICAgIHJldHVybiBlcnJvckhhbmRsZXI7XG59XG5leHBvcnRzLmdldEVycm9ySGFuZGxlciA9IGdldEVycm9ySGFuZGxlcjtcbmZ1bmN0aW9uIGVycm9yKG1lc3NhZ2UsIHRoYXQpIHtcbiAgICByZXR1cm4gZXJyb3JIYW5kbGVyLmVycm9yKG1lc3NhZ2UsIHRoYXQpO1xufVxuZXhwb3J0cy5lcnJvciA9IGVycm9yO1xuZnVuY3Rpb24gZmF0YWwobWVzc2FnZSwgdGhhdCkge1xuICAgIHJldHVybiBlcnJvckhhbmRsZXIuZmF0YWwobWVzc2FnZSwgdGhhdCk7XG59XG5leHBvcnRzLmZhdGFsID0gZmF0YWw7XG5mdW5jdGlvbiBmcmFtZXdvcmsobWVzc2FnZSwgZXhjZW90aW9uLCB0aGF0KSB7XG4gICAgcmV0dXJuIGVycm9ySGFuZGxlci5mcmFtZXdvcmsobWVzc2FnZSwgZXhjZW90aW9uLCB0aGF0KTtcbn1cbmV4cG9ydHMuZnJhbWV3b3JrID0gZnJhbWV3b3JrO1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1lcnJvcnMuanMubWFwIiwiLyoqXG4gKiBDcmVhdGVkIGJ5IFN0ZXBoYW4uU21vbGEgb24gMjguMTAuMjAxNC5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19leHRlbmRzID0gdGhpcy5fX2V4dGVuZHMgfHwgZnVuY3Rpb24gKGQsIGIpIHtcbiAgICBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTtcbiAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICBfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZTtcbiAgICBkLnByb3RvdHlwZSA9IG5ldyBfXygpO1xufTtcbnZhciBFbWl0dGVyID0gcmVxdWlyZShcIi4vZW1pdHRlclwiKTtcbnZhciBTdHJlYW0gPSByZXF1aXJlKFwiLi9zdHJlYW1cIik7XG52YXIgRXZlbnRDaGFubmVsID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBFdmVudENoYW5uZWwoKSB7XG4gICAgICAgIHRoaXMuX2V2ZW50SGFuZGxlcnMgPSB7fTtcbiAgICB9XG4gICAgRXZlbnRDaGFubmVsLnByb3RvdHlwZS5zdWJzY3JpYmUgPSBmdW5jdGlvbiAoZW1pdHRlciwgZXZlbnQsIGhhbmRsZXIpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9ldmVudEhhbmRsZXJzW2VtaXR0ZXJdKSB7XG4gICAgICAgICAgICB0aGlzLl9ldmVudEhhbmRsZXJzW2VtaXR0ZXJdID0ge307XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLl9ldmVudEhhbmRsZXJzW2VtaXR0ZXJdW2V2ZW50XSkge1xuICAgICAgICAgICAgdGhpcy5fZXZlbnRIYW5kbGVyc1tlbWl0dGVyXVtldmVudF0gPSBbXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9ldmVudEhhbmRsZXJzW2VtaXR0ZXJdW2V2ZW50XS5wdXNoKGhhbmRsZXIpO1xuICAgIH07XG4gICAgRXZlbnRDaGFubmVsLnByb3RvdHlwZS51bnN1YnNjcmliZSA9IGZ1bmN0aW9uIChlbWl0dGVyLCBldmVudCwgaGFuZGxlcikge1xuICAgICAgICBpZiAodGhpcy5fZXZlbnRIYW5kbGVyc1tlbWl0dGVyXSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2V2ZW50SGFuZGxlcnNbZW1pdHRlcl1bZXZlbnRdKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRIYW5kbGVyc1tlbWl0dGVyXVtldmVudF0uc3BsaWNlKHRoaXMuX2V2ZW50SGFuZGxlcnNbZW1pdHRlcl1bZXZlbnRdLmluZGV4T2YoaGFuZGxlciksIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICBFdmVudENoYW5uZWwucHJvdG90eXBlLmNoYW5uZWxFbWl0ID0gZnVuY3Rpb24gKGVtaXR0ZXIsIGVtaXR0ZXJJRCwgZXZlbnQsIGFyZ3MpIHtcbiAgICAgICAgaWYgKHRoaXMuX2V2ZW50SGFuZGxlcnMgJiYgdGhpcy5fZXZlbnRIYW5kbGVyc1tlbWl0dGVySURdICYmIHRoaXMuX2V2ZW50SGFuZGxlcnNbZW1pdHRlcklEXVtldmVudF0pIHtcbiAgICAgICAgICAgIHRoaXMuX2V2ZW50SGFuZGxlcnNbZW1pdHRlcklEXVtldmVudF0uZm9yRWFjaChmdW5jdGlvbiAoaGFuZGxlcikge1xuICAgICAgICAgICAgICAgIGhhbmRsZXIuYXBwbHkoZW1pdHRlciwgYXJncyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgRXZlbnRDaGFubmVsLnByb3RvdHlwZS51bnN1YnNjcmliZUFsbCA9IGZ1bmN0aW9uIChlbWl0dGVySUQpIHtcbiAgICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50SGFuZGxlcnNbZW1pdHRlcklEXTtcbiAgICB9O1xuICAgIHJldHVybiBFdmVudENoYW5uZWw7XG59KSgpO1xudmFyIGV2ZW50Q2hhbm5lbCA9IG5ldyBFdmVudENoYW5uZWwoKTtcbi8vZXhwb3J0IHZhciBjaGFubmVsOklFdmVudENoYW5uZWwgPSBldmVudENoYW5uZWw7XG5mdW5jdGlvbiBnZXRDaGFubmVsKCkge1xuICAgIHJldHVybiBldmVudENoYW5uZWw7XG59XG5leHBvcnRzLmdldENoYW5uZWwgPSBnZXRDaGFubmVsO1xuZnVuY3Rpb24gc3Vic2NyaWJlKGVtaXR0ZXIsIGV2ZW50LCBoYW5kbGVyKSB7XG4gICAgZXZlbnRDaGFubmVsLnN1YnNjcmliZShlbWl0dGVyLCBldmVudCwgaGFuZGxlcik7XG59XG5leHBvcnRzLnN1YnNjcmliZSA9IHN1YnNjcmliZTtcbmZ1bmN0aW9uIHVuc3Vic2NyaWJlKGVtaXR0ZXIsIGV2ZW50LCBoYW5kbGVyKSB7XG4gICAgZXZlbnRDaGFubmVsLnVuc3Vic2NyaWJlKGVtaXR0ZXIsIGV2ZW50LCBoYW5kbGVyKTtcbn1cbmV4cG9ydHMudW5zdWJzY3JpYmUgPSB1bnN1YnNjcmliZTtcbmZ1bmN0aW9uIGNoYW5uZWxFbWl0KGVtaXR0ZXJJRCwgZXZlbnQpIHtcbiAgICB2YXIgYXJncyA9IFtdO1xuICAgIGZvciAodmFyIF9pID0gMjsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgIGFyZ3NbX2kgLSAyXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgfVxuICAgIGV2ZW50Q2hhbm5lbC5jaGFubmVsRW1pdChudWxsLCBlbWl0dGVySUQsIGV2ZW50LCBhcmdzKTtcbn1cbmV4cG9ydHMuY2hhbm5lbEVtaXQgPSBjaGFubmVsRW1pdDtcbmZ1bmN0aW9uIHVuc3Vic2NyaWJlQWxsKGVtaXR0ZXJJRCkge1xuICAgIGV2ZW50Q2hhbm5lbC51bnN1YnNjcmliZUFsbChlbWl0dGVySUQpO1xufVxuZXhwb3J0cy51bnN1YnNjcmliZUFsbCA9IHVuc3Vic2NyaWJlQWxsO1xudmFyIGVtaXR0ZXJJRHMgPSBbXTtcbnZhciBDaGFubmVsZWRFbWl0dGVyID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoQ2hhbm5lbGVkRW1pdHRlciwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBDaGFubmVsZWRFbWl0dGVyKF9lbWl0dGVySUQpIHtcbiAgICAgICAgX3N1cGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGlmIChfZW1pdHRlcklEKSB7XG4gICAgICAgICAgICB0aGlzLmVtaXR0ZXJJRCA9IF9lbWl0dGVySUQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmVtaXR0ZXJJRCA9IFwiRW1pdHRlclwiICsgZW1pdHRlcklEcy5sZW5ndGg7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVtaXR0ZXJJRHMuaW5kZXhPZih0aGlzLmVtaXR0ZXJJRCkgIT09IC0xKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJEdXBsaWNhdGUgZW1pdHRlcklELiBUaGlzIGlzIG5vdCBzdXBwb3J0ZWRcIik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgQ2hhbm5lbGVkRW1pdHRlci5wcm90b3R5cGUuc3Vic2NyaWJlID0gZnVuY3Rpb24gKGV2ZW50LCBoYW5kbGVyKSB7XG4gICAgICAgIF9zdXBlci5wcm90b3R5cGUuc3Vic2NyaWJlLmNhbGwodGhpcywgZXZlbnQsIGhhbmRsZXIpO1xuICAgICAgICAvL2NvbnNvbGUubG9nKFwiQ29uc2lkZXIgdXNpbmcgdGhlIEV2ZW50Q2hhbm5lbCBpbnN0ZWFkIG9mIHN1YnNjcmliaW5nIGRpcmVjdGx5IHRvIHRoZSBcIiArIHRoaXMuZW1pdHRlcklEKTtcbiAgICB9O1xuICAgIENoYW5uZWxlZEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgX2kgPSAxOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIGFyZ3NbX2kgLSAxXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgIH1cbiAgICAgICAgLy8gTm8gc3VwZXIgY2FsbCBiZWNhdXNlIHBhc3NpbmcgcmVzdCBwYXJhbWV0ZXJzIHRvIGEgc3VwZXIgbWV0aG9kIGlzIGtpbmQgb2YgYXdrd2FyZCBhbmQgaGFja3lcbiAgICAgICAgLy8gaHR0cHM6Ly90eXBlc2NyaXB0LmNvZGVwbGV4LmNvbS9kaXNjdXNzaW9ucy81NDQ3OTdcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICBpZiAodGhpcy5ldmVudEhhbmRsZXJzICYmIHRoaXMuZXZlbnRIYW5kbGVyc1tldmVudF0pIHtcbiAgICAgICAgICAgIHRoaXMuZXZlbnRIYW5kbGVyc1tldmVudF0uZm9yRWFjaChmdW5jdGlvbiAoaGFuZGxlcikge1xuICAgICAgICAgICAgICAgIGhhbmRsZXIuYXBwbHkodGhhdCwgYXJncyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBldmVudENoYW5uZWwuY2hhbm5lbEVtaXQodGhpcywgdGhpcy5lbWl0dGVySUQsIGV2ZW50LCBhcmdzKTtcbiAgICB9O1xuICAgIHJldHVybiBDaGFubmVsZWRFbWl0dGVyO1xufSkoRW1pdHRlci5FbWl0dGVyKTtcbmV4cG9ydHMuQ2hhbm5lbGVkRW1pdHRlciA9IENoYW5uZWxlZEVtaXR0ZXI7XG52YXIgRXZlbnRTdHJlYW0gPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhFdmVudFN0cmVhbSwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBFdmVudFN0cmVhbShuYW1lLCBfZW1pdHRlcklELCBfZXZlbnQpIHtcbiAgICAgICAgX3N1cGVyLmNhbGwodGhpcywgbmFtZSk7XG4gICAgICAgIHRoaXMuX2VtaXR0ZXJJRCA9IF9lbWl0dGVySUQ7XG4gICAgICAgIHRoaXMuX2V2ZW50ID0gX2V2ZW50O1xuICAgICAgICB0aGlzLl9oYW5kbGVyID0gdGhpcy5oYW5kbGVFdmVudC5iaW5kKHRoaXMpO1xuICAgICAgICBzdWJzY3JpYmUodGhpcy5fZW1pdHRlcklELCBfZXZlbnQsIHRoaXMuX2hhbmRsZXIpO1xuICAgIH1cbiAgICBFdmVudFN0cmVhbS5wcm90b3R5cGUuaGFuZGxlRXZlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhcmdzID0gW107XG4gICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICBhcmdzW19pIC0gMF0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucHVzaCh7XG4gICAgICAgICAgICBlbWl0dGVyOiB0aGlzLl9lbWl0dGVySUQsXG4gICAgICAgICAgICBldmVudDogdGhpcy5fZXZlbnQsXG4gICAgICAgICAgICBhcmdzOiBhcmdzXG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgRXZlbnRTdHJlYW0ucHJvdG90eXBlLmRpc3Bvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIF9zdXBlci5wcm90b3R5cGUuZGlzcG9zZS5jYWxsKHRoaXMpO1xuICAgICAgICB1bnN1YnNjcmliZSh0aGlzLl9lbWl0dGVySUQsIHRoaXMuX2V2ZW50LCB0aGlzLl9oYW5kbGVyKTtcbiAgICB9O1xuICAgIHJldHVybiBFdmVudFN0cmVhbTtcbn0pKFN0cmVhbS5TdHJlYW0pO1xuLyoqXG4gKiBDcmVhdGVzIGEgc3RyZWFtIGZvciBhIGNoYW5uZWxlZCBldmVudC4gSWYgIG1vciB0aGFuIG9uZSBldmVudCBpcyBnaXZlbiwgYSBjb21iaW5lZFxuICogc3RyZWFtIGZvciBhbGwgZXZlbnRzIGlzIGNyZWF0ZWRcbiAqXG4gKiBAcGFyYW0gbmFtZVxuICogQHBhcmFtIGVtaXR0ZXJJRFxuICogQHBhcmFtIGV2ZW50c1xuICogQHJldHVybnMge251bGx9XG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUV2ZW50U3RyZWFtKGVtaXR0ZXJJRCkge1xuICAgIHZhciBldmVudHMgPSBbXTtcbiAgICBmb3IgKHZhciBfaSA9IDE7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICBldmVudHNbX2kgLSAxXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgfVxuICAgIHZhciBzdHJlYW0gPSBudWxsO1xuICAgIGV2ZW50cy5mb3JFYWNoKGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgZVN0cmVhbSA9IG5ldyBFdmVudFN0cmVhbShlbWl0dGVySUQgKyBcIi1cIiArIGV2ZW50LCBlbWl0dGVySUQsIGV2ZW50KTtcbiAgICAgICAgaWYgKHN0cmVhbSkge1xuICAgICAgICAgICAgc3RyZWFtID0gc3RyZWFtLmNvbWJpbmUoZVN0cmVhbSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzdHJlYW0gPSBlU3RyZWFtO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHN0cmVhbTtcbn1cbmV4cG9ydHMuY3JlYXRlRXZlbnRTdHJlYW0gPSBjcmVhdGVFdmVudFN0cmVhbTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZXZlbnRDaGFubmVsLmpzLm1hcCIsIi8qKlxuICogQ3JlYXRlZCBieSBzdGVwaGFuIG9uIDAxLjExLjE0LlxuICovXG5cInVzZSBzdHJpY3RcIjtcbnZhciBfX2V4dGVuZHMgPSB0aGlzLl9fZXh0ZW5kcyB8fCBmdW5jdGlvbiAoZCwgYikge1xuICAgIGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdO1xuICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgIF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlO1xuICAgIGQucHJvdG90eXBlID0gbmV3IF9fKCk7XG59O1xudmFyIERpc3BhdGNoZXIgPSByZXF1aXJlKFwiLi9kaXNwYXRjaGVyXCIpO1xudmFyIEV2ZW50Q2hhbm5lbCA9IHJlcXVpcmUoXCIuL2V2ZW50Q2hhbm5lbFwiKTtcbnZhciBCYXNlQWN0aW9ucyA9IHJlcXVpcmUoXCIuL2Jhc2VBY3Rpb25zXCIpO1xudmFyIFRvb2xzID0gcmVxdWlyZShcIi4vdG9vbHNcIik7XG4vKipcbiAqIEJhc2UgaW1wbGVtZW50YXRpb24gZm9yIGEgcGx1Z2luLiBEb2VzIGFic29sdXRlbHkgbm90aGluZy5cbiAqL1xudmFyIEJhc2VQbHVnaW4gPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEJhc2VQbHVnaW4oKSB7XG4gICAgfVxuICAgIEJhc2VQbHVnaW4ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIChjb250YWluZXIsIGFjdGlvbikge1xuICAgICAgICB2YXIgYXJncyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDI7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgYXJnc1tfaSAtIDJdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgQmFzZVBsdWdpbi5wcm90b3R5cGUuYWZ0ZXJGaW5pc2ggPSBmdW5jdGlvbiAoY29udGFpbmVyLCBhY3Rpb24pIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgX2kgPSAyOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIGFyZ3NbX2kgLSAyXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEJhc2VQbHVnaW4ucHJvdG90eXBlLmFmdGVyQWJvcnQgPSBmdW5jdGlvbiAoY29udGFpbmVyLCBhY3Rpb24pIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgX2kgPSAyOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIGFyZ3NbX2kgLSAyXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEJhc2VQbHVnaW4ucHJvdG90eXBlLmdldE1lbWVudG8gPSBmdW5jdGlvbiAoY29udGFpbmVyLCBhY3Rpb24pIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgX2kgPSAyOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIGFyZ3NbX2kgLSAyXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfTtcbiAgICBCYXNlUGx1Z2luLnByb3RvdHlwZS5yZXN0b3JlRnJvbU1lbWVudG8gPSBmdW5jdGlvbiAoY29udGFpbmVyLCBtZW1lbnRvKSB7XG4gICAgfTtcbiAgICBCYXNlUGx1Z2luLnByb3RvdHlwZS5ob2xkID0gZnVuY3Rpb24gKCkge1xuICAgIH07XG4gICAgQmFzZVBsdWdpbi5wcm90b3R5cGUucmVsZWFzZSA9IGZ1bmN0aW9uIChhY3Rpb24pIHtcbiAgICB9O1xuICAgIEJhc2VQbHVnaW4ucHJvdG90eXBlLmFib3J0ID0gZnVuY3Rpb24gKGFjdGlvbikge1xuICAgIH07XG4gICAgcmV0dXJuIEJhc2VQbHVnaW47XG59KSgpO1xuZXhwb3J0cy5CYXNlUGx1Z2luID0gQmFzZVBsdWdpbjtcbi8qKlxuICogQ3JlYXRlIGEgUGx1Z2luLiBVc2UgdGhpcyB3aGVuIHlvdSdyZSB1c2luZyBwbGFpbiBKYXZhU2NyaXB0LlxuICogQHBhcmFtIHNwZWNcbiAqIEByZXR1cm5zIHthbnl9XG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVBsdWdpbihzcGVjKSB7XG4gICAgcmV0dXJuIFRvb2xzLnN1YmNsYXNzKHNwZWMsIEJhc2VQbHVnaW4pO1xufVxuZXhwb3J0cy5jcmVhdGVQbHVnaW4gPSBjcmVhdGVQbHVnaW47XG4vKipcbiAqIEJhc2UgaW1wbGVtZW50YXRpb24gZm9yIGEgcGx1Z2luIGNvbnRhaW5lci5cbiAqL1xudmFyIFBsdWdpbkNvbnRhaW5lciA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKFBsdWdpbkNvbnRhaW5lciwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBQbHVnaW5Db250YWluZXIoZW1pdHRlcklkKSB7XG4gICAgICAgIF9zdXBlci5jYWxsKHRoaXMsIGVtaXR0ZXJJZCB8fCBcIkNvbnRhaW5lclwiICsgVG9vbHMub2lkKHRoaXMpKTtcbiAgICAgICAgdGhpcy5fcGx1Z2lucyA9IHt9O1xuICAgICAgICB0aGlzLl9hbnlQbHVnaW5zID0gW107XG4gICAgICAgIHRoaXMuX3Byb3RvY29scyA9IHt9O1xuICAgICAgICB0aGlzLl9ydW5uaW5nUGx1Z2lucyA9IHt9O1xuICAgICAgICB0aGlzLl9tZW1lbnRvcyA9IHt9O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzE2MDY3OTcvdXNlLW9mLWFwcGx5LXdpdGgtbmV3LW9wZXJhdG9yLWlzLXRoaXMtcG9zc2libGVcbiAgICAgKiBAcGFyYW0gY29uZmlnXG4gICAgICovXG4gICAgUGx1Z2luQ29udGFpbmVyLnByb3RvdHlwZS5jb25maWd1cmUgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgICAgIGZ1bmN0aW9uIGNvbnN0cnVjdChjb25zdHJ1Y3RvciwgYXJncykge1xuICAgICAgICAgICAgZnVuY3Rpb24gRigpIHtcbiAgICAgICAgICAgICAgICBjb25zdHJ1Y3Rvci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIEYucHJvdG90eXBlID0gY29uc3RydWN0b3IucHJvdG90eXBlO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBGKCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICBjb25maWcuZm9yRWFjaChmdW5jdGlvbiAoYWN0aW9uKSB7XG4gICAgICAgICAgICBhY3Rpb24ucGx1Z2lucy5mb3JFYWNoKGZ1bmN0aW9uIChwbHVnaW4pIHtcbiAgICAgICAgICAgICAgICBpZiAocGx1Z2luLnBsdWdpbikge1xuICAgICAgICAgICAgICAgICAgICB0aGF0LndyYXAoYWN0aW9uLmFjdGlvbiwgY29uc3RydWN0KHBsdWdpbi5wbHVnaW4sIHBsdWdpbi5wYXJhbWV0ZXJzKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGF0LndyYXAoYWN0aW9uLmFjdGlvbiwgbmV3IHBsdWdpbigpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBQbHVnaW5Db250YWluZXIucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZvciAodmFyIGFjdGlvbiBpbiB0aGlzLl9wbHVnaW5zKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fcGx1Z2lucy5oYXNPd25Qcm9wZXJ0eShhY3Rpb24pKSB7XG4gICAgICAgICAgICAgICAgdmFyIGwgPSB0aGlzLl9wbHVnaW5zW2FjdGlvbl0ubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHdoaWxlIChsLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kZXRhY2goYWN0aW9uLCB0aGlzLl9wbHVnaW5zW2FjdGlvbl1bbF0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9hbnlQbHVnaW5zID0gW107XG4gICAgICAgIHRoaXMuX3J1bm5pbmdQbHVnaW5zID0ge307XG4gICAgICAgIC8vVE9ETzogRmluZCBhIHdheSB0byB1bnN1YnNjcmliZSBmcm9tIHRoZSBEaXNwYXRjaGVyXG4gICAgfTtcbiAgICBQbHVnaW5Db250YWluZXIucHJvdG90eXBlLnBsdWdpbkRvbmUgPSBmdW5jdGlvbiAoYWN0aW9uLCBhYm9ydCkge1xuICAgIH07XG4gICAgUGx1Z2luQ29udGFpbmVyLnByb3RvdHlwZS5hYm9ydEFjdGlvbiA9IGZ1bmN0aW9uIChhY3Rpb24pIHtcbiAgICAgICAgaWYgKHRoaXMuX3J1bm5pbmdQbHVnaW5zW2FjdGlvbl0gJiYgdGhpcy5fcnVubmluZ1BsdWdpbnNbYWN0aW9uXS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHZhciBwbGcgPSB0aGlzLl9ydW5uaW5nUGx1Z2luc1thY3Rpb25dW3RoaXMuX3J1bm5pbmdQbHVnaW5zW2FjdGlvbl0ubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICBpZiAocGxnKSB7XG4gICAgICAgICAgICAgICAgcGxnLmFib3J0KGFjdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcnVubmluZ1BsdWdpbnNbYWN0aW9uXSA9IG51bGw7XG4gICAgfTtcbiAgICBQbHVnaW5Db250YWluZXIucHJvdG90eXBlLmFib3J0ID0gZnVuY3Rpb24gKGFjdGlvbikge1xuICAgICAgICBpZiAodHlwZW9mIGFjdGlvbiA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgZm9yICh2YXIgYWN0aW9uS2V5IGluIHRoaXMuX3Byb3RvY29scykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9wcm90b2NvbHMuaGFzT3duUHJvcGVydHkoYWN0aW9uS2V5KSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFib3J0QWN0aW9uKGFjdGlvbktleSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKHRoaXMuX3Byb3RvY29sc1thY3Rpb25dKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hYm9ydEFjdGlvbihhY3Rpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBUaGlzIGhhbmRsZXMgYW4gYWN0aW9uIHNlbnQgYnkgdGhlIGRpc3BhdGNoZXIgYW5kIGRlbGVnYXRlcyBpdCB0byB0aGUgcGx1Z2lucy5cbiAgICAgKiBQbHVnaW5zIGFyZSBcIndyYXBwZWRcIiBhcm91bmQgZWFjaCBvdGhlci4gVGhleSBidWlsZCBraW5kIG9mIGJyYWNrZXRzIGRlZmluZWQgYnkgdHdvIG9mXG4gICAgICogdGhlaXIgbWV0aG9kczogcnVuIC0gb3BlbnMgdGhlIGJyYWNrZXRzXG4gICAgICogICAgICAgICAgICAgICAgZmluaXNoL2Fib3J0IC0gY2xvc2VzIHRoZSBicmFja2V0cy5cbiAgICAgKlxuICAgICAqIFdlJ2xsIHRhbGsgYWJvdXQgZmluaXNoIGZyb20gbm93IG9uLiBUaGF0IGNhbiBiZSByZXBsYWNlZCBieSBhYm9ydCBldmVyeXdoZXJlLiBUaGUgZmlyc3QgcGx1Z2luIHRvIGFib3J0XG4gICAgICogZm9yY2VzIGFsbCBzdWNjZWVkaW5nIHBsdWdpbnMgdG8gYWJvcnQgYXMgd2VsbC5cbiAgICAgKlxuICAgICAqIFNvIHdyYXBwaW5nIGluIHRoZSBvcmRlciBBLT5CLT5DIGxlYWRzIHRvIHRoZXNlIGJyYWNrZXRzOlxuICAgICAqXG4gICAgICogIHJ1bkMtcnVuQi1ydW5BLWZpbmlzaEEtZmluaXNoQi1maW5pc2hDXG4gICAgICpcbiAgICAgKiBmaW5pc2ggaXMgb25seSBjYWxsZWQgd2hlbiB0aGUgcGx1Z2luIGNhbGxzIHRoZSBkb25lLWNhbGxiYWNrIHRoYXQgaXMgcHJvdmlkZWQgdG8gaXRzIHJ1bi1tZXRob2QuXG4gICAgICpcbiAgICAgKiBTbyB0byBjb3JyZWN0bHkgZXhlY3V0ZSB0aGlzIFwiY2hhaW5cIiB3ZSBuZWVkIHRvIHdhaXQgZm9yIHRoZSBwbHVnaW5zIHRvIGNhbGwgdGhlaXIgZG9uZS1jYWxsYmFja3MgYmVmb3JlXG4gICAgICogd2UgY2FuIHByb2NlZWQuIEJlY2F1c2UgdGhlIHBsdWdpbnMgbWF5IGNhbGwgdGhlaXIgZG9uZS1jYWxsYmFjayBvdXRzaWRlIHRoZWlyIHJ1bi1tZXRob2QsIGUuZy4gdHJpZ2dlcmVkIGJ5XG4gICAgICogdXNlciBpbnRlcmFjdGlvbiwgd2UgbmVlZCB0byBrZWVwIHRyYWNrIG9mIHdoYXQgdGhlIHBsdWdpbnMgZGlkIHVzaW5nIGEgcHJvdG9jb2wuXG4gICAgICpcbiAgICAgKiBUaGF0IHByb3RvY29sIGxvb2tzIGxpa2UgdGhpczpcbiAgICAgKlxuICAgICAqICB7XG4gICAgICogICAgaTogeyBkb25lOiBBIGZ1bmN0aW9uIHRoYXQgY2FsbHMgZWl0aGVyIGZpbmlzaCBvciBhYm9ydCBvbiB0aGUgaS10aCBwbHVnaW4sXG4gICAgICogICAgICAgICBhYm9ydDogZGlkIHRoZSBwbHVnaW4gYWJvcnQ/XG4gICAgICpcbiAgICAgKiAgICBpKzE6IC4uLlxuICAgICAqICB9XG4gICAgICpcbiAgICAgKiB0aGlzIHByb3RvY29sIGlzIGluaXRpYWxpemVkIGJ5IG51bGwgZW50cmllcyBmb3IgYWxsIHBsdWdpbnMuIFRoZW4gdGhlIHJ1bi1tZXRob2RzIGZvciBhbGwgcGx1Z2lucyBhcmUgY2FsbGVkLCBnaXZpbmcgdGhlbSBhIGRvbmVcbiAgICAgKiBjYWxsYmFjaywgdGhhdCBmaWxscyB0aGUgcHJvdG9jb2wuXG4gICAgICpcbiAgICAgKiBBZnRlciBldmVyeSBydW4tbWV0aG9kIHdlIGNoZWNrIGlmIHdlJ3JlIGF0IHRoZSBpbm5lcm1vc3QgcGx1Z2luIChBIGluIHRoZSBleGFtcGxlIGFib3ZlLCB0aGUgb25lIHRoYXQgZmlyc3Qgd3JhcHBlZCB0aGUgYWN0aW9uKS5cbiAgICAgKiBJZiB3ZSBhcmUsIHdlIHdvcmsgdGhyb3VnaCB0aGUgcHJvdG9jb2wgYXMgbG9uZyBhcyB0aGVyZSBhcmUgdmFsaWQgZW50cmllcy4gVGhlbiB3ZSB3YWl0IGZvciB0aGUgbmV4dCBkb25lLWNhbGxiYWNrIHRvIGJlIGNhbGxlZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBhY3Rpb25cbiAgICAgKiBAcGFyYW0gYXJnc1xuICAgICAqL1xuICAgIFBsdWdpbkNvbnRhaW5lci5wcm90b3R5cGUuZG9IYW5kbGVBY3Rpb24gPSBmdW5jdGlvbiAocGx1Z2lucywgYWN0aW9uLCBhcmdzKSB7XG4gICAgICAgIGlmICh0aGlzLl9ydW5uaW5nUGx1Z2luc1thY3Rpb25dICYmIHRoaXMuX3J1bm5pbmdQbHVnaW5zW2FjdGlvbl0ubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFUlJPUiBjYWxsaW5nIGFjdGlvbiBcIiArIGFjdGlvbiArIFwiLiBTYW1lIGFjdGlvbiBjYW5ub3QgYmUgY2FsbGVkIGluc2lkZSBpdHNlbGYhXCIpO1xuICAgICAgICB9XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgdmFyIGNvbXBvc2VBcmdzID0gZnVuY3Rpb24gKHBsdWdpbiwgYWN0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gW3RoYXQsIGFjdGlvbl0uY29uY2F0KGFyZ3MpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLl9tZW1lbnRvc1thY3Rpb25dID0gW107XG4gICAgICAgIHRoaXMuX3J1bm5pbmdQbHVnaW5zW2FjdGlvbl0gPSBbXTtcbiAgICAgICAgdGhpcy5fcHJvdG9jb2xzW2FjdGlvbl0gPSBbXTtcbiAgICAgICAgcGx1Z2lucy5mb3JFYWNoKGZ1bmN0aW9uIChwbHVnaW4pIHtcbiAgICAgICAgICAgIHRoYXQuX3Byb3RvY29sc1thY3Rpb25dLnB1c2goMCk7XG4gICAgICAgICAgICB0aGF0Ll9ydW5uaW5nUGx1Z2luc1thY3Rpb25dLnB1c2gocGx1Z2luKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciBhYm9ydGVkID0gZmFsc2U7XG4gICAgICAgIHBsdWdpbnMuZm9yRWFjaChmdW5jdGlvbiAocGx1Z2luLCBpKSB7XG4gICAgICAgICAgICAoZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgICAgICAgICAgICAgdmFyIGRvbmUgPSBmdW5jdGlvbiAoYWJvcnQsIGRvbmVBY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggPSB0aGF0LmdldFBsdWdpbnNGb3JBY3Rpb24oZG9uZUFjdGlvbikuaW5kZXhPZihwbHVnaW4pO1xuICAgICAgICAgICAgICAgICAgICB0aGF0Ll9wcm90b2NvbHNbZG9uZUFjdGlvbl1baW5kZXhdID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGx1Z2luOiBwbHVnaW4sXG4gICAgICAgICAgICAgICAgICAgICAgICBkb25lOiBmdW5jdGlvbiAoYWJvcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWJvcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGx1Z2luLmFmdGVyQWJvcnQuYXBwbHkocGx1Z2luLCBjb21wb3NlQXJncyhwbHVnaW4sIGRvbmVBY3Rpb24pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBsdWdpbi5hZnRlckZpbmlzaC5hcHBseShwbHVnaW4sIGNvbXBvc2VBcmdzKHBsdWdpbiwgZG9uZUFjdGlvbikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBhYm9ydDogYWJvcnRcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxhc3QgPSB0aGF0Ll9wcm90b2NvbHNbZG9uZUFjdGlvbl0ubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAobGFzdC0tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhhdC5fcHJvdG9jb2xzW2RvbmVBY3Rpb25dW2xhc3RdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWJvcnQgfD0gdGhhdC5fcHJvdG9jb2xzW2RvbmVBY3Rpb25dW2xhc3RdLmFib3J0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuX3Byb3RvY29sc1tkb25lQWN0aW9uXVtsYXN0XS5kb25lKGFib3J0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0Ll9wcm90b2NvbHNbZG9uZUFjdGlvbl0ucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoYXQuX3J1bm5pbmdQbHVnaW5zW2RvbmVBY3Rpb25dKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuX3J1bm5pbmdQbHVnaW5zW2RvbmVBY3Rpb25dLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhhdC5fcnVubmluZ1BsdWdpbnNbZG9uZUFjdGlvbl0gfHwgIXRoYXQuX3J1bm5pbmdQbHVnaW5zW2RvbmVBY3Rpb25dLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5maW5hbGl6ZUFjdGlvbihkb25lQWN0aW9uLCBhYm9ydCwgdGhhdC5nZXRQbHVnaW5zRm9yQWN0aW9uKGRvbmVBY3Rpb24pLCB0aGF0Ll9tZW1lbnRvc1tkb25lQWN0aW9uXSwgYXJncyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHZhciBob2xkcyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHZhciBkb25lcyA9IHt9O1xuICAgICAgICAgICAgICAgIHBsdWdpbltcImhvbGRcIl0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGhvbGRzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHBsdWdpbltcImFib3J0XCJdID0gZnVuY3Rpb24gKGFib3J0QWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhY3QgPSB0eXBlb2YgYWJvcnRBY3Rpb24gPT09IFwidW5kZWZpbmVkXCIgPyBhY3Rpb24gOiBhYm9ydEFjdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgZG9uZXNbYWN0XSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGRvbmUodHJ1ZSwgYWN0KTtcbiAgICAgICAgICAgICAgICAgICAgYWJvcnRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBwbHVnaW5bXCJyZWxlYXNlXCJdID0gZnVuY3Rpb24gKHJlbGVhc2VBY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFjdCA9IHR5cGVvZiByZWxlYXNlQWN0aW9uID09PSBcInVuZGVmaW5lZFwiID8gYWN0aW9uIDogcmVsZWFzZUFjdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRvbmVzW2FjdF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlBsdWdpbiByZWxlYXNlZCB0d2ljZSBmb3IgYWN0aW9uIFwiICsgYWN0ICsgXCIhIFBvc3NpYmx5IGNhbGxlZCByZWxlYXNlIGFmdGVyIGFib3J0IG9yIHZpY2UgdmVyc2EuXCIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9uZShmYWxzZSwgYWN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvbmVzW2FjdF0gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpZiAoIWFib3J0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1lbWVudG8gPSBwbHVnaW4uZ2V0TWVtZW50by5hcHBseShwbHVnaW4sIGNvbXBvc2VBcmdzKHBsdWdpbiwgYWN0aW9uKSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtZW1lbnRvKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZW1lbnRvLmluc3RhbmNlID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3RvcmVGcm9tTWVtZW50bzogZnVuY3Rpb24gKG1lbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwbHVnaW4ucmVzdG9yZUZyb21NZW1lbnRvKHRoYXQsIG1lbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuX21lbWVudG9zW2FjdGlvbl0ucHVzaChtZW1lbnRvKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBJZiB3ZSBhYm9ydGVkOiBDbGVhbiB1cDogQWxsIFBsdWdpbnMgdGhhdCB3aGVyZSBzdGFydGVkIHVudGlsIG5vdyAob3V0ZXIpIHdpbGwgYmUgYWJvcnRlZC5cbiAgICAgICAgICAgICAgICAgICAgLy8gT3RoZXJzIHRoYXQgd291bGQgaGF2ZSBiZWVuIHN0YXJ0ZWQgYWZ0ZXJ3YXJkcyAoaW5uZXIpIHdvbid0IGJlIGNhbGxlZCBhdCBhbGwuIChzZWUgaWYtc3RhdGVtZW50XG4gICAgICAgICAgICAgICAgICAgIC8vIGFib3ZlIHRoaXMgY29tbWVudClcbiAgICAgICAgICAgICAgICAgICAgcGx1Z2luLnJ1bi5hcHBseShwbHVnaW4sIGNvbXBvc2VBcmdzKHBsdWdpbiwgYWN0aW9uKSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhYm9ydGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGFzdCA9ICh0aGF0Ll9wcm90b2NvbHNbYWN0aW9uXSAmJiB0aGF0Ll9wcm90b2NvbHNbYWN0aW9uXS5sZW5ndGgpIHx8IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAobGFzdC0tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoYXQuX3Byb3RvY29sc1thY3Rpb25dW2xhc3RdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuX3Byb3RvY29sc1thY3Rpb25dW2xhc3RdLmRvbmUodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuX3Byb3RvY29sc1thY3Rpb25dLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0LmZpbmFsaXplQWN0aW9uKGFjdGlvbiwgdHJ1ZSwgdGhhdC5nZXRQbHVnaW5zRm9yQWN0aW9uKGFjdGlvbiksIG51bGwsIGFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFob2xkcyAmJiAhZG9uZXNbYWN0aW9uXSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb25lKGZhbHNlLCBhY3Rpb24pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkoaSk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgUGx1Z2luQ29udGFpbmVyLnByb3RvdHlwZS5nZXRQbHVnaW5zRm9yQWN0aW9uID0gZnVuY3Rpb24gKGFjdGlvbikge1xuICAgICAgICBpZiAodGhpcy5fcGx1Z2luc1thY3Rpb25dICYmIHRoaXMuX3BsdWdpbnNbYWN0aW9uXS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9wbHVnaW5zW2FjdGlvbl07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGhpcy5fYW55UGx1Z2lucyAmJiB0aGlzLl9hbnlQbHVnaW5zLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2FueVBsdWdpbnM7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgIH07XG4gICAgUGx1Z2luQ29udGFpbmVyLnByb3RvdHlwZS5oYW5kbGVBY3Rpb24gPSBmdW5jdGlvbiAoYWN0aW9uLCBhcmdzKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGlzLmRvSGFuZGxlQWN0aW9uKHRoaXMuZ2V0UGx1Z2luc0ZvckFjdGlvbihhY3Rpb24pLCBhY3Rpb24sIGFyZ3MpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICB0aGlzLmFib3J0KCk7XG4gICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBQbHVnaW5Db250YWluZXIucHJvdG90eXBlLmZpbmFsaXplQWN0aW9uID0gZnVuY3Rpb24gKGFjdGlvbiwgYWJvcnQsIHBsdWdpbnMsIG1lbWVudG9zLCBhcmdzKSB7XG4gICAgICAgIGlmICghYWJvcnQpIHtcbiAgICAgICAgICAgIGlmIChtZW1lbnRvcyAmJiBtZW1lbnRvcy5sZW5ndGggJiYgIURpc3BhdGNoZXIuZ2V0RGlzcGF0Y2hlcigpLnVuZG9pbmcpIHtcbiAgICAgICAgICAgICAgICBEaXNwYXRjaGVyLmdldFVuZG9NYW5hZ2VyKCkuc3RvcmVNZW1lbnRvcyhtZW1lbnRvcywgYWN0aW9uLCBEaXNwYXRjaGVyLmNyZWF0ZVJlZG8oYWN0aW9uLCBhcmdzKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fbWVtZW50b3NbYWN0aW9uXSA9IG51bGw7XG4gICAgICAgIHRoaXMuX3J1bm5pbmdQbHVnaW5zW2FjdGlvbl0gPSBudWxsO1xuICAgICAgICB0aGlzLl9wcm90b2NvbHNbYWN0aW9uXSA9IG51bGw7XG4gICAgfTtcbiAgICBQbHVnaW5Db250YWluZXIucHJvdG90eXBlLnByb3ZpZGVNZW1lbnRvcyA9IGZ1bmN0aW9uIChhY3Rpb24sIHBsdWdpbnMsIGFyZ3MpIHtcbiAgICAgICAgaWYgKHBsdWdpbnMpIHtcbiAgICAgICAgICAgIHZhciByZXQgPSBbXTtcbiAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgIHBsdWdpbnMuZm9yRWFjaChmdW5jdGlvbiAocGx1Z2luKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lbWVudG8gPSBwbHVnaW4uZ2V0TWVtZW50by5hcHBseShwbHVnaW4sIFt0aGF0LCBhY3Rpb25dLmNvbmNhdChhcmdzKSk7XG4gICAgICAgICAgICAgICAgaWYgKG1lbWVudG8pIHtcbiAgICAgICAgICAgICAgICAgICAgbWVtZW50by5pbnN0YW5jZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3RvcmVGcm9tTWVtZW50bzogZnVuY3Rpb24gKG1lbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBsdWdpbi5yZXN0b3JlRnJvbU1lbWVudG8odGhhdCwgbWVtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgcmV0LnB1c2gobWVtZW50byk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAocmV0Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIERpc3BhdGNoZXIuZ2V0VW5kb01hbmFnZXIoKS5zdG9yZU1lbWVudG9zKHJldCwgYWN0aW9uLCBEaXNwYXRjaGVyLmNyZWF0ZVJlZG8oYWN0aW9uLCBhcmdzKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBUaGlzIHdyYXBzIHRoZSBoYW5kbGVyIGFyb3VuZCB0aGUgZXhpc3RpbmcgaGFuZGxlcnMgdGhlIGFjdGlvbiwgbWFraW5nIHRoZSBnaXZlbiBoYW5kbGVyIHRoZSBmaXJzdCB0byBiZSBjYWxsZWRcbiAgICAgKiBmb3IgdGhhdCBhY3Rpb24uXG4gICAgICpcbiAgICAgKiBJZiB0aGUgQU5ZLUFjdGlvbiBpcyBnaXZlblxuICAgICAqICAgKiBUaGUgaGFuZGxlciBpcyB3cmFwcGVkIGZvciBldmVyeSBhY3Rpb24gdGhlcmUgYWxyZWFkeSBpcyBhbm90aGVyIGhhbmRsZXJcbiAgICAgKiAgICogVGhlIGhhbmRsZXIgaXMgd3JhcHBlZCBhcm91bmQgYWxsIG90aGVyIGFueS1oYW5kbGVyLCBhbmQgdGhlc2UgYXJlIGNhbGxlZCBmb3IgYWxsIGFjdGlvbnMgd2l0aG91dCByZWd1bGFyIGhhbmRsZXJzXG4gICAgICpcbiAgICAgKiBJZiBhIHJlZ3VsYXIgYWN0aW9uIGlzIGdpdmVuIGFuZCBhbnktaGFuZGxlcnMgZXhpc3QgdGhlIGdpdmVuIGhhbmRsZXIgaXMgd3JhcHBlZCBhcm91bmQgYWxsIGFueS1oYW5kbGVycyBmb3IgdGhlXG4gICAgICogZ2l2ZW4gYWN0aW9uLlxuICAgICAqXG4gICAgICogQHBhcmFtIGFjdGlvblxuICAgICAqIEBwYXJhbSBoYW5kbGVyXG4gICAgICovXG4gICAgUGx1Z2luQ29udGFpbmVyLnByb3RvdHlwZS53cmFwID0gZnVuY3Rpb24gKGFjdGlvbiwgaGFuZGxlcikge1xuICAgICAgICBpZiAoYWN0aW9uID09PSAtMTAwMCAvKiBfX0FOWV9fICovKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fYW55UGx1Z2lucy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgRGlzcGF0Y2hlci5zdWJzY3JpYmVBY3Rpb24oLTEwMDAgLyogX19BTllfXyAqLywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYXJncyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXJnc1tfaSAtIDBdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2YXIgYWN0ID0gYXJncy5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhhdC5fcGx1Z2luc1thY3RdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhhdC5oYW5kbGVBY3Rpb24oYWN0LCBhcmdzKTtcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAodHlwZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYXJncyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBfaSA9IDE7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXJnc1tfaSAtIDFdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDsgLy8gV2hlIGhhbmRsZSB0aGUgbWVtZW50b3Mgb3Vyc2VsdmVzXG4gICAgICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICAgICBpZiAodGhhdC5fcGx1Z2luc1t0eXBlXSkge1xuICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoYXQucHJvdmlkZU1lbWVudG9zKHR5cGUsIGFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAodmFyIGEgaW4gdGhpcy5fcGx1Z2lucykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9wbHVnaW5zLmhhc093blByb3BlcnR5KGEpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9XcmFwKGEsIGhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2FueVBsdWdpbnMudW5zaGlmdChoYW5kbGVyKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5fcGx1Z2luc1thY3Rpb25dICYmIHRoaXMuX2FueVBsdWdpbnMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGwgPSB0aGlzLl9hbnlQbHVnaW5zLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB3aGlsZSAobC0tKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9XcmFwKGFjdGlvbiwgdGhpcy5fYW55UGx1Z2luc1tsXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5kb1dyYXAoYWN0aW9uLCBoYW5kbGVyKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgUGx1Z2luQ29udGFpbmVyLnByb3RvdHlwZS5kb1dyYXAgPSBmdW5jdGlvbiAoYWN0aW9uLCBoYW5kbGVyKSB7XG4gICAgICAgIGlmICghdGhpcy5fcGx1Z2luc1thY3Rpb25dKSB7XG4gICAgICAgICAgICB0aGlzLl9wbHVnaW5zW2FjdGlvbl0gPSBbXTtcbiAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgIERpc3BhdGNoZXIuc3Vic2NyaWJlQWN0aW9uKGFjdGlvbiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBhcmdzID0gW107XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgICAgICAgICAgYXJnc1tfaSAtIDBdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhhdC5oYW5kbGVBY3Rpb24oYWN0aW9uLCBhcmdzKTtcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBfaSA9IDE7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgICAgICAgICBhcmdzW19pIC0gMV0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDsgLy9yZXR1cm4gdGhhdC5wcm92aWRlTWVtZW50b3MoYWN0aW9uLCBhcmdzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9wbHVnaW5zW2FjdGlvbl0uaW5kZXhPZihoYW5kbGVyKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlBsdWdpbiBpbnN0YW5jZXMgY2FuIG9ubHkgYmUgdXNlZCBvbmNlIHBlciBhY3Rpb24hXCIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3BsdWdpbnNbYWN0aW9uXS51bnNoaWZ0KGhhbmRsZXIpO1xuICAgIH07XG4gICAgUGx1Z2luQ29udGFpbmVyLnByb3RvdHlwZS5kZXRhY2ggPSBmdW5jdGlvbiAoYWN0aW9uLCBoYW5kbGVyKSB7XG4gICAgICAgIGlmIChhY3Rpb24gPT09IC0xMDAwIC8qIF9fQU5ZX18gKi8pIHtcbiAgICAgICAgICAgIHRoaXMuX2FueVBsdWdpbnMuc3BsaWNlKHRoaXMuX2FueVBsdWdpbnMuaW5kZXhPZihoYW5kbGVyKSwgMSk7XG4gICAgICAgICAgICBmb3IgKHZhciBhIGluIHRoaXMuX3BsdWdpbnMpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fcGx1Z2lucy5oYXNPd25Qcm9wZXJ0eShhKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wbHVnaW5zW2FdLnNwbGljZSh0aGlzLl9wbHVnaW5zW2FdLmluZGV4T2YoaGFuZGxlciksIDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9wbHVnaW5zW2FjdGlvbl0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9wbHVnaW5zW2FjdGlvbl0uc3BsaWNlKHRoaXMuX3BsdWdpbnNbYWN0aW9uXS5pbmRleE9mKGhhbmRsZXIpLCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIFBsdWdpbkNvbnRhaW5lcjtcbn0pKEV2ZW50Q2hhbm5lbC5DaGFubmVsZWRFbWl0dGVyKTtcbmV4cG9ydHMuUGx1Z2luQ29udGFpbmVyID0gUGx1Z2luQ29udGFpbmVyO1xuZnVuY3Rpb24gY3JlYXRlQ29udGFpbmVyKHNwZWMpIHtcbiAgICByZXR1cm4gVG9vbHMuc3ViY2xhc3Moc3BlYywgUGx1Z2luQ29udGFpbmVyKTtcbn1cbmV4cG9ydHMuY3JlYXRlQ29udGFpbmVyID0gY3JlYXRlQ29udGFpbmVyO1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1wbHVnaW5zLmpzLm1hcCIsIi8qKlxuICogQ3JlYXRlZCBieSBTdGVwaGFuIG9uIDEwLjAxLjIwMTUuXG4gKi9cblwidXNlIHN0cmljdFwiO1xudmFyIFN0cmVhbSA9IHJlcXVpcmUoXCIuL3N0cmVhbVwiKTtcbmV4cG9ydHMuY29tcG9uZW50TGlmZWN5Y2xlID0ge1xuICAgIF93aWxsVW5tb3VudDogbnVsbCxcbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLl93aWxsVW5tb3VudCA9IFN0cmVhbS5jcmVhdGVTdHJlYW0oXCJjb21wb25lbnQtdW5tb3VudFwiKTtcbiAgICB9LFxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuX3dpbGxVbm1vdW50LnB1c2godHJ1ZSk7XG4gICAgICAgIHRoaXMuX3dpbGxVbm1vdW50LmRpc3Bvc2UoKTtcbiAgICB9XG59O1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1yZWFjdE1peGlucy5qcy5tYXAiLCIvKipcbiAqIENyZWF0ZWQgYnkgU3RlcGhhbiBvbiAyOS4xMi4yMDE0LlxuICovXG5cInVzZSBzdHJpY3RcIjtcbnZhciBfX2V4dGVuZHMgPSB0aGlzLl9fZXh0ZW5kcyB8fCBmdW5jdGlvbiAoZCwgYikge1xuICAgIGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdO1xuICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgIF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlO1xuICAgIGQucHJvdG90eXBlID0gbmV3IF9fKCk7XG59O1xudmFyIFRvb2xzID0gcmVxdWlyZShcIi4vdG9vbHNcIik7XG52YXIgU3RyZWFtID0gcmVxdWlyZShcIi4vc3RyZWFtXCIpO1xuLyoqXG4gKiBUZXN0IGlmIHNvbWV0aGluZyBpcyBhIHN0b3JlLlxuICogQHBhcmFtIHRoaW5nXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gaXNTdG9yZSh0aGluZykge1xuICAgIHJldHVybiB0aGluZyBpbnN0YW5jZW9mIFJlY29yZFN0b3JlIHx8IHRoaW5nIGluc3RhbmNlb2YgQXJyYXlTdG9yZSB8fCB0aGluZyBpbnN0YW5jZW9mIEltbXV0YWJsZVJlY29yZCB8fCB0aGluZyBpbnN0YW5jZW9mIEltbXV0YWJsZUFycmF5O1xufVxuZXhwb3J0cy5pc1N0b3JlID0gaXNTdG9yZTtcbmZ1bmN0aW9uIGNyZWF0ZVVwZGF0ZUluZm8oaXRlbSwgdmFsdWUsIHN0b3JlLCBwYXRoLCByb290SXRlbSkge1xuICAgIHZhciByID0ge1xuICAgICAgICBpdGVtOiBpdGVtLFxuICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgIHN0b3JlOiBzdG9yZVxuICAgIH07XG4gICAgaWYgKHBhdGgpIHtcbiAgICAgICAgcltcInBhdGhcIl0gPSBwYXRoO1xuICAgIH1cbiAgICBpZiAocm9vdEl0ZW0gIT0gbnVsbCkge1xuICAgICAgICByW1wicm9vdEl0ZW1cIl0gPSByb290SXRlbTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJbXCJyb290SXRlbVwiXSA9IGl0ZW07XG4gICAgfVxuICAgIHJldHVybiByO1xufVxudmFyIFN0b3JlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTdG9yZSgpIHtcbiAgICAgICAgdGhpcy5fYWRkSXRlbXNTdHJlYW1zID0gW107XG4gICAgICAgIHRoaXMuX3JlbW92ZUl0ZW1zU3RyZWFtcyA9IFtdO1xuICAgICAgICB0aGlzLl91cGRhdGVTdHJlYW1zID0gW107XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2luZ1N0cmVhbXMgPSBbXTtcbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFN0b3JlLnByb3RvdHlwZSwgXCJpc0ltbXV0YWJsZVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBTdG9yZS5wcm90b3R5cGUucmVtb3ZlU3RyZWFtID0gZnVuY3Rpb24gKGxpc3QsIHN0cmVhbSkge1xuICAgICAgICB2YXIgaSA9IGxpc3QuaW5kZXhPZihzdHJlYW0pO1xuICAgICAgICBpZiAoaSAhPT0gLTEpIHtcbiAgICAgICAgICAgIGxpc3Quc3BsaWNlKGksIDEpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU3RvcmUucHJvdG90eXBlLCBcIm5ld0l0ZW1zXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICB2YXIgcyA9IFN0cmVhbS5jcmVhdGVTdHJlYW0oXCJhZGRQcm9wZXJ0eVwiKTtcbiAgICAgICAgICAgIHRoaXMuX2FkZEl0ZW1zU3RyZWFtcy5wdXNoKHMpO1xuICAgICAgICAgICAgcy5vbkNsb3NlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGF0LnJlbW92ZVN0cmVhbSh0aGF0Ll9hZGRJdGVtc1N0cmVhbXMsIHMpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcztcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFN0b3JlLnByb3RvdHlwZSwgXCJyZW1vdmVkSXRlbXNcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgIHZhciBzID0gU3RyZWFtLmNyZWF0ZVN0cmVhbShcInJlbW92ZVByb3BlcnR5XCIpO1xuICAgICAgICAgICAgdGhpcy5fcmVtb3ZlSXRlbXNTdHJlYW1zLnB1c2gocyk7XG4gICAgICAgICAgICBzLm9uQ2xvc2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoYXQucmVtb3ZlU3RyZWFtKHRoYXQuX3JlbW92ZUl0ZW1zU3RyZWFtcywgcyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHMudW50aWwodGhpcy5pc0Rpc3Bvc2luZyk7XG4gICAgICAgICAgICByZXR1cm4gcztcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFN0b3JlLnByb3RvdHlwZSwgXCJ1cGRhdGVzXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICB2YXIgcyA9IFN0cmVhbS5jcmVhdGVTdHJlYW0oXCJ1cGRhdGVQcm9wZXJ0eVwiKTtcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVN0cmVhbXMucHVzaChzKTtcbiAgICAgICAgICAgIHMub25DbG9zZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhhdC5yZW1vdmVTdHJlYW0odGhhdC5fdXBkYXRlU3RyZWFtcywgcyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBzO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU3RvcmUucHJvdG90eXBlLCBcImFsbENoYW5nZXNcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnVwZGF0ZXMuY29tYmluZSh0aGlzLm5ld0l0ZW1zKS5jb21iaW5lKHRoaXMucmVtb3ZlZEl0ZW1zKTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFN0b3JlLnByb3RvdHlwZSwgXCJpc0Rpc3Bvc2luZ1wiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgdmFyIHMgPSBTdHJlYW0uY3JlYXRlU3RyZWFtKFwiZGlzcG9zaW5nXCIpO1xuICAgICAgICAgICAgdGhpcy5fZGlzcG9zaW5nU3RyZWFtcy5wdXNoKHMpO1xuICAgICAgICAgICAgcmV0dXJuIHM7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIFN0b3JlLnByb3RvdHlwZS5kaXNwb3NlU3RyZWFtcyA9IGZ1bmN0aW9uIChzdHJlYW1MaXN0KSB7XG4gICAgICAgIHN0cmVhbUxpc3QuZm9yRWFjaChmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgICAgICAgICBzdHJlYW0uZGlzcG9zZSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgc3RyZWFtTGlzdCA9IFtdO1xuICAgIH07XG4gICAgU3RvcmUucHJvdG90eXBlLmRpc3Bvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2luZ1N0cmVhbXMuZm9yRWFjaChmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgICAgICAgICBzdHJlYW0ucHVzaCh0cnVlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZGlzcG9zZVN0cmVhbXModGhpcy5fcmVtb3ZlSXRlbXNTdHJlYW1zKTtcbiAgICAgICAgdGhpcy5kaXNwb3NlU3RyZWFtcyh0aGlzLl91cGRhdGVTdHJlYW1zKTtcbiAgICAgICAgdGhpcy5kaXNwb3NlU3RyZWFtcyh0aGlzLl9hZGRJdGVtc1N0cmVhbXMpO1xuICAgICAgICB0aGlzLmRpc3Bvc2VTdHJlYW1zKHRoaXMuX2Rpc3Bvc2luZ1N0cmVhbXMpO1xuICAgIH07XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFN0b3JlLnByb3RvdHlwZSwgXCJpbW11dGFibGVcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBTdG9yZS5wcm90b3R5cGUuaXRlbSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfTtcbiAgICByZXR1cm4gU3RvcmU7XG59KSgpO1xuLyoqXG4gKiBCYXNlIGNsYXNzIGZvciBpbW11dGFibGUgc3RvcmVzLlxuICovXG52YXIgSW1tdXRhYmxlU3RvcmUgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhJbW11dGFibGVTdG9yZSwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBJbW11dGFibGVTdG9yZSgpIHtcbiAgICAgICAgX3N1cGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICAgIHJldHVybiBJbW11dGFibGVTdG9yZTtcbn0pKFN0b3JlKTtcbnZhciBSZWNvcmRTdG9yZSA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKFJlY29yZFN0b3JlLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIFJlY29yZFN0b3JlKGluaXRpYWwpIHtcbiAgICAgICAgX3N1cGVyLmNhbGwodGhpcyk7XG4gICAgICAgIHRoaXMuX2RhdGEgPSB7fTtcbiAgICAgICAgdGhpcy5fc3ViU3RyZWFtcyA9IHt9O1xuICAgICAgICBpZiAoaW5pdGlhbCkge1xuICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBpbml0aWFsKSB7XG4gICAgICAgICAgICAgICAgaWYgKGluaXRpYWwuaGFzT3duUHJvcGVydHkocHJvcCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRJdGVtKHByb3AsIGluaXRpYWxbcHJvcF0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBSZWNvcmRTdG9yZS5wcm90b3R5cGUuY2hlY2tOYW1lQWxsb3dlZCA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG4gICAgUmVjb3JkU3RvcmUucHJvdG90eXBlLnNldHVwU3ViU3RyZWFtID0gZnVuY3Rpb24gKG5hbWUsIHZhbHVlKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zZVN1YlN0cmVhbShuYW1lKTtcbiAgICAgICAgaWYgKGlzU3RvcmUodmFsdWUpKSB7XG4gICAgICAgICAgICB2YXIgc3ViU3RyZWFtO1xuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgc3ViU3RyZWFtID0gdmFsdWUudXBkYXRlcztcbiAgICAgICAgICAgIHN1YlN0cmVhbS5mb3JFYWNoKGZ1bmN0aW9uICh1cGRhdGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgaW5mbyA9IGNyZWF0ZVVwZGF0ZUluZm8odXBkYXRlLml0ZW0sIHVwZGF0ZS52YWx1ZSwgdXBkYXRlLnN0b3JlLCB1cGRhdGUucGF0aCA/IG5hbWUgKyBcIi5cIiArIHVwZGF0ZS5wYXRoIDogbmFtZSArIFwiLlwiICsgdXBkYXRlLml0ZW0sIG5hbWUpO1xuICAgICAgICAgICAgICAgIHRoYXQuX3VwZGF0ZVN0cmVhbXMuZm9yRWFjaChmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbS5wdXNoKGluZm8pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLl9zdWJTdHJlYW1zW25hbWVdID0gc3ViU3RyZWFtO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBSZWNvcmRTdG9yZS5wcm90b3R5cGUuZGlzcG9zZVN1YlN0cmVhbSA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIHZhciBzdWJTdHJlYW0gPSB0aGlzLl9zdWJTdHJlYW1zW25hbWVdO1xuICAgICAgICBpZiAoc3ViU3RyZWFtKSB7XG4gICAgICAgICAgICBzdWJTdHJlYW0uZGlzcG9zZSgpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBSZWNvcmRTdG9yZS5wcm90b3R5cGUuYWRkSXRlbSA9IGZ1bmN0aW9uIChuYW1lLCBpbml0aWFsKSB7XG4gICAgICAgIGlmICghdGhpcy5jaGVja05hbWVBbGxvd2VkKG5hbWUpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOYW1lICdcIiArIG5hbWUgKyBcIicgbm90IGFsbG93ZWQgZm9yIHByb3BlcnR5IG9mIG9iamVjdCBzdG9yZS5cIik7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgbmFtZSwge1xuICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoYXQuX2RhdGFbbmFtZV07XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICB0aGF0Ll9kYXRhW25hbWVdID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgdmFyIHVwZGF0ZUluZm8gPSBjcmVhdGVVcGRhdGVJbmZvKG5hbWUsIHZhbHVlLCB0aGF0KTtcbiAgICAgICAgICAgICAgICB0aGF0LnNldHVwU3ViU3RyZWFtKG5hbWUsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICB0aGF0Ll91cGRhdGVTdHJlYW1zLmZvckVhY2goZnVuY3Rpb24gKHN0cmVhbSkge1xuICAgICAgICAgICAgICAgICAgICBzdHJlYW0ucHVzaCh1cGRhdGVJbmZvKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuX2RhdGFbbmFtZV0gPSBpbml0aWFsO1xuICAgICAgICB0aGlzLnNldHVwU3ViU3RyZWFtKG5hbWUsIGluaXRpYWwpO1xuICAgICAgICBpZiAodGhpcy5fYWRkSXRlbXNTdHJlYW1zKSB7XG4gICAgICAgICAgICB0aGlzLl9hZGRJdGVtc1N0cmVhbXMuZm9yRWFjaChmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgc3RyZWFtLnB1c2goY3JlYXRlVXBkYXRlSW5mbyhuYW1lLCBpbml0aWFsLCB0aGF0KSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgUmVjb3JkU3RvcmUucHJvdG90eXBlLnJlbW92ZUl0ZW0gPSBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICBpZiAodGhpcy5fZGF0YS5oYXNPd25Qcm9wZXJ0eShuYW1lKSkge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXNbbmFtZV07XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fZGF0YVtuYW1lXTtcbiAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zZVN1YlN0cmVhbShuYW1lKTtcbiAgICAgICAgICAgIHRoaXMuX3JlbW92ZUl0ZW1zU3RyZWFtcy5mb3JFYWNoKGZ1bmN0aW9uIChzdHJlYW0pIHtcbiAgICAgICAgICAgICAgICBzdHJlYW0ucHVzaChjcmVhdGVVcGRhdGVJbmZvKG5hbWUsIG51bGwsIHRoYXQpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5rbm93biBwcm9wZXJ0eSAnXCIgKyBuYW1lICsgXCInLlwiKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFJlY29yZFN0b3JlLnByb3RvdHlwZSwgXCJpbW11dGFibGVcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5faW1tdXRhYmxlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5faW1tdXRhYmxlID0gbmV3IEltbXV0YWJsZVJlY29yZCh0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9pbW11dGFibGU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShSZWNvcmRTdG9yZS5wcm90b3R5cGUsIFwia2V5c1wiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHIgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGsgaW4gdGhpcy5fZGF0YSkge1xuICAgICAgICAgICAgICAgIHIucHVzaChrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBSZWNvcmRTdG9yZS5wcm90b3R5cGUuZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICB0aGlzLmtleXMuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICBpZiAoaXNTdG9yZSh0aGF0W2tleV0pKSB7XG4gICAgICAgICAgICAgICAgdGhhdFtrZXldLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlbGV0ZSB0aGF0W2tleV07XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLl9kYXRhID0gbnVsbDtcbiAgICAgICAgX3N1cGVyLnByb3RvdHlwZS5kaXNwb3NlLmNhbGwodGhpcyk7XG4gICAgfTtcbiAgICByZXR1cm4gUmVjb3JkU3RvcmU7XG59KShTdG9yZSk7XG52YXIgSW1tdXRhYmxlUmVjb3JkID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoSW1tdXRhYmxlUmVjb3JkLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIEltbXV0YWJsZVJlY29yZChfcGFyZW50KSB7XG4gICAgICAgIF9zdXBlci5jYWxsKHRoaXMpO1xuICAgICAgICB0aGlzLl9wYXJlbnQgPSBfcGFyZW50O1xuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgIF9wYXJlbnQua2V5cy5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIHRoYXQuYWRkSXRlbShrZXkpO1xuICAgICAgICB9KTtcbiAgICAgICAgX3BhcmVudC5uZXdJdGVtcy5mb3JFYWNoKGZ1bmN0aW9uICh1cGRhdGUpIHtcbiAgICAgICAgICAgIHRoYXQuYWRkSXRlbSh1cGRhdGUuaXRlbSk7XG4gICAgICAgIH0pLnVudGlsKF9wYXJlbnQuaXNEaXNwb3NpbmcpO1xuICAgICAgICBfcGFyZW50LnJlbW92ZWRJdGVtcy5mb3JFYWNoKGZ1bmN0aW9uICh1cGRhdGUpIHtcbiAgICAgICAgICAgIHRoYXQucmVtb3ZlSXRlbSh1cGRhdGUuaXRlbSk7XG4gICAgICAgIH0pLnVudGlsKF9wYXJlbnQuaXNEaXNwb3NpbmcpO1xuICAgIH1cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoSW1tdXRhYmxlUmVjb3JkLnByb3RvdHlwZSwgXCJpc0ltbXV0YWJsZVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShJbW11dGFibGVSZWNvcmQucHJvdG90eXBlLCBcImltbXV0YWJsZVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIEltbXV0YWJsZVJlY29yZC5wcm90b3R5cGUuYWRkSXRlbSA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIG5hbWUsIHtcbiAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChpc1N0b3JlKHRoYXQuX3BhcmVudFtuYW1lXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoYXQuX3BhcmVudFtuYW1lXS5pbW11dGFibGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0aGF0Ll9wYXJlbnRbbmFtZV07XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBJbW11dGFibGVSZWNvcmQucHJvdG90eXBlLnJlbW92ZUl0ZW0gPSBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICBkZWxldGUgdGhpc1tuYW1lXTtcbiAgICB9O1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShJbW11dGFibGVSZWNvcmQucHJvdG90eXBlLCBcImtleXNcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9wYXJlbnQua2V5cztcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgSW1tdXRhYmxlUmVjb3JkLnByb3RvdHlwZS5zdWJzY3JpYmVQYXJlbnRTdHJlYW0gPSBmdW5jdGlvbiAocGFyZW50U3RyZWFtKSB7XG4gICAgICAgIHZhciBzdHJlYW0gPSBTdHJlYW0uY3JlYXRlU3RyZWFtKCk7XG4gICAgICAgIHBhcmVudFN0cmVhbS5mb3JFYWNoKGZ1bmN0aW9uICh1cGRhdGUpIHtcbiAgICAgICAgICAgIHN0cmVhbS5wdXNoKHVwZGF0ZSk7XG4gICAgICAgIH0pLnVudGlsKHRoaXMuX3BhcmVudC5pc0Rpc3Bvc2luZyk7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgdGhpcy5fdXBkYXRlU3RyZWFtcy5wdXNoKHN0cmVhbSk7XG4gICAgICAgIHN0cmVhbS5vbkNsb3NlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoYXQucmVtb3ZlU3RyZWFtKHRoYXQuX3VwZGF0ZVN0cmVhbXMsIHN0cmVhbSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gc3RyZWFtO1xuICAgIH07XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEltbXV0YWJsZVJlY29yZC5wcm90b3R5cGUsIFwidXBkYXRlc1wiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3Vic2NyaWJlUGFyZW50U3RyZWFtKHRoaXMuX3BhcmVudC51cGRhdGVzKTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEltbXV0YWJsZVJlY29yZC5wcm90b3R5cGUsIFwibmV3SXRlbXNcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnN1YnNjcmliZVBhcmVudFN0cmVhbSh0aGlzLl9wYXJlbnQubmV3SXRlbXMpO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoSW1tdXRhYmxlUmVjb3JkLnByb3RvdHlwZSwgXCJyZW1vdmVkSXRlbXNcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnN1YnNjcmliZVBhcmVudFN0cmVhbSh0aGlzLl9wYXJlbnQucmVtb3ZlZEl0ZW1zKTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEltbXV0YWJsZVJlY29yZC5wcm90b3R5cGUsIFwiaXNEaXNwb3NpbmdcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnN1YnNjcmliZVBhcmVudFN0cmVhbSh0aGlzLl9wYXJlbnQuaXNEaXNwb3NpbmcpO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICByZXR1cm4gSW1tdXRhYmxlUmVjb3JkO1xufSkoSW1tdXRhYmxlU3RvcmUpO1xuLyoqXG4gKiBSZWN1cnNpdmVseSBidWlsZCBhIG5lc3RlZCBzdG9yZS5cbiAqIEBwYXJhbSB2YWx1ZVxuICogQHJldHVybnMgeyp9XG4gKi9cbmZ1bmN0aW9uIGJ1aWxkRGVlcCh2YWx1ZSkge1xuICAgIGZ1bmN0aW9uIGdldEl0ZW0odmFsdWUpIHtcbiAgICAgICAgdmFyIHY7XG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgIGlmIChUb29scy5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgICAgICAgIHYgPSBidWlsZEFycmF5KHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHYgPSBidWlsZFJlY29yZCh2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2ID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHY7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGJ1aWxkQXJyYXkodmFsdWUpIHtcbiAgICAgICAgdmFyIHN0b3JlID0gbmV3IEFycmF5U3RvcmUoKTtcbiAgICAgICAgdmFsdWUuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgc3RvcmUucHVzaChnZXRJdGVtKGl0ZW0pKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBzdG9yZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gYnVpbGRSZWNvcmQodmFsdWVzKSB7XG4gICAgICAgIHZhciBzdG9yZSA9IG5ldyBSZWNvcmRTdG9yZSgpO1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gdmFsdWVzKSB7XG4gICAgICAgICAgICBpZiAodmFsdWVzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICBzdG9yZS5hZGRJdGVtKGtleSwgZ2V0SXRlbSh2YWx1ZXNba2V5XSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzdG9yZTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICBpZiAoVG9vbHMuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBidWlsZEFycmF5KHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBidWlsZFJlY29yZCh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn1cbi8qKlxuICogQ3JlYXRlIGEgbmV3IHJlY29yZC4gSWYgYW4gaW5pdGlhbCB2YWx1ZSBpcyBnaXZlbiBpdCB3aWxsIGhhdmUgdGhlIGVudW1lcmFibGUgcHJvcGVydGllcyBvZiB0aGF0IHZhbHVlLiBZb3UgY2FuXG4gKiBjcmVhdGUgbmVzdGVkIHN0b3JlcyBieSBwcm92aWRpbmcgYSBjb21wbGV4IG9iamVjdCBhcyBhbiBpbml0aWFsIHZhbHVlLlxuICogQHBhcmFtIGluaXRpYWxcbiAqIEByZXR1cm5zIHsqfVxuICovXG5mdW5jdGlvbiByZWNvcmQoaW5pdGlhbCkge1xuICAgIGlmIChpbml0aWFsKSB7XG4gICAgICAgIHJldHVybiBidWlsZERlZXAoaW5pdGlhbCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gbmV3IFJlY29yZFN0b3JlKCk7XG4gICAgfVxufVxuZXhwb3J0cy5yZWNvcmQgPSByZWNvcmQ7XG52YXIgQXJyYXlTdG9yZSA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKEFycmF5U3RvcmUsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gQXJyYXlTdG9yZShpbml0aWFsLCBhZGRlciwgcmVtb3ZlciwgdXBkYXRlcikge1xuICAgICAgICBfc3VwZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgdGhpcy5fc3Vic3RyZWFtcyA9IHt9O1xuICAgICAgICB0aGlzLl9kYXRhID0gaW5pdGlhbCB8fCBbXTtcbiAgICAgICAgdGhpcy5fbWF4UHJvcHMgPSAwO1xuICAgICAgICB0aGlzLnVwZGF0ZVByb3BlcnRpZXMoKTtcbiAgICAgICAgdGhpcy5fc3luY2VkID0gdHJ1ZTtcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICBpZiAoYWRkZXIpIHtcbiAgICAgICAgICAgIGFkZGVyLmZvckVhY2goZnVuY3Rpb24gKHVwZGF0ZSkge1xuICAgICAgICAgICAgICAgIHRoYXQuc3BsaWNlKHVwZGF0ZS5pdGVtLCAwLCB1cGRhdGUudmFsdWUpO1xuICAgICAgICAgICAgfSkudW50aWwodGhpcy5pc0Rpc3Bvc2luZyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlbW92ZXIpIHtcbiAgICAgICAgICAgIHJlbW92ZXIuZm9yRWFjaChmdW5jdGlvbiAodXBkYXRlKSB7XG4gICAgICAgICAgICAgICAgdGhhdC5zcGxpY2UodXBkYXRlLml0ZW0sIDEpO1xuICAgICAgICAgICAgfSkudW50aWwodGhpcy5pc0Rpc3Bvc2luZyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHVwZGF0ZXIpIHtcbiAgICAgICAgICAgIHVwZGF0ZXIuZm9yRWFjaChmdW5jdGlvbiAodXBkYXRlKSB7XG4gICAgICAgICAgICAgICAgdGhhdFt1cGRhdGUuaXRlbV0gPSB1cGRhdGUudmFsdWU7XG4gICAgICAgICAgICB9KS51bnRpbCh0aGlzLmlzRGlzcG9zaW5nKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBBcnJheVN0b3JlLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGEudG9TdHJpbmcoKTtcbiAgICB9O1xuICAgIEFycmF5U3RvcmUucHJvdG90eXBlLnRvTG9jYWxlU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YS50b0xvY2FsZVN0cmluZygpO1xuICAgIH07XG4gICAgQXJyYXlTdG9yZS5wcm90b3R5cGUuZm9yRWFjaCA9IGZ1bmN0aW9uIChjYWxsYmFja2ZuLCB0aGlzQXJnKSB7XG4gICAgICAgIHRoaXMuX2RhdGEuZm9yRWFjaChjYWxsYmFja2ZuLCB0aGlzQXJnKTtcbiAgICB9O1xuICAgIEFycmF5U3RvcmUucHJvdG90eXBlLmV2ZXJ5ID0gZnVuY3Rpb24gKGNhbGxiYWNrZm4sIHRoaXNBcmcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGEuZXZlcnkoY2FsbGJhY2tmbiwgdGhpc0FyZyk7XG4gICAgfTtcbiAgICBBcnJheVN0b3JlLnByb3RvdHlwZS5zb21lID0gZnVuY3Rpb24gKGNhbGxiYWNrZm4sIHRoaXNBcmcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGEuc29tZShjYWxsYmFja2ZuLCB0aGlzQXJnKTtcbiAgICB9O1xuICAgIEFycmF5U3RvcmUucHJvdG90eXBlLmluZGV4T2YgPSBmdW5jdGlvbiAodmFsdWUsIGZyb21JbmRleCkge1xuICAgICAgICBpZiAoaXNTdG9yZSh2YWx1ZSkgJiYgdmFsdWUuaXNJbW11dGFibGUpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9kYXRhLmluZGV4T2YodmFsdWVbXCJfcGFyZW50XCJdLCBmcm9tSW5kZXgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGEuaW5kZXhPZih2YWx1ZSwgZnJvbUluZGV4KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgQXJyYXlTdG9yZS5wcm90b3R5cGUubGFzdEluZGV4T2YgPSBmdW5jdGlvbiAoc2VhcmNoRWxlbWVudCwgZnJvbUluZGV4KSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhLmxhc3RJbmRleE9mKHNlYXJjaEVsZW1lbnQsIGZyb21JbmRleCk7XG4gICAgfTtcbiAgICBBcnJheVN0b3JlLnByb3RvdHlwZS5qb2luID0gZnVuY3Rpb24gKHNlcGFyYXRvcikge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YS5qb2luKHNlcGFyYXRvcik7XG4gICAgfTtcbiAgICBBcnJheVN0b3JlLnByb3RvdHlwZS5tYXAgPSBmdW5jdGlvbiAoY2FsbGJhY2tmbiwgdGhpc0FyZykge1xuICAgICAgICB2YXIgbWFwcGVkID0gdGhpcy5fZGF0YS5tYXAoY2FsbGJhY2tmbiwgdGhpc0FyZyk7XG4gICAgICAgIHZhciBhZGRlciA9IFN0cmVhbS5jcmVhdGVTdHJlYW0oKTtcbiAgICAgICAgdmFyIHJlbW92ZXIgPSBTdHJlYW0uY3JlYXRlU3RyZWFtKCk7XG4gICAgICAgIHZhciB1cGRhdGVyID0gU3RyZWFtLmNyZWF0ZVN0cmVhbSgpO1xuICAgICAgICB2YXIgbWFwcGVkU3RvcmUgPSBuZXcgQXJyYXlTdG9yZShtYXBwZWQsIGFkZGVyLCByZW1vdmVyLCB1cGRhdGVyKTtcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICB0aGlzLnVwZGF0ZXMuZm9yRWFjaChmdW5jdGlvbiAodXBkYXRlKSB7XG4gICAgICAgICAgICB1cGRhdGVyLnB1c2goY3JlYXRlVXBkYXRlSW5mbyh1cGRhdGUucm9vdEl0ZW0sIGNhbGxiYWNrZm4odGhhdC5fZGF0YVt1cGRhdGUucm9vdEl0ZW1dLCB1cGRhdGUucm9vdEl0ZW0sIHRoYXQuX2RhdGEpLCB1cGRhdGUuc3RvcmUpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMubmV3SXRlbXMuZm9yRWFjaChmdW5jdGlvbiAodXBkYXRlKSB7XG4gICAgICAgICAgICBhZGRlci5wdXNoKGNyZWF0ZVVwZGF0ZUluZm8odXBkYXRlLnJvb3RJdGVtLCBjYWxsYmFja2ZuKHRoYXQuX2RhdGFbdXBkYXRlLnJvb3RJdGVtXSwgdXBkYXRlLnJvb3RJdGVtLCB0aGF0Ll9kYXRhKSwgdXBkYXRlLnN0b3JlKSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnJlbW92ZWRJdGVtcy5mb3JFYWNoKGZ1bmN0aW9uICh1cGRhdGUpIHtcbiAgICAgICAgICAgIHJlbW92ZXIucHVzaChjcmVhdGVVcGRhdGVJbmZvKHVwZGF0ZS5yb290SXRlbSwgdXBkYXRlLnZhbHVlLCB1cGRhdGUuc3RvcmUpKTsgLy8gVGhlIHZhbHVlIGRvZXMgbm90IG1hdHRlciBoZXJlLCBzYXZlIHRoZSBjYWxsIHRvIHRoZSBjYWxsYmFja1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG1hcHBlZFN0b3JlO1xuICAgIH07XG4gICAgQXJyYXlTdG9yZS5wcm90b3R5cGUuZmlsdGVyID0gZnVuY3Rpb24gKGNhbGxiYWNrZm4sIG5vVXBkYXRlcywgdGhpc0FyZykge1xuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgIHZhciBhZGRlcjtcbiAgICAgICAgdmFyIHJlbW92ZXI7XG4gICAgICAgIHZhciB1cGRhdGVyO1xuICAgICAgICB2YXIgZmlsdGVyZWRTdG9yZTtcbiAgICAgICAgdmFyIGluZGV4TWFwID0gW107XG4gICAgICAgIHZhciBmaWx0ZXJlZCA9IFtdO1xuICAgICAgICBmdW5jdGlvbiBtYXAoZm9ySW5kZXgsIHRvSW5kZXgpIHtcbiAgICAgICAgICAgIGluZGV4TWFwW2ZvckluZGV4XSA9IHRvSW5kZXg7XG4gICAgICAgICAgICBpZiAodG9JbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gZm9ySW5kZXggKyAxOyBpIDwgaW5kZXhNYXAubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4TWFwW2ldICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXBbaV0gKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBhZGRNYXAoZnJvbUluZGV4LCB0b0luZGV4KSB7XG4gICAgICAgICAgICBpbmRleE1hcC5zcGxpY2UoZnJvbUluZGV4LCAwLCB0b0luZGV4KTtcbiAgICAgICAgICAgIGlmICh0b0luZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSBmcm9tSW5kZXggKyAxOyBpIDwgaW5kZXhNYXAubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4TWFwW2ldICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXBbaV0gKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiB1bm1hcChmb3JJbmRleCkge1xuICAgICAgICAgICAgdmFyIGRvd25zaGlmdCA9IGlzTWFwcGVkKGZvckluZGV4KTtcbiAgICAgICAgICAgIGluZGV4TWFwW2ZvckluZGV4XSA9IC0xO1xuICAgICAgICAgICAgaWYgKGRvd25zaGlmdCkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSBmb3JJbmRleCArIDE7IGkgPCBpbmRleE1hcC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXhNYXBbaV0gIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hcFtpXSAtPSAxO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIHJlbW92ZU1hcChmb3JJbmRleCkge1xuICAgICAgICAgICAgdmFyIGRvd25zaGlmdCA9IGlzTWFwcGVkKGZvckluZGV4KTtcbiAgICAgICAgICAgIGluZGV4TWFwLnNwbGljZShmb3JJbmRleCwgMSk7XG4gICAgICAgICAgICBpZiAoZG93bnNoaWZ0KSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IGZvckluZGV4OyBpIDwgaW5kZXhNYXAubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4TWFwW2ldICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXBbaV0gLT0gMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBtYXBJbmRleChmcm9tSW5kZXgpIHtcbiAgICAgICAgICAgIHJldHVybiBpbmRleE1hcFtmcm9tSW5kZXhdO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIGlzTWFwcGVkKGluZGV4KSB7XG4gICAgICAgICAgICByZXR1cm4gaW5kZXggPCBpbmRleE1hcC5sZW5ndGggJiYgaW5kZXhNYXBbaW5kZXhdICE9PSAtMTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBnZXRDbG9zZXN0TGVmdE1hcChmb3JJbmRleCkge1xuICAgICAgICAgICAgdmFyIGkgPSBmb3JJbmRleDtcbiAgICAgICAgICAgIHdoaWxlICgoaSA+PSBpbmRleE1hcC5sZW5ndGggfHwgaW5kZXhNYXBbaV0gPT09IC0xKSAmJiBpID4gLTIpIHtcbiAgICAgICAgICAgICAgICBpLS07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaSA8IDApXG4gICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgcmV0dXJuIG1hcEluZGV4KGkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2RhdGEuZm9yRWFjaChmdW5jdGlvbiAodmFsdWUsIGluZGV4KSB7XG4gICAgICAgICAgICBpZiAoY2FsbGJhY2tmbih2YWx1ZSwgaW5kZXgsIHRoYXQuX2RhdGEpKSB7XG4gICAgICAgICAgICAgICAgYWRkTWFwKGluZGV4LCBmaWx0ZXJlZC5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIGZpbHRlcmVkLnB1c2godmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgYWRkTWFwKGluZGV4LCAtMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoIW5vVXBkYXRlcykge1xuICAgICAgICAgICAgYWRkZXIgPSBTdHJlYW0uY3JlYXRlU3RyZWFtKCk7XG4gICAgICAgICAgICByZW1vdmVyID0gU3RyZWFtLmNyZWF0ZVN0cmVhbSgpO1xuICAgICAgICAgICAgdXBkYXRlciA9IFN0cmVhbS5jcmVhdGVTdHJlYW0oKTtcbiAgICAgICAgICAgIHRoaXMubmV3SXRlbXMuZm9yRWFjaChmdW5jdGlvbiAodXBkYXRlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrZm4odGhhdC5fZGF0YVt1cGRhdGUucm9vdEl0ZW1dLCB1cGRhdGUucm9vdEl0ZW0sIHRoYXQuX2RhdGEpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc01hcHBlZCh1cGRhdGUucm9vdEl0ZW0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRlci5wdXNoKGNyZWF0ZVVwZGF0ZUluZm8obWFwSW5kZXgodXBkYXRlLnJvb3RJdGVtKSwgdGhhdC5fZGF0YVt1cGRhdGUucm9vdEl0ZW1dLCB1cGRhdGUuc3RvcmUpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZGVyLnB1c2goY3JlYXRlVXBkYXRlSW5mbyhnZXRDbG9zZXN0TGVmdE1hcCh1cGRhdGUucm9vdEl0ZW0pICsgMSwgdGhhdC5fZGF0YVt1cGRhdGUucm9vdEl0ZW1dLCB1cGRhdGUuc3RvcmUpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBhZGRNYXAodXBkYXRlLnJvb3RJdGVtLCBmaWx0ZXJlZFN0b3JlLmluZGV4T2YodGhhdC5fZGF0YVt1cGRhdGUucm9vdEl0ZW1dKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBhZGRNYXAodXBkYXRlLnJvb3RJdGVtLCAtMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZWRJdGVtcy5mb3JFYWNoKGZ1bmN0aW9uICh1cGRhdGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNNYXBwZWQodXBkYXRlLnJvb3RJdGVtKSkge1xuICAgICAgICAgICAgICAgICAgICByZW1vdmVyLnB1c2goY3JlYXRlVXBkYXRlSW5mbyhtYXBJbmRleCh1cGRhdGUucm9vdEl0ZW0pLCB0aGF0Ll9kYXRhW3VwZGF0ZS5yb290SXRlbV0sIHVwZGF0ZS5zdG9yZSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZW1vdmVNYXAodXBkYXRlLnJvb3RJdGVtKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVzLmZvckVhY2goZnVuY3Rpb24gKHVwZGF0ZSkge1xuICAgICAgICAgICAgICAgIGlmIChjYWxsYmFja2ZuKHRoYXQuX2RhdGFbdXBkYXRlLnJvb3RJdGVtXSwgdXBkYXRlLnJvb3RJdGVtLCB0aGF0Ll9kYXRhKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNNYXBwZWQodXBkYXRlLnJvb3RJdGVtKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlci5wdXNoKGNyZWF0ZVVwZGF0ZUluZm8obWFwSW5kZXgodXBkYXRlLnJvb3RJdGVtKSwgdGhhdC5fZGF0YVt1cGRhdGUucm9vdEl0ZW1dLCB1cGRhdGUuc3RvcmUpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZGVyLnB1c2goY3JlYXRlVXBkYXRlSW5mbyhnZXRDbG9zZXN0TGVmdE1hcCh1cGRhdGUucm9vdEl0ZW0pICsgMSwgdGhhdC5fZGF0YVt1cGRhdGUucm9vdEl0ZW1dLCB1cGRhdGUuc3RvcmUpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcCh1cGRhdGUucm9vdEl0ZW0sIGZpbHRlcmVkU3RvcmUuaW5kZXhPZih0aGF0Ll9kYXRhW3VwZGF0ZS5yb290SXRlbV0pKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzTWFwcGVkKHVwZGF0ZS5yb290SXRlbSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZXIucHVzaChjcmVhdGVVcGRhdGVJbmZvKG1hcEluZGV4KHVwZGF0ZS5yb290SXRlbSksIHRoYXQuX2RhdGFbdXBkYXRlLnJvb3RJdGVtXSwgdXBkYXRlLnN0b3JlKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB1bm1hcCh1cGRhdGUucm9vdEl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFwKHVwZGF0ZS5yb290SXRlbSwgLTEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZmlsdGVyZWRTdG9yZSA9IG5ldyBBcnJheVN0b3JlKGZpbHRlcmVkLCBhZGRlciwgcmVtb3ZlciwgdXBkYXRlcik7XG4gICAgICAgIHJldHVybiBmaWx0ZXJlZFN0b3JlO1xuICAgIH07XG4gICAgQXJyYXlTdG9yZS5wcm90b3R5cGUucmVkdWNlID0gZnVuY3Rpb24gKGNhbGxiYWNrZm4sIGluaXRpYWxWYWx1ZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YS5yZWR1Y2UoY2FsbGJhY2tmbiwgaW5pdGlhbFZhbHVlKTtcbiAgICB9O1xuICAgIEFycmF5U3RvcmUucHJvdG90eXBlLnNvcnQgPSBmdW5jdGlvbiAoY29tcGFyZUZuKSB7XG4gICAgICAgIHZhciBjb3B5ID0gdGhpcy5fZGF0YS5tYXAoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgIHJldHVybiBpdGVtO1xuICAgICAgICB9KTtcbiAgICAgICAgY29weS5zb3J0KGNvbXBhcmVGbik7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgY29weS5mb3JFYWNoKGZ1bmN0aW9uICh2YWx1ZSwgaW5kZXgpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gdGhhdC5fZGF0YVtpbmRleF0pIHtcbiAgICAgICAgICAgICAgICB0aGF0W2luZGV4XSA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuICAgIEFycmF5U3RvcmUucHJvdG90eXBlLnJldmVyc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBjb3B5ID0gdGhpcy5fZGF0YS5tYXAoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgIHJldHVybiBpdGVtO1xuICAgICAgICB9KTtcbiAgICAgICAgY29weS5yZXZlcnNlKCk7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgY29weS5mb3JFYWNoKGZ1bmN0aW9uICh2YWx1ZSwgaW5kZXgpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gdGhhdC5fZGF0YVtpbmRleF0pIHtcbiAgICAgICAgICAgICAgICB0aGF0W2luZGV4XSA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuICAgIEFycmF5U3RvcmUucHJvdG90eXBlLmNvbmNhdCA9IGZ1bmN0aW9uIChhcnJheSkge1xuICAgICAgICB2YXIgbmV3QXJyYXk7XG4gICAgICAgIGlmIChhcnJheSBpbnN0YW5jZW9mIEFycmF5U3RvcmUpIHtcbiAgICAgICAgICAgIG5ld0FycmF5ID0gdGhpcy5fZGF0YS5jb25jYXQoYXJyYXlbXCJfZGF0YVwiXSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBuZXdBcnJheSA9IHRoaXMuX2RhdGEuY29uY2F0KGFycmF5KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IEFycmF5U3RvcmUobmV3QXJyYXkpO1xuICAgIH07XG4gICAgQXJyYXlTdG9yZS5wcm90b3R5cGUuY29uY2F0SW5wbGFjZSA9IGZ1bmN0aW9uIChhcnJheSkge1xuICAgICAgICBpZiAoYXJyYXkgaW5zdGFuY2VvZiBBcnJheVN0b3JlKSB7XG4gICAgICAgICAgICB0aGlzLnNwbGljZS5hcHBseSh0aGlzLCBbdGhpcy5sZW5ndGgsIDBdLmNvbmNhdChhcnJheVtcIl9kYXRhXCJdKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNwbGljZS5hcHBseSh0aGlzLCBbdGhpcy5sZW5ndGgsIDBdLmNvbmNhdChhcnJheSkpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQXJyYXlTdG9yZS5wcm90b3R5cGUsIFwibGVuZ3RoXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZGF0YS5sZW5ndGg7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIEFycmF5U3RvcmUucHJvdG90eXBlLnNldHVwU3ViU3RyZWFtcyA9IGZ1bmN0aW9uIChpdGVtLCB2YWx1ZSkge1xuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgIGlmIChpc1N0b3JlKHZhbHVlKSkge1xuICAgICAgICAgICAgdmFyIHN1YnN0cmVhbSA9IHRoaXMuX3N1YnN0cmVhbXNbVG9vbHMub2lkKHZhbHVlKV07XG4gICAgICAgICAgICBpZiAoc3Vic3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgc3Vic3RyZWFtLnVwZGF0ZXMuZGlzcG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3Vic3RyZWFtID0ge1xuICAgICAgICAgICAgICAgIHVwZGF0ZXM6IHZhbHVlLnVwZGF0ZXNcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBzdWJzdHJlYW0udXBkYXRlcy5mb3JFYWNoKGZ1bmN0aW9uICh1cGRhdGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgdXBkYXRlSW5mbyA9IGNyZWF0ZVVwZGF0ZUluZm8odXBkYXRlLml0ZW0sIHVwZGF0ZS52YWx1ZSwgdGhhdCwgdXBkYXRlLnBhdGggPyBpdGVtICsgXCIuXCIgKyB1cGRhdGUucGF0aCA6IGl0ZW0gKyBcIi5cIiArIHVwZGF0ZS5pdGVtLCBpdGVtKTtcbiAgICAgICAgICAgICAgICB0aGF0Ll91cGRhdGVTdHJlYW1zLmZvckVhY2goZnVuY3Rpb24gKHN0cmVhbSkge1xuICAgICAgICAgICAgICAgICAgICBzdHJlYW0ucHVzaCh1cGRhdGVJbmZvKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5fc3Vic3RyZWFtc1tUb29scy5vaWQodmFsdWUpXSA9IHN1YnN0cmVhbTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogQ2FsbCBhZnRlciByZW1vdmFsIVxuICAgICAqIEBwYXJhbSB2YWx1ZVxuICAgICAqL1xuICAgIEFycmF5U3RvcmUucHJvdG90eXBlLmRpc3Bvc2VTdWJzdHJlYW0gPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgaWYgKGlzU3RvcmUodmFsdWUpICYmIHRoaXMuX2RhdGEuaW5kZXhPZih2YWx1ZSkgPT09IC0xKSB7XG4gICAgICAgICAgICB2YXIgc3ViU3RyZWFtID0gdGhpcy5fc3Vic3RyZWFtc1tUb29scy5vaWQodmFsdWUpXTtcbiAgICAgICAgICAgIGlmIChzdWJTdHJlYW0pIHtcbiAgICAgICAgICAgICAgICBzdWJTdHJlYW0udXBkYXRlcy5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuX3N1YnN0cmVhbXNbVG9vbHMub2lkKHZhbHVlKV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEFycmF5U3RvcmUucHJvdG90eXBlLnVwZGF0ZVByb3BlcnRpZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgdmFyIGk7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLl9kYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0aGF0LnNldHVwU3ViU3RyZWFtcyhpLCB0aGlzLl9kYXRhW2ldKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGkgPSB0aGlzLl9tYXhQcm9wczsgaSA8IHRoaXMuX2RhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIChmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhhdCwgXCJcIiArIGluZGV4LCB7XG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhhdC5fZGF0YVtpbmRleF07XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgb2xkID0gdGhhdC5fZGF0YVtpbmRleF07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgIT09IG9sZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuX2RhdGFbaW5kZXhdID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5kaXNwb3NlU3Vic3RyZWFtKG9sZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5zZXR1cFN1YlN0cmVhbXMoaW5kZXgsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0Ll91cGRhdGVTdHJlYW1zLmZvckVhY2goZnVuY3Rpb24gKHN0cmVhbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJlYW0ucHVzaChjcmVhdGVVcGRhdGVJbmZvKGluZGV4LCB0aGF0Ll9kYXRhW2luZGV4XSwgdGhhdCwgbnVsbCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KShpKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9tYXhQcm9wcyA9IHRoaXMuX2RhdGEubGVuZ3RoO1xuICAgIH07XG4gICAgQXJyYXlTdG9yZS5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHZhbHVlcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgdmFsdWVzW19pIC0gMF0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICB9XG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMuX2RhdGEubGVuZ3RoO1xuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgIHZhbHVlcy5mb3JFYWNoKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdGhhdC5fZGF0YS5wdXNoKHZhbHVlKTtcbiAgICAgICAgICAgIHRoYXQuX2FkZEl0ZW1zU3RyZWFtcy5mb3JFYWNoKGZ1bmN0aW9uIChzdHJlYW0pIHtcbiAgICAgICAgICAgICAgICBzdHJlYW0ucHVzaChjcmVhdGVVcGRhdGVJbmZvKGluZGV4LCB0aGF0Ll9kYXRhW2luZGV4XSwgdGhhdCkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpbmRleCsrO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy51cGRhdGVQcm9wZXJ0aWVzKCk7XG4gICAgfTtcbiAgICBBcnJheVN0b3JlLnByb3RvdHlwZS51bnNoaWZ0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdmFsdWVzID0gW107XG4gICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICB2YWx1ZXNbX2kgLSAwXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICB2YXIgbCA9IHZhbHVlcy5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChsLS0pIHtcbiAgICAgICAgICAgIChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZGF0YS51bnNoaWZ0KHZhbHVlc1swXSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fbmV3SXRlbVN0cmVhbXMuZm9yRWFjaChmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbS5wdXNoKGNyZWF0ZVVwZGF0ZUluZm8oMCwgdGhhdC5fZGF0YVswXSwgdGhhdCkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSkoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnVwZGF0ZVByb3BlcnRpZXMoKTtcbiAgICB9O1xuICAgIEFycmF5U3RvcmUucHJvdG90eXBlLnBvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHIgPSB0aGlzLl9kYXRhLnBvcCgpO1xuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgIHRoaXMuZGlzcG9zZVN1YnN0cmVhbShyKTtcbiAgICAgICAgdGhpcy5fcmVtb3ZlSXRlbXNTdHJlYW1zLmZvckVhY2goZnVuY3Rpb24gKHN0cmVhbSkge1xuICAgICAgICAgICAgc3RyZWFtLnB1c2goY3JlYXRlVXBkYXRlSW5mbyh0aGF0Ll9kYXRhLmxlbmd0aCwgbnVsbCwgdGhhdCkpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHI7XG4gICAgfTtcbiAgICBBcnJheVN0b3JlLnByb3RvdHlwZS5zaGlmdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHIgPSB0aGlzLl9kYXRhLnNoaWZ0KCk7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgdGhpcy5kaXNwb3NlU3Vic3RyZWFtKHIpO1xuICAgICAgICB0aGlzLl9yZW1vdmVJdGVtc1N0cmVhbXMuZm9yRWFjaChmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgICAgICAgICBzdHJlYW0ucHVzaChjcmVhdGVVcGRhdGVJbmZvKDAsIG51bGwsIHRoYXQpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiByO1xuICAgIH07XG4gICAgQXJyYXlTdG9yZS5wcm90b3R5cGUuc3BsaWNlID0gZnVuY3Rpb24gKHN0YXJ0LCBkZWxldGVDb3VudCkge1xuICAgICAgICB2YXIgdmFsdWVzID0gW107XG4gICAgICAgIGZvciAodmFyIF9pID0gMjsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICB2YWx1ZXNbX2kgLSAyXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHJlbW92ZWQgPSB0aGlzLl9kYXRhLnNwbGljZS5hcHBseSh0aGlzLl9kYXRhLCBbc3RhcnQsIGRlbGV0ZUNvdW50XS5jb25jYXQodmFsdWVzKSk7XG4gICAgICAgIHZhciBpbmRleCA9IHN0YXJ0O1xuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgIGlmICh0aGF0Ll9yZW1vdmVJdGVtc1N0cmVhbXMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZW1vdmVkLmZvckVhY2goZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdGhhdC5kaXNwb3NlU3Vic3RyZWFtKHZhbHVlKTtcbiAgICAgICAgICAgICAgICB0aGF0Ll9yZW1vdmVJdGVtc1N0cmVhbXMuZm9yRWFjaChmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbS5wdXNoKGNyZWF0ZVVwZGF0ZUluZm8oaW5kZXgsIHZhbHVlLCB0aGF0KSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaW5kZXgrKztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGluZGV4ID0gc3RhcnQ7XG4gICAgICAgIHZhbHVlcy5mb3JFYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoYXQuX2FkZEl0ZW1zU3RyZWFtcy5mb3JFYWNoKGZ1bmN0aW9uIChzdHJlYW0pIHtcbiAgICAgICAgICAgICAgICBzdHJlYW0ucHVzaChjcmVhdGVVcGRhdGVJbmZvKGluZGV4LCB0aGF0Ll9kYXRhW2luZGV4XSwgdGhhdCkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpbmRleCsrO1xuICAgICAgICB9KTtcbiAgICAgICAgLyogUmVtb3ZlZC4gVGhpcyBzaG91bGQgbm90IGJlIG5lY2Vzc2FyeSBhbmQgaXQgc2ltcGxpZmllcyB0aGUgcmVhY3RpdmUgYXJyYXlcbiAgICAgICAgLy8gSW5kZXggaXMgbm93IGF0IHRoZSBmaXJzdCBpdGVtIGFmdGVyIHRoZSBsYXN0IGluc2VydGVkIHZhbHVlLiBTbyBpZiBkZWxldGVDb3VudCAhPSB2YWx1ZXMubGVuZ3RoXG4gICAgICAgIC8vIHRoZSBpdGVtcyBhZnRlciB0aGUgaW5zZXJ0L3JlbW92ZSBtb3ZlZCBhcm91bmRcbiAgICAgICAgaWYgKGRlbGV0ZUNvdW50ICE9PSB2YWx1ZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAvL3ZhciBkaXN0YW5jZSA9IHZhbHVlcy5sZW5ndGggLSBkZWxldGVDb3VudDtcbiAgICAgICAgICAgIGZvciAoaW5kZXg7IGluZGV4IDwgdGhpcy5fZGF0YS5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgICAgICB0aGF0Ll91cGRhdGVTdHJlYW1zLmZvckVhY2goZnVuY3Rpb24oc3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbS5wdXNoKGNyZWF0ZVVwZGF0ZUluZm88bnVtYmVyPihpbmRleCwgdGhhdC5fZGF0YVtpbmRleF0sIHRoYXQpKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4qL1xuICAgICAgICB0aGlzLnVwZGF0ZVByb3BlcnRpZXMoKTtcbiAgICAgICAgcmV0dXJuIHJlbW92ZWQ7XG4gICAgfTtcbiAgICBBcnJheVN0b3JlLnByb3RvdHlwZS5pbnNlcnQgPSBmdW5jdGlvbiAoYXRJbmRleCkge1xuICAgICAgICB2YXIgdmFsdWVzID0gW107XG4gICAgICAgIGZvciAodmFyIF9pID0gMTsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICB2YWx1ZXNbX2kgLSAxXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zcGxpY2UuYXBwbHkodGhpcywgW2F0SW5kZXgsIDBdLmNvbmNhdCh2YWx1ZXMpKTtcbiAgICB9O1xuICAgIEFycmF5U3RvcmUucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChhdEluZGV4LCBjb3VudCkge1xuICAgICAgICBpZiAoY291bnQgPT09IHZvaWQgMCkgeyBjb3VudCA9IDE7IH1cbiAgICAgICAgcmV0dXJuIHRoaXMuc3BsaWNlKGF0SW5kZXgsIGNvdW50KTtcbiAgICB9O1xuICAgIEFycmF5U3RvcmUucHJvdG90eXBlLmRpc3Bvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKGlzU3RvcmUodGhpc1tpXSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzW2ldLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzW2ldO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2RhdGEgPSBudWxsO1xuICAgICAgICBfc3VwZXIucHJvdG90eXBlLmRpc3Bvc2UuY2FsbCh0aGlzKTtcbiAgICB9O1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShBcnJheVN0b3JlLnByb3RvdHlwZSwgXCJpbW11dGFibGVcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5faW1tdXRhYmxlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5faW1tdXRhYmxlID0gbmV3IEltbXV0YWJsZUFycmF5KHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2ltbXV0YWJsZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgQXJyYXlTdG9yZS5wcm90b3R5cGUuaXRlbSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB2YXIgaSA9IHRoaXMuaW5kZXhPZih2YWx1ZSk7XG4gICAgICAgIGlmIChpICE9PSAtMSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXNbaV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfTtcbiAgICByZXR1cm4gQXJyYXlTdG9yZTtcbn0pKFN0b3JlKTtcbnZhciBJbW11dGFibGVBcnJheSA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKEltbXV0YWJsZUFycmF5LCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIEltbXV0YWJsZUFycmF5KF9wYXJlbnQpIHtcbiAgICAgICAgX3N1cGVyLmNhbGwodGhpcyk7XG4gICAgICAgIHRoaXMuX3BhcmVudCA9IF9wYXJlbnQ7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgX3BhcmVudC5uZXdJdGVtcy5mb3JFYWNoKGZ1bmN0aW9uICh1cGRhdGUpIHtcbiAgICAgICAgICAgIHRoYXQudXBkYXRlUHJvcGVydGllcygpO1xuICAgICAgICB9KS51bnRpbChfcGFyZW50LmlzRGlzcG9zaW5nKTtcbiAgICAgICAgLy8gV2UgZG8gbm90aGluZyB3aGVuIHJlbW92aW5nIGl0ZW1zLiBUaGUgZ2V0dGVyIHdpbGwgcmV0dXJuIHVuZGVmaW5lZC5cbiAgICAgICAgLypcbiAgICAgICAgX2FycmF5LnJlbW92ZWRJdGVtcygpLmZvckVhY2goZnVuY3Rpb24odXBkYXRlKSB7XG5cbiAgICAgICAgfSkudW50aWwoX2FycmF5LmRpc3Bvc2luZygpKTtcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fbWF4UHJvcHMgPSAwO1xuICAgICAgICB0aGlzLnVwZGF0ZVByb3BlcnRpZXMoKTtcbiAgICB9XG4gICAgSW1tdXRhYmxlQXJyYXkucHJvdG90eXBlLnVwZGF0ZVByb3BlcnRpZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgdmFyIGk7XG4gICAgICAgIGZvciAoaSA9IHRoaXMuX21heFByb3BzOyBpIDwgdGhpcy5fcGFyZW50Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAoZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoYXQsIFwiXCIgKyBpbmRleCwge1xuICAgICAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzU3RvcmUodGhhdC5fcGFyZW50W2luZGV4XSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhhdC5fcGFyZW50W2luZGV4XS5pbW11dGFibGU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhhdC5fcGFyZW50W2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSkoaSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fbWF4UHJvcHMgPSB0aGlzLl9wYXJlbnQubGVuZ3RoO1xuICAgIH07XG4gICAgSW1tdXRhYmxlQXJyYXkucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcGFyZW50LnRvU3RyaW5nKCk7XG4gICAgfTtcbiAgICBJbW11dGFibGVBcnJheS5wcm90b3R5cGUudG9Mb2NhbGVTdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wYXJlbnQudG9TdHJpbmcoKTtcbiAgICB9O1xuICAgIEltbXV0YWJsZUFycmF5LnByb3RvdHlwZS5mb3JFYWNoID0gZnVuY3Rpb24gKGNhbGxiYWNrZm4sIHRoaXNBcmcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudC5mb3JFYWNoKGNhbGxiYWNrZm4pO1xuICAgIH07XG4gICAgSW1tdXRhYmxlQXJyYXkucHJvdG90eXBlLmV2ZXJ5ID0gZnVuY3Rpb24gKGNhbGxiYWNrZm4sIHRoaXNBcmcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudC5ldmVyeShjYWxsYmFja2ZuKTtcbiAgICB9O1xuICAgIEltbXV0YWJsZUFycmF5LnByb3RvdHlwZS5zb21lID0gZnVuY3Rpb24gKGNhbGxiYWNrZm4sIHRoaXNBcmcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudC5mb3JFYWNoKGNhbGxiYWNrZm4pO1xuICAgIH07XG4gICAgSW1tdXRhYmxlQXJyYXkucHJvdG90eXBlLmluZGV4T2YgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudC5pbmRleE9mKHZhbHVlKTtcbiAgICB9O1xuICAgIEltbXV0YWJsZUFycmF5LnByb3RvdHlwZS5sYXN0SW5kZXhPZiA9IGZ1bmN0aW9uIChzZWFyY2hFbGVtZW50LCBmcm9tSW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudC5sYXN0SW5kZXhPZihzZWFyY2hFbGVtZW50LCBmcm9tSW5kZXgpO1xuICAgIH07XG4gICAgSW1tdXRhYmxlQXJyYXkucHJvdG90eXBlLmpvaW4gPSBmdW5jdGlvbiAoc2VwYXJhdG9yKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wYXJlbnQuam9pbihzZXBhcmF0b3IpO1xuICAgIH07XG4gICAgSW1tdXRhYmxlQXJyYXkucHJvdG90eXBlLm1hcCA9IGZ1bmN0aW9uIChjYWxsYmFja2ZuLCB0aGlzQXJnKSB7XG4gICAgICAgIC8vVGhpcyBpcyBkaXJ0eSBidXQgYW55dGhpbmcgZWxzZSB3b3VsZCBiZSBpbnBlcmZvcm1hbnQganVzdCBiZWNhdXNlIHR5cGVzY3JpcHQgZG9lcyBub3QgaGF2ZSBwcm90ZWN0ZWQgc2NvcGVcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudFtcIl9kYXRhXCJdLm1hcChjYWxsYmFja2ZuKTtcbiAgICB9O1xuICAgIEltbXV0YWJsZUFycmF5LnByb3RvdHlwZS5maWx0ZXIgPSBmdW5jdGlvbiAoY2FsbGJhY2tmbiwgdGhpc0FyZykge1xuICAgICAgICAvL1RoaXMgaXMgZGlydHkgYnV0IGFueXRoaW5nIGVsc2Ugd291bGQgYmUgaW5wZXJmb3JtYW50IGp1c3QgYmVjYXVzZSB0eXBlc2NyaXB0IGRvZXMgbm90IGhhdmUgcHJvdGVjdGVkIHNjb3BlXG4gICAgICAgIHJldHVybiB0aGlzLl9wYXJlbnRbXCJfZGF0YVwiXS5maWx0ZXIoY2FsbGJhY2tmbik7XG4gICAgfTtcbiAgICBJbW11dGFibGVBcnJheS5wcm90b3R5cGUucmVkdWNlID0gZnVuY3Rpb24gKGNhbGxiYWNrZm4sIGluaXRpYWxWYWx1ZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcGFyZW50LnJlZHVjZShjYWxsYmFja2ZuLCBpbml0aWFsVmFsdWUpO1xuICAgIH07XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEltbXV0YWJsZUFycmF5LnByb3RvdHlwZSwgXCJsZW5ndGhcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9wYXJlbnQubGVuZ3RoO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBJbW11dGFibGVBcnJheS5wcm90b3R5cGUuc3Vic2NyaWJlUGFyZW50U3RyZWFtID0gZnVuY3Rpb24gKHBhcmVudFN0cmVhbSkge1xuICAgICAgICB2YXIgc3RyZWFtID0gU3RyZWFtLmNyZWF0ZVN0cmVhbSgpO1xuICAgICAgICBwYXJlbnRTdHJlYW0uZm9yRWFjaChmdW5jdGlvbiAodXBkYXRlKSB7XG4gICAgICAgICAgICBzdHJlYW0ucHVzaCh1cGRhdGUpO1xuICAgICAgICB9KS51bnRpbCh0aGlzLl9wYXJlbnQuaXNEaXNwb3NpbmcpO1xuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgIHRoaXMuX3VwZGF0ZVN0cmVhbXMucHVzaChzdHJlYW0pO1xuICAgICAgICBzdHJlYW0ub25DbG9zZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGF0LnJlbW92ZVN0cmVhbSh0aGF0Ll91cGRhdGVTdHJlYW1zLCBzdHJlYW0pO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHN0cmVhbTtcbiAgICB9O1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShJbW11dGFibGVBcnJheS5wcm90b3R5cGUsIFwidXBkYXRlc1wiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3Vic2NyaWJlUGFyZW50U3RyZWFtKHRoaXMuX3BhcmVudC51cGRhdGVzKTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEltbXV0YWJsZUFycmF5LnByb3RvdHlwZSwgXCJuZXdJdGVtc1wiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3Vic2NyaWJlUGFyZW50U3RyZWFtKHRoaXMuX3BhcmVudC5uZXdJdGVtcyk7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShJbW11dGFibGVBcnJheS5wcm90b3R5cGUsIFwicmVtb3ZlZEl0ZW1zXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zdWJzY3JpYmVQYXJlbnRTdHJlYW0odGhpcy5fcGFyZW50LnJlbW92ZWRJdGVtcyk7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShJbW11dGFibGVBcnJheS5wcm90b3R5cGUsIFwiZGlzcG9zaW5nXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zdWJzY3JpYmVQYXJlbnRTdHJlYW0odGhpcy5fcGFyZW50LmlzRGlzcG9zaW5nKTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEltbXV0YWJsZUFycmF5LnByb3RvdHlwZSwgXCJpbW11dGFibGVcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICByZXR1cm4gSW1tdXRhYmxlQXJyYXk7XG59KShJbW11dGFibGVTdG9yZSk7XG4vKipcbiAqIENyZWF0ZSBhbiBhcnJheSBzdG9yZS4gSWYgYW4gaW5pdGlhbCB2YWx1ZSBpcyBwcm92aWRlZCBpdCB3aWxsIGluaXRpYWxpemUgdGhlIGFycmF5XG4gKiB3aXRoIGl0LiBUaGUgaW5pdGlhbCB2YWx1ZSBjYW4gYmUgYSBKYXZhU2NyaXB0IGFycmF5IG9mIGVpdGhlciBzaW1wbGUgdmFsdWVzIG9yIHBsYWluIG9iamVjdHMuXG4gKiBJdCB0aGUgYXJyYXkgaGFzIHBsYWluIG9iamVjdHMgYSBuZXN0ZWQgc3RvcmUgd2lsbCBiZSBjcmVhdGVkLlxuICogQHBhcmFtIGluaXRpYWxcbiAqIEByZXR1cm5zIHsqfVxuICovXG5mdW5jdGlvbiBhcnJheShpbml0aWFsKSB7XG4gICAgaWYgKGluaXRpYWwpIHtcbiAgICAgICAgcmV0dXJuIGJ1aWxkRGVlcChpbml0aWFsKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiBuZXcgQXJyYXlTdG9yZSgpO1xuICAgIH1cbn1cbmV4cG9ydHMuYXJyYXkgPSBhcnJheTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c3RvcmUuanMubWFwIiwiLyoqXG4gKiBDcmVhdGVkIGJ5IFN0ZXBoYW4gb24gMjcuMTIuMjAxNC5cbiAqXG4gKiBBIHNpbXBsZSBpbXBsZW1lbnRhdGlvbiBvZiBhIGNvbGxlY3Rpb24gc3RyZWFtIHRoYXQgc3VwcG9ydHMgcmVhY3RpdmUgcGF0dGVybnMuXG4gKlxuICovXG5cInVzZSBzdHJpY3RcIjtcbi8qKlxuICogQmFzZSBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgY29sbGVjdGlvbiBzdHJlYW1cbiAqL1xudmFyIFN0cmVhbSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU3RyZWFtKF9uYW1lKSB7XG4gICAgICAgIHRoaXMuX25hbWUgPSBfbmFtZTtcbiAgICAgICAgdGhpcy5fYnVmZmVyID0gW107XG4gICAgICAgIHRoaXMuX21ldGhvZHMgPSBbXTtcbiAgICAgICAgdGhpcy5fZXJyb3JNZXRob2RzID0gW107XG4gICAgICAgIHRoaXMuX2Nsb3NlTWV0aG9kcyA9IFtdO1xuICAgICAgICB0aGlzLl9jbG9zZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fbGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy5fbWF4TGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy5fbmV4dFN0cmVhbXMgPSBbXTtcbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFN0cmVhbS5wcm90b3R5cGUsIFwibmFtZVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX25hbWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTdHJlYW0ucHJvdG90eXBlLCBcImxlbmd0aFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2xlbmd0aDtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgU3RyZWFtLnByb3RvdHlwZS5jYWxsQ2xvc2VNZXRob2RzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgIHRoaXMuX2Nsb3NlTWV0aG9kcy5mb3JFYWNoKGZ1bmN0aW9uIChtKSB7XG4gICAgICAgICAgICBtLmNhbGwodGhhdCk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgU3RyZWFtLnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9jbG9zZWQpIHtcbiAgICAgICAgICAgIHRoaXMuX2Nsb3NlZCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLmNhbGxDbG9zZU1ldGhvZHMoKTtcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zZSgpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBTdHJlYW0ucHJvdG90eXBlLmRpc3Bvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgdGhpcy5fbWV0aG9kcyA9IFtdO1xuICAgICAgICB0aGlzLl9idWZmZXIgPSBbXTtcbiAgICAgICAgdGhpcy5fY2xvc2VNZXRob2RzID0gW107XG4gICAgICAgIHRoaXMuX2Vycm9yTWV0aG9kcyA9IFtdO1xuICAgIH07XG4gICAgU3RyZWFtLnByb3RvdHlwZS50aW1lcyA9IGZ1bmN0aW9uIChtYXhMZW5ndGgpIHtcbiAgICAgICAgdGhpcy5fbWF4TGVuZ3RoID0gbWF4TGVuZ3RoO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIFN0cmVhbS5wcm90b3R5cGUudW50aWwgPSBmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgaWYgKHN0cmVhbSkge1xuICAgICAgICAgICAgc3RyZWFtLmZvckVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoYXQuY2xvc2UoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFN0cmVhbS5wcm90b3R5cGUsIFwiY2xvc2VkXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY2xvc2VkO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBTdHJlYW0ucHJvdG90eXBlLmFkZFRvQnVmZmVyID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuX2J1ZmZlci51bnNoaWZ0KHZhbHVlKTtcbiAgICB9O1xuICAgIFN0cmVhbS5wcm90b3R5cGUucHJvY2Vzc0J1ZmZlciA9IGZ1bmN0aW9uIChidWZmZXIsIG1ldGhvZHMsIGJhc2VJbmRleCkge1xuICAgICAgICBpZiAodGhpcy5fY2xvc2VkKVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIGlmICghbWV0aG9kcy5sZW5ndGgpXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgdmFyIGwgPSBidWZmZXIubGVuZ3RoO1xuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgIHZhciBlcnJvcnMgPSBbXTtcbiAgICAgICAgd2hpbGUgKGwtLSkge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gYnVmZmVyLnBvcCgpO1xuICAgICAgICAgICAgbWV0aG9kcy5mb3JFYWNoKGZ1bmN0aW9uIChtLCBpKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgbS5jYWxsKHRoYXQsIHZhbHVlLCBpICsgYmFzZUluZGV4KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLnB1c2goZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGVycm9ycztcbiAgICB9O1xuICAgIFN0cmVhbS5wcm90b3R5cGUucHJvY2Vzc0J1ZmZlcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBlcnJvcnMgPSB0aGlzLnByb2Nlc3NCdWZmZXIodGhpcy5fYnVmZmVyLCB0aGlzLl9tZXRob2RzLCB0aGlzLl9sZW5ndGggLSB0aGlzLl9idWZmZXIubGVuZ3RoKTtcbiAgICAgICAgaWYgKGVycm9ycyAmJiBlcnJvcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fZXJyb3JNZXRob2RzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHRoaXMucHJvY2Vzc0J1ZmZlcihlcnJvcnMsIHRoaXMuX2Vycm9yTWV0aG9kcywgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBlcnJvcnMuZm9yRWFjaChmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICBTdHJlYW0ucHJvdG90eXBlLmFkZE1ldGhvZCA9IGZ1bmN0aW9uIChtZXRob2QpIHtcbiAgICAgICAgdmFyIGZpcnN0TWV0aG9kID0gdGhpcy5fbWV0aG9kcy5sZW5ndGggPT09IDA7XG4gICAgICAgIHRoaXMuX21ldGhvZHMucHVzaChtZXRob2QpO1xuICAgICAgICBpZiAoZmlyc3RNZXRob2QpIHtcbiAgICAgICAgICAgIHRoaXMucHJvY2Vzc0J1ZmZlcnMoKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgU3RyZWFtLnByb3RvdHlwZS5yZW1vdmVNZXRob2QgPSBmdW5jdGlvbiAobWV0aG9kKSB7XG4gICAgICAgIHRoaXMuX21ldGhvZHMuaW5kZXhPZihtZXRob2QpO1xuICAgIH07XG4gICAgU3RyZWFtLnByb3RvdHlwZS5hZGRFcnJvck1ldGhvZCA9IGZ1bmN0aW9uIChtZXRob2QpIHtcbiAgICAgICAgdGhpcy5fZXJyb3JNZXRob2RzLnB1c2gobWV0aG9kKTtcbiAgICB9O1xuICAgIFN0cmVhbS5wcm90b3R5cGUuYWRkQ2xvc2VNZXRob2QgPSBmdW5jdGlvbiAobWV0aG9kKSB7XG4gICAgICAgIGlmICh0aGlzLmNsb3NlZCkge1xuICAgICAgICAgICAgbWV0aG9kLmNhbGwodGhpcyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9jbG9zZU1ldGhvZHMucHVzaChtZXRob2QpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBTdHJlYW0ucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9jbG9zZWQpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkVG9CdWZmZXIodmFsdWUpO1xuICAgICAgICAgICAgdGhpcy5fbGVuZ3RoKys7XG4gICAgICAgICAgICB0aGlzLnByb2Nlc3NCdWZmZXJzKCk7XG4gICAgICAgICAgICBpZiAodGhpcy5fbGVuZ3RoID09PSB0aGlzLl9tYXhMZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFN0cmVhbS5wcm90b3R5cGUucHVzaEVycm9yID0gZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgIC8vIElmIHdlIGNhbid0IGhhbmRsZSB0aGUgZXJyb3Igb3Vyc2VsdmVzIHdlIHRocm93IGl0IGFnYWluLiBUaGF0IHdpbGwgZ2l2ZSBwcmVjZWRpbmcgc3RyZWFtcyB0aGUgY2hhbmNlIHRvIGhhbmRsZSB0aGVzZVxuICAgICAgICBpZiAoIXRoaXMuX2Vycm9yTWV0aG9kcyB8fCAhdGhpcy5fZXJyb3JNZXRob2RzLmxlbmd0aCkge1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5wcm9jZXNzQnVmZmVyKFtlcnJvcl0sIHRoaXMuX2Vycm9yTWV0aG9kcywgMCk7XG4gICAgfTtcbiAgICBTdHJlYW0ucHJvdG90eXBlLmZvckVhY2ggPSBmdW5jdGlvbiAobWV0aG9kKSB7XG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG1ldGhvZCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgU3RyZWFtLnByb3RvdHlwZS5yZWdpc3Rlck5leHRTdHJlYW0gPSBmdW5jdGlvbiAobmV4dFN0cmVhbSkge1xuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgIHRoaXMuX25leHRTdHJlYW1zLnB1c2gobmV4dFN0cmVhbSk7XG4gICAgICAgIG5leHRTdHJlYW0ub25DbG9zZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgaSA9IHRoYXQuX25leHRTdHJlYW1zLmluZGV4T2YobmV4dFN0cmVhbSk7XG4gICAgICAgICAgICBpZiAoaSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICB0aGF0Ll9uZXh0U3RyZWFtcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGF0Ll9uZXh0U3RyZWFtcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5jbG9zZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBTdHJlYW0ucHJvdG90eXBlLmFkZE1ldGhvZFRvTmV4dFN0cmVhbSA9IGZ1bmN0aW9uIChuZXh0U3RyZWFtLCBtZXRob2QsIG9uQ2xvc2UpIHtcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICB2YXIgZm4gPSBmdW5jdGlvbiAodmFsdWUsIGluZGV4KSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIG1ldGhvZC5jYWxsKHRoYXQsIHZhbHVlLCBpbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIG5leHRTdHJlYW0ucHVzaEVycm9yKGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmFkZE1ldGhvZChmbik7XG4gICAgICAgIG5leHRTdHJlYW0ub25DbG9zZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGF0LnJlbW92ZU1ldGhvZChmbik7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnJlZ2lzdGVyTmV4dFN0cmVhbShuZXh0U3RyZWFtKTtcbiAgICAgICAgaWYgKCFvbkNsb3NlKSB7XG4gICAgICAgICAgICB0aGlzLm9uQ2xvc2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIG5leHRTdHJlYW0uY2xvc2UoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5vbkNsb3NlKG9uQ2xvc2UpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBTdHJlYW0ucHJvdG90eXBlLmZpbHRlciA9IGZ1bmN0aW9uIChtZXRob2QpIHtcbiAgICAgICAgdmFyIG5leHRTdHJlYW0gPSBuZXcgU3RyZWFtKHRoaXMuX25hbWUgKyBcIi5maWx0ZXJcIik7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgaWYgKHR5cGVvZiBtZXRob2QgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhpcy5hZGRNZXRob2RUb05leHRTdHJlYW0obmV4dFN0cmVhbSwgZnVuY3Rpb24gKHZhbHVlLCBpbmRleCkge1xuICAgICAgICAgICAgICAgIGlmIChtZXRob2QuY2FsbCh0aGF0LCB2YWx1ZSwgaW5kZXgpKSB7XG4gICAgICAgICAgICAgICAgICAgIG5leHRTdHJlYW0ucHVzaCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmFkZE1ldGhvZFRvTmV4dFN0cmVhbShuZXh0U3RyZWFtLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICBpZiAobWV0aG9kID09IHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIG5leHRTdHJlYW0ucHVzaCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX2Nsb3NlZCkge1xuICAgICAgICAgICAgbmV4dFN0cmVhbS5jbG9zZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXh0U3RyZWFtO1xuICAgIH07XG4gICAgU3RyZWFtLnByb3RvdHlwZS5tYXAgPSBmdW5jdGlvbiAobWV0aG9kKSB7XG4gICAgICAgIHZhciBuZXh0U3RyZWFtID0gbmV3IFN0cmVhbSh0aGlzLl9uYW1lICsgXCIubWFwXCIpO1xuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgIGlmICh0eXBlb2YgbWV0aG9kID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkTWV0aG9kVG9OZXh0U3RyZWFtKG5leHRTdHJlYW0sIGZ1bmN0aW9uICh2YWx1ZSwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICBuZXh0U3RyZWFtLnB1c2gobWV0aG9kLmNhbGwodGhhdCwgdmFsdWUsIGluZGV4KSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuYWRkTWV0aG9kVG9OZXh0U3RyZWFtKG5leHRTdHJlYW0sIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIG5leHRTdHJlYW0ucHVzaChtZXRob2QpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX2Nsb3NlZCkge1xuICAgICAgICAgICAgbmV4dFN0cmVhbS5jbG9zZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXh0U3RyZWFtO1xuICAgIH07XG4gICAgU3RyZWFtLnByb3RvdHlwZS5zY2FuID0gZnVuY3Rpb24gKG1ldGhvZCwgc2VlZCkge1xuICAgICAgICB2YXIgbmV4dFN0cmVhbSA9IG5ldyBTdHJlYW0odGhpcy5fbmFtZSArIFwiLnNjYW5cIik7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgdmFyIHNjYW5uZWQgPSBzZWVkO1xuICAgICAgICB0aGlzLmFkZE1ldGhvZFRvTmV4dFN0cmVhbShuZXh0U3RyZWFtLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHNjYW5uZWQgPSBtZXRob2QuY2FsbCh0aGF0LCBzY2FubmVkLCB2YWx1ZSk7XG4gICAgICAgICAgICBuZXh0U3RyZWFtLnB1c2goc2Nhbm5lZCk7XG4gICAgICAgIH0pO1xuICAgICAgICBuZXh0U3RyZWFtLnB1c2goc2Nhbm5lZCk7XG4gICAgICAgIGlmICh0aGlzLl9jbG9zZWQpIHtcbiAgICAgICAgICAgIG5leHRTdHJlYW0uY2xvc2UoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV4dFN0cmVhbTtcbiAgICB9O1xuICAgIFN0cmVhbS5wcm90b3R5cGUucmVkdWNlID0gZnVuY3Rpb24gKG1ldGhvZCwgc2VlZCkge1xuICAgICAgICB2YXIgbmV4dFN0cmVhbSA9IG5ldyBTdHJlYW0odGhpcy5fbmFtZSArIFwiLnJlZHVjZVwiKTtcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICB2YXIgcmVkdWNlZCA9IHNlZWQ7XG4gICAgICAgIHRoaXMuYWRkTWV0aG9kVG9OZXh0U3RyZWFtKG5leHRTdHJlYW0sIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgcmVkdWNlZCA9IG1ldGhvZC5jYWxsKHRoYXQsIHJlZHVjZWQsIHZhbHVlKTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbmV4dFN0cmVhbS5wdXNoKHJlZHVjZWQpO1xuICAgICAgICAgICAgbmV4dFN0cmVhbS5jbG9zZSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHRoaXMuX2Nsb3NlZCkge1xuICAgICAgICAgICAgbmV4dFN0cmVhbS5jbG9zZSgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucmVnaXN0ZXJOZXh0U3RyZWFtKG5leHRTdHJlYW0pO1xuICAgICAgICByZXR1cm4gbmV4dFN0cmVhbTtcbiAgICB9O1xuICAgIFN0cmVhbS5wcm90b3R5cGUuY29uY2F0ID0gZnVuY3Rpb24gKHN0cmVhbSkge1xuICAgICAgICB2YXIgbmV4dFN0cmVhbSA9IG5ldyBTdHJlYW0odGhpcy5fbmFtZSArIFwiLmNvbmNhdFwiKTtcbiAgICAgICAgdmFyIGJ1ZmZlciA9IG51bGw7XG4gICAgICAgIC8vIFdoZW4gdGhpcyBpcyBhbHJlYWR5IGNsb3NlZCwgd2Ugb25seSBjYXJlIGZvciB0aGUgb3RoZXIgc3RyZWFtXG4gICAgICAgIGlmICghdGhpcy5fY2xvc2VkKSB7XG4gICAgICAgICAgICBidWZmZXIgPSBbXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmIChzdHJlYW0uY2xvc2VkKSB7XG4gICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5jbG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIFdlIG5lZWQgdG8gYnVmZmVyLCBiZWNhdXNlIHRoaXMgbWF5IG5vdCBiZSB0aGUgZmlyc3RcbiAgICAgICAgLy8gbWV0aG9kIGF0dGFjaGVkIHRvIHRoZSBzdHJlYW0uIE90aGVyd2lzZSBhbnkgZGF0YSB0aGF0XG4gICAgICAgIC8vIGlzIHB1c2hlZCB0byBzdHJlYW0gYmVmb3JlIHRoZSBvcmlnaW5hbCBpcyBjbG9zZWQgd291bGRcbiAgICAgICAgLy8gYmUgbG9zdCBmb3IgdGhlIGNvbmNhdC5cbiAgICAgICAgc3RyZWFtLmZvckVhY2goZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAoYnVmZmVyKSB7XG4gICAgICAgICAgICAgICAgYnVmZmVyLnB1c2godmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5wdXNoKHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHN0cmVhbS5vbkNsb3NlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICghYnVmZmVyKSB7XG4gICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5jbG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5hZGRNZXRob2RUb05leHRTdHJlYW0obmV4dFN0cmVhbSwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICBuZXh0U3RyZWFtLnB1c2godmFsdWUpO1xuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoYnVmZmVyKSB7XG4gICAgICAgICAgICAgICAgYnVmZmVyLmZvckVhY2goZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIG5leHRTdHJlYW0ucHVzaCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoc3RyZWFtLmNsb3NlZCkge1xuICAgICAgICAgICAgICAgIG5leHRTdHJlYW0uY2xvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJ1ZmZlciA9IG51bGw7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAodGhpcy5fY2xvc2VkICYmIHN0cmVhbS5jbG9zZWQpIHtcbiAgICAgICAgICAgIG5leHRTdHJlYW0uY2xvc2UoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV4dFN0cmVhbTtcbiAgICB9O1xuICAgIFN0cmVhbS5wcm90b3R5cGUuY29uY2F0QWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbmV4dFN0cmVhbSA9IG5ldyBTdHJlYW0odGhpcy5fbmFtZSArIFwiLmNvbmNhdEFsbFwiKTtcbiAgICAgICAgdmFyIHF1ZXVlID0gW107XG4gICAgICAgIHZhciBjdXJzb3IgPSBudWxsO1xuICAgICAgICBmdW5jdGlvbiBuZXh0SW5RdWV1ZSgpIHtcbiAgICAgICAgICAgIHZhciBsID0gcXVldWUubGVuZ3RoO1xuICAgICAgICAgICAgd2hpbGUgKGwtLSkge1xuICAgICAgICAgICAgICAgIGN1cnNvciA9IHF1ZXVlW2xdO1xuICAgICAgICAgICAgICAgIHVwZGF0ZSgpO1xuICAgICAgICAgICAgICAgIGlmIChjdXJzb3IuZG9uZSkge1xuICAgICAgICAgICAgICAgICAgICBxdWV1ZS5wb3AoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gdXBkYXRlKCkge1xuICAgICAgICAgICAgaWYgKGN1cnNvcikge1xuICAgICAgICAgICAgICAgIHZhciBsID0gY3Vyc29yLmRhdGEubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHdoaWxlIChsLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5wdXNoKGN1cnNvci5kYXRhLnBvcCgpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gY29uY2F0U3RyZWFtKHN0cmVhbSkge1xuICAgICAgICAgICAgdmFyIHN1YkJ1ZmZlciA9IHtcbiAgICAgICAgICAgICAgICBkYXRhOiBbXSxcbiAgICAgICAgICAgICAgICBkb25lOiBmYWxzZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHF1ZXVlLnVuc2hpZnQoc3ViQnVmZmVyKTtcbiAgICAgICAgICAgIHN0cmVhbS5mb3JFYWNoKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHN1YkJ1ZmZlci5kYXRhLnVuc2hpZnQodmFsdWUpO1xuICAgICAgICAgICAgICAgIHVwZGF0ZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBzdHJlYW0ub25DbG9zZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc3ViQnVmZmVyLmRvbmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIG5leHRJblF1ZXVlKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICBjdXJzb3IgPSBzdWJCdWZmZXI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uIChzdWJTdHJlYW0pIHtcbiAgICAgICAgICAgIGNvbmNhdFN0cmVhbShzdWJTdHJlYW0pO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5vbkNsb3NlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG5leHRTdHJlYW0uY2xvc2UoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICh0aGlzLl9jbG9zZWQpIHtcbiAgICAgICAgICAgIG5leHRTdHJlYW0uY2xvc2UoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJlZ2lzdGVyTmV4dFN0cmVhbShuZXh0U3RyZWFtKTtcbiAgICAgICAgcmV0dXJuIG5leHRTdHJlYW07XG4gICAgfTtcbiAgICBTdHJlYW0ucHJvdG90eXBlLmNvbWJpbmUgPSBmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgdmFyIG5leHRTdHJlYW0gPSBuZXcgU3RyZWFtKHRoaXMuX25hbWUgKyBcIi5jb21iaW5lXCIpO1xuICAgICAgICB0aGlzLmZvckVhY2goZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICBuZXh0U3RyZWFtLnB1c2godmFsdWUpO1xuICAgICAgICB9KTtcbiAgICAgICAgc3RyZWFtLmZvckVhY2goZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICBuZXh0U3RyZWFtLnB1c2godmFsdWUpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5vbkNsb3NlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChzdHJlYW0uY2xvc2VkKSB7XG4gICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5jbG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgc3RyZWFtLm9uQ2xvc2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHRoYXQuX2Nsb3NlZCkge1xuICAgICAgICAgICAgICAgIG5leHRTdHJlYW0uY2xvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGlmICh0aGlzLl9jbG9zZWQgJiYgc3RyZWFtLmNsb3NlZCkge1xuICAgICAgICAgICAgbmV4dFN0cmVhbS5jbG9zZSgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucmVnaXN0ZXJOZXh0U3RyZWFtKG5leHRTdHJlYW0pO1xuICAgICAgICByZXR1cm4gbmV4dFN0cmVhbTtcbiAgICB9O1xuICAgIFN0cmVhbS5wcm90b3R5cGUub25DbG9zZSA9IGZ1bmN0aW9uIChtZXRob2QpIHtcbiAgICAgICAgdGhpcy5hZGRDbG9zZU1ldGhvZChtZXRob2QpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIFN0cmVhbS5wcm90b3R5cGUub25FcnJvciA9IGZ1bmN0aW9uIChtZXRob2QpIHtcbiAgICAgICAgdGhpcy5hZGRFcnJvck1ldGhvZChtZXRob2QpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIHJldHVybiBTdHJlYW07XG59KSgpO1xuZXhwb3J0cy5TdHJlYW0gPSBTdHJlYW07XG4vKipcbiAqIENyZWF0ZSBhIG5ldyBzdHJlYW0uIFRoZSBuYW1lIGlzIG1vc3RseSBmb3IgZGVidWdnaW5nIHB1cnBvc2VzIGFuZCBjYW4gYmUgb21pdHRlZC4gSXQgZGVmYXVsdHMgdG8gJ3N0cmVhbScgdGhlbi5cbiAqIEBwYXJhbSBuYW1lXG4gKiBAcmV0dXJucyB7U3RyZWFtfVxuICovXG5mdW5jdGlvbiBjcmVhdGVTdHJlYW0obmFtZSkge1xuICAgIHJldHVybiBuZXcgU3RyZWFtKG5hbWUgfHwgXCJzdHJlYW1cIik7XG59XG5leHBvcnRzLmNyZWF0ZVN0cmVhbSA9IGNyZWF0ZVN0cmVhbTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c3RyZWFtLmpzLm1hcCIsIi8qKlxuICogQ3JlYXRlZCBieSBTdGVwaGFuLlNtb2xhIG9uIDMwLjEwLjIwMTQuXG4gKi9cblwidXNlIHN0cmljdFwiO1xuLyoqXG4gKiBEZXRlcm1pbmUgdGhlIHNjcmVlbiBwb3NpdGlvbiBhbmQgc2l6ZSBvZiBhbiBlbGVtZW50IGluIHRoZSBET01cbiAqIEBwYXJhbSBlbGVtZW50XG4gKiBAcmV0dXJucyB7e3g6IG51bWJlciwgeTogbnVtYmVyLCB3OiBudW1iZXIsIGg6IG51bWJlcn19XG4gKi9cbmZ1bmN0aW9uIGVsZW1lbnRQb3NpdGlvbkFuZFNpemUoZWxlbWVudCkge1xuICAgIHZhciByZWN0ID0gZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICByZXR1cm4geyB4OiByZWN0LmxlZnQsIHk6IHJlY3QudG9wLCB3OiByZWN0LndpZHRoLCBoOiByZWN0LmhlaWdodCB9O1xufVxuZXhwb3J0cy5lbGVtZW50UG9zaXRpb25BbmRTaXplID0gZWxlbWVudFBvc2l0aW9uQW5kU2l6ZTtcbnZhciBwZnggPSBbXG4gICAgeyBpZDogXCJ3ZWJraXRcIiwgY2FtZWxDYXNlOiB0cnVlIH0sXG4gICAgeyBpZDogXCJNU1wiLCBjYW1lbENhc2U6IHRydWUgfSxcbiAgICB7IGlkOiBcIm9cIiwgY2FtZWxDYXNlOiB0cnVlIH0sXG4gICAgeyBpZDogXCJcIiwgY2FtZWxDYXNlOiBmYWxzZSB9XG5dO1xuLyoqXG4gKiBBZGQgZXZlbnQgbGlzdGVuZXIgZm9yIHByZWZpeGVkIGV2ZW50cy4gQXMgdGhlIGNhbWVsIGNhc2luZyBvZiB0aGUgZXZlbnQgbGlzdGVuZXJzIGlzIGRpZmZlcmVudFxuICogYWNyb3NzIGJyb3dzZXJzIHlvdSBuZWVkIHRvIHNwZWNpZml5IHRoZSB0eXBlIGNhbWVsY2FzZWQgc3RhcnRpbmcgd2l0aCBhIGNhcGl0YWwgbGV0dGVyLiBUaGUgZnVuY3Rpb25cbiAqIHRoZW4gdGFrZXMgY2FyZSBvZiB0aGUgYnJvd3NlciBzcGVjaWZpY3MuXG4gKlxuICogQHBhcmFtIGVsZW1lbnRcbiAqIEBwYXJhbSB0eXBlXG4gKiBAcGFyYW0gY2FsbGJhY2tcbiAqL1xuZnVuY3Rpb24gYWRkUHJlZml4ZWRFdmVudExpc3RlbmVyKGVsZW1lbnQsIHR5cGUsIGNhbGxiYWNrKSB7XG4gICAgZm9yICh2YXIgcCA9IDA7IHAgPCBwZngubGVuZ3RoOyBwKyspIHtcbiAgICAgICAgaWYgKCFwZnhbcF0uY2FtZWxDYXNlKVxuICAgICAgICAgICAgdHlwZSA9IHR5cGUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKHBmeFtwXS5pZCArIHR5cGUsIGNhbGxiYWNrLCBmYWxzZSk7XG4gICAgfVxufVxuZXhwb3J0cy5hZGRQcmVmaXhlZEV2ZW50TGlzdGVuZXIgPSBhZGRQcmVmaXhlZEV2ZW50TGlzdGVuZXI7XG4vKipcbiAqIENvbnZlbmllbmNlIG1ldGhvZCBmb3IgY2FsbGluZyBjYWxsYmFja3NcbiAqIEBwYXJhbSBjYiAgICBUaGUgY2FsbGJhY2sgZnVuY3Rpb24gdG8gY2FsbFxuICovXG5mdW5jdGlvbiBjYWxsQ2FsbGJhY2soY2IpIHtcbiAgICB2YXIgYW55ID0gW107XG4gICAgZm9yICh2YXIgX2kgPSAxOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgYW55W19pIC0gMV0gPSBhcmd1bWVudHNbX2ldO1xuICAgIH1cbiAgICBpZiAoY2IpIHtcbiAgICAgICAgaWYgKHR5cGVvZiAoY2IpID09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgYXJncy5wdXNoKGFyZ3VtZW50c1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY2IuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYWxsYmFjayBpcyBub3QgYSBmdW5jdGlvbiFcIik7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLmNhbGxDYWxsYmFjayA9IGNhbGxDYWxsYmFjaztcbi8qKlxuICogQ2hlY2sgaWYgc29tZXRoaW5nIGlzIGFuIGFycmF5LlxuICogQHBhcmFtIHRoaW5nXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gaXNBcnJheSh0aGluZykge1xuICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodGhpbmcpID09PSAnW29iamVjdCBBcnJheV0nO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcbnZhciBPSURfUFJPUCA9IFwiX19JRF9fXCI7XG52YXIgb2lkcyA9IDEwMDAwO1xuLyoqXG4gKiBDcmVhdGUgYW5kIHJldHVybiBhIHVuaXF1ZSBpZCBvbiBhIEphdmFTY3JpcHQgb2JqZWN0LiBUaGlzIGFkZHMgYSBuZXcgcHJvcGVydHlcbiAqIF9fSURfXyB0byB0aGF0IG9iamVjdC4gSWRzIGFyZSBudW1iZXJzLlxuICpcbiAqIFRoZSBJRCBpcyBjcmVhdGVkIHRoZSBmaXJzdCB0aW1lIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGZvciB0aGF0IG9iamVjdCBhbmQgdGhlblxuICogd2lsbCBzaW1wbHkgYmUgcmV0dXJuZWQgb24gYWxsIHN1YnNlcXVlbnQgY2FsbHMuXG4gKlxuICogQHBhcmFtIG9ialxuICogQHJldHVybnMge2FueX1cbiAqL1xuZnVuY3Rpb24gb2lkKG9iaikge1xuICAgIGlmIChvYmopIHtcbiAgICAgICAgaWYgKCFvYmouaGFzT3duUHJvcGVydHkoT0lEX1BST1ApKSB7XG4gICAgICAgICAgICBvYmpbT0lEX1BST1BdID0gb2lkcysrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvYmpbT0lEX1BST1BdO1xuICAgIH1cbn1cbmV4cG9ydHMub2lkID0gb2lkO1xuZnVuY3Rpb24gYXBwbHlNaXhpbnMoZGVyaXZlZEN0b3IsIGJhc2VDdG9ycykge1xuICAgIGJhc2VDdG9ycy5mb3JFYWNoKGZ1bmN0aW9uIChiYXNlQ3Rvcikge1xuICAgICAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhiYXNlQ3RvcikuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgZGVyaXZlZEN0b3IucHJvdG90eXBlW25hbWVdID0gYmFzZUN0b3JbbmFtZV07XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuLyoqXG4gKiBVc2UgdGhpcyB0byBzdWJjbGFzcyBhIHR5cGVzY3JpcHQgY2xhc3MgdXNpbmcgcGxhaW4gSmF2YVNjcmlwdC4gU3BlYyBpcyBhbiBvYmplY3RcbiAqIGNvbnRhaW5pbmcgcHJvcGVydGllcyBhbmQgbWV0aG9kcyBvZiB0aGUgbmV3IGNsYXNzLiBNZXRob2RzIGluIHNwZWMgd2lsbCBvdmVycmlkZVxuICogbWV0aG9kcyBpbiBiYXNlQ2xhc3MuXG4gKlxuICogWW91IHdpbGwgTk9UIGJlIGFibGUgdG8gbWFrZSBzdXBlciBjYWxscyBpbiB0aGUgc3ViY2xhc3MuXG4gKlxuICogQHBhcmFtIHNwZWNcbiAqIEBwYXJhbSBiYXNlQ2xhc3NcbiAqIEByZXR1cm5zIHthbnl9XG4gKi9cbmZ1bmN0aW9uIHN1YmNsYXNzKHNwZWMsIGJhc2VDbGFzcykge1xuICAgIHZhciBjb25zdHJ1Y3RvcjtcbiAgICBpZiAoc3BlYy5oYXNPd25Qcm9wZXJ0eShcImNvbnN0cnVjdG9yXCIpKSB7XG4gICAgICAgIGNvbnN0cnVjdG9yID0gc3BlY1tcImNvbnN0cnVjdG9yXCJdO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgY29uc3RydWN0b3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBiYXNlQ2xhc3MucHJvdG90eXBlLmNvbnN0cnVjdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIGNvbnN0cnVjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoYmFzZUNsYXNzLnByb3RvdHlwZSk7XG4gICAgYXBwbHlNaXhpbnMoY29uc3RydWN0b3IsIFtzcGVjXSk7XG4gICAgcmV0dXJuIGNvbnN0cnVjdG9yO1xufVxuZXhwb3J0cy5zdWJjbGFzcyA9IHN1YmNsYXNzO1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD10b29scy5qcy5tYXAiXX0=
