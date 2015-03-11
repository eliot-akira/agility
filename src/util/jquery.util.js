
/*---------------------------------------------
 *
 * jQuery utility functions
 *
 */

var $ = require('jquery');

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

