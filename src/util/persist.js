
/* @unused */

//////////////////////////////////////////////////////////////////////////
//
//  Bundled plugin: persist, agility.adapter.restful
//

// Main initializer
agility.fn.persist = function(adapter, params){
  var id = 'id'; // name of id attribute
      
  this._data.persist = $.extend({adapter:adapter}, params);
  this._data.persist.openRequests = 0;
  if (params && params.id) {
    id = params.id;
  }

  // Creates persist methods
  
  // .save()
  // Creates new model or update existing one, depending on whether model has 'id' property
  this.save = function(){
    var self = this;
    if (this._data.persist.openRequests === 0) {
      this.trigger('persist:start');
    }
    this._data.persist.openRequests++;
    this._data.persist.adapter.call(this, {
      type: this.model.get(id) ? 'PUT' : 'POST', // update vs. create
      id: this.model.get(id),
      data: this.model.get(),
      complete: function(){
        self._data.persist.openRequests--;
        if (self._data.persist.openRequests === 0) {
          self.trigger('persist:stop');
        }
      },
      success: function(data, textStatus, jqXHR){
        if (data[id]) {
          // id in body
          self.model.set({id:data[id]}, {silent:true});
        }
        else if (jqXHR.getResponseHeader('Location')) {
          // parse id from Location
          self.model.set({ id: jqXHR.getResponseHeader('Location').match(/\/([0-9]+)$/)[1] }, {silent:true});
        }
        self.trigger('persist:save:success');
      },
      error: function(){
        self.trigger('persist:error');
        self.trigger('persist:save:error');
      }
    });
    
    return this; // for chainable calls
  }; // save()

  // .load()
  // Loads model with given id
  this.load = function(){
    var self = this;
    if (this.model.get(id) === undefined) throw 'agility.js: load() needs model id';
  
    if (this._data.persist.openRequests === 0) {
      this.trigger('persist:start');
    }
    this._data.persist.openRequests++;
    this._data.persist.adapter.call(this, {
      type: 'GET',
      id: this.model.get(id),
      complete: function(){
        self._data.persist.openRequests--;
        if (self._data.persist.openRequests === 0) {
          self.trigger('persist:stop');
        }
      },
      success: function(data, textStatus, jqXHR){
        self.model.set(data);
        self.trigger('persist:load:success');
      },      
      error: function(){
        self.trigger('persist:error');
        self.trigger('persist:load:error');
      }
    });      

    return this; // for chainable calls
  }; // load()

  // .erase()
  // Erases model with given id
  this.erase = function(){
    var self = this;
    if (this.model.get(id) === undefined) throw 'agility.js: erase() needs model id';
  
    if (this._data.persist.openRequests === 0) {
      this.trigger('persist:start');
    }
    this._data.persist.openRequests++;
    this._data.persist.adapter.call(this, {
      type: 'DELETE',
      id: this.model.get(id),
      complete: function(){
        self._data.persist.openRequests--;
        if (self._data.persist.openRequests === 0) {
          self.trigger('persist:stop');
        }
      },
      success: function(data, textStatus, jqXHR){
        self.destroy();
        self.trigger('persist:erase:success');
      },      
      error: function(){
        self.trigger('persist:error');
        self.trigger('persist:erase:error');
      }
    });            

    return this; // for chainable calls
  }; // erase()

  // .gather()
  // Loads collection and appends/prepends (depending on method) at selector. All persistence data including adapter comes from proto, not self
  this.gather = function(proto, method, selectorOrQuery, query){      
    var selector, self = this;
    if (!proto) throw "agility.js plugin persist: gather() needs object prototype";
    if (!proto._data.persist) throw "agility.js plugin persist: prototype doesn't seem to contain persist() data";

    // Determines arguments
    if (query) {
      selector = selectorOrQuery;        
    }
    else {
      if (typeof selectorOrQuery === 'string') {
        selector = selectorOrQuery;
      }
      else {
        selector = undefined;
        query = selectorOrQuery;
      }
    }

    if (this._data.persist.openRequests === 0) {
      this.trigger('persist:start');
    }
    this._data.persist.openRequests++;
    proto._data.persist.adapter.call(proto, {
      type: 'GET',
      data: query,
      complete: function(){
        self._data.persist.openRequests--;
        if (self._data.persist.openRequests === 0) {
          self.trigger('persist:stop');
        }
      },
      success: function(data){
        $.each(data, function(index, entry){
          var obj = $$(proto, entry);
          if (typeof method === 'string') {
            self[method](obj, selector);
          }
        });
        self.trigger('persist:gather:success', {data:data});
      },
      error: function(){
        self.trigger('persist:error');
        self.trigger('persist:gather:error');
      }
    });
  
    return this; // for chainable calls
  }; // gather()

  return this; // for chainable calls
}; // fn.persist()

// Persistence adapters
// These are functions. Required parameters:
//    {type: 'GET' || 'POST' || 'PUT' || 'DELETE'}
agility.adapter = {};

// RESTful JSON adapter using jQuery's ajax()
agility.adapter.restful = function(_params){
  var params = $.extend({
    dataType: 'json',
    url: (this._data.persist.baseUrl || 'api/') + this._data.persist.collection + (_params.id ? '/'+_params.id : '')
  }, _params);
  $.ajax(params);
};
