'use strict';


var fpsCount;
var btn01;
var btn02;
var btn03;
var head_large;
var quote_top;
var darker;
var totale;
var rocktemp;
var preloader;

var view0btns = [];
var view1btns = [];

var currentView = 0;

function initUI() {

	console.log("basic_ui.initUI");

	new PushCore();

	fpsCount = pushCore.addComponent(new PushComponent(document.getElementById("console"),-99));

	btn01  = pushCore.addComponent(new PushComponent(document.getElementById("btn01"),0));
	btn02  = pushCore.addComponent(new PushComponent(document.getElementById("btn02"),1));
	btn03  = pushCore.addComponent(new PushComponent(document.getElementById("btn03"),2));

	head_large  = pushCore.addComponent(new PushComponent(document.getElementById("head_large"),-99));
	head_large.offy = 50;
	head_large.duration = 1.8;

	quote_top  = pushCore.addComponent(new PushComponent(document.getElementById("quote_top"),-99));
	quote_top.offy = -20;
	quote_top.duration = .32;

	totale  = pushCore.addComponent(new PushComponent(document.getElementById("totale"),-99));
	rocktemp  = pushCore.addComponent(new PushComponent(document.getElementById("rocktemp"),-99));

	darker  = pushCore.addComponent(new PushComponent(document.getElementById("darker"),-99));
	darker.alpha = .9;

	preloader  = pushCore.addComponent(new PushComponent(document.getElementById("preloader"),-99));
	preloader.offy = -64;
	preloader.duration = 0.8;

	fpsCount.x 	= 100;
	btn01.duration = 10;
	btn01.x 	= 80;
	btn02.x 	= 260;
	//btn01.setBtnID(0);

	for(var i=0; i<0; i++) {
		var newDiv = document.createElement("div");
		 document.body.appendChild(newDiv);
		view0btns.push(pushCore.addComponent(new PushComponent(newDiv)));
	}

	for(var i=0; i<0; i++) {
		var newDiv = document.createElement("div");
		 document.body.appendChild(newDiv);
		view1btns.push(pushCore.addComponent(new PushComponent(newDiv)));
	}

	pushCore.onUpdate 	= onUpdate;
	pushCore.onBtnClick = onBtnClick;

}

function uiSetProgress(val) {

	if(val>=100 && currentView==0)	currentView = 1;
	if(Math.random()<.91 && currentView==0) {
		console.log(val);		
		$('.pie_progress').asPieProgress('go',val);
	}


}

function onUpdate() {

	fpsCount.push(pushCore.fps+" fps");

	 
	 btn02.push("welcome, humans");
	 btn03.push("enter the dome");

	switch(currentView) {
		 case 0:
		 //quote_top.push("<p>\“ This is a set of beautiful components which include everything \„</p>");
		 btn01.push("preloader");
		 rocktemp.push("");
		 darker.push("");
		 preloader.push("");

		 break;
		 case 1:
		 //rocktemp.push("");
		 head_large.push("");
		 quote_top.push("<p>\“ This is a set of beautiful components which include everything \„</p>");

		 break;
		 case 2:
		 head_large.push("");
		 quote_top.push("<p>\“ This is a set of beautiful components which include everything \„</p>");

		 totale.push("");
		 
		 break;
	}


}

function onBtnClick(btnID) {

	console.log(".onBtnClick."+btnID);

	if(btnID==0)	currentView = 0;
	if(btnID==1)	currentView = 1;
	if(btnID==2)	currentView = 2;

}

this.onKeyDown = function ( event ) {

		//event.preventDefault();

		switch ( event.keyCode ) {

			case 38: /*up*/
			case 87: /*W*/ this.moveForward = true; break;

			case 37: /*left*/
			case 65: /*A*/ this.moveLeft = true; break;

			case 40: /*down*/
			case 83: /*S*/ this.moveBackward = true; break;

			case 39: /*right*/
			case 68: /*D*/ this.moveRight = true; break;

			case 82: /*R*/ this.moveUp = true; break;
			case 70: /*F*/ this.moveDown = true; break;

		}

	};

	this.onKeyUp = function ( event ) {

		console.log(event.keyCode);

		//TweenLite.to(this, 10, {val:200, ease:Bounce.easeOut});

		switch( event.keyCode ) {

			case 49: /*1*/ currentView = 0; break;
			case 50: /*2*/ currentView = 1; break;
			case 51: /*2*/ currentView = 2; break;

			case 38: /*up*/
			case 87: /*W*/ this.moveForward = false; break;

			case 37: /*left*/
			case 65: /*A*/ this.moveLeft = false; break;

			case 40: /*down*/
			case 83: /*S*/ this.moveBackward = false; break;

			case 39: /*right*/
			case 68: /*D*/ this.moveRight = false; break;

			case 82: /*R*/ this.moveUp = false; break;
			case 70: /*F*/ this.moveDown = false; break;

		}

	};


	window.addEventListener( 'keydown', bind( this, this.onKeyDown ), false );
	window.addEventListener( 'keyup', bind( this, this.onKeyUp ), false );

	function bind( scope, fn ) {

		return function () {

			fn.apply( scope, arguments );

		};

	};

//window.onload = initScene;