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