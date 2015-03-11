
var gulp = require('gulp'),
	config = require('../config'),
	watch    = require('gulp-watch')
  log = require('../util/log');

// ----- Watch during development -----

gulp.task('watch', function ( callback ) {


  config.assets.forEach( function( asset ) {

    if ( typeof(asset.cssWatch) !== "undefined") {
      log('[ Watching ] '+'css-dev-'+asset.cssSlug);
      gulp.watch( asset.cssWatch, function (files,  callback ) {
          log('[ Changed ] '+'css-dev-'+asset.cssSlug);
          gulp.start( ['css-dev-'+asset.cssSlug] );
      });
    }

    if ( typeof(asset.jsWatch) !== "undefined") {
      log('[ Watching ] '+'js-dev-'+asset.jsSlug);
      gulp.watch( asset.jsWatch, function (files, callback) {
          log('[ Changed ] '+'js-dev-'+asset.jsSlug);
          gulp.start( ['js-dev-'+asset.jsSlug] );
      });
    }
/*
    if ( typeof(asset.imageWatch) !== "undefined") {
      log('[ Watching ] '+'image-min-'+asset.slug);
      watch( asset.imageWatch, function (files, callback) {
          log('[ Changed ] '+'image-min-'+asset.slug);
          gulp.start( ['image-min-'+asset.slug] );
      });
    }
*/
  });
});
