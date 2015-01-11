(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Created by Stephan on 11.01.2015.
 */
"use strict";
var Store = require("../node_modules/fluss/lib/store");
var array = Store.array();
array.newItems.forEach(function (update) {
    console.log(update.value + " was added.");
});
array.push("One");
array.push(2);

//# sourceMappingURL=main.js.map
},{"../node_modules/fluss/lib/store":2}],2:[function(require,module,exports){
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
//# sourceMappingURL=store.js.map

},{"./stream":3,"./tools":4}],3:[function(require,module,exports){
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
//# sourceMappingURL=stream.js.map

},{}],4:[function(require,module,exports){
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
//# sourceMappingURL=tools.js.map

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQ29tbW9uSlNCcm93c2VyaWZ5X1RTXFxtYWluLmpzIiwibm9kZV9tb2R1bGVzXFxmbHVzc1xcbGliXFxzdG9yZS5qcyIsIm5vZGVfbW9kdWxlc1xcZmx1c3NcXGxpYlxcc3RyZWFtLmpzIiwibm9kZV9tb2R1bGVzXFxmbHVzc1xcbGliXFx0b29scy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5ZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIENyZWF0ZWQgYnkgU3RlcGhhbiBvbiAxMS4wMS4yMDE1LlxuICovXG5cInVzZSBzdHJpY3RcIjtcbnZhciBTdG9yZSA9IHJlcXVpcmUoXCIuLi9ub2RlX21vZHVsZXMvZmx1c3MvbGliL3N0b3JlXCIpO1xudmFyIGFycmF5ID0gU3RvcmUuYXJyYXkoKTtcbmFycmF5Lm5ld0l0ZW1zLmZvckVhY2goZnVuY3Rpb24gKHVwZGF0ZSkge1xuICAgIGNvbnNvbGUubG9nKHVwZGF0ZS52YWx1ZSArIFwiIHdhcyBhZGRlZC5cIik7XG59KTtcbmFycmF5LnB1c2goXCJPbmVcIik7XG5hcnJheS5wdXNoKDIpO1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1tYWluLmpzLm1hcCIsIi8qKlxyXG4qIENyZWF0ZWQgYnkgU3RlcGhhbiBvbiAyOS4xMi4yMDE0LlxyXG4qL1xyXG5cInVzZSBzdHJpY3RcIjtcclxudmFyIF9fZXh0ZW5kcyA9IHRoaXMuX19leHRlbmRzIHx8IGZ1bmN0aW9uIChkLCBiKSB7XHJcbiAgICBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTtcclxuICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxyXG4gICAgX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGU7XHJcbiAgICBkLnByb3RvdHlwZSA9IG5ldyBfXygpO1xyXG59O1xyXG52YXIgVG9vbHMgPSByZXF1aXJlKFwiLi90b29sc1wiKTtcclxudmFyIFN0cmVhbSA9IHJlcXVpcmUoXCIuL3N0cmVhbVwiKTtcclxuXHJcbi8qKlxyXG4qIFRlc3QgaWYgc29tZXRoaW5nIGlzIGEgc3RvcmUuXHJcbiogQHBhcmFtIHRoaW5nXHJcbiogQHJldHVybnMge2Jvb2xlYW59XHJcbiovXHJcbmZ1bmN0aW9uIGlzU3RvcmUodGhpbmcpIHtcclxuICAgIHJldHVybiB0aGluZyBpbnN0YW5jZW9mIFJlY29yZFN0b3JlIHx8IHRoaW5nIGluc3RhbmNlb2YgQXJyYXlTdG9yZSB8fCB0aGluZyBpbnN0YW5jZW9mIEltbXV0YWJsZVJlY29yZCB8fCB0aGluZyBpbnN0YW5jZW9mIEltbXV0YWJsZUFycmF5O1xyXG59XHJcbmV4cG9ydHMuaXNTdG9yZSA9IGlzU3RvcmU7XHJcblxyXG5cclxuZnVuY3Rpb24gY3JlYXRlVXBkYXRlSW5mbyhpdGVtLCB2YWx1ZSwgc3RvcmUsIHBhdGgsIHJvb3RJdGVtKSB7XHJcbiAgICB2YXIgciA9IHtcclxuICAgICAgICBpdGVtOiBpdGVtLFxyXG4gICAgICAgIHZhbHVlOiB2YWx1ZSxcclxuICAgICAgICBzdG9yZTogc3RvcmVcclxuICAgIH07XHJcblxyXG4gICAgaWYgKHBhdGgpIHtcclxuICAgICAgICByW1wicGF0aFwiXSA9IHBhdGg7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHJvb3RJdGVtICE9IG51bGwpIHtcclxuICAgICAgICByW1wicm9vdEl0ZW1cIl0gPSByb290SXRlbTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcltcInJvb3RJdGVtXCJdID0gaXRlbTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcjtcclxufVxyXG5cclxuXHJcblxyXG52YXIgU3RvcmUgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgZnVuY3Rpb24gU3RvcmUoKSB7XHJcbiAgICAgICAgdGhpcy5fYWRkSXRlbXNTdHJlYW1zID0gW107XHJcbiAgICAgICAgdGhpcy5fcmVtb3ZlSXRlbXNTdHJlYW1zID0gW107XHJcbiAgICAgICAgdGhpcy5fdXBkYXRlU3RyZWFtcyA9IFtdO1xyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2luZ1N0cmVhbXMgPSBbXTtcclxuICAgIH1cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTdG9yZS5wcm90b3R5cGUsIFwiaXNJbW11dGFibGVcIiwge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgU3RvcmUucHJvdG90eXBlLnJlbW92ZVN0cmVhbSA9IGZ1bmN0aW9uIChsaXN0LCBzdHJlYW0pIHtcclxuICAgICAgICB2YXIgaSA9IGxpc3QuaW5kZXhPZihzdHJlYW0pO1xyXG4gICAgICAgIGlmIChpICE9PSAtMSkge1xyXG4gICAgICAgICAgICBsaXN0LnNwbGljZShpLCAxKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTdG9yZS5wcm90b3R5cGUsIFwibmV3SXRlbXNcIiwge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgICAgIHZhciBzID0gU3RyZWFtLmNyZWF0ZVN0cmVhbShcImFkZFByb3BlcnR5XCIpO1xyXG4gICAgICAgICAgICB0aGlzLl9hZGRJdGVtc1N0cmVhbXMucHVzaChzKTtcclxuXHJcbiAgICAgICAgICAgIHMub25DbG9zZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB0aGF0LnJlbW92ZVN0cmVhbSh0aGF0Ll9hZGRJdGVtc1N0cmVhbXMsIHMpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIHM7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFN0b3JlLnByb3RvdHlwZSwgXCJyZW1vdmVkSXRlbXNcIiwge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgICAgIHZhciBzID0gU3RyZWFtLmNyZWF0ZVN0cmVhbShcInJlbW92ZVByb3BlcnR5XCIpO1xyXG4gICAgICAgICAgICB0aGlzLl9yZW1vdmVJdGVtc1N0cmVhbXMucHVzaChzKTtcclxuICAgICAgICAgICAgcy5vbkNsb3NlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHRoYXQucmVtb3ZlU3RyZWFtKHRoYXQuX3JlbW92ZUl0ZW1zU3RyZWFtcywgcyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgcy51bnRpbCh0aGlzLmlzRGlzcG9zaW5nKTtcclxuICAgICAgICAgICAgcmV0dXJuIHM7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFN0b3JlLnByb3RvdHlwZSwgXCJ1cGRhdGVzXCIsIHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICAgICAgICB2YXIgcyA9IFN0cmVhbS5jcmVhdGVTdHJlYW0oXCJ1cGRhdGVQcm9wZXJ0eVwiKTtcclxuICAgICAgICAgICAgdGhpcy5fdXBkYXRlU3RyZWFtcy5wdXNoKHMpO1xyXG4gICAgICAgICAgICBzLm9uQ2xvc2UoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdGhhdC5yZW1vdmVTdHJlYW0odGhhdC5fdXBkYXRlU3RyZWFtcywgcyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gcztcclxuICAgICAgICB9LFxyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXHJcbiAgICB9KTtcclxuXHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU3RvcmUucHJvdG90eXBlLCBcImFsbENoYW5nZXNcIiwge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy51cGRhdGVzLmNvbWJpbmUodGhpcy5uZXdJdGVtcykuY29tYmluZSh0aGlzLnJlbW92ZWRJdGVtcyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFN0b3JlLnByb3RvdHlwZSwgXCJpc0Rpc3Bvc2luZ1wiLCB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgICAgICAgICAgdmFyIHMgPSBTdHJlYW0uY3JlYXRlU3RyZWFtKFwiZGlzcG9zaW5nXCIpO1xyXG4gICAgICAgICAgICB0aGlzLl9kaXNwb3NpbmdTdHJlYW1zLnB1c2gocyk7XHJcbiAgICAgICAgICAgIHJldHVybiBzO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcclxuICAgIH0pO1xyXG5cclxuICAgIFN0b3JlLnByb3RvdHlwZS5kaXNwb3NlU3RyZWFtcyA9IGZ1bmN0aW9uIChzdHJlYW1MaXN0KSB7XHJcbiAgICAgICAgc3RyZWFtTGlzdC5mb3JFYWNoKGZ1bmN0aW9uIChzdHJlYW0pIHtcclxuICAgICAgICAgICAgc3RyZWFtLmRpc3Bvc2UoKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgc3RyZWFtTGlzdCA9IFtdO1xyXG4gICAgfTtcclxuXHJcbiAgICBTdG9yZS5wcm90b3R5cGUuZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLl9kaXNwb3NpbmdTdHJlYW1zLmZvckVhY2goZnVuY3Rpb24gKHN0cmVhbSkge1xyXG4gICAgICAgICAgICBzdHJlYW0ucHVzaCh0cnVlKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NlU3RyZWFtcyh0aGlzLl9yZW1vdmVJdGVtc1N0cmVhbXMpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zZVN0cmVhbXModGhpcy5fdXBkYXRlU3RyZWFtcyk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NlU3RyZWFtcyh0aGlzLl9hZGRJdGVtc1N0cmVhbXMpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zZVN0cmVhbXModGhpcy5fZGlzcG9zaW5nU3RyZWFtcyk7XHJcbiAgICB9O1xyXG5cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTdG9yZS5wcm90b3R5cGUsIFwiaW1tdXRhYmxlXCIsIHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgU3RvcmUucHJvdG90eXBlLml0ZW0gPSBmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIFN0b3JlO1xyXG59KSgpO1xyXG5cclxuLyoqXHJcbiogQmFzZSBjbGFzcyBmb3IgaW1tdXRhYmxlIHN0b3Jlcy5cclxuKi9cclxudmFyIEltbXV0YWJsZVN0b3JlID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcclxuICAgIF9fZXh0ZW5kcyhJbW11dGFibGVTdG9yZSwgX3N1cGVyKTtcclxuICAgIGZ1bmN0aW9uIEltbXV0YWJsZVN0b3JlKCkge1xyXG4gICAgICAgIF9zdXBlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIEltbXV0YWJsZVN0b3JlO1xyXG59KShTdG9yZSk7XHJcblxyXG52YXIgUmVjb3JkU3RvcmUgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xyXG4gICAgX19leHRlbmRzKFJlY29yZFN0b3JlLCBfc3VwZXIpO1xyXG4gICAgZnVuY3Rpb24gUmVjb3JkU3RvcmUoaW5pdGlhbCkge1xyXG4gICAgICAgIF9zdXBlci5jYWxsKHRoaXMpO1xyXG4gICAgICAgIHRoaXMuX2RhdGEgPSB7fTtcclxuICAgICAgICB0aGlzLl9zdWJTdHJlYW1zID0ge307XHJcblxyXG4gICAgICAgIGlmIChpbml0aWFsKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gaW5pdGlhbCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGluaXRpYWwuaGFzT3duUHJvcGVydHkocHJvcCkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEl0ZW0ocHJvcCwgaW5pdGlhbFtwcm9wXSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBSZWNvcmRTdG9yZS5wcm90b3R5cGUuY2hlY2tOYW1lQWxsb3dlZCA9IGZ1bmN0aW9uIChuYW1lKSB7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9O1xyXG5cclxuICAgIFJlY29yZFN0b3JlLnByb3RvdHlwZS5zZXR1cFN1YlN0cmVhbSA9IGZ1bmN0aW9uIChuYW1lLCB2YWx1ZSkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zZVN1YlN0cmVhbShuYW1lKTtcclxuICAgICAgICBpZiAoZXhwb3J0cy5pc1N0b3JlKHZhbHVlKSkge1xyXG4gICAgICAgICAgICB2YXIgc3ViU3RyZWFtO1xyXG4gICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgICAgIHN1YlN0cmVhbSA9IHZhbHVlLnVwZGF0ZXM7XHJcbiAgICAgICAgICAgIHN1YlN0cmVhbS5mb3JFYWNoKGZ1bmN0aW9uICh1cGRhdGUpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpbmZvID0gY3JlYXRlVXBkYXRlSW5mbyh1cGRhdGUuaXRlbSwgdXBkYXRlLnZhbHVlLCB1cGRhdGUuc3RvcmUsIHVwZGF0ZS5wYXRoID8gbmFtZSArIFwiLlwiICsgdXBkYXRlLnBhdGggOiBuYW1lICsgXCIuXCIgKyB1cGRhdGUuaXRlbSwgbmFtZSk7XHJcbiAgICAgICAgICAgICAgICB0aGF0Ll91cGRhdGVTdHJlYW1zLmZvckVhY2goZnVuY3Rpb24gKHN0cmVhbSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbS5wdXNoKGluZm8pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5fc3ViU3RyZWFtc1tuYW1lXSA9IHN1YlN0cmVhbTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIFJlY29yZFN0b3JlLnByb3RvdHlwZS5kaXNwb3NlU3ViU3RyZWFtID0gZnVuY3Rpb24gKG5hbWUpIHtcclxuICAgICAgICB2YXIgc3ViU3RyZWFtID0gdGhpcy5fc3ViU3RyZWFtc1tuYW1lXTtcclxuICAgICAgICBpZiAoc3ViU3RyZWFtKSB7XHJcbiAgICAgICAgICAgIHN1YlN0cmVhbS5kaXNwb3NlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBSZWNvcmRTdG9yZS5wcm90b3R5cGUuYWRkSXRlbSA9IGZ1bmN0aW9uIChuYW1lLCBpbml0aWFsKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrTmFtZUFsbG93ZWQobmFtZSkpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTmFtZSAnXCIgKyBuYW1lICsgXCInIG5vdCBhbGxvd2VkIGZvciBwcm9wZXJ0eSBvZiBvYmplY3Qgc3RvcmUuXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgbmFtZSwge1xyXG4gICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXHJcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoYXQuX2RhdGFbbmFtZV07XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGF0Ll9kYXRhW25hbWVdID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICB2YXIgdXBkYXRlSW5mbyA9IGNyZWF0ZVVwZGF0ZUluZm8obmFtZSwgdmFsdWUsIHRoYXQpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoYXQuc2V0dXBTdWJTdHJlYW0obmFtZSwgdmFsdWUpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoYXQuX3VwZGF0ZVN0cmVhbXMuZm9yRWFjaChmdW5jdGlvbiAoc3RyZWFtKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RyZWFtLnB1c2godXBkYXRlSW5mbyk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLl9kYXRhW25hbWVdID0gaW5pdGlhbDtcclxuXHJcbiAgICAgICAgdGhpcy5zZXR1cFN1YlN0cmVhbShuYW1lLCBpbml0aWFsKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2FkZEl0ZW1zU3RyZWFtcykge1xyXG4gICAgICAgICAgICB0aGlzLl9hZGRJdGVtc1N0cmVhbXMuZm9yRWFjaChmdW5jdGlvbiAoc3RyZWFtKSB7XHJcbiAgICAgICAgICAgICAgICBzdHJlYW0ucHVzaChjcmVhdGVVcGRhdGVJbmZvKG5hbWUsIGluaXRpYWwsIHRoYXQpKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBSZWNvcmRTdG9yZS5wcm90b3R5cGUucmVtb3ZlSXRlbSA9IGZ1bmN0aW9uIChuYW1lKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2RhdGEuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcclxuICAgICAgICAgICAgZGVsZXRlIHRoaXNbbmFtZV07XHJcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9kYXRhW25hbWVdO1xyXG4gICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2VTdWJTdHJlYW0obmFtZSk7XHJcbiAgICAgICAgICAgIHRoaXMuX3JlbW92ZUl0ZW1zU3RyZWFtcy5mb3JFYWNoKGZ1bmN0aW9uIChzdHJlYW0pIHtcclxuICAgICAgICAgICAgICAgIHN0cmVhbS5wdXNoKGNyZWF0ZVVwZGF0ZUluZm8obmFtZSwgbnVsbCwgdGhhdCkpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmtub3duIHByb3BlcnR5ICdcIiArIG5hbWUgKyBcIicuXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFJlY29yZFN0b3JlLnByb3RvdHlwZSwgXCJpbW11dGFibGVcIiwge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMuX2ltbXV0YWJsZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5faW1tdXRhYmxlID0gbmV3IEltbXV0YWJsZVJlY29yZCh0aGlzKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2ltbXV0YWJsZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXHJcbiAgICB9KTtcclxuXHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoUmVjb3JkU3RvcmUucHJvdG90eXBlLCBcImtleXNcIiwge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgciA9IFtdO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBrIGluIHRoaXMuX2RhdGEpIHtcclxuICAgICAgICAgICAgICAgIHIucHVzaChrKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHI7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgUmVjb3JkU3RvcmUucHJvdG90eXBlLmRpc3Bvc2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICAgIHRoaXMua2V5cy5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcclxuICAgICAgICAgICAgaWYgKGV4cG9ydHMuaXNTdG9yZSh0aGF0W2tleV0pKSB7XHJcbiAgICAgICAgICAgICAgICB0aGF0W2tleV0uZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGRlbGV0ZSB0aGF0W2tleV07XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5fZGF0YSA9IG51bGw7XHJcblxyXG4gICAgICAgIF9zdXBlci5wcm90b3R5cGUuZGlzcG9zZS5jYWxsKHRoaXMpO1xyXG4gICAgfTtcclxuICAgIHJldHVybiBSZWNvcmRTdG9yZTtcclxufSkoU3RvcmUpO1xyXG5cclxuXHJcbnZhciBJbW11dGFibGVSZWNvcmQgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xyXG4gICAgX19leHRlbmRzKEltbXV0YWJsZVJlY29yZCwgX3N1cGVyKTtcclxuICAgIGZ1bmN0aW9uIEltbXV0YWJsZVJlY29yZChfcGFyZW50KSB7XHJcbiAgICAgICAgX3N1cGVyLmNhbGwodGhpcyk7XHJcbiAgICAgICAgdGhpcy5fcGFyZW50ID0gX3BhcmVudDtcclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgIF9wYXJlbnQua2V5cy5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcclxuICAgICAgICAgICAgdGhhdC5hZGRJdGVtKGtleSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIF9wYXJlbnQubmV3SXRlbXMuZm9yRWFjaChmdW5jdGlvbiAodXBkYXRlKSB7XHJcbiAgICAgICAgICAgIHRoYXQuYWRkSXRlbSh1cGRhdGUuaXRlbSk7XHJcbiAgICAgICAgfSkudW50aWwoX3BhcmVudC5pc0Rpc3Bvc2luZyk7XHJcblxyXG4gICAgICAgIF9wYXJlbnQucmVtb3ZlZEl0ZW1zLmZvckVhY2goZnVuY3Rpb24gKHVwZGF0ZSkge1xyXG4gICAgICAgICAgICB0aGF0LnJlbW92ZUl0ZW0odXBkYXRlLml0ZW0pO1xyXG4gICAgICAgIH0pLnVudGlsKF9wYXJlbnQuaXNEaXNwb3NpbmcpO1xyXG4gICAgfVxyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEltbXV0YWJsZVJlY29yZC5wcm90b3R5cGUsIFwiaXNJbW11dGFibGVcIiwge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXHJcbiAgICB9KTtcclxuXHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoSW1tdXRhYmxlUmVjb3JkLnByb3RvdHlwZSwgXCJpbW11dGFibGVcIiwge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXHJcbiAgICB9KTtcclxuXHJcbiAgICBJbW11dGFibGVSZWNvcmQucHJvdG90eXBlLmFkZEl0ZW0gPSBmdW5jdGlvbiAobmFtZSkge1xyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgbmFtZSwge1xyXG4gICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXHJcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGV4cG9ydHMuaXNTdG9yZSh0aGF0Ll9wYXJlbnRbbmFtZV0pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoYXQuX3BhcmVudFtuYW1lXS5pbW11dGFibGU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhhdC5fcGFyZW50W25hbWVdO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEltbXV0YWJsZVJlY29yZC5wcm90b3R5cGUucmVtb3ZlSXRlbSA9IGZ1bmN0aW9uIChuYW1lKSB7XHJcbiAgICAgICAgZGVsZXRlIHRoaXNbbmFtZV07XHJcbiAgICB9O1xyXG5cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShJbW11dGFibGVSZWNvcmQucHJvdG90eXBlLCBcImtleXNcIiwge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcGFyZW50LmtleXM7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgSW1tdXRhYmxlUmVjb3JkLnByb3RvdHlwZS5zdWJzY3JpYmVQYXJlbnRTdHJlYW0gPSBmdW5jdGlvbiAocGFyZW50U3RyZWFtKSB7XHJcbiAgICAgICAgdmFyIHN0cmVhbSA9IFN0cmVhbS5jcmVhdGVTdHJlYW0oKTtcclxuXHJcbiAgICAgICAgcGFyZW50U3RyZWFtLmZvckVhY2goZnVuY3Rpb24gKHVwZGF0ZSkge1xyXG4gICAgICAgICAgICBzdHJlYW0ucHVzaCh1cGRhdGUpO1xyXG4gICAgICAgIH0pLnVudGlsKHRoaXMuX3BhcmVudC5pc0Rpc3Bvc2luZyk7XHJcblxyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgICAgICB0aGlzLl91cGRhdGVTdHJlYW1zLnB1c2goc3RyZWFtKTtcclxuICAgICAgICBzdHJlYW0ub25DbG9zZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHRoYXQucmVtb3ZlU3RyZWFtKHRoYXQuX3VwZGF0ZVN0cmVhbXMsIHN0cmVhbSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBzdHJlYW07XHJcbiAgICB9O1xyXG5cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShJbW11dGFibGVSZWNvcmQucHJvdG90eXBlLCBcInVwZGF0ZXNcIiwge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zdWJzY3JpYmVQYXJlbnRTdHJlYW0odGhpcy5fcGFyZW50LnVwZGF0ZXMpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcclxuICAgIH0pO1xyXG5cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShJbW11dGFibGVSZWNvcmQucHJvdG90eXBlLCBcIm5ld0l0ZW1zXCIsIHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3Vic2NyaWJlUGFyZW50U3RyZWFtKHRoaXMuX3BhcmVudC5uZXdJdGVtcyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEltbXV0YWJsZVJlY29yZC5wcm90b3R5cGUsIFwicmVtb3ZlZEl0ZW1zXCIsIHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3Vic2NyaWJlUGFyZW50U3RyZWFtKHRoaXMuX3BhcmVudC5yZW1vdmVkSXRlbXMpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcclxuICAgIH0pO1xyXG5cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShJbW11dGFibGVSZWNvcmQucHJvdG90eXBlLCBcImlzRGlzcG9zaW5nXCIsIHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3Vic2NyaWJlUGFyZW50U3RyZWFtKHRoaXMuX3BhcmVudC5pc0Rpc3Bvc2luZyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gSW1tdXRhYmxlUmVjb3JkO1xyXG59KShJbW11dGFibGVTdG9yZSk7XHJcblxyXG4vKipcclxuKiBSZWN1cnNpdmVseSBidWlsZCBhIG5lc3RlZCBzdG9yZS5cclxuKiBAcGFyYW0gdmFsdWVcclxuKiBAcmV0dXJucyB7Kn1cclxuKi9cclxuZnVuY3Rpb24gYnVpbGREZWVwKHZhbHVlKSB7XHJcbiAgICBmdW5jdGlvbiBnZXRJdGVtKHZhbHVlKSB7XHJcbiAgICAgICAgdmFyIHY7XHJcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIikge1xyXG4gICAgICAgICAgICBpZiAoVG9vbHMuaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHYgPSBidWlsZEFycmF5KHZhbHVlKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHYgPSBidWlsZFJlY29yZCh2YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB2ID0gdmFsdWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdjtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBidWlsZEFycmF5KHZhbHVlKSB7XHJcbiAgICAgICAgdmFyIHN0b3JlID0gbmV3IEFycmF5U3RvcmUoKTtcclxuXHJcbiAgICAgICAgdmFsdWUuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xyXG4gICAgICAgICAgICBzdG9yZS5wdXNoKGdldEl0ZW0oaXRlbSkpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gc3RvcmU7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gYnVpbGRSZWNvcmQodmFsdWVzKSB7XHJcbiAgICAgICAgdmFyIHN0b3JlID0gbmV3IFJlY29yZFN0b3JlKCk7XHJcbiAgICAgICAgZm9yICh2YXIga2V5IGluIHZhbHVlcykge1xyXG4gICAgICAgICAgICBpZiAodmFsdWVzLmhhc093blByb3BlcnR5KGtleSkpIHtcclxuICAgICAgICAgICAgICAgIHN0b3JlLmFkZEl0ZW0oa2V5LCBnZXRJdGVtKHZhbHVlc1trZXldKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBzdG9yZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiKSB7XHJcbiAgICAgICAgaWYgKFRvb2xzLmlzQXJyYXkodmFsdWUpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBidWlsZEFycmF5KHZhbHVlKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gYnVpbGRSZWNvcmQodmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4qIENyZWF0ZSBhIG5ldyByZWNvcmQuIElmIGFuIGluaXRpYWwgdmFsdWUgaXMgZ2l2ZW4gaXQgd2lsbCBoYXZlIHRoZSBlbnVtZXJhYmxlIHByb3BlcnRpZXMgb2YgdGhhdCB2YWx1ZS4gWW91IGNhblxyXG4qIGNyZWF0ZSBuZXN0ZWQgc3RvcmVzIGJ5IHByb3ZpZGluZyBhIGNvbXBsZXggb2JqZWN0IGFzIGFuIGluaXRpYWwgdmFsdWUuXHJcbiogQHBhcmFtIGluaXRpYWxcclxuKiBAcmV0dXJucyB7Kn1cclxuKi9cclxuZnVuY3Rpb24gcmVjb3JkKGluaXRpYWwpIHtcclxuICAgIGlmIChpbml0aWFsKSB7XHJcbiAgICAgICAgcmV0dXJuIGJ1aWxkRGVlcChpbml0aWFsKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBSZWNvcmRTdG9yZSgpO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMucmVjb3JkID0gcmVjb3JkO1xyXG5cclxuXHJcblxyXG52YXIgQXJyYXlTdG9yZSA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XHJcbiAgICBfX2V4dGVuZHMoQXJyYXlTdG9yZSwgX3N1cGVyKTtcclxuICAgIGZ1bmN0aW9uIEFycmF5U3RvcmUoaW5pdGlhbCwgYWRkZXIsIHJlbW92ZXIsIHVwZGF0ZXIpIHtcclxuICAgICAgICBfc3VwZXIuY2FsbCh0aGlzKTtcclxuICAgICAgICB0aGlzLl9zdWJzdHJlYW1zID0ge307XHJcbiAgICAgICAgdGhpcy5fZGF0YSA9IGluaXRpYWwgfHwgW107XHJcbiAgICAgICAgdGhpcy5fbWF4UHJvcHMgPSAwO1xyXG4gICAgICAgIHRoaXMudXBkYXRlUHJvcGVydGllcygpO1xyXG4gICAgICAgIHRoaXMuX3N5bmNlZCA9IHRydWU7XHJcblxyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKGFkZGVyKSB7XHJcbiAgICAgICAgICAgIGFkZGVyLmZvckVhY2goZnVuY3Rpb24gKHVwZGF0ZSkge1xyXG4gICAgICAgICAgICAgICAgdGhhdC5zcGxpY2UodXBkYXRlLml0ZW0sIDAsIHVwZGF0ZS52YWx1ZSk7XHJcbiAgICAgICAgICAgIH0pLnVudGlsKHRoaXMuaXNEaXNwb3NpbmcpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHJlbW92ZXIpIHtcclxuICAgICAgICAgICAgcmVtb3Zlci5mb3JFYWNoKGZ1bmN0aW9uICh1cGRhdGUpIHtcclxuICAgICAgICAgICAgICAgIHRoYXQuc3BsaWNlKHVwZGF0ZS5pdGVtLCAxKTtcclxuICAgICAgICAgICAgfSkudW50aWwodGhpcy5pc0Rpc3Bvc2luZyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodXBkYXRlcikge1xyXG4gICAgICAgICAgICB1cGRhdGVyLmZvckVhY2goZnVuY3Rpb24gKHVwZGF0ZSkge1xyXG4gICAgICAgICAgICAgICAgdGhhdFt1cGRhdGUuaXRlbV0gPSB1cGRhdGUudmFsdWU7XHJcbiAgICAgICAgICAgIH0pLnVudGlsKHRoaXMuaXNEaXNwb3NpbmcpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIEFycmF5U3RvcmUucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhLnRvU3RyaW5nKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIEFycmF5U3RvcmUucHJvdG90eXBlLnRvTG9jYWxlU3RyaW5nID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhLnRvTG9jYWxlU3RyaW5nKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIEFycmF5U3RvcmUucHJvdG90eXBlLmZvckVhY2ggPSBmdW5jdGlvbiAoY2FsbGJhY2tmbiwgdGhpc0FyZykge1xyXG4gICAgICAgIHRoaXMuX2RhdGEuZm9yRWFjaChjYWxsYmFja2ZuLCB0aGlzQXJnKTtcclxuICAgIH07XHJcblxyXG4gICAgQXJyYXlTdG9yZS5wcm90b3R5cGUuZXZlcnkgPSBmdW5jdGlvbiAoY2FsbGJhY2tmbiwgdGhpc0FyZykge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhLmV2ZXJ5KGNhbGxiYWNrZm4sIHRoaXNBcmcpO1xyXG4gICAgfTtcclxuXHJcbiAgICBBcnJheVN0b3JlLnByb3RvdHlwZS5zb21lID0gZnVuY3Rpb24gKGNhbGxiYWNrZm4sIHRoaXNBcmcpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YS5zb21lKGNhbGxiYWNrZm4sIHRoaXNBcmcpO1xyXG4gICAgfTtcclxuXHJcbiAgICBBcnJheVN0b3JlLnByb3RvdHlwZS5pbmRleE9mID0gZnVuY3Rpb24gKHZhbHVlLCBmcm9tSW5kZXgpIHtcclxuICAgICAgICBpZiAoZXhwb3J0cy5pc1N0b3JlKHZhbHVlKSAmJiB2YWx1ZS5pc0ltbXV0YWJsZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZGF0YS5pbmRleE9mKHZhbHVlW1wiX3BhcmVudFwiXSwgZnJvbUluZGV4KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZGF0YS5pbmRleE9mKHZhbHVlLCBmcm9tSW5kZXgpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgQXJyYXlTdG9yZS5wcm90b3R5cGUubGFzdEluZGV4T2YgPSBmdW5jdGlvbiAoc2VhcmNoRWxlbWVudCwgZnJvbUluZGV4KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGEubGFzdEluZGV4T2Yoc2VhcmNoRWxlbWVudCwgZnJvbUluZGV4KTtcclxuICAgIH07XHJcblxyXG4gICAgQXJyYXlTdG9yZS5wcm90b3R5cGUuam9pbiA9IGZ1bmN0aW9uIChzZXBhcmF0b3IpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YS5qb2luKHNlcGFyYXRvcik7XHJcbiAgICB9O1xyXG5cclxuICAgIEFycmF5U3RvcmUucHJvdG90eXBlLm1hcCA9IGZ1bmN0aW9uIChjYWxsYmFja2ZuLCB0aGlzQXJnKSB7XHJcbiAgICAgICAgdmFyIG1hcHBlZCA9IHRoaXMuX2RhdGEubWFwKGNhbGxiYWNrZm4sIHRoaXNBcmcpO1xyXG5cclxuICAgICAgICB2YXIgYWRkZXIgPSBTdHJlYW0uY3JlYXRlU3RyZWFtKCk7XHJcbiAgICAgICAgdmFyIHJlbW92ZXIgPSBTdHJlYW0uY3JlYXRlU3RyZWFtKCk7XHJcbiAgICAgICAgdmFyIHVwZGF0ZXIgPSBTdHJlYW0uY3JlYXRlU3RyZWFtKCk7XHJcbiAgICAgICAgdmFyIG1hcHBlZFN0b3JlID0gbmV3IEFycmF5U3RvcmUobWFwcGVkLCBhZGRlciwgcmVtb3ZlciwgdXBkYXRlcik7XHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICB0aGlzLnVwZGF0ZXMuZm9yRWFjaChmdW5jdGlvbiAodXBkYXRlKSB7XHJcbiAgICAgICAgICAgIHVwZGF0ZXIucHVzaChjcmVhdGVVcGRhdGVJbmZvKHVwZGF0ZS5yb290SXRlbSwgY2FsbGJhY2tmbih0aGF0Ll9kYXRhW3VwZGF0ZS5yb290SXRlbV0sIHVwZGF0ZS5yb290SXRlbSwgdGhhdC5fZGF0YSksIHVwZGF0ZS5zdG9yZSkpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLm5ld0l0ZW1zLmZvckVhY2goZnVuY3Rpb24gKHVwZGF0ZSkge1xyXG4gICAgICAgICAgICBhZGRlci5wdXNoKGNyZWF0ZVVwZGF0ZUluZm8odXBkYXRlLnJvb3RJdGVtLCBjYWxsYmFja2ZuKHRoYXQuX2RhdGFbdXBkYXRlLnJvb3RJdGVtXSwgdXBkYXRlLnJvb3RJdGVtLCB0aGF0Ll9kYXRhKSwgdXBkYXRlLnN0b3JlKSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMucmVtb3ZlZEl0ZW1zLmZvckVhY2goZnVuY3Rpb24gKHVwZGF0ZSkge1xyXG4gICAgICAgICAgICByZW1vdmVyLnB1c2goY3JlYXRlVXBkYXRlSW5mbyh1cGRhdGUucm9vdEl0ZW0sIHVwZGF0ZS52YWx1ZSwgdXBkYXRlLnN0b3JlKSk7IC8vIFRoZSB2YWx1ZSBkb2VzIG5vdCBtYXR0ZXIgaGVyZSwgc2F2ZSB0aGUgY2FsbCB0byB0aGUgY2FsbGJhY2tcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG1hcHBlZFN0b3JlO1xyXG4gICAgfTtcclxuXHJcbiAgICBBcnJheVN0b3JlLnByb3RvdHlwZS5maWx0ZXIgPSBmdW5jdGlvbiAoY2FsbGJhY2tmbiwgbm9VcGRhdGVzLCB0aGlzQXJnKSB7XHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICAgIHZhciBhZGRlcjtcclxuICAgICAgICB2YXIgcmVtb3ZlcjtcclxuICAgICAgICB2YXIgdXBkYXRlcjtcclxuICAgICAgICB2YXIgZmlsdGVyZWRTdG9yZTtcclxuXHJcbiAgICAgICAgdmFyIGluZGV4TWFwID0gW107XHJcbiAgICAgICAgdmFyIGZpbHRlcmVkID0gW107XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIG1hcChmb3JJbmRleCwgdG9JbmRleCkge1xyXG4gICAgICAgICAgICBpbmRleE1hcFtmb3JJbmRleF0gPSB0b0luZGV4O1xyXG5cclxuICAgICAgICAgICAgaWYgKHRvSW5kZXggIT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gZm9ySW5kZXggKyAxOyBpIDwgaW5kZXhNYXAubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXhNYXBbaV0gIT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4TWFwW2ldICs9IDE7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBhZGRNYXAoZnJvbUluZGV4LCB0b0luZGV4KSB7XHJcbiAgICAgICAgICAgIGluZGV4TWFwLnNwbGljZShmcm9tSW5kZXgsIDAsIHRvSW5kZXgpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRvSW5kZXggIT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gZnJvbUluZGV4ICsgMTsgaSA8IGluZGV4TWFwLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4TWFwW2ldICE9PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleE1hcFtpXSArPSAxO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gdW5tYXAoZm9ySW5kZXgpIHtcclxuICAgICAgICAgICAgdmFyIGRvd25zaGlmdCA9IGlzTWFwcGVkKGZvckluZGV4KTtcclxuICAgICAgICAgICAgaW5kZXhNYXBbZm9ySW5kZXhdID0gLTE7XHJcbiAgICAgICAgICAgIGlmIChkb3duc2hpZnQpIHtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSBmb3JJbmRleCArIDE7IGkgPCBpbmRleE1hcC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmRleE1hcFtpXSAhPT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhNYXBbaV0gLT0gMTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHJlbW92ZU1hcChmb3JJbmRleCkge1xyXG4gICAgICAgICAgICB2YXIgZG93bnNoaWZ0ID0gaXNNYXBwZWQoZm9ySW5kZXgpO1xyXG4gICAgICAgICAgICBpbmRleE1hcC5zcGxpY2UoZm9ySW5kZXgsIDEpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGRvd25zaGlmdCkge1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IGZvckluZGV4OyBpIDwgaW5kZXhNYXAubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXhNYXBbaV0gIT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4TWFwW2ldIC09IDE7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBtYXBJbmRleChmcm9tSW5kZXgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGluZGV4TWFwW2Zyb21JbmRleF07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBpc01hcHBlZChpbmRleCkge1xyXG4gICAgICAgICAgICByZXR1cm4gaW5kZXggPCBpbmRleE1hcC5sZW5ndGggJiYgaW5kZXhNYXBbaW5kZXhdICE9PSAtMTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdldENsb3Nlc3RMZWZ0TWFwKGZvckluZGV4KSB7XHJcbiAgICAgICAgICAgIHZhciBpID0gZm9ySW5kZXg7XHJcblxyXG4gICAgICAgICAgICB3aGlsZSAoKGkgPj0gaW5kZXhNYXAubGVuZ3RoIHx8IGluZGV4TWFwW2ldID09PSAtMSkgJiYgaSA+IC0yKSB7XHJcbiAgICAgICAgICAgICAgICBpLS07XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpIDwgMClcclxuICAgICAgICAgICAgICAgIHJldHVybiAtMTtcclxuICAgICAgICAgICAgcmV0dXJuIG1hcEluZGV4KGkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fZGF0YS5mb3JFYWNoKGZ1bmN0aW9uICh2YWx1ZSwgaW5kZXgpIHtcclxuICAgICAgICAgICAgaWYgKGNhbGxiYWNrZm4odmFsdWUsIGluZGV4LCB0aGF0Ll9kYXRhKSkge1xyXG4gICAgICAgICAgICAgICAgYWRkTWFwKGluZGV4LCBmaWx0ZXJlZC5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgZmlsdGVyZWQucHVzaCh2YWx1ZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBhZGRNYXAoaW5kZXgsIC0xKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAoIW5vVXBkYXRlcykge1xyXG4gICAgICAgICAgICBhZGRlciA9IFN0cmVhbS5jcmVhdGVTdHJlYW0oKTtcclxuICAgICAgICAgICAgcmVtb3ZlciA9IFN0cmVhbS5jcmVhdGVTdHJlYW0oKTtcclxuICAgICAgICAgICAgdXBkYXRlciA9IFN0cmVhbS5jcmVhdGVTdHJlYW0oKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubmV3SXRlbXMuZm9yRWFjaChmdW5jdGlvbiAodXBkYXRlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2tmbih0aGF0Ll9kYXRhW3VwZGF0ZS5yb290SXRlbV0sIHVwZGF0ZS5yb290SXRlbSwgdGhhdC5fZGF0YSkpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaXNNYXBwZWQodXBkYXRlLnJvb3RJdGVtKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRlci5wdXNoKGNyZWF0ZVVwZGF0ZUluZm8obWFwSW5kZXgodXBkYXRlLnJvb3RJdGVtKSwgdGhhdC5fZGF0YVt1cGRhdGUucm9vdEl0ZW1dLCB1cGRhdGUuc3RvcmUpKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRlci5wdXNoKGNyZWF0ZVVwZGF0ZUluZm8oZ2V0Q2xvc2VzdExlZnRNYXAodXBkYXRlLnJvb3RJdGVtKSArIDEsIHRoYXQuX2RhdGFbdXBkYXRlLnJvb3RJdGVtXSwgdXBkYXRlLnN0b3JlKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGFkZE1hcCh1cGRhdGUucm9vdEl0ZW0sIGZpbHRlcmVkU3RvcmUuaW5kZXhPZih0aGF0Ll9kYXRhW3VwZGF0ZS5yb290SXRlbV0pKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWRkTWFwKHVwZGF0ZS5yb290SXRlbSwgLTEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlZEl0ZW1zLmZvckVhY2goZnVuY3Rpb24gKHVwZGF0ZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGlzTWFwcGVkKHVwZGF0ZS5yb290SXRlbSkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZW1vdmVyLnB1c2goY3JlYXRlVXBkYXRlSW5mbyhtYXBJbmRleCh1cGRhdGUucm9vdEl0ZW0pLCB0aGF0Ll9kYXRhW3VwZGF0ZS5yb290SXRlbV0sIHVwZGF0ZS5zdG9yZSkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmVtb3ZlTWFwKHVwZGF0ZS5yb290SXRlbSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgdGhpcy51cGRhdGVzLmZvckVhY2goZnVuY3Rpb24gKHVwZGF0ZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrZm4odGhhdC5fZGF0YVt1cGRhdGUucm9vdEl0ZW1dLCB1cGRhdGUucm9vdEl0ZW0sIHRoYXQuX2RhdGEpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzTWFwcGVkKHVwZGF0ZS5yb290SXRlbSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlci5wdXNoKGNyZWF0ZVVwZGF0ZUluZm8obWFwSW5kZXgodXBkYXRlLnJvb3RJdGVtKSwgdGhhdC5fZGF0YVt1cGRhdGUucm9vdEl0ZW1dLCB1cGRhdGUuc3RvcmUpKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRlci5wdXNoKGNyZWF0ZVVwZGF0ZUluZm8oZ2V0Q2xvc2VzdExlZnRNYXAodXBkYXRlLnJvb3RJdGVtKSArIDEsIHRoYXQuX2RhdGFbdXBkYXRlLnJvb3RJdGVtXSwgdXBkYXRlLnN0b3JlKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcCh1cGRhdGUucm9vdEl0ZW0sIGZpbHRlcmVkU3RvcmUuaW5kZXhPZih0aGF0Ll9kYXRhW3VwZGF0ZS5yb290SXRlbV0pKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpc01hcHBlZCh1cGRhdGUucm9vdEl0ZW0pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZXIucHVzaChjcmVhdGVVcGRhdGVJbmZvKG1hcEluZGV4KHVwZGF0ZS5yb290SXRlbSksIHRoYXQuX2RhdGFbdXBkYXRlLnJvb3RJdGVtXSwgdXBkYXRlLnN0b3JlKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHVubWFwKHVwZGF0ZS5yb290SXRlbSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWFwKHVwZGF0ZS5yb290SXRlbSwgLTEpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmaWx0ZXJlZFN0b3JlID0gbmV3IEFycmF5U3RvcmUoZmlsdGVyZWQsIGFkZGVyLCByZW1vdmVyLCB1cGRhdGVyKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGZpbHRlcmVkU3RvcmU7XHJcbiAgICB9O1xyXG5cclxuICAgIEFycmF5U3RvcmUucHJvdG90eXBlLnJlZHVjZSA9IGZ1bmN0aW9uIChjYWxsYmFja2ZuLCBpbml0aWFsVmFsdWUpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YS5yZWR1Y2UoY2FsbGJhY2tmbiwgaW5pdGlhbFZhbHVlKTtcclxuICAgIH07XHJcblxyXG4gICAgQXJyYXlTdG9yZS5wcm90b3R5cGUuc29ydCA9IGZ1bmN0aW9uIChjb21wYXJlRm4pIHtcclxuICAgICAgICB2YXIgY29weSA9IHRoaXMuX2RhdGEubWFwKGZ1bmN0aW9uIChpdGVtKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBpdGVtO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGNvcHkuc29ydChjb21wYXJlRm4pO1xyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgICAgICBjb3B5LmZvckVhY2goZnVuY3Rpb24gKHZhbHVlLCBpbmRleCkge1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgIT09IHRoYXQuX2RhdGFbaW5kZXhdKSB7XHJcbiAgICAgICAgICAgICAgICB0aGF0W2luZGV4XSA9IHZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEFycmF5U3RvcmUucHJvdG90eXBlLnJldmVyc2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGNvcHkgPSB0aGlzLl9kYXRhLm1hcChmdW5jdGlvbiAoaXRlbSkge1xyXG4gICAgICAgICAgICByZXR1cm4gaXRlbTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBjb3B5LnJldmVyc2UoKTtcclxuXHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICAgIGNvcHkuZm9yRWFjaChmdW5jdGlvbiAodmFsdWUsIGluZGV4KSB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gdGhhdC5fZGF0YVtpbmRleF0pIHtcclxuICAgICAgICAgICAgICAgIHRoYXRbaW5kZXhdID0gdmFsdWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgQXJyYXlTdG9yZS5wcm90b3R5cGUuY29uY2F0ID0gZnVuY3Rpb24gKGFycmF5KSB7XHJcbiAgICAgICAgdmFyIG5ld0FycmF5O1xyXG4gICAgICAgIGlmIChhcnJheSBpbnN0YW5jZW9mIEFycmF5U3RvcmUpIHtcclxuICAgICAgICAgICAgbmV3QXJyYXkgPSB0aGlzLl9kYXRhLmNvbmNhdChhcnJheVtcIl9kYXRhXCJdKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBuZXdBcnJheSA9IHRoaXMuX2RhdGEuY29uY2F0KGFycmF5KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG5ldyBBcnJheVN0b3JlKG5ld0FycmF5KTtcclxuICAgIH07XHJcblxyXG4gICAgQXJyYXlTdG9yZS5wcm90b3R5cGUuY29uY2F0SW5wbGFjZSA9IGZ1bmN0aW9uIChhcnJheSkge1xyXG4gICAgICAgIGlmIChhcnJheSBpbnN0YW5jZW9mIEFycmF5U3RvcmUpIHtcclxuICAgICAgICAgICAgdGhpcy5zcGxpY2UuYXBwbHkodGhpcywgW3RoaXMubGVuZ3RoLCAwXS5jb25jYXQoYXJyYXlbXCJfZGF0YVwiXSkpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuc3BsaWNlLmFwcGx5KHRoaXMsIFt0aGlzLmxlbmd0aCwgMF0uY29uY2F0KGFycmF5KSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQXJyYXlTdG9yZS5wcm90b3R5cGUsIFwibGVuZ3RoXCIsIHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGEubGVuZ3RoO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcclxuICAgIH0pO1xyXG5cclxuICAgIEFycmF5U3RvcmUucHJvdG90eXBlLnNldHVwU3ViU3RyZWFtcyA9IGZ1bmN0aW9uIChpdGVtLCB2YWx1ZSkge1xyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgICAgICBpZiAoZXhwb3J0cy5pc1N0b3JlKHZhbHVlKSkge1xyXG4gICAgICAgICAgICB2YXIgc3Vic3RyZWFtID0gdGhpcy5fc3Vic3RyZWFtc1tUb29scy5vaWQodmFsdWUpXTtcclxuICAgICAgICAgICAgaWYgKHN1YnN0cmVhbSkge1xyXG4gICAgICAgICAgICAgICAgc3Vic3RyZWFtLnVwZGF0ZXMuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBzdWJzdHJlYW0gPSB7XHJcbiAgICAgICAgICAgICAgICB1cGRhdGVzOiB2YWx1ZS51cGRhdGVzXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHN1YnN0cmVhbS51cGRhdGVzLmZvckVhY2goZnVuY3Rpb24gKHVwZGF0ZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHVwZGF0ZUluZm8gPSBjcmVhdGVVcGRhdGVJbmZvKHVwZGF0ZS5pdGVtLCB1cGRhdGUudmFsdWUsIHRoYXQsIHVwZGF0ZS5wYXRoID8gaXRlbSArIFwiLlwiICsgdXBkYXRlLnBhdGggOiBpdGVtICsgXCIuXCIgKyB1cGRhdGUuaXRlbSwgaXRlbSk7XHJcbiAgICAgICAgICAgICAgICB0aGF0Ll91cGRhdGVTdHJlYW1zLmZvckVhY2goZnVuY3Rpb24gKHN0cmVhbSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbS5wdXNoKHVwZGF0ZUluZm8pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLl9zdWJzdHJlYW1zW1Rvb2xzLm9pZCh2YWx1ZSldID0gc3Vic3RyZWFtO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAqIENhbGwgYWZ0ZXIgcmVtb3ZhbCFcclxuICAgICogQHBhcmFtIHZhbHVlXHJcbiAgICAqL1xyXG4gICAgQXJyYXlTdG9yZS5wcm90b3R5cGUuZGlzcG9zZVN1YnN0cmVhbSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xyXG4gICAgICAgIGlmIChleHBvcnRzLmlzU3RvcmUodmFsdWUpICYmIHRoaXMuX2RhdGEuaW5kZXhPZih2YWx1ZSkgPT09IC0xKSB7XHJcbiAgICAgICAgICAgIHZhciBzdWJTdHJlYW0gPSB0aGlzLl9zdWJzdHJlYW1zW1Rvb2xzLm9pZCh2YWx1ZSldO1xyXG4gICAgICAgICAgICBpZiAoc3ViU3RyZWFtKSB7XHJcbiAgICAgICAgICAgICAgICBzdWJTdHJlYW0udXBkYXRlcy5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5fc3Vic3RyZWFtc1tUb29scy5vaWQodmFsdWUpXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgQXJyYXlTdG9yZS5wcm90b3R5cGUudXBkYXRlUHJvcGVydGllcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgdmFyIGk7XHJcblxyXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLl9kYXRhLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHRoYXQuc2V0dXBTdWJTdHJlYW1zKGksIHRoaXMuX2RhdGFbaV0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChpID0gdGhpcy5fbWF4UHJvcHM7IGkgPCB0aGlzLl9kYXRhLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIChmdW5jdGlvbiAoaW5kZXgpIHtcclxuICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGF0LCBcIlwiICsgaW5kZXgsIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGF0Ll9kYXRhW2luZGV4XTtcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBvbGQgPSB0aGF0Ll9kYXRhW2luZGV4XTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlICE9PSBvbGQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuX2RhdGFbaW5kZXhdID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LmRpc3Bvc2VTdWJzdHJlYW0ob2xkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuc2V0dXBTdWJTdHJlYW1zKGluZGV4LCB2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0Ll91cGRhdGVTdHJlYW1zLmZvckVhY2goZnVuY3Rpb24gKHN0cmVhbSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cmVhbS5wdXNoKGNyZWF0ZVVwZGF0ZUluZm8oaW5kZXgsIHRoYXQuX2RhdGFbaW5kZXhdLCB0aGF0LCBudWxsKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KShpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuX21heFByb3BzID0gdGhpcy5fZGF0YS5sZW5ndGg7XHJcbiAgICB9O1xyXG5cclxuICAgIEFycmF5U3RvcmUucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHZhbHVlcyA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCAoYXJndW1lbnRzLmxlbmd0aCAtIDApOyBfaSsrKSB7XHJcbiAgICAgICAgICAgIHZhbHVlc1tfaV0gPSBhcmd1bWVudHNbX2kgKyAwXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5fZGF0YS5sZW5ndGg7XHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICB2YWx1ZXMuZm9yRWFjaChmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICAgICAgdGhhdC5fZGF0YS5wdXNoKHZhbHVlKTtcclxuICAgICAgICAgICAgdGhhdC5fYWRkSXRlbXNTdHJlYW1zLmZvckVhY2goZnVuY3Rpb24gKHN0cmVhbSkge1xyXG4gICAgICAgICAgICAgICAgc3RyZWFtLnB1c2goY3JlYXRlVXBkYXRlSW5mbyhpbmRleCwgdGhhdC5fZGF0YVtpbmRleF0sIHRoYXQpKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGluZGV4Kys7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMudXBkYXRlUHJvcGVydGllcygpO1xyXG4gICAgfTtcclxuXHJcbiAgICBBcnJheVN0b3JlLnByb3RvdHlwZS51bnNoaWZ0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB2YWx1ZXMgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgKGFyZ3VtZW50cy5sZW5ndGggLSAwKTsgX2krKykge1xyXG4gICAgICAgICAgICB2YWx1ZXNbX2ldID0gYXJndW1lbnRzW19pICsgMF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgdmFyIGwgPSB2YWx1ZXMubGVuZ3RoO1xyXG5cclxuICAgICAgICB3aGlsZSAobC0tKSB7XHJcbiAgICAgICAgICAgIChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9kYXRhLnVuc2hpZnQodmFsdWVzWzBdKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX25ld0l0ZW1TdHJlYW1zLmZvckVhY2goZnVuY3Rpb24gKHN0cmVhbSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbS5wdXNoKGNyZWF0ZVVwZGF0ZUluZm8oMCwgdGhhdC5fZGF0YVswXSwgdGhhdCkpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMudXBkYXRlUHJvcGVydGllcygpO1xyXG4gICAgfTtcclxuXHJcbiAgICBBcnJheVN0b3JlLnByb3RvdHlwZS5wb3AgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHIgPSB0aGlzLl9kYXRhLnBvcCgpO1xyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NlU3Vic3RyZWFtKHIpO1xyXG5cclxuICAgICAgICB0aGlzLl9yZW1vdmVJdGVtc1N0cmVhbXMuZm9yRWFjaChmdW5jdGlvbiAoc3RyZWFtKSB7XHJcbiAgICAgICAgICAgIHN0cmVhbS5wdXNoKGNyZWF0ZVVwZGF0ZUluZm8odGhhdC5fZGF0YS5sZW5ndGgsIG51bGwsIHRoYXQpKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHI7XHJcbiAgICB9O1xyXG5cclxuICAgIEFycmF5U3RvcmUucHJvdG90eXBlLnNoaWZ0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciByID0gdGhpcy5fZGF0YS5zaGlmdCgpO1xyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NlU3Vic3RyZWFtKHIpO1xyXG5cclxuICAgICAgICB0aGlzLl9yZW1vdmVJdGVtc1N0cmVhbXMuZm9yRWFjaChmdW5jdGlvbiAoc3RyZWFtKSB7XHJcbiAgICAgICAgICAgIHN0cmVhbS5wdXNoKGNyZWF0ZVVwZGF0ZUluZm8oMCwgbnVsbCwgdGhhdCkpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gcjtcclxuICAgIH07XHJcblxyXG4gICAgQXJyYXlTdG9yZS5wcm90b3R5cGUuc3BsaWNlID0gZnVuY3Rpb24gKHN0YXJ0LCBkZWxldGVDb3VudCkge1xyXG4gICAgICAgIHZhciB2YWx1ZXMgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgKGFyZ3VtZW50cy5sZW5ndGggLSAyKTsgX2krKykge1xyXG4gICAgICAgICAgICB2YWx1ZXNbX2ldID0gYXJndW1lbnRzW19pICsgMl07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciByZW1vdmVkID0gdGhpcy5fZGF0YS5zcGxpY2UuYXBwbHkodGhpcy5fZGF0YSwgW3N0YXJ0LCBkZWxldGVDb3VudF0uY29uY2F0KHZhbHVlcykpO1xyXG5cclxuICAgICAgICB2YXIgaW5kZXggPSBzdGFydDtcclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmICh0aGF0Ll9yZW1vdmVJdGVtc1N0cmVhbXMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJlbW92ZWQuZm9yRWFjaChmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIHRoYXQuZGlzcG9zZVN1YnN0cmVhbSh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB0aGF0Ll9yZW1vdmVJdGVtc1N0cmVhbXMuZm9yRWFjaChmdW5jdGlvbiAoc3RyZWFtKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RyZWFtLnB1c2goY3JlYXRlVXBkYXRlSW5mbyhpbmRleCwgdmFsdWUsIHRoYXQpKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgaW5kZXgrKztcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpbmRleCA9IHN0YXJ0O1xyXG4gICAgICAgIHZhbHVlcy5mb3JFYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdGhhdC5fYWRkSXRlbXNTdHJlYW1zLmZvckVhY2goZnVuY3Rpb24gKHN0cmVhbSkge1xyXG4gICAgICAgICAgICAgICAgc3RyZWFtLnB1c2goY3JlYXRlVXBkYXRlSW5mbyhpbmRleCwgdGhhdC5fZGF0YVtpbmRleF0sIHRoYXQpKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGluZGV4Kys7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8qIFJlbW92ZWQuIFRoaXMgc2hvdWxkIG5vdCBiZSBuZWNlc3NhcnkgYW5kIGl0IHNpbXBsaWZpZXMgdGhlIHJlYWN0aXZlIGFycmF5XHJcbiAgICAgICAgLy8gSW5kZXggaXMgbm93IGF0IHRoZSBmaXJzdCBpdGVtIGFmdGVyIHRoZSBsYXN0IGluc2VydGVkIHZhbHVlLiBTbyBpZiBkZWxldGVDb3VudCAhPSB2YWx1ZXMubGVuZ3RoXHJcbiAgICAgICAgLy8gdGhlIGl0ZW1zIGFmdGVyIHRoZSBpbnNlcnQvcmVtb3ZlIG1vdmVkIGFyb3VuZFxyXG4gICAgICAgIGlmIChkZWxldGVDb3VudCAhPT0gdmFsdWVzLmxlbmd0aCkge1xyXG4gICAgICAgIC8vdmFyIGRpc3RhbmNlID0gdmFsdWVzLmxlbmd0aCAtIGRlbGV0ZUNvdW50O1xyXG4gICAgICAgIGZvciAoaW5kZXg7IGluZGV4IDwgdGhpcy5fZGF0YS5sZW5ndGg7IGluZGV4KyspIHtcclxuICAgICAgICB0aGF0Ll91cGRhdGVTdHJlYW1zLmZvckVhY2goZnVuY3Rpb24oc3RyZWFtKSB7XHJcbiAgICAgICAgc3RyZWFtLnB1c2goY3JlYXRlVXBkYXRlSW5mbzxudW1iZXI+KGluZGV4LCB0aGF0Ll9kYXRhW2luZGV4XSwgdGhhdCkpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMudXBkYXRlUHJvcGVydGllcygpO1xyXG4gICAgICAgIHJldHVybiByZW1vdmVkO1xyXG4gICAgfTtcclxuXHJcbiAgICBBcnJheVN0b3JlLnByb3RvdHlwZS5pbnNlcnQgPSBmdW5jdGlvbiAoYXRJbmRleCkge1xyXG4gICAgICAgIHZhciB2YWx1ZXMgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgKGFyZ3VtZW50cy5sZW5ndGggLSAxKTsgX2krKykge1xyXG4gICAgICAgICAgICB2YWx1ZXNbX2ldID0gYXJndW1lbnRzW19pICsgMV07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuc3BsaWNlLmFwcGx5KHRoaXMsIFthdEluZGV4LCAwXS5jb25jYXQodmFsdWVzKSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEFycmF5U3RvcmUucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChhdEluZGV4LCBjb3VudCkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgY291bnQgPT09IFwidW5kZWZpbmVkXCIpIHsgY291bnQgPSAxOyB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3BsaWNlKGF0SW5kZXgsIGNvdW50KTtcclxuICAgIH07XHJcblxyXG4gICAgQXJyYXlTdG9yZS5wcm90b3R5cGUuZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKGV4cG9ydHMuaXNTdG9yZSh0aGlzW2ldKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpc1tpXS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzW2ldO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9kYXRhID0gbnVsbDtcclxuXHJcbiAgICAgICAgX3N1cGVyLnByb3RvdHlwZS5kaXNwb3NlLmNhbGwodGhpcyk7XHJcbiAgICB9O1xyXG5cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShBcnJheVN0b3JlLnByb3RvdHlwZSwgXCJpbW11dGFibGVcIiwge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMuX2ltbXV0YWJsZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5faW1tdXRhYmxlID0gbmV3IEltbXV0YWJsZUFycmF5KHRoaXMpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faW1tdXRhYmxlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcclxuICAgIH0pO1xyXG5cclxuICAgIEFycmF5U3RvcmUucHJvdG90eXBlLml0ZW0gPSBmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICB2YXIgaSA9IHRoaXMuaW5kZXhPZih2YWx1ZSk7XHJcbiAgICAgICAgaWYgKGkgIT09IC0xKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzW2ldO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIEFycmF5U3RvcmU7XHJcbn0pKFN0b3JlKTtcclxuXHJcbnZhciBJbW11dGFibGVBcnJheSA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XHJcbiAgICBfX2V4dGVuZHMoSW1tdXRhYmxlQXJyYXksIF9zdXBlcik7XHJcbiAgICBmdW5jdGlvbiBJbW11dGFibGVBcnJheShfcGFyZW50KSB7XHJcbiAgICAgICAgX3N1cGVyLmNhbGwodGhpcyk7XHJcbiAgICAgICAgdGhpcy5fcGFyZW50ID0gX3BhcmVudDtcclxuXHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICAgIF9wYXJlbnQubmV3SXRlbXMuZm9yRWFjaChmdW5jdGlvbiAodXBkYXRlKSB7XHJcbiAgICAgICAgICAgIHRoYXQudXBkYXRlUHJvcGVydGllcygpO1xyXG4gICAgICAgIH0pLnVudGlsKF9wYXJlbnQuaXNEaXNwb3NpbmcpO1xyXG5cclxuICAgICAgICAvLyBXZSBkbyBub3RoaW5nIHdoZW4gcmVtb3ZpbmcgaXRlbXMuIFRoZSBnZXR0ZXIgd2lsbCByZXR1cm4gdW5kZWZpbmVkLlxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgX2FycmF5LnJlbW92ZWRJdGVtcygpLmZvckVhY2goZnVuY3Rpb24odXBkYXRlKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgfSkudW50aWwoX2FycmF5LmRpc3Bvc2luZygpKTtcclxuICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuX21heFByb3BzID0gMDtcclxuICAgICAgICB0aGlzLnVwZGF0ZVByb3BlcnRpZXMoKTtcclxuICAgIH1cclxuICAgIEltbXV0YWJsZUFycmF5LnByb3RvdHlwZS51cGRhdGVQcm9wZXJ0aWVzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgICAgICB2YXIgaTtcclxuXHJcbiAgICAgICAgZm9yIChpID0gdGhpcy5fbWF4UHJvcHM7IGkgPCB0aGlzLl9wYXJlbnQubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgKGZ1bmN0aW9uIChpbmRleCkge1xyXG4gICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoYXQsIFwiXCIgKyBpbmRleCwge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV4cG9ydHMuaXNTdG9yZSh0aGF0Ll9wYXJlbnRbaW5kZXhdKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoYXQuX3BhcmVudFtpbmRleF0uaW1tdXRhYmxlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGF0Ll9wYXJlbnRbaW5kZXhdO1xyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSkoaSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl9tYXhQcm9wcyA9IHRoaXMuX3BhcmVudC5sZW5ndGg7XHJcbiAgICB9O1xyXG5cclxuICAgIEltbXV0YWJsZUFycmF5LnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fcGFyZW50LnRvU3RyaW5nKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIEltbXV0YWJsZUFycmF5LnByb3RvdHlwZS50b0xvY2FsZVN0cmluZyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fcGFyZW50LnRvU3RyaW5nKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIEltbXV0YWJsZUFycmF5LnByb3RvdHlwZS5mb3JFYWNoID0gZnVuY3Rpb24gKGNhbGxiYWNrZm4sIHRoaXNBcmcpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fcGFyZW50LmZvckVhY2goY2FsbGJhY2tmbik7XHJcbiAgICB9O1xyXG5cclxuICAgIEltbXV0YWJsZUFycmF5LnByb3RvdHlwZS5ldmVyeSA9IGZ1bmN0aW9uIChjYWxsYmFja2ZuLCB0aGlzQXJnKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudC5ldmVyeShjYWxsYmFja2ZuKTtcclxuICAgIH07XHJcblxyXG4gICAgSW1tdXRhYmxlQXJyYXkucHJvdG90eXBlLnNvbWUgPSBmdW5jdGlvbiAoY2FsbGJhY2tmbiwgdGhpc0FyZykge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9wYXJlbnQuZm9yRWFjaChjYWxsYmFja2ZuKTtcclxuICAgIH07XHJcblxyXG4gICAgSW1tdXRhYmxlQXJyYXkucHJvdG90eXBlLmluZGV4T2YgPSBmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fcGFyZW50LmluZGV4T2YodmFsdWUpO1xyXG4gICAgfTtcclxuXHJcbiAgICBJbW11dGFibGVBcnJheS5wcm90b3R5cGUubGFzdEluZGV4T2YgPSBmdW5jdGlvbiAoc2VhcmNoRWxlbWVudCwgZnJvbUluZGV4KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudC5sYXN0SW5kZXhPZihzZWFyY2hFbGVtZW50LCBmcm9tSW5kZXgpO1xyXG4gICAgfTtcclxuXHJcbiAgICBJbW11dGFibGVBcnJheS5wcm90b3R5cGUuam9pbiA9IGZ1bmN0aW9uIChzZXBhcmF0b3IpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fcGFyZW50LmpvaW4oc2VwYXJhdG9yKTtcclxuICAgIH07XHJcblxyXG4gICAgSW1tdXRhYmxlQXJyYXkucHJvdG90eXBlLm1hcCA9IGZ1bmN0aW9uIChjYWxsYmFja2ZuLCB0aGlzQXJnKSB7XHJcbiAgICAgICAgLy9UaGlzIGlzIGRpcnR5IGJ1dCBhbnl0aGluZyBlbHNlIHdvdWxkIGJlIGlucGVyZm9ybWFudCBqdXN0IGJlY2F1c2UgdHlwZXNjcmlwdCBkb2VzIG5vdCBoYXZlIHByb3RlY3RlZCBzY29wZVxyXG4gICAgICAgIHJldHVybiB0aGlzLl9wYXJlbnRbXCJfZGF0YVwiXS5tYXAoY2FsbGJhY2tmbik7XHJcbiAgICB9O1xyXG5cclxuICAgIEltbXV0YWJsZUFycmF5LnByb3RvdHlwZS5maWx0ZXIgPSBmdW5jdGlvbiAoY2FsbGJhY2tmbiwgdGhpc0FyZykge1xyXG4gICAgICAgIC8vVGhpcyBpcyBkaXJ0eSBidXQgYW55dGhpbmcgZWxzZSB3b3VsZCBiZSBpbnBlcmZvcm1hbnQganVzdCBiZWNhdXNlIHR5cGVzY3JpcHQgZG9lcyBub3QgaGF2ZSBwcm90ZWN0ZWQgc2NvcGVcclxuICAgICAgICByZXR1cm4gdGhpcy5fcGFyZW50W1wiX2RhdGFcIl0uZmlsdGVyKGNhbGxiYWNrZm4pO1xyXG4gICAgfTtcclxuXHJcbiAgICBJbW11dGFibGVBcnJheS5wcm90b3R5cGUucmVkdWNlID0gZnVuY3Rpb24gKGNhbGxiYWNrZm4sIGluaXRpYWxWYWx1ZSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9wYXJlbnQucmVkdWNlKGNhbGxiYWNrZm4sIGluaXRpYWxWYWx1ZSk7XHJcbiAgICB9O1xyXG5cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShJbW11dGFibGVBcnJheS5wcm90b3R5cGUsIFwibGVuZ3RoXCIsIHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudC5sZW5ndGg7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgSW1tdXRhYmxlQXJyYXkucHJvdG90eXBlLnN1YnNjcmliZVBhcmVudFN0cmVhbSA9IGZ1bmN0aW9uIChwYXJlbnRTdHJlYW0pIHtcclxuICAgICAgICB2YXIgc3RyZWFtID0gU3RyZWFtLmNyZWF0ZVN0cmVhbSgpO1xyXG5cclxuICAgICAgICBwYXJlbnRTdHJlYW0uZm9yRWFjaChmdW5jdGlvbiAodXBkYXRlKSB7XHJcbiAgICAgICAgICAgIHN0cmVhbS5wdXNoKHVwZGF0ZSk7XHJcbiAgICAgICAgfSkudW50aWwodGhpcy5fcGFyZW50LmlzRGlzcG9zaW5nKTtcclxuXHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICAgIHRoaXMuX3VwZGF0ZVN0cmVhbXMucHVzaChzdHJlYW0pO1xyXG4gICAgICAgIHN0cmVhbS5vbkNsb3NlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdGhhdC5yZW1vdmVTdHJlYW0odGhhdC5fdXBkYXRlU3RyZWFtcywgc3RyZWFtKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHN0cmVhbTtcclxuICAgIH07XHJcblxyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEltbXV0YWJsZUFycmF5LnByb3RvdHlwZSwgXCJ1cGRhdGVzXCIsIHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3Vic2NyaWJlUGFyZW50U3RyZWFtKHRoaXMuX3BhcmVudC51cGRhdGVzKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXHJcbiAgICB9KTtcclxuXHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoSW1tdXRhYmxlQXJyYXkucHJvdG90eXBlLCBcIm5ld0l0ZW1zXCIsIHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3Vic2NyaWJlUGFyZW50U3RyZWFtKHRoaXMuX3BhcmVudC5uZXdJdGVtcyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEltbXV0YWJsZUFycmF5LnByb3RvdHlwZSwgXCJyZW1vdmVkSXRlbXNcIiwge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zdWJzY3JpYmVQYXJlbnRTdHJlYW0odGhpcy5fcGFyZW50LnJlbW92ZWRJdGVtcyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEltbXV0YWJsZUFycmF5LnByb3RvdHlwZSwgXCJkaXNwb3NpbmdcIiwge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zdWJzY3JpYmVQYXJlbnRTdHJlYW0odGhpcy5fcGFyZW50LmlzRGlzcG9zaW5nKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXHJcbiAgICB9KTtcclxuXHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoSW1tdXRhYmxlQXJyYXkucHJvdG90eXBlLCBcImltbXV0YWJsZVwiLCB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIEltbXV0YWJsZUFycmF5O1xyXG59KShJbW11dGFibGVTdG9yZSk7XHJcblxyXG4vKipcclxuKiBDcmVhdGUgYW4gYXJyYXkgc3RvcmUuIElmIGFuIGluaXRpYWwgdmFsdWUgaXMgcHJvdmlkZWQgaXQgd2lsbCBpbml0aWFsaXplIHRoZSBhcnJheVxyXG4qIHdpdGggaXQuIFRoZSBpbml0aWFsIHZhbHVlIGNhbiBiZSBhIEphdmFTY3JpcHQgYXJyYXkgb2YgZWl0aGVyIHNpbXBsZSB2YWx1ZXMgb3IgcGxhaW4gb2JqZWN0cy5cclxuKiBJdCB0aGUgYXJyYXkgaGFzIHBsYWluIG9iamVjdHMgYSBuZXN0ZWQgc3RvcmUgd2lsbCBiZSBjcmVhdGVkLlxyXG4qIEBwYXJhbSBpbml0aWFsXHJcbiogQHJldHVybnMgeyp9XHJcbiovXHJcbmZ1bmN0aW9uIGFycmF5KGluaXRpYWwpIHtcclxuICAgIGlmIChpbml0aWFsKSB7XHJcbiAgICAgICAgcmV0dXJuIGJ1aWxkRGVlcChpbml0aWFsKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBBcnJheVN0b3JlKCk7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5hcnJheSA9IGFycmF5O1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1zdG9yZS5qcy5tYXBcclxuIiwiLyoqXHJcbiogQ3JlYXRlZCBieSBTdGVwaGFuIG9uIDI3LjEyLjIwMTQuXHJcbipcclxuKiBBIHNpbXBsZSBpbXBsZW1lbnRhdGlvbiBvZiBhIGNvbGxlY3Rpb24gc3RyZWFtIHRoYXQgc3VwcG9ydHMgcmVhY3RpdmUgcGF0dGVybnMuXHJcbipcclxuKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcbi8qKlxyXG4qIEJhc2UgaW1wbGVtZW50YXRpb24gb2YgdGhlIGNvbGxlY3Rpb24gc3RyZWFtXHJcbiovXHJcbnZhciBTdHJlYW0gPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgZnVuY3Rpb24gU3RyZWFtKF9uYW1lKSB7XHJcbiAgICAgICAgdGhpcy5fbmFtZSA9IF9uYW1lO1xyXG4gICAgICAgIHRoaXMuX2J1ZmZlciA9IFtdO1xyXG4gICAgICAgIHRoaXMuX21ldGhvZHMgPSBbXTtcclxuICAgICAgICB0aGlzLl9lcnJvck1ldGhvZHMgPSBbXTtcclxuICAgICAgICB0aGlzLl9jbG9zZU1ldGhvZHMgPSBbXTtcclxuICAgICAgICB0aGlzLl9jbG9zZWQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLl9sZW5ndGggPSAwO1xyXG4gICAgICAgIHRoaXMuX21heExlbmd0aCA9IDA7XHJcbiAgICAgICAgdGhpcy5fbmV4dFN0cmVhbXMgPSBbXTtcclxuICAgIH1cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTdHJlYW0ucHJvdG90eXBlLCBcIm5hbWVcIiwge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbmFtZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXHJcbiAgICB9KTtcclxuXHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU3RyZWFtLnByb3RvdHlwZSwgXCJsZW5ndGhcIiwge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbGVuZ3RoO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcclxuICAgIH0pO1xyXG5cclxuICAgIFN0cmVhbS5wcm90b3R5cGUuY2FsbENsb3NlTWV0aG9kcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgdGhpcy5fY2xvc2VNZXRob2RzLmZvckVhY2goZnVuY3Rpb24gKG0pIHtcclxuICAgICAgICAgICAgbS5jYWxsKHRoYXQpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBTdHJlYW0ucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICghdGhpcy5fY2xvc2VkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2Nsb3NlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMuY2FsbENsb3NlTWV0aG9kcygpO1xyXG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2UoKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIFN0cmVhbS5wcm90b3R5cGUuZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLmNsb3NlKCk7XHJcbiAgICAgICAgdGhpcy5fbWV0aG9kcyA9IFtdO1xyXG4gICAgICAgIHRoaXMuX2J1ZmZlciA9IFtdO1xyXG4gICAgICAgIHRoaXMuX2Nsb3NlTWV0aG9kcyA9IFtdO1xyXG4gICAgICAgIHRoaXMuX2Vycm9yTWV0aG9kcyA9IFtdO1xyXG4gICAgfTtcclxuXHJcbiAgICBTdHJlYW0ucHJvdG90eXBlLnRpbWVzID0gZnVuY3Rpb24gKG1heExlbmd0aCkge1xyXG4gICAgICAgIHRoaXMuX21heExlbmd0aCA9IG1heExlbmd0aDtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcblxyXG4gICAgU3RyZWFtLnByb3RvdHlwZS51bnRpbCA9IGZ1bmN0aW9uIChzdHJlYW0pIHtcclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgaWYgKHN0cmVhbSkge1xyXG4gICAgICAgICAgICBzdHJlYW0uZm9yRWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB0aGF0LmNsb3NlKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG5cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTdHJlYW0ucHJvdG90eXBlLCBcImNsb3NlZFwiLCB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jbG9zZWQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgU3RyZWFtLnByb3RvdHlwZS5hZGRUb0J1ZmZlciA9IGZ1bmN0aW9uICh2YWx1ZSkge1xyXG4gICAgICAgIHRoaXMuX2J1ZmZlci51bnNoaWZ0KHZhbHVlKTtcclxuICAgIH07XHJcblxyXG4gICAgU3RyZWFtLnByb3RvdHlwZS5wcm9jZXNzQnVmZmVyID0gZnVuY3Rpb24gKGJ1ZmZlciwgbWV0aG9kcywgYmFzZUluZGV4KSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2Nsb3NlZClcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgaWYgKCFtZXRob2RzLmxlbmd0aClcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgICAgIHZhciBsID0gYnVmZmVyLmxlbmd0aDtcclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgdmFyIGVycm9ycyA9IFtdO1xyXG5cclxuICAgICAgICB3aGlsZSAobC0tKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGJ1ZmZlci5wb3AoKTtcclxuICAgICAgICAgICAgbWV0aG9kcy5mb3JFYWNoKGZ1bmN0aW9uIChtLCBpKSB7XHJcbiAgICAgICAgICAgICAgICB0cnkgIHtcclxuICAgICAgICAgICAgICAgICAgICBtLmNhbGwodGhhdCwgdmFsdWUsIGkgKyBiYXNlSW5kZXgpO1xyXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBlcnJvcnM7XHJcbiAgICB9O1xyXG5cclxuICAgIFN0cmVhbS5wcm90b3R5cGUucHJvY2Vzc0J1ZmZlcnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGVycm9ycyA9IHRoaXMucHJvY2Vzc0J1ZmZlcih0aGlzLl9idWZmZXIsIHRoaXMuX21ldGhvZHMsIHRoaXMuX2xlbmd0aCAtIHRoaXMuX2J1ZmZlci5sZW5ndGgpO1xyXG4gICAgICAgIGlmIChlcnJvcnMgJiYgZXJyb3JzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5fZXJyb3JNZXRob2RzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wcm9jZXNzQnVmZmVyKGVycm9ycywgdGhpcy5fZXJyb3JNZXRob2RzLCAwKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGVycm9ycy5mb3JFYWNoKGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBTdHJlYW0ucHJvdG90eXBlLmFkZE1ldGhvZCA9IGZ1bmN0aW9uIChtZXRob2QpIHtcclxuICAgICAgICB2YXIgZmlyc3RNZXRob2QgPSB0aGlzLl9tZXRob2RzLmxlbmd0aCA9PT0gMDtcclxuICAgICAgICB0aGlzLl9tZXRob2RzLnB1c2gobWV0aG9kKTtcclxuXHJcbiAgICAgICAgaWYgKGZpcnN0TWV0aG9kKSB7XHJcbiAgICAgICAgICAgIHRoaXMucHJvY2Vzc0J1ZmZlcnMoKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIFN0cmVhbS5wcm90b3R5cGUucmVtb3ZlTWV0aG9kID0gZnVuY3Rpb24gKG1ldGhvZCkge1xyXG4gICAgICAgIHRoaXMuX21ldGhvZHMuaW5kZXhPZihtZXRob2QpO1xyXG4gICAgfTtcclxuXHJcbiAgICBTdHJlYW0ucHJvdG90eXBlLmFkZEVycm9yTWV0aG9kID0gZnVuY3Rpb24gKG1ldGhvZCkge1xyXG4gICAgICAgIHRoaXMuX2Vycm9yTWV0aG9kcy5wdXNoKG1ldGhvZCk7XHJcbiAgICB9O1xyXG5cclxuICAgIFN0cmVhbS5wcm90b3R5cGUuYWRkQ2xvc2VNZXRob2QgPSBmdW5jdGlvbiAobWV0aG9kKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuY2xvc2VkKSB7XHJcbiAgICAgICAgICAgIG1ldGhvZC5jYWxsKHRoaXMpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2Nsb3NlTWV0aG9kcy5wdXNoKG1ldGhvZCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBTdHJlYW0ucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICBpZiAoIXRoaXMuX2Nsb3NlZCkge1xyXG4gICAgICAgICAgICB0aGlzLmFkZFRvQnVmZmVyKHZhbHVlKTtcclxuICAgICAgICAgICAgdGhpcy5fbGVuZ3RoKys7XHJcbiAgICAgICAgICAgIHRoaXMucHJvY2Vzc0J1ZmZlcnMoKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9sZW5ndGggPT09IHRoaXMuX21heExlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBTdHJlYW0ucHJvdG90eXBlLnB1c2hFcnJvciA9IGZ1bmN0aW9uIChlcnJvcikge1xyXG4gICAgICAgIC8vIElmIHdlIGNhbid0IGhhbmRsZSB0aGUgZXJyb3Igb3Vyc2VsdmVzIHdlIHRocm93IGl0IGFnYWluLiBUaGF0IHdpbGwgZ2l2ZSBwcmVjZWRpbmcgc3RyZWFtcyB0aGUgY2hhbmNlIHRvIGhhbmRsZSB0aGVzZVxyXG4gICAgICAgIGlmICghdGhpcy5fZXJyb3JNZXRob2RzIHx8ICF0aGlzLl9lcnJvck1ldGhvZHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnByb2Nlc3NCdWZmZXIoW2Vycm9yXSwgdGhpcy5fZXJyb3JNZXRob2RzLCAwKTtcclxuICAgIH07XHJcblxyXG4gICAgU3RyZWFtLnByb3RvdHlwZS5mb3JFYWNoID0gZnVuY3Rpb24gKG1ldGhvZCkge1xyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG1ldGhvZCk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG5cclxuICAgIFN0cmVhbS5wcm90b3R5cGUucmVnaXN0ZXJOZXh0U3RyZWFtID0gZnVuY3Rpb24gKG5leHRTdHJlYW0pIHtcclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgdGhpcy5fbmV4dFN0cmVhbXMucHVzaChuZXh0U3RyZWFtKTtcclxuICAgICAgICBuZXh0U3RyZWFtLm9uQ2xvc2UoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgaSA9IHRoYXQuX25leHRTdHJlYW1zLmluZGV4T2YobmV4dFN0cmVhbSk7XHJcbiAgICAgICAgICAgIGlmIChpICE9PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgdGhhdC5fbmV4dFN0cmVhbXMuc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGF0Ll9uZXh0U3RyZWFtcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGF0LmNsb3NlKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgU3RyZWFtLnByb3RvdHlwZS5hZGRNZXRob2RUb05leHRTdHJlYW0gPSBmdW5jdGlvbiAobmV4dFN0cmVhbSwgbWV0aG9kLCBvbkNsb3NlKSB7XHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICB2YXIgZm4gPSBmdW5jdGlvbiAodmFsdWUsIGluZGV4KSB7XHJcbiAgICAgICAgICAgIHRyeSAge1xyXG4gICAgICAgICAgICAgICAgbWV0aG9kLmNhbGwodGhhdCwgdmFsdWUsIGluZGV4KTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5wdXNoRXJyb3IoZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChmbik7XHJcblxyXG4gICAgICAgIG5leHRTdHJlYW0ub25DbG9zZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHRoYXQucmVtb3ZlTWV0aG9kKGZuKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5yZWdpc3Rlck5leHRTdHJlYW0obmV4dFN0cmVhbSk7XHJcblxyXG4gICAgICAgIGlmICghb25DbG9zZSkge1xyXG4gICAgICAgICAgICB0aGlzLm9uQ2xvc2UoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5jbG9zZSgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLm9uQ2xvc2Uob25DbG9zZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBTdHJlYW0ucHJvdG90eXBlLmZpbHRlciA9IGZ1bmN0aW9uIChtZXRob2QpIHtcclxuICAgICAgICB2YXIgbmV4dFN0cmVhbSA9IG5ldyBTdHJlYW0odGhpcy5fbmFtZSArIFwiLmZpbHRlclwiKTtcclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2YgbWV0aG9kID09PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgICAgICAgdGhpcy5hZGRNZXRob2RUb05leHRTdHJlYW0obmV4dFN0cmVhbSwgZnVuY3Rpb24gKHZhbHVlLCBpbmRleCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKG1ldGhvZC5jYWxsKHRoYXQsIHZhbHVlLCBpbmRleCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBuZXh0U3RyZWFtLnB1c2godmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmFkZE1ldGhvZFRvTmV4dFN0cmVhbShuZXh0U3RyZWFtLCBmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIGlmIChtZXRob2QgPT0gdmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICBuZXh0U3RyZWFtLnB1c2godmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9jbG9zZWQpIHtcclxuICAgICAgICAgICAgbmV4dFN0cmVhbS5jbG9zZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG5leHRTdHJlYW07XHJcbiAgICB9O1xyXG5cclxuICAgIFN0cmVhbS5wcm90b3R5cGUubWFwID0gZnVuY3Rpb24gKG1ldGhvZCkge1xyXG4gICAgICAgIHZhciBuZXh0U3RyZWFtID0gbmV3IFN0cmVhbSh0aGlzLl9uYW1lICsgXCIubWFwXCIpO1xyXG5cclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBtZXRob2QgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgICAgICB0aGlzLmFkZE1ldGhvZFRvTmV4dFN0cmVhbShuZXh0U3RyZWFtLCBmdW5jdGlvbiAodmFsdWUsIGluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICBuZXh0U3RyZWFtLnB1c2gobWV0aG9kLmNhbGwodGhhdCwgdmFsdWUsIGluZGV4KSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkTWV0aG9kVG9OZXh0U3RyZWFtKG5leHRTdHJlYW0sIGZ1bmN0aW9uICh2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5wdXNoKG1ldGhvZCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2Nsb3NlZCkge1xyXG4gICAgICAgICAgICBuZXh0U3RyZWFtLmNsb3NlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbmV4dFN0cmVhbTtcclxuICAgIH07XHJcblxyXG4gICAgU3RyZWFtLnByb3RvdHlwZS5zY2FuID0gZnVuY3Rpb24gKG1ldGhvZCwgc2VlZCkge1xyXG4gICAgICAgIHZhciBuZXh0U3RyZWFtID0gbmV3IFN0cmVhbSh0aGlzLl9uYW1lICsgXCIuc2NhblwiKTtcclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgdmFyIHNjYW5uZWQgPSBzZWVkO1xyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kVG9OZXh0U3RyZWFtKG5leHRTdHJlYW0sIGZ1bmN0aW9uICh2YWx1ZSkge1xyXG4gICAgICAgICAgICBzY2FubmVkID0gbWV0aG9kLmNhbGwodGhhdCwgc2Nhbm5lZCwgdmFsdWUpO1xyXG4gICAgICAgICAgICBuZXh0U3RyZWFtLnB1c2goc2Nhbm5lZCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIG5leHRTdHJlYW0ucHVzaChzY2FubmVkKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2Nsb3NlZCkge1xyXG4gICAgICAgICAgICBuZXh0U3RyZWFtLmNsb3NlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbmV4dFN0cmVhbTtcclxuICAgIH07XHJcblxyXG4gICAgU3RyZWFtLnByb3RvdHlwZS5yZWR1Y2UgPSBmdW5jdGlvbiAobWV0aG9kLCBzZWVkKSB7XHJcbiAgICAgICAgdmFyIG5leHRTdHJlYW0gPSBuZXcgU3RyZWFtKHRoaXMuX25hbWUgKyBcIi5yZWR1Y2VcIik7XHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICAgIHZhciByZWR1Y2VkID0gc2VlZDtcclxuICAgICAgICB0aGlzLmFkZE1ldGhvZFRvTmV4dFN0cmVhbShuZXh0U3RyZWFtLCBmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICAgICAgcmVkdWNlZCA9IG1ldGhvZC5jYWxsKHRoYXQsIHJlZHVjZWQsIHZhbHVlKTtcclxuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIG5leHRTdHJlYW0ucHVzaChyZWR1Y2VkKTtcclxuICAgICAgICAgICAgbmV4dFN0cmVhbS5jbG9zZSgpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fY2xvc2VkKSB7XHJcbiAgICAgICAgICAgIG5leHRTdHJlYW0uY2xvc2UoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMucmVnaXN0ZXJOZXh0U3RyZWFtKG5leHRTdHJlYW0pO1xyXG4gICAgICAgIHJldHVybiBuZXh0U3RyZWFtO1xyXG4gICAgfTtcclxuXHJcbiAgICBTdHJlYW0ucHJvdG90eXBlLmNvbmNhdCA9IGZ1bmN0aW9uIChzdHJlYW0pIHtcclxuICAgICAgICB2YXIgbmV4dFN0cmVhbSA9IG5ldyBTdHJlYW0odGhpcy5fbmFtZSArIFwiLmNvbmNhdFwiKTtcclxuICAgICAgICB2YXIgYnVmZmVyID0gbnVsbDtcclxuXHJcbiAgICAgICAgLy8gV2hlbiB0aGlzIGlzIGFscmVhZHkgY2xvc2VkLCB3ZSBvbmx5IGNhcmUgZm9yIHRoZSBvdGhlciBzdHJlYW1cclxuICAgICAgICBpZiAoIXRoaXMuX2Nsb3NlZCkge1xyXG4gICAgICAgICAgICBidWZmZXIgPSBbXTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpZiAoc3RyZWFtLmNsb3NlZCkge1xyXG4gICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5jbG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBXZSBuZWVkIHRvIGJ1ZmZlciwgYmVjYXVzZSB0aGlzIG1heSBub3QgYmUgdGhlIGZpcnN0XHJcbiAgICAgICAgLy8gbWV0aG9kIGF0dGFjaGVkIHRvIHRoZSBzdHJlYW0uIE90aGVyd2lzZSBhbnkgZGF0YSB0aGF0XHJcbiAgICAgICAgLy8gaXMgcHVzaGVkIHRvIHN0cmVhbSBiZWZvcmUgdGhlIG9yaWdpbmFsIGlzIGNsb3NlZCB3b3VsZFxyXG4gICAgICAgIC8vIGJlIGxvc3QgZm9yIHRoZSBjb25jYXQuXHJcbiAgICAgICAgc3RyZWFtLmZvckVhY2goZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmIChidWZmZXIpIHtcclxuICAgICAgICAgICAgICAgIGJ1ZmZlci5wdXNoKHZhbHVlKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIG5leHRTdHJlYW0ucHVzaCh2YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgc3RyZWFtLm9uQ2xvc2UoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAoIWJ1ZmZlcikge1xyXG4gICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5jbG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kVG9OZXh0U3RyZWFtKG5leHRTdHJlYW0sIGZ1bmN0aW9uICh2YWx1ZSkge1xyXG4gICAgICAgICAgICBuZXh0U3RyZWFtLnB1c2godmFsdWUpO1xyXG4gICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKGJ1ZmZlcikge1xyXG4gICAgICAgICAgICAgICAgYnVmZmVyLmZvckVhY2goZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5wdXNoKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChzdHJlYW0uY2xvc2VkKSB7XHJcbiAgICAgICAgICAgICAgICBuZXh0U3RyZWFtLmNsb3NlKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGJ1ZmZlciA9IG51bGw7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9jbG9zZWQgJiYgc3RyZWFtLmNsb3NlZCkge1xyXG4gICAgICAgICAgICBuZXh0U3RyZWFtLmNsb3NlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbmV4dFN0cmVhbTtcclxuICAgIH07XHJcblxyXG4gICAgU3RyZWFtLnByb3RvdHlwZS5jb25jYXRBbGwgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIG5leHRTdHJlYW0gPSBuZXcgU3RyZWFtKHRoaXMuX25hbWUgKyBcIi5jb25jYXRBbGxcIik7XHJcbiAgICAgICAgdmFyIHF1ZXVlID0gW107XHJcbiAgICAgICAgdmFyIGN1cnNvciA9IG51bGw7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIG5leHRJblF1ZXVlKCkge1xyXG4gICAgICAgICAgICB2YXIgbCA9IHF1ZXVlLmxlbmd0aDtcclxuXHJcbiAgICAgICAgICAgIHdoaWxlIChsLS0pIHtcclxuICAgICAgICAgICAgICAgIGN1cnNvciA9IHF1ZXVlW2xdO1xyXG4gICAgICAgICAgICAgICAgdXBkYXRlKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoY3Vyc29yLmRvbmUpIHtcclxuICAgICAgICAgICAgICAgICAgICBxdWV1ZS5wb3AoKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHVwZGF0ZSgpIHtcclxuICAgICAgICAgICAgaWYgKGN1cnNvcikge1xyXG4gICAgICAgICAgICAgICAgdmFyIGwgPSBjdXJzb3IuZGF0YS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAobC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmV4dFN0cmVhbS5wdXNoKGN1cnNvci5kYXRhLnBvcCgpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gY29uY2F0U3RyZWFtKHN0cmVhbSkge1xyXG4gICAgICAgICAgICB2YXIgc3ViQnVmZmVyID0ge1xyXG4gICAgICAgICAgICAgICAgZGF0YTogW10sXHJcbiAgICAgICAgICAgICAgICBkb25lOiBmYWxzZVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBxdWV1ZS51bnNoaWZ0KHN1YkJ1ZmZlcik7XHJcblxyXG4gICAgICAgICAgICBzdHJlYW0uZm9yRWFjaChmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIHN1YkJ1ZmZlci5kYXRhLnVuc2hpZnQodmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgdXBkYXRlKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgc3RyZWFtLm9uQ2xvc2UoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgc3ViQnVmZmVyLmRvbmUgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgbmV4dEluUXVldWUoKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICBjdXJzb3IgPSBzdWJCdWZmZXI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbiAoc3ViU3RyZWFtKSB7XHJcbiAgICAgICAgICAgIGNvbmNhdFN0cmVhbShzdWJTdHJlYW0pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLm9uQ2xvc2UoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBuZXh0U3RyZWFtLmNsb3NlKCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9jbG9zZWQpIHtcclxuICAgICAgICAgICAgbmV4dFN0cmVhbS5jbG9zZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5yZWdpc3Rlck5leHRTdHJlYW0obmV4dFN0cmVhbSk7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXh0U3RyZWFtO1xyXG4gICAgfTtcclxuXHJcbiAgICBTdHJlYW0ucHJvdG90eXBlLmNvbWJpbmUgPSBmdW5jdGlvbiAoc3RyZWFtKSB7XHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICAgIHZhciBuZXh0U3RyZWFtID0gbmV3IFN0cmVhbSh0aGlzLl9uYW1lICsgXCIuY29tYmluZVwiKTtcclxuXHJcbiAgICAgICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uICh2YWx1ZSkge1xyXG4gICAgICAgICAgICBuZXh0U3RyZWFtLnB1c2godmFsdWUpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBzdHJlYW0uZm9yRWFjaChmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICAgICAgbmV4dFN0cmVhbS5wdXNoKHZhbHVlKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5vbkNsb3NlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKHN0cmVhbS5jbG9zZWQpIHtcclxuICAgICAgICAgICAgICAgIG5leHRTdHJlYW0uY2xvc2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBzdHJlYW0ub25DbG9zZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGF0Ll9jbG9zZWQpIHtcclxuICAgICAgICAgICAgICAgIG5leHRTdHJlYW0uY2xvc2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fY2xvc2VkICYmIHN0cmVhbS5jbG9zZWQpIHtcclxuICAgICAgICAgICAgbmV4dFN0cmVhbS5jbG9zZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5yZWdpc3Rlck5leHRTdHJlYW0obmV4dFN0cmVhbSk7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXh0U3RyZWFtO1xyXG4gICAgfTtcclxuXHJcbiAgICBTdHJlYW0ucHJvdG90eXBlLm9uQ2xvc2UgPSBmdW5jdGlvbiAobWV0aG9kKSB7XHJcbiAgICAgICAgdGhpcy5hZGRDbG9zZU1ldGhvZChtZXRob2QpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuXHJcbiAgICBTdHJlYW0ucHJvdG90eXBlLm9uRXJyb3IgPSBmdW5jdGlvbiAobWV0aG9kKSB7XHJcbiAgICAgICAgdGhpcy5hZGRFcnJvck1ldGhvZChtZXRob2QpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuICAgIHJldHVybiBTdHJlYW07XHJcbn0pKCk7XHJcbmV4cG9ydHMuU3RyZWFtID0gU3RyZWFtO1xyXG5cclxuLyoqXHJcbiogQ3JlYXRlIGEgbmV3IHN0cmVhbS4gVGhlIG5hbWUgaXMgbW9zdGx5IGZvciBkZWJ1Z2dpbmcgcHVycG9zZXMgYW5kIGNhbiBiZSBvbWl0dGVkLiBJdCBkZWZhdWx0cyB0byAnc3RyZWFtJyB0aGVuLlxyXG4qIEBwYXJhbSBuYW1lXHJcbiogQHJldHVybnMge1N0cmVhbX1cclxuKi9cclxuZnVuY3Rpb24gY3JlYXRlU3RyZWFtKG5hbWUpIHtcclxuICAgIHJldHVybiBuZXcgU3RyZWFtKG5hbWUgfHwgXCJzdHJlYW1cIik7XHJcbn1cclxuZXhwb3J0cy5jcmVhdGVTdHJlYW0gPSBjcmVhdGVTdHJlYW07XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXN0cmVhbS5qcy5tYXBcclxuIiwiLyoqXHJcbiogQ3JlYXRlZCBieSBTdGVwaGFuLlNtb2xhIG9uIDMwLjEwLjIwMTQuXHJcbiovXHJcblwidXNlIHN0cmljdFwiO1xyXG4vKipcclxuKiBEZXRlcm1pbmUgdGhlIHNjcmVlbiBwb3NpdGlvbiBhbmQgc2l6ZSBvZiBhbiBlbGVtZW50IGluIHRoZSBET01cclxuKiBAcGFyYW0gZWxlbWVudFxyXG4qIEByZXR1cm5zIHt7eDogbnVtYmVyLCB5OiBudW1iZXIsIHc6IG51bWJlciwgaDogbnVtYmVyfX1cclxuKi9cclxuZnVuY3Rpb24gZWxlbWVudFBvc2l0aW9uQW5kU2l6ZShlbGVtZW50KSB7XHJcbiAgICB2YXIgcmVjdCA9IGVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcbiAgICByZXR1cm4geyB4OiByZWN0LmxlZnQsIHk6IHJlY3QudG9wLCB3OiByZWN0LndpZHRoLCBoOiByZWN0LmhlaWdodCB9O1xyXG59XHJcbmV4cG9ydHMuZWxlbWVudFBvc2l0aW9uQW5kU2l6ZSA9IGVsZW1lbnRQb3NpdGlvbkFuZFNpemU7XHJcblxyXG52YXIgcGZ4ID0gW1xyXG4gICAgeyBpZDogXCJ3ZWJraXRcIiwgY2FtZWxDYXNlOiB0cnVlIH0sXHJcbiAgICB7IGlkOiBcIk1TXCIsIGNhbWVsQ2FzZTogdHJ1ZSB9LFxyXG4gICAgeyBpZDogXCJvXCIsIGNhbWVsQ2FzZTogdHJ1ZSB9LFxyXG4gICAgeyBpZDogXCJcIiwgY2FtZWxDYXNlOiBmYWxzZSB9XTtcclxuXHJcbi8qKlxyXG4qIEFkZCBldmVudCBsaXN0ZW5lciBmb3IgcHJlZml4ZWQgZXZlbnRzLiBBcyB0aGUgY2FtZWwgY2FzaW5nIG9mIHRoZSBldmVudCBsaXN0ZW5lcnMgaXMgZGlmZmVyZW50XHJcbiogYWNyb3NzIGJyb3dzZXJzIHlvdSBuZWVkIHRvIHNwZWNpZml5IHRoZSB0eXBlIGNhbWVsY2FzZWQgc3RhcnRpbmcgd2l0aCBhIGNhcGl0YWwgbGV0dGVyLiBUaGUgZnVuY3Rpb25cclxuKiB0aGVuIHRha2VzIGNhcmUgb2YgdGhlIGJyb3dzZXIgc3BlY2lmaWNzLlxyXG4qXHJcbiogQHBhcmFtIGVsZW1lbnRcclxuKiBAcGFyYW0gdHlwZVxyXG4qIEBwYXJhbSBjYWxsYmFja1xyXG4qL1xyXG5mdW5jdGlvbiBhZGRQcmVmaXhlZEV2ZW50TGlzdGVuZXIoZWxlbWVudCwgdHlwZSwgY2FsbGJhY2spIHtcclxuICAgIGZvciAodmFyIHAgPSAwOyBwIDwgcGZ4Lmxlbmd0aDsgcCsrKSB7XHJcbiAgICAgICAgaWYgKCFwZnhbcF0uY2FtZWxDYXNlKVxyXG4gICAgICAgICAgICB0eXBlID0gdHlwZS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIocGZ4W3BdLmlkICsgdHlwZSwgY2FsbGJhY2ssIGZhbHNlKTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLmFkZFByZWZpeGVkRXZlbnRMaXN0ZW5lciA9IGFkZFByZWZpeGVkRXZlbnRMaXN0ZW5lcjtcclxuXHJcbi8qKlxyXG4qIENvbnZlbmllbmNlIG1ldGhvZCBmb3IgY2FsbGluZyBjYWxsYmFja3NcclxuKiBAcGFyYW0gY2IgICAgVGhlIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGNhbGxcclxuKi9cclxuZnVuY3Rpb24gY2FsbENhbGxiYWNrKGNiKSB7XHJcbiAgICB2YXIgYW55ID0gW107XHJcbiAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgKGFyZ3VtZW50cy5sZW5ndGggLSAxKTsgX2krKykge1xyXG4gICAgICAgIGFueVtfaV0gPSBhcmd1bWVudHNbX2kgKyAxXTtcclxuICAgIH1cclxuICAgIGlmIChjYikge1xyXG4gICAgICAgIGlmICh0eXBlb2YgKGNiKSA9PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgICAgICAgdmFyIGFyZ3MgPSBbXTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGFyZ3MucHVzaChhcmd1bWVudHNbaV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBjYi5hcHBseSh0aGlzLCBhcmdzKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYWxsYmFjayBpcyBub3QgYSBmdW5jdGlvbiFcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuY2FsbENhbGxiYWNrID0gY2FsbENhbGxiYWNrO1xyXG5cclxuLyoqXHJcbiogQ2hlY2sgaWYgc29tZXRoaW5nIGlzIGFuIGFycmF5LlxyXG4qIEBwYXJhbSB0aGluZ1xyXG4qIEByZXR1cm5zIHtib29sZWFufVxyXG4qL1xyXG5mdW5jdGlvbiBpc0FycmF5KHRoaW5nKSB7XHJcbiAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHRoaW5nKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcclxufVxyXG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xyXG5cclxudmFyIE9JRF9QUk9QID0gXCJfX0lEX19cIjtcclxudmFyIG9pZHMgPSAxMDAwMDtcclxuXHJcbi8qKlxyXG4qIENyZWF0ZSBhbmQgcmV0dXJuIGEgdW5pcXVlIGlkIG9uIGEgSmF2YVNjcmlwdCBvYmplY3QuIFRoaXMgYWRkcyBhIG5ldyBwcm9wZXJ0eVxyXG4qIF9fSURfXyB0byB0aGF0IG9iamVjdC4gSWRzIGFyZSBudW1iZXJzLlxyXG4qXHJcbiogVGhlIElEIGlzIGNyZWF0ZWQgdGhlIGZpcnN0IHRpbWUgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgZm9yIHRoYXQgb2JqZWN0IGFuZCB0aGVuXHJcbiogd2lsbCBzaW1wbHkgYmUgcmV0dXJuZWQgb24gYWxsIHN1YnNlcXVlbnQgY2FsbHMuXHJcbipcclxuKiBAcGFyYW0gb2JqXHJcbiogQHJldHVybnMge2FueX1cclxuKi9cclxuZnVuY3Rpb24gb2lkKG9iaikge1xyXG4gICAgaWYgKG9iaikge1xyXG4gICAgICAgIGlmICghb2JqLmhhc093blByb3BlcnR5KE9JRF9QUk9QKSkge1xyXG4gICAgICAgICAgICBvYmpbT0lEX1BST1BdID0gb2lkcysrO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG9ialtPSURfUFJPUF07XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5vaWQgPSBvaWQ7XHJcblxyXG5mdW5jdGlvbiBhcHBseU1peGlucyhkZXJpdmVkQ3RvciwgYmFzZUN0b3JzKSB7XHJcbiAgICBiYXNlQ3RvcnMuZm9yRWFjaChmdW5jdGlvbiAoYmFzZUN0b3IpIHtcclxuICAgICAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhiYXNlQ3RvcikuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkge1xyXG4gICAgICAgICAgICBkZXJpdmVkQ3Rvci5wcm90b3R5cGVbbmFtZV0gPSBiYXNlQ3RvcltuYW1lXTtcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG59XHJcblxyXG4vKipcclxuKiBVc2UgdGhpcyB0byBzdWJjbGFzcyBhIHR5cGVzY3JpcHQgY2xhc3MgdXNpbmcgcGxhaW4gSmF2YVNjcmlwdC4gU3BlYyBpcyBhbiBvYmplY3RcclxuKiBjb250YWluaW5nIHByb3BlcnRpZXMgYW5kIG1ldGhvZHMgb2YgdGhlIG5ldyBjbGFzcy4gTWV0aG9kcyBpbiBzcGVjIHdpbGwgb3ZlcnJpZGVcclxuKiBtZXRob2RzIGluIGJhc2VDbGFzcy5cclxuKlxyXG4qIFlvdSB3aWxsIE5PVCBiZSBhYmxlIHRvIG1ha2Ugc3VwZXIgY2FsbHMgaW4gdGhlIHN1YmNsYXNzLlxyXG4qXHJcbiogQHBhcmFtIHNwZWNcclxuKiBAcGFyYW0gYmFzZUNsYXNzXHJcbiogQHJldHVybnMge2FueX1cclxuKi9cclxuZnVuY3Rpb24gc3ViY2xhc3Moc3BlYywgYmFzZUNsYXNzKSB7XHJcbiAgICB2YXIgY29uc3RydWN0b3I7XHJcbiAgICBpZiAoc3BlYy5oYXNPd25Qcm9wZXJ0eShcImNvbnN0cnVjdG9yXCIpKSB7XHJcbiAgICAgICAgY29uc3RydWN0b3IgPSBzcGVjW1wiY29uc3RydWN0b3JcIl07XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBiYXNlQ2xhc3MucHJvdG90eXBlLmNvbnN0cnVjdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdHJ1Y3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKGJhc2VDbGFzcy5wcm90b3R5cGUpO1xyXG4gICAgYXBwbHlNaXhpbnMoY29uc3RydWN0b3IsIFtzcGVjXSk7XHJcblxyXG4gICAgcmV0dXJuIGNvbnN0cnVjdG9yO1xyXG59XHJcbmV4cG9ydHMuc3ViY2xhc3MgPSBzdWJjbGFzcztcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dG9vbHMuanMubWFwXHJcbiJdfQ==
