var gulp = require('gulp');
var uglify = require('gulp-uglify');
var pump = require('pump');
var rename = require("gulp-rename");
 
gulp.task('default', function (cb) {
  pump([
        gulp.src('src/util.js'),
        uglify({ preserveComments: 'license', mangle: true }),
		rename('util.min.js'),
        gulp.dest('dist')
    ],
	cb
  );
});