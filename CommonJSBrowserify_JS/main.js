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