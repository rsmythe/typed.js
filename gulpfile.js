
// Grab node packages
var gulp = require('gulp')
    rename = require('gulp-rename')
    uglify = require('gulp-uglify');
    tsc = require('gulp-typescript');
    merge = require('merge2');
    naturalSort = require('gulp-natural-sort');
    sourcemaps = require('gulp-sourcemaps');

gulp.task('compile-ts', function () {
    var tsProject = tsc.createProject('./tsconfig.json', { declaration: true });

    var tsResult = tsProject.src() // instead of gulp.src(...)
        .pipe(naturalSort())
        .pipe(sourcemaps.init())
        .pipe(tsProject());

    return merge([
        tsResult.dts.pipe(gulp.dest('./dist')),
        tsResult.js.pipe(sourcemaps.write())
        .pipe(gulp.dest('.'))
    ]);
});    
 
gulp.task('compress', function() {
  gulp.src('js/*.js')
    .pipe(uglify())
    .pipe(rename('typed.min.js'))
    .pipe(gulp.dest('dist'))
});

// Default Task
gulp.task('default', ['compile-ts', 'compress']);
