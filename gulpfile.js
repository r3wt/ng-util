var gulp = require('gulp');
var uglify = require('gulp-uglify');
var pump = require('pump');
var rename = require("gulp-rename");
 
gulp.task('default', function (cb) {
  pump([
        gulp.src('src/utils.js'),
        uglify({ preserveComments: 'license', mangle: true }),
		rename('utils.min.js'),
        gulp.dest('dist')
    ],
	cb
  );
});