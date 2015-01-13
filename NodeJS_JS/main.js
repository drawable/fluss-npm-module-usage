/**
 * Created by Stephan on 11.01.2015.
 */

"use strict";

var Store = require("fluss").Store;

var array = Store.array();

array.newItems.forEach(function(update) {
    console.log(update.value + " was added.")
});

console.log("fluss - node.js, Javascript");

array.push("One");
array.push(2);