/**
 * Created by Stephan on 13.01.2015.
 */

"use strict";


require.config({
    baseUrl: "./",

    paths: {
        "libs": "../" + "bower_components"
    },

    packages: [{
        name: "fluss",
        location: "../node_modules/fluss/amd/"
    }]
});


define(["libs/domready/ready", "fluss"], function(ready, Fluss) {

    ready(function() {
        var array = Fluss.Store.array();

        array.newItems.forEach(function(update) {
            document.write(update.value + " was added.<br>")
        });

        document.write("<h1>fluss - amd, require.js, Javascript</h1>");

        array.push("One");
        array.push(2);
    });

});