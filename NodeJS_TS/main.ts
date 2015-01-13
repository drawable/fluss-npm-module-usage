/// <reference path="../node_modules/fluss/fluss.d.ts" />

/**
 * Created by Stephan on 11.01.2015.
 */

"use strict";


import Fluss = require("fluss")

var array = Fluss.Store.array();

array.newItems.forEach(function(update) {
    console.log(update.value + " was added.")
});

console.log("fluss - node.js, Typescript");

array.push("One");
array.push(2);

