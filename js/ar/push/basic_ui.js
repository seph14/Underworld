'use strict';


var layer01;
var layer02;

var currentView = 0;

function initScene() {

	console.log("hail to the moon");
	new PushCore(updateScene);

	layer01 = new PushComponent(document.getElementById("div01"));
	layer02 = pushCore.addComponent(new PushComponent(document.getElementById("div02")));
	pushCore.addComponent(layer01);



}

function updateScene() {


	switch(currentView) {
		 case 0:
		 if(layer01!=null) layer01.push();
		 break;
		 case 1:
		 if(layer02!=null) layer02.push();
		 break;
	}
	//console.log("hail to updateScene");
	//console.log(layer01);
	//console.log(layer02);
	//if(layer01!=null)	layer01.setContent("nervous");
	//layer01.setContent("moin");
	//document.getElementById("div01").innerHTML = layer01.pushValue;
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