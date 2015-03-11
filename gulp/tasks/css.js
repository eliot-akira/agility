
var gulp = require('gulp'),
    config = require('../config'),
    plugins = require('gulp-load-plugins')(),
    del = require('del'),
    log = require('../util/log');


config.assets.forEach( function( asset ) {
  if ( !!asset.cssSource ) {
    setupTasks( asset.cssSlug, asset.cssSource, asset.cssDest, asset.cssFiles );
  }
});


function setupTasks( slug, src, dest, files ) {

  // Remove old bundle
  gulp.task('css-clean-'+slug, function() {
    return runCleanCSS( slug, src, dest );
  });

  // Compile Sass
  gulp.task('sass-'+slug, ['css-clean-'+slug], function() {
    return runSass( slug, src, dest );
  });

  // Concat
  gulp.task('css-concat-'+slug, ['sass-'+slug, 'css-clean-'+slug], function() {
    return runConcatCSS( slug, src, dest, files );
  });

  // Minify
  gulp.task('css-min-'+slug, ['css-concat-'+slug], function() {
    return runMinifyCSS( slug, src, dest );
  });



  // Dev compile Sass
  gulp.task('sass-dev-'+slug, ['css-clean-'+slug], function() {
    return runSass( slug, src, dest, true );
  });

  // Dev concat
  gulp.task('css-dev-'+slug, ['sass-dev-'+slug, 'css-clean-'+slug], function() {
    return runConcatCSS( slug, src, dest, files, true );
  });

/*  // Dev
  gulp.task('css-dev-'+slug, ['css-clean-'+slug, 'css-dev-concat-'+slug], function() {
    return runMinifyCSS( slug, src, dest, true );
  });
*/
};

function runCleanCSS( slug, src, dest ) {

  del( [dest+slug+'.css', dest+slug+'.min.css'],
    // {force:true}, // Allow deleting file above current working dir
    function(){
      log('[ CSS ] Removed previous bundle: '+dest+slug+'.css, '+dest+slug+'.min.css');
    });

};

function runSass( slug, src, dest, dev ) {

  dev = (typeof dev !== 'undefined') ? dev : false;

  var bundle = gulp.src( src+'scss/style.scss' )
    .pipe(plugins.plumber());

    if (dev) bundle = bundle.pipe(plugins.sourcemaps.init({}));

    bundle = bundle.pipe(plugins.sass({
      // style: 'expanded',
      // sourceComments: 'map',
      // sourceComments: (dev ? 'normal' : false), // with source map
      errLogToConsole: true
    }));

    if (dev) bundle = bundle.pipe( plugins.sourcemaps.write() )

    bundle = bundle.pipe(gulp.dest( src ))
      .on('end', function() {
        log('[ Sass ] Compiled with'+(dev?'':'out')+' source map: from '
          +src+'scss/style.scss to '+src);
      });

  return bundle;
}

function runConcatCSS( slug, src, dest, files, dev ) {

  dev = (typeof dev !== 'undefined') ? dev : false;
  var bundle = gulp.src( files );

  // --- Init source maps if dev mode ---
  if (dev) bundle = bundle.pipe( plugins.sourcemaps.init({loadMaps: true}) );

  bundle = bundle.pipe( plugins.concat( slug+'.css' ) );

  // --- Write source maps if dev mode ---
  if (dev) {
    bundle = bundle.pipe( plugins.sourcemaps.write() )
    bundle = bundle.pipe( plugins.rename( slug+'.min.css' ) ); // Don't minify, keep sourcemaps
  }

  bundle = bundle.pipe( gulp.dest( dest ) )
      .on('end', function(){ log('[ CSS ] Combined to '+dest+slug+'.css'); });

  return bundle;
};

function runMinifyCSS( slug, src, dest, dev ) {

  dev = (typeof dev !== 'undefined') ? dev : false;


  var opt = {
    keepSpecialComments : false, // Keep first
//      processImport : true, // include @import?
    relativeTo : dest
  };

  var bundle = gulp.src( dest+slug+'.css' );

  // --- Init source maps if dev mode ---
  // if (dev) bundle = bundle.pipe( plugins.sourcemaps.init({loadMaps: true}) );

  bundle = bundle.pipe( plugins.bytediff.start() );

  bundle = bundle.pipe( plugins.minifyCss( opt ))
    .pipe( plugins.rename( slug+'.min.css' ) );

  // --- Write source maps if dev mode ---
  // if (dev) bundle = bundle.pipe( plugins.sourcemaps.write() );

  bundle = bundle.pipe( plugins.bytediff.stop() )
    .pipe( gulp.dest( dest ) )
    .on('end', function(){ log('[ CSS ] Minified to '+dest+slug+'.min.css'); });

  return bundle;
};

