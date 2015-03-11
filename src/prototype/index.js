
/*---------------------------------------------
 *
 * Construct default object prototype
 *
 */

var $ = require('jquery'),

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
