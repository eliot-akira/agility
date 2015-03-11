
/*---------------------------------------------
 *
 * _events API and auxiliary functions for handling events
 *
 */

var $ = require('jquery'),
    ROOT_SELECTOR = '&'; // Also in mvc/view.js

module.exports = {

  // Binds eventStr to fn. eventStr is parsed as per parseEventStr()
  bind: function(eventStr, fn){

    var eventObj = parseEventStr(eventStr);

    // DOM event 'event selector', e.g. 'click button'
    if (eventObj.selector) {

      // Keep click and submit localized
      var fnx = function(event) {
        fn(event);
        return false; // Prevent default & bubbling
        // or just default? if ( ! event.isDefaultPrevented() ) event.preventDefault();
      };

      // Manually override root selector, as jQuery selectors can't select self object
      if (eventObj.selector === ROOT_SELECTOR) {

        if ( eventObj.type === 'click' || eventObj.type === 'submit' ) {
          this.view.$().on(eventObj.type, fnx);
        } else {
          this.view.$().on(eventObj.type, fn);
        }

        // @extend Replace $().bind with $().on
        // this.view.$().bind(eventObj.type, fn);
      }
      else {

        if ( eventObj.type === 'click' || eventObj.type === 'submit' ) {
          this.view.$().on(eventObj.type, eventObj.selector, fnx);
        } else {
          this.view.$().on(eventObj.type, eventObj.selector, fn);
        }

        // @extend Replace $().delegate with $().on
        // this.view.$().delegate(eventObj.selector, eventObj.type, fn);
      }
    }
    // Custom event
    else {

      // @extend Replace $().bind with $().on
      $(this._events.data).on(eventObj.type, fn);
      // $(this._events.data).bind(eventObj.type, fn);
    }
    return this; // for chainable calls
  }, // bind

  // Alias to bind()
  on: function( eventStr, fn ) {
    return this._events.bind( eventStr, fn );
  },

  // Triggers eventStr. Syntax for eventStr is same as that for bind()
  trigger: function(eventStr, params){

    var eventObj = parseEventStr(eventStr);

    // DOM event 'event selector', e.g. 'click button'
    if (eventObj.selector) {
      // Manually override root selector, as jQuery selectors can't select self object
      if (eventObj.selector === ROOT_SELECTOR) {
        this.view.$().trigger(eventObj.type, params);
      }
      else {          
        this.view.$().find(eventObj.selector).trigger(eventObj.type, params);
      }
    }
    // Custom event
    else {
      $(this._events.data).trigger('_'+eventObj.type, params);
      // fire 'pre' hooks in reverse attachment order ( last first ) then put them back
      reverseEvents(this._events.data, 'pre:' + eventObj.type);
      $(this._events.data).trigger('pre:' + eventObj.type, params);
      reverseEvents(this._events.data, 'pre:' + eventObj.type);

      $(this._events.data).trigger(eventObj.type, params);

      // Trigger event for parent
      if (this.parent())
        this.parent().trigger((eventObj.type.match(/^child:/) ? '' : 'child:') + eventObj.type, params);
      $(this._events.data).trigger('post:' + eventObj.type, params);
    }
    return this; // for chainable calls
  } // trigger
  
};


/*---------------------------------------------
 *
 * Parse event string
 *
 * 'event'          : custom event
 * 'event selector' : DOM event using 'selector'
 *
 * Returns { type:'event' [, selector:'selector'] }
 * 
 */

function parseEventStr( eventStr ) {

  var eventObj = { type:eventStr }, 
      spacePos = eventStr.search(/\s/);

  // DOM event 'event selector', e.g. 'click button'
  if (spacePos > -1) {
    eventObj.type = eventStr.substr(0, spacePos);
    eventObj.selector = eventStr.substr(spacePos+1);
  } else if ( eventStr === 'click' || eventStr === 'submit' ) {
    // @extend Shortcut for 'click &' and 'submit &'
    eventObj.type = eventStr;
    eventObj.selector = ROOT_SELECTOR;
  }
  return eventObj;
}

// Reverses the order of events attached to an object

function reverseEvents(obj, eventType){

  var events = $(obj).data('events');

  if (events !== undefined && events[eventType] !== undefined){
    // can't reverse what's not there
    var reversedEvents = [];
    for (var e in events[eventType]){
      if (!events[eventType].hasOwnProperty(e)) continue;
      reversedEvents.unshift(events[eventType][e]);
    }
    events[eventType] = reversedEvents;
  }
}
