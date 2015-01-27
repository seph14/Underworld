/**
 * @author thurston3017
 */
var pushCore;

var PushMode = {idle:0,push:1,pull:2};

var PushCore = function (renderCallback) {

	console.log("PushCore.constructor");

	pushCore = this;

	this.renderCallback = renderCallback;

	this.pushComponents = [];

	this.currTime 	= new Date().getTime();
	this.lastTime 	= this.currTime;
	this.deltaTime 	= 0;

	this.console 	= document.getElementById("console");
	
	this.update();
	//return this;

}

/*



*/

PushCore.prototype.update = function() {
	//console.log("PushCore.render");

	this.currTime 	= new Date().getTime();
	this.deltaTime 	= this.currTime-this.lastTime;
	this.lastTime 	= this.currTime;

	for(var i=0; i<pushCore.pushComponents.length; i++) {
		pushCore.pushComponents[i].update();
	}

	document.getElementById("console").innerHTML = Math.round(1000/this.deltaTime);

	pushCore.renderCallback();

	requestAnimFrame(pushCore.update);

}

PushCore.prototype.setContent = function() {
	for(var i=0; i<pushCore.pushComponents.length; i++) {
		pushCore.pushComponents[i].push();
	}
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
