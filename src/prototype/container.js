
/*---------------------------------------------
 *
 * _container
 *
 * API and related auxiliary functions for storing child Agility objects.
 * Not all methods are exposed. See 'shortcuts' below for exposed methods.
 *
 */

var $ = require('jquery'),
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
