
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
