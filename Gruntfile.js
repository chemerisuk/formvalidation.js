module.exports = function(grunt) {
    "use strict";

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),

        watch: {
            karma: {
                files: ["formvalidation.js", "Gruntfile.js"],
                tasks: ["jshint"] 
            }
        },

        jshint: {
            all: ["formvalidation.js", "Gruntfile.js"],
            options: {
                jshintrc: ".jshintrc"
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-watch");

    grunt.registerTask("travis", [
        "jshint"
    ]);

};
