/// <reference path="../types/requirejs.d.ts" />
/**
 * Created by Stephan on 11.01.2015.
 */

"use strict";

require.config({
    baseUrl: "./",

    paths: {
        "libs": "../" + "bower_components",
        "fluss": "../node_modules/fluss/amd/fluss"
    }
});


define(["libs/domready/ready", "./test"], function(ready, test) {

    ready(function() {
        document.write("<h1>fluss - amd, require.js, Typescript</h1>");
        test.run();
    });

});