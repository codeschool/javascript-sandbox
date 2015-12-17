module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-contrib-connect");
  grunt.loadNpmTasks('grunt-karma');

  // Project configuration.
  grunt.initConfig({
    clean: ["build/javascript-sandbox.js"],
    connect: {
      server: {
        options: {
          port: 4000
        }
      }
    },
    browserify: {
      common: {
        src: ['lib/**/*.js'],
        dest: 'build/javascript-sandbox.js',
        options: {
          alias: 'lib/index.js:javascript-sandbox'
        }
      }
    },
    karma: {
      unit: {
        configFile: 'karma.conf.js',
        background: true
      },
      continuous: {
        configFile: 'karma.conf.js',
        singleRun: true,
        browsers: ['PhantomJS']
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
  grunt.registerTask('default', ['clean', 'browserify', 'karma:continuous']);
  grunt.registerTask('develop', ['clean', 'browserify', 'karma:unit:start', 'watch']);
};
