
var gulp = require('gulp'),
	config = require('../config'),
	watch    = require('gulp-watch')
  log = require('../util/log');

// ----- Watch during development -----

gulp.task('watch', function ( callback ) {

  config.assets.forEach( function( asset ) {

    if ( typeof(asset.jsWatch) !== "undefined") {
      log('[ Watching ] '+'js-dev-'+asset.jsSlug);
      gulp.watch( asset.jsWatch, function (files, callback) {
          log('[ Changed ] '+'js-dev-'+asset.jsSlug);
          gulp.start( ['js-dev-'+asset.jsSlug] );
      });
    }

  });
});
