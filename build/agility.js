(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
 
Agility.js - v0.3.0

Forked and extended from: Agility.js 0.1.3 by Artur B. Adib - http://agilityjs.com

The MIT License (MIT) Copyright (c) 2011 Artur B. Adib

Permission is hereby granted, free of charge, to any person obtaining a copy 
of this software and associated documentation files (the "Software"), to 
deal in the Software without restriction, including without limitation the 
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or 
sell copies of the Software, and to permit persons to whom the Software is 
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in 
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN 
THE SOFTWARE.

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

},{"./prototype/index":13,"./util/eventify.js":15,"./util/jquery.util":16,"./util/object-shim":17,"./util/timed":18,"./util/util":19}],2:[function(require,module,exports){

/*---------------------------------------------
 *
 * Controller
 *
 * Default controllers, i.e. event handlers. Event handlers that start
 * with '_' are of internal use only, and take precedence over any other
 * handler without that prefix. See: trigger()
 *
 */

module.exports = {

  // Triggered after self creation
  _create: function(event){
    this.view.stylize();
    this.view.bindings(); // Model-View bindings
    this.view.sync(); // syncs View with Model
  },

  // Triggered upon removing self
  _destroy: function(event){

    // @pull #95 Remove generated style upon destruction of objects
    // @extend Only if using style attribute

    if (this.view.style) {
      var objId = 'agility_' + this._id;
      $('head #'+objId, window.document).remove();
    }

    // destroy any appended agility objects
    this._container.empty();

    // destroy self in DOM, removing all events
    this.view.$().remove();
  },

  // Triggered after child obj is appended to container
  _append: function(event, obj, selector){
    this.view.$(selector).append(obj.view.$());
  },

  // Triggered after child obj is prepended to container
  _prepend: function(event, obj, selector){
    this.view.$(selector).prepend(obj.view.$());
  },

  // Triggered after child obj is inserted in the container
  _before: function(event, obj, selector){
    if (!selector) throw 'agility.js: _before needs a selector';
    this.view.$(selector).before(obj.view.$());
  },

  // Triggered after child obj is inserted in the container
  _after: function(event, obj, selector){
    if (!selector) throw 'agility.js: _after needs a selector';
    this.view.$(selector).after(obj.view.$());
  },

  // Triggered after a child obj is removed from container (or self-removed)
  _remove: function(event, id){        
  },

  // Triggered after model is changed
  '_change': function(event){
  }
  
};

},{}],3:[function(require,module,exports){
/*---------------------------------------------
 *
 * Get
 *
 */

module.exports = function get( arg ) {

  // Get whole model
  if (arg === undefined) {
    return this.model._data;
  }

  // Get attribute
  // @pull #91 Add support for nested models: parent.child
  if (typeof arg === 'string') {
    var paths = arg.split('.');
    var value = this.model._data[paths[0]];
    //check for nested objects
    if ($.isPlainObject(value)){
      for (var i = 1; i < paths.length; i++){
        if ($.isPlainObject(value) && value[paths[i]]){
          value = value[paths[i]];
        } else {
          value = value[paths.splice(i).join('.')];
        }
      }
    } else {
      //direct key access
      value = this.model._data[arg];
    }
    return value;
  }

  throw 'agility.js: unknown argument for getter';
};

},{}],4:[function(require,module,exports){
/*---------------------------------------------
 *
 * Set: set model attributes and trigger change events
 * 
 * @todo Performance considerations
 *
 */

module.exports = function set( arg, params, third ) {

  var self = this;
  var attr;
  var modified = []; // list of modified model attributes
  var previous = {}; // list of previous values

  // Set individual model property: model.set( prop, value )
  if ( typeof arg === 'string' ) {

    attr = arg;
    arg = {};
    if ( typeof params === 'object' )
      arg[attr] = $.extend({}, params);
    else
      arg[attr] = params;

    params = third || {};
  }

  if ( typeof arg === 'object' ) {

    var _clone = {};

    if (params && params.reset) {
      _clone = this.model._data; // hold on to data for change events
      this.model._data = $.extend({}, arg); // erases previous model attributes without pointing to object
    }
    else {

      // @extend Compare and only trigger change event for modified keys
      _clone = $.extend({}, this.model._data);

      // @pull #91 Add support for nested models
      // Iterate through properties and find nested declarations

      for (var prop in arg){
        if (prop.indexOf('.') > -1){
          var path = prop.split('.');
          var current_node = this.model._data[path[0]];
          if (!current_node){
            current_node = this.model._data[path[0]] = {};
          }
          var next_node;
          for (var i = 1; i < path.length - 1; i++){
            next_node = current_node[path[i]];
            if ($.isPlainObject(next_node)){
             current_node = next_node;
            } else {
             current_node[path[i]] = {};
             current_node = current_node[path[i]];
            }
          }
          var last_property = path[path.length - 1];
         if ($.isPlainObject(arg[key]) && $.isPlainObject(current_node[last_property])){
           //if we're assigning objects, extend rather than replace
           $.extend(current_node[last_property], arg[prop]);
          } else {
           current_node[last_property] = arg[prop];
          }
          
          modified.push(prop);
          previous[prop] = _clone[prop];
          delete _clone[ prop ]; // no need to fire change twice
          delete arg[prop];
        }
      }

      $.extend(this.model._data, arg); // default is extend
    }

    // Given object

    for (var key in arg) {
      // Check if changed
      if (this.model._data[key] !== _clone[key] ) {
        modified.push(key);
        previous[key] = _clone[ key ];
      }
      delete _clone[ key ]; // no need to fire change twice
    }

    // Previous object

    for (key in _clone) {
      // Check if changed
      if (this.model._data[key] !== _clone[key] ) {
        modified.push(key);
        previous[key] = _clone[ key ];
      }
    }

  } else {

    // Not an object
    throw "agility.js: unknown argument type in model.set()";
  }

  // Tigger change events

  if (params && params.silent===true) return this; // do not fire events

  // @extend Pass array of modified model keys

  // $().trigger parses the second parameter as separate arguments,
  // so we put it in an array

  this.trigger('change', [modified, previous]);

  $.each(modified, function(index, key){
    self.trigger('change:'+key, previous[key]);
  });

  return this; // for chainable calls

};

},{}],5:[function(require,module,exports){

/*---------------------------------------------
 *
 * Validate model properties based on object.required
 *
 */

var $util = require('../util/jquery.util');

module.exports = {

  /*---------------------------------------------
   *
   * model.invalid()
   * 
   * @return An array of invalid keys
   *
   */

  invalid : function() {

    var invalid = [];

    // Check each required key

    for (var key in this.required) {
      if ( ! this.model.isValidKey( key ) )
        invalid.push(key);
    }

    return invalid;
  },

  /*---------------------------------------------
   *
   * isValid
   *
   * isValid() Validate whole model
   * isValid( key ) Validate key
   *
   * @return boolean
   *
   */
  

  isValid : function( key ) {

    if (typeof key === 'undefined') {

      // Check the whole model
      return ( this.model.invalid().length === 0);

    } else return this.model.isValidKey( key );

  },

  isValidKey : function( key ) {

    if ( typeof this.required[key] === 'undefined' ) {
      return true;
    }

    var val = this.model.get( key ),
        requireType = this.required[ key ];

    if ( requireType === true ) {

      return ! $.isEmpty( val );

    } else if ( requireType === 'email' ) {

      return $.isEmail( val );

    } else {

      // Other types of required: boolean, checked, custom condition..?

    }

    return true; // Passed all requirements
  }

};


},{"../util/jquery.util":16}],6:[function(require,module,exports){
(function (global){

/*---------------------------------------------
 *
 * Model API
 *
 * get
 * set
 * reset
 * size
 * each
 * 
 * invalid
 * isValid
 * isValidKey
 *
 */

var $ = (typeof window !== "undefined" ? window.jQuery : typeof global !== "undefined" ? global.jQuery : null),
    util = require('../util/util'),
    modelValidate = require('./model-validate'),
    model = {

      get: require('./model-get'),
      set: require('./model-set'),

      // Resetter (to initial model upon object initialization)
      reset: function(){
        this.model.set(this.model._initData, {reset:true});
        return this; // for chainable calls
      },
      
      // Number of model properties
      size: function(){
        return util.size(this.model._data);
      },
      
      // Convenience function - loops over each model property
      each: function(fn){
        // Proxy this object
        $.each(this.model._data, $.proxy(fn,this) );
        return this; // for chainable calls
      }

    };

module.exports = $.extend( model, modelValidate );

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../util/util":19,"./model-get":3,"./model-set":4,"./model-validate":5}],7:[function(require,module,exports){

/*---------------------------------------------
 *
 * View bindings
 *
 *  Apply DOM <-> Model bindings, from elements with 'data-bind' attributes
 *
 */

module.exports = function bindings() {

  var self = this; // Reference to object
  var $rootNode = this.view.$().filter('[data-bind]');
  var $childNodes = this.view.$('[data-bind]');

  var createAttributePairClosure = function(bindData, node, i) {
    var attrPair = bindData.attr[i]; // capture the attribute pair in closure
    return function() {

      if ( attrPair.attr == 'html' ) {
        // Allow inserting HTML content
        node.html(self.model.get(attrPair.attrVar));
      } else {
        // Normal element attributes
        node.attr(attrPair.attr, self.model.get(attrPair.attrVar));
      }
    };
  };

  $rootNode.add( $childNodes ).each( function() {

    var $node = $(this);
    var bindData = _parseBindStr( $node.data('bind') );
    var required = $node.data('required'); // data-required

    var bindAttributesOneWay = function() {
      // 1-way attribute binding
      if (bindData.attr) {
        for (var i = 0; i < bindData.attr.length; i++) {
          self.bind('_change:'+bindData.attr[i].attrVar,
            createAttributePairClosure(bindData, $node, i));
        } // for (bindData.attr)
      } // if (bindData.attr)
    }; // bindAttributesOneWay()
    

    if ( bindData.key ) {

      /*---------------------------------------------
       *
       * Input types
       *
       */

      // <input type="checkbox">: 2-way binding

      if ($node.is('input:checkbox')) {
        // Model --> DOM
        self.bind('_change:'+bindData.key, function(){
          $node.prop("checked", self.model.get(bindData.key)); // this won't fire a DOM 'change' event, saving us from an infinite event loop (Model <--> DOM)
        });            
        // DOM --> Model
        $node.change(function(){
          var obj = {};
          obj[bindData.key] = $(this).prop("checked");
          self.model.set(obj); // not silent as user might be listening to change events
        });
      }
      
      // <select>: 2-way binding

      else if ($node.is('select')) {
        // Model --> DOM
        self.bind('_change:'+bindData.key, function(){
          var nodeName = $node.attr('name');
          var modelValue = self.model.get(bindData.key);
          $node.val(modelValue);
        });            
        // DOM --> Model
        $node.change(function(){
          var obj = {};
          obj[bindData.key] = $node.val();
          self.model.set(obj); // not silent as user might be listening to change events
        });
      }
      
      // <input type="radio">: 2-way binding

      else if ($node.is('input:radio')) {

        // Model --> DOM
        self.bind('_change:'+bindData.key, function(){
          var nodeName = $node.attr('name');
          var modelValue = self.model.get(bindData.key);

            // $node.siblings('input[name="'+nodeName+'"]').filter('[value="'+modelValue+'"]').prop("checked", true);

            // @pull #110 Binding for radio buttons
            // They're not always siblings, so start from $root
            self.view.$root.find('input[name="'+nodeName+'"]')
              .filter('[value="'+modelValue+'"]')
              .prop("checked", true);
              // this won't fire a DOM 'change' event, saving us from
              // an infinite event loop (Model <--> DOM)
        });            

        // DOM --> Model

        $node.change(function(){
          if (!$node.prop("checked")) return; // only handles check=true events
          var obj = {};
          obj[bindData.key] = $node.val();
          self.model.set(obj); // not silent as user might be listening to change events
        });
      }
      
      // <input type="search"> (model is updated after every keypress event)

      else if ($node.is('input[type="search"]')) {

        // Model --> DOM
        self.bind('_change:'+bindData.key, function(){
          // this won't fire a DOM 'change' event, saving us from
          // an infinite event loop (Model <--> DOM)
          $node.val(self.model.get(bindData.key));
        });

        // Model <-- DOM
        $node.keypress(function(){
          // Without timeout $node.val() misses the last entered character
          setTimeout(function(){
            var obj = {};
            obj[bindData.key] = $node.val();
            self.model.set(obj); // not silent as user might be listening to change events
          }, 50);
        });
      }

      // <input type="text">, <input>, and <textarea>: 2-way binding

      else if ($node.is('input:text, input[type!="search"], textarea')) {
        // Model --> DOM
        self.bind('_change:'+bindData.key, function(){
          // this won't fire a DOM 'change' event, saving us from
          // an infinite event loop (Model <--> DOM)
          $node.val(self.model.get(bindData.key));
        });            
        // Model <-- DOM
        $node.change(function(){
          var obj = {};
          obj[bindData.key] = $(this).val();
          self.model.set(obj); // not silent as user might be listening to change events
        });
      }
      
      // all other <tag>s: only Model -> DOM text

      else {
        self.bind('_change:'+bindData.key, function(){
          var key = self.model.get(bindData.key);
          if (key || key===0) {
            $node.text(self.model.get(bindData.key).toString());
          } else {
            $node.text('');
          }
        });
      }
    }

    // Model -> DOM attributes
    bindAttributesOneWay();

    // Custom bindings
    bindData.attr.forEach(function(pair, index){
      // Keyup
      if ( pair.attr === 'keyup' ) {
        $node.keyup(function(){
          // timeout to make sure to get last entered character
          setTimeout(function(){
            self.model.set( pair.attrVar, $node.val() ); // fires event
          }, 50);
        });        
        self.bind('_change:'+pair.attrVar, function(){
          $node.val( self.model.get( pair.attrVar ) );
        });

      // Visible
      } else if ( pair.attr === 'visible' ) {

      } 
    });

    // Store binding map for later reference
    self.$node[ bindData.key ] = $node; // Model property -> element
    self.key[ $node ] = bindData.key; // Element -> Model property

    if ( typeof required !== 'undefined' ) {
      self.required[ bindData.key ] = required;
    }

  }); // nodes.each()

  return this;

}; // bindings()



/*---------------------------------------------
 *
 * Parse data-bind string
 * 
 * Syntax:'[attribute][=] variable[, [attribute][=] variable ]...'
 * 
 * All pairs in the list are assumed to be attributes
 * If the variable is not an attribute, it must occur by itself
 *
 * Returns { key:'model key', attr: [ {attr : 'attribute', attrVar : 'variable' }... ] }
 *
 */

function _parseBindStr( str ) {
  var obj = {key:null, attr:[]},
      pairs = str.split(','),
      // regex = /([a-zA-Z0-9_\-]+)(?:[\s=]+([a-zA-Z0-9_\-]+))?/,
      // @pull #91 Add support for nested models: key.prop
      regex = /([a-zA-Z0-9_\-\.]+)(?:[\s=]+([a-zA-Z0-9_\-]+))?/,
      keyAssigned = false,
      matched;
  
  if (pairs.length > 0) {
    for (var i = 0; i < pairs.length; i++) {
      matched = pairs[i].match(regex);
      // [ "attribute variable", "attribute", "variable" ]
      // or [ "attribute=variable", "attribute", "variable" ]
      // or
      // [ "variable", "variable", undefined ]
      // in some IE it will be [ "variable", "variable", "" ]
      // or
      // null
      if (matched) {
        if (typeof(matched[2]) === "undefined" || matched[2] === "") {
          if (keyAssigned) {
            throw new Error("You may specify only one key (" + 
              keyAssigned + " has already been specified in data-bind=" + 
              str + ")");
          } else {
            keyAssigned = matched[1];
            obj.key = matched[1];
          }
        } else {
          obj.attr.push({attr: matched[1], attrVar: matched[2]});
        }
      } // if (matched)
    } // for (pairs.length)
  } // if (pairs.length > 0)
  
  return obj;
}

},{}],8:[function(require,module,exports){

/*---------------------------------------------
 *
 * View API
 *
 * view.format
 * view.style
 * view.$
 * render
 * bindings
 * sync
 * stylize
 * $bound
 *
 */

var viewBind = require('./view-bind'), // View bindings
    ROOT_SELECTOR = '&'; // Also in prototype/events.js

module.exports = {
    
  // Defaults
  format: '<div/>',
  style: '',
  
  // Shortcut to view.$root or view.$root.find(), depending on selector presence
  $: function(selector) {
    return (!selector || selector === ROOT_SELECTOR) ? this.view.$root : this.view.$root.find(selector);
  },
  

  // Render $root
  // Only function to access $root directly other than $()
  render: function(){

    // Without format there is no view
    if (this.view.format.length === 0) {
      throw "agility.js: empty format in view.render()";
    }                

    if ( this.view.$root instanceof jQuery && this._template ) {

      // $root is from DOM already

    } else if ( this.view.$root.size() === 0 ) {

      this.view.$root = $(this.view.format);

    } else {

      // don't overwrite $root as this would reset its presence in the DOM
      // and all events already bound

      this.view.$root.html( $(this.view.format).html() );
    }

    // Ensure we have a valid (non-empty) $root
    if ( !(this.view.$root instanceof jQuery) && this.view.$root.size() === 0 ) {
      throw 'agility.js: could not generate html from format';
    }

    this.$view = this.view.$root;
    this.$ = this.view.$;
    return this;
  }, // render



  // Apply DOM <-> Model bindings

  bindings: viewBind,

  

  // Triggers _change and _change:* events so that view is updated as per view.bindings()
  sync: function(){
    var self = this;
    // Trigger change events so that view is updated according to model
    this.model.each(function(key, val){
      self.trigger('_change:'+key);
    });
    if (this.model.size() > 0) {
      this.trigger('_change');
    }
    return this;
  },


  // Applies style dynamically
  stylize: function(){
    var objClass,
        regex = new RegExp(ROOT_SELECTOR, 'g');
    if (this.view.style.length === 0 || this.view.$().size() === 0) {
      return;
    }
    // Own style
    // Object gets own class name ".agility_123", and <head> gets a corresponding <style>
    if (this.view.hasOwnProperty('style')) {
      objClass = 'agility_' + this._id;
      var styleStr = this.view.style.replace(regex, '.'+objClass);
      // $('head', window.document).append('<style type="text/css">'+styleStr+'</style>');

      // @pull #95 Add ID so later we can remove generated style
      // upon destruction of objects
      $('head', window.document).append('<style id="'+ objClass +'" type="text/css">'+
        styleStr+'</style>');
      this.view.$().addClass(objClass);
    }
    // Inherited style
    // Object inherits CSS class name from first ancestor to have own view.style
    else {
      // Returns id of first ancestor to have 'own' view.style
      var ancestorWithStyle = function(object) {
        while (object !== null) {
          object = Object.getPrototypeOf(object);
          if (object.view.hasOwnProperty('style'))
            return object._id;
        }
        return undefined;
      }; // ancestorWithStyle

      var ancestorId = ancestorWithStyle(this);
      objClass = 'agility_' + ancestorId;
      this.view.$().addClass(objClass);
    }
    return this;
  },


  /*---------------------------------------------
   *
   * Extended
   *
   */

  // Return element(s) bound to a model property
  // Refer to map in main object

  $bound: function( key ) {

    return typeof this.$node[ key ] !== undefined ? this.$node[ key ] : false;

    /* Old way: from DOM
    var self = this;

    return this.view.$('[data-bind]').filter(function(){
      var bindData = self.view._parseBindStr( $(this).data('bind') );
      // What about multiple or nested bindings?
      return ( bindData.key == key );
    }); */
  }

};

},{"./view-bind":7}],9:[function(require,module,exports){
(function (global){

/*---------------------------------------------
 *
 * _container
 *
 * API and related auxiliary functions for storing child Agility objects.
 * Not all methods are exposed. See 'shortcuts' below for exposed methods.
 *
 */

var $ = (typeof window !== "undefined" ? window.jQuery : typeof global !== "undefined" ? global.jQuery : null),
    util = require('../util/util');

module.exports = {

  // Adds child object to container, appends/prepends/etc view, listens for child removal
  _insertObject: function(obj, selector, method){
    var self = this;

    if (!util.isAgility(obj)) {
      throw "agility.js: append argument is not an agility object";
    }

    this._container.children[obj._id] = obj; // children is *not* an array; this is for simpler lookups by global object id
    this.trigger(method, [obj, selector]);
    obj._parent = this;
    // ensures object is removed from container when destroyed:
    obj.bind('destroy', function(event, id){ 
      self._container.remove(id);
    });
    // Trigger event for child to listen to
    obj.trigger('parent:'+method);
    return this;
  },

  append: function(obj, selector) { 
      return this._container._insertObject.call(this, obj, selector, 'append'); 
  },

  prepend: function(obj, selector) { 
      return this._container._insertObject.call(this, obj, selector, 'prepend'); 
  },

  after: function(obj, selector) { 
      return this._container._insertObject.call(this, obj, selector, 'after'); 
  },

  before: function(obj, selector) { 
      return this._container._insertObject.call(this, obj, selector, 'before'); 
  },
  
  // Removes child object from container
  remove: function(id){
    delete this._container.children[id];
    this.trigger('remove', id);
    return this;
  },

  // Iterates over all child objects in container
  each: function(fn){
    $.each(this._container.children, fn);
    return this; // for chainable calls
  },

  // Removes all objects in container
  empty: function(){
    this.each(function(){
      this.destroy();
    });
    return this;
  },
  
  // Number of children
  size: function() {
    return util.size(this._container.children);
  }
  
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../util/util":19}],10:[function(require,module,exports){
(function (global){

/*---------------------------------------------
 *
 * _events API and auxiliary functions for handling events
 *
 */

var $ = (typeof window !== "undefined" ? window.jQuery : typeof global !== "undefined" ? global.jQuery : null),
    ROOT_SELECTOR = '&'; // Also in mvc/view.js

module.exports = {

  // Binds eventStr to fn. eventStr is parsed as per parseEventStr()
  bind: function(eventStr, fn){

    var eventObj = parseEventStr(eventStr);

    // DOM event 'event selector', e.g. 'click button'
    if (eventObj.selector) {

      // Keep click and submit localized
      var fnx = function(event) {
        fn(event);
        return false; // Prevent default & bubbling
        // or just default? if ( ! event.isDefaultPrevented() ) event.preventDefault();
      };

      // Manually override root selector, as jQuery selectors can't select self object
      if (eventObj.selector === ROOT_SELECTOR) {

        if ( eventObj.type === 'click' || eventObj.type === 'submit' ) {
          this.view.$().on(eventObj.type, fnx);
        } else {
          this.view.$().on(eventObj.type, fn);
        }

        // @extend Replace $().bind with $().on
        // this.view.$().bind(eventObj.type, fn);
      }
      else {

        if ( eventObj.type === 'click' || eventObj.type === 'submit' ) {
          this.view.$().on(eventObj.type, eventObj.selector, fnx);
        } else {
          this.view.$().on(eventObj.type, eventObj.selector, fn);
        }

        // @extend Replace $().delegate with $().on
        // this.view.$().delegate(eventObj.selector, eventObj.type, fn);
      }
    }
    // Custom event
    else {

      // @extend Replace $().bind with $().on
      $(this._events.data).on(eventObj.type, fn);
      // $(this._events.data).bind(eventObj.type, fn);
    }
    return this; // for chainable calls
  }, // bind

  // Alias to bind()
  on: function( eventStr, fn ) {
    return this._events.bind( eventStr, fn );
  },

  // Triggers eventStr. Syntax for eventStr is same as that for bind()
  trigger: function(eventStr, params){

    var eventObj = parseEventStr(eventStr);

    // DOM event 'event selector', e.g. 'click button'
    if (eventObj.selector) {
      // Manually override root selector, as jQuery selectors can't select self object
      if (eventObj.selector === ROOT_SELECTOR) {
        this.view.$().trigger(eventObj.type, params);
      }
      else {          
        this.view.$().find(eventObj.selector).trigger(eventObj.type, params);
      }
    }
    // Custom event
    else {
      $(this._events.data).trigger('_'+eventObj.type, params);
      // fire 'pre' hooks in reverse attachment order ( last first ) then put them back
      reverseEvents(this._events.data, 'pre:' + eventObj.type);
      $(this._events.data).trigger('pre:' + eventObj.type, params);
      reverseEvents(this._events.data, 'pre:' + eventObj.type);

      $(this._events.data).trigger(eventObj.type, params);

      // Trigger event for parent
      if (this.parent())
        this.parent().trigger((eventObj.type.match(/^child:/) ? '' : 'child:') + eventObj.type, params);
      $(this._events.data).trigger('post:' + eventObj.type, params);
    }
    return this; // for chainable calls
  } // trigger
  
};


/*---------------------------------------------
 *
 * Parse event string
 *
 * 'event'          : custom event
 * 'event selector' : DOM event using 'selector'
 *
 * Returns { type:'event' [, selector:'selector'] }
 * 
 */

function parseEventStr( eventStr ) {

  var eventObj = { type:eventStr }, 
      spacePos = eventStr.search(/\s/);

  // DOM event 'event selector', e.g. 'click button'
  if (spacePos > -1) {
    eventObj.type = eventStr.substr(0, spacePos);
    eventObj.selector = eventStr.substr(spacePos+1);
  } else if ( eventStr === 'click' || eventStr === 'submit' ) {
    // @extend Shortcut for 'click &' and 'submit &'
    eventObj.type = eventStr;
    eventObj.selector = ROOT_SELECTOR;
  }
  return eventObj;
}

// Reverses the order of events attached to an object

function reverseEvents(obj, eventType){

  var events = $(obj).data('events');

  if (events !== undefined && events[eventType] !== undefined){
    // can't reverse what's not there
    var reversedEvents = [];
    for (var e in events[eventType]){
      if (!events[eventType].hasOwnProperty(e)) continue;
      reversedEvents.unshift(events[eventType][e]);
    }
    events[eventType] = reversedEvents;
  }
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],11:[function(require,module,exports){
(function (global){

/*---------------------------------------------
 *
 * Extended shortcuts
 * 
 * replace, child, children, load
 *
 */

var $ = (typeof window !== "undefined" ? window.jQuery : typeof global !== "undefined" ? global.jQuery : null);

module.exports = {

  get : function( arg ) {
    return this.model.get( arg );
  },

  set : function( arg, params, third ) {
    return this.model.set( arg, params, third  );
  },

  invalid : function() {
    return this.model.invalid();
  },

  replace: function( obj, selector ){
    if ( typeof selector === 'string' ) {
      this.view.$(selector).html('');
    }
    this.empty()._container.append.apply(this, arguments);
    return this; // for chainable calls
  },

  // Return nth child object
  child: function(n){
    var i = 0;
    n = n || 0;

    for (var j in this._container.children) {
      if ( this._container.children.hasOwnProperty(j) ) {
        if ( i == n )
          return this._container.children[j];
        else if ( i > n )
          return false;

        i++; // Continue searching
      }
    }
    return false;
  },

  // Return all child objects
  children: function(){
    return this._container.children; // { id: child, .. }
  },

  // Replace children models - append if there's more, destroy if less
  load: function( proto, models, selector ) {

    var self = this,
        maxModels = models.length,
        maxChildren = this.size();

    $.each(models, function(index, model) {
      if ( self.child(index) ) {
        self.child(index).model.set( model );
      } else {
        self.append( $$( proto, model ), selector );
      }
    });

    if (maxChildren > maxModels) {
      for (var i = maxModels; i < maxChildren; i++) {
        // Child's index stays the same, since each one is destroyed
        self.child(maxModels).destroy();
      }
    }

    return this;
  }

};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],12:[function(require,module,exports){
(function (global){

/*---------------------------------------------
 *
 * Form helpers
 *
 */

var $ = (typeof window !== "undefined" ? window.jQuery : typeof global !== "undefined" ? global.jQuery : null);

module.exports = {

  form : {

    // Clear the form
    clear : function() {

      return this.$view.find(':input, textarea')
        .not(':button, :submit, :reset, :hidden').removeAttr('checked').removeAttr('selected')
        .not(':checkbox, :radio, select').val('');
    },

    // Validate model, instead of form in the DOM directly
    // @return An array of invalid model properties
    invalid : function() {

      return this.model.invalid();
    }
  }

};


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],13:[function(require,module,exports){
(function (global){

/*---------------------------------------------
 *
 * Construct default object prototype
 *
 */

var $ = (typeof window !== "undefined" ? window.jQuery : typeof global !== "undefined" ? global.jQuery : null),

    defaultPrototype = {

      _agility: true,
      _container: require('./container'),
      _events: require('./events'),

      $node: {}, // Map of model properties -> bound elements
      key: {}, // Map of elements -> bound model properties
      required: {}, // Map of required model properties and require types

      model: require('../mvc/model'),
      view: require('../mvc/view'),
      controller: require('../mvc/controller')
    },

    shortcuts = require('./shortcuts'),
    extend = require('./extend'),
    form = require('./form');

module.exports = $.extend(defaultPrototype, shortcuts, extend, form);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../mvc/controller":2,"../mvc/model":6,"../mvc/view":8,"./container":9,"./events":10,"./extend":11,"./form":12,"./shortcuts":14}],14:[function(require,module,exports){

/*---------------------------------------------
 *
 * Object shortcuts
 *
 */

module.exports = {

  destroy: function() {
    this.trigger('destroy', this._id); // parent must listen to 'remove' event and handle container removal!
    // can't return this as it might not exist anymore!
  },
  parent: function(){
    return this._parent;
  },
  
  //
  // _container shortcuts
  //
  append: function(){
    this._container.append.apply(this, arguments);
    return this; // for chainable calls
  },
  prepend: function(){
    this._container.prepend.apply(this, arguments);
    return this; // for chainable calls
  },
  after: function(){
    this._container.after.apply(this, arguments);
    return this; // for chainable calls
  },
  before: function(){
    this._container.before.apply(this, arguments);
    return this; // for chainable calls
  },
  remove: function(){
    this._container.remove.apply(this, arguments);
    return this; // for chainable calls
  },
  size: function(){
    return this._container.size.apply(this, arguments);
  },
  each: function(){
    return this._container.each.apply(this, arguments);
  },
  empty: function(){
    return this._container.empty.apply(this, arguments);
  },

  //
  // _events shortcuts
  //
  bind: function(){
    this._events.bind.apply(this, arguments);
    return this; // for chainable calls
  },
  on: function(){ // Alias
    this._events.bind.apply(this, arguments);
    return this; // for chainable calls
  },
  trigger: function(){
    this._events.trigger.apply(this, arguments);
    return this; // for chainable calls
  },

};

},{}],15:[function(require,module,exports){

/**
 * Handles managing all events for whatever you plug it into. Priorities for hooks are based on lowest to highest in
 * that, lowest priority hooks are fired first.
 */
var EventManager = function() {
  /**
   * Maintain a reference to the object scope so our public methods never get confusing.
   */
  var MethodsAvailable = {
    filter : filter,
    addFilter : addFilter,
    removeFilter : removeFilter,
    listFilters : listFilters,

    on : on,
    off : off,
    trigger : trigger,
    listActions : listActions,
  };

  /**
   * Contains the hooks that get registered with this EventManager. The array for storage utilizes a "flat"
   * object literal such that looking up the hook utilizes the native object literal hash.
   */
  var STORAGE = {
    actions : {},
    filters : {}
  };

  /**
   * Adds an action to the event manager.
   *
   * @param action Must contain namespace.identifier
   * @param callback Must be a valid callback function before this action is added
   * @param [priority=10] Used to control when the function is executed in relation to other callbacks bound to the same hook
   * @param [context] Supply a value to be used for this
   */
  function on( action, callback, priority, context ) {
    if( typeof action === 'string' && typeof callback === 'function' ) {
      priority = parseInt( ( priority || 10 ), 10 );
      _addHook( 'actions', action, callback, priority, context );
    }

    // console.log('Add:'+action,callback);
    return MethodsAvailable;
  }

  /**
   * Performs an action if it exists. You can pass as many arguments as you want to this function; the only rule is
   * that the first argument must always be the action.
   */
  function trigger( /* action, arg1, arg2, ... */ ) {
    var args = Array.prototype.slice.call( arguments );
    var action = args.shift();

    if( typeof action === 'string' ) {
      _runHook( 'actions', action, args );
    }
    return MethodsAvailable;
  }

  /**
   * Removes the specified action if it contains a namespace.identifier & exists.
   *
   * @param action The action to remove
   * @param [callback] Callback function to remove
   */
  function off( action, callback ) {
    if( typeof action === 'string' ) {
      _removeHook( 'actions', action, callback );
    }

    return MethodsAvailable;
  }


  function listActions() {
    return STORAGE.actions;
  }
  function listFilters() {
    return STORAGE.filters;
  }


  /**
   * Adds a filter to the event manager.
   *
   * @param filter Must contain namespace.identifier
   * @param callback Must be a valid callback function before this action is added
   * @param [priority=10] Used to control when the function is executed in relation to other callbacks bound to the same hook
   * @param [context] Supply a value to be used for this
   */
  function addFilter( filter, callback, priority, context ) {
    if( typeof filter === 'string' && typeof callback === 'function' ) {
      priority = parseInt( ( priority || 10 ), 10 );
      _addHook( 'filters', filter, callback, priority );
    }

    return MethodsAvailable;
  }

  /**
   * Performs a filter if it exists. You should only ever pass 1 argument to be filtered. The only rule is that
   * the first argument must always be the filter.
   */
  function filter( /* filter, filtered arg, arg2, ... */ ) {
    var args = Array.prototype.slice.call( arguments );
    var filterName = args.shift();

    if( typeof filterName === 'string' ) {
      return _runHook( 'filters', filterName, args );
    }

    return MethodsAvailable;
  }

  /**
   * Removes the specified filter if it contains a namespace.identifier & exists.
   *
   * @param filter The action to remove
   * @param [callback] Callback function to remove
   */
  function removeFilter( filter, callback ) {
    if( typeof filter === 'string') {
      _removeHook( 'filters', filter, callback );
    }

    return MethodsAvailable;
  }

  /**
   * Removes the specified hook by resetting the value of it.
   *
   * @param type Type of hook, either 'actions' or 'filters'
   * @param hook The hook (namespace.identifier) to remove
   * @private
   */
  function _removeHook( type, hook, callback, context ) {
    if ( !STORAGE[ type ][ hook ] ) {
      return;
    }
    if ( !callback ) {
      STORAGE[ type ][ hook ] = [];
    } else {
      var handlers = STORAGE[ type ][ hook ];
      var i;
      if ( !context ) {
        for ( i = handlers.length; i--; ) {
          if ( handlers[i].callback === callback ) {
            handlers.splice( i, 1 );
          }
        }
      }
      else {
        for ( i = handlers.length; i--; ) {
          var handler = handlers[i];
          if ( handler.callback === callback && handler.context === context) {
            handlers.splice( i, 1 );
          }
        }
      }
    }
  }

  /**
   * Adds the hook to the appropriate storage container
   *
   * @param type 'actions' or 'filters'
   * @param hook The hook (namespace.identifier) to add to our event manager
   * @param callback The function that will be called when the hook is executed.
   * @param priority The priority of this hook. Must be an integer.
   * @param [context] A value to be used for this
   * @private
   */
  function _addHook( type, hook, callback, priority, context ) {
    var hookObject = {
      callback : callback,
      priority : priority,
      context : context
    };

    // Utilize 'prop itself' : http://jsperf.com/hasownproperty-vs-in-vs-undefined/19
    var hooks = STORAGE[ type ][ hook ];
    if( hooks ) {
      hooks.push( hookObject );
      hooks = _hookInsertSort( hooks );
    }
    else {
      hooks = [ hookObject ];
    }

    STORAGE[ type ][ hook ] = hooks;
  }

  /**
   * Use an insert sort for keeping our hooks organized based on priority. This function is ridiculously faster
   * than bubble sort, etc: http://jsperf.com/javascript-sort
   *
   * @param hooks The custom array containing all of the appropriate hooks to perform an insert sort on.
   * @private
   */
  function _hookInsertSort( hooks ) {
    var tmpHook, j, prevHook;
    for( var i = 1, len = hooks.length; i < len; i++ ) {
      tmpHook = hooks[ i ];
      j = i;
      while( ( prevHook = hooks[ j - 1 ] ) &&  prevHook.priority > tmpHook.priority ) {
        hooks[ j ] = hooks[ j - 1 ];
        --j;
      }
      hooks[ j ] = tmpHook;
    }

    return hooks;
  }

  /**
   * Runs the specified hook. If it is an action, the value is not modified but if it is a filter, it is.
   *
   * @param type 'actions' or 'filters'
   * @param hook The hook ( namespace.identifier ) to be ran.
   * @param args Arguments to pass to the action/filter. If it's a filter, args is actually a single parameter.
   * @private
   */
  function _runHook( type, hook, args ) {

    // Allow glob pattern * in hook - how?

    var handlers = STORAGE[ type ][ hook ];

    
    if ( !handlers ) {
      return (type === 'filters') ? args[0] : false;
    }

    var i = 0, len = handlers.length;
    if ( type === 'filters' ) {
      for ( ; i < len; i++ ) {
        args[ 0 ] = handlers[ i ].callback.apply( handlers[ i ].context, args );
      }
    } else {
      for ( ; i < len; i++ ) {
        handlers[ i ].callback.apply( handlers[ i ].context, args );
      }
    }

    return ( type === 'filters' ) ? args[ 0 ] : true;
  }

  // return all of the publicly available methods
  return MethodsAvailable;

};

// Export constructor

module.exports = function eventify( obj ){

  if ( typeof obj === 'undefined' ) {
    obj = {};
  }
  return $.extend(obj, new EventManager() );
};

},{}],16:[function(require,module,exports){
(function (global){

/*---------------------------------------------
 *
 * jQuery utility functions
 *
 */

var $ = (typeof window !== "undefined" ? window.jQuery : typeof global !== "undefined" ? global.jQuery : null);

// Get element including wrapping tag

$.fn.outerHTML = function(s) {
  if (s) {
    return this.before(s).remove();
  } else {
    var doc = this[0] ? this[0].ownerDocument : document;
    return jQuery('<div>', doc).append(this.eq(0).clone()).html();
  }
};



// Generic isEmpty

$.isEmpty = function( mixed_var ) {

  // Empty: null, undefined, '', [], {}
  // Not empty: 0, true, false
  // What about jQuery object?

  var undef, key, i, len;
  var emptyValues = [undef, null, ''];

  for (i = 0, len = emptyValues.length; i < len; i++) {
    if (mixed_var === emptyValues[i]) {
      return true;
    }
  }

  if (typeof mixed_var === 'object') {
    for (key in mixed_var) {
      // Inherited properties count?
      // if (mixed_var.hasOwnProperty(key)) {
        return false;
      // }
    }
    return true;
  }

  return false;
};

/* Another version

window.jQuery.isEmpty = function( data ) {

  if(typeof(data) == 'number' || typeof(data) == 'boolean') {
    return false;
  }
  if(typeof(data) == 'undefined' || data === null) {
    return true;
  }
  if(typeof(data.length) != 'undefined') {
    return data.length === 0;
  }

  var count = 0;
  for(var i in data) {
    if(data.hasOwnProperty(i)) {
      count ++;
    }
  }
  return count === 0;
};
*/


// Validate e-mail

$.isEmail = function( email ) {

  if ( $.isEmpty( email ) ) return false;

  var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
  return regex.test(email);
};


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],17:[function(require,module,exports){

/*---------------------------------------------
 *
 * Shim for: Object.create and Object.getPrototypeOf
 *
 */


/*jslint proto: true */

// Modified from Douglas Crockford's Object.create()
// The condition below ensures we override other manual implementations
if (!Object.create || Object.create.toString().search(/native code/i)<0) {
  Object.create = function(obj){
    var Aux = function(){};
    $.extend(Aux.prototype, obj); // simply setting Aux.prototype = obj somehow messes with constructor, so getPrototypeOf wouldn't work in IE
    return new Aux();
  };
}

// Modified from John Resig's Object.getPrototypeOf()
// The condition below ensures we override other manual implementations
if (!Object.getPrototypeOf || Object.getPrototypeOf.toString().search(/native code/i)<0) {
  if ( typeof "test".__proto__ === "object" ) {
    Object.getPrototypeOf = function(object){
      return object.__proto__;
    };
  } else {
    Object.getPrototypeOf = function(object){
      // May break if the constructor has been tampered with
      return object.constructor.prototype;
    };
  }
}

},{}],18:[function(require,module,exports){
(function (global){
/*---------------------------------------------
 *
 * Timed functions
 *
 */

var $ = (typeof window !== "undefined" ? window.jQuery : typeof global !== "undefined" ? global.jQuery : null);

var timers = {},
    defaultInterval = 10000;

$.fn.timedClass = function( className, duration ) {

  var $self = $(this);

  return $(this).timedFn(
    function(){ $self.addClass( className ); },
    function(){ $self.removeClass( className ); },
    duration || defaultInterval
  );
};

$.fn.timedText = function( txt, duration ) {

  var $self = $(this);

  return $(this).timedFn(
    function(){ $self.text( txt ); },
    function(){ $self.text(''); },
    duration || defaultInterval
  );
};

$.fn.timedFn = function( id, start, end, duration ) {

  duration = duration || defaultInterval;

  // ID skipped
  if ( typeof id === 'function' ) {

    duration = end || duration;
    end = start;
    start = id;

    new Timer(function(){
      end();
    }, duration );

    return start();

  // If timer ID is set and one is already going, add to the duration
  } else if ( typeof timers[id] !== 'undefined' && ! timers[id].finished ) {

    timers[id].add( duration );

  } else {

    timers[id] = new Timer(function(){
      end();
    }, duration );

    return start();
  }
};


function Timer(callback, time) {
    this.setTimeout(callback, time);
}

Timer.prototype.setTimeout = function(callback, time) {

    var self = this;

    this.finished = false;
    this.callback = callback;
    this.time = time;

    if(this.timer) {
        clearTimeout(this.timer);
    }
    this.timer = setTimeout(function() {
      self.finished = true;
      self.callback();
    }, time);
    this.start = Date.now();
};

Timer.prototype.add = function(time) {
   if(!this.finished) {
       // add time to time left
       time = this.time - (Date.now() - this.start) + time;
       this.setTimeout(this.callback, time);
   }
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],19:[function(require,module,exports){
(function (global){

/*---------------------------------------------
 *
 * util.*
 *
 * isAgility
 * proxyAll
 * reverseEvents
 * size
 * extendController
 * 
 */

/*jslint loopfunc: true */

var util = {},
    $ = (typeof window !== "undefined" ? window.jQuery : typeof global !== "undefined" ? global.jQuery : null);

// Checks if provided obj is an agility object
util.isAgility = function(obj){
 return obj._agility === true;
};

// Scans object for functions (depth=2) and proxies their 'this' to dest.
// * To ensure it works with previously proxied objects, we save the original function as 
//   a '._preProxy' method and when available always use that as the proxy source.
// * To skip a given method, create a sub-method called '_noProxy'.
util.proxyAll = function(obj, dest){
  if (!obj || !dest) {
    throw "agility.js: util.proxyAll needs two arguments";
  }
  for (var attr1 in obj) {
    var proxied = obj[attr1];
    // Proxy root methods
    if (typeof obj[attr1] === 'function' ) {

      proxied = obj[attr1]._noProxy ? obj[attr1] : $.proxy(obj[attr1]._preProxy || obj[attr1], dest);
      proxied._preProxy = obj[attr1]._noProxy ? undefined : (obj[attr1]._preProxy || obj[attr1]); // save original
      obj[attr1] = proxied;

    }
    // Proxy sub-methods (model.*, view.*, etc) -- except for jQuery object
    else if (typeof obj[attr1] === 'object' && !(obj[attr1] instanceof jQuery) ) {
      for (var attr2 in obj[attr1]) {
        var proxied2 = obj[attr1][attr2];
        if (typeof obj[attr1][attr2] === 'function') {
          proxied2 = obj[attr1][attr2]._noProxy ? obj[attr1][attr2] : $.proxy(obj[attr1][attr2]._preProxy || obj[attr1][attr2], dest);
          proxied2._preProxy = obj[attr1][attr2]._noProxy ? undefined : (obj[attr1][attr2]._preProxy || obj[attr1][attr2]); // save original
          proxied[attr2] = proxied2;
        }
      } // for attr2
      obj[attr1] = proxied;
    } // if not func
  } // for attr1
}; // proxyAll


// Determines # of attributes of given object (prototype inclusive)
util.size = function(obj){
  var size = 0, key;
  for (key in obj) {
    size++;
  }
  return size;
};

// Find controllers to be extended (with syntax '~'), redefine those to encompass previously defined controllers
// Example:
//   var a = $$({}, '<button>A</button>', {'click &': function(){ alert('A'); }});
//   var b = $$(a, {}, '<button>B</button>', {'~click &': function(){ alert('B'); }});
// Clicking on button B will alert both 'A' and 'B'.
util.extendController = function(object) {
  for (var controllerName in object.controller) {

    // new scope as we need one new function handler per controller
    (function(){
      var matches, extend, eventName,
          previousHandler, currentHandler, newHandler;

      if (typeof object.controller[controllerName] === 'function') {
        matches = controllerName.match(/^(\~)*(.+)/); // 'click button', '~click button', '_create', etc
        extend = matches[1];
        eventName = matches[2];
      
        if (!extend) return; // nothing to do

        // Redefine controller:
        // '~click button' ---> 'click button' = previousHandler + currentHandler
        previousHandler = object.controller[eventName] ? (object.controller[eventName]._preProxy || object.controller[eventName]) : undefined;
        currentHandler = object.controller[controllerName];
        newHandler = function() {
          if (previousHandler) previousHandler.apply(this, arguments);
          if (currentHandler) currentHandler.apply(this, arguments);
        };

        object.controller[eventName] = newHandler;
        delete object.controller[controllerName]; // delete '~click button'
      } // if function
    })();
  } // for controllerName
};

module.exports = util;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1]);
