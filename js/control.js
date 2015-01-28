'use strict';

var USELIGHTS = false;
var MARGIN = 0;
var WIDTH = window.innerWidth || 2;
var HEIGHT = window.innerHeight || ( 2 + 2 * MARGIN );
var SCREEN_WIDTH  = window.innerWidth;
var	SCREEN_HEIGHT = window.innerHeight - 2 * MARGIN;
//var SCREEN_WIDTH = WIDTH;
//var SCREEN_HEIGHT = HEIGHT - 2 * MARGIN;
var FAR  = 10000;
var NEAR = 1;
var touchable;

var mouse = {};

var container, stats;
var camera, cameraOne, cameraTwo, scene, renderer;
var cameraCube, sceneCube, skyMesh;
var ambientLight, sunLight, directionalLight;
var camControl;
var fpsControl;

var rocks = [];

var composer, effectFXAA;

var cameraControl;

var clock = new THREE.Clock();

function initScene() {

	if ( ! Detector.webgl ){
		Detector.addGetWebGLMessage();
		return;
	}

	mouse.x = 0;
	mouse.y = 0;

	touchable = is_touch_device();
	container = document.getElementById( 'viewport' );
			
	if(debug){
		stats = new Stats();
		stats.domElement.style.position = 'absolute';
		stats.domElement.style.top = '0px';
		stats.domElement.style.zIndex = 100;
		container.appendChild( stats.domElement );
	}

	// SCENE
	scene 			= new THREE.Scene();
	sceneCube 		= new THREE.Scene();
	scene.fog 		= new THREE.FogExp2( 0xccc9c2, 0.0011 );
	sceneCube.fog 	= new THREE.FogExp2( 0xccc9c2, 0.0007 );

	// CAMERA
	camera = new THREE.PerspectiveCamera( 60, SCREEN_WIDTH / SCREEN_HEIGHT, NEAR, FAR );
	camera.position.set( -144.52, -394.97, -289.79 );
	camera.lookAt( new THREE.Vector3(-688 + 160 * 0, -16, -237 + 3 * 160 ) );

	cameraOne = new THREE.PerspectiveCamera( 60, SCREEN_WIDTH / SCREEN_HEIGHT, NEAR, FAR );
	cameraOne.position.set( -144.52, -394.97, -289.79 );
	cameraOne.lookAt( new THREE.Vector3(-688 + 160 * 0, -16, -237 + 3 * 160 ) );

	cameraTwo = new THREE.PerspectiveCamera( 60, SCREEN_WIDTH / SCREEN_HEIGHT, NEAR, FAR );
	cameraTwo.position.set( -144.52, -394.97, -289.79 );
	cameraTwo.lookAt( new THREE.Vector3(-688 + 160 * 0, -16, -237 + 3 * 160 ) );

	cameraCube = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 100000 );
	

	fpsControl = new THREE.FirstPersonControls(cameraTwo);
	fpsControl.movementSpeed = 110.1;
	fpsControl.lookSpeed = 0.001;
	fpsControl.lookVertical = true;
	fpsControl.movementSpeed = 70;
                fpsControl.noFly = false;


	cameraControl = new AR.CameraControl();
	cameraControl.addCamera(cameraOne);
	cameraControl.addCamera(cameraTwo);
	//ambientLight = new THREE.AmbientLight( 0x3f2806 );
	//scene.add( ambientLight );

	sunLight = new THREE.DirectionalLight( 0x886c91 );//, 1.0, 0, Math.PI / 2, 1 );
	sunLight.position.set( 0, 360, 0 );
	sunLight.target.position.set(0, 0, 0);
	sunLight.castShadow 	  = true;
	sunLight.shadowDarkness   = 0.3;
	sunLight.shadowBias 	  = -0.002;
	sunLight.shadowCameraNear = 100;
	sunLight.shadowCameraFar  = 2000;
	sunLight.shadowCameraFov  = 10;
	sunLight.shadowMapWidth	  = 512;
	sunLight.shadowMapHeight  = 512;
	sunLight.onlyShadow		  = !USELIGHTS;
	sunLight.shadowCameraVisible = false;
	scene.add( sunLight );

	if( USELIGHTS ){
		var light = new THREE.DirectionalLight( 0x92798c, 0.4 );
		light.position.set( 0, -200, 0 );
		light.target.position.set(  0, 0, 0 );
		scene.add( light );

		//var dlightHelper = new THREE.DirectionalLightHelper(light, 50); 
  		//scene.add( dlightHelper);
	
		directionalLight = new THREE.DirectionalLight( 0xffffff, 0.9 );
		directionalLight.position.set( 0, -100, 0 );
		directionalLight.target.position.set(  0, 0, 0 );
		scene.add( directionalLight );
	}

	// RENDERER
	renderer = new THREE.WebGLRenderer( { antialias: false, precision: "mediump" } );
	renderer.setClearColor( scene.fog.color, 1 );
	renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );

	renderer.domElement.style.position = "absolute";
	renderer.domElement.style.top = MARGIN + "px";
	renderer.domElement.style.left = "0px";
	container.appendChild( renderer.domElement );

	//
	renderer.shadowMapEnabled = true;
	renderer.shadowMapType = THREE.PCFSoftShadowMap;

	//
	renderer.gammaInput = true;
	renderer.gammaOutput = true;

	//
	/*
	camControl = new THREE.OrbitControls( camera, renderer.domElement );
	camControl.target.set( 0, 0, 0 );

	camControl.rotateSpeed = 1.0;
	camControl.zoomSpeed = 1.2;
	camControl.panSpeed = 0.8;

	camControl.noZoom = false;
	camControl.noPan = false;

	camControl.staticMoving = true;
	camControl.dynamicDampingFactor = 0.15;
	camControl.keys = [ 65, 83, 68 ];
	*/


	//skybox
	var path = "textures/skydark/";
	var format = '.jpg';
	var urls = [
				path + 'px' + format, path + 'nx' + format,
				path + 'py' + format, path + 'ny' + format,
				path + 'pz' + format, path + 'nz' + format
			];
	var textureCube = THREE.ImageUtils.loadTextureCube( urls, new THREE.CubeRefractionMapping() );
	
	var shader = THREE.ShaderLib[ "cube" ];
	shader.uniforms[ "tCube" ].value = textureCube;

	var material = new THREE.ShaderMaterial( {
		fragmentShader: shader.fragmentShader,
		vertexShader: 	shader.vertexShader,
		uniforms: 		shader.uniforms,
		depthWrite: 	false,
		side: 			THREE.BackSide
	} );

	skyMesh = new THREE.Mesh( new THREE.BoxGeometry( FAR, FAR, FAR ), material );
	sceneCube.add( skyMesh );		

	// COMPOSER

	var renderTargetParameters = { minFilter: 		THREE.LinearFilter, 
								   magFilter: 		THREE.LinearFilter, 
								   format: 			THREE.RGBFormat, 
								   stencilBuffer: 	false };
	var renderTarget = new THREE.WebGLRenderTarget( SCREEN_WIDTH, SCREEN_HEIGHT, renderTargetParameters );
	var renderSky    = new THREE.RenderPass( sceneCube, cameraCube );
	var renderModel  = new THREE.RenderPass( scene, camera );

	renderer.autoClear = true;
	renderModel.clear  = true;

	effectFXAA = new THREE.ShaderPass( THREE.FXAAShader );
	effectFXAA.uniforms[ 'resolution' ].value.set( 1 / SCREEN_WIDTH, 1 / SCREEN_HEIGHT );
	effectFXAA.renderToScreen = true;

	composer = new THREE.EffectComposer( renderer, renderTarget );
	//composer.addPass( renderSky   );
	composer.addPass( renderModel );
	composer.addPass( effectFXAA );
	
	if( debug ){
		CreateRockGUI();
	}

	// BASE SCENE
	//CreateBase01( );
	if( USELIGHTS ){
		LoadLightMat	("Rock_A_01_Diffuse.png", "Rock_A_01_Normal.png");
		LoadTerrainMatLight();
	}else{
		LoadEnvCubeMat	("Rock_A_01_Diffuse.png", "Rock_A_01_Normal.png");	
		LoadTerrainMatEnvMap();
	}
	
	PrepareRockParticle( 15000, 0.05, 0.075 );

	LoadTerrain();
	LoadDummy();

	/*
	for( var i = 0; i < 4; i++ ){
		for( var j = 0; j < 4; j++ ){
			rocks.push(CreateRock(0, 153, 10, 
			new THREE.Vector3(-688 + 160 * i, -296, -237 + j * 160 )));
		}
	}
	*/
	for( var i = 0; i < 5; i++ ){
		var nx = Math.sin(Math.PI*2*i/5)*256;
		var ny = -316;
		var nz = Math.cos(Math.PI*2*i/5)*256;
		//var stonePos = new THREE.Vector3(-688 + 256 * i, -316, -237 + j * 256 );
		var stonePos = new THREE.Vector3(nx, ny, nz);
		rocks.push(CreateRock(0, 154, 20, stonePos));
	}

	//EVENTS
	document.addEventListener(  touchable ? 'touchmove'  : 'mousemove',  
											 onDocumentMouseMove,  false );
	container.addEventListener( touchable ? 'touchstart' : 'click', 	 
											 onDocumentMouseDown,  false );
	window.addEventListener  ( 'resize',     onWindowResize,       false );
	window.addEventListener  ( 'keydown',    onKeyDown,            false ); 

	//if(touchable){
		onWindowResize();
	//}

	clock.start();

	animate();
}

function onWindowResize() {
	SCREEN_WIDTH  = window.innerWidth;
	SCREEN_HEIGHT = window.innerHeight - 2 * MARGIN;
	
	camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
	camera.updateProjectionMatrix();

	cameraCube.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
	cameraCube.updateProjectionMatrix();

	renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
	composer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );

	if( touchable ){
		//this 0.5 should be 1.0 / scale 
		//so for iphone6plus this should be 0.33?
		//need to test though
		effectFXAA.uniforms[ 'resolution' ]
		.value.set( 0.5 / SCREEN_WIDTH, 0.5 / SCREEN_HEIGHT );

	}else{
		effectFXAA.uniforms[ 'resolution' ]
		.value.set( 1 / SCREEN_WIDTH, 1 / SCREEN_HEIGHT );
	}
}

function onKeyDown( event ){
	//trace( camera.position );
	//trace( camera );
	//trace( rockParticle );
}

function onDocumentMouseDown( event ){
	//event.preventDefault();
	
	var mousex, mousey;
	if(touchable){
		var touchobj = event.changedTouches[0];
		mousex = ( touchobj.clientX / window.innerWidth ) * 2 - 1;
		mousey = - ( touchobj.clientY / window.innerHeight ) * 2 + 1;
	}else{
		mousex = ( event.clientX / window.innerWidth ) * 2 - 1;
		mousey = - ( event.clientY / window.innerHeight ) * 2 + 1;
	}
	
	var vector 		= new THREE.Vector3( mousex, mousey, 0.5 ).unproject( camera );
	var raycaster 	= new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );
	for( var i  = rocks.length-1; i >= 0; i-- ){
		if( rocks[i].cast( raycaster ) ) break;
	}
}

function onDocumentMouseMove( event ) {	
	if(touchable){
		var touchobj = event.changedTouches[0];
		mouse.x = ( touchobj.clientX / window.innerWidth ) * 2 - 1;
	    mouse.y = ( touchobj.clientY / window.innerHeight ) * 2 - 1;
	}else{
		mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	    mouse.y = ( event.clientY / window.innerHeight ) * 2 - 1;
	}
}

function animate() {
	requestAnimationFrame( animate );
	render();
	stats.update();
}

function render() {
	// update
	//camControl.update();
	//cameraCube.rotation.copy( camera.rotation );

	cameraControl.update();

	for( var i  = rocks.length-1; i >= 0; i-- ){
		rocks[i].update();
	}

	var t = 5 * clock.getElapsedTime ();
	rockParticle.update( rocks[3].scaler, t );

	/*
	if( rocks.length > 4 ){
		var pos = rocks[3].pos;
		var p   = new THREE.Vector3;
		p.x     = rocks[3].pos.x;
		p.y     = rocks[3].pos.y + 280;
		p.z     = rocks[3].pos.z;
		camera.lookAt( p ); //not working???
	}*/

	// camera.position.set( -144.52, -394.97, -289.79 );
	
	var targetX = -223+mouse.x*20;
	var targetZ = -290+mouse.x*20;
	var targetY = -392+mouse.y*2;
	//camera.position.x+= (targetX-camera.position.x)/10;
	//camera.position.z+= (targetZ-camera.position.z)/10;
	//camera.position.y+= (targetY-camera.position.y)/10;
	
	cameraControl.setCameraTargetPos(0,targetX,targetY,targetZ);

	var delta = clock.getDelta();

            fpsControl.update(delta);

	var op = "<tt>";
	op+= camera.position.x+"<br>";
	op+= camera.position.y+"<br>";
	op+= camera.position.z+"<br>";
	op+= rocks[3].scaler+"<br>";
	op+= "</tt>";
	document.getElementById("console").innerHTML = ""+op;

	var target = new THREE.Vector3(0,-200,0);
	/*camera.lookAt(rocks[0].pos);*/
	cameraControl.lookAt(0,target);

	// render scene
	camera.rotation.copy( cameraControl.currentCamera.rotation );
	camera.position.set( cameraControl.currentCamera.position.x,
						 cameraControl.currentCamera.position.y,
						 cameraControl.currentCamera.position.z );
	//copy camera rotation + position so we can keep using composer setting
	//where fxaa is preserved.
	composer.render( 0.1 );

	//renderer.render( scene, cameraControl.currentCamera );
	//renderer.render( scene, cameraTwo);

	//renderer.clearTarget( null, 1, 1, 1 );
	//camera = cameraControl.currentCamera;
	//composer.render( 0.1 );
}

window.onload = initScene;