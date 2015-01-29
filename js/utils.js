'use strict';

var debug  = false;

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

//helper function for rock physics calculation
//if number is bigger than 0 return 1, else return -1
function toUnit( number ){
	return (number > 0.0) ? 1.0 : -1.0;
}