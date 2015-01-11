/**
 * Created by Stephan on 02.01.2015.
 */

"use strict";

var gulp = require('gulp');
var typescript = require('gulp-typescript');
var browserify = require('browserify');
var sourcemaps = require('gulp-sourcemaps');


gulp.task("compile-CommonJSBrowserify_TS", function() {
    var tsResult = gulp.src(["./CommonJSBrowserify_TS/**/*.ts"])
        .pipe(sourcemaps.init())
        .pipe(typescript({
            module: "commonjs",
            target: "ES5"
        }));

    return tsResult.js
        .pipe(sourcemaps.write("."))
        .pipe(gulp.dest("./CommonJSBrowserify_TS"));
});

gulp.task("bundle-CommonJSBrowserify_TS", ["compile-CommonJSBrowserify_TS"], function() {

    browserify("./CommonJSBrowserify_TS/main.js", {
        debug: true
    })
        .bundle()
        .pipe(source("bundle.js"))
        .pipe(gulp.dest("./CommonJSBrowserify_TS/"))
});


gulp.task("bundle-CommonJSBrowserify_JS", function() {

    browserify("./CommonJSBrowserify_JS/main.js", {
        debug: true
    })
        .bundle()
        .pipe(source("bundle.js"))
        .pipe(gulp.dest("./CommonJSBrowserify_JS/"))
});
