'use strict';


var fpsCount;
var layer01;
var layer02;

var view0Layers = [];
var view1Layers = [];

var currentView = 0;

function initScene() {

	console.log("basic_ui.initScene");

	new PushCore();

	fpsCount = pushCore.addComponent(new PushComponent(document.getElementById("console"),-1));
	layer01  = pushCore.addComponent(new PushComponent(document.getElementById("div01"),0));
	layer02  = pushCore.addComponent(new PushComponent(document.getElementById("div02"),1));

	fpsCount.x 	= 100;
	layer01.x 	= 80;
	layer01.x 	= 260;
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

	fpsCount.push(pushCore.fps+" fps");

	switch(currentView) {
		 case 0:
		 layer01.push("Phase 1");
			for(var i=0; i<view0Layers.length;i++) {
				view0Layers[i].push("Phase 1 "+i, 1);
			}
		 break;
		 case 1:
		 layer02.push("Phase 2");
			for(var i=0; i<view1Layers.length;i++) {
				view1Layers[i].push("Phase 2 "+i, 0);
			}
		 break;
	}

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