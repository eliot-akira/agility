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
