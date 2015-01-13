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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQ29tbW9uSlNCcm93c2VyaWZ5X0pTXFxtYWluLmpzIiwibm9kZV9tb2R1bGVzXFxmbHVzc1xcaW5kZXguanMiLCJub2RlX21vZHVsZXNcXGZsdXNzXFxsaWJcXGJhc2VBY3Rpb25zLmpzIiwibm9kZV9tb2R1bGVzXFxmbHVzc1xcbGliXFxkaXNwYXRjaGVyLmpzIiwibm9kZV9tb2R1bGVzXFxmbHVzc1xcbGliXFxlbWl0dGVyLmpzIiwibm9kZV9tb2R1bGVzXFxmbHVzc1xcbGliXFxlcnJvcnMuanMiLCJub2RlX21vZHVsZXNcXGZsdXNzXFxsaWJcXGV2ZW50Q2hhbm5lbC5qcyIsIm5vZGVfbW9kdWxlc1xcZmx1c3NcXGxpYlxccGx1Z2lucy5qcyIsIm5vZGVfbW9kdWxlc1xcZmx1c3NcXGxpYlxccmVhY3RNaXhpbnMuanMiLCJub2RlX21vZHVsZXNcXGZsdXNzXFxsaWJcXHN0b3JlLmpzIiwibm9kZV9tb2R1bGVzXFxmbHVzc1xcbGliXFxzdHJlYW0uanMiLCJub2RlX21vZHVsZXNcXGZsdXNzXFxsaWJcXHRvb2xzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbldBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ovQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgU3RlcGhhbiBvbiAxMS4wMS4yMDE1LlxyXG4gKi9cclxuXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIFN0b3JlID0gcmVxdWlyZShcImZsdXNzXCIpLlN0b3JlO1xyXG5cclxudmFyIGFycmF5ID0gU3RvcmUuYXJyYXkoKTtcclxuXHJcbmFycmF5Lm5ld0l0ZW1zLmZvckVhY2goZnVuY3Rpb24odXBkYXRlKSB7XHJcbiAgICBkb2N1bWVudC53cml0ZSh1cGRhdGUudmFsdWUgKyBcIiB3YXMgYWRkZWQuPGJyPlwiKVxyXG59KTtcclxuXHJcbmRvY3VtZW50LndyaXRlKFwiPGgxPmZsdXNzIC0gY29tbW9uSlMsIGJyb3dzZXJpZnksIEphdmFzY3JpcHQ8L2gxPlwiKTtcclxuXHJcbmFycmF5LnB1c2goXCJPbmVcIik7XHJcbmFycmF5LnB1c2goMik7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IFN0ZXBoYW4gb24gMTMuMDEuMjAxNS5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgbXRvb2xzID0gcmVxdWlyZSgnLi9saWIvdG9vbHMnKTtcbnZhciBtZGlzcGF0Y2hlciA9IHJlcXVpcmUoJy4vbGliL2Rpc3BhdGNoZXInKTtcbnZhciBtcGx1Z2lucyA9IHJlcXVpcmUoJy4vbGliL3BsdWdpbnMnKTtcbnZhciBtcmVhY3RNaXhpbnMgPSByZXF1aXJlKCcuL2xpYi9yZWFjdE1peGlucycpO1xudmFyIG1zdG9yZSA9IHJlcXVpcmUoJy4vbGliL3N0b3JlJyk7XG52YXIgbXN0cmVhbSA9IHJlcXVpcmUoJy4vbGliL3N0cmVhbScpO1xudmFyIG1iYXNlQWN0aW9ucyA9IHJlcXVpcmUoJy4vbGliL2Jhc2VBY3Rpb25zJyk7XG5leHBvcnRzLlRvb2xzID0gbXRvb2xzO1xuZXhwb3J0cy5CYXNlQWN0aW9ucyA9IG1iYXNlQWN0aW9ucztcbmV4cG9ydHMuRGlzcGF0Y2hlciA9IG1kaXNwYXRjaGVyO1xuZXhwb3J0cy5QbHVnaW5zID0gbXBsdWdpbnM7XG5leHBvcnRzLlN0b3JlID0gbXN0b3JlO1xuZXhwb3J0cy5TdHJlYW0gPSBtc3RyZWFtO1xuZXhwb3J0cy5SZWFjdE1peGlucyA9IG1yZWFjdE1peGlucztcbiIsIi8qKlxuICogQ3JlYXRlZCBieSBTdGVwaGFuLlNtb2xhIG9uIDI4LjEwLjIwMTQuXG4gKi9cblwidXNlIHN0cmljdFwiO1xudmFyIERpc3BhdGNoZXIgPSByZXF1aXJlKFwiLi9kaXNwYXRjaGVyXCIpO1xuKGZ1bmN0aW9uIChBQ1RJT05TKSB7XG4gICAgQUNUSU9OU1tBQ1RJT05TW1wiX19BTllfX1wiXSA9IC0xMDAwXSA9IFwiX19BTllfX1wiO1xuICAgIEFDVElPTlNbQUNUSU9OU1tcIlVORE9cIl0gPSAtMjAwMF0gPSBcIlVORE9cIjtcbn0pKGV4cG9ydHMuQUNUSU9OUyB8fCAoZXhwb3J0cy5BQ1RJT05TID0ge30pKTtcbnZhciBBQ1RJT05TID0gZXhwb3J0cy5BQ1RJT05TO1xuLyoqXG4gKiBHZW5lcmljIGFjdGlvbiB0cmlnZ2VyIHRoYXQgY2FuIGJlIGZlZCBieSBwYXNzaW5nIHRoZSBhY3Rpb24gaWQgYW5kIHBhcmFtZXRlcnMuXG4gKiBDYW4gYmUgdXNlZCBpbiBzaXR1YXRpb25zIHdoZXJlIGFjdGlvbnMgYXJlIHRyaWdnZXJlZCBiYXNlZCBvbiBhIGNvbmZpZ3VyYXRpb24uXG4gKlxuICogRXhwbGljaXQgRnVuY3Rpb25zIGFyZSByZWNvbW1lbmRlZCBmb3IgYWxsIGFjdGlvbnMsIGJlY2F1c2UgdGhleSBtYWtlIGNvZGluZyBlYXNpZXJcbiAqIGFuZCBjb2RlIG1vcmUgcmVhZGFibGVcbiAqXG4gKiBAcGFyYW0gYWN0aW9uXG4gKiBAcGFyYW0gYXJnc1xuICovXG5mdW5jdGlvbiB0cmlnZ2VyQWN0aW9uKGFjdGlvbikge1xuICAgIHZhciBhcmdzID0gW107XG4gICAgZm9yICh2YXIgX2kgPSAxOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgYXJnc1tfaSAtIDFdID0gYXJndW1lbnRzW19pXTtcbiAgICB9XG4gICAgRGlzcGF0Y2hlci5nZXREaXNwYXRjaGVyKCkuZGlzcGF0Y2hBY3Rpb24uYXBwbHkoRGlzcGF0Y2hlci5nZXREaXNwYXRjaGVyKCksIFthY3Rpb25dLmNvbmNhdChhcmdzKSk7XG59XG5leHBvcnRzLnRyaWdnZXJBY3Rpb24gPSB0cmlnZ2VyQWN0aW9uO1xuZnVuY3Rpb24gdW5kbygpIHtcbiAgICBEaXNwYXRjaGVyLmdldERpc3BhdGNoZXIoKS5kaXNwYXRjaEFjdGlvbigtMjAwMCAvKiBVTkRPICovKTtcbn1cbmV4cG9ydHMudW5kbyA9IHVuZG87XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWJhc2VBY3Rpb25zLmpzLm1hcCIsIi8qKlxuICogQ3JlYXRlZCBieSBTdGVwaGFuLlNtb2xhIG9uIDI4LjEwLjIwMTQuXG4gKi9cblwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9IHRoaXMuX19leHRlbmRzIHx8IGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07XG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XG4gICAgX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGU7XG4gICAgZC5wcm90b3R5cGUgPSBuZXcgX18oKTtcbn07XG52YXIgRXJyb3JzID0gcmVxdWlyZShcIi4vZXJyb3JzXCIpO1xudmFyIEV2ZW50Q2hhbm5lbCA9IHJlcXVpcmUoXCIuL2V2ZW50Q2hhbm5lbFwiKTtcbnZhciBBY3Rpb25zID0gcmVxdWlyZShcIi4vYmFzZUFjdGlvbnNcIik7XG4vKipcbiAqIENyZWF0ZSBhIG1lbWVudG8gb2JqZWN0LlxuICogQHBhcmFtIGluc3RhbmNlXG4gKiBAcGFyYW0gZGF0YVxuICogQHBhcmFtIHJlZG9cbiAqIEBwYXJhbSB1bmRvICAgICAgT3B0aW9uYWxseSB5b3UgY2FuIHByb3ZpZGUgYW4gYWN0aW9uIGZvciB1bmRvaW5nLCBpZiB0aGF0IGlzIHNpbXBsZXIgdGhhbiBzdG9yaW5nIGRhdGFcbiAqIEByZXR1cm5zIHt7ZGF0YTogYW55LCByZWRvOiBJQWN0aW9uLCBpbnN0YW5jZTogSVVuZG9hYmxlfX1cbiAqL1xuZnVuY3Rpb24gY3JlYXRlTWVtZW50byhpbnN0YW5jZSwgZGF0YSkge1xuICAgIHJldHVybiB7XG4gICAgICAgIGFjdGlvbjogLTEsXG4gICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgIHJlZG86IG51bGwsXG4gICAgICAgIHVuZG86IG51bGwsXG4gICAgICAgIGluc3RhbmNlOiBpbnN0YW5jZVxuICAgIH07XG59XG5leHBvcnRzLmNyZWF0ZU1lbWVudG8gPSBjcmVhdGVNZW1lbnRvO1xuLyoqXG4gKiBDcmVhdGUgYSByZWRvIG9iamVjdC5cbiAqIEBwYXJhbSBhY3Rpb25cbiAqIEBwYXJhbSBkYXRhXG4gKiBAcmV0dXJucyB7e2FjdGlvbjogbnVtYmVyLCBkYXRhOiBhbnl9fVxuICovXG5mdW5jdGlvbiBjcmVhdGVSZWRvKGFjdGlvbiwgZGF0YSkge1xuICAgIHJldHVybiB7XG4gICAgICAgIGFjdGlvbjogYWN0aW9uLFxuICAgICAgICBkYXRhOiBkYXRhXG4gICAgfTtcbn1cbmV4cG9ydHMuY3JlYXRlUmVkbyA9IGNyZWF0ZVJlZG87XG5mdW5jdGlvbiBjcmVhdGVVbmRvQWN0aW9uKGFjdGlvbikge1xuICAgIHZhciBhcmdzID0gW107XG4gICAgZm9yICh2YXIgX2kgPSAxOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgYXJnc1tfaSAtIDFdID0gYXJndW1lbnRzW19pXTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgYWN0aW9uOiAtMSxcbiAgICAgICAgZGF0YTogbnVsbCxcbiAgICAgICAgcmVkbzogbnVsbCxcbiAgICAgICAgdW5kbzoge1xuICAgICAgICAgICAgYWN0aW9uOiBhY3Rpb24sXG4gICAgICAgICAgICBkYXRhOiBhcmdzXG4gICAgICAgIH0sXG4gICAgICAgIGluc3RhbmNlOiBudWxsXG4gICAgfTtcbn1cbmV4cG9ydHMuY3JlYXRlVW5kb0FjdGlvbiA9IGNyZWF0ZVVuZG9BY3Rpb247XG4vKipcbiAqIEV2ZW50cyB0aGF0IGFyZSByYWlzZWQgYnkgdGhlIHVuZG8gbWFuYWdlci5cbiAqL1xuKGZ1bmN0aW9uIChFVkVOVFMpIHtcbiAgICBFVkVOVFNbRVZFTlRTW1wiVU5ET1wiXSA9IDBdID0gXCJVTkRPXCI7XG4gICAgRVZFTlRTW0VWRU5UU1tcIlJFRE9cIl0gPSAxXSA9IFwiUkVET1wiO1xuICAgIEVWRU5UU1tFVkVOVFNbXCJNRU1FTlRPX1NUT1JFRFwiXSA9IDJdID0gXCJNRU1FTlRPX1NUT1JFRFwiO1xuICAgIEVWRU5UU1tFVkVOVFNbXCJDTEVBUlwiXSA9IDNdID0gXCJDTEVBUlwiO1xufSkoZXhwb3J0cy5FVkVOVFMgfHwgKGV4cG9ydHMuRVZFTlRTID0ge30pKTtcbnZhciBFVkVOVFMgPSBleHBvcnRzLkVWRU5UUztcbi8qKlxuICogSW1wbGVtZW50YXRpb24gb2YgYSBkaXNwYXRjaGVyIGFzIGRlc2NyaWJlZCBieSB0aGUgRkxVWCBwYXR0ZXJuLlxuICovXG52YXIgRGlzcGF0Y2hlciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRGlzcGF0Y2hlcigpIHtcbiAgICAgICAgdGhpcy5faGFuZGxlcnMgPSB7fTtcbiAgICAgICAgdGhpcy5fZGlzcGF0Y2hpbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fdW5kb2luZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9kaXNhYmxlZCA9IHt9O1xuICAgIH1cbiAgICBEaXNwYXRjaGVyLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLl9oYW5kbGVycyA9IHt9O1xuICAgICAgICB0aGlzLl9kaXNwYXRjaGluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLl91bmRvaW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX2Rpc2FibGVkID0ge307XG4gICAgfTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoRGlzcGF0Y2hlci5wcm90b3R5cGUsIFwidW5kb2luZ1wiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3VuZG9pbmc7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIC8qKlxuICAgICAqIFRoZSBhY3R1YWwgZGlzcGF0Y2hcbiAgICAgKiBAcGFyYW0gZG9NZW1lbnRvXG4gICAgICogQHBhcmFtIHR5cGVcbiAgICAgKiBAcGFyYW0gYXJnc1xuICAgICAqL1xuICAgIERpc3BhdGNoZXIucHJvdG90eXBlLmRpc3BhdGNoID0gZnVuY3Rpb24gKGRvTWVtZW50bywgdHlwZSwgYXJncykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFyIG1lbWVudG9zID0gW107XG4gICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICB2YXIgZG9pdCA9IGZ1bmN0aW9uIChfX3R5cGUsIGRpc3BhdGNoLCB0cnVlVHlwZSkge1xuICAgICAgICAgICAgICAgIGlmICh0aGF0Ll9oYW5kbGVyc1tfX3R5cGVdKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQuX2hhbmRsZXJzW19fdHlwZV0uZm9yRWFjaChmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRvTWVtZW50byAmJiBkWzFdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1lbWVudG8gPSBkWzFdLmFwcGx5KHRoYXQsIFt0cnVlVHlwZSB8fCBfX3R5cGVdLmNvbmNhdChhcmdzKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1lbWVudG8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChtZW1lbnRvKSA9PT0gXCJbb2JqZWN0IEFycmF5XVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseShtZW1lbnRvcywgbWVtZW50byk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZW1lbnRvcy5wdXNoKG1lbWVudG8pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGF0Y2goZFswXSwgYXJncyk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBkb2l0KHR5cGUsIGZ1bmN0aW9uIChoYW5kbGVyLCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZG9pdCgtMTAwMCAvKiBfX0FOWV9fICovLCBmdW5jdGlvbiAoaGFuZGxlciwgYXJncykge1xuICAgICAgICAgICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgW3R5cGUsIGFyZ3NdKTtcbiAgICAgICAgICAgIH0sIHR5cGUpO1xuICAgICAgICAgICAgaWYgKG1lbWVudG9zLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGdldFVuZG9NYW5hZ2VyKCkuc3RvcmVNZW1lbnRvcyhtZW1lbnRvcywgdHlwZSwgY3JlYXRlUmVkbyh0eXBlLCBhcmdzKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHZhciBtc2cgPSBcIkludGVybmFsIGVycm9yLiBJZiB0aGlzIGhhcHBlbnMgcGxlYXNlIGNoZWNrIGlmIGl0IHdhcyBhIHVzZXIgZXJyb3IgXFxuXCIgKyBcInRoYXQgY2FuIGJlIGVpdGhlciBwcmV2ZW50ZWQgb3IgZ3JhY2VmdWxseSBoYW5kbGVkLlxcblxcblwiO1xuICAgICAgICAgICAgbXNnICs9IFwiSGFuZGxlZCBhY3Rpb246IFwiICsgdHlwZSArIFwiXFxuXCI7XG4gICAgICAgICAgICBtc2cgKz0gXCJDcmVhdGUgbWVtZW50bzogXCIgKyAoZG9NZW1lbnRvID8gXCJ5ZXNcXG5cIiA6IFwibm9cXG5cIik7XG4gICAgICAgICAgICB2YXIgYXJnU3RyID0gXCJcIjtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXJnU3RyID0gSlNPTi5zdHJpbmdpZnkoYXJncywgbnVsbCwgMik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGFyZ1N0ciA9IFwiSXQncyBhIGNpcmN1bGFyIHN0cnVjdHVyZSA6LShcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG1zZyArPSBcIkFyZ3VtZW50cyAgICAgOiBcIiArIGFyZ1N0ciArIFwiXFxuXCI7XG4gICAgICAgICAgICBtc2cgKz0gXCJNZW1lbnRvcyAgICAgIDogXCIgKyAobWVtZW50b3MgPyBKU09OLnN0cmluZ2lmeShtZW1lbnRvcywgbnVsbCwgMikgOiBcIm5vbmVcIikgKyBcIlxcblwiO1xuICAgICAgICAgICAgbXNnICs9IFwiRXhjZXB0aW9uICAgICA6IFwiICsgZS5tZXNzYWdlICsgXCJcXG5cIjtcbiAgICAgICAgICAgIG1zZyArPSBcIlN0YWNrIHRyYWNlICAgOlxcblwiICsgZS5zdGFjayArIFwiXFxuXCI7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhtc2cpO1xuICAgICAgICAgICAgRXJyb3JzLmZyYW1ld29yayhlLm1lc3NhZ2UsIGUsIHRoYXQpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBEaXNwYXRjaCBhbiB1bmRvIGFjdGlvbi4gVGhpcyBpcyBiYXNpY2FsbHkgdGhlIHNhbWUgYXMgZGlzcGF0Y2hpbmcgYSByZWd1bGFyXG4gICAgICogYWN0aW9uLCBidXQgdGhlIG1lbWVudG8gd2lsbCBub3QgYmUgY3JlYXRlZC5cbiAgICAgKiBAcGFyYW0gdHlwZVxuICAgICAqIEBwYXJhbSBhcmdzXG4gICAgICovXG4gICAgRGlzcGF0Y2hlci5wcm90b3R5cGUuZGlzcGF0Y2hVbmRvQWN0aW9uID0gZnVuY3Rpb24gKGFjdGlvbikge1xuICAgICAgICB2YXIgYXJncyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDE7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgYXJnc1tfaSAtIDFdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuX2Rpc2FibGVkW2FjdGlvbl0pIHtcbiAgICAgICAgICAgIHRoaXMuX3VuZG9pbmcgPSB0cnVlO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3BhdGNoKGZhbHNlLCBhY3Rpb24sIGFyZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZmluYWxseSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fdW5kb2luZyA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBEaXNwYXRjaCwgaS5lLiBicm9hZGNhc3QgYW4gYWN0aW9uIHRvIGFueW9uZSB0aGF0J3MgaW50ZXJlc3RlZC5cbiAgICAgKiBAcGFyYW0gdHlwZVxuICAgICAqIEBwYXJhbSBkYXRhXG4gICAgICovXG4gICAgRGlzcGF0Y2hlci5wcm90b3R5cGUuZGlzcGF0Y2hBY3Rpb24gPSBmdW5jdGlvbiAoYWN0aW9uKSB7XG4gICAgICAgIHZhciBhcmdzID0gW107XG4gICAgICAgIGZvciAodmFyIF9pID0gMTsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICBhcmdzW19pIC0gMV0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5fZGlzYWJsZWRbYWN0aW9uXSkge1xuICAgICAgICAgICAgdGhpcy5kaXNwYXRjaCh0cnVlLCBhY3Rpb24sIGFyZ3MpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBTdWJzY3JpYmUgdG8gYW4gYWN0aW9uLlxuICAgICAqIEBwYXJhbSBhY3Rpb25cbiAgICAgKiBAcGFyYW0gaGFuZGxlclxuICAgICAqIEBwYXJhbSBtZW1lbnRvUHJvdmlkZXJcbiAgICAgKi9cbiAgICBEaXNwYXRjaGVyLnByb3RvdHlwZS5zdWJzY3JpYmVBY3Rpb24gPSBmdW5jdGlvbiAoYWN0aW9uLCBoYW5kbGVyLCBtZW1lbnRvUHJvdmlkZXIpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9oYW5kbGVyc1thY3Rpb25dKSB7XG4gICAgICAgICAgICB0aGlzLl9oYW5kbGVyc1thY3Rpb25dID0gW107XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX2hhbmRsZXJzW2FjdGlvbl0uaW5kZXhPZihoYW5kbGVyKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIHRoaXMuX2hhbmRsZXJzW2FjdGlvbl0ucHVzaChbaGFuZGxlciwgbWVtZW50b1Byb3ZpZGVyXSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFVuc3Vic2NyaWJlIGFuIGFjdGlvbiBoYW5kbGVyLiBUaGlzIHJlbW92ZXMgYSBwb3RlbnRpYWwgbWVtZW50b1Byb3ZpZGVyIGFsc28uXG4gICAgICogQHBhcmFtIGFjdGlvblxuICAgICAqIEBwYXJhbSBoYW5kbGVyXG4gICAgICovXG4gICAgRGlzcGF0Y2hlci5wcm90b3R5cGUudW5zdWJzY3JpYmVBY3Rpb24gPSBmdW5jdGlvbiAoYWN0aW9uLCBoYW5kbGVyKSB7XG4gICAgICAgIGlmICh0aGlzLl9oYW5kbGVyc1thY3Rpb25dKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX2hhbmRsZXJzW2FjdGlvbl0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5faGFuZGxlcnNbYWN0aW9uXVtpXVswXSA9PT0gaGFuZGxlcikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9oYW5kbGVyc1thY3Rpb25dLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgRGlzcGF0Y2hlci5wcm90b3R5cGUuZGlzYWJsZUFjdGlvbiA9IGZ1bmN0aW9uIChhY3Rpb24pIHtcbiAgICAgICAgdGhpcy5fZGlzYWJsZWRbYWN0aW9uXSA9IHRydWU7XG4gICAgfTtcbiAgICBEaXNwYXRjaGVyLnByb3RvdHlwZS5lbmFibGVBY3Rpb24gPSBmdW5jdGlvbiAoYWN0aW9uKSB7XG4gICAgICAgIGlmICh0aGlzLl9kaXNhYmxlZFthY3Rpb25dKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fZGlzYWJsZWRbYWN0aW9uXTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIERpc3BhdGNoZXI7XG59KSgpO1xudmFyIGRpc3BhdGNoZXIgPSBuZXcgRGlzcGF0Y2hlcigpO1xuZnVuY3Rpb24gZ2V0RGlzcGF0Y2hlcigpIHtcbiAgICByZXR1cm4gZGlzcGF0Y2hlcjtcbn1cbmV4cG9ydHMuZ2V0RGlzcGF0Y2hlciA9IGdldERpc3BhdGNoZXI7XG5mdW5jdGlvbiBkaXNwYXRjaChhY3Rpb24pIHtcbiAgICB2YXIgYXJncyA9IFtdO1xuICAgIGZvciAodmFyIF9pID0gMTsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgIGFyZ3NbX2kgLSAxXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgfVxuICAgIGRpc3BhdGNoZXIuZGlzcGF0Y2hBY3Rpb24uYXBwbHkoZGlzcGF0Y2hlciwgW2FjdGlvbl0uY29uY2F0KGFyZ3MpKTtcbn1cbmV4cG9ydHMuZGlzcGF0Y2ggPSBkaXNwYXRjaDtcbmZ1bmN0aW9uIHN1YnNjcmliZUFjdGlvbihhY3Rpb24sIGhhbmRsZXIsIG1lbWVudG9Qcm92aWRlcikge1xuICAgIGRpc3BhdGNoZXIuc3Vic2NyaWJlQWN0aW9uKGFjdGlvbiwgaGFuZGxlciwgbWVtZW50b1Byb3ZpZGVyKTtcbn1cbmV4cG9ydHMuc3Vic2NyaWJlQWN0aW9uID0gc3Vic2NyaWJlQWN0aW9uO1xuZnVuY3Rpb24gdW5zdWJzY3JpYmVBY3Rpb24oYWN0aW9uLCBoYW5kbGVyKSB7XG4gICAgZGlzcGF0Y2hlci51bnN1YnNjcmliZUFjdGlvbihhY3Rpb24sIGhhbmRsZXIpO1xufVxuZXhwb3J0cy51bnN1YnNjcmliZUFjdGlvbiA9IHVuc3Vic2NyaWJlQWN0aW9uO1xuZnVuY3Rpb24gZGlzYWJsZUFjdGlvbihhY3Rpb24pIHtcbiAgICBkaXNwYXRjaGVyLmRpc2FibGVBY3Rpb24oYWN0aW9uKTtcbn1cbmV4cG9ydHMuZGlzYWJsZUFjdGlvbiA9IGRpc2FibGVBY3Rpb247XG5mdW5jdGlvbiBlbmFibGVBY3Rpb24oYWN0aW9uKSB7XG4gICAgZGlzcGF0Y2hlci5lbmFibGVBY3Rpb24oYWN0aW9uKTtcbn1cbmV4cG9ydHMuZW5hYmxlQWN0aW9uID0gZW5hYmxlQWN0aW9uO1xuLyoqXG4gKiBSZXNldHMgZXZlcnl0aGluZy4gTm8gcHJldmlvdXNseSBzdWJzY3JpYmVkIGhhbmRsZXIgd2lsbCBiZSBjYWxsZWQuXG4gKi9cbmZ1bmN0aW9uIHJlc2V0KCkge1xuICAgIGRpc3BhdGNoZXIuZGVzdHJveSgpO1xuICAgIGRpc3BhdGNoZXIgPSBuZXcgRGlzcGF0Y2hlcigpO1xufVxuZXhwb3J0cy5yZXNldCA9IHJlc2V0O1xuLyoqXG4gKiBVbmRvIG1hbmFnZXIgaW1wbGVtZW50YXRpb25zLiBJdCB1dGlsaXNlcyB0d28gc3RhY2tzICh1bmRvLCByZWRvKSB0byBwcm92aWRlIHRoZVxuICogbmVjZXNzYXJ5IG1lYW5zIHRvIHVuZG8gYW5kIHJlZG8gYWN0aW9ucy5cbiAqL1xudmFyIFVuZG9NYW5hZ2VyID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoVW5kb01hbmFnZXIsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gVW5kb01hbmFnZXIoKSB7XG4gICAgICAgIF9zdXBlci5jYWxsKHRoaXMsIFwiVW5kb01hbmFnZXJcIik7XG4gICAgICAgIHRoaXMuY2xlYXIoKTtcbiAgICAgICAgZ2V0RGlzcGF0Y2hlcigpLnN1YnNjcmliZUFjdGlvbigtMjAwMCAvKiBVTkRPICovLCB0aGlzLnVuZG8uYmluZCh0aGlzKSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFN0b3JlIGEgbWVtZW50by4gVGhpcyBpcyBwdXQgb24gYSBzdGFjayB0aGF0IGlzIHVzZWQgZm9yIHVuZG9cbiAgICAgKiBAcGFyYW0gbWVtZW50b3NcbiAgICAgKiBAcGFyYW0gYWN0aW9uICAgICAgICB0aGUgYWN0aW9uIHRoYXQgY3JlYXRlZCB0aGUgbWVtZW50b1xuICAgICAqIEBwYXJhbSByZWRvICAgICAgICAgIHRoZSBkYXRhIHRoYXQgY2FuIGJlIHVzZWQgdG8gcmVjcmVhdGUgdGhlIGFjdGlvblxuICAgICAqL1xuICAgIFVuZG9NYW5hZ2VyLnByb3RvdHlwZS5zdG9yZU1lbWVudG9zID0gZnVuY3Rpb24gKG1lbWVudG9zLCBhY3Rpb24sIHJlZG8pIHtcbiAgICAgICAgaWYgKG1lbWVudG9zKSB7XG4gICAgICAgICAgICBtZW1lbnRvcy5mb3JFYWNoKGZ1bmN0aW9uIChtKSB7XG4gICAgICAgICAgICAgICAgaWYgKG0pIHtcbiAgICAgICAgICAgICAgICAgICAgbS5yZWRvID0gcmVkbztcbiAgICAgICAgICAgICAgICAgICAgbS5hY3Rpb24gPSBhY3Rpb247XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLm1lbWVudG9zLnB1c2gobWVtZW50b3MpO1xuICAgICAgICAgICAgdGhpcy5yZWRvcyA9IFtdO1xuICAgICAgICAgICAgdGhpcy5lbWl0KDIgLyogTUVNRU5UT19TVE9SRUQgKi8sIG1lbWVudG9zKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogVW5kby4gUG9wIHRoZSBsYXRlc3QgbWVtZW50byBmcm9tIHRoZSBzdGFjayBhbmQgcmVzdG9yZSB0aGUgYWNjb3JkaW5nIG9iamVjdC4gVGhpcyBwdXNoZXMgdGhlIHJlZG8taW5mb1xuICAgICAqIGZyb20gdGhlIG1lbWVudG8gb250byB0aGUgcmVkbyBzdGFjayB0byB1c2UgaW4gcmVkby5cbiAgICAgKi9cbiAgICBVbmRvTWFuYWdlci5wcm90b3R5cGUudW5kbyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHVzID0gdGhpcy5tZW1lbnRvcy5wb3AoKTtcbiAgICAgICAgaWYgKHVzKSB7XG4gICAgICAgICAgICB2YXIgcmVkb3MgPSBbXTtcbiAgICAgICAgICAgIHVzLmZvckVhY2goZnVuY3Rpb24gKHUsIGkpIHtcbiAgICAgICAgICAgICAgICBpZiAodS51bmRvKSB7XG4gICAgICAgICAgICAgICAgICAgIGdldERpc3BhdGNoZXIoKS5kaXNwYXRjaFVuZG9BY3Rpb24uYXBwbHkoZ2V0RGlzcGF0Y2hlcigpLCBbdS51bmRvLmFjdGlvbl0uY29uY2F0KHUudW5kby5kYXRhKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB1Lmluc3RhbmNlLnJlc3RvcmVGcm9tTWVtZW50byh1KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlZG9zLnB1c2godS5yZWRvKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMucmVkb3MucHVzaChyZWRvcyk7XG4gICAgICAgICAgICB0aGlzLmVtaXQoMCAvKiBVTkRPICovLCB1cyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFJlZG8uIFBvcCB0aGUgbGF0ZXN0IHJlZG8gYWN0aW9uIGZyb20gdGhlIHN0YWNrIGFuZCBkaXNwYXRjaCBpdC4gVGhpcyBkb2VzIG5vdCBzdG9yZSBhbnkgdW5kbyBkYXRhLFxuICAgICAqIGFzIHRoZSBkaXNwYXRjaGVyIHdpbGwgZG8gdGhhdCB3aGVuIGRpc3BhdGNoaW5nIHRoZSBhY3Rpb24uXG4gICAgICovXG4gICAgVW5kb01hbmFnZXIucHJvdG90eXBlLnJlZG8gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBycyA9IHRoaXMucmVkb3MucG9wKCk7XG4gICAgICAgIGlmIChycykge1xuICAgICAgICAgICAgcnMuZm9yRWFjaChmdW5jdGlvbiAocikge1xuICAgICAgICAgICAgICAgIGdldERpc3BhdGNoZXIoKS5kaXNwYXRjaEFjdGlvbi5hcHBseShnZXREaXNwYXRjaGVyKCksIFtyLmFjdGlvbl0uY29uY2F0KHIuZGF0YSkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLmVtaXQoMSAvKiBSRURPICovLCBycyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qKlxuICAgICAqIENsZWFyIGFsbCBzdGFja3NcbiAgICAgKi9cbiAgICBVbmRvTWFuYWdlci5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMubWVtZW50b3MgPSBbXTtcbiAgICAgICAgdGhpcy5yZWRvcyA9IFtdO1xuICAgICAgICB0aGlzLmVtaXQoMyAvKiBDTEVBUiAqLyk7XG4gICAgfTtcbiAgICBVbmRvTWFuYWdlci5wcm90b3R5cGUuZ2V0TWVtZW50b3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1lbWVudG9zO1xuICAgIH07XG4gICAgcmV0dXJuIFVuZG9NYW5hZ2VyO1xufSkoRXZlbnRDaGFubmVsLkNoYW5uZWxlZEVtaXR0ZXIpO1xuLyoqXG4gKiBTaW5nbGV0b24uXG4gKiBAdHlwZSB7VW5kb01hbmFnZXJ9XG4gKi9cbnZhciB1bSA9IG5ldyBVbmRvTWFuYWdlcigpO1xuLyoqXG4gKiBHZXQgdGhlIHVuZG8gbWFuYWdlci4gUmV0dXJucyB0aGUgc2luZ2xlIGluc3RhbmNlLlxuICogQHJldHVybnMge1VuZG9NYW5hZ2VyfVxuICovXG5mdW5jdGlvbiBnZXRVbmRvTWFuYWdlcigpIHtcbiAgICByZXR1cm4gdW07XG59XG5leHBvcnRzLmdldFVuZG9NYW5hZ2VyID0gZ2V0VW5kb01hbmFnZXI7XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRpc3BhdGNoZXIuanMubWFwIiwiLyoqXG4gKiBDcmVhdGVkIGJ5IFN0ZXBoYW4uU21vbGEgb24gMjguMTAuMjAxNC5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG4vKipcbiAqIEFuIGV2ZW50LWVtaXR0ZXJcbiAqL1xudmFyIEVtaXR0ZXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEVtaXR0ZXIoKSB7XG4gICAgfVxuICAgIEVtaXR0ZXIucHJvdG90eXBlLnN1YnNjcmliZSA9IGZ1bmN0aW9uIChldmVudCwgaGFuZGxlcikge1xuICAgICAgICBpZiAoIXRoaXMuX2V2ZW50SGFuZGxlcnMpIHtcbiAgICAgICAgICAgIHRoaXMuX2V2ZW50SGFuZGxlcnMgPSB7fTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuX2V2ZW50SGFuZGxlcnNbZXZlbnRdKSB7XG4gICAgICAgICAgICB0aGlzLl9ldmVudEhhbmRsZXJzW2V2ZW50XSA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2V2ZW50SGFuZGxlcnNbZXZlbnRdLnB1c2goaGFuZGxlcik7XG4gICAgfTtcbiAgICBFbWl0dGVyLnByb3RvdHlwZS51bnN1YnNjcmliZSA9IGZ1bmN0aW9uIChldmVudCwgaGFuZGxlcikge1xuICAgICAgICBpZiAoIXRoaXMuX2V2ZW50SGFuZGxlcnMpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fZXZlbnRIYW5kbGVyc1tldmVudF0pIHtcbiAgICAgICAgICAgIHRoaXMuX2V2ZW50SGFuZGxlcnNbZXZlbnRdLnNwbGljZSh0aGlzLl9ldmVudEhhbmRsZXJzW2V2ZW50XS5pbmRleE9mKGhhbmRsZXIpLCAxKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEVtaXR0ZXIucHJvdG90eXBlLCBcImV2ZW50SGFuZGxlcnNcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9ldmVudEhhbmRsZXJzO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciBhcmdzID0gW107XG4gICAgICAgIGZvciAodmFyIF9pID0gMTsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICBhcmdzW19pIC0gMV0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICB9XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgaWYgKHRoaXMuX2V2ZW50SGFuZGxlcnMgJiYgdGhpcy5fZXZlbnRIYW5kbGVyc1tldmVudF0pIHtcbiAgICAgICAgICAgIHRoaXMuX2V2ZW50SGFuZGxlcnNbZXZlbnRdLmZvckVhY2goZnVuY3Rpb24gKGhhbmRsZXIpIHtcbiAgICAgICAgICAgICAgICBoYW5kbGVyLmFwcGx5KHRoYXQsIGFyZ3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEVtaXR0ZXIucHJvdG90eXBlLnJlbGF5ID0gZnVuY3Rpb24gKGVtaXR0ZXIsIHN1YnNjcmliaW5nRXZlbnQsIGVtaXR0aW5nRXZlbnQpIHtcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICBlbWl0dGVyLnN1YnNjcmliZShzdWJzY3JpYmluZ0V2ZW50LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgYXJncyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgICAgICBhcmdzW19pIC0gMF0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhhdC5lbWl0LmFwcGx5KHRoYXQsIFtlbWl0dGluZ0V2ZW50XS5jb25jYXQoYXJncykpO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIHJldHVybiBFbWl0dGVyO1xufSkoKTtcbmV4cG9ydHMuRW1pdHRlciA9IEVtaXR0ZXI7XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWVtaXR0ZXIuanMubWFwIiwiLyoqXG4gKiBDcmVhdGVkIGJ5IFN0ZXBoYW4uU21vbGEgb24gMzAuMTAuMjAxNC5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19leHRlbmRzID0gdGhpcy5fX2V4dGVuZHMgfHwgZnVuY3Rpb24gKGQsIGIpIHtcbiAgICBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTtcbiAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICBfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZTtcbiAgICBkLnByb3RvdHlwZSA9IG5ldyBfXygpO1xufTtcbnZhciBFdmVudENoYW5uZWwgPSByZXF1aXJlKFwiLi9ldmVudENoYW5uZWxcIik7XG4oZnVuY3Rpb24gKEVWRU5UUykge1xuICAgIEVWRU5UU1tFVkVOVFNbXCJFUlJPUlwiXSA9IDBdID0gXCJFUlJPUlwiO1xuICAgIEVWRU5UU1tFVkVOVFNbXCJGQVRBTFwiXSA9IDFdID0gXCJGQVRBTFwiO1xuICAgIEVWRU5UU1tFVkVOVFNbXCJGUkFNRVdPUktcIl0gPSAyXSA9IFwiRlJBTUVXT1JLXCI7XG4gICAgRVZFTlRTW0VWRU5UU1tcIkNMRUFSXCJdID0gM10gPSBcIkNMRUFSXCI7XG59KShleHBvcnRzLkVWRU5UUyB8fCAoZXhwb3J0cy5FVkVOVFMgPSB7fSkpO1xudmFyIEVWRU5UUyA9IGV4cG9ydHMuRVZFTlRTO1xudmFyIEVycm9ySGFuZGxlciA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKEVycm9ySGFuZGxlciwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBFcnJvckhhbmRsZXIoKSB7XG4gICAgICAgIF9zdXBlci5jYWxsKHRoaXMsIFwiRVJST1JcIik7XG4gICAgICAgIC8qXG4gICAgICAgICBpZiAod2luZG93KSB7XG4gICAgICAgICB3aW5kb3cub25lcnJvciA9IGZ1bmN0aW9uKGVycm9yLCB1cmwsIGxpbmUpIHtcbiAgICAgICAgIHRoaXMuZmF0YWwoZXJyb3IgKyBcIlxcbmluOiBcIiArIHVybCArIFwiXFxubGluZTogXCIgKyBsaW5lLCB3aW5kb3cpO1xuICAgICAgICAgfVxuICAgICAgICAgfVxuICAgICAgICAgKi9cbiAgICB9XG4gICAgRXJyb3JIYW5kbGVyLnByb3RvdHlwZS5lcnJvciA9IGZ1bmN0aW9uIChtZXNzYWdlLCB0aGF0KSB7XG4gICAgICAgIHRoaXMuZW1pdCgwIC8qIEVSUk9SICovLCBtZXNzYWdlLCB0aGF0KTtcbiAgICB9O1xuICAgIEVycm9ySGFuZGxlci5wcm90b3R5cGUuZmF0YWwgPSBmdW5jdGlvbiAobWVzc2FnZSwgdGhhdCkge1xuICAgICAgICB0aGlzLmVtaXQoMSAvKiBGQVRBTCAqLywgbWVzc2FnZSwgdGhhdCk7XG4gICAgfTtcbiAgICBFcnJvckhhbmRsZXIucHJvdG90eXBlLmZyYW1ld29yayA9IGZ1bmN0aW9uIChtZXNzYWdlLCBleGNlcHRpb24sIHRoYXQpIHtcbiAgICAgICAgdGhyb3cgZXhjZXB0aW9uO1xuICAgIH07XG4gICAgcmV0dXJuIEVycm9ySGFuZGxlcjtcbn0pKEV2ZW50Q2hhbm5lbC5DaGFubmVsZWRFbWl0dGVyKTtcbnZhciBlcnJvckhhbmRsZXIgPSBuZXcgRXJyb3JIYW5kbGVyKCk7XG5mdW5jdGlvbiBnZXRFcnJvckhhbmRsZXIoKSB7XG4gICAgcmV0dXJuIGVycm9ySGFuZGxlcjtcbn1cbmV4cG9ydHMuZ2V0RXJyb3JIYW5kbGVyID0gZ2V0RXJyb3JIYW5kbGVyO1xuZnVuY3Rpb24gZXJyb3IobWVzc2FnZSwgdGhhdCkge1xuICAgIHJldHVybiBlcnJvckhhbmRsZXIuZXJyb3IobWVzc2FnZSwgdGhhdCk7XG59XG5leHBvcnRzLmVycm9yID0gZXJyb3I7XG5mdW5jdGlvbiBmYXRhbChtZXNzYWdlLCB0aGF0KSB7XG4gICAgcmV0dXJuIGVycm9ySGFuZGxlci5mYXRhbChtZXNzYWdlLCB0aGF0KTtcbn1cbmV4cG9ydHMuZmF0YWwgPSBmYXRhbDtcbmZ1bmN0aW9uIGZyYW1ld29yayhtZXNzYWdlLCBleGNlb3Rpb24sIHRoYXQpIHtcbiAgICByZXR1cm4gZXJyb3JIYW5kbGVyLmZyYW1ld29yayhtZXNzYWdlLCBleGNlb3Rpb24sIHRoYXQpO1xufVxuZXhwb3J0cy5mcmFtZXdvcmsgPSBmcmFtZXdvcms7XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWVycm9ycy5qcy5tYXAiLCIvKipcbiAqIENyZWF0ZWQgYnkgU3RlcGhhbi5TbW9sYSBvbiAyOC4xMC4yMDE0LlxuICovXG5cInVzZSBzdHJpY3RcIjtcbnZhciBfX2V4dGVuZHMgPSB0aGlzLl9fZXh0ZW5kcyB8fCBmdW5jdGlvbiAoZCwgYikge1xuICAgIGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdO1xuICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgIF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlO1xuICAgIGQucHJvdG90eXBlID0gbmV3IF9fKCk7XG59O1xudmFyIEVtaXR0ZXIgPSByZXF1aXJlKFwiLi9lbWl0dGVyXCIpO1xudmFyIFN0cmVhbSA9IHJlcXVpcmUoXCIuL3N0cmVhbVwiKTtcbnZhciBFdmVudENoYW5uZWwgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEV2ZW50Q2hhbm5lbCgpIHtcbiAgICAgICAgdGhpcy5fZXZlbnRIYW5kbGVycyA9IHt9O1xuICAgIH1cbiAgICBFdmVudENoYW5uZWwucHJvdG90eXBlLnN1YnNjcmliZSA9IGZ1bmN0aW9uIChlbWl0dGVyLCBldmVudCwgaGFuZGxlcikge1xuICAgICAgICBpZiAoIXRoaXMuX2V2ZW50SGFuZGxlcnNbZW1pdHRlcl0pIHtcbiAgICAgICAgICAgIHRoaXMuX2V2ZW50SGFuZGxlcnNbZW1pdHRlcl0gPSB7fTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuX2V2ZW50SGFuZGxlcnNbZW1pdHRlcl1bZXZlbnRdKSB7XG4gICAgICAgICAgICB0aGlzLl9ldmVudEhhbmRsZXJzW2VtaXR0ZXJdW2V2ZW50XSA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2V2ZW50SGFuZGxlcnNbZW1pdHRlcl1bZXZlbnRdLnB1c2goaGFuZGxlcik7XG4gICAgfTtcbiAgICBFdmVudENoYW5uZWwucHJvdG90eXBlLnVuc3Vic2NyaWJlID0gZnVuY3Rpb24gKGVtaXR0ZXIsIGV2ZW50LCBoYW5kbGVyKSB7XG4gICAgICAgIGlmICh0aGlzLl9ldmVudEhhbmRsZXJzW2VtaXR0ZXJdKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fZXZlbnRIYW5kbGVyc1tlbWl0dGVyXVtldmVudF0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9ldmVudEhhbmRsZXJzW2VtaXR0ZXJdW2V2ZW50XS5zcGxpY2UodGhpcy5fZXZlbnRIYW5kbGVyc1tlbWl0dGVyXVtldmVudF0uaW5kZXhPZihoYW5kbGVyKSwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEV2ZW50Q2hhbm5lbC5wcm90b3R5cGUuY2hhbm5lbEVtaXQgPSBmdW5jdGlvbiAoZW1pdHRlciwgZW1pdHRlcklELCBldmVudCwgYXJncykge1xuICAgICAgICBpZiAodGhpcy5fZXZlbnRIYW5kbGVycyAmJiB0aGlzLl9ldmVudEhhbmRsZXJzW2VtaXR0ZXJJRF0gJiYgdGhpcy5fZXZlbnRIYW5kbGVyc1tlbWl0dGVySURdW2V2ZW50XSkge1xuICAgICAgICAgICAgdGhpcy5fZXZlbnRIYW5kbGVyc1tlbWl0dGVySURdW2V2ZW50XS5mb3JFYWNoKGZ1bmN0aW9uIChoYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgaGFuZGxlci5hcHBseShlbWl0dGVyLCBhcmdzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBFdmVudENoYW5uZWwucHJvdG90eXBlLnVuc3Vic2NyaWJlQWxsID0gZnVuY3Rpb24gKGVtaXR0ZXJJRCkge1xuICAgICAgICBkZWxldGUgdGhpcy5fZXZlbnRIYW5kbGVyc1tlbWl0dGVySURdO1xuICAgIH07XG4gICAgcmV0dXJuIEV2ZW50Q2hhbm5lbDtcbn0pKCk7XG52YXIgZXZlbnRDaGFubmVsID0gbmV3IEV2ZW50Q2hhbm5lbCgpO1xuLy9leHBvcnQgdmFyIGNoYW5uZWw6SUV2ZW50Q2hhbm5lbCA9IGV2ZW50Q2hhbm5lbDtcbmZ1bmN0aW9uIGdldENoYW5uZWwoKSB7XG4gICAgcmV0dXJuIGV2ZW50Q2hhbm5lbDtcbn1cbmV4cG9ydHMuZ2V0Q2hhbm5lbCA9IGdldENoYW5uZWw7XG5mdW5jdGlvbiBzdWJzY3JpYmUoZW1pdHRlciwgZXZlbnQsIGhhbmRsZXIpIHtcbiAgICBldmVudENoYW5uZWwuc3Vic2NyaWJlKGVtaXR0ZXIsIGV2ZW50LCBoYW5kbGVyKTtcbn1cbmV4cG9ydHMuc3Vic2NyaWJlID0gc3Vic2NyaWJlO1xuZnVuY3Rpb24gdW5zdWJzY3JpYmUoZW1pdHRlciwgZXZlbnQsIGhhbmRsZXIpIHtcbiAgICBldmVudENoYW5uZWwudW5zdWJzY3JpYmUoZW1pdHRlciwgZXZlbnQsIGhhbmRsZXIpO1xufVxuZXhwb3J0cy51bnN1YnNjcmliZSA9IHVuc3Vic2NyaWJlO1xuZnVuY3Rpb24gY2hhbm5lbEVtaXQoZW1pdHRlcklELCBldmVudCkge1xuICAgIHZhciBhcmdzID0gW107XG4gICAgZm9yICh2YXIgX2kgPSAyOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgYXJnc1tfaSAtIDJdID0gYXJndW1lbnRzW19pXTtcbiAgICB9XG4gICAgZXZlbnRDaGFubmVsLmNoYW5uZWxFbWl0KG51bGwsIGVtaXR0ZXJJRCwgZXZlbnQsIGFyZ3MpO1xufVxuZXhwb3J0cy5jaGFubmVsRW1pdCA9IGNoYW5uZWxFbWl0O1xuZnVuY3Rpb24gdW5zdWJzY3JpYmVBbGwoZW1pdHRlcklEKSB7XG4gICAgZXZlbnRDaGFubmVsLnVuc3Vic2NyaWJlQWxsKGVtaXR0ZXJJRCk7XG59XG5leHBvcnRzLnVuc3Vic2NyaWJlQWxsID0gdW5zdWJzY3JpYmVBbGw7XG52YXIgZW1pdHRlcklEcyA9IFtdO1xudmFyIENoYW5uZWxlZEVtaXR0ZXIgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhDaGFubmVsZWRFbWl0dGVyLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIENoYW5uZWxlZEVtaXR0ZXIoX2VtaXR0ZXJJRCkge1xuICAgICAgICBfc3VwZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgaWYgKF9lbWl0dGVySUQpIHtcbiAgICAgICAgICAgIHRoaXMuZW1pdHRlcklEID0gX2VtaXR0ZXJJRDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZW1pdHRlcklEID0gXCJFbWl0dGVyXCIgKyBlbWl0dGVySURzLmxlbmd0aDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZW1pdHRlcklEcy5pbmRleE9mKHRoaXMuZW1pdHRlcklEKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkR1cGxpY2F0ZSBlbWl0dGVySUQuIFRoaXMgaXMgbm90IHN1cHBvcnRlZFwiKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBDaGFubmVsZWRFbWl0dGVyLnByb3RvdHlwZS5zdWJzY3JpYmUgPSBmdW5jdGlvbiAoZXZlbnQsIGhhbmRsZXIpIHtcbiAgICAgICAgX3N1cGVyLnByb3RvdHlwZS5zdWJzY3JpYmUuY2FsbCh0aGlzLCBldmVudCwgaGFuZGxlcik7XG4gICAgICAgIC8vY29uc29sZS5sb2coXCJDb25zaWRlciB1c2luZyB0aGUgRXZlbnRDaGFubmVsIGluc3RlYWQgb2Ygc3Vic2NyaWJpbmcgZGlyZWN0bHkgdG8gdGhlIFwiICsgdGhpcy5lbWl0dGVySUQpO1xuICAgIH07XG4gICAgQ2hhbm5lbGVkRW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgYXJncyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDE7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgYXJnc1tfaSAtIDFdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgfVxuICAgICAgICAvLyBObyBzdXBlciBjYWxsIGJlY2F1c2UgcGFzc2luZyByZXN0IHBhcmFtZXRlcnMgdG8gYSBzdXBlciBtZXRob2QgaXMga2luZCBvZiBhd2t3YXJkIGFuZCBoYWNreVxuICAgICAgICAvLyBodHRwczovL3R5cGVzY3JpcHQuY29kZXBsZXguY29tL2Rpc2N1c3Npb25zLzU0NDc5N1xuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgIGlmICh0aGlzLmV2ZW50SGFuZGxlcnMgJiYgdGhpcy5ldmVudEhhbmRsZXJzW2V2ZW50XSkge1xuICAgICAgICAgICAgdGhpcy5ldmVudEhhbmRsZXJzW2V2ZW50XS5mb3JFYWNoKGZ1bmN0aW9uIChoYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgaGFuZGxlci5hcHBseSh0aGF0LCBhcmdzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGV2ZW50Q2hhbm5lbC5jaGFubmVsRW1pdCh0aGlzLCB0aGlzLmVtaXR0ZXJJRCwgZXZlbnQsIGFyZ3MpO1xuICAgIH07XG4gICAgcmV0dXJuIENoYW5uZWxlZEVtaXR0ZXI7XG59KShFbWl0dGVyLkVtaXR0ZXIpO1xuZXhwb3J0cy5DaGFubmVsZWRFbWl0dGVyID0gQ2hhbm5lbGVkRW1pdHRlcjtcbnZhciBFdmVudFN0cmVhbSA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKEV2ZW50U3RyZWFtLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIEV2ZW50U3RyZWFtKG5hbWUsIF9lbWl0dGVySUQsIF9ldmVudCkge1xuICAgICAgICBfc3VwZXIuY2FsbCh0aGlzLCBuYW1lKTtcbiAgICAgICAgdGhpcy5fZW1pdHRlcklEID0gX2VtaXR0ZXJJRDtcbiAgICAgICAgdGhpcy5fZXZlbnQgPSBfZXZlbnQ7XG4gICAgICAgIHRoaXMuX2hhbmRsZXIgPSB0aGlzLmhhbmRsZUV2ZW50LmJpbmQodGhpcyk7XG4gICAgICAgIHN1YnNjcmliZSh0aGlzLl9lbWl0dGVySUQsIF9ldmVudCwgdGhpcy5faGFuZGxlcik7XG4gICAgfVxuICAgIEV2ZW50U3RyZWFtLnByb3RvdHlwZS5oYW5kbGVFdmVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIGFyZ3NbX2kgLSAwXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5wdXNoKHtcbiAgICAgICAgICAgIGVtaXR0ZXI6IHRoaXMuX2VtaXR0ZXJJRCxcbiAgICAgICAgICAgIGV2ZW50OiB0aGlzLl9ldmVudCxcbiAgICAgICAgICAgIGFyZ3M6IGFyZ3NcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBFdmVudFN0cmVhbS5wcm90b3R5cGUuZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgX3N1cGVyLnByb3RvdHlwZS5kaXNwb3NlLmNhbGwodGhpcyk7XG4gICAgICAgIHVuc3Vic2NyaWJlKHRoaXMuX2VtaXR0ZXJJRCwgdGhpcy5fZXZlbnQsIHRoaXMuX2hhbmRsZXIpO1xuICAgIH07XG4gICAgcmV0dXJuIEV2ZW50U3RyZWFtO1xufSkoU3RyZWFtLlN0cmVhbSk7XG4vKipcbiAqIENyZWF0ZXMgYSBzdHJlYW0gZm9yIGEgY2hhbm5lbGVkIGV2ZW50LiBJZiAgbW9yIHRoYW4gb25lIGV2ZW50IGlzIGdpdmVuLCBhIGNvbWJpbmVkXG4gKiBzdHJlYW0gZm9yIGFsbCBldmVudHMgaXMgY3JlYXRlZFxuICpcbiAqIEBwYXJhbSBuYW1lXG4gKiBAcGFyYW0gZW1pdHRlcklEXG4gKiBAcGFyYW0gZXZlbnRzXG4gKiBAcmV0dXJucyB7bnVsbH1cbiAqL1xuZnVuY3Rpb24gY3JlYXRlRXZlbnRTdHJlYW0oZW1pdHRlcklEKSB7XG4gICAgdmFyIGV2ZW50cyA9IFtdO1xuICAgIGZvciAodmFyIF9pID0gMTsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgIGV2ZW50c1tfaSAtIDFdID0gYXJndW1lbnRzW19pXTtcbiAgICB9XG4gICAgdmFyIHN0cmVhbSA9IG51bGw7XG4gICAgZXZlbnRzLmZvckVhY2goZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciBlU3RyZWFtID0gbmV3IEV2ZW50U3RyZWFtKGVtaXR0ZXJJRCArIFwiLVwiICsgZXZlbnQsIGVtaXR0ZXJJRCwgZXZlbnQpO1xuICAgICAgICBpZiAoc3RyZWFtKSB7XG4gICAgICAgICAgICBzdHJlYW0gPSBzdHJlYW0uY29tYmluZShlU3RyZWFtKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHN0cmVhbSA9IGVTdHJlYW07XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gc3RyZWFtO1xufVxuZXhwb3J0cy5jcmVhdGVFdmVudFN0cmVhbSA9IGNyZWF0ZUV2ZW50U3RyZWFtO1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1ldmVudENoYW5uZWwuanMubWFwIiwiLyoqXG4gKiBDcmVhdGVkIGJ5IHN0ZXBoYW4gb24gMDEuMTEuMTQuXG4gKi9cblwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9IHRoaXMuX19leHRlbmRzIHx8IGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07XG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XG4gICAgX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGU7XG4gICAgZC5wcm90b3R5cGUgPSBuZXcgX18oKTtcbn07XG52YXIgRGlzcGF0Y2hlciA9IHJlcXVpcmUoXCIuL2Rpc3BhdGNoZXJcIik7XG52YXIgRXZlbnRDaGFubmVsID0gcmVxdWlyZShcIi4vZXZlbnRDaGFubmVsXCIpO1xudmFyIEJhc2VBY3Rpb25zID0gcmVxdWlyZShcIi4vYmFzZUFjdGlvbnNcIik7XG52YXIgVG9vbHMgPSByZXF1aXJlKFwiLi90b29sc1wiKTtcbi8qKlxuICogQmFzZSBpbXBsZW1lbnRhdGlvbiBmb3IgYSBwbHVnaW4uIERvZXMgYWJzb2x1dGVseSBub3RoaW5nLlxuICovXG52YXIgQmFzZVBsdWdpbiA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQmFzZVBsdWdpbigpIHtcbiAgICB9XG4gICAgQmFzZVBsdWdpbi5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKGNvbnRhaW5lciwgYWN0aW9uKSB7XG4gICAgICAgIHZhciBhcmdzID0gW107XG4gICAgICAgIGZvciAodmFyIF9pID0gMjsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICBhcmdzW19pIC0gMl0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBCYXNlUGx1Z2luLnByb3RvdHlwZS5hZnRlckZpbmlzaCA9IGZ1bmN0aW9uIChjb250YWluZXIsIGFjdGlvbikge1xuICAgICAgICB2YXIgYXJncyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDI7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgYXJnc1tfaSAtIDJdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgQmFzZVBsdWdpbi5wcm90b3R5cGUuYWZ0ZXJBYm9ydCA9IGZ1bmN0aW9uIChjb250YWluZXIsIGFjdGlvbikge1xuICAgICAgICB2YXIgYXJncyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDI7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgYXJnc1tfaSAtIDJdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgQmFzZVBsdWdpbi5wcm90b3R5cGUuZ2V0TWVtZW50byA9IGZ1bmN0aW9uIChjb250YWluZXIsIGFjdGlvbikge1xuICAgICAgICB2YXIgYXJncyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDI7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgYXJnc1tfaSAtIDJdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9O1xuICAgIEJhc2VQbHVnaW4ucHJvdG90eXBlLnJlc3RvcmVGcm9tTWVtZW50byA9IGZ1bmN0aW9uIChjb250YWluZXIsIG1lbWVudG8pIHtcbiAgICB9O1xuICAgIEJhc2VQbHVnaW4ucHJvdG90eXBlLmhvbGQgPSBmdW5jdGlvbiAoKSB7XG4gICAgfTtcbiAgICBCYXNlUGx1Z2luLnByb3RvdHlwZS5yZWxlYXNlID0gZnVuY3Rpb24gKGFjdGlvbikge1xuICAgIH07XG4gICAgQmFzZVBsdWdpbi5wcm90b3R5cGUuYWJvcnQgPSBmdW5jdGlvbiAoYWN0aW9uKSB7XG4gICAgfTtcbiAgICByZXR1cm4gQmFzZVBsdWdpbjtcbn0pKCk7XG5leHBvcnRzLkJhc2VQbHVnaW4gPSBCYXNlUGx1Z2luO1xuLyoqXG4gKiBDcmVhdGUgYSBQbHVnaW4uIFVzZSB0aGlzIHdoZW4geW91J3JlIHVzaW5nIHBsYWluIEphdmFTY3JpcHQuXG4gKiBAcGFyYW0gc3BlY1xuICogQHJldHVybnMge2FueX1cbiAqL1xuZnVuY3Rpb24gY3JlYXRlUGx1Z2luKHNwZWMpIHtcbiAgICByZXR1cm4gVG9vbHMuc3ViY2xhc3Moc3BlYywgQmFzZVBsdWdpbik7XG59XG5leHBvcnRzLmNyZWF0ZVBsdWdpbiA9IGNyZWF0ZVBsdWdpbjtcbi8qKlxuICogQmFzZSBpbXBsZW1lbnRhdGlvbiBmb3IgYSBwbHVnaW4gY29udGFpbmVyLlxuICovXG52YXIgUGx1Z2luQ29udGFpbmVyID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoUGx1Z2luQ29udGFpbmVyLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIFBsdWdpbkNvbnRhaW5lcihlbWl0dGVySWQpIHtcbiAgICAgICAgX3N1cGVyLmNhbGwodGhpcywgZW1pdHRlcklkIHx8IFwiQ29udGFpbmVyXCIgKyBUb29scy5vaWQodGhpcykpO1xuICAgICAgICB0aGlzLl9wbHVnaW5zID0ge307XG4gICAgICAgIHRoaXMuX2FueVBsdWdpbnMgPSBbXTtcbiAgICAgICAgdGhpcy5fcHJvdG9jb2xzID0ge307XG4gICAgICAgIHRoaXMuX3J1bm5pbmdQbHVnaW5zID0ge307XG4gICAgICAgIHRoaXMuX21lbWVudG9zID0ge307XG4gICAgfVxuICAgIC8qKlxuICAgICAqIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTYwNjc5Ny91c2Utb2YtYXBwbHktd2l0aC1uZXctb3BlcmF0b3ItaXMtdGhpcy1wb3NzaWJsZVxuICAgICAqIEBwYXJhbSBjb25maWdcbiAgICAgKi9cbiAgICBQbHVnaW5Db250YWluZXIucHJvdG90eXBlLmNvbmZpZ3VyZSA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICAgICAgZnVuY3Rpb24gY29uc3RydWN0KGNvbnN0cnVjdG9yLCBhcmdzKSB7XG4gICAgICAgICAgICBmdW5jdGlvbiBGKCkge1xuICAgICAgICAgICAgICAgIGNvbnN0cnVjdG9yLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgRi5wcm90b3R5cGUgPSBjb25zdHJ1Y3Rvci5wcm90b3R5cGU7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEYoKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgIGNvbmZpZy5mb3JFYWNoKGZ1bmN0aW9uIChhY3Rpb24pIHtcbiAgICAgICAgICAgIGFjdGlvbi5wbHVnaW5zLmZvckVhY2goZnVuY3Rpb24gKHBsdWdpbikge1xuICAgICAgICAgICAgICAgIGlmIChwbHVnaW4ucGx1Z2luKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQud3JhcChhY3Rpb24uYWN0aW9uLCBjb25zdHJ1Y3QocGx1Z2luLnBsdWdpbiwgcGx1Z2luLnBhcmFtZXRlcnMpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQud3JhcChhY3Rpb24uYWN0aW9uLCBuZXcgcGx1Z2luKCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIFBsdWdpbkNvbnRhaW5lci5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZm9yICh2YXIgYWN0aW9uIGluIHRoaXMuX3BsdWdpbnMpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9wbHVnaW5zLmhhc093blByb3BlcnR5KGFjdGlvbikpIHtcbiAgICAgICAgICAgICAgICB2YXIgbCA9IHRoaXMuX3BsdWdpbnNbYWN0aW9uXS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgd2hpbGUgKGwtLSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRldGFjaChhY3Rpb24sIHRoaXMuX3BsdWdpbnNbYWN0aW9uXVtsXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2FueVBsdWdpbnMgPSBbXTtcbiAgICAgICAgdGhpcy5fcnVubmluZ1BsdWdpbnMgPSB7fTtcbiAgICAgICAgLy9UT0RPOiBGaW5kIGEgd2F5IHRvIHVuc3Vic2NyaWJlIGZyb20gdGhlIERpc3BhdGNoZXJcbiAgICB9O1xuICAgIFBsdWdpbkNvbnRhaW5lci5wcm90b3R5cGUucGx1Z2luRG9uZSA9IGZ1bmN0aW9uIChhY3Rpb24sIGFib3J0KSB7XG4gICAgfTtcbiAgICBQbHVnaW5Db250YWluZXIucHJvdG90eXBlLmFib3J0QWN0aW9uID0gZnVuY3Rpb24gKGFjdGlvbikge1xuICAgICAgICBpZiAodGhpcy5fcnVubmluZ1BsdWdpbnNbYWN0aW9uXSAmJiB0aGlzLl9ydW5uaW5nUGx1Z2luc1thY3Rpb25dLmxlbmd0aCkge1xuICAgICAgICAgICAgdmFyIHBsZyA9IHRoaXMuX3J1bm5pbmdQbHVnaW5zW2FjdGlvbl1bdGhpcy5fcnVubmluZ1BsdWdpbnNbYWN0aW9uXS5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgIGlmIChwbGcpIHtcbiAgICAgICAgICAgICAgICBwbGcuYWJvcnQoYWN0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9ydW5uaW5nUGx1Z2luc1thY3Rpb25dID0gbnVsbDtcbiAgICB9O1xuICAgIFBsdWdpbkNvbnRhaW5lci5wcm90b3R5cGUuYWJvcnQgPSBmdW5jdGlvbiAoYWN0aW9uKSB7XG4gICAgICAgIGlmICh0eXBlb2YgYWN0aW9uID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBhY3Rpb25LZXkgaW4gdGhpcy5fcHJvdG9jb2xzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3Byb3RvY29scy5oYXNPd25Qcm9wZXJ0eShhY3Rpb25LZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWJvcnRBY3Rpb24oYWN0aW9uS2V5KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fcHJvdG9jb2xzW2FjdGlvbl0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFib3J0QWN0aW9uKGFjdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFRoaXMgaGFuZGxlcyBhbiBhY3Rpb24gc2VudCBieSB0aGUgZGlzcGF0Y2hlciBhbmQgZGVsZWdhdGVzIGl0IHRvIHRoZSBwbHVnaW5zLlxuICAgICAqIFBsdWdpbnMgYXJlIFwid3JhcHBlZFwiIGFyb3VuZCBlYWNoIG90aGVyLiBUaGV5IGJ1aWxkIGtpbmQgb2YgYnJhY2tldHMgZGVmaW5lZCBieSB0d28gb2ZcbiAgICAgKiB0aGVpciBtZXRob2RzOiBydW4gLSBvcGVucyB0aGUgYnJhY2tldHNcbiAgICAgKiAgICAgICAgICAgICAgICBmaW5pc2gvYWJvcnQgLSBjbG9zZXMgdGhlIGJyYWNrZXRzLlxuICAgICAqXG4gICAgICogV2UnbGwgdGFsayBhYm91dCBmaW5pc2ggZnJvbSBub3cgb24uIFRoYXQgY2FuIGJlIHJlcGxhY2VkIGJ5IGFib3J0IGV2ZXJ5d2hlcmUuIFRoZSBmaXJzdCBwbHVnaW4gdG8gYWJvcnRcbiAgICAgKiBmb3JjZXMgYWxsIHN1Y2NlZWRpbmcgcGx1Z2lucyB0byBhYm9ydCBhcyB3ZWxsLlxuICAgICAqXG4gICAgICogU28gd3JhcHBpbmcgaW4gdGhlIG9yZGVyIEEtPkItPkMgbGVhZHMgdG8gdGhlc2UgYnJhY2tldHM6XG4gICAgICpcbiAgICAgKiAgcnVuQy1ydW5CLXJ1bkEtZmluaXNoQS1maW5pc2hCLWZpbmlzaENcbiAgICAgKlxuICAgICAqIGZpbmlzaCBpcyBvbmx5IGNhbGxlZCB3aGVuIHRoZSBwbHVnaW4gY2FsbHMgdGhlIGRvbmUtY2FsbGJhY2sgdGhhdCBpcyBwcm92aWRlZCB0byBpdHMgcnVuLW1ldGhvZC5cbiAgICAgKlxuICAgICAqIFNvIHRvIGNvcnJlY3RseSBleGVjdXRlIHRoaXMgXCJjaGFpblwiIHdlIG5lZWQgdG8gd2FpdCBmb3IgdGhlIHBsdWdpbnMgdG8gY2FsbCB0aGVpciBkb25lLWNhbGxiYWNrcyBiZWZvcmVcbiAgICAgKiB3ZSBjYW4gcHJvY2VlZC4gQmVjYXVzZSB0aGUgcGx1Z2lucyBtYXkgY2FsbCB0aGVpciBkb25lLWNhbGxiYWNrIG91dHNpZGUgdGhlaXIgcnVuLW1ldGhvZCwgZS5nLiB0cmlnZ2VyZWQgYnlcbiAgICAgKiB1c2VyIGludGVyYWN0aW9uLCB3ZSBuZWVkIHRvIGtlZXAgdHJhY2sgb2Ygd2hhdCB0aGUgcGx1Z2lucyBkaWQgdXNpbmcgYSBwcm90b2NvbC5cbiAgICAgKlxuICAgICAqIFRoYXQgcHJvdG9jb2wgbG9va3MgbGlrZSB0aGlzOlxuICAgICAqXG4gICAgICogIHtcbiAgICAgKiAgICBpOiB7IGRvbmU6IEEgZnVuY3Rpb24gdGhhdCBjYWxscyBlaXRoZXIgZmluaXNoIG9yIGFib3J0IG9uIHRoZSBpLXRoIHBsdWdpbixcbiAgICAgKiAgICAgICAgIGFib3J0OiBkaWQgdGhlIHBsdWdpbiBhYm9ydD9cbiAgICAgKlxuICAgICAqICAgIGkrMTogLi4uXG4gICAgICogIH1cbiAgICAgKlxuICAgICAqIHRoaXMgcHJvdG9jb2wgaXMgaW5pdGlhbGl6ZWQgYnkgbnVsbCBlbnRyaWVzIGZvciBhbGwgcGx1Z2lucy4gVGhlbiB0aGUgcnVuLW1ldGhvZHMgZm9yIGFsbCBwbHVnaW5zIGFyZSBjYWxsZWQsIGdpdmluZyB0aGVtIGEgZG9uZVxuICAgICAqIGNhbGxiYWNrLCB0aGF0IGZpbGxzIHRoZSBwcm90b2NvbC5cbiAgICAgKlxuICAgICAqIEFmdGVyIGV2ZXJ5IHJ1bi1tZXRob2Qgd2UgY2hlY2sgaWYgd2UncmUgYXQgdGhlIGlubmVybW9zdCBwbHVnaW4gKEEgaW4gdGhlIGV4YW1wbGUgYWJvdmUsIHRoZSBvbmUgdGhhdCBmaXJzdCB3cmFwcGVkIHRoZSBhY3Rpb24pLlxuICAgICAqIElmIHdlIGFyZSwgd2Ugd29yayB0aHJvdWdoIHRoZSBwcm90b2NvbCBhcyBsb25nIGFzIHRoZXJlIGFyZSB2YWxpZCBlbnRyaWVzLiBUaGVuIHdlIHdhaXQgZm9yIHRoZSBuZXh0IGRvbmUtY2FsbGJhY2sgdG8gYmUgY2FsbGVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIGFjdGlvblxuICAgICAqIEBwYXJhbSBhcmdzXG4gICAgICovXG4gICAgUGx1Z2luQ29udGFpbmVyLnByb3RvdHlwZS5kb0hhbmRsZUFjdGlvbiA9IGZ1bmN0aW9uIChwbHVnaW5zLCBhY3Rpb24sIGFyZ3MpIHtcbiAgICAgICAgaWYgKHRoaXMuX3J1bm5pbmdQbHVnaW5zW2FjdGlvbl0gJiYgdGhpcy5fcnVubmluZ1BsdWdpbnNbYWN0aW9uXS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkVSUk9SIGNhbGxpbmcgYWN0aW9uIFwiICsgYWN0aW9uICsgXCIuIFNhbWUgYWN0aW9uIGNhbm5vdCBiZSBjYWxsZWQgaW5zaWRlIGl0c2VsZiFcIik7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICB2YXIgY29tcG9zZUFyZ3MgPSBmdW5jdGlvbiAocGx1Z2luLCBhY3Rpb24pIHtcbiAgICAgICAgICAgIHJldHVybiBbdGhhdCwgYWN0aW9uXS5jb25jYXQoYXJncyk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuX21lbWVudG9zW2FjdGlvbl0gPSBbXTtcbiAgICAgICAgdGhpcy5fcnVubmluZ1BsdWdpbnNbYWN0aW9uXSA9IFtdO1xuICAgICAgICB0aGlzLl9wcm90b2NvbHNbYWN0aW9uXSA9IFtdO1xuICAgICAgICBwbHVnaW5zLmZvckVhY2goZnVuY3Rpb24gKHBsdWdpbikge1xuICAgICAgICAgICAgdGhhdC5fcHJvdG9jb2xzW2FjdGlvbl0ucHVzaCgwKTtcbiAgICAgICAgICAgIHRoYXQuX3J1bm5pbmdQbHVnaW5zW2FjdGlvbl0ucHVzaChwbHVnaW4pO1xuICAgICAgICB9KTtcbiAgICAgICAgdmFyIGFib3J0ZWQgPSBmYWxzZTtcbiAgICAgICAgcGx1Z2lucy5mb3JFYWNoKGZ1bmN0aW9uIChwbHVnaW4sIGkpIHtcbiAgICAgICAgICAgIChmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgICAgICAgICAgICB2YXIgZG9uZSA9IGZ1bmN0aW9uIChhYm9ydCwgZG9uZUFjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBpbmRleCA9IHRoYXQuZ2V0UGx1Z2luc0ZvckFjdGlvbihkb25lQWN0aW9uKS5pbmRleE9mKHBsdWdpbik7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQuX3Byb3RvY29sc1tkb25lQWN0aW9uXVtpbmRleF0gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwbHVnaW46IHBsdWdpbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvbmU6IGZ1bmN0aW9uIChhYm9ydCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhYm9ydCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwbHVnaW4uYWZ0ZXJBYm9ydC5hcHBseShwbHVnaW4sIGNvbXBvc2VBcmdzKHBsdWdpbiwgZG9uZUFjdGlvbikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGx1Z2luLmFmdGVyRmluaXNoLmFwcGx5KHBsdWdpbiwgY29tcG9zZUFyZ3MocGx1Z2luLCBkb25lQWN0aW9uKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFib3J0OiBhYm9ydFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB2YXIgbGFzdCA9IHRoYXQuX3Byb3RvY29sc1tkb25lQWN0aW9uXS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChsYXN0LS0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGF0Ll9wcm90b2NvbHNbZG9uZUFjdGlvbl1bbGFzdF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhYm9ydCB8PSB0aGF0Ll9wcm90b2NvbHNbZG9uZUFjdGlvbl1bbGFzdF0uYWJvcnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5fcHJvdG9jb2xzW2RvbmVBY3Rpb25dW2xhc3RdLmRvbmUoYWJvcnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuX3Byb3RvY29sc1tkb25lQWN0aW9uXS5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhhdC5fcnVubmluZ1BsdWdpbnNbZG9uZUFjdGlvbl0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5fcnVubmluZ1BsdWdpbnNbZG9uZUFjdGlvbl0ucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGF0Ll9ydW5uaW5nUGx1Z2luc1tkb25lQWN0aW9uXSB8fCAhdGhhdC5fcnVubmluZ1BsdWdpbnNbZG9uZUFjdGlvbl0ubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0LmZpbmFsaXplQWN0aW9uKGRvbmVBY3Rpb24sIGFib3J0LCB0aGF0LmdldFBsdWdpbnNGb3JBY3Rpb24oZG9uZUFjdGlvbiksIHRoYXQuX21lbWVudG9zW2RvbmVBY3Rpb25dLCBhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdmFyIGhvbGRzID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdmFyIGRvbmVzID0ge307XG4gICAgICAgICAgICAgICAgcGx1Z2luW1wiaG9sZFwiXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgaG9sZHMgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcGx1Z2luW1wiYWJvcnRcIl0gPSBmdW5jdGlvbiAoYWJvcnRBY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFjdCA9IHR5cGVvZiBhYm9ydEFjdGlvbiA9PT0gXCJ1bmRlZmluZWRcIiA/IGFjdGlvbiA6IGFib3J0QWN0aW9uO1xuICAgICAgICAgICAgICAgICAgICBkb25lc1thY3RdID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgZG9uZSh0cnVlLCBhY3QpO1xuICAgICAgICAgICAgICAgICAgICBhYm9ydGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHBsdWdpbltcInJlbGVhc2VcIl0gPSBmdW5jdGlvbiAocmVsZWFzZUFjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYWN0ID0gdHlwZW9mIHJlbGVhc2VBY3Rpb24gPT09IFwidW5kZWZpbmVkXCIgPyBhY3Rpb24gOiByZWxlYXNlQWN0aW9uO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZG9uZXNbYWN0XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUGx1Z2luIHJlbGVhc2VkIHR3aWNlIGZvciBhY3Rpb24gXCIgKyBhY3QgKyBcIiEgUG9zc2libHkgY2FsbGVkIHJlbGVhc2UgYWZ0ZXIgYWJvcnQgb3IgdmljZSB2ZXJzYS5cIik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb25lKGZhbHNlLCBhY3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9uZXNbYWN0XSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGlmICghYWJvcnRlZCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbWVtZW50byA9IHBsdWdpbi5nZXRNZW1lbnRvLmFwcGx5KHBsdWdpbiwgY29tcG9zZUFyZ3MocGx1Z2luLCBhY3Rpb24pKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1lbWVudG8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lbWVudG8uaW5zdGFuY2UgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdG9yZUZyb21NZW1lbnRvOiBmdW5jdGlvbiAobWVtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBsdWdpbi5yZXN0b3JlRnJvbU1lbWVudG8odGhhdCwgbWVtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5fbWVtZW50b3NbYWN0aW9uXS5wdXNoKG1lbWVudG8pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHdlIGFib3J0ZWQ6IENsZWFuIHVwOiBBbGwgUGx1Z2lucyB0aGF0IHdoZXJlIHN0YXJ0ZWQgdW50aWwgbm93IChvdXRlcikgd2lsbCBiZSBhYm9ydGVkLlxuICAgICAgICAgICAgICAgICAgICAvLyBPdGhlcnMgdGhhdCB3b3VsZCBoYXZlIGJlZW4gc3RhcnRlZCBhZnRlcndhcmRzIChpbm5lcikgd29uJ3QgYmUgY2FsbGVkIGF0IGFsbC4gKHNlZSBpZi1zdGF0ZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgLy8gYWJvdmUgdGhpcyBjb21tZW50KVxuICAgICAgICAgICAgICAgICAgICBwbHVnaW4ucnVuLmFwcGx5KHBsdWdpbiwgY29tcG9zZUFyZ3MocGx1Z2luLCBhY3Rpb24pKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFib3J0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsYXN0ID0gKHRoYXQuX3Byb3RvY29sc1thY3Rpb25dICYmIHRoYXQuX3Byb3RvY29sc1thY3Rpb25dLmxlbmd0aCkgfHwgMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChsYXN0LS0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhhdC5fcHJvdG9jb2xzW2FjdGlvbl1bbGFzdF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5fcHJvdG9jb2xzW2FjdGlvbl1bbGFzdF0uZG9uZSh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5fcHJvdG9jb2xzW2FjdGlvbl0ucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuZmluYWxpemVBY3Rpb24oYWN0aW9uLCB0cnVlLCB0aGF0LmdldFBsdWdpbnNGb3JBY3Rpb24oYWN0aW9uKSwgbnVsbCwgYXJncyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWhvbGRzICYmICFkb25lc1thY3Rpb25dKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvbmUoZmFsc2UsIGFjdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KShpKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBQbHVnaW5Db250YWluZXIucHJvdG90eXBlLmdldFBsdWdpbnNGb3JBY3Rpb24gPSBmdW5jdGlvbiAoYWN0aW9uKSB7XG4gICAgICAgIGlmICh0aGlzLl9wbHVnaW5zW2FjdGlvbl0gJiYgdGhpcy5fcGx1Z2luc1thY3Rpb25dLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3BsdWdpbnNbYWN0aW9uXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0aGlzLl9hbnlQbHVnaW5zICYmIHRoaXMuX2FueVBsdWdpbnMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fYW55UGx1Z2lucztcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgfTtcbiAgICBQbHVnaW5Db250YWluZXIucHJvdG90eXBlLmhhbmRsZUFjdGlvbiA9IGZ1bmN0aW9uIChhY3Rpb24sIGFyZ3MpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRoaXMuZG9IYW5kbGVBY3Rpb24odGhpcy5nZXRQbHVnaW5zRm9yQWN0aW9uKGFjdGlvbiksIGFjdGlvbiwgYXJncyk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHRoaXMuYWJvcnQoKTtcbiAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFBsdWdpbkNvbnRhaW5lci5wcm90b3R5cGUuZmluYWxpemVBY3Rpb24gPSBmdW5jdGlvbiAoYWN0aW9uLCBhYm9ydCwgcGx1Z2lucywgbWVtZW50b3MsIGFyZ3MpIHtcbiAgICAgICAgaWYgKCFhYm9ydCkge1xuICAgICAgICAgICAgaWYgKG1lbWVudG9zICYmIG1lbWVudG9zLmxlbmd0aCAmJiAhRGlzcGF0Y2hlci5nZXREaXNwYXRjaGVyKCkudW5kb2luZykge1xuICAgICAgICAgICAgICAgIERpc3BhdGNoZXIuZ2V0VW5kb01hbmFnZXIoKS5zdG9yZU1lbWVudG9zKG1lbWVudG9zLCBhY3Rpb24sIERpc3BhdGNoZXIuY3JlYXRlUmVkbyhhY3Rpb24sIGFyZ3MpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9tZW1lbnRvc1thY3Rpb25dID0gbnVsbDtcbiAgICAgICAgdGhpcy5fcnVubmluZ1BsdWdpbnNbYWN0aW9uXSA9IG51bGw7XG4gICAgICAgIHRoaXMuX3Byb3RvY29sc1thY3Rpb25dID0gbnVsbDtcbiAgICB9O1xuICAgIFBsdWdpbkNvbnRhaW5lci5wcm90b3R5cGUucHJvdmlkZU1lbWVudG9zID0gZnVuY3Rpb24gKGFjdGlvbiwgcGx1Z2lucywgYXJncykge1xuICAgICAgICBpZiAocGx1Z2lucykge1xuICAgICAgICAgICAgdmFyIHJldCA9IFtdO1xuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgcGx1Z2lucy5mb3JFYWNoKGZ1bmN0aW9uIChwbHVnaW4pIHtcbiAgICAgICAgICAgICAgICB2YXIgbWVtZW50byA9IHBsdWdpbi5nZXRNZW1lbnRvLmFwcGx5KHBsdWdpbiwgW3RoYXQsIGFjdGlvbl0uY29uY2F0KGFyZ3MpKTtcbiAgICAgICAgICAgICAgICBpZiAobWVtZW50bykge1xuICAgICAgICAgICAgICAgICAgICBtZW1lbnRvLmluc3RhbmNlID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdG9yZUZyb21NZW1lbnRvOiBmdW5jdGlvbiAobWVtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGx1Z2luLnJlc3RvcmVGcm9tTWVtZW50byh0aGF0LCBtZW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICByZXQucHVzaChtZW1lbnRvKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChyZXQubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgRGlzcGF0Y2hlci5nZXRVbmRvTWFuYWdlcigpLnN0b3JlTWVtZW50b3MocmV0LCBhY3Rpb24sIERpc3BhdGNoZXIuY3JlYXRlUmVkbyhhY3Rpb24sIGFyZ3MpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFRoaXMgd3JhcHMgdGhlIGhhbmRsZXIgYXJvdW5kIHRoZSBleGlzdGluZyBoYW5kbGVycyB0aGUgYWN0aW9uLCBtYWtpbmcgdGhlIGdpdmVuIGhhbmRsZXIgdGhlIGZpcnN0IHRvIGJlIGNhbGxlZFxuICAgICAqIGZvciB0aGF0IGFjdGlvbi5cbiAgICAgKlxuICAgICAqIElmIHRoZSBBTlktQWN0aW9uIGlzIGdpdmVuXG4gICAgICogICAqIFRoZSBoYW5kbGVyIGlzIHdyYXBwZWQgZm9yIGV2ZXJ5IGFjdGlvbiB0aGVyZSBhbHJlYWR5IGlzIGFub3RoZXIgaGFuZGxlclxuICAgICAqICAgKiBUaGUgaGFuZGxlciBpcyB3cmFwcGVkIGFyb3VuZCBhbGwgb3RoZXIgYW55LWhhbmRsZXIsIGFuZCB0aGVzZSBhcmUgY2FsbGVkIGZvciBhbGwgYWN0aW9ucyB3aXRob3V0IHJlZ3VsYXIgaGFuZGxlcnNcbiAgICAgKlxuICAgICAqIElmIGEgcmVndWxhciBhY3Rpb24gaXMgZ2l2ZW4gYW5kIGFueS1oYW5kbGVycyBleGlzdCB0aGUgZ2l2ZW4gaGFuZGxlciBpcyB3cmFwcGVkIGFyb3VuZCBhbGwgYW55LWhhbmRsZXJzIGZvciB0aGVcbiAgICAgKiBnaXZlbiBhY3Rpb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYWN0aW9uXG4gICAgICogQHBhcmFtIGhhbmRsZXJcbiAgICAgKi9cbiAgICBQbHVnaW5Db250YWluZXIucHJvdG90eXBlLndyYXAgPSBmdW5jdGlvbiAoYWN0aW9uLCBoYW5kbGVyKSB7XG4gICAgICAgIGlmIChhY3Rpb24gPT09IC0xMDAwIC8qIF9fQU5ZX18gKi8pIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9hbnlQbHVnaW5zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICAgICBEaXNwYXRjaGVyLnN1YnNjcmliZUFjdGlvbigtMTAwMCAvKiBfX0FOWV9fICovLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhcmdzID0gW107XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmdzW19pIC0gMF0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBhY3QgPSBhcmdzLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGF0Ll9wbHVnaW5zW2FjdF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGF0LmhhbmRsZUFjdGlvbihhY3QsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhcmdzID0gW107XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIF9pID0gMTsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmdzW19pIC0gMV0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsOyAvLyBXaGUgaGFuZGxlIHRoZSBtZW1lbnRvcyBvdXJzZWx2ZXNcbiAgICAgICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgICAgIGlmICh0aGF0Ll9wbHVnaW5zW3R5cGVdKSB7XG4gICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhhdC5wcm92aWRlTWVtZW50b3ModHlwZSwgYXJncyk7XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yICh2YXIgYSBpbiB0aGlzLl9wbHVnaW5zKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3BsdWdpbnMuaGFzT3duUHJvcGVydHkoYSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb1dyYXAoYSwgaGFuZGxlcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fYW55UGx1Z2lucy51bnNoaWZ0KGhhbmRsZXIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9wbHVnaW5zW2FjdGlvbl0gJiYgdGhpcy5fYW55UGx1Z2lucy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB2YXIgbCA9IHRoaXMuX2FueVBsdWdpbnMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHdoaWxlIChsLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb1dyYXAoYWN0aW9uLCB0aGlzLl9hbnlQbHVnaW5zW2xdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmRvV3JhcChhY3Rpb24sIGhhbmRsZXIpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBQbHVnaW5Db250YWluZXIucHJvdG90eXBlLmRvV3JhcCA9IGZ1bmN0aW9uIChhY3Rpb24sIGhhbmRsZXIpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9wbHVnaW5zW2FjdGlvbl0pIHtcbiAgICAgICAgICAgIHRoaXMuX3BsdWdpbnNbYWN0aW9uXSA9IFtdO1xuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgRGlzcGF0Y2hlci5zdWJzY3JpYmVBY3Rpb24oYWN0aW9uLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgICAgICAgICBhcmdzW19pIC0gMF0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGF0LmhhbmRsZUFjdGlvbihhY3Rpb24sIGFyZ3MpO1xuICAgICAgICAgICAgfSwgZnVuY3Rpb24gKHR5cGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgYXJncyA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIF9pID0gMTsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGFyZ3NbX2kgLSAxXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsOyAvL3JldHVybiB0aGF0LnByb3ZpZGVNZW1lbnRvcyhhY3Rpb24sIGFyZ3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX3BsdWdpbnNbYWN0aW9uXS5pbmRleE9mKGhhbmRsZXIpICE9PSAtMSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUGx1Z2luIGluc3RhbmNlcyBjYW4gb25seSBiZSB1c2VkIG9uY2UgcGVyIGFjdGlvbiFcIik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcGx1Z2luc1thY3Rpb25dLnVuc2hpZnQoaGFuZGxlcik7XG4gICAgfTtcbiAgICBQbHVnaW5Db250YWluZXIucHJvdG90eXBlLmRldGFjaCA9IGZ1bmN0aW9uIChhY3Rpb24sIGhhbmRsZXIpIHtcbiAgICAgICAgaWYgKGFjdGlvbiA9PT0gLTEwMDAgLyogX19BTllfXyAqLykge1xuICAgICAgICAgICAgdGhpcy5fYW55UGx1Z2lucy5zcGxpY2UodGhpcy5fYW55UGx1Z2lucy5pbmRleE9mKGhhbmRsZXIpLCAxKTtcbiAgICAgICAgICAgIGZvciAodmFyIGEgaW4gdGhpcy5fcGx1Z2lucykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9wbHVnaW5zLmhhc093blByb3BlcnR5KGEpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3BsdWdpbnNbYV0uc3BsaWNlKHRoaXMuX3BsdWdpbnNbYV0uaW5kZXhPZihoYW5kbGVyKSwgMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKHRoaXMuX3BsdWdpbnNbYWN0aW9uXSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3BsdWdpbnNbYWN0aW9uXS5zcGxpY2UodGhpcy5fcGx1Z2luc1thY3Rpb25dLmluZGV4T2YoaGFuZGxlciksIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gUGx1Z2luQ29udGFpbmVyO1xufSkoRXZlbnRDaGFubmVsLkNoYW5uZWxlZEVtaXR0ZXIpO1xuZXhwb3J0cy5QbHVnaW5Db250YWluZXIgPSBQbHVnaW5Db250YWluZXI7XG5mdW5jdGlvbiBjcmVhdGVDb250YWluZXIoc3BlYykge1xuICAgIHJldHVybiBUb29scy5zdWJjbGFzcyhzcGVjLCBQbHVnaW5Db250YWluZXIpO1xufVxuZXhwb3J0cy5jcmVhdGVDb250YWluZXIgPSBjcmVhdGVDb250YWluZXI7XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXBsdWdpbnMuanMubWFwIiwiLyoqXG4gKiBDcmVhdGVkIGJ5IFN0ZXBoYW4gb24gMTAuMDEuMjAxNS5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgU3RyZWFtID0gcmVxdWlyZShcIi4vc3RyZWFtXCIpO1xuZXhwb3J0cy5jb21wb25lbnRMaWZlY3ljbGUgPSB7XG4gICAgX3dpbGxVbm1vdW50OiBudWxsLFxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuX3dpbGxVbm1vdW50ID0gU3RyZWFtLmNyZWF0ZVN0cmVhbShcImNvbXBvbmVudC11bm1vdW50XCIpO1xuICAgIH0sXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5fd2lsbFVubW91bnQucHVzaCh0cnVlKTtcbiAgICAgICAgdGhpcy5fd2lsbFVubW91bnQuZGlzcG9zZSgpO1xuICAgIH1cbn07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXJlYWN0TWl4aW5zLmpzLm1hcCIsIi8qKlxuICogQ3JlYXRlZCBieSBTdGVwaGFuIG9uIDI5LjEyLjIwMTQuXG4gKi9cblwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9IHRoaXMuX19leHRlbmRzIHx8IGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07XG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XG4gICAgX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGU7XG4gICAgZC5wcm90b3R5cGUgPSBuZXcgX18oKTtcbn07XG52YXIgVG9vbHMgPSByZXF1aXJlKFwiLi90b29sc1wiKTtcbnZhciBTdHJlYW0gPSByZXF1aXJlKFwiLi9zdHJlYW1cIik7XG4vKipcbiAqIFRlc3QgaWYgc29tZXRoaW5nIGlzIGEgc3RvcmUuXG4gKiBAcGFyYW0gdGhpbmdcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5mdW5jdGlvbiBpc1N0b3JlKHRoaW5nKSB7XG4gICAgcmV0dXJuIHRoaW5nIGluc3RhbmNlb2YgUmVjb3JkU3RvcmUgfHwgdGhpbmcgaW5zdGFuY2VvZiBBcnJheVN0b3JlIHx8IHRoaW5nIGluc3RhbmNlb2YgSW1tdXRhYmxlUmVjb3JkIHx8IHRoaW5nIGluc3RhbmNlb2YgSW1tdXRhYmxlQXJyYXk7XG59XG5leHBvcnRzLmlzU3RvcmUgPSBpc1N0b3JlO1xuZnVuY3Rpb24gY3JlYXRlVXBkYXRlSW5mbyhpdGVtLCB2YWx1ZSwgc3RvcmUsIHBhdGgsIHJvb3RJdGVtKSB7XG4gICAgdmFyIHIgPSB7XG4gICAgICAgIGl0ZW06IGl0ZW0sXG4gICAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgICAgc3RvcmU6IHN0b3JlXG4gICAgfTtcbiAgICBpZiAocGF0aCkge1xuICAgICAgICByW1wicGF0aFwiXSA9IHBhdGg7XG4gICAgfVxuICAgIGlmIChyb290SXRlbSAhPSBudWxsKSB7XG4gICAgICAgIHJbXCJyb290SXRlbVwiXSA9IHJvb3RJdGVtO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcltcInJvb3RJdGVtXCJdID0gaXRlbTtcbiAgICB9XG4gICAgcmV0dXJuIHI7XG59XG52YXIgU3RvcmUgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFN0b3JlKCkge1xuICAgICAgICB0aGlzLl9hZGRJdGVtc1N0cmVhbXMgPSBbXTtcbiAgICAgICAgdGhpcy5fcmVtb3ZlSXRlbXNTdHJlYW1zID0gW107XG4gICAgICAgIHRoaXMuX3VwZGF0ZVN0cmVhbXMgPSBbXTtcbiAgICAgICAgdGhpcy5fZGlzcG9zaW5nU3RyZWFtcyA9IFtdO1xuICAgIH1cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU3RvcmUucHJvdG90eXBlLCBcImlzSW1tdXRhYmxlXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIFN0b3JlLnByb3RvdHlwZS5yZW1vdmVTdHJlYW0gPSBmdW5jdGlvbiAobGlzdCwgc3RyZWFtKSB7XG4gICAgICAgIHZhciBpID0gbGlzdC5pbmRleE9mKHN0cmVhbSk7XG4gICAgICAgIGlmIChpICE9PSAtMSkge1xuICAgICAgICAgICAgbGlzdC5zcGxpY2UoaSwgMSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTdG9yZS5wcm90b3R5cGUsIFwibmV3SXRlbXNcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgIHZhciBzID0gU3RyZWFtLmNyZWF0ZVN0cmVhbShcImFkZFByb3BlcnR5XCIpO1xuICAgICAgICAgICAgdGhpcy5fYWRkSXRlbXNTdHJlYW1zLnB1c2gocyk7XG4gICAgICAgICAgICBzLm9uQ2xvc2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoYXQucmVtb3ZlU3RyZWFtKHRoYXQuX2FkZEl0ZW1zU3RyZWFtcywgcyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBzO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU3RvcmUucHJvdG90eXBlLCBcInJlbW92ZWRJdGVtc1wiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgdmFyIHMgPSBTdHJlYW0uY3JlYXRlU3RyZWFtKFwicmVtb3ZlUHJvcGVydHlcIik7XG4gICAgICAgICAgICB0aGlzLl9yZW1vdmVJdGVtc1N0cmVhbXMucHVzaChzKTtcbiAgICAgICAgICAgIHMub25DbG9zZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhhdC5yZW1vdmVTdHJlYW0odGhhdC5fcmVtb3ZlSXRlbXNTdHJlYW1zLCBzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcy51bnRpbCh0aGlzLmlzRGlzcG9zaW5nKTtcbiAgICAgICAgICAgIHJldHVybiBzO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU3RvcmUucHJvdG90eXBlLCBcInVwZGF0ZXNcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgIHZhciBzID0gU3RyZWFtLmNyZWF0ZVN0cmVhbShcInVwZGF0ZVByb3BlcnR5XCIpO1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlU3RyZWFtcy5wdXNoKHMpO1xuICAgICAgICAgICAgcy5vbkNsb3NlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGF0LnJlbW92ZVN0cmVhbSh0aGF0Ll91cGRhdGVTdHJlYW1zLCBzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHM7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTdG9yZS5wcm90b3R5cGUsIFwiYWxsQ2hhbmdlc1wiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudXBkYXRlcy5jb21iaW5lKHRoaXMubmV3SXRlbXMpLmNvbWJpbmUodGhpcy5yZW1vdmVkSXRlbXMpO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU3RvcmUucHJvdG90eXBlLCBcImlzRGlzcG9zaW5nXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICB2YXIgcyA9IFN0cmVhbS5jcmVhdGVTdHJlYW0oXCJkaXNwb3NpbmdcIik7XG4gICAgICAgICAgICB0aGlzLl9kaXNwb3NpbmdTdHJlYW1zLnB1c2gocyk7XG4gICAgICAgICAgICByZXR1cm4gcztcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgU3RvcmUucHJvdG90eXBlLmRpc3Bvc2VTdHJlYW1zID0gZnVuY3Rpb24gKHN0cmVhbUxpc3QpIHtcbiAgICAgICAgc3RyZWFtTGlzdC5mb3JFYWNoKGZ1bmN0aW9uIChzdHJlYW0pIHtcbiAgICAgICAgICAgIHN0cmVhbS5kaXNwb3NlKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBzdHJlYW1MaXN0ID0gW107XG4gICAgfTtcbiAgICBTdG9yZS5wcm90b3R5cGUuZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5fZGlzcG9zaW5nU3RyZWFtcy5mb3JFYWNoKGZ1bmN0aW9uIChzdHJlYW0pIHtcbiAgICAgICAgICAgIHN0cmVhbS5wdXNoKHRydWUpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5kaXNwb3NlU3RyZWFtcyh0aGlzLl9yZW1vdmVJdGVtc1N0cmVhbXMpO1xuICAgICAgICB0aGlzLmRpc3Bvc2VTdHJlYW1zKHRoaXMuX3VwZGF0ZVN0cmVhbXMpO1xuICAgICAgICB0aGlzLmRpc3Bvc2VTdHJlYW1zKHRoaXMuX2FkZEl0ZW1zU3RyZWFtcyk7XG4gICAgICAgIHRoaXMuZGlzcG9zZVN0cmVhbXModGhpcy5fZGlzcG9zaW5nU3RyZWFtcyk7XG4gICAgfTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU3RvcmUucHJvdG90eXBlLCBcImltbXV0YWJsZVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIFN0b3JlLnByb3RvdHlwZS5pdGVtID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9O1xuICAgIHJldHVybiBTdG9yZTtcbn0pKCk7XG4vKipcbiAqIEJhc2UgY2xhc3MgZm9yIGltbXV0YWJsZSBzdG9yZXMuXG4gKi9cbnZhciBJbW11dGFibGVTdG9yZSA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKEltbXV0YWJsZVN0b3JlLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIEltbXV0YWJsZVN0b3JlKCkge1xuICAgICAgICBfc3VwZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gICAgcmV0dXJuIEltbXV0YWJsZVN0b3JlO1xufSkoU3RvcmUpO1xudmFyIFJlY29yZFN0b3JlID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoUmVjb3JkU3RvcmUsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gUmVjb3JkU3RvcmUoaW5pdGlhbCkge1xuICAgICAgICBfc3VwZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgdGhpcy5fZGF0YSA9IHt9O1xuICAgICAgICB0aGlzLl9zdWJTdHJlYW1zID0ge307XG4gICAgICAgIGlmIChpbml0aWFsKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBwcm9wIGluIGluaXRpYWwpIHtcbiAgICAgICAgICAgICAgICBpZiAoaW5pdGlhbC5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEl0ZW0ocHJvcCwgaW5pdGlhbFtwcm9wXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIFJlY29yZFN0b3JlLnByb3RvdHlwZS5jaGVja05hbWVBbGxvd2VkID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcbiAgICBSZWNvcmRTdG9yZS5wcm90b3R5cGUuc2V0dXBTdWJTdHJlYW0gPSBmdW5jdGlvbiAobmFtZSwgdmFsdWUpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NlU3ViU3RyZWFtKG5hbWUpO1xuICAgICAgICBpZiAoaXNTdG9yZSh2YWx1ZSkpIHtcbiAgICAgICAgICAgIHZhciBzdWJTdHJlYW07XG4gICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICBzdWJTdHJlYW0gPSB2YWx1ZS51cGRhdGVzO1xuICAgICAgICAgICAgc3ViU3RyZWFtLmZvckVhY2goZnVuY3Rpb24gKHVwZGF0ZSkge1xuICAgICAgICAgICAgICAgIHZhciBpbmZvID0gY3JlYXRlVXBkYXRlSW5mbyh1cGRhdGUuaXRlbSwgdXBkYXRlLnZhbHVlLCB1cGRhdGUuc3RvcmUsIHVwZGF0ZS5wYXRoID8gbmFtZSArIFwiLlwiICsgdXBkYXRlLnBhdGggOiBuYW1lICsgXCIuXCIgKyB1cGRhdGUuaXRlbSwgbmFtZSk7XG4gICAgICAgICAgICAgICAgdGhhdC5fdXBkYXRlU3RyZWFtcy5mb3JFYWNoKGZ1bmN0aW9uIChzdHJlYW0pIHtcbiAgICAgICAgICAgICAgICAgICAgc3RyZWFtLnB1c2goaW5mbyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuX3N1YlN0cmVhbXNbbmFtZV0gPSBzdWJTdHJlYW07XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFJlY29yZFN0b3JlLnByb3RvdHlwZS5kaXNwb3NlU3ViU3RyZWFtID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgdmFyIHN1YlN0cmVhbSA9IHRoaXMuX3N1YlN0cmVhbXNbbmFtZV07XG4gICAgICAgIGlmIChzdWJTdHJlYW0pIHtcbiAgICAgICAgICAgIHN1YlN0cmVhbS5kaXNwb3NlKCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFJlY29yZFN0b3JlLnByb3RvdHlwZS5hZGRJdGVtID0gZnVuY3Rpb24gKG5hbWUsIGluaXRpYWwpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrTmFtZUFsbG93ZWQobmFtZSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5hbWUgJ1wiICsgbmFtZSArIFwiJyBub3QgYWxsb3dlZCBmb3IgcHJvcGVydHkgb2Ygb2JqZWN0IHN0b3JlLlwiKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBuYW1lLCB7XG4gICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhhdC5fZGF0YVtuYW1lXTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHRoYXQuX2RhdGFbbmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICB2YXIgdXBkYXRlSW5mbyA9IGNyZWF0ZVVwZGF0ZUluZm8obmFtZSwgdmFsdWUsIHRoYXQpO1xuICAgICAgICAgICAgICAgIHRoYXQuc2V0dXBTdWJTdHJlYW0obmFtZSwgdmFsdWUpO1xuICAgICAgICAgICAgICAgIHRoYXQuX3VwZGF0ZVN0cmVhbXMuZm9yRWFjaChmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbS5wdXNoKHVwZGF0ZUluZm8pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5fZGF0YVtuYW1lXSA9IGluaXRpYWw7XG4gICAgICAgIHRoaXMuc2V0dXBTdWJTdHJlYW0obmFtZSwgaW5pdGlhbCk7XG4gICAgICAgIGlmICh0aGlzLl9hZGRJdGVtc1N0cmVhbXMpIHtcbiAgICAgICAgICAgIHRoaXMuX2FkZEl0ZW1zU3RyZWFtcy5mb3JFYWNoKGZ1bmN0aW9uIChzdHJlYW0pIHtcbiAgICAgICAgICAgICAgICBzdHJlYW0ucHVzaChjcmVhdGVVcGRhdGVJbmZvKG5hbWUsIGluaXRpYWwsIHRoYXQpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBSZWNvcmRTdG9yZS5wcm90b3R5cGUucmVtb3ZlSXRlbSA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIGlmICh0aGlzLl9kYXRhLmhhc093blByb3BlcnR5KG5hbWUpKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpc1tuYW1lXTtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9kYXRhW25hbWVdO1xuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NlU3ViU3RyZWFtKG5hbWUpO1xuICAgICAgICAgICAgdGhpcy5fcmVtb3ZlSXRlbXNTdHJlYW1zLmZvckVhY2goZnVuY3Rpb24gKHN0cmVhbSkge1xuICAgICAgICAgICAgICAgIHN0cmVhbS5wdXNoKGNyZWF0ZVVwZGF0ZUluZm8obmFtZSwgbnVsbCwgdGhhdCkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmtub3duIHByb3BlcnR5ICdcIiArIG5hbWUgKyBcIicuXCIpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoUmVjb3JkU3RvcmUucHJvdG90eXBlLCBcImltbXV0YWJsZVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9pbW11dGFibGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9pbW11dGFibGUgPSBuZXcgSW1tdXRhYmxlUmVjb3JkKHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2ltbXV0YWJsZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFJlY29yZFN0b3JlLnByb3RvdHlwZSwgXCJrZXlzXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgciA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgayBpbiB0aGlzLl9kYXRhKSB7XG4gICAgICAgICAgICAgICAgci5wdXNoKGspO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHI7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIFJlY29yZFN0b3JlLnByb3RvdHlwZS5kaXNwb3NlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgIHRoaXMua2V5cy5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIGlmIChpc1N0b3JlKHRoYXRba2V5XSkpIHtcbiAgICAgICAgICAgICAgICB0aGF0W2tleV0uZGlzcG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVsZXRlIHRoYXRba2V5XTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuX2RhdGEgPSBudWxsO1xuICAgICAgICBfc3VwZXIucHJvdG90eXBlLmRpc3Bvc2UuY2FsbCh0aGlzKTtcbiAgICB9O1xuICAgIHJldHVybiBSZWNvcmRTdG9yZTtcbn0pKFN0b3JlKTtcbnZhciBJbW11dGFibGVSZWNvcmQgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhJbW11dGFibGVSZWNvcmQsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gSW1tdXRhYmxlUmVjb3JkKF9wYXJlbnQpIHtcbiAgICAgICAgX3N1cGVyLmNhbGwodGhpcyk7XG4gICAgICAgIHRoaXMuX3BhcmVudCA9IF9wYXJlbnQ7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgX3BhcmVudC5rZXlzLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgdGhhdC5hZGRJdGVtKGtleSk7XG4gICAgICAgIH0pO1xuICAgICAgICBfcGFyZW50Lm5ld0l0ZW1zLmZvckVhY2goZnVuY3Rpb24gKHVwZGF0ZSkge1xuICAgICAgICAgICAgdGhhdC5hZGRJdGVtKHVwZGF0ZS5pdGVtKTtcbiAgICAgICAgfSkudW50aWwoX3BhcmVudC5pc0Rpc3Bvc2luZyk7XG4gICAgICAgIF9wYXJlbnQucmVtb3ZlZEl0ZW1zLmZvckVhY2goZnVuY3Rpb24gKHVwZGF0ZSkge1xuICAgICAgICAgICAgdGhhdC5yZW1vdmVJdGVtKHVwZGF0ZS5pdGVtKTtcbiAgICAgICAgfSkudW50aWwoX3BhcmVudC5pc0Rpc3Bvc2luZyk7XG4gICAgfVxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShJbW11dGFibGVSZWNvcmQucHJvdG90eXBlLCBcImlzSW1tdXRhYmxlXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEltbXV0YWJsZVJlY29yZC5wcm90b3R5cGUsIFwiaW1tdXRhYmxlXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgSW1tdXRhYmxlUmVjb3JkLnByb3RvdHlwZS5hZGRJdGVtID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgbmFtZSwge1xuICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzU3RvcmUodGhhdC5fcGFyZW50W25hbWVdKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhhdC5fcGFyZW50W25hbWVdLmltbXV0YWJsZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoYXQuX3BhcmVudFtuYW1lXTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuICAgIEltbXV0YWJsZVJlY29yZC5wcm90b3R5cGUucmVtb3ZlSXRlbSA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzW25hbWVdO1xuICAgIH07XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEltbXV0YWJsZVJlY29yZC5wcm90b3R5cGUsIFwia2V5c1wiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudC5rZXlzO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBJbW11dGFibGVSZWNvcmQucHJvdG90eXBlLnN1YnNjcmliZVBhcmVudFN0cmVhbSA9IGZ1bmN0aW9uIChwYXJlbnRTdHJlYW0pIHtcbiAgICAgICAgdmFyIHN0cmVhbSA9IFN0cmVhbS5jcmVhdGVTdHJlYW0oKTtcbiAgICAgICAgcGFyZW50U3RyZWFtLmZvckVhY2goZnVuY3Rpb24gKHVwZGF0ZSkge1xuICAgICAgICAgICAgc3RyZWFtLnB1c2godXBkYXRlKTtcbiAgICAgICAgfSkudW50aWwodGhpcy5fcGFyZW50LmlzRGlzcG9zaW5nKTtcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICB0aGlzLl91cGRhdGVTdHJlYW1zLnB1c2goc3RyZWFtKTtcbiAgICAgICAgc3RyZWFtLm9uQ2xvc2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhhdC5yZW1vdmVTdHJlYW0odGhhdC5fdXBkYXRlU3RyZWFtcywgc3RyZWFtKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBzdHJlYW07XG4gICAgfTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoSW1tdXRhYmxlUmVjb3JkLnByb3RvdHlwZSwgXCJ1cGRhdGVzXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zdWJzY3JpYmVQYXJlbnRTdHJlYW0odGhpcy5fcGFyZW50LnVwZGF0ZXMpO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoSW1tdXRhYmxlUmVjb3JkLnByb3RvdHlwZSwgXCJuZXdJdGVtc1wiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3Vic2NyaWJlUGFyZW50U3RyZWFtKHRoaXMuX3BhcmVudC5uZXdJdGVtcyk7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShJbW11dGFibGVSZWNvcmQucHJvdG90eXBlLCBcInJlbW92ZWRJdGVtc1wiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3Vic2NyaWJlUGFyZW50U3RyZWFtKHRoaXMuX3BhcmVudC5yZW1vdmVkSXRlbXMpO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoSW1tdXRhYmxlUmVjb3JkLnByb3RvdHlwZSwgXCJpc0Rpc3Bvc2luZ1wiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3Vic2NyaWJlUGFyZW50U3RyZWFtKHRoaXMuX3BhcmVudC5pc0Rpc3Bvc2luZyk7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIHJldHVybiBJbW11dGFibGVSZWNvcmQ7XG59KShJbW11dGFibGVTdG9yZSk7XG4vKipcbiAqIFJlY3Vyc2l2ZWx5IGJ1aWxkIGEgbmVzdGVkIHN0b3JlLlxuICogQHBhcmFtIHZhbHVlXG4gKiBAcmV0dXJucyB7Kn1cbiAqL1xuZnVuY3Rpb24gYnVpbGREZWVwKHZhbHVlKSB7XG4gICAgZnVuY3Rpb24gZ2V0SXRlbSh2YWx1ZSkge1xuICAgICAgICB2YXIgdjtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgaWYgKFRvb2xzLmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgdiA9IGJ1aWxkQXJyYXkodmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdiA9IGJ1aWxkUmVjb3JkKHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHYgPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdjtcbiAgICB9XG4gICAgZnVuY3Rpb24gYnVpbGRBcnJheSh2YWx1ZSkge1xuICAgICAgICB2YXIgc3RvcmUgPSBuZXcgQXJyYXlTdG9yZSgpO1xuICAgICAgICB2YWx1ZS5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICBzdG9yZS5wdXNoKGdldEl0ZW0oaXRlbSkpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHN0b3JlO1xuICAgIH1cbiAgICBmdW5jdGlvbiBidWlsZFJlY29yZCh2YWx1ZXMpIHtcbiAgICAgICAgdmFyIHN0b3JlID0gbmV3IFJlY29yZFN0b3JlKCk7XG4gICAgICAgIGZvciAodmFyIGtleSBpbiB2YWx1ZXMpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZXMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgIHN0b3JlLmFkZEl0ZW0oa2V5LCBnZXRJdGVtKHZhbHVlc1trZXldKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN0b3JlO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgIGlmIChUb29scy5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgICAgcmV0dXJuIGJ1aWxkQXJyYXkodmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGJ1aWxkUmVjb3JkKHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufVxuLyoqXG4gKiBDcmVhdGUgYSBuZXcgcmVjb3JkLiBJZiBhbiBpbml0aWFsIHZhbHVlIGlzIGdpdmVuIGl0IHdpbGwgaGF2ZSB0aGUgZW51bWVyYWJsZSBwcm9wZXJ0aWVzIG9mIHRoYXQgdmFsdWUuIFlvdSBjYW5cbiAqIGNyZWF0ZSBuZXN0ZWQgc3RvcmVzIGJ5IHByb3ZpZGluZyBhIGNvbXBsZXggb2JqZWN0IGFzIGFuIGluaXRpYWwgdmFsdWUuXG4gKiBAcGFyYW0gaW5pdGlhbFxuICogQHJldHVybnMgeyp9XG4gKi9cbmZ1bmN0aW9uIHJlY29yZChpbml0aWFsKSB7XG4gICAgaWYgKGluaXRpYWwpIHtcbiAgICAgICAgcmV0dXJuIGJ1aWxkRGVlcChpbml0aWFsKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVjb3JkU3RvcmUoKTtcbiAgICB9XG59XG5leHBvcnRzLnJlY29yZCA9IHJlY29yZDtcbnZhciBBcnJheVN0b3JlID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoQXJyYXlTdG9yZSwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBBcnJheVN0b3JlKGluaXRpYWwsIGFkZGVyLCByZW1vdmVyLCB1cGRhdGVyKSB7XG4gICAgICAgIF9zdXBlci5jYWxsKHRoaXMpO1xuICAgICAgICB0aGlzLl9zdWJzdHJlYW1zID0ge307XG4gICAgICAgIHRoaXMuX2RhdGEgPSBpbml0aWFsIHx8IFtdO1xuICAgICAgICB0aGlzLl9tYXhQcm9wcyA9IDA7XG4gICAgICAgIHRoaXMudXBkYXRlUHJvcGVydGllcygpO1xuICAgICAgICB0aGlzLl9zeW5jZWQgPSB0cnVlO1xuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgIGlmIChhZGRlcikge1xuICAgICAgICAgICAgYWRkZXIuZm9yRWFjaChmdW5jdGlvbiAodXBkYXRlKSB7XG4gICAgICAgICAgICAgICAgdGhhdC5zcGxpY2UodXBkYXRlLml0ZW0sIDAsIHVwZGF0ZS52YWx1ZSk7XG4gICAgICAgICAgICB9KS51bnRpbCh0aGlzLmlzRGlzcG9zaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVtb3Zlcikge1xuICAgICAgICAgICAgcmVtb3Zlci5mb3JFYWNoKGZ1bmN0aW9uICh1cGRhdGUpIHtcbiAgICAgICAgICAgICAgICB0aGF0LnNwbGljZSh1cGRhdGUuaXRlbSwgMSk7XG4gICAgICAgICAgICB9KS51bnRpbCh0aGlzLmlzRGlzcG9zaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodXBkYXRlcikge1xuICAgICAgICAgICAgdXBkYXRlci5mb3JFYWNoKGZ1bmN0aW9uICh1cGRhdGUpIHtcbiAgICAgICAgICAgICAgICB0aGF0W3VwZGF0ZS5pdGVtXSA9IHVwZGF0ZS52YWx1ZTtcbiAgICAgICAgICAgIH0pLnVudGlsKHRoaXMuaXNEaXNwb3NpbmcpO1xuICAgICAgICB9XG4gICAgfVxuICAgIEFycmF5U3RvcmUucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YS50b1N0cmluZygpO1xuICAgIH07XG4gICAgQXJyYXlTdG9yZS5wcm90b3R5cGUudG9Mb2NhbGVTdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhLnRvTG9jYWxlU3RyaW5nKCk7XG4gICAgfTtcbiAgICBBcnJheVN0b3JlLnByb3RvdHlwZS5mb3JFYWNoID0gZnVuY3Rpb24gKGNhbGxiYWNrZm4sIHRoaXNBcmcpIHtcbiAgICAgICAgdGhpcy5fZGF0YS5mb3JFYWNoKGNhbGxiYWNrZm4sIHRoaXNBcmcpO1xuICAgIH07XG4gICAgQXJyYXlTdG9yZS5wcm90b3R5cGUuZXZlcnkgPSBmdW5jdGlvbiAoY2FsbGJhY2tmbiwgdGhpc0FyZykge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YS5ldmVyeShjYWxsYmFja2ZuLCB0aGlzQXJnKTtcbiAgICB9O1xuICAgIEFycmF5U3RvcmUucHJvdG90eXBlLnNvbWUgPSBmdW5jdGlvbiAoY2FsbGJhY2tmbiwgdGhpc0FyZykge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YS5zb21lKGNhbGxiYWNrZm4sIHRoaXNBcmcpO1xuICAgIH07XG4gICAgQXJyYXlTdG9yZS5wcm90b3R5cGUuaW5kZXhPZiA9IGZ1bmN0aW9uICh2YWx1ZSwgZnJvbUluZGV4KSB7XG4gICAgICAgIGlmIChpc1N0b3JlKHZhbHVlKSAmJiB2YWx1ZS5pc0ltbXV0YWJsZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGEuaW5kZXhPZih2YWx1ZVtcIl9wYXJlbnRcIl0sIGZyb21JbmRleCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZGF0YS5pbmRleE9mKHZhbHVlLCBmcm9tSW5kZXgpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBBcnJheVN0b3JlLnByb3RvdHlwZS5sYXN0SW5kZXhPZiA9IGZ1bmN0aW9uIChzZWFyY2hFbGVtZW50LCBmcm9tSW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGEubGFzdEluZGV4T2Yoc2VhcmNoRWxlbWVudCwgZnJvbUluZGV4KTtcbiAgICB9O1xuICAgIEFycmF5U3RvcmUucHJvdG90eXBlLmpvaW4gPSBmdW5jdGlvbiAoc2VwYXJhdG9yKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhLmpvaW4oc2VwYXJhdG9yKTtcbiAgICB9O1xuICAgIEFycmF5U3RvcmUucHJvdG90eXBlLm1hcCA9IGZ1bmN0aW9uIChjYWxsYmFja2ZuLCB0aGlzQXJnKSB7XG4gICAgICAgIHZhciBtYXBwZWQgPSB0aGlzLl9kYXRhLm1hcChjYWxsYmFja2ZuLCB0aGlzQXJnKTtcbiAgICAgICAgdmFyIGFkZGVyID0gU3RyZWFtLmNyZWF0ZVN0cmVhbSgpO1xuICAgICAgICB2YXIgcmVtb3ZlciA9IFN0cmVhbS5jcmVhdGVTdHJlYW0oKTtcbiAgICAgICAgdmFyIHVwZGF0ZXIgPSBTdHJlYW0uY3JlYXRlU3RyZWFtKCk7XG4gICAgICAgIHZhciBtYXBwZWRTdG9yZSA9IG5ldyBBcnJheVN0b3JlKG1hcHBlZCwgYWRkZXIsIHJlbW92ZXIsIHVwZGF0ZXIpO1xuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgIHRoaXMudXBkYXRlcy5mb3JFYWNoKGZ1bmN0aW9uICh1cGRhdGUpIHtcbiAgICAgICAgICAgIHVwZGF0ZXIucHVzaChjcmVhdGVVcGRhdGVJbmZvKHVwZGF0ZS5yb290SXRlbSwgY2FsbGJhY2tmbih0aGF0Ll9kYXRhW3VwZGF0ZS5yb290SXRlbV0sIHVwZGF0ZS5yb290SXRlbSwgdGhhdC5fZGF0YSksIHVwZGF0ZS5zdG9yZSkpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5uZXdJdGVtcy5mb3JFYWNoKGZ1bmN0aW9uICh1cGRhdGUpIHtcbiAgICAgICAgICAgIGFkZGVyLnB1c2goY3JlYXRlVXBkYXRlSW5mbyh1cGRhdGUucm9vdEl0ZW0sIGNhbGxiYWNrZm4odGhhdC5fZGF0YVt1cGRhdGUucm9vdEl0ZW1dLCB1cGRhdGUucm9vdEl0ZW0sIHRoYXQuX2RhdGEpLCB1cGRhdGUuc3RvcmUpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMucmVtb3ZlZEl0ZW1zLmZvckVhY2goZnVuY3Rpb24gKHVwZGF0ZSkge1xuICAgICAgICAgICAgcmVtb3Zlci5wdXNoKGNyZWF0ZVVwZGF0ZUluZm8odXBkYXRlLnJvb3RJdGVtLCB1cGRhdGUudmFsdWUsIHVwZGF0ZS5zdG9yZSkpOyAvLyBUaGUgdmFsdWUgZG9lcyBub3QgbWF0dGVyIGhlcmUsIHNhdmUgdGhlIGNhbGwgdG8gdGhlIGNhbGxiYWNrXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gbWFwcGVkU3RvcmU7XG4gICAgfTtcbiAgICBBcnJheVN0b3JlLnByb3RvdHlwZS5maWx0ZXIgPSBmdW5jdGlvbiAoY2FsbGJhY2tmbiwgbm9VcGRhdGVzLCB0aGlzQXJnKSB7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgdmFyIGFkZGVyO1xuICAgICAgICB2YXIgcmVtb3ZlcjtcbiAgICAgICAgdmFyIHVwZGF0ZXI7XG4gICAgICAgIHZhciBmaWx0ZXJlZFN0b3JlO1xuICAgICAgICB2YXIgaW5kZXhNYXAgPSBbXTtcbiAgICAgICAgdmFyIGZpbHRlcmVkID0gW107XG4gICAgICAgIGZ1bmN0aW9uIG1hcChmb3JJbmRleCwgdG9JbmRleCkge1xuICAgICAgICAgICAgaW5kZXhNYXBbZm9ySW5kZXhdID0gdG9JbmRleDtcbiAgICAgICAgICAgIGlmICh0b0luZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSBmb3JJbmRleCArIDE7IGkgPCBpbmRleE1hcC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXhNYXBbaV0gIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hcFtpXSArPSAxO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIGFkZE1hcChmcm9tSW5kZXgsIHRvSW5kZXgpIHtcbiAgICAgICAgICAgIGluZGV4TWFwLnNwbGljZShmcm9tSW5kZXgsIDAsIHRvSW5kZXgpO1xuICAgICAgICAgICAgaWYgKHRvSW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IGZyb21JbmRleCArIDE7IGkgPCBpbmRleE1hcC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXhNYXBbaV0gIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hcFtpXSArPSAxO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIHVubWFwKGZvckluZGV4KSB7XG4gICAgICAgICAgICB2YXIgZG93bnNoaWZ0ID0gaXNNYXBwZWQoZm9ySW5kZXgpO1xuICAgICAgICAgICAgaW5kZXhNYXBbZm9ySW5kZXhdID0gLTE7XG4gICAgICAgICAgICBpZiAoZG93bnNoaWZ0KSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IGZvckluZGV4ICsgMTsgaSA8IGluZGV4TWFwLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmRleE1hcFtpXSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4TWFwW2ldIC09IDE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gcmVtb3ZlTWFwKGZvckluZGV4KSB7XG4gICAgICAgICAgICB2YXIgZG93bnNoaWZ0ID0gaXNNYXBwZWQoZm9ySW5kZXgpO1xuICAgICAgICAgICAgaW5kZXhNYXAuc3BsaWNlKGZvckluZGV4LCAxKTtcbiAgICAgICAgICAgIGlmIChkb3duc2hpZnQpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gZm9ySW5kZXg7IGkgPCBpbmRleE1hcC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXhNYXBbaV0gIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hcFtpXSAtPSAxO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIG1hcEluZGV4KGZyb21JbmRleCkge1xuICAgICAgICAgICAgcmV0dXJuIGluZGV4TWFwW2Zyb21JbmRleF07XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gaXNNYXBwZWQoaW5kZXgpIHtcbiAgICAgICAgICAgIHJldHVybiBpbmRleCA8IGluZGV4TWFwLmxlbmd0aCAmJiBpbmRleE1hcFtpbmRleF0gIT09IC0xO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIGdldENsb3Nlc3RMZWZ0TWFwKGZvckluZGV4KSB7XG4gICAgICAgICAgICB2YXIgaSA9IGZvckluZGV4O1xuICAgICAgICAgICAgd2hpbGUgKChpID49IGluZGV4TWFwLmxlbmd0aCB8fCBpbmRleE1hcFtpXSA9PT0gLTEpICYmIGkgPiAtMikge1xuICAgICAgICAgICAgICAgIGktLTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpIDwgMClcbiAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICByZXR1cm4gbWFwSW5kZXgoaSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fZGF0YS5mb3JFYWNoKGZ1bmN0aW9uICh2YWx1ZSwgaW5kZXgpIHtcbiAgICAgICAgICAgIGlmIChjYWxsYmFja2ZuKHZhbHVlLCBpbmRleCwgdGhhdC5fZGF0YSkpIHtcbiAgICAgICAgICAgICAgICBhZGRNYXAoaW5kZXgsIGZpbHRlcmVkLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgZmlsdGVyZWQucHVzaCh2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBhZGRNYXAoaW5kZXgsIC0xKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGlmICghbm9VcGRhdGVzKSB7XG4gICAgICAgICAgICBhZGRlciA9IFN0cmVhbS5jcmVhdGVTdHJlYW0oKTtcbiAgICAgICAgICAgIHJlbW92ZXIgPSBTdHJlYW0uY3JlYXRlU3RyZWFtKCk7XG4gICAgICAgICAgICB1cGRhdGVyID0gU3RyZWFtLmNyZWF0ZVN0cmVhbSgpO1xuICAgICAgICAgICAgdGhpcy5uZXdJdGVtcy5mb3JFYWNoKGZ1bmN0aW9uICh1cGRhdGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2tmbih0aGF0Ll9kYXRhW3VwZGF0ZS5yb290SXRlbV0sIHVwZGF0ZS5yb290SXRlbSwgdGhhdC5fZGF0YSkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzTWFwcGVkKHVwZGF0ZS5yb290SXRlbSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZGVyLnB1c2goY3JlYXRlVXBkYXRlSW5mbyhtYXBJbmRleCh1cGRhdGUucm9vdEl0ZW0pLCB0aGF0Ll9kYXRhW3VwZGF0ZS5yb290SXRlbV0sIHVwZGF0ZS5zdG9yZSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWRkZXIucHVzaChjcmVhdGVVcGRhdGVJbmZvKGdldENsb3Nlc3RMZWZ0TWFwKHVwZGF0ZS5yb290SXRlbSkgKyAxLCB0aGF0Ll9kYXRhW3VwZGF0ZS5yb290SXRlbV0sIHVwZGF0ZS5zdG9yZSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGFkZE1hcCh1cGRhdGUucm9vdEl0ZW0sIGZpbHRlcmVkU3RvcmUuaW5kZXhPZih0aGF0Ll9kYXRhW3VwZGF0ZS5yb290SXRlbV0pKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGFkZE1hcCh1cGRhdGUucm9vdEl0ZW0sIC0xKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlZEl0ZW1zLmZvckVhY2goZnVuY3Rpb24gKHVwZGF0ZSkge1xuICAgICAgICAgICAgICAgIGlmIChpc01hcHBlZCh1cGRhdGUucm9vdEl0ZW0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZXIucHVzaChjcmVhdGVVcGRhdGVJbmZvKG1hcEluZGV4KHVwZGF0ZS5yb290SXRlbSksIHRoYXQuX2RhdGFbdXBkYXRlLnJvb3RJdGVtXSwgdXBkYXRlLnN0b3JlKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlbW92ZU1hcCh1cGRhdGUucm9vdEl0ZW0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZXMuZm9yRWFjaChmdW5jdGlvbiAodXBkYXRlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrZm4odGhhdC5fZGF0YVt1cGRhdGUucm9vdEl0ZW1dLCB1cGRhdGUucm9vdEl0ZW0sIHRoYXQuX2RhdGEpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc01hcHBlZCh1cGRhdGUucm9vdEl0ZW0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVyLnB1c2goY3JlYXRlVXBkYXRlSW5mbyhtYXBJbmRleCh1cGRhdGUucm9vdEl0ZW0pLCB0aGF0Ll9kYXRhW3VwZGF0ZS5yb290SXRlbV0sIHVwZGF0ZS5zdG9yZSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWRkZXIucHVzaChjcmVhdGVVcGRhdGVJbmZvKGdldENsb3Nlc3RMZWZ0TWFwKHVwZGF0ZS5yb290SXRlbSkgKyAxLCB0aGF0Ll9kYXRhW3VwZGF0ZS5yb290SXRlbV0sIHVwZGF0ZS5zdG9yZSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFwKHVwZGF0ZS5yb290SXRlbSwgZmlsdGVyZWRTdG9yZS5pbmRleE9mKHRoYXQuX2RhdGFbdXBkYXRlLnJvb3RJdGVtXSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNNYXBwZWQodXBkYXRlLnJvb3RJdGVtKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3Zlci5wdXNoKGNyZWF0ZVVwZGF0ZUluZm8obWFwSW5kZXgodXBkYXRlLnJvb3RJdGVtKSwgdGhhdC5fZGF0YVt1cGRhdGUucm9vdEl0ZW1dLCB1cGRhdGUuc3RvcmUpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVubWFwKHVwZGF0ZS5yb290SXRlbSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXAodXBkYXRlLnJvb3RJdGVtLCAtMSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBmaWx0ZXJlZFN0b3JlID0gbmV3IEFycmF5U3RvcmUoZmlsdGVyZWQsIGFkZGVyLCByZW1vdmVyLCB1cGRhdGVyKTtcbiAgICAgICAgcmV0dXJuIGZpbHRlcmVkU3RvcmU7XG4gICAgfTtcbiAgICBBcnJheVN0b3JlLnByb3RvdHlwZS5yZWR1Y2UgPSBmdW5jdGlvbiAoY2FsbGJhY2tmbiwgaW5pdGlhbFZhbHVlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhLnJlZHVjZShjYWxsYmFja2ZuLCBpbml0aWFsVmFsdWUpO1xuICAgIH07XG4gICAgQXJyYXlTdG9yZS5wcm90b3R5cGUuc29ydCA9IGZ1bmN0aW9uIChjb21wYXJlRm4pIHtcbiAgICAgICAgdmFyIGNvcHkgPSB0aGlzLl9kYXRhLm1hcChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgcmV0dXJuIGl0ZW07XG4gICAgICAgIH0pO1xuICAgICAgICBjb3B5LnNvcnQoY29tcGFyZUZuKTtcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICBjb3B5LmZvckVhY2goZnVuY3Rpb24gKHZhbHVlLCBpbmRleCkge1xuICAgICAgICAgICAgaWYgKHZhbHVlICE9PSB0aGF0Ll9kYXRhW2luZGV4XSkge1xuICAgICAgICAgICAgICAgIHRoYXRbaW5kZXhdID0gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgQXJyYXlTdG9yZS5wcm90b3R5cGUucmV2ZXJzZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGNvcHkgPSB0aGlzLl9kYXRhLm1hcChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgcmV0dXJuIGl0ZW07XG4gICAgICAgIH0pO1xuICAgICAgICBjb3B5LnJldmVyc2UoKTtcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICBjb3B5LmZvckVhY2goZnVuY3Rpb24gKHZhbHVlLCBpbmRleCkge1xuICAgICAgICAgICAgaWYgKHZhbHVlICE9PSB0aGF0Ll9kYXRhW2luZGV4XSkge1xuICAgICAgICAgICAgICAgIHRoYXRbaW5kZXhdID0gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgQXJyYXlTdG9yZS5wcm90b3R5cGUuY29uY2F0ID0gZnVuY3Rpb24gKGFycmF5KSB7XG4gICAgICAgIHZhciBuZXdBcnJheTtcbiAgICAgICAgaWYgKGFycmF5IGluc3RhbmNlb2YgQXJyYXlTdG9yZSkge1xuICAgICAgICAgICAgbmV3QXJyYXkgPSB0aGlzLl9kYXRhLmNvbmNhdChhcnJheVtcIl9kYXRhXCJdKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIG5ld0FycmF5ID0gdGhpcy5fZGF0YS5jb25jYXQoYXJyYXkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgQXJyYXlTdG9yZShuZXdBcnJheSk7XG4gICAgfTtcbiAgICBBcnJheVN0b3JlLnByb3RvdHlwZS5jb25jYXRJbnBsYWNlID0gZnVuY3Rpb24gKGFycmF5KSB7XG4gICAgICAgIGlmIChhcnJheSBpbnN0YW5jZW9mIEFycmF5U3RvcmUpIHtcbiAgICAgICAgICAgIHRoaXMuc3BsaWNlLmFwcGx5KHRoaXMsIFt0aGlzLmxlbmd0aCwgMF0uY29uY2F0KGFycmF5W1wiX2RhdGFcIl0pKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc3BsaWNlLmFwcGx5KHRoaXMsIFt0aGlzLmxlbmd0aCwgMF0uY29uY2F0KGFycmF5KSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShBcnJheVN0b3JlLnByb3RvdHlwZSwgXCJsZW5ndGhcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9kYXRhLmxlbmd0aDtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgQXJyYXlTdG9yZS5wcm90b3R5cGUuc2V0dXBTdWJTdHJlYW1zID0gZnVuY3Rpb24gKGl0ZW0sIHZhbHVlKSB7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgaWYgKGlzU3RvcmUodmFsdWUpKSB7XG4gICAgICAgICAgICB2YXIgc3Vic3RyZWFtID0gdGhpcy5fc3Vic3RyZWFtc1tUb29scy5vaWQodmFsdWUpXTtcbiAgICAgICAgICAgIGlmIChzdWJzdHJlYW0pIHtcbiAgICAgICAgICAgICAgICBzdWJzdHJlYW0udXBkYXRlcy5kaXNwb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdWJzdHJlYW0gPSB7XG4gICAgICAgICAgICAgICAgdXBkYXRlczogdmFsdWUudXBkYXRlc1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHN1YnN0cmVhbS51cGRhdGVzLmZvckVhY2goZnVuY3Rpb24gKHVwZGF0ZSkge1xuICAgICAgICAgICAgICAgIHZhciB1cGRhdGVJbmZvID0gY3JlYXRlVXBkYXRlSW5mbyh1cGRhdGUuaXRlbSwgdXBkYXRlLnZhbHVlLCB0aGF0LCB1cGRhdGUucGF0aCA/IGl0ZW0gKyBcIi5cIiArIHVwZGF0ZS5wYXRoIDogaXRlbSArIFwiLlwiICsgdXBkYXRlLml0ZW0sIGl0ZW0pO1xuICAgICAgICAgICAgICAgIHRoYXQuX3VwZGF0ZVN0cmVhbXMuZm9yRWFjaChmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbS5wdXNoKHVwZGF0ZUluZm8pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLl9zdWJzdHJlYW1zW1Rvb2xzLm9pZCh2YWx1ZSldID0gc3Vic3RyZWFtO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBDYWxsIGFmdGVyIHJlbW92YWwhXG4gICAgICogQHBhcmFtIHZhbHVlXG4gICAgICovXG4gICAgQXJyYXlTdG9yZS5wcm90b3R5cGUuZGlzcG9zZVN1YnN0cmVhbSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBpZiAoaXNTdG9yZSh2YWx1ZSkgJiYgdGhpcy5fZGF0YS5pbmRleE9mKHZhbHVlKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIHZhciBzdWJTdHJlYW0gPSB0aGlzLl9zdWJzdHJlYW1zW1Rvb2xzLm9pZCh2YWx1ZSldO1xuICAgICAgICAgICAgaWYgKHN1YlN0cmVhbSkge1xuICAgICAgICAgICAgICAgIHN1YlN0cmVhbS51cGRhdGVzLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5fc3Vic3RyZWFtc1tUb29scy5vaWQodmFsdWUpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgQXJyYXlTdG9yZS5wcm90b3R5cGUudXBkYXRlUHJvcGVydGllcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICB2YXIgaTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMuX2RhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRoYXQuc2V0dXBTdWJTdHJlYW1zKGksIHRoaXMuX2RhdGFbaV0pO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoaSA9IHRoaXMuX21heFByb3BzOyBpIDwgdGhpcy5fZGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgKGZ1bmN0aW9uIChpbmRleCkge1xuICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGF0LCBcIlwiICsgaW5kZXgsIHtcbiAgICAgICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGF0Ll9kYXRhW2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBvbGQgPSB0aGF0Ll9kYXRhW2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gb2xkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5fZGF0YVtpbmRleF0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LmRpc3Bvc2VTdWJzdHJlYW0ob2xkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnNldHVwU3ViU3RyZWFtcyhpbmRleCwgdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuX3VwZGF0ZVN0cmVhbXMuZm9yRWFjaChmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cmVhbS5wdXNoKGNyZWF0ZVVwZGF0ZUluZm8oaW5kZXgsIHRoYXQuX2RhdGFbaW5kZXhdLCB0aGF0LCBudWxsKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pKGkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX21heFByb3BzID0gdGhpcy5fZGF0YS5sZW5ndGg7XG4gICAgfTtcbiAgICBBcnJheVN0b3JlLnByb3RvdHlwZS5wdXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdmFsdWVzID0gW107XG4gICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICB2YWx1ZXNbX2kgLSAwXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5fZGF0YS5sZW5ndGg7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgdmFsdWVzLmZvckVhY2goZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGF0Ll9kYXRhLnB1c2godmFsdWUpO1xuICAgICAgICAgICAgdGhhdC5fYWRkSXRlbXNTdHJlYW1zLmZvckVhY2goZnVuY3Rpb24gKHN0cmVhbSkge1xuICAgICAgICAgICAgICAgIHN0cmVhbS5wdXNoKGNyZWF0ZVVwZGF0ZUluZm8oaW5kZXgsIHRoYXQuX2RhdGFbaW5kZXhdLCB0aGF0KSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGluZGV4Kys7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnVwZGF0ZVByb3BlcnRpZXMoKTtcbiAgICB9O1xuICAgIEFycmF5U3RvcmUucHJvdG90eXBlLnVuc2hpZnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB2YWx1ZXMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIHZhbHVlc1tfaSAtIDBdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgIHZhciBsID0gdmFsdWVzLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGwtLSkge1xuICAgICAgICAgICAgKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9kYXRhLnVuc2hpZnQodmFsdWVzWzBdKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9uZXdJdGVtU3RyZWFtcy5mb3JFYWNoKGZ1bmN0aW9uIChzdHJlYW0pIHtcbiAgICAgICAgICAgICAgICAgICAgc3RyZWFtLnB1c2goY3JlYXRlVXBkYXRlSW5mbygwLCB0aGF0Ll9kYXRhWzBdLCB0aGF0KSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KSgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudXBkYXRlUHJvcGVydGllcygpO1xuICAgIH07XG4gICAgQXJyYXlTdG9yZS5wcm90b3R5cGUucG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgciA9IHRoaXMuX2RhdGEucG9wKCk7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgdGhpcy5kaXNwb3NlU3Vic3RyZWFtKHIpO1xuICAgICAgICB0aGlzLl9yZW1vdmVJdGVtc1N0cmVhbXMuZm9yRWFjaChmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgICAgICAgICBzdHJlYW0ucHVzaChjcmVhdGVVcGRhdGVJbmZvKHRoYXQuX2RhdGEubGVuZ3RoLCBudWxsLCB0aGF0KSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcjtcbiAgICB9O1xuICAgIEFycmF5U3RvcmUucHJvdG90eXBlLnNoaWZ0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgciA9IHRoaXMuX2RhdGEuc2hpZnQoKTtcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICB0aGlzLmRpc3Bvc2VTdWJzdHJlYW0ocik7XG4gICAgICAgIHRoaXMuX3JlbW92ZUl0ZW1zU3RyZWFtcy5mb3JFYWNoKGZ1bmN0aW9uIChzdHJlYW0pIHtcbiAgICAgICAgICAgIHN0cmVhbS5wdXNoKGNyZWF0ZVVwZGF0ZUluZm8oMCwgbnVsbCwgdGhhdCkpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHI7XG4gICAgfTtcbiAgICBBcnJheVN0b3JlLnByb3RvdHlwZS5zcGxpY2UgPSBmdW5jdGlvbiAoc3RhcnQsIGRlbGV0ZUNvdW50KSB7XG4gICAgICAgIHZhciB2YWx1ZXMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgX2kgPSAyOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIHZhbHVlc1tfaSAtIDJdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmVtb3ZlZCA9IHRoaXMuX2RhdGEuc3BsaWNlLmFwcGx5KHRoaXMuX2RhdGEsIFtzdGFydCwgZGVsZXRlQ291bnRdLmNvbmNhdCh2YWx1ZXMpKTtcbiAgICAgICAgdmFyIGluZGV4ID0gc3RhcnQ7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgaWYgKHRoYXQuX3JlbW92ZUl0ZW1zU3RyZWFtcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJlbW92ZWQuZm9yRWFjaChmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICB0aGF0LmRpc3Bvc2VTdWJzdHJlYW0odmFsdWUpO1xuICAgICAgICAgICAgICAgIHRoYXQuX3JlbW92ZUl0ZW1zU3RyZWFtcy5mb3JFYWNoKGZ1bmN0aW9uIChzdHJlYW0pIHtcbiAgICAgICAgICAgICAgICAgICAgc3RyZWFtLnB1c2goY3JlYXRlVXBkYXRlSW5mbyhpbmRleCwgdmFsdWUsIHRoYXQpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpbmRleCsrO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaW5kZXggPSBzdGFydDtcbiAgICAgICAgdmFsdWVzLmZvckVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhhdC5fYWRkSXRlbXNTdHJlYW1zLmZvckVhY2goZnVuY3Rpb24gKHN0cmVhbSkge1xuICAgICAgICAgICAgICAgIHN0cmVhbS5wdXNoKGNyZWF0ZVVwZGF0ZUluZm8oaW5kZXgsIHRoYXQuX2RhdGFbaW5kZXhdLCB0aGF0KSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGluZGV4Kys7XG4gICAgICAgIH0pO1xuICAgICAgICAvKiBSZW1vdmVkLiBUaGlzIHNob3VsZCBub3QgYmUgbmVjZXNzYXJ5IGFuZCBpdCBzaW1wbGlmaWVzIHRoZSByZWFjdGl2ZSBhcnJheVxuICAgICAgICAvLyBJbmRleCBpcyBub3cgYXQgdGhlIGZpcnN0IGl0ZW0gYWZ0ZXIgdGhlIGxhc3QgaW5zZXJ0ZWQgdmFsdWUuIFNvIGlmIGRlbGV0ZUNvdW50ICE9IHZhbHVlcy5sZW5ndGhcbiAgICAgICAgLy8gdGhlIGl0ZW1zIGFmdGVyIHRoZSBpbnNlcnQvcmVtb3ZlIG1vdmVkIGFyb3VuZFxuICAgICAgICBpZiAoZGVsZXRlQ291bnQgIT09IHZhbHVlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIC8vdmFyIGRpc3RhbmNlID0gdmFsdWVzLmxlbmd0aCAtIGRlbGV0ZUNvdW50O1xuICAgICAgICAgICAgZm9yIChpbmRleDsgaW5kZXggPCB0aGlzLl9kYXRhLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgICAgICAgIHRoYXQuX3VwZGF0ZVN0cmVhbXMuZm9yRWFjaChmdW5jdGlvbihzdHJlYW0pIHtcbiAgICAgICAgICAgICAgICAgICAgc3RyZWFtLnB1c2goY3JlYXRlVXBkYXRlSW5mbzxudW1iZXI+KGluZGV4LCB0aGF0Ll9kYXRhW2luZGV4XSwgdGhhdCkpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiovXG4gICAgICAgIHRoaXMudXBkYXRlUHJvcGVydGllcygpO1xuICAgICAgICByZXR1cm4gcmVtb3ZlZDtcbiAgICB9O1xuICAgIEFycmF5U3RvcmUucHJvdG90eXBlLmluc2VydCA9IGZ1bmN0aW9uIChhdEluZGV4KSB7XG4gICAgICAgIHZhciB2YWx1ZXMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgX2kgPSAxOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIHZhbHVlc1tfaSAtIDFdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNwbGljZS5hcHBseSh0aGlzLCBbYXRJbmRleCwgMF0uY29uY2F0KHZhbHVlcykpO1xuICAgIH07XG4gICAgQXJyYXlTdG9yZS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gKGF0SW5kZXgsIGNvdW50KSB7XG4gICAgICAgIGlmIChjb3VudCA9PT0gdm9pZCAwKSB7IGNvdW50ID0gMTsgfVxuICAgICAgICByZXR1cm4gdGhpcy5zcGxpY2UoYXRJbmRleCwgY291bnQpO1xuICAgIH07XG4gICAgQXJyYXlTdG9yZS5wcm90b3R5cGUuZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoaXNTdG9yZSh0aGlzW2ldKSkge1xuICAgICAgICAgICAgICAgIHRoaXNbaV0uZGlzcG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVsZXRlIHRoaXNbaV07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fZGF0YSA9IG51bGw7XG4gICAgICAgIF9zdXBlci5wcm90b3R5cGUuZGlzcG9zZS5jYWxsKHRoaXMpO1xuICAgIH07XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEFycmF5U3RvcmUucHJvdG90eXBlLCBcImltbXV0YWJsZVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9pbW11dGFibGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9pbW11dGFibGUgPSBuZXcgSW1tdXRhYmxlQXJyYXkodGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faW1tdXRhYmxlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBBcnJheVN0b3JlLnByb3RvdHlwZS5pdGVtID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHZhciBpID0gdGhpcy5pbmRleE9mKHZhbHVlKTtcbiAgICAgICAgaWYgKGkgIT09IC0xKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpc1tpXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9O1xuICAgIHJldHVybiBBcnJheVN0b3JlO1xufSkoU3RvcmUpO1xudmFyIEltbXV0YWJsZUFycmF5ID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoSW1tdXRhYmxlQXJyYXksIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gSW1tdXRhYmxlQXJyYXkoX3BhcmVudCkge1xuICAgICAgICBfc3VwZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgdGhpcy5fcGFyZW50ID0gX3BhcmVudDtcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICBfcGFyZW50Lm5ld0l0ZW1zLmZvckVhY2goZnVuY3Rpb24gKHVwZGF0ZSkge1xuICAgICAgICAgICAgdGhhdC51cGRhdGVQcm9wZXJ0aWVzKCk7XG4gICAgICAgIH0pLnVudGlsKF9wYXJlbnQuaXNEaXNwb3NpbmcpO1xuICAgICAgICAvLyBXZSBkbyBub3RoaW5nIHdoZW4gcmVtb3ZpbmcgaXRlbXMuIFRoZSBnZXR0ZXIgd2lsbCByZXR1cm4gdW5kZWZpbmVkLlxuICAgICAgICAvKlxuICAgICAgICBfYXJyYXkucmVtb3ZlZEl0ZW1zKCkuZm9yRWFjaChmdW5jdGlvbih1cGRhdGUpIHtcblxuICAgICAgICB9KS51bnRpbChfYXJyYXkuZGlzcG9zaW5nKCkpO1xuICAgICAgICAqL1xuICAgICAgICB0aGlzLl9tYXhQcm9wcyA9IDA7XG4gICAgICAgIHRoaXMudXBkYXRlUHJvcGVydGllcygpO1xuICAgIH1cbiAgICBJbW11dGFibGVBcnJheS5wcm90b3R5cGUudXBkYXRlUHJvcGVydGllcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICB2YXIgaTtcbiAgICAgICAgZm9yIChpID0gdGhpcy5fbWF4UHJvcHM7IGkgPCB0aGlzLl9wYXJlbnQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIChmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhhdCwgXCJcIiArIGluZGV4LCB7XG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNTdG9yZSh0aGF0Ll9wYXJlbnRbaW5kZXhdKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGF0Ll9wYXJlbnRbaW5kZXhdLmltbXV0YWJsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGF0Ll9wYXJlbnRbaW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KShpKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9tYXhQcm9wcyA9IHRoaXMuX3BhcmVudC5sZW5ndGg7XG4gICAgfTtcbiAgICBJbW11dGFibGVBcnJheS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wYXJlbnQudG9TdHJpbmcoKTtcbiAgICB9O1xuICAgIEltbXV0YWJsZUFycmF5LnByb3RvdHlwZS50b0xvY2FsZVN0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudC50b1N0cmluZygpO1xuICAgIH07XG4gICAgSW1tdXRhYmxlQXJyYXkucHJvdG90eXBlLmZvckVhY2ggPSBmdW5jdGlvbiAoY2FsbGJhY2tmbiwgdGhpc0FyZykge1xuICAgICAgICByZXR1cm4gdGhpcy5fcGFyZW50LmZvckVhY2goY2FsbGJhY2tmbik7XG4gICAgfTtcbiAgICBJbW11dGFibGVBcnJheS5wcm90b3R5cGUuZXZlcnkgPSBmdW5jdGlvbiAoY2FsbGJhY2tmbiwgdGhpc0FyZykge1xuICAgICAgICByZXR1cm4gdGhpcy5fcGFyZW50LmV2ZXJ5KGNhbGxiYWNrZm4pO1xuICAgIH07XG4gICAgSW1tdXRhYmxlQXJyYXkucHJvdG90eXBlLnNvbWUgPSBmdW5jdGlvbiAoY2FsbGJhY2tmbiwgdGhpc0FyZykge1xuICAgICAgICByZXR1cm4gdGhpcy5fcGFyZW50LmZvckVhY2goY2FsbGJhY2tmbik7XG4gICAgfTtcbiAgICBJbW11dGFibGVBcnJheS5wcm90b3R5cGUuaW5kZXhPZiA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcGFyZW50LmluZGV4T2YodmFsdWUpO1xuICAgIH07XG4gICAgSW1tdXRhYmxlQXJyYXkucHJvdG90eXBlLmxhc3RJbmRleE9mID0gZnVuY3Rpb24gKHNlYXJjaEVsZW1lbnQsIGZyb21JbmRleCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcGFyZW50Lmxhc3RJbmRleE9mKHNlYXJjaEVsZW1lbnQsIGZyb21JbmRleCk7XG4gICAgfTtcbiAgICBJbW11dGFibGVBcnJheS5wcm90b3R5cGUuam9pbiA9IGZ1bmN0aW9uIChzZXBhcmF0b3IpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudC5qb2luKHNlcGFyYXRvcik7XG4gICAgfTtcbiAgICBJbW11dGFibGVBcnJheS5wcm90b3R5cGUubWFwID0gZnVuY3Rpb24gKGNhbGxiYWNrZm4sIHRoaXNBcmcpIHtcbiAgICAgICAgLy9UaGlzIGlzIGRpcnR5IGJ1dCBhbnl0aGluZyBlbHNlIHdvdWxkIGJlIGlucGVyZm9ybWFudCBqdXN0IGJlY2F1c2UgdHlwZXNjcmlwdCBkb2VzIG5vdCBoYXZlIHByb3RlY3RlZCBzY29wZVxuICAgICAgICByZXR1cm4gdGhpcy5fcGFyZW50W1wiX2RhdGFcIl0ubWFwKGNhbGxiYWNrZm4pO1xuICAgIH07XG4gICAgSW1tdXRhYmxlQXJyYXkucHJvdG90eXBlLmZpbHRlciA9IGZ1bmN0aW9uIChjYWxsYmFja2ZuLCB0aGlzQXJnKSB7XG4gICAgICAgIC8vVGhpcyBpcyBkaXJ0eSBidXQgYW55dGhpbmcgZWxzZSB3b3VsZCBiZSBpbnBlcmZvcm1hbnQganVzdCBiZWNhdXNlIHR5cGVzY3JpcHQgZG9lcyBub3QgaGF2ZSBwcm90ZWN0ZWQgc2NvcGVcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudFtcIl9kYXRhXCJdLmZpbHRlcihjYWxsYmFja2ZuKTtcbiAgICB9O1xuICAgIEltbXV0YWJsZUFycmF5LnByb3RvdHlwZS5yZWR1Y2UgPSBmdW5jdGlvbiAoY2FsbGJhY2tmbiwgaW5pdGlhbFZhbHVlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wYXJlbnQucmVkdWNlKGNhbGxiYWNrZm4sIGluaXRpYWxWYWx1ZSk7XG4gICAgfTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoSW1tdXRhYmxlQXJyYXkucHJvdG90eXBlLCBcImxlbmd0aFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudC5sZW5ndGg7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIEltbXV0YWJsZUFycmF5LnByb3RvdHlwZS5zdWJzY3JpYmVQYXJlbnRTdHJlYW0gPSBmdW5jdGlvbiAocGFyZW50U3RyZWFtKSB7XG4gICAgICAgIHZhciBzdHJlYW0gPSBTdHJlYW0uY3JlYXRlU3RyZWFtKCk7XG4gICAgICAgIHBhcmVudFN0cmVhbS5mb3JFYWNoKGZ1bmN0aW9uICh1cGRhdGUpIHtcbiAgICAgICAgICAgIHN0cmVhbS5wdXNoKHVwZGF0ZSk7XG4gICAgICAgIH0pLnVudGlsKHRoaXMuX3BhcmVudC5pc0Rpc3Bvc2luZyk7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgdGhpcy5fdXBkYXRlU3RyZWFtcy5wdXNoKHN0cmVhbSk7XG4gICAgICAgIHN0cmVhbS5vbkNsb3NlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoYXQucmVtb3ZlU3RyZWFtKHRoYXQuX3VwZGF0ZVN0cmVhbXMsIHN0cmVhbSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gc3RyZWFtO1xuICAgIH07XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEltbXV0YWJsZUFycmF5LnByb3RvdHlwZSwgXCJ1cGRhdGVzXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zdWJzY3JpYmVQYXJlbnRTdHJlYW0odGhpcy5fcGFyZW50LnVwZGF0ZXMpO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoSW1tdXRhYmxlQXJyYXkucHJvdG90eXBlLCBcIm5ld0l0ZW1zXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zdWJzY3JpYmVQYXJlbnRTdHJlYW0odGhpcy5fcGFyZW50Lm5ld0l0ZW1zKTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEltbXV0YWJsZUFycmF5LnByb3RvdHlwZSwgXCJyZW1vdmVkSXRlbXNcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnN1YnNjcmliZVBhcmVudFN0cmVhbSh0aGlzLl9wYXJlbnQucmVtb3ZlZEl0ZW1zKTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEltbXV0YWJsZUFycmF5LnByb3RvdHlwZSwgXCJkaXNwb3NpbmdcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnN1YnNjcmliZVBhcmVudFN0cmVhbSh0aGlzLl9wYXJlbnQuaXNEaXNwb3NpbmcpO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoSW1tdXRhYmxlQXJyYXkucHJvdG90eXBlLCBcImltbXV0YWJsZVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIHJldHVybiBJbW11dGFibGVBcnJheTtcbn0pKEltbXV0YWJsZVN0b3JlKTtcbi8qKlxuICogQ3JlYXRlIGFuIGFycmF5IHN0b3JlLiBJZiBhbiBpbml0aWFsIHZhbHVlIGlzIHByb3ZpZGVkIGl0IHdpbGwgaW5pdGlhbGl6ZSB0aGUgYXJyYXlcbiAqIHdpdGggaXQuIFRoZSBpbml0aWFsIHZhbHVlIGNhbiBiZSBhIEphdmFTY3JpcHQgYXJyYXkgb2YgZWl0aGVyIHNpbXBsZSB2YWx1ZXMgb3IgcGxhaW4gb2JqZWN0cy5cbiAqIEl0IHRoZSBhcnJheSBoYXMgcGxhaW4gb2JqZWN0cyBhIG5lc3RlZCBzdG9yZSB3aWxsIGJlIGNyZWF0ZWQuXG4gKiBAcGFyYW0gaW5pdGlhbFxuICogQHJldHVybnMgeyp9XG4gKi9cbmZ1bmN0aW9uIGFycmF5KGluaXRpYWwpIHtcbiAgICBpZiAoaW5pdGlhbCkge1xuICAgICAgICByZXR1cm4gYnVpbGREZWVwKGluaXRpYWwpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG5ldyBBcnJheVN0b3JlKCk7XG4gICAgfVxufVxuZXhwb3J0cy5hcnJheSA9IGFycmF5O1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1zdG9yZS5qcy5tYXAiLCIvKipcbiAqIENyZWF0ZWQgYnkgU3RlcGhhbiBvbiAyNy4xMi4yMDE0LlxuICpcbiAqIEEgc2ltcGxlIGltcGxlbWVudGF0aW9uIG9mIGEgY29sbGVjdGlvbiBzdHJlYW0gdGhhdCBzdXBwb3J0cyByZWFjdGl2ZSBwYXR0ZXJucy5cbiAqXG4gKi9cblwidXNlIHN0cmljdFwiO1xuLyoqXG4gKiBCYXNlIGltcGxlbWVudGF0aW9uIG9mIHRoZSBjb2xsZWN0aW9uIHN0cmVhbVxuICovXG52YXIgU3RyZWFtID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTdHJlYW0oX25hbWUpIHtcbiAgICAgICAgdGhpcy5fbmFtZSA9IF9uYW1lO1xuICAgICAgICB0aGlzLl9idWZmZXIgPSBbXTtcbiAgICAgICAgdGhpcy5fbWV0aG9kcyA9IFtdO1xuICAgICAgICB0aGlzLl9lcnJvck1ldGhvZHMgPSBbXTtcbiAgICAgICAgdGhpcy5fY2xvc2VNZXRob2RzID0gW107XG4gICAgICAgIHRoaXMuX2Nsb3NlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9sZW5ndGggPSAwO1xuICAgICAgICB0aGlzLl9tYXhMZW5ndGggPSAwO1xuICAgICAgICB0aGlzLl9uZXh0U3RyZWFtcyA9IFtdO1xuICAgIH1cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU3RyZWFtLnByb3RvdHlwZSwgXCJuYW1lXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbmFtZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFN0cmVhbS5wcm90b3R5cGUsIFwibGVuZ3RoXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbGVuZ3RoO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBTdHJlYW0ucHJvdG90eXBlLmNhbGxDbG9zZU1ldGhvZHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgdGhpcy5fY2xvc2VNZXRob2RzLmZvckVhY2goZnVuY3Rpb24gKG0pIHtcbiAgICAgICAgICAgIG0uY2FsbCh0aGF0KTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBTdHJlYW0ucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXRoaXMuX2Nsb3NlZCkge1xuICAgICAgICAgICAgdGhpcy5fY2xvc2VkID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuY2FsbENsb3NlTWV0aG9kcygpO1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NlKCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFN0cmVhbS5wcm90b3R5cGUuZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICB0aGlzLl9tZXRob2RzID0gW107XG4gICAgICAgIHRoaXMuX2J1ZmZlciA9IFtdO1xuICAgICAgICB0aGlzLl9jbG9zZU1ldGhvZHMgPSBbXTtcbiAgICAgICAgdGhpcy5fZXJyb3JNZXRob2RzID0gW107XG4gICAgfTtcbiAgICBTdHJlYW0ucHJvdG90eXBlLnRpbWVzID0gZnVuY3Rpb24gKG1heExlbmd0aCkge1xuICAgICAgICB0aGlzLl9tYXhMZW5ndGggPSBtYXhMZW5ndGg7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgU3RyZWFtLnByb3RvdHlwZS51bnRpbCA9IGZ1bmN0aW9uIChzdHJlYW0pIHtcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICBpZiAoc3RyZWFtKSB7XG4gICAgICAgICAgICBzdHJlYW0uZm9yRWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhhdC5jbG9zZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU3RyZWFtLnByb3RvdHlwZSwgXCJjbG9zZWRcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jbG9zZWQ7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIFN0cmVhbS5wcm90b3R5cGUuYWRkVG9CdWZmZXIgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdGhpcy5fYnVmZmVyLnVuc2hpZnQodmFsdWUpO1xuICAgIH07XG4gICAgU3RyZWFtLnByb3RvdHlwZS5wcm9jZXNzQnVmZmVyID0gZnVuY3Rpb24gKGJ1ZmZlciwgbWV0aG9kcywgYmFzZUluZGV4KSB7XG4gICAgICAgIGlmICh0aGlzLl9jbG9zZWQpXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgaWYgKCFtZXRob2RzLmxlbmd0aClcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB2YXIgbCA9IGJ1ZmZlci5sZW5ndGg7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgdmFyIGVycm9ycyA9IFtdO1xuICAgICAgICB3aGlsZSAobC0tKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBidWZmZXIucG9wKCk7XG4gICAgICAgICAgICBtZXRob2RzLmZvckVhY2goZnVuY3Rpb24gKG0sIGkpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBtLmNhbGwodGhhdCwgdmFsdWUsIGkgKyBiYXNlSW5kZXgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBlcnJvcnMucHVzaChlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZXJyb3JzO1xuICAgIH07XG4gICAgU3RyZWFtLnByb3RvdHlwZS5wcm9jZXNzQnVmZmVycyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGVycm9ycyA9IHRoaXMucHJvY2Vzc0J1ZmZlcih0aGlzLl9idWZmZXIsIHRoaXMuX21ldGhvZHMsIHRoaXMuX2xlbmd0aCAtIHRoaXMuX2J1ZmZlci5sZW5ndGgpO1xuICAgICAgICBpZiAoZXJyb3JzICYmIGVycm9ycy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9lcnJvck1ldGhvZHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcm9jZXNzQnVmZmVyKGVycm9ycywgdGhpcy5fZXJyb3JNZXRob2RzLCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGVycm9ycy5mb3JFYWNoKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFN0cmVhbS5wcm90b3R5cGUuYWRkTWV0aG9kID0gZnVuY3Rpb24gKG1ldGhvZCkge1xuICAgICAgICB2YXIgZmlyc3RNZXRob2QgPSB0aGlzLl9tZXRob2RzLmxlbmd0aCA9PT0gMDtcbiAgICAgICAgdGhpcy5fbWV0aG9kcy5wdXNoKG1ldGhvZCk7XG4gICAgICAgIGlmIChmaXJzdE1ldGhvZCkge1xuICAgICAgICAgICAgdGhpcy5wcm9jZXNzQnVmZmVycygpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBTdHJlYW0ucHJvdG90eXBlLnJlbW92ZU1ldGhvZCA9IGZ1bmN0aW9uIChtZXRob2QpIHtcbiAgICAgICAgdGhpcy5fbWV0aG9kcy5pbmRleE9mKG1ldGhvZCk7XG4gICAgfTtcbiAgICBTdHJlYW0ucHJvdG90eXBlLmFkZEVycm9yTWV0aG9kID0gZnVuY3Rpb24gKG1ldGhvZCkge1xuICAgICAgICB0aGlzLl9lcnJvck1ldGhvZHMucHVzaChtZXRob2QpO1xuICAgIH07XG4gICAgU3RyZWFtLnByb3RvdHlwZS5hZGRDbG9zZU1ldGhvZCA9IGZ1bmN0aW9uIChtZXRob2QpIHtcbiAgICAgICAgaWYgKHRoaXMuY2xvc2VkKSB7XG4gICAgICAgICAgICBtZXRob2QuY2FsbCh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2Nsb3NlTWV0aG9kcy5wdXNoKG1ldGhvZCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFN0cmVhbS5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBpZiAoIXRoaXMuX2Nsb3NlZCkge1xuICAgICAgICAgICAgdGhpcy5hZGRUb0J1ZmZlcih2YWx1ZSk7XG4gICAgICAgICAgICB0aGlzLl9sZW5ndGgrKztcbiAgICAgICAgICAgIHRoaXMucHJvY2Vzc0J1ZmZlcnMoKTtcbiAgICAgICAgICAgIGlmICh0aGlzLl9sZW5ndGggPT09IHRoaXMuX21heExlbmd0aCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgU3RyZWFtLnByb3RvdHlwZS5wdXNoRXJyb3IgPSBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgLy8gSWYgd2UgY2FuJ3QgaGFuZGxlIHRoZSBlcnJvciBvdXJzZWx2ZXMgd2UgdGhyb3cgaXQgYWdhaW4uIFRoYXQgd2lsbCBnaXZlIHByZWNlZGluZyBzdHJlYW1zIHRoZSBjaGFuY2UgdG8gaGFuZGxlIHRoZXNlXG4gICAgICAgIGlmICghdGhpcy5fZXJyb3JNZXRob2RzIHx8ICF0aGlzLl9lcnJvck1ldGhvZHMubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnByb2Nlc3NCdWZmZXIoW2Vycm9yXSwgdGhpcy5fZXJyb3JNZXRob2RzLCAwKTtcbiAgICB9O1xuICAgIFN0cmVhbS5wcm90b3R5cGUuZm9yRWFjaCA9IGZ1bmN0aW9uIChtZXRob2QpIHtcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobWV0aG9kKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBTdHJlYW0ucHJvdG90eXBlLnJlZ2lzdGVyTmV4dFN0cmVhbSA9IGZ1bmN0aW9uIChuZXh0U3RyZWFtKSB7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgdGhpcy5fbmV4dFN0cmVhbXMucHVzaChuZXh0U3RyZWFtKTtcbiAgICAgICAgbmV4dFN0cmVhbS5vbkNsb3NlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBpID0gdGhhdC5fbmV4dFN0cmVhbXMuaW5kZXhPZihuZXh0U3RyZWFtKTtcbiAgICAgICAgICAgIGlmIChpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHRoYXQuX25leHRTdHJlYW1zLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICBpZiAoIXRoYXQuX25leHRTdHJlYW1zLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICB0aGF0LmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuICAgIFN0cmVhbS5wcm90b3R5cGUuYWRkTWV0aG9kVG9OZXh0U3RyZWFtID0gZnVuY3Rpb24gKG5leHRTdHJlYW0sIG1ldGhvZCwgb25DbG9zZSkge1xuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgIHZhciBmbiA9IGZ1bmN0aW9uICh2YWx1ZSwgaW5kZXgpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgbWV0aG9kLmNhbGwodGhhdCwgdmFsdWUsIGluZGV4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5wdXNoRXJyb3IoZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKGZuKTtcbiAgICAgICAgbmV4dFN0cmVhbS5vbkNsb3NlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoYXQucmVtb3ZlTWV0aG9kKGZuKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMucmVnaXN0ZXJOZXh0U3RyZWFtKG5leHRTdHJlYW0pO1xuICAgICAgICBpZiAoIW9uQ2xvc2UpIHtcbiAgICAgICAgICAgIHRoaXMub25DbG9zZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5jbG9zZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLm9uQ2xvc2Uob25DbG9zZSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFN0cmVhbS5wcm90b3R5cGUuZmlsdGVyID0gZnVuY3Rpb24gKG1ldGhvZCkge1xuICAgICAgICB2YXIgbmV4dFN0cmVhbSA9IG5ldyBTdHJlYW0odGhpcy5fbmFtZSArIFwiLmZpbHRlclwiKTtcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICBpZiAodHlwZW9mIG1ldGhvZCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aGlzLmFkZE1ldGhvZFRvTmV4dFN0cmVhbShuZXh0U3RyZWFtLCBmdW5jdGlvbiAodmFsdWUsIGluZGV4KSB7XG4gICAgICAgICAgICAgICAgaWYgKG1ldGhvZC5jYWxsKHRoYXQsIHZhbHVlLCBpbmRleCkpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5wdXNoKHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuYWRkTWV0aG9kVG9OZXh0U3RyZWFtKG5leHRTdHJlYW0sIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIGlmIChtZXRob2QgPT0gdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5wdXNoKHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fY2xvc2VkKSB7XG4gICAgICAgICAgICBuZXh0U3RyZWFtLmNsb3NlKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5leHRTdHJlYW07XG4gICAgfTtcbiAgICBTdHJlYW0ucHJvdG90eXBlLm1hcCA9IGZ1bmN0aW9uIChtZXRob2QpIHtcbiAgICAgICAgdmFyIG5leHRTdHJlYW0gPSBuZXcgU3RyZWFtKHRoaXMuX25hbWUgKyBcIi5tYXBcIik7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgaWYgKHR5cGVvZiBtZXRob2QgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhpcy5hZGRNZXRob2RUb05leHRTdHJlYW0obmV4dFN0cmVhbSwgZnVuY3Rpb24gKHZhbHVlLCBpbmRleCkge1xuICAgICAgICAgICAgICAgIG5leHRTdHJlYW0ucHVzaChtZXRob2QuY2FsbCh0aGF0LCB2YWx1ZSwgaW5kZXgpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5hZGRNZXRob2RUb05leHRTdHJlYW0obmV4dFN0cmVhbSwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5wdXNoKG1ldGhvZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fY2xvc2VkKSB7XG4gICAgICAgICAgICBuZXh0U3RyZWFtLmNsb3NlKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5leHRTdHJlYW07XG4gICAgfTtcbiAgICBTdHJlYW0ucHJvdG90eXBlLnNjYW4gPSBmdW5jdGlvbiAobWV0aG9kLCBzZWVkKSB7XG4gICAgICAgIHZhciBuZXh0U3RyZWFtID0gbmV3IFN0cmVhbSh0aGlzLl9uYW1lICsgXCIuc2NhblwiKTtcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICB2YXIgc2Nhbm5lZCA9IHNlZWQ7XG4gICAgICAgIHRoaXMuYWRkTWV0aG9kVG9OZXh0U3RyZWFtKG5leHRTdHJlYW0sIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgc2Nhbm5lZCA9IG1ldGhvZC5jYWxsKHRoYXQsIHNjYW5uZWQsIHZhbHVlKTtcbiAgICAgICAgICAgIG5leHRTdHJlYW0ucHVzaChzY2FubmVkKTtcbiAgICAgICAgfSk7XG4gICAgICAgIG5leHRTdHJlYW0ucHVzaChzY2FubmVkKTtcbiAgICAgICAgaWYgKHRoaXMuX2Nsb3NlZCkge1xuICAgICAgICAgICAgbmV4dFN0cmVhbS5jbG9zZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXh0U3RyZWFtO1xuICAgIH07XG4gICAgU3RyZWFtLnByb3RvdHlwZS5yZWR1Y2UgPSBmdW5jdGlvbiAobWV0aG9kLCBzZWVkKSB7XG4gICAgICAgIHZhciBuZXh0U3RyZWFtID0gbmV3IFN0cmVhbSh0aGlzLl9uYW1lICsgXCIucmVkdWNlXCIpO1xuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgIHZhciByZWR1Y2VkID0gc2VlZDtcbiAgICAgICAgdGhpcy5hZGRNZXRob2RUb05leHRTdHJlYW0obmV4dFN0cmVhbSwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICByZWR1Y2VkID0gbWV0aG9kLmNhbGwodGhhdCwgcmVkdWNlZCwgdmFsdWUpO1xuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBuZXh0U3RyZWFtLnB1c2gocmVkdWNlZCk7XG4gICAgICAgICAgICBuZXh0U3RyZWFtLmNsb3NlKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAodGhpcy5fY2xvc2VkKSB7XG4gICAgICAgICAgICBuZXh0U3RyZWFtLmNsb3NlKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yZWdpc3Rlck5leHRTdHJlYW0obmV4dFN0cmVhbSk7XG4gICAgICAgIHJldHVybiBuZXh0U3RyZWFtO1xuICAgIH07XG4gICAgU3RyZWFtLnByb3RvdHlwZS5jb25jYXQgPSBmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgICAgIHZhciBuZXh0U3RyZWFtID0gbmV3IFN0cmVhbSh0aGlzLl9uYW1lICsgXCIuY29uY2F0XCIpO1xuICAgICAgICB2YXIgYnVmZmVyID0gbnVsbDtcbiAgICAgICAgLy8gV2hlbiB0aGlzIGlzIGFscmVhZHkgY2xvc2VkLCB3ZSBvbmx5IGNhcmUgZm9yIHRoZSBvdGhlciBzdHJlYW1cbiAgICAgICAgaWYgKCF0aGlzLl9jbG9zZWQpIHtcbiAgICAgICAgICAgIGJ1ZmZlciA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKHN0cmVhbS5jbG9zZWQpIHtcbiAgICAgICAgICAgICAgICBuZXh0U3RyZWFtLmNsb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gV2UgbmVlZCB0byBidWZmZXIsIGJlY2F1c2UgdGhpcyBtYXkgbm90IGJlIHRoZSBmaXJzdFxuICAgICAgICAvLyBtZXRob2QgYXR0YWNoZWQgdG8gdGhlIHN0cmVhbS4gT3RoZXJ3aXNlIGFueSBkYXRhIHRoYXRcbiAgICAgICAgLy8gaXMgcHVzaGVkIHRvIHN0cmVhbSBiZWZvcmUgdGhlIG9yaWdpbmFsIGlzIGNsb3NlZCB3b3VsZFxuICAgICAgICAvLyBiZSBsb3N0IGZvciB0aGUgY29uY2F0LlxuICAgICAgICBzdHJlYW0uZm9yRWFjaChmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIGlmIChidWZmZXIpIHtcbiAgICAgICAgICAgICAgICBidWZmZXIucHVzaCh2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBuZXh0U3RyZWFtLnB1c2godmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgc3RyZWFtLm9uQ2xvc2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKCFidWZmZXIpIHtcbiAgICAgICAgICAgICAgICBuZXh0U3RyZWFtLmNsb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmFkZE1ldGhvZFRvTmV4dFN0cmVhbShuZXh0U3RyZWFtLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIG5leHRTdHJlYW0ucHVzaCh2YWx1ZSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChidWZmZXIpIHtcbiAgICAgICAgICAgICAgICBidWZmZXIuZm9yRWFjaChmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5wdXNoKHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzdHJlYW0uY2xvc2VkKSB7XG4gICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5jbG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnVmZmVyID0gbnVsbDtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICh0aGlzLl9jbG9zZWQgJiYgc3RyZWFtLmNsb3NlZCkge1xuICAgICAgICAgICAgbmV4dFN0cmVhbS5jbG9zZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXh0U3RyZWFtO1xuICAgIH07XG4gICAgU3RyZWFtLnByb3RvdHlwZS5jb25jYXRBbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBuZXh0U3RyZWFtID0gbmV3IFN0cmVhbSh0aGlzLl9uYW1lICsgXCIuY29uY2F0QWxsXCIpO1xuICAgICAgICB2YXIgcXVldWUgPSBbXTtcbiAgICAgICAgdmFyIGN1cnNvciA9IG51bGw7XG4gICAgICAgIGZ1bmN0aW9uIG5leHRJblF1ZXVlKCkge1xuICAgICAgICAgICAgdmFyIGwgPSBxdWV1ZS5sZW5ndGg7XG4gICAgICAgICAgICB3aGlsZSAobC0tKSB7XG4gICAgICAgICAgICAgICAgY3Vyc29yID0gcXVldWVbbF07XG4gICAgICAgICAgICAgICAgdXBkYXRlKCk7XG4gICAgICAgICAgICAgICAgaWYgKGN1cnNvci5kb25lKSB7XG4gICAgICAgICAgICAgICAgICAgIHF1ZXVlLnBvcCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlKCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiB1cGRhdGUoKSB7XG4gICAgICAgICAgICBpZiAoY3Vyc29yKSB7XG4gICAgICAgICAgICAgICAgdmFyIGwgPSBjdXJzb3IuZGF0YS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgd2hpbGUgKGwtLSkge1xuICAgICAgICAgICAgICAgICAgICBuZXh0U3RyZWFtLnB1c2goY3Vyc29yLmRhdGEucG9wKCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBjb25jYXRTdHJlYW0oc3RyZWFtKSB7XG4gICAgICAgICAgICB2YXIgc3ViQnVmZmVyID0ge1xuICAgICAgICAgICAgICAgIGRhdGE6IFtdLFxuICAgICAgICAgICAgICAgIGRvbmU6IGZhbHNlXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcXVldWUudW5zaGlmdChzdWJCdWZmZXIpO1xuICAgICAgICAgICAgc3RyZWFtLmZvckVhY2goZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgc3ViQnVmZmVyLmRhdGEudW5zaGlmdCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgdXBkYXRlKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHN0cmVhbS5vbkNsb3NlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBzdWJCdWZmZXIuZG9uZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgbmV4dEluUXVldWUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIGN1cnNvciA9IHN1YkJ1ZmZlcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLmZvckVhY2goZnVuY3Rpb24gKHN1YlN0cmVhbSkge1xuICAgICAgICAgICAgY29uY2F0U3RyZWFtKHN1YlN0cmVhbSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLm9uQ2xvc2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbmV4dFN0cmVhbS5jbG9zZSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHRoaXMuX2Nsb3NlZCkge1xuICAgICAgICAgICAgbmV4dFN0cmVhbS5jbG9zZSgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucmVnaXN0ZXJOZXh0U3RyZWFtKG5leHRTdHJlYW0pO1xuICAgICAgICByZXR1cm4gbmV4dFN0cmVhbTtcbiAgICB9O1xuICAgIFN0cmVhbS5wcm90b3R5cGUuY29tYmluZSA9IGZ1bmN0aW9uIChzdHJlYW0pIHtcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICB2YXIgbmV4dFN0cmVhbSA9IG5ldyBTdHJlYW0odGhpcy5fbmFtZSArIFwiLmNvbWJpbmVcIik7XG4gICAgICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIG5leHRTdHJlYW0ucHVzaCh2YWx1ZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBzdHJlYW0uZm9yRWFjaChmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIG5leHRTdHJlYW0ucHVzaCh2YWx1ZSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLm9uQ2xvc2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHN0cmVhbS5jbG9zZWQpIHtcbiAgICAgICAgICAgICAgICBuZXh0U3RyZWFtLmNsb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBzdHJlYW0ub25DbG9zZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAodGhhdC5fY2xvc2VkKSB7XG4gICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5jbG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHRoaXMuX2Nsb3NlZCAmJiBzdHJlYW0uY2xvc2VkKSB7XG4gICAgICAgICAgICBuZXh0U3RyZWFtLmNsb3NlKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yZWdpc3Rlck5leHRTdHJlYW0obmV4dFN0cmVhbSk7XG4gICAgICAgIHJldHVybiBuZXh0U3RyZWFtO1xuICAgIH07XG4gICAgU3RyZWFtLnByb3RvdHlwZS5vbkNsb3NlID0gZnVuY3Rpb24gKG1ldGhvZCkge1xuICAgICAgICB0aGlzLmFkZENsb3NlTWV0aG9kKG1ldGhvZCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgU3RyZWFtLnByb3RvdHlwZS5vbkVycm9yID0gZnVuY3Rpb24gKG1ldGhvZCkge1xuICAgICAgICB0aGlzLmFkZEVycm9yTWV0aG9kKG1ldGhvZCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgcmV0dXJuIFN0cmVhbTtcbn0pKCk7XG5leHBvcnRzLlN0cmVhbSA9IFN0cmVhbTtcbi8qKlxuICogQ3JlYXRlIGEgbmV3IHN0cmVhbS4gVGhlIG5hbWUgaXMgbW9zdGx5IGZvciBkZWJ1Z2dpbmcgcHVycG9zZXMgYW5kIGNhbiBiZSBvbWl0dGVkLiBJdCBkZWZhdWx0cyB0byAnc3RyZWFtJyB0aGVuLlxuICogQHBhcmFtIG5hbWVcbiAqIEByZXR1cm5zIHtTdHJlYW19XG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVN0cmVhbShuYW1lKSB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW0obmFtZSB8fCBcInN0cmVhbVwiKTtcbn1cbmV4cG9ydHMuY3JlYXRlU3RyZWFtID0gY3JlYXRlU3RyZWFtO1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1zdHJlYW0uanMubWFwIiwiLyoqXG4gKiBDcmVhdGVkIGJ5IFN0ZXBoYW4uU21vbGEgb24gMzAuMTAuMjAxNC5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG4vKipcbiAqIERldGVybWluZSB0aGUgc2NyZWVuIHBvc2l0aW9uIGFuZCBzaXplIG9mIGFuIGVsZW1lbnQgaW4gdGhlIERPTVxuICogQHBhcmFtIGVsZW1lbnRcbiAqIEByZXR1cm5zIHt7eDogbnVtYmVyLCB5OiBudW1iZXIsIHc6IG51bWJlciwgaDogbnVtYmVyfX1cbiAqL1xuZnVuY3Rpb24gZWxlbWVudFBvc2l0aW9uQW5kU2l6ZShlbGVtZW50KSB7XG4gICAgdmFyIHJlY3QgPSBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIHJldHVybiB7IHg6IHJlY3QubGVmdCwgeTogcmVjdC50b3AsIHc6IHJlY3Qud2lkdGgsIGg6IHJlY3QuaGVpZ2h0IH07XG59XG5leHBvcnRzLmVsZW1lbnRQb3NpdGlvbkFuZFNpemUgPSBlbGVtZW50UG9zaXRpb25BbmRTaXplO1xudmFyIHBmeCA9IFtcbiAgICB7IGlkOiBcIndlYmtpdFwiLCBjYW1lbENhc2U6IHRydWUgfSxcbiAgICB7IGlkOiBcIk1TXCIsIGNhbWVsQ2FzZTogdHJ1ZSB9LFxuICAgIHsgaWQ6IFwib1wiLCBjYW1lbENhc2U6IHRydWUgfSxcbiAgICB7IGlkOiBcIlwiLCBjYW1lbENhc2U6IGZhbHNlIH1cbl07XG4vKipcbiAqIEFkZCBldmVudCBsaXN0ZW5lciBmb3IgcHJlZml4ZWQgZXZlbnRzLiBBcyB0aGUgY2FtZWwgY2FzaW5nIG9mIHRoZSBldmVudCBsaXN0ZW5lcnMgaXMgZGlmZmVyZW50XG4gKiBhY3Jvc3MgYnJvd3NlcnMgeW91IG5lZWQgdG8gc3BlY2lmaXkgdGhlIHR5cGUgY2FtZWxjYXNlZCBzdGFydGluZyB3aXRoIGEgY2FwaXRhbCBsZXR0ZXIuIFRoZSBmdW5jdGlvblxuICogdGhlbiB0YWtlcyBjYXJlIG9mIHRoZSBicm93c2VyIHNwZWNpZmljcy5cbiAqXG4gKiBAcGFyYW0gZWxlbWVudFxuICogQHBhcmFtIHR5cGVcbiAqIEBwYXJhbSBjYWxsYmFja1xuICovXG5mdW5jdGlvbiBhZGRQcmVmaXhlZEV2ZW50TGlzdGVuZXIoZWxlbWVudCwgdHlwZSwgY2FsbGJhY2spIHtcbiAgICBmb3IgKHZhciBwID0gMDsgcCA8IHBmeC5sZW5ndGg7IHArKykge1xuICAgICAgICBpZiAoIXBmeFtwXS5jYW1lbENhc2UpXG4gICAgICAgICAgICB0eXBlID0gdHlwZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIocGZ4W3BdLmlkICsgdHlwZSwgY2FsbGJhY2ssIGZhbHNlKTtcbiAgICB9XG59XG5leHBvcnRzLmFkZFByZWZpeGVkRXZlbnRMaXN0ZW5lciA9IGFkZFByZWZpeGVkRXZlbnRMaXN0ZW5lcjtcbi8qKlxuICogQ29udmVuaWVuY2UgbWV0aG9kIGZvciBjYWxsaW5nIGNhbGxiYWNrc1xuICogQHBhcmFtIGNiICAgIFRoZSBjYWxsYmFjayBmdW5jdGlvbiB0byBjYWxsXG4gKi9cbmZ1bmN0aW9uIGNhbGxDYWxsYmFjayhjYikge1xuICAgIHZhciBhbnkgPSBbXTtcbiAgICBmb3IgKHZhciBfaSA9IDE7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICBhbnlbX2kgLSAxXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgfVxuICAgIGlmIChjYikge1xuICAgICAgICBpZiAodHlwZW9mIChjYikgPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB2YXIgYXJncyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBhcmdzLnB1c2goYXJndW1lbnRzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjYi5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbGxiYWNrIGlzIG5vdCBhIGZ1bmN0aW9uIVwiKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydHMuY2FsbENhbGxiYWNrID0gY2FsbENhbGxiYWNrO1xuLyoqXG4gKiBDaGVjayBpZiBzb21ldGhpbmcgaXMgYW4gYXJyYXkuXG4gKiBAcGFyYW0gdGhpbmdcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5mdW5jdGlvbiBpc0FycmF5KHRoaW5nKSB7XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh0aGluZykgPT09ICdbb2JqZWN0IEFycmF5XSc7XG59XG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xudmFyIE9JRF9QUk9QID0gXCJfX0lEX19cIjtcbnZhciBvaWRzID0gMTAwMDA7XG4vKipcbiAqIENyZWF0ZSBhbmQgcmV0dXJuIGEgdW5pcXVlIGlkIG9uIGEgSmF2YVNjcmlwdCBvYmplY3QuIFRoaXMgYWRkcyBhIG5ldyBwcm9wZXJ0eVxuICogX19JRF9fIHRvIHRoYXQgb2JqZWN0LiBJZHMgYXJlIG51bWJlcnMuXG4gKlxuICogVGhlIElEIGlzIGNyZWF0ZWQgdGhlIGZpcnN0IHRpbWUgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgZm9yIHRoYXQgb2JqZWN0IGFuZCB0aGVuXG4gKiB3aWxsIHNpbXBseSBiZSByZXR1cm5lZCBvbiBhbGwgc3Vic2VxdWVudCBjYWxscy5cbiAqXG4gKiBAcGFyYW0gb2JqXG4gKiBAcmV0dXJucyB7YW55fVxuICovXG5mdW5jdGlvbiBvaWQob2JqKSB7XG4gICAgaWYgKG9iaikge1xuICAgICAgICBpZiAoIW9iai5oYXNPd25Qcm9wZXJ0eShPSURfUFJPUCkpIHtcbiAgICAgICAgICAgIG9ialtPSURfUFJPUF0gPSBvaWRzKys7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG9ialtPSURfUFJPUF07XG4gICAgfVxufVxuZXhwb3J0cy5vaWQgPSBvaWQ7XG5mdW5jdGlvbiBhcHBseU1peGlucyhkZXJpdmVkQ3RvciwgYmFzZUN0b3JzKSB7XG4gICAgYmFzZUN0b3JzLmZvckVhY2goZnVuY3Rpb24gKGJhc2VDdG9yKSB7XG4gICAgICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGJhc2VDdG9yKS5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICBkZXJpdmVkQ3Rvci5wcm90b3R5cGVbbmFtZV0gPSBiYXNlQ3RvcltuYW1lXTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG4vKipcbiAqIFVzZSB0aGlzIHRvIHN1YmNsYXNzIGEgdHlwZXNjcmlwdCBjbGFzcyB1c2luZyBwbGFpbiBKYXZhU2NyaXB0LiBTcGVjIGlzIGFuIG9iamVjdFxuICogY29udGFpbmluZyBwcm9wZXJ0aWVzIGFuZCBtZXRob2RzIG9mIHRoZSBuZXcgY2xhc3MuIE1ldGhvZHMgaW4gc3BlYyB3aWxsIG92ZXJyaWRlXG4gKiBtZXRob2RzIGluIGJhc2VDbGFzcy5cbiAqXG4gKiBZb3Ugd2lsbCBOT1QgYmUgYWJsZSB0byBtYWtlIHN1cGVyIGNhbGxzIGluIHRoZSBzdWJjbGFzcy5cbiAqXG4gKiBAcGFyYW0gc3BlY1xuICogQHBhcmFtIGJhc2VDbGFzc1xuICogQHJldHVybnMge2FueX1cbiAqL1xuZnVuY3Rpb24gc3ViY2xhc3Moc3BlYywgYmFzZUNsYXNzKSB7XG4gICAgdmFyIGNvbnN0cnVjdG9yO1xuICAgIGlmIChzcGVjLmhhc093blByb3BlcnR5KFwiY29uc3RydWN0b3JcIikpIHtcbiAgICAgICAgY29uc3RydWN0b3IgPSBzcGVjW1wiY29uc3RydWN0b3JcIl07XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBjb25zdHJ1Y3RvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGJhc2VDbGFzcy5wcm90b3R5cGUuY29uc3RydWN0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgY29uc3RydWN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShiYXNlQ2xhc3MucHJvdG90eXBlKTtcbiAgICBhcHBseU1peGlucyhjb25zdHJ1Y3RvciwgW3NwZWNdKTtcbiAgICByZXR1cm4gY29uc3RydWN0b3I7XG59XG5leHBvcnRzLnN1YmNsYXNzID0gc3ViY2xhc3M7XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXRvb2xzLmpzLm1hcCJdfQ==
