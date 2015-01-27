/**
 * @author thurston3017
 */

var PushComponentDefault = function (domElement) {
	
	console.log("PushComponentDefault.constructor."+domElement);

	this.domElement = domElement;
	this.pushValue = Math.random();

	this.pushMode = PushMode.idle;
	this.wasPushed = false;
	this.wasPulled = false;

	this.value = "";

}

PushComponentDefault.prototype.update = function() {

	if(this.pushMode == PushMode.idle)	return;

	this.pull();
	this.wasPushed = false;
	//console.log("PushComponentDefault.update");	

	// PUT YOUR OWN STUFF IN HERE:
	// play around with: this.pushValue
};

PushComponentDefault.prototype.push = function(object) {

	this.value = object;

	this.pushValue+=0.05;
	this.wasPushed = true;
	if(this.pushValue>1)	this.pushValue = 1;
	this.pushMode = PushMode.push;
};

PushComponentDefault.prototype.pull = function() {

	if(this.wasPushed)	return;

	this.wasPushed = false;
	this.pushValue-=0.05;
	if(this.pushValue<0)	{
		this.pushValue = 0;
		this.pushMode = PushMode.idle;
		$(this).css({"visibility":"hidden"});
	} else {
		this.pushMode = PushMode.pull;
	}
};