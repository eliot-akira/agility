/*---------------------------------------------
 *
 * Timed functions
 *
 */

var $ = require('jquery');

var timers = {},
    defaultInterval = 10000;

$.fn.timedClass = function( className, duration ) {

  var $self = $(this);

  return $(this).timedFn(
    function(){ $self.addClass( className ); },
    function(){ $self.removeClass( className ); },
    duration || defaultInterval
  );
};

$.fn.timedText = function( txt, duration ) {

  var $self = $(this);

  return $(this).timedFn(
    function(){ $self.text( txt ); },
    function(){ $self.text(''); },
    duration || defaultInterval
  );
};

$.fn.timedFn = function( id, start, end, duration ) {

  duration = duration || defaultInterval;

  // ID skipped
  if ( typeof id === 'function' ) {

    duration = end || duration;
    end = start;
    start = id;

    new Timer(function(){
      end();
    }, duration );

    return start();

  // If timer ID is set and one is already going, add to the duration
  } else if ( typeof timers[id] !== 'undefined' && ! timers[id].finished ) {

    timers[id].add( duration );

  } else {

    timers[id] = new Timer(function(){
      end();
    }, duration );

    return start();
  }
};


function Timer(callback, time) {
    this.setTimeout(callback, time);
}

Timer.prototype.setTimeout = function(callback, time) {

    var self = this;

    this.finished = false;
    this.callback = callback;
    this.time = time;

    if(this.timer) {
        clearTimeout(this.timer);
    }
    this.timer = setTimeout(function() {
      self.finished = true;
      self.callback();
    }, time);
    this.start = Date.now();
};

Timer.prototype.add = function(time) {
   if(!this.finished) {
       // add time to time left
       time = this.time - (Date.now() - this.start) + time;
       this.setTimeout(this.callback, time);
   }
};
