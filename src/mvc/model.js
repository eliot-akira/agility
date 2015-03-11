
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

var $ = require('jquery'),
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
