
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
