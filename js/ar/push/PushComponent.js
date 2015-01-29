/**
 * @author thurston3017
 */

var PushComponent = function (domElement, btnID) {
	
	console.log("PushComponent.constructor."+domElement);

	this.domElement = domElement;
	this.pushValue = 0;
	this.lastPushValue = -1;

	this.btnID = btnID;

	var ref = this;

	if(btnID!=null && btnID>-1) {
		$( domElement ).click(function() {
		  //alert( "Handler for .click() called."+ref.btnID );
		  pushCore.btnClick(ref.btnID);
		});
	}

	this.pushMode = PushMode.awake;
	this.wasPushed = false;
	this.wasPulled = false;

	this.duration = .5; //.1+Math.random();

	this.x = $(this.domElement).offset().left;
	this.y = $(this.domElement).offset().top;
	this.y = parseInt($(this.domElement).css('marginTop'));

	this.offx = 0;
	this.offy = 0;

	this.alpha = 1.0;

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

	jQuery(this.domElement).css('opacity', this.pushValue*this.pushValue*this.alpha);
	var offset = {top: -32*(1-this.pushValue), left: 100};
	
	var pushValueInOutExpo = Math.easeInOutExpo(1-this.pushValue,0,1,1);
	var pushValueOutExpo = Math.easeOutExpo(1-this.pushValue,0,1,1);
	var pushValueInExpo = Math.easeInExpo(1-this.pushValue,0,1,1);
	offset.top = pushValueInExpo*this.offy+this.y;
	offset.left = this.x;

	if(this.pushMode == PushMode.pull)	{
			//offset.top = pushValueOutExpo*this.offy+this.y;
	}

	if(this.lastPushValue!=this.pushValue) {
		//$(this.domElement).offset({ top: offset.top});
		 $(this.domElement).css({ 'margin-top': offset.top+'px' }); 
		//this.domElement.innerHTML = this.pushMode+" / "+Math.round(this.pushValue*100)+"% "+this.value;
		if(this.value!="")	this.domElement.innerHTML = "<tt>"+this.value+"</tt>";
	}

	this.lastPushValue = this.pushValue;

};
