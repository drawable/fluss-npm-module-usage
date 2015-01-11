(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Created by Stephan on 11.01.2015.
 */

"use strict";

var Store = require("fluss").store;

var array = Store.array();

array.newItems.forEach(function(update) {
    console.log(update.value + " was added.")
});

array.push("One");
array.push(2);
},{"fluss":12}],2:[function(require,module,exports){
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
    for (var _i = 0; _i < (arguments.length - 1); _i++) {
        args[_i] = arguments[_i + 1];
    }
    Dispatcher.getDispatcher().dispatchAction.apply(Dispatcher.getDispatcher(), [action].concat(args));
}
exports.triggerAction = triggerAction;

function undo() {
    Dispatcher.getDispatcher().dispatchAction(-2000 /* UNDO */);
}
exports.undo = undo;

},{"./dispatcher":3}],3:[function(require,module,exports){
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
    for (var _i = 0; _i < (arguments.length - 1); _i++) {
        args[_i] = arguments[_i + 1];
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
        try  {
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
                                } else {
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
                exports.getUndoManager().storeMementos(mementos, type, exports.createRedo(type, args));
            }
        } catch (e) {
            var msg = "Internal error. If this happens please check if it was a user error \n" + "that can be either prevented or gracefully handled.\n\n";
            msg += "Handled action: " + type + "\n";
            msg += "Create memento: " + (doMemento ? "yes\n" : "no\n");

            var argStr = "";

            try  {
                argStr = JSON.stringify(args, null, 2);
            } catch (e) {
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
        for (var _i = 0; _i < (arguments.length - 1); _i++) {
            args[_i] = arguments[_i + 1];
        }
        if (!this._disabled[action]) {
            this._undoing = true;
            try  {
                this.dispatch(false, action, args);
            } finally {
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
        for (var _i = 0; _i < (arguments.length - 1); _i++) {
            args[_i] = arguments[_i + 1];
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
    for (var _i = 0; _i < (arguments.length - 1); _i++) {
        args[_i] = arguments[_i + 1];
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

        exports.getDispatcher().subscribeAction(-2000 /* UNDO */, this.undo.bind(this));
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
                    exports.getDispatcher().dispatchUndoAction.apply(exports.getDispatcher(), [u.undo.action].concat(u.undo.data));
                } else {
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
                exports.getDispatcher().dispatchAction.apply(exports.getDispatcher(), [r.action].concat(r.data));
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

},{"./baseActions":2,"./errors":5,"./eventChannel":6}],4:[function(require,module,exports){
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
        for (var _i = 0; _i < (arguments.length - 1); _i++) {
            args[_i] = arguments[_i + 1];
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
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                args[_i] = arguments[_i + 0];
            }
            that.emit.apply(that, [emittingEvent].concat(args));
        });
    };
    return Emitter;
})();
exports.Emitter = Emitter;

},{}],5:[function(require,module,exports){
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

},{"./eventChannel":6}],6:[function(require,module,exports){
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
    for (var _i = 0; _i < (arguments.length - 2); _i++) {
        args[_i] = arguments[_i + 2];
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
        } else {
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
        for (var _i = 0; _i < (arguments.length - 1); _i++) {
            args[_i] = arguments[_i + 1];
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
        exports.subscribe(this._emitterID, _event, this._handler);
    }
    EventStream.prototype.handleEvent = function () {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 0); _i++) {
            args[_i] = arguments[_i + 0];
        }
        this.push({
            emitter: this._emitterID,
            event: this._event,
            args: args
        });
    };

    EventStream.prototype.dispose = function () {
        _super.prototype.dispose.call(this);
        exports.unsubscribe(this._emitterID, this._event, this._handler);
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
    for (var _i = 0; _i < (arguments.length - 1); _i++) {
        events[_i] = arguments[_i + 1];
    }
    var stream = null;

    events.forEach(function (event) {
        var eStream = new EventStream(emitterID + "-" + event, emitterID, event);
        if (stream) {
            stream = stream.combine(eStream);
        } else {
            stream = eStream;
        }
    });

    return stream;
}
exports.createEventStream = createEventStream;

},{"./emitter":4,"./stream":10}],7:[function(require,module,exports){
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
        for (var _i = 0; _i < (arguments.length - 2); _i++) {
            args[_i] = arguments[_i + 2];
        }
    };

    BasePlugin.prototype.afterFinish = function (container, action) {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 2); _i++) {
            args[_i] = arguments[_i + 2];
        }
    };

    BasePlugin.prototype.afterAbort = function (container, action) {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 2); _i++) {
            args[_i] = arguments[_i + 2];
        }
    };

    BasePlugin.prototype.getMemento = function (container, action) {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 2); _i++) {
            args[_i] = arguments[_i + 2];
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
                } else {
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
        } else {
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
                            } else {
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
                        } else {
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
                    } else {
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
                            } else {
                                //Here we do not exit because we want to abort the whole stack
                            }
                        }
                        that.finalizeAction(action, true, that.getPluginsForAction(action), null, args);
                    } else {
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
        } else if (this._anyPlugins && this._anyPlugins.length) {
            return this._anyPlugins;
        } else
            return [];
    };

    PluginContainer.prototype.handleAction = function (action, args) {
        try  {
            this.doHandleAction(this.getPluginsForAction(action), action, args);
        } catch (e) {
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
                    for (var _i = 0; _i < (arguments.length - 0); _i++) {
                        args[_i] = arguments[_i + 0];
                    }
                    var act = args.shift();
                    if (that._plugins[act]) {
                        return;
                    }
                    that.handleAction(act, args);
                }, function (type) {
                    var args = [];
                    for (var _i = 0; _i < (arguments.length - 1); _i++) {
                        args[_i] = arguments[_i + 1];
                    }
                    return null;
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
        } else {
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
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    args[_i] = arguments[_i + 0];
                }
                that.handleAction(action, args);
            }, function (type) {
                var args = [];
                for (var _i = 0; _i < (arguments.length - 1); _i++) {
                    args[_i] = arguments[_i + 1];
                }
                return null;
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
        } else {
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

},{"./baseActions":2,"./dispatcher":3,"./eventChannel":6,"./tools":11}],8:[function(require,module,exports){
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

},{"./stream":10}],9:[function(require,module,exports){
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
    } else {
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
        if (exports.isStore(value)) {
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
        } else {
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
            if (exports.isStore(that[key])) {
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
                if (exports.isStore(that._parent[name])) {
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
            } else {
                v = buildRecord(value);
            }
        } else {
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
        } else {
            return buildRecord(value);
        }
    } else {
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
    } else {
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
        if (exports.isStore(value) && value.isImmutable) {
            return this._data.indexOf(value["_parent"], fromIndex);
        } else {
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
            } else {
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
                    } else {
                        adder.push(createUpdateInfo(getClosestLeftMap(update.rootItem) + 1, that._data[update.rootItem], update.store));
                    }
                    addMap(update.rootItem, filteredStore.indexOf(that._data[update.rootItem]));
                } else {
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
                    } else {
                        adder.push(createUpdateInfo(getClosestLeftMap(update.rootItem) + 1, that._data[update.rootItem], update.store));
                        map(update.rootItem, filteredStore.indexOf(that._data[update.rootItem]));
                    }
                } else {
                    if (isMapped(update.rootItem)) {
                        remover.push(createUpdateInfo(mapIndex(update.rootItem), that._data[update.rootItem], update.store));
                        unmap(update.rootItem);
                    } else {
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
        } else {
            newArray = this._data.concat(array);
        }
        return new ArrayStore(newArray);
    };

    ArrayStore.prototype.concatInplace = function (array) {
        if (array instanceof ArrayStore) {
            this.splice.apply(this, [this.length, 0].concat(array["_data"]));
        } else {
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
        if (exports.isStore(value)) {
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
        if (exports.isStore(value) && this._data.indexOf(value) === -1) {
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
        for (var _i = 0; _i < (arguments.length - 0); _i++) {
            values[_i] = arguments[_i + 0];
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
        for (var _i = 0; _i < (arguments.length - 0); _i++) {
            values[_i] = arguments[_i + 0];
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
        for (var _i = 0; _i < (arguments.length - 2); _i++) {
            values[_i] = arguments[_i + 2];
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
        for (var _i = 0; _i < (arguments.length - 1); _i++) {
            values[_i] = arguments[_i + 1];
        }
        this.splice.apply(this, [atIndex, 0].concat(values));
    };

    ArrayStore.prototype.remove = function (atIndex, count) {
        if (typeof count === "undefined") { count = 1; }
        return this.splice(atIndex, count);
    };

    ArrayStore.prototype.dispose = function () {
        for (var i = 0; i < this.length; i++) {
            if (exports.isStore(this[i])) {
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
                        if (exports.isStore(that._parent[index])) {
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
    } else {
        return new ArrayStore();
    }
}
exports.array = array;

},{"./stream":10,"./tools":11}],10:[function(require,module,exports){
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
                try  {
                    m.call(that, value, i + baseIndex);
                } catch (e) {
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
            } else {
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
        } else {
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
            try  {
                method.call(that, value, index);
            } catch (e) {
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
        } else {
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
        } else {
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
        } else {
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
        } else {
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
            } else {
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
                } else {
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

},{}],11:[function(require,module,exports){
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
    { id: "", camelCase: false }];

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
    for (var _i = 0; _i < (arguments.length - 1); _i++) {
        any[_i] = arguments[_i + 1];
    }
    if (cb) {
        if (typeof (cb) == "function") {
            var args = [];
            for (var i = 1; i < arguments.length; i++) {
                args.push(arguments[i]);
            }
            return cb.apply(this, args);
        } else {
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
    } else {
        constructor = function () {
            baseClass.prototype.constructor.apply(this, arguments);
        };
    }

    constructor.prototype = Object.create(baseClass.prototype);
    applyMixins(constructor, [spec]);

    return constructor;
}
exports.subclass = subclass;

},{}],12:[function(require,module,exports){
module.exports.tools = require('./commonjs/fluss/tools');
module.exports.baseActions = require('./commonjs/fluss/baseActions');
module.exports.dispatcher = require('./commonjs/fluss/dispatcher');
module.exports.errors = require('./commonjs/fluss/errors');
module.exports.plugins = require('./commonjs/fluss/plugins');
module.exports.reactMixins = require('./commonjs/fluss/reactMixins');
module.exports.store = require('./commonjs/fluss/store');
module.exports.stream = require('./commonjs/fluss/stream');

},{"./commonjs/fluss/baseActions":2,"./commonjs/fluss/dispatcher":3,"./commonjs/fluss/errors":5,"./commonjs/fluss/plugins":7,"./commonjs/fluss/reactMixins":8,"./commonjs/fluss/store":9,"./commonjs/fluss/stream":10,"./commonjs/fluss/tools":11}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQ29tbW9uSlNCcm93c2VyaWZ5X0pTXFxtYWluLmpzIiwibm9kZV9tb2R1bGVzXFxmbHVzc1xcY29tbW9uanNcXGZsdXNzXFxiYXNlQWN0aW9ucy5qcyIsIm5vZGVfbW9kdWxlc1xcZmx1c3NcXGNvbW1vbmpzXFxmbHVzc1xcZGlzcGF0Y2hlci5qcyIsIm5vZGVfbW9kdWxlc1xcZmx1c3NcXGNvbW1vbmpzXFxmbHVzc1xcZW1pdHRlci5qcyIsIm5vZGVfbW9kdWxlc1xcZmx1c3NcXGNvbW1vbmpzXFxmbHVzc1xcZXJyb3JzLmpzIiwibm9kZV9tb2R1bGVzXFxmbHVzc1xcY29tbW9uanNcXGZsdXNzXFxldmVudENoYW5uZWwuanMiLCJub2RlX21vZHVsZXNcXGZsdXNzXFxjb21tb25qc1xcZmx1c3NcXHBsdWdpbnMuanMiLCJub2RlX21vZHVsZXNcXGZsdXNzXFxjb21tb25qc1xcZmx1c3NcXHJlYWN0TWl4aW5zLmpzIiwibm9kZV9tb2R1bGVzXFxmbHVzc1xcY29tbW9uanNcXGZsdXNzXFxzdG9yZS5qcyIsIm5vZGVfbW9kdWxlc1xcZmx1c3NcXGNvbW1vbmpzXFxmbHVzc1xcc3RyZWFtLmpzIiwibm9kZV9tb2R1bGVzXFxmbHVzc1xcY29tbW9uanNcXGZsdXNzXFx0b29scy5qcyIsIm5vZGVfbW9kdWxlc1xcZmx1c3NcXGluZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdZQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDemRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IFN0ZXBoYW4gb24gMTEuMDEuMjAxNS5cclxuICovXHJcblxyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBTdG9yZSA9IHJlcXVpcmUoXCJmbHVzc1wiKS5zdG9yZTtcclxuXHJcbnZhciBhcnJheSA9IFN0b3JlLmFycmF5KCk7XHJcblxyXG5hcnJheS5uZXdJdGVtcy5mb3JFYWNoKGZ1bmN0aW9uKHVwZGF0ZSkge1xyXG4gICAgY29uc29sZS5sb2codXBkYXRlLnZhbHVlICsgXCIgd2FzIGFkZGVkLlwiKVxyXG59KTtcclxuXHJcbmFycmF5LnB1c2goXCJPbmVcIik7XHJcbmFycmF5LnB1c2goMik7IiwiLyoqXHJcbiogQ3JlYXRlZCBieSBTdGVwaGFuLlNtb2xhIG9uIDI4LjEwLjIwMTQuXHJcbiovXHJcblwidXNlIHN0cmljdFwiO1xyXG52YXIgRGlzcGF0Y2hlciA9IHJlcXVpcmUoXCIuL2Rpc3BhdGNoZXJcIik7XHJcblxyXG4oZnVuY3Rpb24gKEFDVElPTlMpIHtcclxuICAgIEFDVElPTlNbQUNUSU9OU1tcIl9fQU5ZX19cIl0gPSAtMTAwMF0gPSBcIl9fQU5ZX19cIjtcclxuICAgIEFDVElPTlNbQUNUSU9OU1tcIlVORE9cIl0gPSAtMjAwMF0gPSBcIlVORE9cIjtcclxufSkoZXhwb3J0cy5BQ1RJT05TIHx8IChleHBvcnRzLkFDVElPTlMgPSB7fSkpO1xyXG52YXIgQUNUSU9OUyA9IGV4cG9ydHMuQUNUSU9OUztcclxuXHJcbi8qKlxyXG4qIEdlbmVyaWMgYWN0aW9uIHRyaWdnZXIgdGhhdCBjYW4gYmUgZmVkIGJ5IHBhc3NpbmcgdGhlIGFjdGlvbiBpZCBhbmQgcGFyYW1ldGVycy5cclxuKiBDYW4gYmUgdXNlZCBpbiBzaXR1YXRpb25zIHdoZXJlIGFjdGlvbnMgYXJlIHRyaWdnZXJlZCBiYXNlZCBvbiBhIGNvbmZpZ3VyYXRpb24uXHJcbipcclxuKiBFeHBsaWNpdCBGdW5jdGlvbnMgYXJlIHJlY29tbWVuZGVkIGZvciBhbGwgYWN0aW9ucywgYmVjYXVzZSB0aGV5IG1ha2UgY29kaW5nIGVhc2llclxyXG4qIGFuZCBjb2RlIG1vcmUgcmVhZGFibGVcclxuKlxyXG4qIEBwYXJhbSBhY3Rpb25cclxuKiBAcGFyYW0gYXJnc1xyXG4qL1xyXG5mdW5jdGlvbiB0cmlnZ2VyQWN0aW9uKGFjdGlvbikge1xyXG4gICAgdmFyIGFyZ3MgPSBbXTtcclxuICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCAoYXJndW1lbnRzLmxlbmd0aCAtIDEpOyBfaSsrKSB7XHJcbiAgICAgICAgYXJnc1tfaV0gPSBhcmd1bWVudHNbX2kgKyAxXTtcclxuICAgIH1cclxuICAgIERpc3BhdGNoZXIuZ2V0RGlzcGF0Y2hlcigpLmRpc3BhdGNoQWN0aW9uLmFwcGx5KERpc3BhdGNoZXIuZ2V0RGlzcGF0Y2hlcigpLCBbYWN0aW9uXS5jb25jYXQoYXJncykpO1xyXG59XHJcbmV4cG9ydHMudHJpZ2dlckFjdGlvbiA9IHRyaWdnZXJBY3Rpb247XHJcblxyXG5mdW5jdGlvbiB1bmRvKCkge1xyXG4gICAgRGlzcGF0Y2hlci5nZXREaXNwYXRjaGVyKCkuZGlzcGF0Y2hBY3Rpb24oLTIwMDAgLyogVU5ETyAqLyk7XHJcbn1cclxuZXhwb3J0cy51bmRvID0gdW5kbztcclxuIiwiLyoqXHJcbiogQ3JlYXRlZCBieSBTdGVwaGFuLlNtb2xhIG9uIDI4LjEwLjIwMTQuXHJcbiovXHJcblwidXNlIHN0cmljdFwiO1xyXG52YXIgX19leHRlbmRzID0gdGhpcy5fX2V4dGVuZHMgfHwgZnVuY3Rpb24gKGQsIGIpIHtcclxuICAgIGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdO1xyXG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XHJcbiAgICBfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZTtcclxuICAgIGQucHJvdG90eXBlID0gbmV3IF9fKCk7XHJcbn07XHJcbnZhciBFcnJvcnMgPSByZXF1aXJlKFwiLi9lcnJvcnNcIik7XHJcbnZhciBFdmVudENoYW5uZWwgPSByZXF1aXJlKFwiLi9ldmVudENoYW5uZWxcIik7XHJcbnZhciBBY3Rpb25zID0gcmVxdWlyZShcIi4vYmFzZUFjdGlvbnNcIik7XHJcblxyXG5cclxuXHJcblxyXG4vKipcclxuKiBDcmVhdGUgYSBtZW1lbnRvIG9iamVjdC5cclxuKiBAcGFyYW0gaW5zdGFuY2VcclxuKiBAcGFyYW0gZGF0YVxyXG4qIEBwYXJhbSByZWRvXHJcbiogQHBhcmFtIHVuZG8gICAgICBPcHRpb25hbGx5IHlvdSBjYW4gcHJvdmlkZSBhbiBhY3Rpb24gZm9yIHVuZG9pbmcsIGlmIHRoYXQgaXMgc2ltcGxlciB0aGFuIHN0b3JpbmcgZGF0YVxyXG4qIEByZXR1cm5zIHt7ZGF0YTogYW55LCByZWRvOiBJQWN0aW9uLCBpbnN0YW5jZTogSVVuZG9hYmxlfX1cclxuKi9cclxuZnVuY3Rpb24gY3JlYXRlTWVtZW50byhpbnN0YW5jZSwgZGF0YSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBhY3Rpb246IC0xLFxyXG4gICAgICAgIGRhdGE6IGRhdGEsXHJcbiAgICAgICAgcmVkbzogbnVsbCxcclxuICAgICAgICB1bmRvOiBudWxsLFxyXG4gICAgICAgIGluc3RhbmNlOiBpbnN0YW5jZVxyXG4gICAgfTtcclxufVxyXG5leHBvcnRzLmNyZWF0ZU1lbWVudG8gPSBjcmVhdGVNZW1lbnRvO1xyXG5cclxuLyoqXHJcbiogQ3JlYXRlIGEgcmVkbyBvYmplY3QuXHJcbiogQHBhcmFtIGFjdGlvblxyXG4qIEBwYXJhbSBkYXRhXHJcbiogQHJldHVybnMge3thY3Rpb246IG51bWJlciwgZGF0YTogYW55fX1cclxuKi9cclxuZnVuY3Rpb24gY3JlYXRlUmVkbyhhY3Rpb24sIGRhdGEpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgYWN0aW9uOiBhY3Rpb24sXHJcbiAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgfTtcclxufVxyXG5leHBvcnRzLmNyZWF0ZVJlZG8gPSBjcmVhdGVSZWRvO1xyXG5cclxuZnVuY3Rpb24gY3JlYXRlVW5kb0FjdGlvbihhY3Rpb24pIHtcclxuICAgIHZhciBhcmdzID0gW107XHJcbiAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgKGFyZ3VtZW50cy5sZW5ndGggLSAxKTsgX2krKykge1xyXG4gICAgICAgIGFyZ3NbX2ldID0gYXJndW1lbnRzW19pICsgMV07XHJcbiAgICB9XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGFjdGlvbjogLTEsXHJcbiAgICAgICAgZGF0YTogbnVsbCxcclxuICAgICAgICByZWRvOiBudWxsLFxyXG4gICAgICAgIHVuZG86IHtcclxuICAgICAgICAgICAgYWN0aW9uOiBhY3Rpb24sXHJcbiAgICAgICAgICAgIGRhdGE6IGFyZ3NcclxuICAgICAgICB9LFxyXG4gICAgICAgIGluc3RhbmNlOiBudWxsXHJcbiAgICB9O1xyXG59XHJcbmV4cG9ydHMuY3JlYXRlVW5kb0FjdGlvbiA9IGNyZWF0ZVVuZG9BY3Rpb247XHJcblxyXG5cclxuLyoqXHJcbiogRXZlbnRzIHRoYXQgYXJlIHJhaXNlZCBieSB0aGUgdW5kbyBtYW5hZ2VyLlxyXG4qL1xyXG4oZnVuY3Rpb24gKEVWRU5UUykge1xyXG4gICAgRVZFTlRTW0VWRU5UU1tcIlVORE9cIl0gPSAwXSA9IFwiVU5ET1wiO1xyXG4gICAgRVZFTlRTW0VWRU5UU1tcIlJFRE9cIl0gPSAxXSA9IFwiUkVET1wiO1xyXG4gICAgRVZFTlRTW0VWRU5UU1tcIk1FTUVOVE9fU1RPUkVEXCJdID0gMl0gPSBcIk1FTUVOVE9fU1RPUkVEXCI7XHJcbiAgICBFVkVOVFNbRVZFTlRTW1wiQ0xFQVJcIl0gPSAzXSA9IFwiQ0xFQVJcIjtcclxufSkoZXhwb3J0cy5FVkVOVFMgfHwgKGV4cG9ydHMuRVZFTlRTID0ge30pKTtcclxudmFyIEVWRU5UUyA9IGV4cG9ydHMuRVZFTlRTO1xyXG5cclxuXHJcblxyXG4vKipcclxuKiBJbXBsZW1lbnRhdGlvbiBvZiBhIGRpc3BhdGNoZXIgYXMgZGVzY3JpYmVkIGJ5IHRoZSBGTFVYIHBhdHRlcm4uXHJcbiovXHJcbnZhciBEaXNwYXRjaGVyID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIERpc3BhdGNoZXIoKSB7XHJcbiAgICAgICAgdGhpcy5faGFuZGxlcnMgPSB7fTtcclxuICAgICAgICB0aGlzLl9kaXNwYXRjaGluZyA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuX3VuZG9pbmcgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLl9kaXNhYmxlZCA9IHt9O1xyXG4gICAgfVxyXG4gICAgRGlzcGF0Y2hlci5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLl9oYW5kbGVycyA9IHt9O1xyXG4gICAgICAgIHRoaXMuX2Rpc3BhdGNoaW5nID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5fdW5kb2luZyA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuX2Rpc2FibGVkID0ge307XHJcbiAgICB9O1xyXG5cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShEaXNwYXRjaGVyLnByb3RvdHlwZSwgXCJ1bmRvaW5nXCIsIHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3VuZG9pbmc7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAqIFRoZSBhY3R1YWwgZGlzcGF0Y2hcclxuICAgICogQHBhcmFtIGRvTWVtZW50b1xyXG4gICAgKiBAcGFyYW0gdHlwZVxyXG4gICAgKiBAcGFyYW0gYXJnc1xyXG4gICAgKi9cclxuICAgIERpc3BhdGNoZXIucHJvdG90eXBlLmRpc3BhdGNoID0gZnVuY3Rpb24gKGRvTWVtZW50bywgdHlwZSwgYXJncykge1xyXG4gICAgICAgIHRyeSAge1xyXG4gICAgICAgICAgICB2YXIgbWVtZW50b3MgPSBbXTtcclxuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICAgICAgdmFyIGRvaXQgPSBmdW5jdGlvbiAoX190eXBlLCBkaXNwYXRjaCwgdHJ1ZVR5cGUpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGF0Ll9oYW5kbGVyc1tfX3R5cGVdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5faGFuZGxlcnNbX190eXBlXS5mb3JFYWNoKGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkb01lbWVudG8gJiYgZFsxXSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1lbWVudG8gPSBkWzFdLmFwcGx5KHRoYXQsIFt0cnVlVHlwZSB8fCBfX3R5cGVdLmNvbmNhdChhcmdzKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobWVtZW50bykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobWVtZW50bykgPT09IFwiW29iamVjdCBBcnJheV1cIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseShtZW1lbnRvcywgbWVtZW50byk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVtZW50b3MucHVzaChtZW1lbnRvKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGF0Y2goZFswXSwgYXJncyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBkb2l0KHR5cGUsIGZ1bmN0aW9uIChoYW5kbGVyLCBhcmdzKSB7XHJcbiAgICAgICAgICAgICAgICBoYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGRvaXQoLTEwMDAgLyogX19BTllfXyAqLywgZnVuY3Rpb24gKGhhbmRsZXIsIGFyZ3MpIHtcclxuICAgICAgICAgICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgW3R5cGUsIGFyZ3NdKTtcclxuICAgICAgICAgICAgfSwgdHlwZSk7XHJcblxyXG4gICAgICAgICAgICBpZiAobWVtZW50b3MubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICBleHBvcnRzLmdldFVuZG9NYW5hZ2VyKCkuc3RvcmVNZW1lbnRvcyhtZW1lbnRvcywgdHlwZSwgZXhwb3J0cy5jcmVhdGVSZWRvKHR5cGUsIGFyZ3MpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgdmFyIG1zZyA9IFwiSW50ZXJuYWwgZXJyb3IuIElmIHRoaXMgaGFwcGVucyBwbGVhc2UgY2hlY2sgaWYgaXQgd2FzIGEgdXNlciBlcnJvciBcXG5cIiArIFwidGhhdCBjYW4gYmUgZWl0aGVyIHByZXZlbnRlZCBvciBncmFjZWZ1bGx5IGhhbmRsZWQuXFxuXFxuXCI7XHJcbiAgICAgICAgICAgIG1zZyArPSBcIkhhbmRsZWQgYWN0aW9uOiBcIiArIHR5cGUgKyBcIlxcblwiO1xyXG4gICAgICAgICAgICBtc2cgKz0gXCJDcmVhdGUgbWVtZW50bzogXCIgKyAoZG9NZW1lbnRvID8gXCJ5ZXNcXG5cIiA6IFwibm9cXG5cIik7XHJcblxyXG4gICAgICAgICAgICB2YXIgYXJnU3RyID0gXCJcIjtcclxuXHJcbiAgICAgICAgICAgIHRyeSAge1xyXG4gICAgICAgICAgICAgICAgYXJnU3RyID0gSlNPTi5zdHJpbmdpZnkoYXJncywgbnVsbCwgMik7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgIGFyZ1N0ciA9IFwiSXQncyBhIGNpcmN1bGFyIHN0cnVjdHVyZSA6LShcIjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbXNnICs9IFwiQXJndW1lbnRzICAgICA6IFwiICsgYXJnU3RyICsgXCJcXG5cIjtcclxuICAgICAgICAgICAgbXNnICs9IFwiTWVtZW50b3MgICAgICA6IFwiICsgKG1lbWVudG9zID8gSlNPTi5zdHJpbmdpZnkobWVtZW50b3MsIG51bGwsIDIpIDogXCJub25lXCIpICsgXCJcXG5cIjtcclxuICAgICAgICAgICAgbXNnICs9IFwiRXhjZXB0aW9uICAgICA6IFwiICsgZS5tZXNzYWdlICsgXCJcXG5cIjtcclxuICAgICAgICAgICAgbXNnICs9IFwiU3RhY2sgdHJhY2UgICA6XFxuXCIgKyBlLnN0YWNrICsgXCJcXG5cIjtcclxuXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKG1zZyk7XHJcblxyXG4gICAgICAgICAgICBFcnJvcnMuZnJhbWV3b3JrKGUubWVzc2FnZSwgZSwgdGhhdCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICogRGlzcGF0Y2ggYW4gdW5kbyBhY3Rpb24uIFRoaXMgaXMgYmFzaWNhbGx5IHRoZSBzYW1lIGFzIGRpc3BhdGNoaW5nIGEgcmVndWxhclxyXG4gICAgKiBhY3Rpb24sIGJ1dCB0aGUgbWVtZW50byB3aWxsIG5vdCBiZSBjcmVhdGVkLlxyXG4gICAgKiBAcGFyYW0gdHlwZVxyXG4gICAgKiBAcGFyYW0gYXJnc1xyXG4gICAgKi9cclxuICAgIERpc3BhdGNoZXIucHJvdG90eXBlLmRpc3BhdGNoVW5kb0FjdGlvbiA9IGZ1bmN0aW9uIChhY3Rpb24pIHtcclxuICAgICAgICB2YXIgYXJncyA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCAoYXJndW1lbnRzLmxlbmd0aCAtIDEpOyBfaSsrKSB7XHJcbiAgICAgICAgICAgIGFyZ3NbX2ldID0gYXJndW1lbnRzW19pICsgMV07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghdGhpcy5fZGlzYWJsZWRbYWN0aW9uXSkge1xyXG4gICAgICAgICAgICB0aGlzLl91bmRvaW5nID0gdHJ1ZTtcclxuICAgICAgICAgICAgdHJ5ICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3BhdGNoKGZhbHNlLCBhY3Rpb24sIGFyZ3MpO1xyXG4gICAgICAgICAgICB9IGZpbmFsbHkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fdW5kb2luZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICogRGlzcGF0Y2gsIGkuZS4gYnJvYWRjYXN0IGFuIGFjdGlvbiB0byBhbnlvbmUgdGhhdCdzIGludGVyZXN0ZWQuXHJcbiAgICAqIEBwYXJhbSB0eXBlXHJcbiAgICAqIEBwYXJhbSBkYXRhXHJcbiAgICAqL1xyXG4gICAgRGlzcGF0Y2hlci5wcm90b3R5cGUuZGlzcGF0Y2hBY3Rpb24gPSBmdW5jdGlvbiAoYWN0aW9uKSB7XHJcbiAgICAgICAgdmFyIGFyZ3MgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgKGFyZ3VtZW50cy5sZW5ndGggLSAxKTsgX2krKykge1xyXG4gICAgICAgICAgICBhcmdzW19pXSA9IGFyZ3VtZW50c1tfaSArIDFdO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIXRoaXMuX2Rpc2FibGVkW2FjdGlvbl0pIHtcclxuICAgICAgICAgICAgdGhpcy5kaXNwYXRjaCh0cnVlLCBhY3Rpb24sIGFyZ3MpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAqIFN1YnNjcmliZSB0byBhbiBhY3Rpb24uXHJcbiAgICAqIEBwYXJhbSBhY3Rpb25cclxuICAgICogQHBhcmFtIGhhbmRsZXJcclxuICAgICogQHBhcmFtIG1lbWVudG9Qcm92aWRlclxyXG4gICAgKi9cclxuICAgIERpc3BhdGNoZXIucHJvdG90eXBlLnN1YnNjcmliZUFjdGlvbiA9IGZ1bmN0aW9uIChhY3Rpb24sIGhhbmRsZXIsIG1lbWVudG9Qcm92aWRlcikge1xyXG4gICAgICAgIGlmICghdGhpcy5faGFuZGxlcnNbYWN0aW9uXSkge1xyXG4gICAgICAgICAgICB0aGlzLl9oYW5kbGVyc1thY3Rpb25dID0gW107XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5faGFuZGxlcnNbYWN0aW9uXS5pbmRleE9mKGhhbmRsZXIpID09PSAtMSkge1xyXG4gICAgICAgICAgICB0aGlzLl9oYW5kbGVyc1thY3Rpb25dLnB1c2goW2hhbmRsZXIsIG1lbWVudG9Qcm92aWRlcl0pO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAqIFVuc3Vic2NyaWJlIGFuIGFjdGlvbiBoYW5kbGVyLiBUaGlzIHJlbW92ZXMgYSBwb3RlbnRpYWwgbWVtZW50b1Byb3ZpZGVyIGFsc28uXHJcbiAgICAqIEBwYXJhbSBhY3Rpb25cclxuICAgICogQHBhcmFtIGhhbmRsZXJcclxuICAgICovXHJcbiAgICBEaXNwYXRjaGVyLnByb3RvdHlwZS51bnN1YnNjcmliZUFjdGlvbiA9IGZ1bmN0aW9uIChhY3Rpb24sIGhhbmRsZXIpIHtcclxuICAgICAgICBpZiAodGhpcy5faGFuZGxlcnNbYWN0aW9uXSkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX2hhbmRsZXJzW2FjdGlvbl0ubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9oYW5kbGVyc1thY3Rpb25dW2ldWzBdID09PSBoYW5kbGVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5faGFuZGxlcnNbYWN0aW9uXS5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBEaXNwYXRjaGVyLnByb3RvdHlwZS5kaXNhYmxlQWN0aW9uID0gZnVuY3Rpb24gKGFjdGlvbikge1xyXG4gICAgICAgIHRoaXMuX2Rpc2FibGVkW2FjdGlvbl0gPSB0cnVlO1xyXG4gICAgfTtcclxuXHJcbiAgICBEaXNwYXRjaGVyLnByb3RvdHlwZS5lbmFibGVBY3Rpb24gPSBmdW5jdGlvbiAoYWN0aW9uKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2Rpc2FibGVkW2FjdGlvbl0pIHtcclxuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX2Rpc2FibGVkW2FjdGlvbl07XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIHJldHVybiBEaXNwYXRjaGVyO1xyXG59KSgpO1xyXG5cclxudmFyIGRpc3BhdGNoZXIgPSBuZXcgRGlzcGF0Y2hlcigpO1xyXG5cclxuZnVuY3Rpb24gZ2V0RGlzcGF0Y2hlcigpIHtcclxuICAgIHJldHVybiBkaXNwYXRjaGVyO1xyXG59XHJcbmV4cG9ydHMuZ2V0RGlzcGF0Y2hlciA9IGdldERpc3BhdGNoZXI7XHJcblxyXG5mdW5jdGlvbiBkaXNwYXRjaChhY3Rpb24pIHtcclxuICAgIHZhciBhcmdzID0gW107XHJcbiAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgKGFyZ3VtZW50cy5sZW5ndGggLSAxKTsgX2krKykge1xyXG4gICAgICAgIGFyZ3NbX2ldID0gYXJndW1lbnRzW19pICsgMV07XHJcbiAgICB9XHJcbiAgICBkaXNwYXRjaGVyLmRpc3BhdGNoQWN0aW9uLmFwcGx5KGRpc3BhdGNoZXIsIFthY3Rpb25dLmNvbmNhdChhcmdzKSk7XHJcbn1cclxuZXhwb3J0cy5kaXNwYXRjaCA9IGRpc3BhdGNoO1xyXG5cclxuZnVuY3Rpb24gc3Vic2NyaWJlQWN0aW9uKGFjdGlvbiwgaGFuZGxlciwgbWVtZW50b1Byb3ZpZGVyKSB7XHJcbiAgICBkaXNwYXRjaGVyLnN1YnNjcmliZUFjdGlvbihhY3Rpb24sIGhhbmRsZXIsIG1lbWVudG9Qcm92aWRlcik7XHJcbn1cclxuZXhwb3J0cy5zdWJzY3JpYmVBY3Rpb24gPSBzdWJzY3JpYmVBY3Rpb247XHJcblxyXG5mdW5jdGlvbiB1bnN1YnNjcmliZUFjdGlvbihhY3Rpb24sIGhhbmRsZXIpIHtcclxuICAgIGRpc3BhdGNoZXIudW5zdWJzY3JpYmVBY3Rpb24oYWN0aW9uLCBoYW5kbGVyKTtcclxufVxyXG5leHBvcnRzLnVuc3Vic2NyaWJlQWN0aW9uID0gdW5zdWJzY3JpYmVBY3Rpb247XHJcblxyXG5mdW5jdGlvbiBkaXNhYmxlQWN0aW9uKGFjdGlvbikge1xyXG4gICAgZGlzcGF0Y2hlci5kaXNhYmxlQWN0aW9uKGFjdGlvbik7XHJcbn1cclxuZXhwb3J0cy5kaXNhYmxlQWN0aW9uID0gZGlzYWJsZUFjdGlvbjtcclxuXHJcbmZ1bmN0aW9uIGVuYWJsZUFjdGlvbihhY3Rpb24pIHtcclxuICAgIGRpc3BhdGNoZXIuZW5hYmxlQWN0aW9uKGFjdGlvbik7XHJcbn1cclxuZXhwb3J0cy5lbmFibGVBY3Rpb24gPSBlbmFibGVBY3Rpb247XHJcblxyXG4vKipcclxuKiBSZXNldHMgZXZlcnl0aGluZy4gTm8gcHJldmlvdXNseSBzdWJzY3JpYmVkIGhhbmRsZXIgd2lsbCBiZSBjYWxsZWQuXHJcbiovXHJcbmZ1bmN0aW9uIHJlc2V0KCkge1xyXG4gICAgZGlzcGF0Y2hlci5kZXN0cm95KCk7XHJcbiAgICBkaXNwYXRjaGVyID0gbmV3IERpc3BhdGNoZXIoKTtcclxufVxyXG5leHBvcnRzLnJlc2V0ID0gcmVzZXQ7XHJcblxyXG4vKipcclxuKiBVbmRvIG1hbmFnZXIgaW1wbGVtZW50YXRpb25zLiBJdCB1dGlsaXNlcyB0d28gc3RhY2tzICh1bmRvLCByZWRvKSB0byBwcm92aWRlIHRoZVxyXG4qIG5lY2Vzc2FyeSBtZWFucyB0byB1bmRvIGFuZCByZWRvIGFjdGlvbnMuXHJcbiovXHJcbnZhciBVbmRvTWFuYWdlciA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XHJcbiAgICBfX2V4dGVuZHMoVW5kb01hbmFnZXIsIF9zdXBlcik7XHJcbiAgICBmdW5jdGlvbiBVbmRvTWFuYWdlcigpIHtcclxuICAgICAgICBfc3VwZXIuY2FsbCh0aGlzLCBcIlVuZG9NYW5hZ2VyXCIpO1xyXG4gICAgICAgIHRoaXMuY2xlYXIoKTtcclxuXHJcbiAgICAgICAgZXhwb3J0cy5nZXREaXNwYXRjaGVyKCkuc3Vic2NyaWJlQWN0aW9uKC0yMDAwIC8qIFVORE8gKi8sIHRoaXMudW5kby5iaW5kKHRoaXMpKTtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgKiBTdG9yZSBhIG1lbWVudG8uIFRoaXMgaXMgcHV0IG9uIGEgc3RhY2sgdGhhdCBpcyB1c2VkIGZvciB1bmRvXHJcbiAgICAqIEBwYXJhbSBtZW1lbnRvc1xyXG4gICAgKiBAcGFyYW0gYWN0aW9uICAgICAgICB0aGUgYWN0aW9uIHRoYXQgY3JlYXRlZCB0aGUgbWVtZW50b1xyXG4gICAgKiBAcGFyYW0gcmVkbyAgICAgICAgICB0aGUgZGF0YSB0aGF0IGNhbiBiZSB1c2VkIHRvIHJlY3JlYXRlIHRoZSBhY3Rpb25cclxuICAgICovXHJcbiAgICBVbmRvTWFuYWdlci5wcm90b3R5cGUuc3RvcmVNZW1lbnRvcyA9IGZ1bmN0aW9uIChtZW1lbnRvcywgYWN0aW9uLCByZWRvKSB7XHJcbiAgICAgICAgaWYgKG1lbWVudG9zKSB7XHJcbiAgICAgICAgICAgIG1lbWVudG9zLmZvckVhY2goZnVuY3Rpb24gKG0pIHtcclxuICAgICAgICAgICAgICAgIGlmIChtKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbS5yZWRvID0gcmVkbztcclxuICAgICAgICAgICAgICAgICAgICBtLmFjdGlvbiA9IGFjdGlvbjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLm1lbWVudG9zLnB1c2gobWVtZW50b3MpO1xyXG4gICAgICAgICAgICB0aGlzLnJlZG9zID0gW107XHJcbiAgICAgICAgICAgIHRoaXMuZW1pdCgyIC8qIE1FTUVOVE9fU1RPUkVEICovLCBtZW1lbnRvcyk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICogVW5kby4gUG9wIHRoZSBsYXRlc3QgbWVtZW50byBmcm9tIHRoZSBzdGFjayBhbmQgcmVzdG9yZSB0aGUgYWNjb3JkaW5nIG9iamVjdC4gVGhpcyBwdXNoZXMgdGhlIHJlZG8taW5mb1xyXG4gICAgKiBmcm9tIHRoZSBtZW1lbnRvIG9udG8gdGhlIHJlZG8gc3RhY2sgdG8gdXNlIGluIHJlZG8uXHJcbiAgICAqL1xyXG4gICAgVW5kb01hbmFnZXIucHJvdG90eXBlLnVuZG8gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHVzID0gdGhpcy5tZW1lbnRvcy5wb3AoKTtcclxuICAgICAgICBpZiAodXMpIHtcclxuICAgICAgICAgICAgdmFyIHJlZG9zID0gW107XHJcbiAgICAgICAgICAgIHVzLmZvckVhY2goZnVuY3Rpb24gKHUsIGkpIHtcclxuICAgICAgICAgICAgICAgIGlmICh1LnVuZG8pIHtcclxuICAgICAgICAgICAgICAgICAgICBleHBvcnRzLmdldERpc3BhdGNoZXIoKS5kaXNwYXRjaFVuZG9BY3Rpb24uYXBwbHkoZXhwb3J0cy5nZXREaXNwYXRjaGVyKCksIFt1LnVuZG8uYWN0aW9uXS5jb25jYXQodS51bmRvLmRhdGEpKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdS5pbnN0YW5jZS5yZXN0b3JlRnJvbU1lbWVudG8odSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCFpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVkb3MucHVzaCh1LnJlZG8pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMucmVkb3MucHVzaChyZWRvcyk7XHJcbiAgICAgICAgICAgIHRoaXMuZW1pdCgwIC8qIFVORE8gKi8sIHVzKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgKiBSZWRvLiBQb3AgdGhlIGxhdGVzdCByZWRvIGFjdGlvbiBmcm9tIHRoZSBzdGFjayBhbmQgZGlzcGF0Y2ggaXQuIFRoaXMgZG9lcyBub3Qgc3RvcmUgYW55IHVuZG8gZGF0YSxcclxuICAgICogYXMgdGhlIGRpc3BhdGNoZXIgd2lsbCBkbyB0aGF0IHdoZW4gZGlzcGF0Y2hpbmcgdGhlIGFjdGlvbi5cclxuICAgICovXHJcbiAgICBVbmRvTWFuYWdlci5wcm90b3R5cGUucmVkbyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgcnMgPSB0aGlzLnJlZG9zLnBvcCgpO1xyXG4gICAgICAgIGlmIChycykge1xyXG4gICAgICAgICAgICBycy5mb3JFYWNoKGZ1bmN0aW9uIChyKSB7XHJcbiAgICAgICAgICAgICAgICBleHBvcnRzLmdldERpc3BhdGNoZXIoKS5kaXNwYXRjaEFjdGlvbi5hcHBseShleHBvcnRzLmdldERpc3BhdGNoZXIoKSwgW3IuYWN0aW9uXS5jb25jYXQoci5kYXRhKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLmVtaXQoMSAvKiBSRURPICovLCBycyk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICogQ2xlYXIgYWxsIHN0YWNrc1xyXG4gICAgKi9cclxuICAgIFVuZG9NYW5hZ2VyLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLm1lbWVudG9zID0gW107XHJcbiAgICAgICAgdGhpcy5yZWRvcyA9IFtdO1xyXG4gICAgICAgIHRoaXMuZW1pdCgzIC8qIENMRUFSICovKTtcclxuICAgIH07XHJcblxyXG4gICAgVW5kb01hbmFnZXIucHJvdG90eXBlLmdldE1lbWVudG9zID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm1lbWVudG9zO1xyXG4gICAgfTtcclxuICAgIHJldHVybiBVbmRvTWFuYWdlcjtcclxufSkoRXZlbnRDaGFubmVsLkNoYW5uZWxlZEVtaXR0ZXIpO1xyXG5cclxuLyoqXHJcbiogU2luZ2xldG9uLlxyXG4qIEB0eXBlIHtVbmRvTWFuYWdlcn1cclxuKi9cclxudmFyIHVtID0gbmV3IFVuZG9NYW5hZ2VyKCk7XHJcblxyXG4vKipcclxuKiBHZXQgdGhlIHVuZG8gbWFuYWdlci4gUmV0dXJucyB0aGUgc2luZ2xlIGluc3RhbmNlLlxyXG4qIEByZXR1cm5zIHtVbmRvTWFuYWdlcn1cclxuKi9cclxuZnVuY3Rpb24gZ2V0VW5kb01hbmFnZXIoKSB7XHJcbiAgICByZXR1cm4gdW07XHJcbn1cclxuZXhwb3J0cy5nZXRVbmRvTWFuYWdlciA9IGdldFVuZG9NYW5hZ2VyO1xyXG4iLCIvKipcclxuKiBDcmVhdGVkIGJ5IFN0ZXBoYW4uU21vbGEgb24gMjguMTAuMjAxNC5cclxuKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5cclxuLyoqXHJcbiogQW4gZXZlbnQtZW1pdHRlclxyXG4qL1xyXG52YXIgRW1pdHRlciA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBFbWl0dGVyKCkge1xyXG4gICAgfVxyXG4gICAgRW1pdHRlci5wcm90b3R5cGUuc3Vic2NyaWJlID0gZnVuY3Rpb24gKGV2ZW50LCBoYW5kbGVyKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9ldmVudEhhbmRsZXJzKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2V2ZW50SGFuZGxlcnMgPSB7fTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5fZXZlbnRIYW5kbGVyc1tldmVudF0pIHtcclxuICAgICAgICAgICAgdGhpcy5fZXZlbnRIYW5kbGVyc1tldmVudF0gPSBbXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuX2V2ZW50SGFuZGxlcnNbZXZlbnRdLnB1c2goaGFuZGxlcik7XHJcbiAgICB9O1xyXG5cclxuICAgIEVtaXR0ZXIucHJvdG90eXBlLnVuc3Vic2NyaWJlID0gZnVuY3Rpb24gKGV2ZW50LCBoYW5kbGVyKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9ldmVudEhhbmRsZXJzKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuX2V2ZW50SGFuZGxlcnNbZXZlbnRdKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2V2ZW50SGFuZGxlcnNbZXZlbnRdLnNwbGljZSh0aGlzLl9ldmVudEhhbmRsZXJzW2V2ZW50XS5pbmRleE9mKGhhbmRsZXIpLCAxKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFbWl0dGVyLnByb3RvdHlwZSwgXCJldmVudEhhbmRsZXJzXCIsIHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2V2ZW50SGFuZGxlcnM7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgRW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgIHZhciBhcmdzID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IChhcmd1bWVudHMubGVuZ3RoIC0gMSk7IF9pKyspIHtcclxuICAgICAgICAgICAgYXJnc1tfaV0gPSBhcmd1bWVudHNbX2kgKyAxXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICAgIGlmICh0aGlzLl9ldmVudEhhbmRsZXJzICYmIHRoaXMuX2V2ZW50SGFuZGxlcnNbZXZlbnRdKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2V2ZW50SGFuZGxlcnNbZXZlbnRdLmZvckVhY2goZnVuY3Rpb24gKGhhbmRsZXIpIHtcclxuICAgICAgICAgICAgICAgIGhhbmRsZXIuYXBwbHkodGhhdCwgYXJncyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgRW1pdHRlci5wcm90b3R5cGUucmVsYXkgPSBmdW5jdGlvbiAoZW1pdHRlciwgc3Vic2NyaWJpbmdFdmVudCwgZW1pdHRpbmdFdmVudCkge1xyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgICAgICBlbWl0dGVyLnN1YnNjcmliZShzdWJzY3JpYmluZ0V2ZW50LCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciBhcmdzID0gW107XHJcbiAgICAgICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCAoYXJndW1lbnRzLmxlbmd0aCAtIDApOyBfaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBhcmdzW19pXSA9IGFyZ3VtZW50c1tfaSArIDBdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoYXQuZW1pdC5hcHBseSh0aGF0LCBbZW1pdHRpbmdFdmVudF0uY29uY2F0KGFyZ3MpKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbiAgICByZXR1cm4gRW1pdHRlcjtcclxufSkoKTtcclxuZXhwb3J0cy5FbWl0dGVyID0gRW1pdHRlcjtcclxuIiwiLyoqXHJcbiogQ3JlYXRlZCBieSBTdGVwaGFuLlNtb2xhIG9uIDMwLjEwLjIwMTQuXHJcbiovXHJcblwidXNlIHN0cmljdFwiO1xyXG52YXIgX19leHRlbmRzID0gdGhpcy5fX2V4dGVuZHMgfHwgZnVuY3Rpb24gKGQsIGIpIHtcclxuICAgIGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdO1xyXG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XHJcbiAgICBfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZTtcclxuICAgIGQucHJvdG90eXBlID0gbmV3IF9fKCk7XHJcbn07XHJcbnZhciBFdmVudENoYW5uZWwgPSByZXF1aXJlKFwiLi9ldmVudENoYW5uZWxcIik7XHJcblxyXG4oZnVuY3Rpb24gKEVWRU5UUykge1xyXG4gICAgRVZFTlRTW0VWRU5UU1tcIkVSUk9SXCJdID0gMF0gPSBcIkVSUk9SXCI7XHJcbiAgICBFVkVOVFNbRVZFTlRTW1wiRkFUQUxcIl0gPSAxXSA9IFwiRkFUQUxcIjtcclxuICAgIEVWRU5UU1tFVkVOVFNbXCJGUkFNRVdPUktcIl0gPSAyXSA9IFwiRlJBTUVXT1JLXCI7XHJcbiAgICBFVkVOVFNbRVZFTlRTW1wiQ0xFQVJcIl0gPSAzXSA9IFwiQ0xFQVJcIjtcclxufSkoZXhwb3J0cy5FVkVOVFMgfHwgKGV4cG9ydHMuRVZFTlRTID0ge30pKTtcclxudmFyIEVWRU5UUyA9IGV4cG9ydHMuRVZFTlRTO1xyXG5cclxudmFyIEVycm9ySGFuZGxlciA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XHJcbiAgICBfX2V4dGVuZHMoRXJyb3JIYW5kbGVyLCBfc3VwZXIpO1xyXG4gICAgZnVuY3Rpb24gRXJyb3JIYW5kbGVyKCkge1xyXG4gICAgICAgIF9zdXBlci5jYWxsKHRoaXMsIFwiRVJST1JcIik7XHJcbiAgICAgICAgLypcclxuICAgICAgICBpZiAod2luZG93KSB7XHJcbiAgICAgICAgd2luZG93Lm9uZXJyb3IgPSBmdW5jdGlvbihlcnJvciwgdXJsLCBsaW5lKSB7XHJcbiAgICAgICAgdGhpcy5mYXRhbChlcnJvciArIFwiXFxuaW46IFwiICsgdXJsICsgXCJcXG5saW5lOiBcIiArIGxpbmUsIHdpbmRvdyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAqL1xyXG4gICAgfVxyXG4gICAgRXJyb3JIYW5kbGVyLnByb3RvdHlwZS5lcnJvciA9IGZ1bmN0aW9uIChtZXNzYWdlLCB0aGF0KSB7XHJcbiAgICAgICAgdGhpcy5lbWl0KDAgLyogRVJST1IgKi8sIG1lc3NhZ2UsIHRoYXQpO1xyXG4gICAgfTtcclxuXHJcbiAgICBFcnJvckhhbmRsZXIucHJvdG90eXBlLmZhdGFsID0gZnVuY3Rpb24gKG1lc3NhZ2UsIHRoYXQpIHtcclxuICAgICAgICB0aGlzLmVtaXQoMSAvKiBGQVRBTCAqLywgbWVzc2FnZSwgdGhhdCk7XHJcbiAgICB9O1xyXG5cclxuICAgIEVycm9ySGFuZGxlci5wcm90b3R5cGUuZnJhbWV3b3JrID0gZnVuY3Rpb24gKG1lc3NhZ2UsIGV4Y2VwdGlvbiwgdGhhdCkge1xyXG4gICAgICAgIHRocm93IGV4Y2VwdGlvbjtcclxuICAgIH07XHJcbiAgICByZXR1cm4gRXJyb3JIYW5kbGVyO1xyXG59KShFdmVudENoYW5uZWwuQ2hhbm5lbGVkRW1pdHRlcik7XHJcblxyXG52YXIgZXJyb3JIYW5kbGVyID0gbmV3IEVycm9ySGFuZGxlcigpO1xyXG5mdW5jdGlvbiBnZXRFcnJvckhhbmRsZXIoKSB7XHJcbiAgICByZXR1cm4gZXJyb3JIYW5kbGVyO1xyXG59XHJcbmV4cG9ydHMuZ2V0RXJyb3JIYW5kbGVyID0gZ2V0RXJyb3JIYW5kbGVyO1xyXG5cclxuZnVuY3Rpb24gZXJyb3IobWVzc2FnZSwgdGhhdCkge1xyXG4gICAgcmV0dXJuIGVycm9ySGFuZGxlci5lcnJvcihtZXNzYWdlLCB0aGF0KTtcclxufVxyXG5leHBvcnRzLmVycm9yID0gZXJyb3I7XHJcblxyXG5mdW5jdGlvbiBmYXRhbChtZXNzYWdlLCB0aGF0KSB7XHJcbiAgICByZXR1cm4gZXJyb3JIYW5kbGVyLmZhdGFsKG1lc3NhZ2UsIHRoYXQpO1xyXG59XHJcbmV4cG9ydHMuZmF0YWwgPSBmYXRhbDtcclxuXHJcbmZ1bmN0aW9uIGZyYW1ld29yayhtZXNzYWdlLCBleGNlb3Rpb24sIHRoYXQpIHtcclxuICAgIHJldHVybiBlcnJvckhhbmRsZXIuZnJhbWV3b3JrKG1lc3NhZ2UsIGV4Y2VvdGlvbiwgdGhhdCk7XHJcbn1cclxuZXhwb3J0cy5mcmFtZXdvcmsgPSBmcmFtZXdvcms7XHJcbiIsIi8qKlxyXG4qIENyZWF0ZWQgYnkgU3RlcGhhbi5TbW9sYSBvbiAyOC4xMC4yMDE0LlxyXG4qL1xyXG5cInVzZSBzdHJpY3RcIjtcclxudmFyIF9fZXh0ZW5kcyA9IHRoaXMuX19leHRlbmRzIHx8IGZ1bmN0aW9uIChkLCBiKSB7XHJcbiAgICBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTtcclxuICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxyXG4gICAgX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGU7XHJcbiAgICBkLnByb3RvdHlwZSA9IG5ldyBfXygpO1xyXG59O1xyXG52YXIgRW1pdHRlciA9IHJlcXVpcmUoXCIuL2VtaXR0ZXJcIik7XHJcbnZhciBTdHJlYW0gPSByZXF1aXJlKFwiLi9zdHJlYW1cIik7XHJcblxyXG52YXIgRXZlbnRDaGFubmVsID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIEV2ZW50Q2hhbm5lbCgpIHtcclxuICAgICAgICB0aGlzLl9ldmVudEhhbmRsZXJzID0ge307XHJcbiAgICB9XHJcbiAgICBFdmVudENoYW5uZWwucHJvdG90eXBlLnN1YnNjcmliZSA9IGZ1bmN0aW9uIChlbWl0dGVyLCBldmVudCwgaGFuZGxlcikge1xyXG4gICAgICAgIGlmICghdGhpcy5fZXZlbnRIYW5kbGVyc1tlbWl0dGVyXSkge1xyXG4gICAgICAgICAgICB0aGlzLl9ldmVudEhhbmRsZXJzW2VtaXR0ZXJdID0ge307XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIXRoaXMuX2V2ZW50SGFuZGxlcnNbZW1pdHRlcl1bZXZlbnRdKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2V2ZW50SGFuZGxlcnNbZW1pdHRlcl1bZXZlbnRdID0gW107XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl9ldmVudEhhbmRsZXJzW2VtaXR0ZXJdW2V2ZW50XS5wdXNoKGhhbmRsZXIpO1xyXG4gICAgfTtcclxuXHJcbiAgICBFdmVudENoYW5uZWwucHJvdG90eXBlLnVuc3Vic2NyaWJlID0gZnVuY3Rpb24gKGVtaXR0ZXIsIGV2ZW50LCBoYW5kbGVyKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2V2ZW50SGFuZGxlcnNbZW1pdHRlcl0pIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuX2V2ZW50SGFuZGxlcnNbZW1pdHRlcl1bZXZlbnRdKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9ldmVudEhhbmRsZXJzW2VtaXR0ZXJdW2V2ZW50XS5zcGxpY2UodGhpcy5fZXZlbnRIYW5kbGVyc1tlbWl0dGVyXVtldmVudF0uaW5kZXhPZihoYW5kbGVyKSwgMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIEV2ZW50Q2hhbm5lbC5wcm90b3R5cGUuY2hhbm5lbEVtaXQgPSBmdW5jdGlvbiAoZW1pdHRlciwgZW1pdHRlcklELCBldmVudCwgYXJncykge1xyXG4gICAgICAgIGlmICh0aGlzLl9ldmVudEhhbmRsZXJzICYmIHRoaXMuX2V2ZW50SGFuZGxlcnNbZW1pdHRlcklEXSAmJiB0aGlzLl9ldmVudEhhbmRsZXJzW2VtaXR0ZXJJRF1bZXZlbnRdKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2V2ZW50SGFuZGxlcnNbZW1pdHRlcklEXVtldmVudF0uZm9yRWFjaChmdW5jdGlvbiAoaGFuZGxlcikge1xyXG4gICAgICAgICAgICAgICAgaGFuZGxlci5hcHBseShlbWl0dGVyLCBhcmdzKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBFdmVudENoYW5uZWwucHJvdG90eXBlLnVuc3Vic2NyaWJlQWxsID0gZnVuY3Rpb24gKGVtaXR0ZXJJRCkge1xyXG4gICAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudEhhbmRsZXJzW2VtaXR0ZXJJRF07XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIEV2ZW50Q2hhbm5lbDtcclxufSkoKTtcclxuXHJcbnZhciBldmVudENoYW5uZWwgPSBuZXcgRXZlbnRDaGFubmVsKCk7XHJcblxyXG4vL2V4cG9ydCB2YXIgY2hhbm5lbDpJRXZlbnRDaGFubmVsID0gZXZlbnRDaGFubmVsO1xyXG5mdW5jdGlvbiBnZXRDaGFubmVsKCkge1xyXG4gICAgcmV0dXJuIGV2ZW50Q2hhbm5lbDtcclxufVxyXG5leHBvcnRzLmdldENoYW5uZWwgPSBnZXRDaGFubmVsO1xyXG5cclxuZnVuY3Rpb24gc3Vic2NyaWJlKGVtaXR0ZXIsIGV2ZW50LCBoYW5kbGVyKSB7XHJcbiAgICBldmVudENoYW5uZWwuc3Vic2NyaWJlKGVtaXR0ZXIsIGV2ZW50LCBoYW5kbGVyKTtcclxufVxyXG5leHBvcnRzLnN1YnNjcmliZSA9IHN1YnNjcmliZTtcclxuXHJcbmZ1bmN0aW9uIHVuc3Vic2NyaWJlKGVtaXR0ZXIsIGV2ZW50LCBoYW5kbGVyKSB7XHJcbiAgICBldmVudENoYW5uZWwudW5zdWJzY3JpYmUoZW1pdHRlciwgZXZlbnQsIGhhbmRsZXIpO1xyXG59XHJcbmV4cG9ydHMudW5zdWJzY3JpYmUgPSB1bnN1YnNjcmliZTtcclxuXHJcbmZ1bmN0aW9uIGNoYW5uZWxFbWl0KGVtaXR0ZXJJRCwgZXZlbnQpIHtcclxuICAgIHZhciBhcmdzID0gW107XHJcbiAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgKGFyZ3VtZW50cy5sZW5ndGggLSAyKTsgX2krKykge1xyXG4gICAgICAgIGFyZ3NbX2ldID0gYXJndW1lbnRzW19pICsgMl07XHJcbiAgICB9XHJcbiAgICBldmVudENoYW5uZWwuY2hhbm5lbEVtaXQobnVsbCwgZW1pdHRlcklELCBldmVudCwgYXJncyk7XHJcbn1cclxuZXhwb3J0cy5jaGFubmVsRW1pdCA9IGNoYW5uZWxFbWl0O1xyXG5cclxuZnVuY3Rpb24gdW5zdWJzY3JpYmVBbGwoZW1pdHRlcklEKSB7XHJcbiAgICBldmVudENoYW5uZWwudW5zdWJzY3JpYmVBbGwoZW1pdHRlcklEKTtcclxufVxyXG5leHBvcnRzLnVuc3Vic2NyaWJlQWxsID0gdW5zdWJzY3JpYmVBbGw7XHJcblxyXG52YXIgZW1pdHRlcklEcyA9IFtdO1xyXG5cclxuXHJcbnZhciBDaGFubmVsZWRFbWl0dGVyID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcclxuICAgIF9fZXh0ZW5kcyhDaGFubmVsZWRFbWl0dGVyLCBfc3VwZXIpO1xyXG4gICAgZnVuY3Rpb24gQ2hhbm5lbGVkRW1pdHRlcihfZW1pdHRlcklEKSB7XHJcbiAgICAgICAgX3N1cGVyLmNhbGwodGhpcyk7XHJcblxyXG4gICAgICAgIGlmIChfZW1pdHRlcklEKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZW1pdHRlcklEID0gX2VtaXR0ZXJJRDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmVtaXR0ZXJJRCA9IFwiRW1pdHRlclwiICsgZW1pdHRlcklEcy5sZW5ndGg7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoZW1pdHRlcklEcy5pbmRleE9mKHRoaXMuZW1pdHRlcklEKSAhPT0gLTEpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRHVwbGljYXRlIGVtaXR0ZXJJRC4gVGhpcyBpcyBub3Qgc3VwcG9ydGVkXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIENoYW5uZWxlZEVtaXR0ZXIucHJvdG90eXBlLnN1YnNjcmliZSA9IGZ1bmN0aW9uIChldmVudCwgaGFuZGxlcikge1xyXG4gICAgICAgIF9zdXBlci5wcm90b3R5cGUuc3Vic2NyaWJlLmNhbGwodGhpcywgZXZlbnQsIGhhbmRsZXIpO1xyXG4gICAgICAgIC8vY29uc29sZS5sb2coXCJDb25zaWRlciB1c2luZyB0aGUgRXZlbnRDaGFubmVsIGluc3RlYWQgb2Ygc3Vic2NyaWJpbmcgZGlyZWN0bHkgdG8gdGhlIFwiICsgdGhpcy5lbWl0dGVySUQpO1xyXG4gICAgfTtcclxuXHJcbiAgICBDaGFubmVsZWRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgdmFyIGFyZ3MgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgKGFyZ3VtZW50cy5sZW5ndGggLSAxKTsgX2krKykge1xyXG4gICAgICAgICAgICBhcmdzW19pXSA9IGFyZ3VtZW50c1tfaSArIDFdO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBObyBzdXBlciBjYWxsIGJlY2F1c2UgcGFzc2luZyByZXN0IHBhcmFtZXRlcnMgdG8gYSBzdXBlciBtZXRob2QgaXMga2luZCBvZiBhd2t3YXJkIGFuZCBoYWNreVxyXG4gICAgICAgIC8vIGh0dHBzOi8vdHlwZXNjcmlwdC5jb2RlcGxleC5jb20vZGlzY3Vzc2lvbnMvNTQ0Nzk3XHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICAgIGlmICh0aGlzLmV2ZW50SGFuZGxlcnMgJiYgdGhpcy5ldmVudEhhbmRsZXJzW2V2ZW50XSkge1xyXG4gICAgICAgICAgICB0aGlzLmV2ZW50SGFuZGxlcnNbZXZlbnRdLmZvckVhY2goZnVuY3Rpb24gKGhhbmRsZXIpIHtcclxuICAgICAgICAgICAgICAgIGhhbmRsZXIuYXBwbHkodGhhdCwgYXJncyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZXZlbnRDaGFubmVsLmNoYW5uZWxFbWl0KHRoaXMsIHRoaXMuZW1pdHRlcklELCBldmVudCwgYXJncyk7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIENoYW5uZWxlZEVtaXR0ZXI7XHJcbn0pKEVtaXR0ZXIuRW1pdHRlcik7XHJcbmV4cG9ydHMuQ2hhbm5lbGVkRW1pdHRlciA9IENoYW5uZWxlZEVtaXR0ZXI7XHJcblxyXG52YXIgRXZlbnRTdHJlYW0gPSAoZnVuY3Rpb24gKF9zdXBlcikge1xyXG4gICAgX19leHRlbmRzKEV2ZW50U3RyZWFtLCBfc3VwZXIpO1xyXG4gICAgZnVuY3Rpb24gRXZlbnRTdHJlYW0obmFtZSwgX2VtaXR0ZXJJRCwgX2V2ZW50KSB7XHJcbiAgICAgICAgX3N1cGVyLmNhbGwodGhpcywgbmFtZSk7XHJcbiAgICAgICAgdGhpcy5fZW1pdHRlcklEID0gX2VtaXR0ZXJJRDtcclxuICAgICAgICB0aGlzLl9ldmVudCA9IF9ldmVudDtcclxuICAgICAgICB0aGlzLl9oYW5kbGVyID0gdGhpcy5oYW5kbGVFdmVudC5iaW5kKHRoaXMpO1xyXG4gICAgICAgIGV4cG9ydHMuc3Vic2NyaWJlKHRoaXMuX2VtaXR0ZXJJRCwgX2V2ZW50LCB0aGlzLl9oYW5kbGVyKTtcclxuICAgIH1cclxuICAgIEV2ZW50U3RyZWFtLnByb3RvdHlwZS5oYW5kbGVFdmVudCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgYXJncyA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCAoYXJndW1lbnRzLmxlbmd0aCAtIDApOyBfaSsrKSB7XHJcbiAgICAgICAgICAgIGFyZ3NbX2ldID0gYXJndW1lbnRzW19pICsgMF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMucHVzaCh7XHJcbiAgICAgICAgICAgIGVtaXR0ZXI6IHRoaXMuX2VtaXR0ZXJJRCxcclxuICAgICAgICAgICAgZXZlbnQ6IHRoaXMuX2V2ZW50LFxyXG4gICAgICAgICAgICBhcmdzOiBhcmdzXHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEV2ZW50U3RyZWFtLnByb3RvdHlwZS5kaXNwb3NlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIF9zdXBlci5wcm90b3R5cGUuZGlzcG9zZS5jYWxsKHRoaXMpO1xyXG4gICAgICAgIGV4cG9ydHMudW5zdWJzY3JpYmUodGhpcy5fZW1pdHRlcklELCB0aGlzLl9ldmVudCwgdGhpcy5faGFuZGxlcik7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIEV2ZW50U3RyZWFtO1xyXG59KShTdHJlYW0uU3RyZWFtKTtcclxuXHJcbi8qKlxyXG4qIENyZWF0ZXMgYSBzdHJlYW0gZm9yIGEgY2hhbm5lbGVkIGV2ZW50LiBJZiAgbW9yIHRoYW4gb25lIGV2ZW50IGlzIGdpdmVuLCBhIGNvbWJpbmVkXHJcbiogc3RyZWFtIGZvciBhbGwgZXZlbnRzIGlzIGNyZWF0ZWRcclxuKlxyXG4qIEBwYXJhbSBuYW1lXHJcbiogQHBhcmFtIGVtaXR0ZXJJRFxyXG4qIEBwYXJhbSBldmVudHNcclxuKiBAcmV0dXJucyB7bnVsbH1cclxuKi9cclxuZnVuY3Rpb24gY3JlYXRlRXZlbnRTdHJlYW0oZW1pdHRlcklEKSB7XHJcbiAgICB2YXIgZXZlbnRzID0gW107XHJcbiAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgKGFyZ3VtZW50cy5sZW5ndGggLSAxKTsgX2krKykge1xyXG4gICAgICAgIGV2ZW50c1tfaV0gPSBhcmd1bWVudHNbX2kgKyAxXTtcclxuICAgIH1cclxuICAgIHZhciBzdHJlYW0gPSBudWxsO1xyXG5cclxuICAgIGV2ZW50cy5mb3JFYWNoKGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgIHZhciBlU3RyZWFtID0gbmV3IEV2ZW50U3RyZWFtKGVtaXR0ZXJJRCArIFwiLVwiICsgZXZlbnQsIGVtaXR0ZXJJRCwgZXZlbnQpO1xyXG4gICAgICAgIGlmIChzdHJlYW0pIHtcclxuICAgICAgICAgICAgc3RyZWFtID0gc3RyZWFtLmNvbWJpbmUoZVN0cmVhbSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgc3RyZWFtID0gZVN0cmVhbTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gc3RyZWFtO1xyXG59XHJcbmV4cG9ydHMuY3JlYXRlRXZlbnRTdHJlYW0gPSBjcmVhdGVFdmVudFN0cmVhbTtcclxuIiwiLyoqXHJcbiogQ3JlYXRlZCBieSBzdGVwaGFuIG9uIDAxLjExLjE0LlxyXG4qL1xyXG5cInVzZSBzdHJpY3RcIjtcclxudmFyIF9fZXh0ZW5kcyA9IHRoaXMuX19leHRlbmRzIHx8IGZ1bmN0aW9uIChkLCBiKSB7XHJcbiAgICBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTtcclxuICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxyXG4gICAgX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGU7XHJcbiAgICBkLnByb3RvdHlwZSA9IG5ldyBfXygpO1xyXG59O1xyXG52YXIgRGlzcGF0Y2hlciA9IHJlcXVpcmUoXCIuL2Rpc3BhdGNoZXJcIik7XHJcbnZhciBFdmVudENoYW5uZWwgPSByZXF1aXJlKFwiLi9ldmVudENoYW5uZWxcIik7XHJcbnZhciBCYXNlQWN0aW9ucyA9IHJlcXVpcmUoXCIuL2Jhc2VBY3Rpb25zXCIpO1xyXG52YXIgVG9vbHMgPSByZXF1aXJlKFwiLi90b29sc1wiKTtcclxuXHJcblxyXG5cclxuXHJcblxyXG4vKipcclxuKiBCYXNlIGltcGxlbWVudGF0aW9uIGZvciBhIHBsdWdpbi4gRG9lcyBhYnNvbHV0ZWx5IG5vdGhpbmcuXHJcbiovXHJcbnZhciBCYXNlUGx1Z2luID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIEJhc2VQbHVnaW4oKSB7XHJcbiAgICB9XHJcbiAgICBCYXNlUGx1Z2luLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoY29udGFpbmVyLCBhY3Rpb24pIHtcclxuICAgICAgICB2YXIgYXJncyA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCAoYXJndW1lbnRzLmxlbmd0aCAtIDIpOyBfaSsrKSB7XHJcbiAgICAgICAgICAgIGFyZ3NbX2ldID0gYXJndW1lbnRzW19pICsgMl07XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBCYXNlUGx1Z2luLnByb3RvdHlwZS5hZnRlckZpbmlzaCA9IGZ1bmN0aW9uIChjb250YWluZXIsIGFjdGlvbikge1xyXG4gICAgICAgIHZhciBhcmdzID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IChhcmd1bWVudHMubGVuZ3RoIC0gMik7IF9pKyspIHtcclxuICAgICAgICAgICAgYXJnc1tfaV0gPSBhcmd1bWVudHNbX2kgKyAyXTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIEJhc2VQbHVnaW4ucHJvdG90eXBlLmFmdGVyQWJvcnQgPSBmdW5jdGlvbiAoY29udGFpbmVyLCBhY3Rpb24pIHtcclxuICAgICAgICB2YXIgYXJncyA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCAoYXJndW1lbnRzLmxlbmd0aCAtIDIpOyBfaSsrKSB7XHJcbiAgICAgICAgICAgIGFyZ3NbX2ldID0gYXJndW1lbnRzW19pICsgMl07XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBCYXNlUGx1Z2luLnByb3RvdHlwZS5nZXRNZW1lbnRvID0gZnVuY3Rpb24gKGNvbnRhaW5lciwgYWN0aW9uKSB7XHJcbiAgICAgICAgdmFyIGFyZ3MgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgKGFyZ3VtZW50cy5sZW5ndGggLSAyKTsgX2krKykge1xyXG4gICAgICAgICAgICBhcmdzW19pXSA9IGFyZ3VtZW50c1tfaSArIDJdO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH07XHJcblxyXG4gICAgQmFzZVBsdWdpbi5wcm90b3R5cGUucmVzdG9yZUZyb21NZW1lbnRvID0gZnVuY3Rpb24gKGNvbnRhaW5lciwgbWVtZW50bykge1xyXG4gICAgfTtcclxuXHJcbiAgICBCYXNlUGx1Z2luLnByb3RvdHlwZS5ob2xkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgfTtcclxuXHJcbiAgICBCYXNlUGx1Z2luLnByb3RvdHlwZS5yZWxlYXNlID0gZnVuY3Rpb24gKGFjdGlvbikge1xyXG4gICAgfTtcclxuXHJcbiAgICBCYXNlUGx1Z2luLnByb3RvdHlwZS5hYm9ydCA9IGZ1bmN0aW9uIChhY3Rpb24pIHtcclxuICAgIH07XHJcbiAgICByZXR1cm4gQmFzZVBsdWdpbjtcclxufSkoKTtcclxuZXhwb3J0cy5CYXNlUGx1Z2luID0gQmFzZVBsdWdpbjtcclxuXHJcbi8qKlxyXG4qIENyZWF0ZSBhIFBsdWdpbi4gVXNlIHRoaXMgd2hlbiB5b3UncmUgdXNpbmcgcGxhaW4gSmF2YVNjcmlwdC5cclxuKiBAcGFyYW0gc3BlY1xyXG4qIEByZXR1cm5zIHthbnl9XHJcbiovXHJcbmZ1bmN0aW9uIGNyZWF0ZVBsdWdpbihzcGVjKSB7XHJcbiAgICByZXR1cm4gVG9vbHMuc3ViY2xhc3Moc3BlYywgQmFzZVBsdWdpbik7XHJcbn1cclxuZXhwb3J0cy5jcmVhdGVQbHVnaW4gPSBjcmVhdGVQbHVnaW47XHJcblxyXG4vKipcclxuKiBCYXNlIGltcGxlbWVudGF0aW9uIGZvciBhIHBsdWdpbiBjb250YWluZXIuXHJcbiovXHJcbnZhciBQbHVnaW5Db250YWluZXIgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xyXG4gICAgX19leHRlbmRzKFBsdWdpbkNvbnRhaW5lciwgX3N1cGVyKTtcclxuICAgIGZ1bmN0aW9uIFBsdWdpbkNvbnRhaW5lcihlbWl0dGVySWQpIHtcclxuICAgICAgICBfc3VwZXIuY2FsbCh0aGlzLCBlbWl0dGVySWQgfHwgXCJDb250YWluZXJcIiArIFRvb2xzLm9pZCh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy5fcGx1Z2lucyA9IHt9O1xyXG4gICAgICAgIHRoaXMuX2FueVBsdWdpbnMgPSBbXTtcclxuICAgICAgICB0aGlzLl9wcm90b2NvbHMgPSB7fTtcclxuICAgICAgICB0aGlzLl9ydW5uaW5nUGx1Z2lucyA9IHt9O1xyXG4gICAgICAgIHRoaXMuX21lbWVudG9zID0ge307XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xNjA2Nzk3L3VzZS1vZi1hcHBseS13aXRoLW5ldy1vcGVyYXRvci1pcy10aGlzLXBvc3NpYmxlXHJcbiAgICAqIEBwYXJhbSBjb25maWdcclxuICAgICovXHJcbiAgICBQbHVnaW5Db250YWluZXIucHJvdG90eXBlLmNvbmZpZ3VyZSA9IGZ1bmN0aW9uIChjb25maWcpIHtcclxuICAgICAgICBmdW5jdGlvbiBjb25zdHJ1Y3QoY29uc3RydWN0b3IsIGFyZ3MpIHtcclxuICAgICAgICAgICAgZnVuY3Rpb24gRigpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0cnVjdG9yLmFwcGx5KHRoaXMsIGFyZ3MpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIEYucHJvdG90eXBlID0gY29uc3RydWN0b3IucHJvdG90eXBlO1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IEYoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgICAgICBjb25maWcuZm9yRWFjaChmdW5jdGlvbiAoYWN0aW9uKSB7XHJcbiAgICAgICAgICAgIGFjdGlvbi5wbHVnaW5zLmZvckVhY2goZnVuY3Rpb24gKHBsdWdpbikge1xyXG4gICAgICAgICAgICAgICAgaWYgKHBsdWdpbi5wbHVnaW4pIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGF0LndyYXAoYWN0aW9uLmFjdGlvbiwgY29uc3RydWN0KHBsdWdpbi5wbHVnaW4sIHBsdWdpbi5wYXJhbWV0ZXJzKSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQud3JhcChhY3Rpb24uYWN0aW9uLCBuZXcgcGx1Z2luKCkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgUGx1Z2luQ29udGFpbmVyLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGZvciAodmFyIGFjdGlvbiBpbiB0aGlzLl9wbHVnaW5zKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9wbHVnaW5zLmhhc093blByb3BlcnR5KGFjdGlvbikpIHtcclxuICAgICAgICAgICAgICAgIHZhciBsID0gdGhpcy5fcGx1Z2luc1thY3Rpb25dLmxlbmd0aDtcclxuXHJcbiAgICAgICAgICAgICAgICB3aGlsZSAobC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kZXRhY2goYWN0aW9uLCB0aGlzLl9wbHVnaW5zW2FjdGlvbl1bbF0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX2FueVBsdWdpbnMgPSBbXTtcclxuICAgICAgICB0aGlzLl9ydW5uaW5nUGx1Z2lucyA9IHt9O1xyXG4gICAgICAgIC8vVE9ETzogRmluZCBhIHdheSB0byB1bnN1YnNjcmliZSBmcm9tIHRoZSBEaXNwYXRjaGVyXHJcbiAgICB9O1xyXG5cclxuICAgIFBsdWdpbkNvbnRhaW5lci5wcm90b3R5cGUucGx1Z2luRG9uZSA9IGZ1bmN0aW9uIChhY3Rpb24sIGFib3J0KSB7XHJcbiAgICB9O1xyXG5cclxuICAgIFBsdWdpbkNvbnRhaW5lci5wcm90b3R5cGUuYWJvcnRBY3Rpb24gPSBmdW5jdGlvbiAoYWN0aW9uKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX3J1bm5pbmdQbHVnaW5zW2FjdGlvbl0gJiYgdGhpcy5fcnVubmluZ1BsdWdpbnNbYWN0aW9uXS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgdmFyIHBsZyA9IHRoaXMuX3J1bm5pbmdQbHVnaW5zW2FjdGlvbl1bdGhpcy5fcnVubmluZ1BsdWdpbnNbYWN0aW9uXS5sZW5ndGggLSAxXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChwbGcpIHtcclxuICAgICAgICAgICAgICAgIHBsZy5hYm9ydChhY3Rpb24pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl9ydW5uaW5nUGx1Z2luc1thY3Rpb25dID0gbnVsbDtcclxuICAgIH07XHJcblxyXG4gICAgUGx1Z2luQ29udGFpbmVyLnByb3RvdHlwZS5hYm9ydCA9IGZ1bmN0aW9uIChhY3Rpb24pIHtcclxuICAgICAgICBpZiAodHlwZW9mIGFjdGlvbiA9PT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBhY3Rpb25LZXkgaW4gdGhpcy5fcHJvdG9jb2xzKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fcHJvdG9jb2xzLmhhc093blByb3BlcnR5KGFjdGlvbktleSkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFib3J0QWN0aW9uKGFjdGlvbktleSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5fcHJvdG9jb2xzW2FjdGlvbl0pIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWJvcnRBY3Rpb24oYWN0aW9uKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAqIFRoaXMgaGFuZGxlcyBhbiBhY3Rpb24gc2VudCBieSB0aGUgZGlzcGF0Y2hlciBhbmQgZGVsZWdhdGVzIGl0IHRvIHRoZSBwbHVnaW5zLlxyXG4gICAgKiBQbHVnaW5zIGFyZSBcIndyYXBwZWRcIiBhcm91bmQgZWFjaCBvdGhlci4gVGhleSBidWlsZCBraW5kIG9mIGJyYWNrZXRzIGRlZmluZWQgYnkgdHdvIG9mXHJcbiAgICAqIHRoZWlyIG1ldGhvZHM6IHJ1biAtIG9wZW5zIHRoZSBicmFja2V0c1xyXG4gICAgKiAgICAgICAgICAgICAgICBmaW5pc2gvYWJvcnQgLSBjbG9zZXMgdGhlIGJyYWNrZXRzLlxyXG4gICAgKlxyXG4gICAgKiBXZSdsbCB0YWxrIGFib3V0IGZpbmlzaCBmcm9tIG5vdyBvbi4gVGhhdCBjYW4gYmUgcmVwbGFjZWQgYnkgYWJvcnQgZXZlcnl3aGVyZS4gVGhlIGZpcnN0IHBsdWdpbiB0byBhYm9ydFxyXG4gICAgKiBmb3JjZXMgYWxsIHN1Y2NlZWRpbmcgcGx1Z2lucyB0byBhYm9ydCBhcyB3ZWxsLlxyXG4gICAgKlxyXG4gICAgKiBTbyB3cmFwcGluZyBpbiB0aGUgb3JkZXIgQS0+Qi0+QyBsZWFkcyB0byB0aGVzZSBicmFja2V0czpcclxuICAgICpcclxuICAgICogIHJ1bkMtcnVuQi1ydW5BLWZpbmlzaEEtZmluaXNoQi1maW5pc2hDXHJcbiAgICAqXHJcbiAgICAqIGZpbmlzaCBpcyBvbmx5IGNhbGxlZCB3aGVuIHRoZSBwbHVnaW4gY2FsbHMgdGhlIGRvbmUtY2FsbGJhY2sgdGhhdCBpcyBwcm92aWRlZCB0byBpdHMgcnVuLW1ldGhvZC5cclxuICAgICpcclxuICAgICogU28gdG8gY29ycmVjdGx5IGV4ZWN1dGUgdGhpcyBcImNoYWluXCIgd2UgbmVlZCB0byB3YWl0IGZvciB0aGUgcGx1Z2lucyB0byBjYWxsIHRoZWlyIGRvbmUtY2FsbGJhY2tzIGJlZm9yZVxyXG4gICAgKiB3ZSBjYW4gcHJvY2VlZC4gQmVjYXVzZSB0aGUgcGx1Z2lucyBtYXkgY2FsbCB0aGVpciBkb25lLWNhbGxiYWNrIG91dHNpZGUgdGhlaXIgcnVuLW1ldGhvZCwgZS5nLiB0cmlnZ2VyZWQgYnlcclxuICAgICogdXNlciBpbnRlcmFjdGlvbiwgd2UgbmVlZCB0byBrZWVwIHRyYWNrIG9mIHdoYXQgdGhlIHBsdWdpbnMgZGlkIHVzaW5nIGEgcHJvdG9jb2wuXHJcbiAgICAqXHJcbiAgICAqIFRoYXQgcHJvdG9jb2wgbG9va3MgbGlrZSB0aGlzOlxyXG4gICAgKlxyXG4gICAgKiAge1xyXG4gICAgKiAgICBpOiB7IGRvbmU6IEEgZnVuY3Rpb24gdGhhdCBjYWxscyBlaXRoZXIgZmluaXNoIG9yIGFib3J0IG9uIHRoZSBpLXRoIHBsdWdpbixcclxuICAgICogICAgICAgICBhYm9ydDogZGlkIHRoZSBwbHVnaW4gYWJvcnQ/XHJcbiAgICAqXHJcbiAgICAqICAgIGkrMTogLi4uXHJcbiAgICAqICB9XHJcbiAgICAqXHJcbiAgICAqIHRoaXMgcHJvdG9jb2wgaXMgaW5pdGlhbGl6ZWQgYnkgbnVsbCBlbnRyaWVzIGZvciBhbGwgcGx1Z2lucy4gVGhlbiB0aGUgcnVuLW1ldGhvZHMgZm9yIGFsbCBwbHVnaW5zIGFyZSBjYWxsZWQsIGdpdmluZyB0aGVtIGEgZG9uZVxyXG4gICAgKiBjYWxsYmFjaywgdGhhdCBmaWxscyB0aGUgcHJvdG9jb2wuXHJcbiAgICAqXHJcbiAgICAqIEFmdGVyIGV2ZXJ5IHJ1bi1tZXRob2Qgd2UgY2hlY2sgaWYgd2UncmUgYXQgdGhlIGlubmVybW9zdCBwbHVnaW4gKEEgaW4gdGhlIGV4YW1wbGUgYWJvdmUsIHRoZSBvbmUgdGhhdCBmaXJzdCB3cmFwcGVkIHRoZSBhY3Rpb24pLlxyXG4gICAgKiBJZiB3ZSBhcmUsIHdlIHdvcmsgdGhyb3VnaCB0aGUgcHJvdG9jb2wgYXMgbG9uZyBhcyB0aGVyZSBhcmUgdmFsaWQgZW50cmllcy4gVGhlbiB3ZSB3YWl0IGZvciB0aGUgbmV4dCBkb25lLWNhbGxiYWNrIHRvIGJlIGNhbGxlZC5cclxuICAgICpcclxuICAgICogQHBhcmFtIGFjdGlvblxyXG4gICAgKiBAcGFyYW0gYXJnc1xyXG4gICAgKi9cclxuICAgIFBsdWdpbkNvbnRhaW5lci5wcm90b3R5cGUuZG9IYW5kbGVBY3Rpb24gPSBmdW5jdGlvbiAocGx1Z2lucywgYWN0aW9uLCBhcmdzKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX3J1bm5pbmdQbHVnaW5zW2FjdGlvbl0gJiYgdGhpcy5fcnVubmluZ1BsdWdpbnNbYWN0aW9uXS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRVJST1IgY2FsbGluZyBhY3Rpb24gXCIgKyBhY3Rpb24gKyBcIi4gU2FtZSBhY3Rpb24gY2Fubm90IGJlIGNhbGxlZCBpbnNpZGUgaXRzZWxmIVwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgdmFyIGNvbXBvc2VBcmdzID0gZnVuY3Rpb24gKHBsdWdpbiwgYWN0aW9uKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBbdGhhdCwgYWN0aW9uXS5jb25jYXQoYXJncyk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5fbWVtZW50b3NbYWN0aW9uXSA9IFtdO1xyXG4gICAgICAgIHRoaXMuX3J1bm5pbmdQbHVnaW5zW2FjdGlvbl0gPSBbXTtcclxuICAgICAgICB0aGlzLl9wcm90b2NvbHNbYWN0aW9uXSA9IFtdO1xyXG4gICAgICAgIHBsdWdpbnMuZm9yRWFjaChmdW5jdGlvbiAocGx1Z2luKSB7XHJcbiAgICAgICAgICAgIHRoYXQuX3Byb3RvY29sc1thY3Rpb25dLnB1c2goMCk7XHJcbiAgICAgICAgICAgIHRoYXQuX3J1bm5pbmdQbHVnaW5zW2FjdGlvbl0ucHVzaChwbHVnaW4pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB2YXIgYWJvcnRlZCA9IGZhbHNlO1xyXG4gICAgICAgIHBsdWdpbnMuZm9yRWFjaChmdW5jdGlvbiAocGx1Z2luLCBpKSB7XHJcbiAgICAgICAgICAgIChmdW5jdGlvbiAoaW5kZXgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBkb25lID0gZnVuY3Rpb24gKGFib3J0LCBkb25lQWN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggPSB0aGF0LmdldFBsdWdpbnNGb3JBY3Rpb24oZG9uZUFjdGlvbikuaW5kZXhPZihwbHVnaW4pO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQuX3Byb3RvY29sc1tkb25lQWN0aW9uXVtpbmRleF0gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBsdWdpbjogcGx1Z2luLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkb25lOiBmdW5jdGlvbiAoYWJvcnQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhYm9ydCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBsdWdpbi5hZnRlckFib3J0LmFwcGx5KHBsdWdpbiwgY29tcG9zZUFyZ3MocGx1Z2luLCBkb25lQWN0aW9uKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBsdWdpbi5hZnRlckZpbmlzaC5hcHBseShwbHVnaW4sIGNvbXBvc2VBcmdzKHBsdWdpbiwgZG9uZUFjdGlvbikpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhYm9ydDogYWJvcnRcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgbGFzdCA9IHRoYXQuX3Byb3RvY29sc1tkb25lQWN0aW9uXS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGxhc3QtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhhdC5fcHJvdG9jb2xzW2RvbmVBY3Rpb25dW2xhc3RdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhYm9ydCB8PSB0aGF0Ll9wcm90b2NvbHNbZG9uZUFjdGlvbl1bbGFzdF0uYWJvcnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0Ll9wcm90b2NvbHNbZG9uZUFjdGlvbl1bbGFzdF0uZG9uZShhYm9ydCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0Ll9wcm90b2NvbHNbZG9uZUFjdGlvbl0ucG9wKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoYXQuX3J1bm5pbmdQbHVnaW5zW2RvbmVBY3Rpb25dKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5fcnVubmluZ1BsdWdpbnNbZG9uZUFjdGlvbl0ucG9wKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoYXQuX3J1bm5pbmdQbHVnaW5zW2RvbmVBY3Rpb25dIHx8ICF0aGF0Ll9ydW5uaW5nUGx1Z2luc1tkb25lQWN0aW9uXS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5maW5hbGl6ZUFjdGlvbihkb25lQWN0aW9uLCBhYm9ydCwgdGhhdC5nZXRQbHVnaW5zRm9yQWN0aW9uKGRvbmVBY3Rpb24pLCB0aGF0Ll9tZW1lbnRvc1tkb25lQWN0aW9uXSwgYXJncyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgaG9sZHMgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIHZhciBkb25lcyA9IHt9O1xyXG5cclxuICAgICAgICAgICAgICAgIHBsdWdpbltcImhvbGRcIl0gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaG9sZHMgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICBwbHVnaW5bXCJhYm9ydFwiXSA9IGZ1bmN0aW9uIChhYm9ydEFjdGlvbikge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhY3QgPSB0eXBlb2YgYWJvcnRBY3Rpb24gPT09IFwidW5kZWZpbmVkXCIgPyBhY3Rpb24gOiBhYm9ydEFjdGlvbjtcclxuICAgICAgICAgICAgICAgICAgICBkb25lc1thY3RdID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICBkb25lKHRydWUsIGFjdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgYWJvcnRlZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIHBsdWdpbltcInJlbGVhc2VcIl0gPSBmdW5jdGlvbiAocmVsZWFzZUFjdGlvbikge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhY3QgPSB0eXBlb2YgcmVsZWFzZUFjdGlvbiA9PT0gXCJ1bmRlZmluZWRcIiA/IGFjdGlvbiA6IHJlbGVhc2VBY3Rpb247XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRvbmVzW2FjdF0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUGx1Z2luIHJlbGVhc2VkIHR3aWNlIGZvciBhY3Rpb24gXCIgKyBhY3QgKyBcIiEgUG9zc2libHkgY2FsbGVkIHJlbGVhc2UgYWZ0ZXIgYWJvcnQgb3IgdmljZSB2ZXJzYS5cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZG9uZShmYWxzZSwgYWN0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZG9uZXNbYWN0XSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIWFib3J0ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbWVtZW50byA9IHBsdWdpbi5nZXRNZW1lbnRvLmFwcGx5KHBsdWdpbiwgY29tcG9zZUFyZ3MocGx1Z2luLCBhY3Rpb24pKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobWVtZW50bykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZW1lbnRvLmluc3RhbmNlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdG9yZUZyb21NZW1lbnRvOiBmdW5jdGlvbiAobWVtKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGx1Z2luLnJlc3RvcmVGcm9tTWVtZW50byh0aGF0LCBtZW0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0Ll9tZW1lbnRvc1thY3Rpb25dLnB1c2gobWVtZW50byk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBJZiB3ZSBhYm9ydGVkOiBDbGVhbiB1cDogQWxsIFBsdWdpbnMgdGhhdCB3aGVyZSBzdGFydGVkIHVudGlsIG5vdyAob3V0ZXIpIHdpbGwgYmUgYWJvcnRlZC5cclxuICAgICAgICAgICAgICAgICAgICAvLyBPdGhlcnMgdGhhdCB3b3VsZCBoYXZlIGJlZW4gc3RhcnRlZCBhZnRlcndhcmRzIChpbm5lcikgd29uJ3QgYmUgY2FsbGVkIGF0IGFsbC4gKHNlZSBpZi1zdGF0ZW1lbnRcclxuICAgICAgICAgICAgICAgICAgICAvLyBhYm92ZSB0aGlzIGNvbW1lbnQpXHJcbiAgICAgICAgICAgICAgICAgICAgcGx1Z2luLnJ1bi5hcHBseShwbHVnaW4sIGNvbXBvc2VBcmdzKHBsdWdpbiwgYWN0aW9uKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFib3J0ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxhc3QgPSAodGhhdC5fcHJvdG9jb2xzW2FjdGlvbl0gJiYgdGhhdC5fcHJvdG9jb2xzW2FjdGlvbl0ubGVuZ3RoKSB8fCAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAobGFzdC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhhdC5fcHJvdG9jb2xzW2FjdGlvbl1bbGFzdF0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0Ll9wcm90b2NvbHNbYWN0aW9uXVtsYXN0XS5kb25lKHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuX3Byb3RvY29sc1thY3Rpb25dLnBvcCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL0hlcmUgd2UgZG8gbm90IGV4aXQgYmVjYXVzZSB3ZSB3YW50IHRvIGFib3J0IHRoZSB3aG9sZSBzdGFja1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuZmluYWxpemVBY3Rpb24oYWN0aW9uLCB0cnVlLCB0aGF0LmdldFBsdWdpbnNGb3JBY3Rpb24oYWN0aW9uKSwgbnVsbCwgYXJncyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFob2xkcyAmJiAhZG9uZXNbYWN0aW9uXSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvbmUoZmFsc2UsIGFjdGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KShpKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgUGx1Z2luQ29udGFpbmVyLnByb3RvdHlwZS5nZXRQbHVnaW5zRm9yQWN0aW9uID0gZnVuY3Rpb24gKGFjdGlvbikge1xyXG4gICAgICAgIGlmICh0aGlzLl9wbHVnaW5zW2FjdGlvbl0gJiYgdGhpcy5fcGx1Z2luc1thY3Rpb25dLmxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcGx1Z2luc1thY3Rpb25dO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5fYW55UGx1Z2lucyAmJiB0aGlzLl9hbnlQbHVnaW5zLmxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fYW55UGx1Z2lucztcclxuICAgICAgICB9IGVsc2VcclxuICAgICAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfTtcclxuXHJcbiAgICBQbHVnaW5Db250YWluZXIucHJvdG90eXBlLmhhbmRsZUFjdGlvbiA9IGZ1bmN0aW9uIChhY3Rpb24sIGFyZ3MpIHtcclxuICAgICAgICB0cnkgIHtcclxuICAgICAgICAgICAgdGhpcy5kb0hhbmRsZUFjdGlvbih0aGlzLmdldFBsdWdpbnNGb3JBY3Rpb24oYWN0aW9uKSwgYWN0aW9uLCBhcmdzKTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYWJvcnQoKTtcclxuICAgICAgICAgICAgdGhyb3cgZTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIFBsdWdpbkNvbnRhaW5lci5wcm90b3R5cGUuZmluYWxpemVBY3Rpb24gPSBmdW5jdGlvbiAoYWN0aW9uLCBhYm9ydCwgcGx1Z2lucywgbWVtZW50b3MsIGFyZ3MpIHtcclxuICAgICAgICBpZiAoIWFib3J0KSB7XHJcbiAgICAgICAgICAgIGlmIChtZW1lbnRvcyAmJiBtZW1lbnRvcy5sZW5ndGggJiYgIURpc3BhdGNoZXIuZ2V0RGlzcGF0Y2hlcigpLnVuZG9pbmcpIHtcclxuICAgICAgICAgICAgICAgIERpc3BhdGNoZXIuZ2V0VW5kb01hbmFnZXIoKS5zdG9yZU1lbWVudG9zKG1lbWVudG9zLCBhY3Rpb24sIERpc3BhdGNoZXIuY3JlYXRlUmVkbyhhY3Rpb24sIGFyZ3MpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9tZW1lbnRvc1thY3Rpb25dID0gbnVsbDtcclxuICAgICAgICB0aGlzLl9ydW5uaW5nUGx1Z2luc1thY3Rpb25dID0gbnVsbDtcclxuICAgICAgICB0aGlzLl9wcm90b2NvbHNbYWN0aW9uXSA9IG51bGw7XHJcbiAgICB9O1xyXG5cclxuICAgIFBsdWdpbkNvbnRhaW5lci5wcm90b3R5cGUucHJvdmlkZU1lbWVudG9zID0gZnVuY3Rpb24gKGFjdGlvbiwgcGx1Z2lucywgYXJncykge1xyXG4gICAgICAgIGlmIChwbHVnaW5zKSB7XHJcbiAgICAgICAgICAgIHZhciByZXQgPSBbXTtcclxuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICAgICAgICBwbHVnaW5zLmZvckVhY2goZnVuY3Rpb24gKHBsdWdpbikge1xyXG4gICAgICAgICAgICAgICAgdmFyIG1lbWVudG8gPSBwbHVnaW4uZ2V0TWVtZW50by5hcHBseShwbHVnaW4sIFt0aGF0LCBhY3Rpb25dLmNvbmNhdChhcmdzKSk7XHJcbiAgICAgICAgICAgICAgICBpZiAobWVtZW50bykge1xyXG4gICAgICAgICAgICAgICAgICAgIG1lbWVudG8uaW5zdGFuY2UgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3RvcmVGcm9tTWVtZW50bzogZnVuY3Rpb24gKG1lbSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGx1Z2luLnJlc3RvcmVGcm9tTWVtZW50byh0aGF0LCBtZW0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0LnB1c2gobWVtZW50byk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgaWYgKHJldC5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIERpc3BhdGNoZXIuZ2V0VW5kb01hbmFnZXIoKS5zdG9yZU1lbWVudG9zKHJldCwgYWN0aW9uLCBEaXNwYXRjaGVyLmNyZWF0ZVJlZG8oYWN0aW9uLCBhcmdzKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgKiBUaGlzIHdyYXBzIHRoZSBoYW5kbGVyIGFyb3VuZCB0aGUgZXhpc3RpbmcgaGFuZGxlcnMgdGhlIGFjdGlvbiwgbWFraW5nIHRoZSBnaXZlbiBoYW5kbGVyIHRoZSBmaXJzdCB0byBiZSBjYWxsZWRcclxuICAgICogZm9yIHRoYXQgYWN0aW9uLlxyXG4gICAgKlxyXG4gICAgKiBJZiB0aGUgQU5ZLUFjdGlvbiBpcyBnaXZlblxyXG4gICAgKiAgICogVGhlIGhhbmRsZXIgaXMgd3JhcHBlZCBmb3IgZXZlcnkgYWN0aW9uIHRoZXJlIGFscmVhZHkgaXMgYW5vdGhlciBoYW5kbGVyXHJcbiAgICAqICAgKiBUaGUgaGFuZGxlciBpcyB3cmFwcGVkIGFyb3VuZCBhbGwgb3RoZXIgYW55LWhhbmRsZXIsIGFuZCB0aGVzZSBhcmUgY2FsbGVkIGZvciBhbGwgYWN0aW9ucyB3aXRob3V0IHJlZ3VsYXIgaGFuZGxlcnNcclxuICAgICpcclxuICAgICogSWYgYSByZWd1bGFyIGFjdGlvbiBpcyBnaXZlbiBhbmQgYW55LWhhbmRsZXJzIGV4aXN0IHRoZSBnaXZlbiBoYW5kbGVyIGlzIHdyYXBwZWQgYXJvdW5kIGFsbCBhbnktaGFuZGxlcnMgZm9yIHRoZVxyXG4gICAgKiBnaXZlbiBhY3Rpb24uXHJcbiAgICAqXHJcbiAgICAqIEBwYXJhbSBhY3Rpb25cclxuICAgICogQHBhcmFtIGhhbmRsZXJcclxuICAgICovXHJcbiAgICBQbHVnaW5Db250YWluZXIucHJvdG90eXBlLndyYXAgPSBmdW5jdGlvbiAoYWN0aW9uLCBoYW5kbGVyKSB7XHJcbiAgICAgICAgaWYgKGFjdGlvbiA9PT0gLTEwMDAgLyogX19BTllfXyAqLykge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5fYW55UGx1Z2lucy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgICAgICAgICAgICAgIERpc3BhdGNoZXIuc3Vic2NyaWJlQWN0aW9uKC0xMDAwIC8qIF9fQU5ZX18gKi8sIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYXJncyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCAoYXJndW1lbnRzLmxlbmd0aCAtIDApOyBfaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3NbX2ldID0gYXJndW1lbnRzW19pICsgMF07XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhY3QgPSBhcmdzLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoYXQuX3BsdWdpbnNbYWN0XSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQuaGFuZGxlQWN0aW9uKGFjdCwgYXJncyk7XHJcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAodHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhcmdzID0gW107XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IChhcmd1bWVudHMubGVuZ3RoIC0gMSk7IF9pKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnc1tfaV0gPSBhcmd1bWVudHNbX2kgKyAxXTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgLypcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhhdC5fcGx1Z2luc1t0eXBlXSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoYXQucHJvdmlkZU1lbWVudG9zKHR5cGUsIGFyZ3MpO1xyXG4gICAgICAgICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZm9yICh2YXIgYSBpbiB0aGlzLl9wbHVnaW5zKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fcGx1Z2lucy5oYXNPd25Qcm9wZXJ0eShhKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9XcmFwKGEsIGhhbmRsZXIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuX2FueVBsdWdpbnMudW5zaGlmdChoYW5kbGVyKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMuX3BsdWdpbnNbYWN0aW9uXSAmJiB0aGlzLl9hbnlQbHVnaW5zLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGwgPSB0aGlzLl9hbnlQbHVnaW5zLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChsLS0pIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvV3JhcChhY3Rpb24sIHRoaXMuX2FueVBsdWdpbnNbbF0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuZG9XcmFwKGFjdGlvbiwgaGFuZGxlcik7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBQbHVnaW5Db250YWluZXIucHJvdG90eXBlLmRvV3JhcCA9IGZ1bmN0aW9uIChhY3Rpb24sIGhhbmRsZXIpIHtcclxuICAgICAgICBpZiAoIXRoaXMuX3BsdWdpbnNbYWN0aW9uXSkge1xyXG4gICAgICAgICAgICB0aGlzLl9wbHVnaW5zW2FjdGlvbl0gPSBbXTtcclxuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICAgICAgICBEaXNwYXRjaGVyLnN1YnNjcmliZUFjdGlvbihhY3Rpb24sIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBhcmdzID0gW107XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgKGFyZ3VtZW50cy5sZW5ndGggLSAwKTsgX2krKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGFyZ3NbX2ldID0gYXJndW1lbnRzW19pICsgMF07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGF0LmhhbmRsZUFjdGlvbihhY3Rpb24sIGFyZ3MpO1xyXG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAodHlwZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBbXTtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCAoYXJndW1lbnRzLmxlbmd0aCAtIDEpOyBfaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXJnc1tfaV0gPSBhcmd1bWVudHNbX2kgKyAxXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9wbHVnaW5zW2FjdGlvbl0uaW5kZXhPZihoYW5kbGVyKSAhPT0gLTEpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUGx1Z2luIGluc3RhbmNlcyBjYW4gb25seSBiZSB1c2VkIG9uY2UgcGVyIGFjdGlvbiFcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl9wbHVnaW5zW2FjdGlvbl0udW5zaGlmdChoYW5kbGVyKTtcclxuICAgIH07XHJcblxyXG4gICAgUGx1Z2luQ29udGFpbmVyLnByb3RvdHlwZS5kZXRhY2ggPSBmdW5jdGlvbiAoYWN0aW9uLCBoYW5kbGVyKSB7XHJcbiAgICAgICAgaWYgKGFjdGlvbiA9PT0gLTEwMDAgLyogX19BTllfXyAqLykge1xyXG4gICAgICAgICAgICB0aGlzLl9hbnlQbHVnaW5zLnNwbGljZSh0aGlzLl9hbnlQbHVnaW5zLmluZGV4T2YoaGFuZGxlciksIDEpO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBhIGluIHRoaXMuX3BsdWdpbnMpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9wbHVnaW5zLmhhc093blByb3BlcnR5KGEpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcGx1Z2luc1thXS5zcGxpY2UodGhpcy5fcGx1Z2luc1thXS5pbmRleE9mKGhhbmRsZXIpLCAxKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9wbHVnaW5zW2FjdGlvbl0pIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3BsdWdpbnNbYWN0aW9uXS5zcGxpY2UodGhpcy5fcGx1Z2luc1thY3Rpb25dLmluZGV4T2YoaGFuZGxlciksIDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIHJldHVybiBQbHVnaW5Db250YWluZXI7XHJcbn0pKEV2ZW50Q2hhbm5lbC5DaGFubmVsZWRFbWl0dGVyKTtcclxuZXhwb3J0cy5QbHVnaW5Db250YWluZXIgPSBQbHVnaW5Db250YWluZXI7XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVDb250YWluZXIoc3BlYykge1xyXG4gICAgcmV0dXJuIFRvb2xzLnN1YmNsYXNzKHNwZWMsIFBsdWdpbkNvbnRhaW5lcik7XHJcbn1cclxuZXhwb3J0cy5jcmVhdGVDb250YWluZXIgPSBjcmVhdGVDb250YWluZXI7XHJcbiIsIi8qKlxyXG4qIENyZWF0ZWQgYnkgU3RlcGhhbiBvbiAxMC4wMS4yMDE1LlxyXG4qL1xyXG5cInVzZSBzdHJpY3RcIjtcclxudmFyIFN0cmVhbSA9IHJlcXVpcmUoXCIuL3N0cmVhbVwiKTtcclxuXHJcbmV4cG9ydHMuY29tcG9uZW50TGlmZWN5Y2xlID0ge1xyXG4gICAgX3dpbGxVbm1vdW50OiBudWxsLFxyXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLl93aWxsVW5tb3VudCA9IFN0cmVhbS5jcmVhdGVTdHJlYW0oXCJjb21wb25lbnQtdW5tb3VudFwiKTtcclxuICAgIH0sXHJcbiAgICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMuX3dpbGxVbm1vdW50LnB1c2godHJ1ZSk7XHJcbiAgICAgICAgdGhpcy5fd2lsbFVubW91bnQuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG59O1xyXG4iLCIvKipcclxuKiBDcmVhdGVkIGJ5IFN0ZXBoYW4gb24gMjkuMTIuMjAxNC5cclxuKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBfX2V4dGVuZHMgPSB0aGlzLl9fZXh0ZW5kcyB8fCBmdW5jdGlvbiAoZCwgYikge1xyXG4gICAgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07XHJcbiAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cclxuICAgIF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlO1xyXG4gICAgZC5wcm90b3R5cGUgPSBuZXcgX18oKTtcclxufTtcclxudmFyIFRvb2xzID0gcmVxdWlyZShcIi4vdG9vbHNcIik7XHJcbnZhciBTdHJlYW0gPSByZXF1aXJlKFwiLi9zdHJlYW1cIik7XHJcblxyXG4vKipcclxuKiBUZXN0IGlmIHNvbWV0aGluZyBpcyBhIHN0b3JlLlxyXG4qIEBwYXJhbSB0aGluZ1xyXG4qIEByZXR1cm5zIHtib29sZWFufVxyXG4qL1xyXG5mdW5jdGlvbiBpc1N0b3JlKHRoaW5nKSB7XHJcbiAgICByZXR1cm4gdGhpbmcgaW5zdGFuY2VvZiBSZWNvcmRTdG9yZSB8fCB0aGluZyBpbnN0YW5jZW9mIEFycmF5U3RvcmUgfHwgdGhpbmcgaW5zdGFuY2VvZiBJbW11dGFibGVSZWNvcmQgfHwgdGhpbmcgaW5zdGFuY2VvZiBJbW11dGFibGVBcnJheTtcclxufVxyXG5leHBvcnRzLmlzU3RvcmUgPSBpc1N0b3JlO1xyXG5cclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZVVwZGF0ZUluZm8oaXRlbSwgdmFsdWUsIHN0b3JlLCBwYXRoLCByb290SXRlbSkge1xyXG4gICAgdmFyIHIgPSB7XHJcbiAgICAgICAgaXRlbTogaXRlbSxcclxuICAgICAgICB2YWx1ZTogdmFsdWUsXHJcbiAgICAgICAgc3RvcmU6IHN0b3JlXHJcbiAgICB9O1xyXG5cclxuICAgIGlmIChwYXRoKSB7XHJcbiAgICAgICAgcltcInBhdGhcIl0gPSBwYXRoO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChyb290SXRlbSAhPSBudWxsKSB7XHJcbiAgICAgICAgcltcInJvb3RJdGVtXCJdID0gcm9vdEl0ZW07XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJbXCJyb290SXRlbVwiXSA9IGl0ZW07XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHI7XHJcbn1cclxuXHJcblxyXG5cclxudmFyIFN0b3JlID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIFN0b3JlKCkge1xyXG4gICAgICAgIHRoaXMuX2FkZEl0ZW1zU3RyZWFtcyA9IFtdO1xyXG4gICAgICAgIHRoaXMuX3JlbW92ZUl0ZW1zU3RyZWFtcyA9IFtdO1xyXG4gICAgICAgIHRoaXMuX3VwZGF0ZVN0cmVhbXMgPSBbXTtcclxuICAgICAgICB0aGlzLl9kaXNwb3NpbmdTdHJlYW1zID0gW107XHJcbiAgICB9XHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU3RvcmUucHJvdG90eXBlLCBcImlzSW1tdXRhYmxlXCIsIHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcclxuICAgIH0pO1xyXG5cclxuICAgIFN0b3JlLnByb3RvdHlwZS5yZW1vdmVTdHJlYW0gPSBmdW5jdGlvbiAobGlzdCwgc3RyZWFtKSB7XHJcbiAgICAgICAgdmFyIGkgPSBsaXN0LmluZGV4T2Yoc3RyZWFtKTtcclxuICAgICAgICBpZiAoaSAhPT0gLTEpIHtcclxuICAgICAgICAgICAgbGlzdC5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU3RvcmUucHJvdG90eXBlLCBcIm5ld0l0ZW1zXCIsIHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICAgICAgICB2YXIgcyA9IFN0cmVhbS5jcmVhdGVTdHJlYW0oXCJhZGRQcm9wZXJ0eVwiKTtcclxuICAgICAgICAgICAgdGhpcy5fYWRkSXRlbXNTdHJlYW1zLnB1c2gocyk7XHJcblxyXG4gICAgICAgICAgICBzLm9uQ2xvc2UoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdGhhdC5yZW1vdmVTdHJlYW0odGhhdC5fYWRkSXRlbXNTdHJlYW1zLCBzKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiBzO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcclxuICAgIH0pO1xyXG5cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTdG9yZS5wcm90b3R5cGUsIFwicmVtb3ZlZEl0ZW1zXCIsIHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICAgICAgICB2YXIgcyA9IFN0cmVhbS5jcmVhdGVTdHJlYW0oXCJyZW1vdmVQcm9wZXJ0eVwiKTtcclxuICAgICAgICAgICAgdGhpcy5fcmVtb3ZlSXRlbXNTdHJlYW1zLnB1c2gocyk7XHJcbiAgICAgICAgICAgIHMub25DbG9zZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB0aGF0LnJlbW92ZVN0cmVhbSh0aGF0Ll9yZW1vdmVJdGVtc1N0cmVhbXMsIHMpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHMudW50aWwodGhpcy5pc0Rpc3Bvc2luZyk7XHJcbiAgICAgICAgICAgIHJldHVybiBzO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcclxuICAgIH0pO1xyXG5cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTdG9yZS5wcm90b3R5cGUsIFwidXBkYXRlc1wiLCB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgICAgICAgICAgdmFyIHMgPSBTdHJlYW0uY3JlYXRlU3RyZWFtKFwidXBkYXRlUHJvcGVydHlcIik7XHJcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVN0cmVhbXMucHVzaChzKTtcclxuICAgICAgICAgICAgcy5vbkNsb3NlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHRoYXQucmVtb3ZlU3RyZWFtKHRoYXQuX3VwZGF0ZVN0cmVhbXMsIHMpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIHM7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFN0b3JlLnByb3RvdHlwZSwgXCJhbGxDaGFuZ2VzXCIsIHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudXBkYXRlcy5jb21iaW5lKHRoaXMubmV3SXRlbXMpLmNvbWJpbmUodGhpcy5yZW1vdmVkSXRlbXMpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcclxuICAgIH0pO1xyXG5cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTdG9yZS5wcm90b3R5cGUsIFwiaXNEaXNwb3NpbmdcIiwge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgICAgIHZhciBzID0gU3RyZWFtLmNyZWF0ZVN0cmVhbShcImRpc3Bvc2luZ1wiKTtcclxuICAgICAgICAgICAgdGhpcy5fZGlzcG9zaW5nU3RyZWFtcy5wdXNoKHMpO1xyXG4gICAgICAgICAgICByZXR1cm4gcztcclxuICAgICAgICB9LFxyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXHJcbiAgICB9KTtcclxuXHJcbiAgICBTdG9yZS5wcm90b3R5cGUuZGlzcG9zZVN0cmVhbXMgPSBmdW5jdGlvbiAoc3RyZWFtTGlzdCkge1xyXG4gICAgICAgIHN0cmVhbUxpc3QuZm9yRWFjaChmdW5jdGlvbiAoc3RyZWFtKSB7XHJcbiAgICAgICAgICAgIHN0cmVhbS5kaXNwb3NlKCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHN0cmVhbUxpc3QgPSBbXTtcclxuICAgIH07XHJcblxyXG4gICAgU3RvcmUucHJvdG90eXBlLmRpc3Bvc2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5fZGlzcG9zaW5nU3RyZWFtcy5mb3JFYWNoKGZ1bmN0aW9uIChzdHJlYW0pIHtcclxuICAgICAgICAgICAgc3RyZWFtLnB1c2godHJ1ZSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zZVN0cmVhbXModGhpcy5fcmVtb3ZlSXRlbXNTdHJlYW1zKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2VTdHJlYW1zKHRoaXMuX3VwZGF0ZVN0cmVhbXMpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zZVN0cmVhbXModGhpcy5fYWRkSXRlbXNTdHJlYW1zKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2VTdHJlYW1zKHRoaXMuX2Rpc3Bvc2luZ1N0cmVhbXMpO1xyXG4gICAgfTtcclxuXHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU3RvcmUucHJvdG90eXBlLCBcImltbXV0YWJsZVwiLCB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcclxuICAgIH0pO1xyXG5cclxuICAgIFN0b3JlLnByb3RvdHlwZS5pdGVtID0gZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgfTtcclxuICAgIHJldHVybiBTdG9yZTtcclxufSkoKTtcclxuXHJcbi8qKlxyXG4qIEJhc2UgY2xhc3MgZm9yIGltbXV0YWJsZSBzdG9yZXMuXHJcbiovXHJcbnZhciBJbW11dGFibGVTdG9yZSA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XHJcbiAgICBfX2V4dGVuZHMoSW1tdXRhYmxlU3RvcmUsIF9zdXBlcik7XHJcbiAgICBmdW5jdGlvbiBJbW11dGFibGVTdG9yZSgpIHtcclxuICAgICAgICBfc3VwZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICAgIH1cclxuICAgIHJldHVybiBJbW11dGFibGVTdG9yZTtcclxufSkoU3RvcmUpO1xyXG5cclxudmFyIFJlY29yZFN0b3JlID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcclxuICAgIF9fZXh0ZW5kcyhSZWNvcmRTdG9yZSwgX3N1cGVyKTtcclxuICAgIGZ1bmN0aW9uIFJlY29yZFN0b3JlKGluaXRpYWwpIHtcclxuICAgICAgICBfc3VwZXIuY2FsbCh0aGlzKTtcclxuICAgICAgICB0aGlzLl9kYXRhID0ge307XHJcbiAgICAgICAgdGhpcy5fc3ViU3RyZWFtcyA9IHt9O1xyXG5cclxuICAgICAgICBpZiAoaW5pdGlhbCkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBwcm9wIGluIGluaXRpYWwpIHtcclxuICAgICAgICAgICAgICAgIGlmIChpbml0aWFsLmhhc093blByb3BlcnR5KHByb3ApKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRJdGVtKHByb3AsIGluaXRpYWxbcHJvcF0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgUmVjb3JkU3RvcmUucHJvdG90eXBlLmNoZWNrTmFtZUFsbG93ZWQgPSBmdW5jdGlvbiAobmFtZSkge1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfTtcclxuXHJcbiAgICBSZWNvcmRTdG9yZS5wcm90b3R5cGUuc2V0dXBTdWJTdHJlYW0gPSBmdW5jdGlvbiAobmFtZSwgdmFsdWUpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2VTdWJTdHJlYW0obmFtZSk7XHJcbiAgICAgICAgaWYgKGV4cG9ydHMuaXNTdG9yZSh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgdmFyIHN1YlN0cmVhbTtcclxuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICAgICAgICBzdWJTdHJlYW0gPSB2YWx1ZS51cGRhdGVzO1xyXG4gICAgICAgICAgICBzdWJTdHJlYW0uZm9yRWFjaChmdW5jdGlvbiAodXBkYXRlKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaW5mbyA9IGNyZWF0ZVVwZGF0ZUluZm8odXBkYXRlLml0ZW0sIHVwZGF0ZS52YWx1ZSwgdXBkYXRlLnN0b3JlLCB1cGRhdGUucGF0aCA/IG5hbWUgKyBcIi5cIiArIHVwZGF0ZS5wYXRoIDogbmFtZSArIFwiLlwiICsgdXBkYXRlLml0ZW0sIG5hbWUpO1xyXG4gICAgICAgICAgICAgICAgdGhhdC5fdXBkYXRlU3RyZWFtcy5mb3JFYWNoKGZ1bmN0aW9uIChzdHJlYW0pIHtcclxuICAgICAgICAgICAgICAgICAgICBzdHJlYW0ucHVzaChpbmZvKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuX3N1YlN0cmVhbXNbbmFtZV0gPSBzdWJTdHJlYW07XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBSZWNvcmRTdG9yZS5wcm90b3R5cGUuZGlzcG9zZVN1YlN0cmVhbSA9IGZ1bmN0aW9uIChuYW1lKSB7XHJcbiAgICAgICAgdmFyIHN1YlN0cmVhbSA9IHRoaXMuX3N1YlN0cmVhbXNbbmFtZV07XHJcbiAgICAgICAgaWYgKHN1YlN0cmVhbSkge1xyXG4gICAgICAgICAgICBzdWJTdHJlYW0uZGlzcG9zZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgUmVjb3JkU3RvcmUucHJvdG90eXBlLmFkZEl0ZW0gPSBmdW5jdGlvbiAobmFtZSwgaW5pdGlhbCkge1xyXG4gICAgICAgIGlmICghdGhpcy5jaGVja05hbWVBbGxvd2VkKG5hbWUpKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5hbWUgJ1wiICsgbmFtZSArIFwiJyBub3QgYWxsb3dlZCBmb3IgcHJvcGVydHkgb2Ygb2JqZWN0IHN0b3JlLlwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIG5hbWUsIHtcclxuICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGF0Ll9kYXRhW25hbWVdO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgdGhhdC5fZGF0YVtuYW1lXSA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgdmFyIHVwZGF0ZUluZm8gPSBjcmVhdGVVcGRhdGVJbmZvKG5hbWUsIHZhbHVlLCB0aGF0KTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGF0LnNldHVwU3ViU3RyZWFtKG5hbWUsIHZhbHVlKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGF0Ll91cGRhdGVTdHJlYW1zLmZvckVhY2goZnVuY3Rpb24gKHN0cmVhbSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbS5wdXNoKHVwZGF0ZUluZm8pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5fZGF0YVtuYW1lXSA9IGluaXRpYWw7XHJcblxyXG4gICAgICAgIHRoaXMuc2V0dXBTdWJTdHJlYW0obmFtZSwgaW5pdGlhbCk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9hZGRJdGVtc1N0cmVhbXMpIHtcclxuICAgICAgICAgICAgdGhpcy5fYWRkSXRlbXNTdHJlYW1zLmZvckVhY2goZnVuY3Rpb24gKHN0cmVhbSkge1xyXG4gICAgICAgICAgICAgICAgc3RyZWFtLnB1c2goY3JlYXRlVXBkYXRlSW5mbyhuYW1lLCBpbml0aWFsLCB0aGF0KSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgUmVjb3JkU3RvcmUucHJvdG90eXBlLnJlbW92ZUl0ZW0gPSBmdW5jdGlvbiAobmFtZSkge1xyXG4gICAgICAgIGlmICh0aGlzLl9kYXRhLmhhc093blByb3BlcnR5KG5hbWUpKSB7XHJcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzW25hbWVdO1xyXG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fZGF0YVtuYW1lXTtcclxuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5kaXNwb3NlU3ViU3RyZWFtKG5hbWUpO1xyXG4gICAgICAgICAgICB0aGlzLl9yZW1vdmVJdGVtc1N0cmVhbXMuZm9yRWFjaChmdW5jdGlvbiAoc3RyZWFtKSB7XHJcbiAgICAgICAgICAgICAgICBzdHJlYW0ucHVzaChjcmVhdGVVcGRhdGVJbmZvKG5hbWUsIG51bGwsIHRoYXQpKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5rbm93biBwcm9wZXJ0eSAnXCIgKyBuYW1lICsgXCInLlwiKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShSZWNvcmRTdG9yZS5wcm90b3R5cGUsIFwiaW1tdXRhYmxlXCIsIHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLl9pbW11dGFibGUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2ltbXV0YWJsZSA9IG5ldyBJbW11dGFibGVSZWNvcmQodGhpcyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9pbW11dGFibGU7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFJlY29yZFN0b3JlLnByb3RvdHlwZSwgXCJrZXlzXCIsIHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIHIgPSBbXTtcclxuICAgICAgICAgICAgZm9yICh2YXIgayBpbiB0aGlzLl9kYXRhKSB7XHJcbiAgICAgICAgICAgICAgICByLnB1c2goayk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiByO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcclxuICAgIH0pO1xyXG5cclxuICAgIFJlY29yZFN0b3JlLnByb3RvdHlwZS5kaXNwb3NlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgICAgICB0aGlzLmtleXMuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XHJcbiAgICAgICAgICAgIGlmIChleHBvcnRzLmlzU3RvcmUodGhhdFtrZXldKSkge1xyXG4gICAgICAgICAgICAgICAgdGhhdFtrZXldLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBkZWxldGUgdGhhdFtrZXldO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuX2RhdGEgPSBudWxsO1xyXG5cclxuICAgICAgICBfc3VwZXIucHJvdG90eXBlLmRpc3Bvc2UuY2FsbCh0aGlzKTtcclxuICAgIH07XHJcbiAgICByZXR1cm4gUmVjb3JkU3RvcmU7XHJcbn0pKFN0b3JlKTtcclxuXHJcblxyXG52YXIgSW1tdXRhYmxlUmVjb3JkID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcclxuICAgIF9fZXh0ZW5kcyhJbW11dGFibGVSZWNvcmQsIF9zdXBlcik7XHJcbiAgICBmdW5jdGlvbiBJbW11dGFibGVSZWNvcmQoX3BhcmVudCkge1xyXG4gICAgICAgIF9zdXBlci5jYWxsKHRoaXMpO1xyXG4gICAgICAgIHRoaXMuX3BhcmVudCA9IF9wYXJlbnQ7XHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICBfcGFyZW50LmtleXMuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XHJcbiAgICAgICAgICAgIHRoYXQuYWRkSXRlbShrZXkpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBfcGFyZW50Lm5ld0l0ZW1zLmZvckVhY2goZnVuY3Rpb24gKHVwZGF0ZSkge1xyXG4gICAgICAgICAgICB0aGF0LmFkZEl0ZW0odXBkYXRlLml0ZW0pO1xyXG4gICAgICAgIH0pLnVudGlsKF9wYXJlbnQuaXNEaXNwb3NpbmcpO1xyXG5cclxuICAgICAgICBfcGFyZW50LnJlbW92ZWRJdGVtcy5mb3JFYWNoKGZ1bmN0aW9uICh1cGRhdGUpIHtcclxuICAgICAgICAgICAgdGhhdC5yZW1vdmVJdGVtKHVwZGF0ZS5pdGVtKTtcclxuICAgICAgICB9KS51bnRpbChfcGFyZW50LmlzRGlzcG9zaW5nKTtcclxuICAgIH1cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShJbW11dGFibGVSZWNvcmQucHJvdG90eXBlLCBcImlzSW1tdXRhYmxlXCIsIHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEltbXV0YWJsZVJlY29yZC5wcm90b3R5cGUsIFwiaW1tdXRhYmxlXCIsIHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgSW1tdXRhYmxlUmVjb3JkLnByb3RvdHlwZS5hZGRJdGVtID0gZnVuY3Rpb24gKG5hbWUpIHtcclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIG5hbWUsIHtcclxuICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGlmIChleHBvcnRzLmlzU3RvcmUodGhhdC5fcGFyZW50W25hbWVdKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGF0Ll9wYXJlbnRbbmFtZV0uaW1tdXRhYmxlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoYXQuX3BhcmVudFtuYW1lXTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBJbW11dGFibGVSZWNvcmQucHJvdG90eXBlLnJlbW92ZUl0ZW0gPSBmdW5jdGlvbiAobmFtZSkge1xyXG4gICAgICAgIGRlbGV0ZSB0aGlzW25hbWVdO1xyXG4gICAgfTtcclxuXHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoSW1tdXRhYmxlUmVjb3JkLnByb3RvdHlwZSwgXCJrZXlzXCIsIHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudC5rZXlzO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcclxuICAgIH0pO1xyXG5cclxuICAgIEltbXV0YWJsZVJlY29yZC5wcm90b3R5cGUuc3Vic2NyaWJlUGFyZW50U3RyZWFtID0gZnVuY3Rpb24gKHBhcmVudFN0cmVhbSkge1xyXG4gICAgICAgIHZhciBzdHJlYW0gPSBTdHJlYW0uY3JlYXRlU3RyZWFtKCk7XHJcblxyXG4gICAgICAgIHBhcmVudFN0cmVhbS5mb3JFYWNoKGZ1bmN0aW9uICh1cGRhdGUpIHtcclxuICAgICAgICAgICAgc3RyZWFtLnB1c2godXBkYXRlKTtcclxuICAgICAgICB9KS51bnRpbCh0aGlzLl9wYXJlbnQuaXNEaXNwb3NpbmcpO1xyXG5cclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgdGhpcy5fdXBkYXRlU3RyZWFtcy5wdXNoKHN0cmVhbSk7XHJcbiAgICAgICAgc3RyZWFtLm9uQ2xvc2UoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB0aGF0LnJlbW92ZVN0cmVhbSh0aGF0Ll91cGRhdGVTdHJlYW1zLCBzdHJlYW0pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gc3RyZWFtO1xyXG4gICAgfTtcclxuXHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoSW1tdXRhYmxlUmVjb3JkLnByb3RvdHlwZSwgXCJ1cGRhdGVzXCIsIHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3Vic2NyaWJlUGFyZW50U3RyZWFtKHRoaXMuX3BhcmVudC51cGRhdGVzKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXHJcbiAgICB9KTtcclxuXHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoSW1tdXRhYmxlUmVjb3JkLnByb3RvdHlwZSwgXCJuZXdJdGVtc1wiLCB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnN1YnNjcmliZVBhcmVudFN0cmVhbSh0aGlzLl9wYXJlbnQubmV3SXRlbXMpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcclxuICAgIH0pO1xyXG5cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShJbW11dGFibGVSZWNvcmQucHJvdG90eXBlLCBcInJlbW92ZWRJdGVtc1wiLCB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnN1YnNjcmliZVBhcmVudFN0cmVhbSh0aGlzLl9wYXJlbnQucmVtb3ZlZEl0ZW1zKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXHJcbiAgICB9KTtcclxuXHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoSW1tdXRhYmxlUmVjb3JkLnByb3RvdHlwZSwgXCJpc0Rpc3Bvc2luZ1wiLCB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnN1YnNjcmliZVBhcmVudFN0cmVhbSh0aGlzLl9wYXJlbnQuaXNEaXNwb3NpbmcpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIEltbXV0YWJsZVJlY29yZDtcclxufSkoSW1tdXRhYmxlU3RvcmUpO1xyXG5cclxuLyoqXHJcbiogUmVjdXJzaXZlbHkgYnVpbGQgYSBuZXN0ZWQgc3RvcmUuXHJcbiogQHBhcmFtIHZhbHVlXHJcbiogQHJldHVybnMgeyp9XHJcbiovXHJcbmZ1bmN0aW9uIGJ1aWxkRGVlcCh2YWx1ZSkge1xyXG4gICAgZnVuY3Rpb24gZ2V0SXRlbSh2YWx1ZSkge1xyXG4gICAgICAgIHZhciB2O1xyXG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIpIHtcclxuICAgICAgICAgICAgaWYgKFRvb2xzLmlzQXJyYXkodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2ID0gYnVpbGRBcnJheSh2YWx1ZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2ID0gYnVpbGRSZWNvcmQodmFsdWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdiA9IHZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHY7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gYnVpbGRBcnJheSh2YWx1ZSkge1xyXG4gICAgICAgIHZhciBzdG9yZSA9IG5ldyBBcnJheVN0b3JlKCk7XHJcblxyXG4gICAgICAgIHZhbHVlLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcclxuICAgICAgICAgICAgc3RvcmUucHVzaChnZXRJdGVtKGl0ZW0pKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHN0b3JlO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGJ1aWxkUmVjb3JkKHZhbHVlcykge1xyXG4gICAgICAgIHZhciBzdG9yZSA9IG5ldyBSZWNvcmRTdG9yZSgpO1xyXG4gICAgICAgIGZvciAodmFyIGtleSBpbiB2YWx1ZXMpIHtcclxuICAgICAgICAgICAgaWYgKHZhbHVlcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcbiAgICAgICAgICAgICAgICBzdG9yZS5hZGRJdGVtKGtleSwgZ2V0SXRlbSh2YWx1ZXNba2V5XSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gc3RvcmU7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIikge1xyXG4gICAgICAgIGlmIChUb29scy5pc0FycmF5KHZhbHVlKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gYnVpbGRBcnJheSh2YWx1ZSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIGJ1aWxkUmVjb3JkKHZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG59XHJcblxyXG4vKipcclxuKiBDcmVhdGUgYSBuZXcgcmVjb3JkLiBJZiBhbiBpbml0aWFsIHZhbHVlIGlzIGdpdmVuIGl0IHdpbGwgaGF2ZSB0aGUgZW51bWVyYWJsZSBwcm9wZXJ0aWVzIG9mIHRoYXQgdmFsdWUuIFlvdSBjYW5cclxuKiBjcmVhdGUgbmVzdGVkIHN0b3JlcyBieSBwcm92aWRpbmcgYSBjb21wbGV4IG9iamVjdCBhcyBhbiBpbml0aWFsIHZhbHVlLlxyXG4qIEBwYXJhbSBpbml0aWFsXHJcbiogQHJldHVybnMgeyp9XHJcbiovXHJcbmZ1bmN0aW9uIHJlY29yZChpbml0aWFsKSB7XHJcbiAgICBpZiAoaW5pdGlhbCkge1xyXG4gICAgICAgIHJldHVybiBidWlsZERlZXAoaW5pdGlhbCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBuZXcgUmVjb3JkU3RvcmUoKTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLnJlY29yZCA9IHJlY29yZDtcclxuXHJcblxyXG5cclxudmFyIEFycmF5U3RvcmUgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xyXG4gICAgX19leHRlbmRzKEFycmF5U3RvcmUsIF9zdXBlcik7XHJcbiAgICBmdW5jdGlvbiBBcnJheVN0b3JlKGluaXRpYWwsIGFkZGVyLCByZW1vdmVyLCB1cGRhdGVyKSB7XHJcbiAgICAgICAgX3N1cGVyLmNhbGwodGhpcyk7XHJcbiAgICAgICAgdGhpcy5fc3Vic3RyZWFtcyA9IHt9O1xyXG4gICAgICAgIHRoaXMuX2RhdGEgPSBpbml0aWFsIHx8IFtdO1xyXG4gICAgICAgIHRoaXMuX21heFByb3BzID0gMDtcclxuICAgICAgICB0aGlzLnVwZGF0ZVByb3BlcnRpZXMoKTtcclxuICAgICAgICB0aGlzLl9zeW5jZWQgPSB0cnVlO1xyXG5cclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmIChhZGRlcikge1xyXG4gICAgICAgICAgICBhZGRlci5mb3JFYWNoKGZ1bmN0aW9uICh1cGRhdGUpIHtcclxuICAgICAgICAgICAgICAgIHRoYXQuc3BsaWNlKHVwZGF0ZS5pdGVtLCAwLCB1cGRhdGUudmFsdWUpO1xyXG4gICAgICAgICAgICB9KS51bnRpbCh0aGlzLmlzRGlzcG9zaW5nKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChyZW1vdmVyKSB7XHJcbiAgICAgICAgICAgIHJlbW92ZXIuZm9yRWFjaChmdW5jdGlvbiAodXBkYXRlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGF0LnNwbGljZSh1cGRhdGUuaXRlbSwgMSk7XHJcbiAgICAgICAgICAgIH0pLnVudGlsKHRoaXMuaXNEaXNwb3NpbmcpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHVwZGF0ZXIpIHtcclxuICAgICAgICAgICAgdXBkYXRlci5mb3JFYWNoKGZ1bmN0aW9uICh1cGRhdGUpIHtcclxuICAgICAgICAgICAgICAgIHRoYXRbdXBkYXRlLml0ZW1dID0gdXBkYXRlLnZhbHVlO1xyXG4gICAgICAgICAgICB9KS51bnRpbCh0aGlzLmlzRGlzcG9zaW5nKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBBcnJheVN0b3JlLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YS50b1N0cmluZygpO1xyXG4gICAgfTtcclxuXHJcbiAgICBBcnJheVN0b3JlLnByb3RvdHlwZS50b0xvY2FsZVN0cmluZyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YS50b0xvY2FsZVN0cmluZygpO1xyXG4gICAgfTtcclxuXHJcbiAgICBBcnJheVN0b3JlLnByb3RvdHlwZS5mb3JFYWNoID0gZnVuY3Rpb24gKGNhbGxiYWNrZm4sIHRoaXNBcmcpIHtcclxuICAgICAgICB0aGlzLl9kYXRhLmZvckVhY2goY2FsbGJhY2tmbiwgdGhpc0FyZyk7XHJcbiAgICB9O1xyXG5cclxuICAgIEFycmF5U3RvcmUucHJvdG90eXBlLmV2ZXJ5ID0gZnVuY3Rpb24gKGNhbGxiYWNrZm4sIHRoaXNBcmcpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YS5ldmVyeShjYWxsYmFja2ZuLCB0aGlzQXJnKTtcclxuICAgIH07XHJcblxyXG4gICAgQXJyYXlTdG9yZS5wcm90b3R5cGUuc29tZSA9IGZ1bmN0aW9uIChjYWxsYmFja2ZuLCB0aGlzQXJnKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGEuc29tZShjYWxsYmFja2ZuLCB0aGlzQXJnKTtcclxuICAgIH07XHJcblxyXG4gICAgQXJyYXlTdG9yZS5wcm90b3R5cGUuaW5kZXhPZiA9IGZ1bmN0aW9uICh2YWx1ZSwgZnJvbUluZGV4KSB7XHJcbiAgICAgICAgaWYgKGV4cG9ydHMuaXNTdG9yZSh2YWx1ZSkgJiYgdmFsdWUuaXNJbW11dGFibGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGEuaW5kZXhPZih2YWx1ZVtcIl9wYXJlbnRcIl0sIGZyb21JbmRleCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGEuaW5kZXhPZih2YWx1ZSwgZnJvbUluZGV4KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIEFycmF5U3RvcmUucHJvdG90eXBlLmxhc3RJbmRleE9mID0gZnVuY3Rpb24gKHNlYXJjaEVsZW1lbnQsIGZyb21JbmRleCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhLmxhc3RJbmRleE9mKHNlYXJjaEVsZW1lbnQsIGZyb21JbmRleCk7XHJcbiAgICB9O1xyXG5cclxuICAgIEFycmF5U3RvcmUucHJvdG90eXBlLmpvaW4gPSBmdW5jdGlvbiAoc2VwYXJhdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGEuam9pbihzZXBhcmF0b3IpO1xyXG4gICAgfTtcclxuXHJcbiAgICBBcnJheVN0b3JlLnByb3RvdHlwZS5tYXAgPSBmdW5jdGlvbiAoY2FsbGJhY2tmbiwgdGhpc0FyZykge1xyXG4gICAgICAgIHZhciBtYXBwZWQgPSB0aGlzLl9kYXRhLm1hcChjYWxsYmFja2ZuLCB0aGlzQXJnKTtcclxuXHJcbiAgICAgICAgdmFyIGFkZGVyID0gU3RyZWFtLmNyZWF0ZVN0cmVhbSgpO1xyXG4gICAgICAgIHZhciByZW1vdmVyID0gU3RyZWFtLmNyZWF0ZVN0cmVhbSgpO1xyXG4gICAgICAgIHZhciB1cGRhdGVyID0gU3RyZWFtLmNyZWF0ZVN0cmVhbSgpO1xyXG4gICAgICAgIHZhciBtYXBwZWRTdG9yZSA9IG5ldyBBcnJheVN0b3JlKG1hcHBlZCwgYWRkZXIsIHJlbW92ZXIsIHVwZGF0ZXIpO1xyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgdGhpcy51cGRhdGVzLmZvckVhY2goZnVuY3Rpb24gKHVwZGF0ZSkge1xyXG4gICAgICAgICAgICB1cGRhdGVyLnB1c2goY3JlYXRlVXBkYXRlSW5mbyh1cGRhdGUucm9vdEl0ZW0sIGNhbGxiYWNrZm4odGhhdC5fZGF0YVt1cGRhdGUucm9vdEl0ZW1dLCB1cGRhdGUucm9vdEl0ZW0sIHRoYXQuX2RhdGEpLCB1cGRhdGUuc3RvcmUpKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5uZXdJdGVtcy5mb3JFYWNoKGZ1bmN0aW9uICh1cGRhdGUpIHtcclxuICAgICAgICAgICAgYWRkZXIucHVzaChjcmVhdGVVcGRhdGVJbmZvKHVwZGF0ZS5yb290SXRlbSwgY2FsbGJhY2tmbih0aGF0Ll9kYXRhW3VwZGF0ZS5yb290SXRlbV0sIHVwZGF0ZS5yb290SXRlbSwgdGhhdC5fZGF0YSksIHVwZGF0ZS5zdG9yZSkpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLnJlbW92ZWRJdGVtcy5mb3JFYWNoKGZ1bmN0aW9uICh1cGRhdGUpIHtcclxuICAgICAgICAgICAgcmVtb3Zlci5wdXNoKGNyZWF0ZVVwZGF0ZUluZm8odXBkYXRlLnJvb3RJdGVtLCB1cGRhdGUudmFsdWUsIHVwZGF0ZS5zdG9yZSkpOyAvLyBUaGUgdmFsdWUgZG9lcyBub3QgbWF0dGVyIGhlcmUsIHNhdmUgdGhlIGNhbGwgdG8gdGhlIGNhbGxiYWNrXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBtYXBwZWRTdG9yZTtcclxuICAgIH07XHJcblxyXG4gICAgQXJyYXlTdG9yZS5wcm90b3R5cGUuZmlsdGVyID0gZnVuY3Rpb24gKGNhbGxiYWNrZm4sIG5vVXBkYXRlcywgdGhpc0FyZykge1xyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgICAgICB2YXIgYWRkZXI7XHJcbiAgICAgICAgdmFyIHJlbW92ZXI7XHJcbiAgICAgICAgdmFyIHVwZGF0ZXI7XHJcbiAgICAgICAgdmFyIGZpbHRlcmVkU3RvcmU7XHJcblxyXG4gICAgICAgIHZhciBpbmRleE1hcCA9IFtdO1xyXG4gICAgICAgIHZhciBmaWx0ZXJlZCA9IFtdO1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBtYXAoZm9ySW5kZXgsIHRvSW5kZXgpIHtcclxuICAgICAgICAgICAgaW5kZXhNYXBbZm9ySW5kZXhdID0gdG9JbmRleDtcclxuXHJcbiAgICAgICAgICAgIGlmICh0b0luZGV4ICE9PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IGZvckluZGV4ICsgMTsgaSA8IGluZGV4TWFwLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4TWFwW2ldICE9PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hcFtpXSArPSAxO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gYWRkTWFwKGZyb21JbmRleCwgdG9JbmRleCkge1xyXG4gICAgICAgICAgICBpbmRleE1hcC5zcGxpY2UoZnJvbUluZGV4LCAwLCB0b0luZGV4KTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0b0luZGV4ICE9PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IGZyb21JbmRleCArIDE7IGkgPCBpbmRleE1hcC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmRleE1hcFtpXSAhPT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXBbaV0gKz0gMTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHVubWFwKGZvckluZGV4KSB7XHJcbiAgICAgICAgICAgIHZhciBkb3duc2hpZnQgPSBpc01hcHBlZChmb3JJbmRleCk7XHJcbiAgICAgICAgICAgIGluZGV4TWFwW2ZvckluZGV4XSA9IC0xO1xyXG4gICAgICAgICAgICBpZiAoZG93bnNoaWZ0KSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gZm9ySW5kZXggKyAxOyBpIDwgaW5kZXhNYXAubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXhNYXBbaV0gIT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4TWFwW2ldIC09IDE7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiByZW1vdmVNYXAoZm9ySW5kZXgpIHtcclxuICAgICAgICAgICAgdmFyIGRvd25zaGlmdCA9IGlzTWFwcGVkKGZvckluZGV4KTtcclxuICAgICAgICAgICAgaW5kZXhNYXAuc3BsaWNlKGZvckluZGV4LCAxKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChkb3duc2hpZnQpIHtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSBmb3JJbmRleDsgaSA8IGluZGV4TWFwLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4TWFwW2ldICE9PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hcFtpXSAtPSAxO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gbWFwSW5kZXgoZnJvbUluZGV4KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBpbmRleE1hcFtmcm9tSW5kZXhdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gaXNNYXBwZWQoaW5kZXgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGluZGV4IDwgaW5kZXhNYXAubGVuZ3RoICYmIGluZGV4TWFwW2luZGV4XSAhPT0gLTE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBnZXRDbG9zZXN0TGVmdE1hcChmb3JJbmRleCkge1xyXG4gICAgICAgICAgICB2YXIgaSA9IGZvckluZGV4O1xyXG5cclxuICAgICAgICAgICAgd2hpbGUgKChpID49IGluZGV4TWFwLmxlbmd0aCB8fCBpbmRleE1hcFtpXSA9PT0gLTEpICYmIGkgPiAtMikge1xyXG4gICAgICAgICAgICAgICAgaS0tO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaSA8IDApXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gLTE7XHJcbiAgICAgICAgICAgIHJldHVybiBtYXBJbmRleChpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuX2RhdGEuZm9yRWFjaChmdW5jdGlvbiAodmFsdWUsIGluZGV4KSB7XHJcbiAgICAgICAgICAgIGlmIChjYWxsYmFja2ZuKHZhbHVlLCBpbmRleCwgdGhhdC5fZGF0YSkpIHtcclxuICAgICAgICAgICAgICAgIGFkZE1hcChpbmRleCwgZmlsdGVyZWQubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgIGZpbHRlcmVkLnB1c2godmFsdWUpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgYWRkTWFwKGluZGV4LCAtMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKCFub1VwZGF0ZXMpIHtcclxuICAgICAgICAgICAgYWRkZXIgPSBTdHJlYW0uY3JlYXRlU3RyZWFtKCk7XHJcbiAgICAgICAgICAgIHJlbW92ZXIgPSBTdHJlYW0uY3JlYXRlU3RyZWFtKCk7XHJcbiAgICAgICAgICAgIHVwZGF0ZXIgPSBTdHJlYW0uY3JlYXRlU3RyZWFtKCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLm5ld0l0ZW1zLmZvckVhY2goZnVuY3Rpb24gKHVwZGF0ZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrZm4odGhhdC5fZGF0YVt1cGRhdGUucm9vdEl0ZW1dLCB1cGRhdGUucm9vdEl0ZW0sIHRoYXQuX2RhdGEpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzTWFwcGVkKHVwZGF0ZS5yb290SXRlbSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWRkZXIucHVzaChjcmVhdGVVcGRhdGVJbmZvKG1hcEluZGV4KHVwZGF0ZS5yb290SXRlbSksIHRoYXQuX2RhdGFbdXBkYXRlLnJvb3RJdGVtXSwgdXBkYXRlLnN0b3JlKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWRkZXIucHVzaChjcmVhdGVVcGRhdGVJbmZvKGdldENsb3Nlc3RMZWZ0TWFwKHVwZGF0ZS5yb290SXRlbSkgKyAxLCB0aGF0Ll9kYXRhW3VwZGF0ZS5yb290SXRlbV0sIHVwZGF0ZS5zdG9yZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBhZGRNYXAodXBkYXRlLnJvb3RJdGVtLCBmaWx0ZXJlZFN0b3JlLmluZGV4T2YodGhhdC5fZGF0YVt1cGRhdGUucm9vdEl0ZW1dKSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGFkZE1hcCh1cGRhdGUucm9vdEl0ZW0sIC0xKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnJlbW92ZWRJdGVtcy5mb3JFYWNoKGZ1bmN0aW9uICh1cGRhdGUpIHtcclxuICAgICAgICAgICAgICAgIGlmIChpc01hcHBlZCh1cGRhdGUucm9vdEl0ZW0pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVtb3Zlci5wdXNoKGNyZWF0ZVVwZGF0ZUluZm8obWFwSW5kZXgodXBkYXRlLnJvb3RJdGVtKSwgdGhhdC5fZGF0YVt1cGRhdGUucm9vdEl0ZW1dLCB1cGRhdGUuc3RvcmUpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJlbW92ZU1hcCh1cGRhdGUucm9vdEl0ZW0pO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlcy5mb3JFYWNoKGZ1bmN0aW9uICh1cGRhdGUpIHtcclxuICAgICAgICAgICAgICAgIGlmIChjYWxsYmFja2ZuKHRoYXQuX2RhdGFbdXBkYXRlLnJvb3RJdGVtXSwgdXBkYXRlLnJvb3RJdGVtLCB0aGF0Ll9kYXRhKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpc01hcHBlZCh1cGRhdGUucm9vdEl0ZW0pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZXIucHVzaChjcmVhdGVVcGRhdGVJbmZvKG1hcEluZGV4KHVwZGF0ZS5yb290SXRlbSksIHRoYXQuX2RhdGFbdXBkYXRlLnJvb3RJdGVtXSwgdXBkYXRlLnN0b3JlKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWRkZXIucHVzaChjcmVhdGVVcGRhdGVJbmZvKGdldENsb3Nlc3RMZWZ0TWFwKHVwZGF0ZS5yb290SXRlbSkgKyAxLCB0aGF0Ll9kYXRhW3VwZGF0ZS5yb290SXRlbV0sIHVwZGF0ZS5zdG9yZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXAodXBkYXRlLnJvb3RJdGVtLCBmaWx0ZXJlZFN0b3JlLmluZGV4T2YodGhhdC5fZGF0YVt1cGRhdGUucm9vdEl0ZW1dKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaXNNYXBwZWQodXBkYXRlLnJvb3RJdGVtKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVyLnB1c2goY3JlYXRlVXBkYXRlSW5mbyhtYXBJbmRleCh1cGRhdGUucm9vdEl0ZW0pLCB0aGF0Ll9kYXRhW3VwZGF0ZS5yb290SXRlbV0sIHVwZGF0ZS5zdG9yZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1bm1hcCh1cGRhdGUucm9vdEl0ZW0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcCh1cGRhdGUucm9vdEl0ZW0sIC0xKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZmlsdGVyZWRTdG9yZSA9IG5ldyBBcnJheVN0b3JlKGZpbHRlcmVkLCBhZGRlciwgcmVtb3ZlciwgdXBkYXRlcik7XHJcblxyXG4gICAgICAgIHJldHVybiBmaWx0ZXJlZFN0b3JlO1xyXG4gICAgfTtcclxuXHJcbiAgICBBcnJheVN0b3JlLnByb3RvdHlwZS5yZWR1Y2UgPSBmdW5jdGlvbiAoY2FsbGJhY2tmbiwgaW5pdGlhbFZhbHVlKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGEucmVkdWNlKGNhbGxiYWNrZm4sIGluaXRpYWxWYWx1ZSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEFycmF5U3RvcmUucHJvdG90eXBlLnNvcnQgPSBmdW5jdGlvbiAoY29tcGFyZUZuKSB7XHJcbiAgICAgICAgdmFyIGNvcHkgPSB0aGlzLl9kYXRhLm1hcChmdW5jdGlvbiAoaXRlbSkge1xyXG4gICAgICAgICAgICByZXR1cm4gaXRlbTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBjb3B5LnNvcnQoY29tcGFyZUZuKTtcclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgY29weS5mb3JFYWNoKGZ1bmN0aW9uICh2YWx1ZSwgaW5kZXgpIHtcclxuICAgICAgICAgICAgaWYgKHZhbHVlICE9PSB0aGF0Ll9kYXRhW2luZGV4XSkge1xyXG4gICAgICAgICAgICAgICAgdGhhdFtpbmRleF0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBBcnJheVN0b3JlLnByb3RvdHlwZS5yZXZlcnNlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjb3B5ID0gdGhpcy5fZGF0YS5tYXAoZnVuY3Rpb24gKGl0ZW0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIGl0ZW07XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgY29weS5yZXZlcnNlKCk7XHJcblxyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgICAgICBjb3B5LmZvckVhY2goZnVuY3Rpb24gKHZhbHVlLCBpbmRleCkge1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgIT09IHRoYXQuX2RhdGFbaW5kZXhdKSB7XHJcbiAgICAgICAgICAgICAgICB0aGF0W2luZGV4XSA9IHZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEFycmF5U3RvcmUucHJvdG90eXBlLmNvbmNhdCA9IGZ1bmN0aW9uIChhcnJheSkge1xyXG4gICAgICAgIHZhciBuZXdBcnJheTtcclxuICAgICAgICBpZiAoYXJyYXkgaW5zdGFuY2VvZiBBcnJheVN0b3JlKSB7XHJcbiAgICAgICAgICAgIG5ld0FycmF5ID0gdGhpcy5fZGF0YS5jb25jYXQoYXJyYXlbXCJfZGF0YVwiXSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbmV3QXJyYXkgPSB0aGlzLl9kYXRhLmNvbmNhdChhcnJheSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBuZXcgQXJyYXlTdG9yZShuZXdBcnJheSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEFycmF5U3RvcmUucHJvdG90eXBlLmNvbmNhdElucGxhY2UgPSBmdW5jdGlvbiAoYXJyYXkpIHtcclxuICAgICAgICBpZiAoYXJyYXkgaW5zdGFuY2VvZiBBcnJheVN0b3JlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc3BsaWNlLmFwcGx5KHRoaXMsIFt0aGlzLmxlbmd0aCwgMF0uY29uY2F0KGFycmF5W1wiX2RhdGFcIl0pKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnNwbGljZS5hcHBseSh0aGlzLCBbdGhpcy5sZW5ndGgsIDBdLmNvbmNhdChhcnJheSkpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEFycmF5U3RvcmUucHJvdG90eXBlLCBcImxlbmd0aFwiLCB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9kYXRhLmxlbmd0aDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXHJcbiAgICB9KTtcclxuXHJcbiAgICBBcnJheVN0b3JlLnByb3RvdHlwZS5zZXR1cFN1YlN0cmVhbXMgPSBmdW5jdGlvbiAoaXRlbSwgdmFsdWUpIHtcclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgaWYgKGV4cG9ydHMuaXNTdG9yZSh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgdmFyIHN1YnN0cmVhbSA9IHRoaXMuX3N1YnN0cmVhbXNbVG9vbHMub2lkKHZhbHVlKV07XHJcbiAgICAgICAgICAgIGlmIChzdWJzdHJlYW0pIHtcclxuICAgICAgICAgICAgICAgIHN1YnN0cmVhbS51cGRhdGVzLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgc3Vic3RyZWFtID0ge1xyXG4gICAgICAgICAgICAgICAgdXBkYXRlczogdmFsdWUudXBkYXRlc1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBzdWJzdHJlYW0udXBkYXRlcy5mb3JFYWNoKGZ1bmN0aW9uICh1cGRhdGUpIHtcclxuICAgICAgICAgICAgICAgIHZhciB1cGRhdGVJbmZvID0gY3JlYXRlVXBkYXRlSW5mbyh1cGRhdGUuaXRlbSwgdXBkYXRlLnZhbHVlLCB0aGF0LCB1cGRhdGUucGF0aCA/IGl0ZW0gKyBcIi5cIiArIHVwZGF0ZS5wYXRoIDogaXRlbSArIFwiLlwiICsgdXBkYXRlLml0ZW0sIGl0ZW0pO1xyXG4gICAgICAgICAgICAgICAgdGhhdC5fdXBkYXRlU3RyZWFtcy5mb3JFYWNoKGZ1bmN0aW9uIChzdHJlYW0pIHtcclxuICAgICAgICAgICAgICAgICAgICBzdHJlYW0ucHVzaCh1cGRhdGVJbmZvKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhpcy5fc3Vic3RyZWFtc1tUb29scy5vaWQodmFsdWUpXSA9IHN1YnN0cmVhbTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgKiBDYWxsIGFmdGVyIHJlbW92YWwhXHJcbiAgICAqIEBwYXJhbSB2YWx1ZVxyXG4gICAgKi9cclxuICAgIEFycmF5U3RvcmUucHJvdG90eXBlLmRpc3Bvc2VTdWJzdHJlYW0gPSBmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICBpZiAoZXhwb3J0cy5pc1N0b3JlKHZhbHVlKSAmJiB0aGlzLl9kYXRhLmluZGV4T2YodmFsdWUpID09PSAtMSkge1xyXG4gICAgICAgICAgICB2YXIgc3ViU3RyZWFtID0gdGhpcy5fc3Vic3RyZWFtc1tUb29scy5vaWQodmFsdWUpXTtcclxuICAgICAgICAgICAgaWYgKHN1YlN0cmVhbSkge1xyXG4gICAgICAgICAgICAgICAgc3ViU3RyZWFtLnVwZGF0ZXMuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuX3N1YnN0cmVhbXNbVG9vbHMub2lkKHZhbHVlKV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIEFycmF5U3RvcmUucHJvdG90eXBlLnVwZGF0ZVByb3BlcnRpZXMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICAgIHZhciBpO1xyXG5cclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5fZGF0YS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB0aGF0LnNldHVwU3ViU3RyZWFtcyhpLCB0aGlzLl9kYXRhW2ldKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAoaSA9IHRoaXMuX21heFByb3BzOyBpIDwgdGhpcy5fZGF0YS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAoZnVuY3Rpb24gKGluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhhdCwgXCJcIiArIGluZGV4LCB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhhdC5fZGF0YVtpbmRleF07XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgb2xkID0gdGhhdC5fZGF0YVtpbmRleF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gb2xkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0Ll9kYXRhW2luZGV4XSA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5kaXNwb3NlU3Vic3RyZWFtKG9sZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnNldHVwU3ViU3RyZWFtcyhpbmRleCwgdmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5fdXBkYXRlU3RyZWFtcy5mb3JFYWNoKGZ1bmN0aW9uIChzdHJlYW0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJlYW0ucHVzaChjcmVhdGVVcGRhdGVJbmZvKGluZGV4LCB0aGF0Ll9kYXRhW2luZGV4XSwgdGhhdCwgbnVsbCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSkoaSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl9tYXhQcm9wcyA9IHRoaXMuX2RhdGEubGVuZ3RoO1xyXG4gICAgfTtcclxuXHJcbiAgICBBcnJheVN0b3JlLnByb3RvdHlwZS5wdXNoID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB2YWx1ZXMgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgKGFyZ3VtZW50cy5sZW5ndGggLSAwKTsgX2krKykge1xyXG4gICAgICAgICAgICB2YWx1ZXNbX2ldID0gYXJndW1lbnRzW19pICsgMF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMuX2RhdGEubGVuZ3RoO1xyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgdmFsdWVzLmZvckVhY2goZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHRoYXQuX2RhdGEucHVzaCh2YWx1ZSk7XHJcbiAgICAgICAgICAgIHRoYXQuX2FkZEl0ZW1zU3RyZWFtcy5mb3JFYWNoKGZ1bmN0aW9uIChzdHJlYW0pIHtcclxuICAgICAgICAgICAgICAgIHN0cmVhbS5wdXNoKGNyZWF0ZVVwZGF0ZUluZm8oaW5kZXgsIHRoYXQuX2RhdGFbaW5kZXhdLCB0aGF0KSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBpbmRleCsrO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLnVwZGF0ZVByb3BlcnRpZXMoKTtcclxuICAgIH07XHJcblxyXG4gICAgQXJyYXlTdG9yZS5wcm90b3R5cGUudW5zaGlmdCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdmFsdWVzID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IChhcmd1bWVudHMubGVuZ3RoIC0gMCk7IF9pKyspIHtcclxuICAgICAgICAgICAgdmFsdWVzW19pXSA9IGFyZ3VtZW50c1tfaSArIDBdO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgIHZhciBsID0gdmFsdWVzLmxlbmd0aDtcclxuXHJcbiAgICAgICAgd2hpbGUgKGwtLSkge1xyXG4gICAgICAgICAgICAoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fZGF0YS51bnNoaWZ0KHZhbHVlc1swXSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9uZXdJdGVtU3RyZWFtcy5mb3JFYWNoKGZ1bmN0aW9uIChzdHJlYW0pIHtcclxuICAgICAgICAgICAgICAgICAgICBzdHJlYW0ucHVzaChjcmVhdGVVcGRhdGVJbmZvKDAsIHRoYXQuX2RhdGFbMF0sIHRoYXQpKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnVwZGF0ZVByb3BlcnRpZXMoKTtcclxuICAgIH07XHJcblxyXG4gICAgQXJyYXlTdG9yZS5wcm90b3R5cGUucG9wID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciByID0gdGhpcy5fZGF0YS5wb3AoKTtcclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zZVN1YnN0cmVhbShyKTtcclxuXHJcbiAgICAgICAgdGhpcy5fcmVtb3ZlSXRlbXNTdHJlYW1zLmZvckVhY2goZnVuY3Rpb24gKHN0cmVhbSkge1xyXG4gICAgICAgICAgICBzdHJlYW0ucHVzaChjcmVhdGVVcGRhdGVJbmZvKHRoYXQuX2RhdGEubGVuZ3RoLCBudWxsLCB0aGF0KSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiByO1xyXG4gICAgfTtcclxuXHJcbiAgICBBcnJheVN0b3JlLnByb3RvdHlwZS5zaGlmdCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgciA9IHRoaXMuX2RhdGEuc2hpZnQoKTtcclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zZVN1YnN0cmVhbShyKTtcclxuXHJcbiAgICAgICAgdGhpcy5fcmVtb3ZlSXRlbXNTdHJlYW1zLmZvckVhY2goZnVuY3Rpb24gKHN0cmVhbSkge1xyXG4gICAgICAgICAgICBzdHJlYW0ucHVzaChjcmVhdGVVcGRhdGVJbmZvKDAsIG51bGwsIHRoYXQpKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHI7XHJcbiAgICB9O1xyXG5cclxuICAgIEFycmF5U3RvcmUucHJvdG90eXBlLnNwbGljZSA9IGZ1bmN0aW9uIChzdGFydCwgZGVsZXRlQ291bnQpIHtcclxuICAgICAgICB2YXIgdmFsdWVzID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IChhcmd1bWVudHMubGVuZ3RoIC0gMik7IF9pKyspIHtcclxuICAgICAgICAgICAgdmFsdWVzW19pXSA9IGFyZ3VtZW50c1tfaSArIDJdO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgcmVtb3ZlZCA9IHRoaXMuX2RhdGEuc3BsaWNlLmFwcGx5KHRoaXMuX2RhdGEsIFtzdGFydCwgZGVsZXRlQ291bnRdLmNvbmNhdCh2YWx1ZXMpKTtcclxuXHJcbiAgICAgICAgdmFyIGluZGV4ID0gc3RhcnQ7XHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiAodGhhdC5fcmVtb3ZlSXRlbXNTdHJlYW1zLmxlbmd0aCkge1xyXG4gICAgICAgICAgICByZW1vdmVkLmZvckVhY2goZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGF0LmRpc3Bvc2VTdWJzdHJlYW0odmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgdGhhdC5fcmVtb3ZlSXRlbXNTdHJlYW1zLmZvckVhY2goZnVuY3Rpb24gKHN0cmVhbSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbS5wdXNoKGNyZWF0ZVVwZGF0ZUluZm8oaW5kZXgsIHZhbHVlLCB0aGF0KSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGluZGV4Kys7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaW5kZXggPSBzdGFydDtcclxuICAgICAgICB2YWx1ZXMuZm9yRWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHRoYXQuX2FkZEl0ZW1zU3RyZWFtcy5mb3JFYWNoKGZ1bmN0aW9uIChzdHJlYW0pIHtcclxuICAgICAgICAgICAgICAgIHN0cmVhbS5wdXNoKGNyZWF0ZVVwZGF0ZUluZm8oaW5kZXgsIHRoYXQuX2RhdGFbaW5kZXhdLCB0aGF0KSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBpbmRleCsrO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvKiBSZW1vdmVkLiBUaGlzIHNob3VsZCBub3QgYmUgbmVjZXNzYXJ5IGFuZCBpdCBzaW1wbGlmaWVzIHRoZSByZWFjdGl2ZSBhcnJheVxyXG4gICAgICAgIC8vIEluZGV4IGlzIG5vdyBhdCB0aGUgZmlyc3QgaXRlbSBhZnRlciB0aGUgbGFzdCBpbnNlcnRlZCB2YWx1ZS4gU28gaWYgZGVsZXRlQ291bnQgIT0gdmFsdWVzLmxlbmd0aFxyXG4gICAgICAgIC8vIHRoZSBpdGVtcyBhZnRlciB0aGUgaW5zZXJ0L3JlbW92ZSBtb3ZlZCBhcm91bmRcclxuICAgICAgICBpZiAoZGVsZXRlQ291bnQgIT09IHZhbHVlcy5sZW5ndGgpIHtcclxuICAgICAgICAvL3ZhciBkaXN0YW5jZSA9IHZhbHVlcy5sZW5ndGggLSBkZWxldGVDb3VudDtcclxuICAgICAgICBmb3IgKGluZGV4OyBpbmRleCA8IHRoaXMuX2RhdGEubGVuZ3RoOyBpbmRleCsrKSB7XHJcbiAgICAgICAgdGhhdC5fdXBkYXRlU3RyZWFtcy5mb3JFYWNoKGZ1bmN0aW9uKHN0cmVhbSkge1xyXG4gICAgICAgIHN0cmVhbS5wdXNoKGNyZWF0ZVVwZGF0ZUluZm88bnVtYmVyPihpbmRleCwgdGhhdC5fZGF0YVtpbmRleF0sIHRoYXQpKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnVwZGF0ZVByb3BlcnRpZXMoKTtcclxuICAgICAgICByZXR1cm4gcmVtb3ZlZDtcclxuICAgIH07XHJcblxyXG4gICAgQXJyYXlTdG9yZS5wcm90b3R5cGUuaW5zZXJ0ID0gZnVuY3Rpb24gKGF0SW5kZXgpIHtcclxuICAgICAgICB2YXIgdmFsdWVzID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IChhcmd1bWVudHMubGVuZ3RoIC0gMSk7IF9pKyspIHtcclxuICAgICAgICAgICAgdmFsdWVzW19pXSA9IGFyZ3VtZW50c1tfaSArIDFdO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnNwbGljZS5hcHBseSh0aGlzLCBbYXRJbmRleCwgMF0uY29uY2F0KHZhbHVlcykpO1xyXG4gICAgfTtcclxuXHJcbiAgICBBcnJheVN0b3JlLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiAoYXRJbmRleCwgY291bnQpIHtcclxuICAgICAgICBpZiAodHlwZW9mIGNvdW50ID09PSBcInVuZGVmaW5lZFwiKSB7IGNvdW50ID0gMTsgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLnNwbGljZShhdEluZGV4LCBjb3VudCk7XHJcbiAgICB9O1xyXG5cclxuICAgIEFycmF5U3RvcmUucHJvdG90eXBlLmRpc3Bvc2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChleHBvcnRzLmlzU3RvcmUodGhpc1tpXSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXNbaV0uZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBkZWxldGUgdGhpc1tpXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5fZGF0YSA9IG51bGw7XHJcblxyXG4gICAgICAgIF9zdXBlci5wcm90b3R5cGUuZGlzcG9zZS5jYWxsKHRoaXMpO1xyXG4gICAgfTtcclxuXHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQXJyYXlTdG9yZS5wcm90b3R5cGUsIFwiaW1tdXRhYmxlXCIsIHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLl9pbW11dGFibGUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2ltbXV0YWJsZSA9IG5ldyBJbW11dGFibGVBcnJheSh0aGlzKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2ltbXV0YWJsZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXHJcbiAgICB9KTtcclxuXHJcbiAgICBBcnJheVN0b3JlLnByb3RvdHlwZS5pdGVtID0gZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgdmFyIGkgPSB0aGlzLmluZGV4T2YodmFsdWUpO1xyXG4gICAgICAgIGlmIChpICE9PSAtMSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpc1tpXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfTtcclxuICAgIHJldHVybiBBcnJheVN0b3JlO1xyXG59KShTdG9yZSk7XHJcblxyXG52YXIgSW1tdXRhYmxlQXJyYXkgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xyXG4gICAgX19leHRlbmRzKEltbXV0YWJsZUFycmF5LCBfc3VwZXIpO1xyXG4gICAgZnVuY3Rpb24gSW1tdXRhYmxlQXJyYXkoX3BhcmVudCkge1xyXG4gICAgICAgIF9zdXBlci5jYWxsKHRoaXMpO1xyXG4gICAgICAgIHRoaXMuX3BhcmVudCA9IF9wYXJlbnQ7XHJcblxyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgICAgICBfcGFyZW50Lm5ld0l0ZW1zLmZvckVhY2goZnVuY3Rpb24gKHVwZGF0ZSkge1xyXG4gICAgICAgICAgICB0aGF0LnVwZGF0ZVByb3BlcnRpZXMoKTtcclxuICAgICAgICB9KS51bnRpbChfcGFyZW50LmlzRGlzcG9zaW5nKTtcclxuXHJcbiAgICAgICAgLy8gV2UgZG8gbm90aGluZyB3aGVuIHJlbW92aW5nIGl0ZW1zLiBUaGUgZ2V0dGVyIHdpbGwgcmV0dXJuIHVuZGVmaW5lZC5cclxuICAgICAgICAvKlxyXG4gICAgICAgIF9hcnJheS5yZW1vdmVkSXRlbXMoKS5mb3JFYWNoKGZ1bmN0aW9uKHVwZGF0ZSkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIH0pLnVudGlsKF9hcnJheS5kaXNwb3NpbmcoKSk7XHJcbiAgICAgICAgKi9cclxuICAgICAgICB0aGlzLl9tYXhQcm9wcyA9IDA7XHJcbiAgICAgICAgdGhpcy51cGRhdGVQcm9wZXJ0aWVzKCk7XHJcbiAgICB9XHJcbiAgICBJbW11dGFibGVBcnJheS5wcm90b3R5cGUudXBkYXRlUHJvcGVydGllcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgdmFyIGk7XHJcblxyXG4gICAgICAgIGZvciAoaSA9IHRoaXMuX21heFByb3BzOyBpIDwgdGhpcy5fcGFyZW50Lmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIChmdW5jdGlvbiAoaW5kZXgpIHtcclxuICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGF0LCBcIlwiICsgaW5kZXgsIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChleHBvcnRzLmlzU3RvcmUodGhhdC5fcGFyZW50W2luZGV4XSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGF0Ll9wYXJlbnRbaW5kZXhdLmltbXV0YWJsZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhhdC5fcGFyZW50W2luZGV4XTtcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pKGkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fbWF4UHJvcHMgPSB0aGlzLl9wYXJlbnQubGVuZ3RoO1xyXG4gICAgfTtcclxuXHJcbiAgICBJbW11dGFibGVBcnJheS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudC50b1N0cmluZygpO1xyXG4gICAgfTtcclxuXHJcbiAgICBJbW11dGFibGVBcnJheS5wcm90b3R5cGUudG9Mb2NhbGVTdHJpbmcgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudC50b1N0cmluZygpO1xyXG4gICAgfTtcclxuXHJcbiAgICBJbW11dGFibGVBcnJheS5wcm90b3R5cGUuZm9yRWFjaCA9IGZ1bmN0aW9uIChjYWxsYmFja2ZuLCB0aGlzQXJnKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudC5mb3JFYWNoKGNhbGxiYWNrZm4pO1xyXG4gICAgfTtcclxuXHJcbiAgICBJbW11dGFibGVBcnJheS5wcm90b3R5cGUuZXZlcnkgPSBmdW5jdGlvbiAoY2FsbGJhY2tmbiwgdGhpc0FyZykge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9wYXJlbnQuZXZlcnkoY2FsbGJhY2tmbik7XHJcbiAgICB9O1xyXG5cclxuICAgIEltbXV0YWJsZUFycmF5LnByb3RvdHlwZS5zb21lID0gZnVuY3Rpb24gKGNhbGxiYWNrZm4sIHRoaXNBcmcpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fcGFyZW50LmZvckVhY2goY2FsbGJhY2tmbik7XHJcbiAgICB9O1xyXG5cclxuICAgIEltbXV0YWJsZUFycmF5LnByb3RvdHlwZS5pbmRleE9mID0gZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudC5pbmRleE9mKHZhbHVlKTtcclxuICAgIH07XHJcblxyXG4gICAgSW1tdXRhYmxlQXJyYXkucHJvdG90eXBlLmxhc3RJbmRleE9mID0gZnVuY3Rpb24gKHNlYXJjaEVsZW1lbnQsIGZyb21JbmRleCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9wYXJlbnQubGFzdEluZGV4T2Yoc2VhcmNoRWxlbWVudCwgZnJvbUluZGV4KTtcclxuICAgIH07XHJcblxyXG4gICAgSW1tdXRhYmxlQXJyYXkucHJvdG90eXBlLmpvaW4gPSBmdW5jdGlvbiAoc2VwYXJhdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudC5qb2luKHNlcGFyYXRvcik7XHJcbiAgICB9O1xyXG5cclxuICAgIEltbXV0YWJsZUFycmF5LnByb3RvdHlwZS5tYXAgPSBmdW5jdGlvbiAoY2FsbGJhY2tmbiwgdGhpc0FyZykge1xyXG4gICAgICAgIC8vVGhpcyBpcyBkaXJ0eSBidXQgYW55dGhpbmcgZWxzZSB3b3VsZCBiZSBpbnBlcmZvcm1hbnQganVzdCBiZWNhdXNlIHR5cGVzY3JpcHQgZG9lcyBub3QgaGF2ZSBwcm90ZWN0ZWQgc2NvcGVcclxuICAgICAgICByZXR1cm4gdGhpcy5fcGFyZW50W1wiX2RhdGFcIl0ubWFwKGNhbGxiYWNrZm4pO1xyXG4gICAgfTtcclxuXHJcbiAgICBJbW11dGFibGVBcnJheS5wcm90b3R5cGUuZmlsdGVyID0gZnVuY3Rpb24gKGNhbGxiYWNrZm4sIHRoaXNBcmcpIHtcclxuICAgICAgICAvL1RoaXMgaXMgZGlydHkgYnV0IGFueXRoaW5nIGVsc2Ugd291bGQgYmUgaW5wZXJmb3JtYW50IGp1c3QgYmVjYXVzZSB0eXBlc2NyaXB0IGRvZXMgbm90IGhhdmUgcHJvdGVjdGVkIHNjb3BlXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudFtcIl9kYXRhXCJdLmZpbHRlcihjYWxsYmFja2ZuKTtcclxuICAgIH07XHJcblxyXG4gICAgSW1tdXRhYmxlQXJyYXkucHJvdG90eXBlLnJlZHVjZSA9IGZ1bmN0aW9uIChjYWxsYmFja2ZuLCBpbml0aWFsVmFsdWUpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fcGFyZW50LnJlZHVjZShjYWxsYmFja2ZuLCBpbml0aWFsVmFsdWUpO1xyXG4gICAgfTtcclxuXHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoSW1tdXRhYmxlQXJyYXkucHJvdG90eXBlLCBcImxlbmd0aFwiLCB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9wYXJlbnQubGVuZ3RoO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcclxuICAgIH0pO1xyXG5cclxuICAgIEltbXV0YWJsZUFycmF5LnByb3RvdHlwZS5zdWJzY3JpYmVQYXJlbnRTdHJlYW0gPSBmdW5jdGlvbiAocGFyZW50U3RyZWFtKSB7XHJcbiAgICAgICAgdmFyIHN0cmVhbSA9IFN0cmVhbS5jcmVhdGVTdHJlYW0oKTtcclxuXHJcbiAgICAgICAgcGFyZW50U3RyZWFtLmZvckVhY2goZnVuY3Rpb24gKHVwZGF0ZSkge1xyXG4gICAgICAgICAgICBzdHJlYW0ucHVzaCh1cGRhdGUpO1xyXG4gICAgICAgIH0pLnVudGlsKHRoaXMuX3BhcmVudC5pc0Rpc3Bvc2luZyk7XHJcblxyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgICAgICB0aGlzLl91cGRhdGVTdHJlYW1zLnB1c2goc3RyZWFtKTtcclxuICAgICAgICBzdHJlYW0ub25DbG9zZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHRoYXQucmVtb3ZlU3RyZWFtKHRoYXQuX3VwZGF0ZVN0cmVhbXMsIHN0cmVhbSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBzdHJlYW07XHJcbiAgICB9O1xyXG5cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShJbW11dGFibGVBcnJheS5wcm90b3R5cGUsIFwidXBkYXRlc1wiLCB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnN1YnNjcmliZVBhcmVudFN0cmVhbSh0aGlzLl9wYXJlbnQudXBkYXRlcyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEltbXV0YWJsZUFycmF5LnByb3RvdHlwZSwgXCJuZXdJdGVtc1wiLCB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnN1YnNjcmliZVBhcmVudFN0cmVhbSh0aGlzLl9wYXJlbnQubmV3SXRlbXMpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcclxuICAgIH0pO1xyXG5cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShJbW11dGFibGVBcnJheS5wcm90b3R5cGUsIFwicmVtb3ZlZEl0ZW1zXCIsIHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3Vic2NyaWJlUGFyZW50U3RyZWFtKHRoaXMuX3BhcmVudC5yZW1vdmVkSXRlbXMpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcclxuICAgIH0pO1xyXG5cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShJbW11dGFibGVBcnJheS5wcm90b3R5cGUsIFwiZGlzcG9zaW5nXCIsIHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3Vic2NyaWJlUGFyZW50U3RyZWFtKHRoaXMuX3BhcmVudC5pc0Rpc3Bvc2luZyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEltbXV0YWJsZUFycmF5LnByb3RvdHlwZSwgXCJpbW11dGFibGVcIiwge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXHJcbiAgICB9KTtcclxuICAgIHJldHVybiBJbW11dGFibGVBcnJheTtcclxufSkoSW1tdXRhYmxlU3RvcmUpO1xyXG5cclxuLyoqXHJcbiogQ3JlYXRlIGFuIGFycmF5IHN0b3JlLiBJZiBhbiBpbml0aWFsIHZhbHVlIGlzIHByb3ZpZGVkIGl0IHdpbGwgaW5pdGlhbGl6ZSB0aGUgYXJyYXlcclxuKiB3aXRoIGl0LiBUaGUgaW5pdGlhbCB2YWx1ZSBjYW4gYmUgYSBKYXZhU2NyaXB0IGFycmF5IG9mIGVpdGhlciBzaW1wbGUgdmFsdWVzIG9yIHBsYWluIG9iamVjdHMuXHJcbiogSXQgdGhlIGFycmF5IGhhcyBwbGFpbiBvYmplY3RzIGEgbmVzdGVkIHN0b3JlIHdpbGwgYmUgY3JlYXRlZC5cclxuKiBAcGFyYW0gaW5pdGlhbFxyXG4qIEByZXR1cm5zIHsqfVxyXG4qL1xyXG5mdW5jdGlvbiBhcnJheShpbml0aWFsKSB7XHJcbiAgICBpZiAoaW5pdGlhbCkge1xyXG4gICAgICAgIHJldHVybiBidWlsZERlZXAoaW5pdGlhbCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBuZXcgQXJyYXlTdG9yZSgpO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuYXJyYXkgPSBhcnJheTtcclxuIiwiLyoqXHJcbiogQ3JlYXRlZCBieSBTdGVwaGFuIG9uIDI3LjEyLjIwMTQuXHJcbipcclxuKiBBIHNpbXBsZSBpbXBsZW1lbnRhdGlvbiBvZiBhIGNvbGxlY3Rpb24gc3RyZWFtIHRoYXQgc3VwcG9ydHMgcmVhY3RpdmUgcGF0dGVybnMuXHJcbipcclxuKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcbi8qKlxyXG4qIEJhc2UgaW1wbGVtZW50YXRpb24gb2YgdGhlIGNvbGxlY3Rpb24gc3RyZWFtXHJcbiovXHJcbnZhciBTdHJlYW0gPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgZnVuY3Rpb24gU3RyZWFtKF9uYW1lKSB7XHJcbiAgICAgICAgdGhpcy5fbmFtZSA9IF9uYW1lO1xyXG4gICAgICAgIHRoaXMuX2J1ZmZlciA9IFtdO1xyXG4gICAgICAgIHRoaXMuX21ldGhvZHMgPSBbXTtcclxuICAgICAgICB0aGlzLl9lcnJvck1ldGhvZHMgPSBbXTtcclxuICAgICAgICB0aGlzLl9jbG9zZU1ldGhvZHMgPSBbXTtcclxuICAgICAgICB0aGlzLl9jbG9zZWQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLl9sZW5ndGggPSAwO1xyXG4gICAgICAgIHRoaXMuX21heExlbmd0aCA9IDA7XHJcbiAgICAgICAgdGhpcy5fbmV4dFN0cmVhbXMgPSBbXTtcclxuICAgIH1cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTdHJlYW0ucHJvdG90eXBlLCBcIm5hbWVcIiwge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbmFtZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXHJcbiAgICB9KTtcclxuXHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU3RyZWFtLnByb3RvdHlwZSwgXCJsZW5ndGhcIiwge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbGVuZ3RoO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcclxuICAgIH0pO1xyXG5cclxuICAgIFN0cmVhbS5wcm90b3R5cGUuY2FsbENsb3NlTWV0aG9kcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgdGhpcy5fY2xvc2VNZXRob2RzLmZvckVhY2goZnVuY3Rpb24gKG0pIHtcclxuICAgICAgICAgICAgbS5jYWxsKHRoYXQpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBTdHJlYW0ucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICghdGhpcy5fY2xvc2VkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2Nsb3NlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMuY2FsbENsb3NlTWV0aG9kcygpO1xyXG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2UoKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIFN0cmVhbS5wcm90b3R5cGUuZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLmNsb3NlKCk7XHJcbiAgICAgICAgdGhpcy5fbWV0aG9kcyA9IFtdO1xyXG4gICAgICAgIHRoaXMuX2J1ZmZlciA9IFtdO1xyXG4gICAgICAgIHRoaXMuX2Nsb3NlTWV0aG9kcyA9IFtdO1xyXG4gICAgICAgIHRoaXMuX2Vycm9yTWV0aG9kcyA9IFtdO1xyXG4gICAgfTtcclxuXHJcbiAgICBTdHJlYW0ucHJvdG90eXBlLnRpbWVzID0gZnVuY3Rpb24gKG1heExlbmd0aCkge1xyXG4gICAgICAgIHRoaXMuX21heExlbmd0aCA9IG1heExlbmd0aDtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcblxyXG4gICAgU3RyZWFtLnByb3RvdHlwZS51bnRpbCA9IGZ1bmN0aW9uIChzdHJlYW0pIHtcclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgaWYgKHN0cmVhbSkge1xyXG4gICAgICAgICAgICBzdHJlYW0uZm9yRWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB0aGF0LmNsb3NlKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG5cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTdHJlYW0ucHJvdG90eXBlLCBcImNsb3NlZFwiLCB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jbG9zZWQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgU3RyZWFtLnByb3RvdHlwZS5hZGRUb0J1ZmZlciA9IGZ1bmN0aW9uICh2YWx1ZSkge1xyXG4gICAgICAgIHRoaXMuX2J1ZmZlci51bnNoaWZ0KHZhbHVlKTtcclxuICAgIH07XHJcblxyXG4gICAgU3RyZWFtLnByb3RvdHlwZS5wcm9jZXNzQnVmZmVyID0gZnVuY3Rpb24gKGJ1ZmZlciwgbWV0aG9kcywgYmFzZUluZGV4KSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2Nsb3NlZClcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgaWYgKCFtZXRob2RzLmxlbmd0aClcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgICAgIHZhciBsID0gYnVmZmVyLmxlbmd0aDtcclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgdmFyIGVycm9ycyA9IFtdO1xyXG5cclxuICAgICAgICB3aGlsZSAobC0tKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGJ1ZmZlci5wb3AoKTtcclxuICAgICAgICAgICAgbWV0aG9kcy5mb3JFYWNoKGZ1bmN0aW9uIChtLCBpKSB7XHJcbiAgICAgICAgICAgICAgICB0cnkgIHtcclxuICAgICAgICAgICAgICAgICAgICBtLmNhbGwodGhhdCwgdmFsdWUsIGkgKyBiYXNlSW5kZXgpO1xyXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBlcnJvcnM7XHJcbiAgICB9O1xyXG5cclxuICAgIFN0cmVhbS5wcm90b3R5cGUucHJvY2Vzc0J1ZmZlcnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGVycm9ycyA9IHRoaXMucHJvY2Vzc0J1ZmZlcih0aGlzLl9idWZmZXIsIHRoaXMuX21ldGhvZHMsIHRoaXMuX2xlbmd0aCAtIHRoaXMuX2J1ZmZlci5sZW5ndGgpO1xyXG4gICAgICAgIGlmIChlcnJvcnMgJiYgZXJyb3JzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5fZXJyb3JNZXRob2RzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wcm9jZXNzQnVmZmVyKGVycm9ycywgdGhpcy5fZXJyb3JNZXRob2RzLCAwKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGVycm9ycy5mb3JFYWNoKGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBTdHJlYW0ucHJvdG90eXBlLmFkZE1ldGhvZCA9IGZ1bmN0aW9uIChtZXRob2QpIHtcclxuICAgICAgICB2YXIgZmlyc3RNZXRob2QgPSB0aGlzLl9tZXRob2RzLmxlbmd0aCA9PT0gMDtcclxuICAgICAgICB0aGlzLl9tZXRob2RzLnB1c2gobWV0aG9kKTtcclxuXHJcbiAgICAgICAgaWYgKGZpcnN0TWV0aG9kKSB7XHJcbiAgICAgICAgICAgIHRoaXMucHJvY2Vzc0J1ZmZlcnMoKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIFN0cmVhbS5wcm90b3R5cGUucmVtb3ZlTWV0aG9kID0gZnVuY3Rpb24gKG1ldGhvZCkge1xyXG4gICAgICAgIHRoaXMuX21ldGhvZHMuaW5kZXhPZihtZXRob2QpO1xyXG4gICAgfTtcclxuXHJcbiAgICBTdHJlYW0ucHJvdG90eXBlLmFkZEVycm9yTWV0aG9kID0gZnVuY3Rpb24gKG1ldGhvZCkge1xyXG4gICAgICAgIHRoaXMuX2Vycm9yTWV0aG9kcy5wdXNoKG1ldGhvZCk7XHJcbiAgICB9O1xyXG5cclxuICAgIFN0cmVhbS5wcm90b3R5cGUuYWRkQ2xvc2VNZXRob2QgPSBmdW5jdGlvbiAobWV0aG9kKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuY2xvc2VkKSB7XHJcbiAgICAgICAgICAgIG1ldGhvZC5jYWxsKHRoaXMpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2Nsb3NlTWV0aG9kcy5wdXNoKG1ldGhvZCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBTdHJlYW0ucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICBpZiAoIXRoaXMuX2Nsb3NlZCkge1xyXG4gICAgICAgICAgICB0aGlzLmFkZFRvQnVmZmVyKHZhbHVlKTtcclxuICAgICAgICAgICAgdGhpcy5fbGVuZ3RoKys7XHJcbiAgICAgICAgICAgIHRoaXMucHJvY2Vzc0J1ZmZlcnMoKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9sZW5ndGggPT09IHRoaXMuX21heExlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBTdHJlYW0ucHJvdG90eXBlLnB1c2hFcnJvciA9IGZ1bmN0aW9uIChlcnJvcikge1xyXG4gICAgICAgIC8vIElmIHdlIGNhbid0IGhhbmRsZSB0aGUgZXJyb3Igb3Vyc2VsdmVzIHdlIHRocm93IGl0IGFnYWluLiBUaGF0IHdpbGwgZ2l2ZSBwcmVjZWRpbmcgc3RyZWFtcyB0aGUgY2hhbmNlIHRvIGhhbmRsZSB0aGVzZVxyXG4gICAgICAgIGlmICghdGhpcy5fZXJyb3JNZXRob2RzIHx8ICF0aGlzLl9lcnJvck1ldGhvZHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnByb2Nlc3NCdWZmZXIoW2Vycm9yXSwgdGhpcy5fZXJyb3JNZXRob2RzLCAwKTtcclxuICAgIH07XHJcblxyXG4gICAgU3RyZWFtLnByb3RvdHlwZS5mb3JFYWNoID0gZnVuY3Rpb24gKG1ldGhvZCkge1xyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG1ldGhvZCk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG5cclxuICAgIFN0cmVhbS5wcm90b3R5cGUucmVnaXN0ZXJOZXh0U3RyZWFtID0gZnVuY3Rpb24gKG5leHRTdHJlYW0pIHtcclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgdGhpcy5fbmV4dFN0cmVhbXMucHVzaChuZXh0U3RyZWFtKTtcclxuICAgICAgICBuZXh0U3RyZWFtLm9uQ2xvc2UoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgaSA9IHRoYXQuX25leHRTdHJlYW1zLmluZGV4T2YobmV4dFN0cmVhbSk7XHJcbiAgICAgICAgICAgIGlmIChpICE9PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgdGhhdC5fbmV4dFN0cmVhbXMuc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGF0Ll9uZXh0U3RyZWFtcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGF0LmNsb3NlKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgU3RyZWFtLnByb3RvdHlwZS5hZGRNZXRob2RUb05leHRTdHJlYW0gPSBmdW5jdGlvbiAobmV4dFN0cmVhbSwgbWV0aG9kLCBvbkNsb3NlKSB7XHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICB2YXIgZm4gPSBmdW5jdGlvbiAodmFsdWUsIGluZGV4KSB7XHJcbiAgICAgICAgICAgIHRyeSAge1xyXG4gICAgICAgICAgICAgICAgbWV0aG9kLmNhbGwodGhhdCwgdmFsdWUsIGluZGV4KTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5wdXNoRXJyb3IoZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChmbik7XHJcblxyXG4gICAgICAgIG5leHRTdHJlYW0ub25DbG9zZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHRoYXQucmVtb3ZlTWV0aG9kKGZuKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5yZWdpc3Rlck5leHRTdHJlYW0obmV4dFN0cmVhbSk7XHJcblxyXG4gICAgICAgIGlmICghb25DbG9zZSkge1xyXG4gICAgICAgICAgICB0aGlzLm9uQ2xvc2UoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5jbG9zZSgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLm9uQ2xvc2Uob25DbG9zZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBTdHJlYW0ucHJvdG90eXBlLmZpbHRlciA9IGZ1bmN0aW9uIChtZXRob2QpIHtcclxuICAgICAgICB2YXIgbmV4dFN0cmVhbSA9IG5ldyBTdHJlYW0odGhpcy5fbmFtZSArIFwiLmZpbHRlclwiKTtcclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2YgbWV0aG9kID09PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgICAgICAgdGhpcy5hZGRNZXRob2RUb05leHRTdHJlYW0obmV4dFN0cmVhbSwgZnVuY3Rpb24gKHZhbHVlLCBpbmRleCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKG1ldGhvZC5jYWxsKHRoYXQsIHZhbHVlLCBpbmRleCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBuZXh0U3RyZWFtLnB1c2godmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmFkZE1ldGhvZFRvTmV4dFN0cmVhbShuZXh0U3RyZWFtLCBmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIGlmIChtZXRob2QgPT0gdmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICBuZXh0U3RyZWFtLnB1c2godmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9jbG9zZWQpIHtcclxuICAgICAgICAgICAgbmV4dFN0cmVhbS5jbG9zZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG5leHRTdHJlYW07XHJcbiAgICB9O1xyXG5cclxuICAgIFN0cmVhbS5wcm90b3R5cGUubWFwID0gZnVuY3Rpb24gKG1ldGhvZCkge1xyXG4gICAgICAgIHZhciBuZXh0U3RyZWFtID0gbmV3IFN0cmVhbSh0aGlzLl9uYW1lICsgXCIubWFwXCIpO1xyXG5cclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBtZXRob2QgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgICAgICB0aGlzLmFkZE1ldGhvZFRvTmV4dFN0cmVhbShuZXh0U3RyZWFtLCBmdW5jdGlvbiAodmFsdWUsIGluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICBuZXh0U3RyZWFtLnB1c2gobWV0aG9kLmNhbGwodGhhdCwgdmFsdWUsIGluZGV4KSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkTWV0aG9kVG9OZXh0U3RyZWFtKG5leHRTdHJlYW0sIGZ1bmN0aW9uICh2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5wdXNoKG1ldGhvZCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2Nsb3NlZCkge1xyXG4gICAgICAgICAgICBuZXh0U3RyZWFtLmNsb3NlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbmV4dFN0cmVhbTtcclxuICAgIH07XHJcblxyXG4gICAgU3RyZWFtLnByb3RvdHlwZS5zY2FuID0gZnVuY3Rpb24gKG1ldGhvZCwgc2VlZCkge1xyXG4gICAgICAgIHZhciBuZXh0U3RyZWFtID0gbmV3IFN0cmVhbSh0aGlzLl9uYW1lICsgXCIuc2NhblwiKTtcclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgdmFyIHNjYW5uZWQgPSBzZWVkO1xyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kVG9OZXh0U3RyZWFtKG5leHRTdHJlYW0sIGZ1bmN0aW9uICh2YWx1ZSkge1xyXG4gICAgICAgICAgICBzY2FubmVkID0gbWV0aG9kLmNhbGwodGhhdCwgc2Nhbm5lZCwgdmFsdWUpO1xyXG4gICAgICAgICAgICBuZXh0U3RyZWFtLnB1c2goc2Nhbm5lZCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIG5leHRTdHJlYW0ucHVzaChzY2FubmVkKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2Nsb3NlZCkge1xyXG4gICAgICAgICAgICBuZXh0U3RyZWFtLmNsb3NlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbmV4dFN0cmVhbTtcclxuICAgIH07XHJcblxyXG4gICAgU3RyZWFtLnByb3RvdHlwZS5yZWR1Y2UgPSBmdW5jdGlvbiAobWV0aG9kLCBzZWVkKSB7XHJcbiAgICAgICAgdmFyIG5leHRTdHJlYW0gPSBuZXcgU3RyZWFtKHRoaXMuX25hbWUgKyBcIi5yZWR1Y2VcIik7XHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICAgIHZhciByZWR1Y2VkID0gc2VlZDtcclxuICAgICAgICB0aGlzLmFkZE1ldGhvZFRvTmV4dFN0cmVhbShuZXh0U3RyZWFtLCBmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICAgICAgcmVkdWNlZCA9IG1ldGhvZC5jYWxsKHRoYXQsIHJlZHVjZWQsIHZhbHVlKTtcclxuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIG5leHRTdHJlYW0ucHVzaChyZWR1Y2VkKTtcclxuICAgICAgICAgICAgbmV4dFN0cmVhbS5jbG9zZSgpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fY2xvc2VkKSB7XHJcbiAgICAgICAgICAgIG5leHRTdHJlYW0uY2xvc2UoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMucmVnaXN0ZXJOZXh0U3RyZWFtKG5leHRTdHJlYW0pO1xyXG4gICAgICAgIHJldHVybiBuZXh0U3RyZWFtO1xyXG4gICAgfTtcclxuXHJcbiAgICBTdHJlYW0ucHJvdG90eXBlLmNvbmNhdCA9IGZ1bmN0aW9uIChzdHJlYW0pIHtcclxuICAgICAgICB2YXIgbmV4dFN0cmVhbSA9IG5ldyBTdHJlYW0odGhpcy5fbmFtZSArIFwiLmNvbmNhdFwiKTtcclxuICAgICAgICB2YXIgYnVmZmVyID0gbnVsbDtcclxuXHJcbiAgICAgICAgLy8gV2hlbiB0aGlzIGlzIGFscmVhZHkgY2xvc2VkLCB3ZSBvbmx5IGNhcmUgZm9yIHRoZSBvdGhlciBzdHJlYW1cclxuICAgICAgICBpZiAoIXRoaXMuX2Nsb3NlZCkge1xyXG4gICAgICAgICAgICBidWZmZXIgPSBbXTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpZiAoc3RyZWFtLmNsb3NlZCkge1xyXG4gICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5jbG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBXZSBuZWVkIHRvIGJ1ZmZlciwgYmVjYXVzZSB0aGlzIG1heSBub3QgYmUgdGhlIGZpcnN0XHJcbiAgICAgICAgLy8gbWV0aG9kIGF0dGFjaGVkIHRvIHRoZSBzdHJlYW0uIE90aGVyd2lzZSBhbnkgZGF0YSB0aGF0XHJcbiAgICAgICAgLy8gaXMgcHVzaGVkIHRvIHN0cmVhbSBiZWZvcmUgdGhlIG9yaWdpbmFsIGlzIGNsb3NlZCB3b3VsZFxyXG4gICAgICAgIC8vIGJlIGxvc3QgZm9yIHRoZSBjb25jYXQuXHJcbiAgICAgICAgc3RyZWFtLmZvckVhY2goZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmIChidWZmZXIpIHtcclxuICAgICAgICAgICAgICAgIGJ1ZmZlci5wdXNoKHZhbHVlKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIG5leHRTdHJlYW0ucHVzaCh2YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgc3RyZWFtLm9uQ2xvc2UoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAoIWJ1ZmZlcikge1xyXG4gICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5jbG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kVG9OZXh0U3RyZWFtKG5leHRTdHJlYW0sIGZ1bmN0aW9uICh2YWx1ZSkge1xyXG4gICAgICAgICAgICBuZXh0U3RyZWFtLnB1c2godmFsdWUpO1xyXG4gICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKGJ1ZmZlcikge1xyXG4gICAgICAgICAgICAgICAgYnVmZmVyLmZvckVhY2goZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5wdXNoKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChzdHJlYW0uY2xvc2VkKSB7XHJcbiAgICAgICAgICAgICAgICBuZXh0U3RyZWFtLmNsb3NlKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGJ1ZmZlciA9IG51bGw7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9jbG9zZWQgJiYgc3RyZWFtLmNsb3NlZCkge1xyXG4gICAgICAgICAgICBuZXh0U3RyZWFtLmNsb3NlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbmV4dFN0cmVhbTtcclxuICAgIH07XHJcblxyXG4gICAgU3RyZWFtLnByb3RvdHlwZS5jb25jYXRBbGwgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIG5leHRTdHJlYW0gPSBuZXcgU3RyZWFtKHRoaXMuX25hbWUgKyBcIi5jb25jYXRBbGxcIik7XHJcbiAgICAgICAgdmFyIHF1ZXVlID0gW107XHJcbiAgICAgICAgdmFyIGN1cnNvciA9IG51bGw7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIG5leHRJblF1ZXVlKCkge1xyXG4gICAgICAgICAgICB2YXIgbCA9IHF1ZXVlLmxlbmd0aDtcclxuXHJcbiAgICAgICAgICAgIHdoaWxlIChsLS0pIHtcclxuICAgICAgICAgICAgICAgIGN1cnNvciA9IHF1ZXVlW2xdO1xyXG4gICAgICAgICAgICAgICAgdXBkYXRlKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoY3Vyc29yLmRvbmUpIHtcclxuICAgICAgICAgICAgICAgICAgICBxdWV1ZS5wb3AoKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHVwZGF0ZSgpIHtcclxuICAgICAgICAgICAgaWYgKGN1cnNvcikge1xyXG4gICAgICAgICAgICAgICAgdmFyIGwgPSBjdXJzb3IuZGF0YS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAobC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5wdXNoKGN1cnNvci5kYXRhLnBvcCgpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gY29uY2F0U3RyZWFtKHN0cmVhbSkge1xyXG4gICAgICAgICAgICB2YXIgc3ViQnVmZmVyID0ge1xyXG4gICAgICAgICAgICAgICAgZGF0YTogW10sXHJcbiAgICAgICAgICAgICAgICBkb25lOiBmYWxzZVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBxdWV1ZS51bnNoaWZ0KHN1YkJ1ZmZlcik7XHJcblxyXG4gICAgICAgICAgICBzdHJlYW0uZm9yRWFjaChmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIHN1YkJ1ZmZlci5kYXRhLnVuc2hpZnQodmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgdXBkYXRlKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgc3RyZWFtLm9uQ2xvc2UoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgc3ViQnVmZmVyLmRvbmUgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgbmV4dEluUXVldWUoKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICBjdXJzb3IgPSBzdWJCdWZmZXI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbiAoc3ViU3RyZWFtKSB7XHJcbiAgICAgICAgICAgIGNvbmNhdFN0cmVhbShzdWJTdHJlYW0pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLm9uQ2xvc2UoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBuZXh0U3RyZWFtLmNsb3NlKCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9jbG9zZWQpIHtcclxuICAgICAgICAgICAgbmV4dFN0cmVhbS5jbG9zZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5yZWdpc3Rlck5leHRTdHJlYW0obmV4dFN0cmVhbSk7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXh0U3RyZWFtO1xyXG4gICAgfTtcclxuXHJcbiAgICBTdHJlYW0ucHJvdG90eXBlLmNvbWJpbmUgPSBmdW5jdGlvbiAoc3RyZWFtKSB7XHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICAgIHZhciBuZXh0U3RyZWFtID0gbmV3IFN0cmVhbSh0aGlzLl9uYW1lICsgXCIuY29tYmluZVwiKTtcclxuXHJcbiAgICAgICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uICh2YWx1ZSkge1xyXG4gICAgICAgICAgICBuZXh0U3RyZWFtLnB1c2godmFsdWUpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBzdHJlYW0uZm9yRWFjaChmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICAgICAgbmV4dFN0cmVhbS5wdXNoKHZhbHVlKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5vbkNsb3NlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKHN0cmVhbS5jbG9zZWQpIHtcclxuICAgICAgICAgICAgICAgIG5leHRTdHJlYW0uY2xvc2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBzdHJlYW0ub25DbG9zZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGF0Ll9jbG9zZWQpIHtcclxuICAgICAgICAgICAgICAgIG5leHRTdHJlYW0uY2xvc2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fY2xvc2VkICYmIHN0cmVhbS5jbG9zZWQpIHtcclxuICAgICAgICAgICAgbmV4dFN0cmVhbS5jbG9zZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5yZWdpc3Rlck5leHRTdHJlYW0obmV4dFN0cmVhbSk7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXh0U3RyZWFtO1xyXG4gICAgfTtcclxuXHJcbiAgICBTdHJlYW0ucHJvdG90eXBlLm9uQ2xvc2UgPSBmdW5jdGlvbiAobWV0aG9kKSB7XHJcbiAgICAgICAgdGhpcy5hZGRDbG9zZU1ldGhvZChtZXRob2QpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuXHJcbiAgICBTdHJlYW0ucHJvdG90eXBlLm9uRXJyb3IgPSBmdW5jdGlvbiAobWV0aG9kKSB7XHJcbiAgICAgICAgdGhpcy5hZGRFcnJvck1ldGhvZChtZXRob2QpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuICAgIHJldHVybiBTdHJlYW07XHJcbn0pKCk7XHJcbmV4cG9ydHMuU3RyZWFtID0gU3RyZWFtO1xyXG5cclxuLyoqXHJcbiogQ3JlYXRlIGEgbmV3IHN0cmVhbS4gVGhlIG5hbWUgaXMgbW9zdGx5IGZvciBkZWJ1Z2dpbmcgcHVycG9zZXMgYW5kIGNhbiBiZSBvbWl0dGVkLiBJdCBkZWZhdWx0cyB0byAnc3RyZWFtJyB0aGVuLlxyXG4qIEBwYXJhbSBuYW1lXHJcbiogQHJldHVybnMge1N0cmVhbX1cclxuKi9cclxuZnVuY3Rpb24gY3JlYXRlU3RyZWFtKG5hbWUpIHtcclxuICAgIHJldHVybiBuZXcgU3RyZWFtKG5hbWUgfHwgXCJzdHJlYW1cIik7XHJcbn1cclxuZXhwb3J0cy5jcmVhdGVTdHJlYW0gPSBjcmVhdGVTdHJlYW07XHJcbiIsIi8qKlxyXG4qIENyZWF0ZWQgYnkgU3RlcGhhbi5TbW9sYSBvbiAzMC4xMC4yMDE0LlxyXG4qL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuLyoqXHJcbiogRGV0ZXJtaW5lIHRoZSBzY3JlZW4gcG9zaXRpb24gYW5kIHNpemUgb2YgYW4gZWxlbWVudCBpbiB0aGUgRE9NXHJcbiogQHBhcmFtIGVsZW1lbnRcclxuKiBAcmV0dXJucyB7e3g6IG51bWJlciwgeTogbnVtYmVyLCB3OiBudW1iZXIsIGg6IG51bWJlcn19XHJcbiovXHJcbmZ1bmN0aW9uIGVsZW1lbnRQb3NpdGlvbkFuZFNpemUoZWxlbWVudCkge1xyXG4gICAgdmFyIHJlY3QgPSBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG4gICAgcmV0dXJuIHsgeDogcmVjdC5sZWZ0LCB5OiByZWN0LnRvcCwgdzogcmVjdC53aWR0aCwgaDogcmVjdC5oZWlnaHQgfTtcclxufVxyXG5leHBvcnRzLmVsZW1lbnRQb3NpdGlvbkFuZFNpemUgPSBlbGVtZW50UG9zaXRpb25BbmRTaXplO1xyXG5cclxudmFyIHBmeCA9IFtcclxuICAgIHsgaWQ6IFwid2Via2l0XCIsIGNhbWVsQ2FzZTogdHJ1ZSB9LFxyXG4gICAgeyBpZDogXCJNU1wiLCBjYW1lbENhc2U6IHRydWUgfSxcclxuICAgIHsgaWQ6IFwib1wiLCBjYW1lbENhc2U6IHRydWUgfSxcclxuICAgIHsgaWQ6IFwiXCIsIGNhbWVsQ2FzZTogZmFsc2UgfV07XHJcblxyXG4vKipcclxuKiBBZGQgZXZlbnQgbGlzdGVuZXIgZm9yIHByZWZpeGVkIGV2ZW50cy4gQXMgdGhlIGNhbWVsIGNhc2luZyBvZiB0aGUgZXZlbnQgbGlzdGVuZXJzIGlzIGRpZmZlcmVudFxyXG4qIGFjcm9zcyBicm93c2VycyB5b3UgbmVlZCB0byBzcGVjaWZpeSB0aGUgdHlwZSBjYW1lbGNhc2VkIHN0YXJ0aW5nIHdpdGggYSBjYXBpdGFsIGxldHRlci4gVGhlIGZ1bmN0aW9uXHJcbiogdGhlbiB0YWtlcyBjYXJlIG9mIHRoZSBicm93c2VyIHNwZWNpZmljcy5cclxuKlxyXG4qIEBwYXJhbSBlbGVtZW50XHJcbiogQHBhcmFtIHR5cGVcclxuKiBAcGFyYW0gY2FsbGJhY2tcclxuKi9cclxuZnVuY3Rpb24gYWRkUHJlZml4ZWRFdmVudExpc3RlbmVyKGVsZW1lbnQsIHR5cGUsIGNhbGxiYWNrKSB7XHJcbiAgICBmb3IgKHZhciBwID0gMDsgcCA8IHBmeC5sZW5ndGg7IHArKykge1xyXG4gICAgICAgIGlmICghcGZ4W3BdLmNhbWVsQ2FzZSlcclxuICAgICAgICAgICAgdHlwZSA9IHR5cGUudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKHBmeFtwXS5pZCArIHR5cGUsIGNhbGxiYWNrLCBmYWxzZSk7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5hZGRQcmVmaXhlZEV2ZW50TGlzdGVuZXIgPSBhZGRQcmVmaXhlZEV2ZW50TGlzdGVuZXI7XHJcblxyXG4vKipcclxuKiBDb252ZW5pZW5jZSBtZXRob2QgZm9yIGNhbGxpbmcgY2FsbGJhY2tzXHJcbiogQHBhcmFtIGNiICAgIFRoZSBjYWxsYmFjayBmdW5jdGlvbiB0byBjYWxsXHJcbiovXHJcbmZ1bmN0aW9uIGNhbGxDYWxsYmFjayhjYikge1xyXG4gICAgdmFyIGFueSA9IFtdO1xyXG4gICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IChhcmd1bWVudHMubGVuZ3RoIC0gMSk7IF9pKyspIHtcclxuICAgICAgICBhbnlbX2ldID0gYXJndW1lbnRzW19pICsgMV07XHJcbiAgICB9XHJcbiAgICBpZiAoY2IpIHtcclxuICAgICAgICBpZiAodHlwZW9mIChjYikgPT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgICAgIHZhciBhcmdzID0gW107XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBhcmdzLnB1c2goYXJndW1lbnRzW2ldKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gY2IuYXBwbHkodGhpcywgYXJncyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2FsbGJhY2sgaXMgbm90IGEgZnVuY3Rpb24hXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5leHBvcnRzLmNhbGxDYWxsYmFjayA9IGNhbGxDYWxsYmFjaztcclxuXHJcbi8qKlxyXG4qIENoZWNrIGlmIHNvbWV0aGluZyBpcyBhbiBhcnJheS5cclxuKiBAcGFyYW0gdGhpbmdcclxuKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuKi9cclxuZnVuY3Rpb24gaXNBcnJheSh0aGluZykge1xyXG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh0aGluZykgPT09ICdbb2JqZWN0IEFycmF5XSc7XHJcbn1cclxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcclxuXHJcbnZhciBPSURfUFJPUCA9IFwiX19JRF9fXCI7XHJcbnZhciBvaWRzID0gMTAwMDA7XHJcblxyXG4vKipcclxuKiBDcmVhdGUgYW5kIHJldHVybiBhIHVuaXF1ZSBpZCBvbiBhIEphdmFTY3JpcHQgb2JqZWN0LiBUaGlzIGFkZHMgYSBuZXcgcHJvcGVydHlcclxuKiBfX0lEX18gdG8gdGhhdCBvYmplY3QuIElkcyBhcmUgbnVtYmVycy5cclxuKlxyXG4qIFRoZSBJRCBpcyBjcmVhdGVkIHRoZSBmaXJzdCB0aW1lIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGZvciB0aGF0IG9iamVjdCBhbmQgdGhlblxyXG4qIHdpbGwgc2ltcGx5IGJlIHJldHVybmVkIG9uIGFsbCBzdWJzZXF1ZW50IGNhbGxzLlxyXG4qXHJcbiogQHBhcmFtIG9ialxyXG4qIEByZXR1cm5zIHthbnl9XHJcbiovXHJcbmZ1bmN0aW9uIG9pZChvYmopIHtcclxuICAgIGlmIChvYmopIHtcclxuICAgICAgICBpZiAoIW9iai5oYXNPd25Qcm9wZXJ0eShPSURfUFJPUCkpIHtcclxuICAgICAgICAgICAgb2JqW09JRF9QUk9QXSA9IG9pZHMrKztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBvYmpbT0lEX1BST1BdO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMub2lkID0gb2lkO1xyXG5cclxuZnVuY3Rpb24gYXBwbHlNaXhpbnMoZGVyaXZlZEN0b3IsIGJhc2VDdG9ycykge1xyXG4gICAgYmFzZUN0b3JzLmZvckVhY2goZnVuY3Rpb24gKGJhc2VDdG9yKSB7XHJcbiAgICAgICAgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoYmFzZUN0b3IpLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcclxuICAgICAgICAgICAgZGVyaXZlZEN0b3IucHJvdG90eXBlW25hbWVdID0gYmFzZUN0b3JbbmFtZV07XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiogVXNlIHRoaXMgdG8gc3ViY2xhc3MgYSB0eXBlc2NyaXB0IGNsYXNzIHVzaW5nIHBsYWluIEphdmFTY3JpcHQuIFNwZWMgaXMgYW4gb2JqZWN0XHJcbiogY29udGFpbmluZyBwcm9wZXJ0aWVzIGFuZCBtZXRob2RzIG9mIHRoZSBuZXcgY2xhc3MuIE1ldGhvZHMgaW4gc3BlYyB3aWxsIG92ZXJyaWRlXHJcbiogbWV0aG9kcyBpbiBiYXNlQ2xhc3MuXHJcbipcclxuKiBZb3Ugd2lsbCBOT1QgYmUgYWJsZSB0byBtYWtlIHN1cGVyIGNhbGxzIGluIHRoZSBzdWJjbGFzcy5cclxuKlxyXG4qIEBwYXJhbSBzcGVjXHJcbiogQHBhcmFtIGJhc2VDbGFzc1xyXG4qIEByZXR1cm5zIHthbnl9XHJcbiovXHJcbmZ1bmN0aW9uIHN1YmNsYXNzKHNwZWMsIGJhc2VDbGFzcykge1xyXG4gICAgdmFyIGNvbnN0cnVjdG9yO1xyXG4gICAgaWYgKHNwZWMuaGFzT3duUHJvcGVydHkoXCJjb25zdHJ1Y3RvclwiKSkge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yID0gc3BlY1tcImNvbnN0cnVjdG9yXCJdO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBjb25zdHJ1Y3RvciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgYmFzZUNsYXNzLnByb3RvdHlwZS5jb25zdHJ1Y3Rvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3RydWN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShiYXNlQ2xhc3MucHJvdG90eXBlKTtcclxuICAgIGFwcGx5TWl4aW5zKGNvbnN0cnVjdG9yLCBbc3BlY10pO1xyXG5cclxuICAgIHJldHVybiBjb25zdHJ1Y3RvcjtcclxufVxyXG5leHBvcnRzLnN1YmNsYXNzID0gc3ViY2xhc3M7XHJcbiIsIm1vZHVsZS5leHBvcnRzLnRvb2xzID0gcmVxdWlyZSgnLi9jb21tb25qcy9mbHVzcy90b29scycpO1xyXG5tb2R1bGUuZXhwb3J0cy5iYXNlQWN0aW9ucyA9IHJlcXVpcmUoJy4vY29tbW9uanMvZmx1c3MvYmFzZUFjdGlvbnMnKTtcclxubW9kdWxlLmV4cG9ydHMuZGlzcGF0Y2hlciA9IHJlcXVpcmUoJy4vY29tbW9uanMvZmx1c3MvZGlzcGF0Y2hlcicpO1xyXG5tb2R1bGUuZXhwb3J0cy5lcnJvcnMgPSByZXF1aXJlKCcuL2NvbW1vbmpzL2ZsdXNzL2Vycm9ycycpO1xyXG5tb2R1bGUuZXhwb3J0cy5wbHVnaW5zID0gcmVxdWlyZSgnLi9jb21tb25qcy9mbHVzcy9wbHVnaW5zJyk7XHJcbm1vZHVsZS5leHBvcnRzLnJlYWN0TWl4aW5zID0gcmVxdWlyZSgnLi9jb21tb25qcy9mbHVzcy9yZWFjdE1peGlucycpO1xyXG5tb2R1bGUuZXhwb3J0cy5zdG9yZSA9IHJlcXVpcmUoJy4vY29tbW9uanMvZmx1c3Mvc3RvcmUnKTtcclxubW9kdWxlLmV4cG9ydHMuc3RyZWFtID0gcmVxdWlyZSgnLi9jb21tb25qcy9mbHVzcy9zdHJlYW0nKTtcclxuIl19
