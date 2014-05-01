var path = require("path");

module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-gitbook');
    grunt.loadNpmTasks('grunt-gh-pages');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.initConfig({
        'gitbook': {
            development: {
                input: "./src",
                format: "site",
                title: "Scala Tour",
                description: "My location for adding scala findings",
                github: "dcapwell/scala-tour"
            }
        },
        'gh-pages': {
            options: {
                base: '_book'
            },
            src: ['**']
        },
        'clean': {
            files: '.grunt'
        }
    });

    grunt.registerTask('publish', [
        'clean',
        'gitbook',
        'gh-pages'
    ]);
    grunt.registerTask('default', 'gitbook');
};
