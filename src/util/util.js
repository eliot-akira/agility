
/*---------------------------------------------
 *
 * util.*
 *
 * isAgility
 * proxyAll
 * reverseEvents
 * size
 * extendController
 * 
 */

/*jslint loopfunc: true */

var util = {},
    $ = require('jquery');

// Checks if provided obj is an agility object
util.isAgility = function(obj){
 return obj._agility === true;
};

// Scans object for functions (depth=2) and proxies their 'this' to dest.
// * To ensure it works with previously proxied objects, we save the original function as 
//   a '._preProxy' method and when available always use that as the proxy source.
// * To skip a given method, create a sub-method called '_noProxy'.
util.proxyAll = function(obj, dest){
  if (!obj || !dest) {
    throw "agility.js: util.proxyAll needs two arguments";
  }
  for (var attr1 in obj) {
    var proxied = obj[attr1];
    // Proxy root methods
    if (typeof obj[attr1] === 'function' ) {

      proxied = obj[attr1]._noProxy ? obj[attr1] : $.proxy(obj[attr1]._preProxy || obj[attr1], dest);
      proxied._preProxy = obj[attr1]._noProxy ? undefined : (obj[attr1]._preProxy || obj[attr1]); // save original
      obj[attr1] = proxied;

    }
    // Proxy sub-methods (model.*, view.*, etc) -- except for jQuery object
    else if (typeof obj[attr1] === 'object' && !(obj[attr1] instanceof jQuery) ) {
      for (var attr2 in obj[attr1]) {
        var proxied2 = obj[attr1][attr2];
        if (typeof obj[attr1][attr2] === 'function') {
          proxied2 = obj[attr1][attr2]._noProxy ? obj[attr1][attr2] : $.proxy(obj[attr1][attr2]._preProxy || obj[attr1][attr2], dest);
          proxied2._preProxy = obj[attr1][attr2]._noProxy ? undefined : (obj[attr1][attr2]._preProxy || obj[attr1][attr2]); // save original
          proxied[attr2] = proxied2;
        }
      } // for attr2
      obj[attr1] = proxied;
    } // if not func
  } // for attr1
}; // proxyAll


// Determines # of attributes of given object (prototype inclusive)
util.size = function(obj){
  var size = 0, key;
  for (key in obj) {
    size++;
  }
  return size;
};

// Find controllers to be extended (with syntax '~'), redefine those to encompass previously defined controllers
// Example:
//   var a = $$({}, '<button>A</button>', {'click &': function(){ alert('A'); }});
//   var b = $$(a, {}, '<button>B</button>', {'~click &': function(){ alert('B'); }});
// Clicking on button B will alert both 'A' and 'B'.
util.extendController = function(object) {
  for (var controllerName in object.controller) {

    // new scope as we need one new function handler per controller
    (function(){
      var matches, extend, eventName,
          previousHandler, currentHandler, newHandler;

      if (typeof object.controller[controllerName] === 'function') {
        matches = controllerName.match(/^(\~)*(.+)/); // 'click button', '~click button', '_create', etc
        extend = matches[1];
        eventName = matches[2];
      
        if (!extend) return; // nothing to do

        // Redefine controller:
        // '~click button' ---> 'click button' = previousHandler + currentHandler
        previousHandler = object.controller[eventName] ? (object.controller[eventName]._preProxy || object.controller[eventName]) : undefined;
        currentHandler = object.controller[controllerName];
        newHandler = function() {
          if (previousHandler) previousHandler.apply(this, arguments);
          if (currentHandler) currentHandler.apply(this, arguments);
        };

        object.controller[eventName] = newHandler;
        delete object.controller[controllerName]; // delete '~click button'
      } // if function
    })();
  } // for controllerName
};

module.exports = util;

