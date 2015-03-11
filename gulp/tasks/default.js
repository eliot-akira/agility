	
var gulp = require('gulp'),
    config = require('../config'),
    log = require('../util/log'),
    tasks = [],
    cssTasks = [], cssDevTasks = [],
    jsTasks = [], jsDevTasks = [],
    imgTasks = [],
    task = '';

config.assets.forEach( function( asset ) {

  if ( typeof(asset.cssSource) !== "undefined") {
    task = 'css-min-'+asset.cssSlug;
    tasks.push(task);
    cssTasks.push(task);
    cssDevTasks.push('css-dev-'+asset.cssSlug);
  }

  if ( typeof(asset.jsSource) !== "undefined") {
    task = 'js-min-'+asset.jsSlug;
    tasks.push(task);
    jsTasks.push(task);
    jsDevTasks.push('js-dev-'+asset.jsSlug);
  }


  if ( typeof(asset.imageSource) !== "undefined") {
    task = 'image-min-'+asset.slug;
    tasks.push(task);
    imgTasks.push(task);
  }

});

if (cssTasks.length > 0) gulp.task('css', cssTasks);
if (cssDevTasks.length > 0) gulp.task('css-dev', cssDevTasks);

if (jsTasks.length > 0) gulp.task('js', jsTasks);
if (jsDevTasks.length > 0) gulp.task('js-dev', jsDevTasks);

if (imgTasks.length > 0) gulp.task('img', imgTasks);

// Default tasks
gulp.task('default', tasks);
