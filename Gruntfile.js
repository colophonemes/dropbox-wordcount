module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.initConfig({
    copy : {
      dist : {
        src : ['package.json','index.js','config.js','lib/**/*.js'],
        dest : 'dist/'
      }
    },
    jshint : {
      files : ['Gruntfile.js','index.js','config.js','lib/**/*.js']
    },
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint']
    }
  });


  grunt.registerTask('default', ['watch']);
  grunt.registerTask('build', ['copy:dist']);

};