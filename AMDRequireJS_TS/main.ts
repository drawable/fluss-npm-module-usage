/// <reference path="../types/requirejs.d.ts" />
/**
 * Created by Stephan on 11.01.2015.
 */

"use strict";

require.config({
    baseUrl: "./",

    paths: {
        "libs": "../" + "bower_components",
        "fluss": "../node_modules/fluss/amd/" + "fluss"
    }
});

define(["libs/domready/ready", "fluss/store"], function(ready, Store) {

    ready(function() {
        var array = Store.array();

        array.newItems.forEach(function(update) {
            console.log(update.value + " was added.")
        });

        array.push("One");
        array.push(2);
    });

});