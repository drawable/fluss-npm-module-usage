/// <reference path="../node_modules/fluss/fluss.d.ts" />


/**
 * Created by Stephan on 13.01.2015.
 */

"use strict";

import Fluss = require("fluss");


export function run() {
    var array = Fluss.Store.array();

    array.newItems.forEach(function(update) {
        document.write(update.value + " was added.<br>")
    });

    array.push("One");
    array.push(2);
}
