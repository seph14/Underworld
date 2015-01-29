'use strict';

var clock = new THREE.Clock();

function initScene() {

	clock.start();
	animate();
}


function animate() {
	requestAnimationFrame( animate );
	if(pushCore!=null)	pushCore.animate();
}

window.onload = function() {
	initScene();
	initUI(); // basic_ui.js
}