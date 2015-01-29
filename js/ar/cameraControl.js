var AR = {};

AR.CameraControl = function ( object, domElement ) {

	this.object = object;
	this.target = new THREE.Vector3( 0, 0, 0 );

	this.domElement = ( domElement !== undefined ) ? domElement : document;

	this.enabled = true;

	this.movementSpeed = 1.0;
	this.lookSpeed = 0.005;

	this.lookVertical = true;
	this.autoForward = false;

	this.activeLook = true;

	this.heightSpeed = false;
	this.heightCoef = 1.0;
	this.heightMin = 0.0;
	this.heightMax = 1.0;

	this.constrainVertical = false;
	this.verticalMin = 0;
	this.verticalMax = Math.PI;

	this.autoSpeedFactor = 0.0;

	this.mouseX = 0;
	this.mouseY = 0;

	this.lat = 0;
	this.lon = 0;
	this.phi = 0;
	this.theta = 0;

	this.moveForward = false;
	this.moveBackward = false;
	this.moveLeft = false;
	this.moveRight = false;

	this.mouseDragOn = false;

	this.viewHalfX = 0;
	this.viewHalfY = 0;

	this.cameras = [];
	this.currentCamera = null;

	this.val = 0;

	this.addCamera = function ( object ) {

		if(this.cameras.length==0)	this.currentCamera = object;

		this.cameras.push(object);
		
	}

	this.setCameraTargetPos = function( camNum, targetX,targetY,targetZ) {
		var camera = this.cameras[camNum];
		camera.position.x+= (targetX-camera.position.x)/10;
		//camera.position.z+= (targetZ-camera.position.z)/10;
		camera.position.y+= (targetY-camera.position.y)/10;
	}

	this.lookAt = function( camNum, target) {
		var camera = this.cameras[camNum];
		camera.lookAt(target);
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

			case 49: /*1*/ this.currentCamera = this.cameras[0]; break;
			case 50: /*2*/ this.currentCamera = this.cameras[1]; break;

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

	this.update = function( delta ) {

		//trace(this.val);

	};

/*
	window.addEventListener( 'keydown', bind( this, this.onKeyDown ), false );
	window.addEventListener( 'keyup', bind( this, this.onKeyUp ), false );

	function bind( scope, fn ) {

		return function () {

			fn.apply( scope, arguments );

		};

	};
	*/

};
