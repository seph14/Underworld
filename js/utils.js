'use strict';

var debug  = true;

function trace( content ){ if(debug){ console.log(content); }    }
function frac( number )  { return (number - Math.floor(number)); }
function is_touch_device() {
  return 'ontouchstart' in window // works on most browsers 
      || 'onmsgesturechange' in window; // works on ie10
};

Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};
