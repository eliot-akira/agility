
var gulp = require('gulp'),
  	config = require('../config'),
    plugins = require('gulp-load-plugins')(),
    browserify = require('browserify'),
    del = require('del'),
    log = require('../util/log'),
    // Browserify -> gulp stream
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer');



config.assets.forEach( function( asset ) {
  if ( typeof(asset.jsSource) !== "undefined") {
    setupTasks( asset.jsSlug, asset.jsSource, asset.jsDest, asset.jsFiles );
  }
});

function setupTasks( slug, src, dest, files ) {


  gulp.task('js-clean-'+slug, function() {
    return runCleanJS( slug, src, dest );
  });

  gulp.task('js-browserify-'+slug, ['js-clean-'+slug], function() {
    return runBrowserify( slug, src, dest );
  });

  gulp.task('js-min-'+slug, ['js-browserify-'+slug], function() {
    return runMinifyJS( slug, src, dest, files );
  });


  gulp.task('js-hint-'+slug, function() {
    return runJSHint( src );
  });

  gulp.task('js-dev-browserify-'+slug, ['js-hint-'+slug,'js-clean-'+slug], function() {
    return runBrowserify( slug, src, dest, true );
  });

  gulp.task('js-dev-'+slug, ['js-dev-browserify-'+slug, 'js-hint-'+slug], function() {
    return runMinifyJS( slug, src, dest, files, true );
  });

};


function runJSHint( src ) {

  return gulp.src( [src+'**/*.js',config.ignoreFiles,'!'+src+'lib/**/*'] )
    .pipe( plugins.jshint() )
    .pipe( plugins.jshint.reporter('default'));
};




function runBrowserify( slug, src, dest, dev ) {

  dev = typeof dev !== 'undefined' ? dev : false;

  var bundle = browserify({
        // cache: {}, packageCache: {}, 
        // fullPaths: true,
        entries: src+'index.js',
        debug: dev // Sourcemap
      }).bundle();

  if ( dev ) bundle = bundle.on('error', function(err){ // Prevent error from stopping watch
    console.log(err.message);
    this.emit("end"); // Keep stream going
  });

  // if (dev) bundle = bundle.pipe(mold.transformSourcesRelativeTo(__dirname)); // 

  bundle = bundle.pipe( source( slug+'.js' ) ).pipe( buffer() ); // Browserify -> gulp stream

  // --- Write source maps if dev mode ---
/*  if ( dev ) {
    bundle = bundle
      .pipe(plugins.sourcemaps.init({ loadMaps: true })) // 
      .pipe(plugins.sourcemaps.write()); // 
  }
*/
  bundle = bundle.pipe(gulp.dest( dest ));

  bundle = bundle.on('end', function(){
    log('[ JS ] Browserified with'+(dev?'':'out')+' sourcemap: from '
      +src+'index.js to '+dest+slug+'.js');
  });

  return bundle;
};

function runMinifyJS( slug, src, dest, files, dev ) {

  dev = (typeof dev !== 'undefined') ? dev : false;

  var bundle = gulp.src( files );

  // --- Init source maps if dev mode ---
  if (dev) bundle = bundle.pipe( plugins.sourcemaps.init({ loadMaps: true }) );


  bundle = bundle.pipe( plugins.concat('combined.js') )
    .pipe( plugins.rename( slug+'.min.js' ) )
    .pipe( plugins.bytediff.start() );


    if ( ! dev) bundle = bundle.pipe( plugins.uglify() ); // Only minify on production


  // --- Write source maps if dev mode ---
  if (dev) bundle = bundle.pipe( plugins.sourcemaps.write() );


  bundle = bundle
    .pipe( plugins.bytediff.stop() )
    .pipe( gulp.dest( dest ) )
    .on('end', function(){ log('[ JS ] Minified to '+dest+slug+'.min.js') });

  return bundle;
};

function runCleanJS( slug, src, dest ) {

  del( dest+slug+'.js', function(){
    log('[ JS ] Removed previous bundle: '+dest+slug+'.js');
  });
};



