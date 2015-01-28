'use strict';


var fpsCount;
var layer01;
var layer02;
var head_large;
var quote_top;
var darker;
var preloader;

var view0Layers = [];
var view1Layers = [];

var currentView = 0;

function initScene() {

	console.log("basic_ui.initScene");

	new PushCore();

	fpsCount = pushCore.addComponent(new PushComponent(document.getElementById("console"),-99));
	layer01  = pushCore.addComponent(new PushComponent(document.getElementById("div01"),1));
	layer02  = pushCore.addComponent(new PushComponent(document.getElementById("div02"),0));

	head_large  = pushCore.addComponent(new PushComponent(document.getElementById("head_large"),-99));
	head_large.offy = 50;
	head_large.duration = 1.8;

	quote_top  = pushCore.addComponent(new PushComponent(document.getElementById("quote_top"),-99));
	quote_top.offy = -20;
	quote_top.duration = .32;

	darker  = pushCore.addComponent(new PushComponent(document.getElementById("darker"),-99));
	darker.alpha = .5;

	preloader  = pushCore.addComponent(new PushComponent(document.getElementById("preloader"),-99));

	fpsCount.x 	= 100;
	layer01.x 	= 80;
	layer02.x 	= 260;
	//layer01.setBtnID(0);

	for(var i=0; i<0; i++) {
		var newDiv = document.createElement("div");
		 document.body.appendChild(newDiv);
		view0Layers.push(pushCore.addComponent(new PushComponent(newDiv)));
	}

	for(var i=0; i<0; i++) {
		var newDiv = document.createElement("div");
		 document.body.appendChild(newDiv);
		view1Layers.push(pushCore.addComponent(new PushComponent(newDiv)));
	}

	pushCore.onUpdate 	= onUpdate;
	pushCore.onBtnClick = onBtnClick;

}

function onUpdate() {

	//fpsCount.push(pushCore.fps+" fps");

	switch(currentView) {
		 case 0:
		 layer02.push("preloader");
		 quote_top.push("<p>\“ This is a set of beautiful components which include everything \„</p>");
		 darker.push("");
		 preloader.push("");

		 break;
		 case 1:
		 layer01.push("welcome");
		 head_large.push("");
		 quote_top.push("<p>\“ This is a set of beautiful components which include everything \„</p>");

		 break;
	}

	if(Math.random()<.1)
		$('.pie_progress').asPieProgress('go',layer02.pushValue*100);

}

function onBtnClick(btnID) {

	console.log(".onBtnClick."+btnID);

	if(btnID==0)	currentView = 1;
	if(btnID==1)	currentView = 0;

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

window.onload = initScene;