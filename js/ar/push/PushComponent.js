/**
 * @author thurston3017
 */

var PushComponent = function (domElement) {
	
	console.log("PushComponent.constructor");

	this.domElement = domElement;
	this.pushValue = Math.random();

	this.pushMode = PushMode.idle;
	this.wasPushed = false;
	this.wasPulled = false;

}
PushComponent.prototype.setContent = function(object) {

	this.domElement.innerHTML = object;
	//console.log("PushComponent.update");	
};
PushComponent.prototype.push = function() {
	//console.log("PushComponent.push");	
	this.pushValue+=0.01;
	this.wasPushed = true;
	if(this.pushValue>1)	this.pushValue = 1;
	this.pushMode = PushMode.push;
};
PushComponent.prototype.pull = function() {
	//console.log("PushComponent.push");

	if(this.wasPushed)	return;
	this.wasPushed = false;
	this.pushValue-=0.01;
	if(this.pushValue<0)	{
		this.pushValue = 0;
		this.pushMode = PushMode.idle;
	} else {
		this.pushMode = PushMode.pull;
	}
};
PushComponent.prototype.update = function() {

	this.pull();
	this.wasPushed = false;
	//console.log("PushComponent.update");	
	jQuery(this.domElement).css('opacity', this.pushValue);
	this.domElement.innerHTML = this.pushMode+" / "+Math.round(this.pushValue*100)+"%";
};
