module.exports = function (grunt) {

    require('time-grunt')(grunt);

    grunt.initConfig({
        sprite:{
            all: {
                src: 'img.sprite.src/*.png',
                destImg: '../img/spritesheet.png',
                destCSS: 'scss/base/_sprites.scss',
                imgPath: '../img/spritesheet.png'
            }

        },
        compass: {
            dist: {
                options: {
                    sassDir: 'scss',
                    cssDir: '../css',
                    outputStyle: 'compressed',
                    environment: 'production',
                    bundleExec:true
                }
            },
            dev: {
                options: {
                    sourcemap: true,
                    sassDir: 'scss',
                    cssDir: '../css',
                    outputStyle: 'expanded',
                    bundleExec:true,
                    raw:'require "sassy-maps" \n require "breakpoint"  \n Encoding.default_external = "utf-8"'
                },
                files: {
                    '../css/styles.css' : 'scss/styles.scss'
                }
            }
        },
        watch: {

            sass: {
                // We watch and compile sass files as normal but don't live reload here
                files: ['scss/**/*.scss'],
                tasks: ['compass:dist']
            }

        },
        uglify: {
            options:{
                banner: '/* created: <%= grunt.template.today("yyyy-mm-dd-ss") %> */'
            },
            all: {
                files: {
                    'js/main.min.js': ['js/control.js', 'js/rock.js' ]
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-compass');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-spritesmith');

    // Default task.
    grunt.registerTask('default', 'watch');


};