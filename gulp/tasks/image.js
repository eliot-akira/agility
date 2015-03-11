
var gulp = require('gulp'),
    config = require('../config'),
    plugins = require('gulp-load-plugins')(),
    log = require('../util/log');


config.assets.forEach( function( asset ) {

  if ( typeof(asset.imageSource) !== "undefined") {

    gulp.task('image-min-'+asset.slug, function() {
      return runImageMin( asset.imageSource, asset.imageDest, asset.imageFiles );
    });
  }
});

function runImageMin( src, dest, files ) {

  return gulp.src( files )
    .pipe( plugins.imagemin({
      optimizationLevel: 6,
      progessive: true,
      interlaced: true
    }) )
    .pipe(gulp.dest( dest ))
    .on('end', function(){ log('[ Images ] Optimized: '+src+' to '+dest) });
}
