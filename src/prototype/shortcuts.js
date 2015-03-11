
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
