/**
 * @author thurston3017
 */

var PushComponent = function (domElement, btnID) {
	
	console.log("PushComponent.constructor."+domElement);

	this.domElement = domElement;
	this.pushValue = 0;

	this.btnID = btnID;

	var ref = this;

	if(btnID!=null) {
		$( domElement ).click(function() {
		  //alert( "Handler for .click() called."+ref.btnID );
		  pushCore.btnClick(ref.btnID);
		});
	}

	this.pushMode = PushMode.awake;
	this.wasPushed = false;
	this.wasPulled = false;

	this.duration = .1+Math.random();

	this.x = $(this.domElement).offset().left;

	this.value = "";
	this.update();

}

PushComponent.prototype.push = function(value, btnID) {

	if(btnID!=null)	this.btnID = btnID;
	this.value = value;

	$(this.domElement).css({"visibility":"visible"});

	this.pushValue+=pushCore.deltaTime/this.duration;
	this.wasPushed = true;
	if(this.pushValue>1)	this.pushValue = 1;
	this.pushMode = PushMode.push;
};

PushComponent.prototype.pull = function() {

	if(this.wasPushed)	return;
	//console.log("pushCore.deltaTime."+pushCore.deltaTime);

	this.wasPushed = false;
	this.pushValue-=pushCore.deltaTime/this.duration;
	if(this.pushValue<0)	{
		this.pushValue = 0;
		this.pushMode = PushMode.idle;
		$(this.domElement).css({"visibility":"hidden"});
	} else {
		this.pushMode = PushMode.pull;
	}
};
PushComponent.prototype.update = function() {

	if(this.pushMode == PushMode.idle)	return;

	if(isNaN(this.pushValue))	this.pushValue=0;
	this.pull();
	this.wasPushed = false;
	//console.log("PushComponent.update");	

	// PUT YOUR OWN STUFF IN HERE:

	jQuery(this.domElement).css('opacity', this.pushValue+0.2);
	var offset = {top: -32*(1-this.pushValue), left: 100};
	
	offset.top = Math.easeInOutExpo(this.pushValue,0,1,1)*320;

	$(this.domElement).offset({ top: offset.top, left: this.x})
	//this.domElement.innerHTML = this.pushMode+" / "+Math.round(this.pushValue*100)+"% "+this.value;
	this.domElement.innerHTML = "<tt>"+this.value+"</tt>";
};
