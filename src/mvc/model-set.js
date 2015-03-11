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
