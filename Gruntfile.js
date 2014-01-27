module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-mocha');

  // Project configuration.
  grunt.initConfig({
    clean: ["build/javascript-sandbox.js"],
    browserify: {
      common: {
        src: ['lib/**/*.js'],
        dest: 'build/javascript-sandbox.js',
        options: {
          alias: 'lib/index.js:sandbox-javascript'
        }
      }
    },
    karma: {
      unit: {
        configFile: 'karma.conf.js',
        background: true
      }
    },
    watch: {
      //run unit tests with karma (server needs to be already running)
      karma: {
        files: ['lib/**/*.js', 'test/**/*.js'],
        tasks: ['browserify', 'karma:unit:run']
      }
    }
  });

  // Default task(s).
  grunt.registerTask('default', ['clean', 'browserify']);
  grunt.registerTask('develop', ['karma:unit:start', 'watch']);
};