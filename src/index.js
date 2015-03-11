/**
 * 
 * Agility.js - v0.3.0
 * 
 * Forked and extended from: Agility.js 0.1.3 by Artur B. Adib - http://agilityjs.com
 * 
 * Merged pull requests
 * - Support nested model properties
 * - Efficient handling of style
 * 
 * Extended features
 * - CommonJS-style modules
 * - Only render changed model properties
 * - Form helpers
 * - Event manager
 * 
 */

/*jslint loopfunc: true */

(function(window, undefined){

  if (!window.jQuery) {
    throw "agility.js: jQuery not found";
  }
  
  // Local references
  var document = window.document,
      location = window.location,
      $        = jQuery,

      agility, // Main agility object builder

      util             = require('./util/util'),         // Internal utility functions
      $util            = require('./util/jquery.util'),  // jQuery utility functions
      shim             = require('./util/object-shim'),  // Object.create and getPrototypeOf
      timed            = require('./util/timed'),        // Timed functions
      defaultPrototype = require('./prototype/index'),   // Default object prototype
      eventify         = require('./util/eventify.js'),  // Event manager factory
      idCounter        = 0; // Global object counter


  /*---------------------------------------------
   *
   * Main object constructor
   *
   */
  
  agility = function() {
    
    // Real array of arguments
    var args = Array.prototype.slice.call(arguments, 0),
    
    // Object to be returned by builder
    object = {},

    $root, // Used when template is from DOM

    prototype = defaultPrototype;


    /*---------------------------------------------
     *
     * Create object from prototype
     *
     */

    // If first arg is object, use it as prototype
    if (typeof args[0] === "object" && util.isAgility(args[0])) {

      prototype = args[0];    
      args.shift(); // remaining args now work as though object wasn't specified

    }

    // Build object from prototype as well as the individual prototype parts
    // This enables differential inheritance at the sub-object level, e.g. object.view.format
    object = Object.create(prototype);
    object.model = Object.create(prototype.model);
    object.view = Object.create(prototype.view);
    object.controller = Object.create(prototype.controller);
    object._container = Object.create(prototype._container);
    object._events = Object.create(prototype._events);
    object.form = Object.create(prototype.form);


    // Instance properties, i.e. not inherited
    object._id = idCounter++;
    object._parent = null;
    object._events.data = {}; // event bindings will happen below
    object._container.children = {};
    
    if ( prototype.view.$root instanceof jQuery && prototype._template ) {
      // prototype $root exists: clone its content
      object.view.$root = $( prototype.view.$root.outerHTML()  );
    } else {
      object.view.$root = $(); // empty jQuery object
    }


    // Clone own properties
    // i.e. properties that are inherited by direct copy instead of by prototype chain
    // This prevents children from altering parents models
    object.model._data = prototype.model._data ? $.extend(true, {}, prototype.model._data) : {};
    object._data = prototype._data ? $.extend(true, {}, prototype._data) : {};


    /*---------------------------------------------
     *
     * Extend model, view, controller based on given arguments
     *
     */

    // Just the default prototype {}
    if (args.length === 0) {
    }

    // ( view.format [,{ method:function, ... }] )
    else if ( typeof args[0] === 'string' ) {

      // Get template from '#id'
      if ( args[0][0] === '#' ) {

        $root = $(args[0]);

        // Template from script tag
        if ( $root.prop('tagName').toLowerCase() === 'script' ) {

          object.view.format = $root.html();

        // Template from existing DOM
        } else {

          // Include container itself
          object.view.format = $root.outerHTML();
          // Assign root to existing DOM element
          object.view.$root = $root;
          
          object._template = true;
        }

      }
      // or '<template>' string
      else object.view.format = args[0];

      // Controller from object
      if ( args.length > 1 && typeof args[1] === 'object') {
        $.extend(object.controller, args[1]);
        util.extendController(object);
      }

    } // single view arg

    // Prototype differential from single {model,view,controller} object
    else if (args.length === 1 && typeof args[0] === 'object' && (args[0].model || args[0].view) ) {

      for (var prop in args[0]) {

        if (prop === 'model') {

          $.extend(object.model._data, args[0].model);

        } else if (prop === 'view') {

          if (typeof args[0].view === 'string') {

            // Get template from '#id'
            if ( args[0].view[0] === '#' ) {

              $root = $(args[0].view);

              object.view.format = $root.html();

              // Template from script tag
              if ( $root.prop('tagName').toLowerCase() === 'script' ) {

                object.view.format = $root.html();

              // Template from existing DOM
              } else {

                // Include container itself
                object.view.format = $root.outerHTML();
                // Assign root to existing DOM element
                object.view.$root = $root;
                object._template = true;
              }

            }
            // or '<template>' string
            else object.view.format = args[0].view;

          } else {

            $.extend(object.view, args[0].view); // view:{format:{},style:{}}
          }

        }
        else if ( prop === 'controller' || prop === 'events' ) {
          $.extend(object.controller, args[0][prop]);
          util.extendController(object);
        }

        // User-defined methods
        else {
          object[prop] = args[0][prop];
        }
      }
    } // single {model, view, controller} arg

    // Prototype differential from separate {model}, {view}, {controller} arguments
    else {
      
      // Model object
      if (typeof args[0] === 'object') {
        $.extend(object.model._data, args[0]);
      }
      else if (args[0]) {
        throw "agility.js: unknown argument type (model)";
      }

      // View format from shorthand string (..., '<div>whatever</div>', ...)
      if (typeof args[1] === 'string') {

        // @extend Get template from ID
        if ( args[1][0] === '#' ) {

          // object.view.format = $(args[1]).html();

          $root = $(args[1]);

          // Template from script tag
          if ( $root.prop('tagName').toLowerCase() === 'script' ) {

            object.view.format = $root.html();

          // Template from existing DOM
          } else {

            // Include container itself
            object.view.format = $root.outerHTML();
            // Assign root to existing DOM element
            object.view.$root = $root;
            object._template = true;
          }
        }
        else
          object.view.format = args[1]; // extend view with .format
      }  
      // View from object (..., {format:'<div>whatever</div>'}, ...)
      else if (typeof args[1] === 'object') {
        $.extend(object.view, args[1]);
      }
      else if (args[1]) {
        throw "agility.js: unknown argument type (view)";
      }
      
      // View style from shorthand string (..., ..., 'p {color:red}', ...)

      if (typeof args[2] === 'string') {
        object.view.style = args[2];
        args.splice(2, 1); // so that controller code below works
      }

      // Controller from object (..., ..., {method:function(){}})
      if (typeof args[2] === 'object') {
        $.extend(object.controller, args[2]);
        util.extendController(object);
      }
      else if (args[2]) {
        throw "agility.js: unknown argument type (controller)";
      }
      
    } // separate ({model}, {view}, {controller}) args


    /*---------------------------------------------
     *
     * Launch sequence: Bindings, initializations, etc
     *
     */
    
    // Save model's initial state (so it can be .reset() later)
    object.model._initData = $.extend({}, object.model._data);

    // object.* will have their 'this' === object. This should come before call to object.* below.
    util.proxyAll(object, object);

  
    // Initialize $root, needed for DOM events binding below
    object.view.render();
  

    // Bind all controllers to their events

    var bindEvent = function(ev, handler){
      if (typeof handler === 'function') {
        object.bind(ev, handler);
      }
    };

    for (var eventStr in object.controller) {
      var events = eventStr.split(';');
      var handler = object.controller[eventStr];
      $.each(events, function(i, ev){
        ev = $.trim(ev);
        bindEvent(ev, handler);
      });
    }

    // Auto-triggers create event
    object.trigger('create');    
    
    return object;
    
  }; // agility



  /*---------------------------------------------
   *
   * Global properties
   *
   */

  
  // $$.document is a special Agility object, whose view is attached to <body>
  // This object is the main entry point for all DOM operations
  agility.document = agility({
    _document : true,
    view: {
      $: function(selector){ return selector ? $(selector, 'body') : $('body'); }
    },
    controller: {
      // Override default controller (don't render, don't stylize, etc)
      _create: function(){}
    }
  });

  // Shortcut to prototype for plugins
  agility.fn = defaultPrototype;

  // Namespace to declare reusable Agility objects
  // Use: app.append( $$.module.something ) or $$( $$.module.something, {m,v,c} )
  agility.module = {};

  // isAgility test
  agility.isAgility = function(obj) {
    if (typeof obj !== 'object') return false;
    return util.isAgility(obj);
  };

  agility.eventify = eventify; // Event manager factory



  /*---------------------------------------------
   *
   * Export it
   *
   */

  // AMD, CommonJS, then global
  if (typeof define === 'function' && define.amd) {
    // @todo Is this correct?
    define([], function(){
        return agility;
    });
  } else if (typeof exports === 'object') {
      module.exports = agility;
  } else {
      window.$$ = agility;
  }

})(window);
