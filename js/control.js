'use strict';

var MARGIN = 0;
var WIDTH = window.innerWidth || 2;
var HEIGHT = window.innerHeight || ( 2 + 2 * MARGIN );
var SCREEN_WIDTH = WIDTH;
var SCREEN_HEIGHT = HEIGHT - 2 * MARGIN;
var FAR  = 10000;
var NEAR = 1;
var touchable;

var container, stats;
var camera, scene, renderer;
var cameraCube, sceneCube, skyMesh;
var ambientLight, sunLight, directionalLight;
var camControl;

var rocks = [];

var composer, effectFXAA;

var clock = new THREE.Clock();

function initScene() {

	if ( ! Detector.webgl ){
		Detector.addGetWebGLMessage();
		return;
	}

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
	scene = new THREE.Scene();
	sceneCube = new THREE.Scene();
	scene.fog = new THREE.Fog( 0xcdcdcd, 100, FAR );

	// CAMERA
	camera = new THREE.PerspectiveCamera( 60, SCREEN_WIDTH / SCREEN_HEIGHT, NEAR, FAR );
	camera.position.set( -154.4030650483917, -78.94138544243742, -51.83980437693978 );
	camera.rotation.set( 2.509096643512917,  -1.1437036559358629, 2.707562454136679 );

	cameraCube = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 100000 );
	
	ambientLight = new THREE.AmbientLight( 0x3f2806 );
	scene.add( ambientLight );

	sunLight = new THREE.SpotLight( 0xcad1dd, 1.0, 0, Math.PI / 2, 1 );
	sunLight.position.set( 1000, 100, 1000 );
	sunLight.rotation.set(  1.2, 0, 0 );
	sunLight.castShadow 	  = true;
	sunLight.shadowDarkness   = 0.3;
	sunLight.shadowBias 	  = -0.002;
	sunLight.shadowCameraNear = 100;
	sunLight.shadowCameraFar  = 2000;
	sunLight.shadowCameraFov  = 20;
	sunLight.shadowMapWidth	  = 512;
	sunLight.shadowMapHeight  = 512;
	sunLight.shadowCameraVisible = false;
	scene.add( sunLight );

	var direct1 = new THREE.DirectionalLight( 0xcad1dd, 1.0 );
	direct1.position.set( 1000, 100, 1000 );
	direct1.rotation.set(  1.2, 0, 0 );
	scene.add( direct1 );
	
	directionalLight = new THREE.DirectionalLight( 0xcfdff9, 1.0 );
	directionalLight.position.set( -100, 200, -100 );
	directionalLight.rotation.set( 0.8, 0.1, 0.8 );
	scene.add( directionalLight );

	// RENDERER
	renderer = new THREE.WebGLRenderer( { antialias: false, precision: "mediump" } );
	//renderer.setClearColor( scene.fog.color, 1 );
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

	renderer.autoClear = false;
	renderModel.clear = false;

	effectFXAA = new THREE.ShaderPass( THREE.FXAAShader );
	effectFXAA.uniforms[ 'resolution' ].value.set( 1 / SCREEN_WIDTH, 1 / SCREEN_HEIGHT );
	effectFXAA.renderToScreen = true;

	composer = new THREE.EffectComposer( renderer, renderTarget );
	composer.addPass( renderSky   );
	composer.addPass( renderModel );
	composer.addPass( effectFXAA );
	
	//camera.position.set( -154.4030650483917, -78.94138544243742, -51.83980437693978 );
	
	if( debug ){
		CreateRockGUI();
	}

	// BASE SCENE
	//CreateBase01( );
	LoadMat("Rock_A_01_Diffuse.png",
			"Rock_A_01_Normal.png",
			"PBR_Bump", 
			"PBR_Color");
	LoadRockParticle( 12, 153, 0.3, 0.6 );
	LoadTerrainMat();
	LoadTerrain();
	LoadDummy();

	rocks.push(CreateRock(0, 153, 3, 
		new THREE.Vector3(-138,-63,-44)));
	rocks.push(CreateRock(0, 153, 3, 
		new THREE.Vector3(-101,-63,-44)));
	rocks.push(CreateRock(0, 153, 3, 
		new THREE.Vector3(-64, -63,-44)));
	rocks.push(CreateRock(0, 153, 3, 
		new THREE.Vector3(-27, -63,-44)));

	rocks.push(CreateRock(0, 153, 3, 
		new THREE.Vector3(-138,-63,-7)));
	rocks.push(CreateRock(0, 153, 3, 
		new THREE.Vector3(-101,-63,-7)));
	rocks.push(CreateRock(0, 153, 3, 
		new THREE.Vector3(-64, -63,-7)));
	rocks.push(CreateRock(0, 153, 3, 
		new THREE.Vector3(-27, -63,-7)));

	rocks.push(CreateRock(0, 153, 3, 
		new THREE.Vector3(-138,-63,+30)));
	rocks.push(CreateRock(0, 153, 3, 
		new THREE.Vector3(-101,-63,+30)));
	rocks.push(CreateRock(0, 153, 3, 
		new THREE.Vector3(-64, -63,+30)));
	rocks.push(CreateRock(0, 153, 3, 
		new THREE.Vector3(-27, -63,+30)));

	rocks.push(CreateRock(0, 153, 3, 
		new THREE.Vector3(-138,-63,+67)));
	rocks.push(CreateRock(0, 153, 3, 
		new THREE.Vector3(-101,-63,+67)));
	rocks.push(CreateRock(0, 153, 3, 
		new THREE.Vector3(-64, -63,+67)));
	rocks.push(CreateRock(0, 153, 3, 
		new THREE.Vector3(-27, -63,+67)));

	//EVENTS
	document.addEventListener( 'mousemove',  onDocumentMouseMove,  false );
	container.addEventListener( touchable ? 'touchstart' : 'click', 	 
											 onDocumentMouseDown,  false );
	window.addEventListener  ( 'resize',     onWindowResize,       false );
	window.addEventListener  ( 'keydown',    onKeyDown,            false ); 


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

	effectFXAA.uniforms[ 'resolution' ].value.set( 1 / SCREEN_WIDTH, 1 / SCREEN_HEIGHT );
	//camControl.handleResize();
}

function onKeyDown( event ){
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

}

function animate() {
	requestAnimationFrame( animate );
	render();
	stats.update();
}

function render() {
	// update
	camControl.update();
	cameraCube.rotation.copy( camera.rotation );

	for( var i  = rocks.length-1; i >= 0; i-- ){
		rocks[i].update();
	}
	// render scene

	//renderer.render( scene, camera );
	//renderer.clearTarget( null, 1, 1, 1 );
	composer.render( 0.1 );
}

window.onload = initScene;