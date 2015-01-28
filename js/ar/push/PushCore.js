/**
 * @author thurston3017
 */
var pushCore;

var PushMode = {awake:-1,idle:0,push:1,pull:2};

var PushCore = function () {

	console.log("PushCore.constructor");

	pushCore = this;

	this.onUpdate = null;

	this.pushComponents = [];

	this.currTimeMS 	= new Date().getTime();
	this.lastTimeMS 	= this.currTimeMS;
	this.deltaTimeMS 	= 0.02;
	pushCore.deltaTime 	= 0.02;

	this.console 	= document.getElementById("console");
	
	this.update();
	//return this;

}

/*



*/

Math.easeInOutExpo = function (t, b, c, d) {
	t /= d/2;
	if (t < 1) return c/2 * Math.pow( 2, 10 * (t - 1) ) + b;
	t--;
	return c/2 * ( -Math.pow( 2, -10 * t) + 2 ) + b;
};
Math.easeInExpo = function (t, b, c, d) {
	return c * Math.pow( 2, 10 * (t/d - 1) ) + b;
};
Math.easeOutExpo = function (t, b, c, d) {
	return c * ( -Math.pow( 2, -10 * t/d ) + 1 ) + b;
};

PushCore.prototype.btnClick = function(btnID) {

	if(pushCore.onBtnClick!=null)	pushCore.onBtnClick(btnID);

}

PushCore.prototype.deltaTime = 0.02;
PushCore.prototype.update = function() {
	//console.log("PushCore.render");

	this.currTimeMS 	= new Date().getTime();
	this.deltaTimeMS 	= this.currTimeMS-this.lastTimeMS;
	this.lastTimeMS 	= this.currTimeMS;

	pushCore.deltaTime	= this.deltaTimeMS/1000;
	pushCore.fps		= Math.round(1000/this.deltaTimeMS);
	//console.log("pushCore.deltaTime."+pushCore.deltaTime);

	for(var i=0; i<pushCore.pushComponents.length; i++) {
		pushCore.pushComponents[i].update();
	}

	if(pushCore.onUpdate!=null)	pushCore.onUpdate();

	requestAnimFrame(pushCore.update);

}

PushCore.prototype.addComponent = function(object) {
	console.log("PushCore.addComponent."+object);
	this.pushComponents.push(object);

	return object;	
};


/*



*/

window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();
