/**
 * Created by Stephan on 13.01.2015.
 */

"use strict";


require.config({
    baseUrl: "./",

    paths: {
        "libs": "../" + "bower_components",
        "fluss": "../node_modules/fluss/amd/fluss"
    }
});


define(["libs/domready/ready", "fluss/store"], function(ready, Store) {

    ready(function() {
        var array = Store.array();

        array.newItems.forEach(function(update) {
            document.write(update.value + " was added.<br>")
        });

        document.write("<h1>fluss - amd, require.js, Javascript</h1>");

        array.push("One");
        array.push(2);
    });

});