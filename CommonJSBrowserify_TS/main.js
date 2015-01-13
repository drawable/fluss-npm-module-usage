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