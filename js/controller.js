'use strict';

var debug = true;
var mouseX = 0, mouseY = 0;
var angle 		  = 0.0;
var distThreshold = 0.5;
var maxEffect 	  = 16;
var camMovable    = true;

var container, renderer, render_stats, physics_stats, scene, camera;
var rockMat, rockBox;
var ground, ground_geometry, ground_material;
var rocks = [], detachedRocks = [];

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var texStr 	 	= "rock_diffuse.png";
var modelStr 	= "Rock";
var modelFormat = ".obj";
var modelCnt 	= 185;
var touchable;

Physijs.scripts.worker 	= 'framework/physijs_worker.js';
Physijs.scripts.ammo 	= 'ammo.js';

function trace( content ){
	if(debug){
		console.log(content);
	}
}

function frac( number ){
	return (number - Math.floor(number));
}

function is_touch_device() {
  return 'ontouchstart' in window // works on most browsers 
      || 'onmsgesturechange' in window; // works on ie10
};

Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

function initScene(){
	// scene - instead of threejs scene use physijs scene instead
	scene = new Physijs.Scene({ reportsize : 75, fixedTimeStep: 1 / 60, antialias: true });
	scene.setGravity(new THREE.Vector3( 0, -15, 0 ));
	scene.addEventListener(
		'update',
		function() {
			scene.simulate( undefined, 1 );
			physics_stats.update();
			
			//TODO:fix me
			/*for( var i = detachedRocks.length-1; i >= 0;  ){
				if( detachedRocks[i].collisions >= 5 ){
					scene.remove(detachedRocks[i]);
					detachedRocks[i].geometry.dispose();
					detachedRocks[i].material.dispose();
					detachedRocks.remove( i );
				}else{
					i--;
				}
			}*/
		}
	);
}

function initLandscape(){
	// Materials
	ground_material = Physijs.createMaterial(
		new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture( 'textures/marble_diffuse.jpg' ) }),
		.8, // high friction
		.4 // low restitution
	);
	ground_material.map.wrapS = ground_material.map.wrapT = THREE.RepeatWrapping;
	ground_material.map.repeat.set( 2.5, 2.5 );
		
	// Ground
	var NoiseGen = new SimplexNoise;
		
	ground_geometry = new THREE.PlaneGeometry( 75, 75, 50, 50 );
	for ( var i = 0; i < ground_geometry.vertices.length; i++ ) {
		var vertex = ground_geometry.vertices[i];
		vertex.z = NoiseGen.noise( vertex.x / 10, vertex.y / 10 ) * 2;
	}
	ground_geometry.computeFaceNormals();
	ground_geometry.computeVertexNormals();
		
	// If your plane is not square as far as face count then the HeightfieldMesh
	// takes two more arguments at the end: # of x faces and # of y faces that were passed to THREE.PlaneMaterial
	ground = new Physijs.HeightfieldMesh( ground_geometry, ground_material, 0, 50, 50 );
																			//mass
	ground.rotation.x = Math.PI / -2;
	//ground.receiveShadow = true;
	scene.add( ground );
}

function initRock(){
	rockBox = new THREE.Box3(new THREE.Vector3( -0.0, -0.0, -0.0 ), new THREE.Vector3( +0.0, +0.0, +0.0 ));

	//loading manager setup
	var manager = new THREE.LoadingManager();
	manager.onProgress = function ( item, loaded, total ) { };
	var texture = new THREE.Texture();
	
	var onProgress = function ( xhr ) {
		if ( xhr.lengthComputable ) {
			var percentComplete = xhr.loaded / xhr.total * 100;
			trace( Math.round(percentComplete, 2) + '% downloaded' );
		}
	};

	var onError = function ( xhr ) {
		trace("file not found");
	};

	// texture
	var loader = new THREE.ImageLoader( manager );
	loader.load( 'textures/' + texStr, function ( image ) {
		texture.image = image;
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set( 1, 1 );
		texture.needsUpdate = true;
	} );

	var mat = new THREE.MeshBasicMaterial();
	mat.map = texture;
	rockMat = Physijs.createMaterial(
				mat,
				.3, // medium friction
				.2 // low restitution
			);

	// model
	var loader = new THREE.OBJLoader( manager );
	for (var i = 1; i <= modelCnt; i++) {
		var str = "models/" + modelStr + i + modelFormat;
		loader.load( str, function ( object ) {
			object.traverse( function ( child ) {
				if ( child instanceof THREE.Mesh ) {
					//child.material.map = texture;
					child.geometry.computeBoundingBox ();
					rockBox.union(child.geometry.boundingBox);
					var box = new Physijs.ConvexMesh( child.geometry, rockMat, 0.0 );
					
					box.collisions = 0; //use this as click counter - release this mesh when its bigger than 3
					box.position.set( 0, 10, 0 ); //make sure mesh is up than landscape
					
					box.addEventListener( 'collision', function( other_object, linear_velocity, angular_velocity ) {
						//TODO: maybe we need to dispose rocks after they hit ground for memory consideration
						//if( other_object == ground ){
						//	this.collisions += 4;	
						//}
					});
					rocks.push(box );
					scene.add( box );
				}
			} );
		}, onProgress, onError );
	};
}

function init() {

	touchable  = is_touch_device();
	camMovable = !touchable;
	container = document.getElementById( 'viewport' );
	
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize( window.innerWidth, window.innerHeight );
	//renderer.shadowMapEnabled = true;
	//renderer.shadowMapSoft = true;
	container.appendChild( renderer.domElement );
		
	render_stats = new Stats();
	render_stats.domElement.style.position = 'absolute';
	render_stats.domElement.style.top = '0px';
	render_stats.domElement.style.zIndex = 100;
	container.appendChild( render_stats.domElement );
		
	physics_stats = new Stats();
	physics_stats.domElement.style.position = 'absolute';
	physics_stats.domElement.style.top = '50px';
	physics_stats.domElement.style.zIndex = 100;
	container.appendChild( physics_stats.domElement );

	initScene();
	initLandscape();
	initRock();

	camera = new THREE.PerspectiveCamera( 35, window.innerWidth / window.innerHeight, 1, 1000 );
	camera.position.set( 40, 55, 40 );
	camera.lookAt( scene.position );
		
	var ambient = new THREE.AmbientLight( 0x101030 );
	scene.add( ambient );

	var directionalLight = new THREE.DirectionalLight( 0xffeedd );
	directionalLight.position.set( 0, 0, 1 );
	scene.add( directionalLight );
	
	//window events setup
	document.addEventListener( 'mousemove',  onDocumentMouseMove,  false );
	document.addEventListener( touchable ? 'touchstart' : 'click', 	 onDocumentMouseClick, false );
	window.addEventListener  ( 'resize',     onWindowResize,       false );
	window.addEventListener  ( 'keypress',   onKeyPressed,         false ); 

	animate();		
	scene.simulate();
}

function onWindowResize() {
	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );
}

function onKeyPressed( event ){
	camMovable = !camMovable;
}

function onDocumentMouseClick( event ){
	event.preventDefault();
	if(!camMovable){

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
		var intersects 	= raycaster.intersectObjects( rocks );
		
		if ( intersects.length > 0 ) {
			var box  = intersects[0].object.geometry.boundingBox;
			var pos  = box.center();
			var dist = new THREE.Vector3;
			var aff  = 0;
			for ( var i = rocks.length - 1; i >= 0; i-- ) {
				dist.subVectors(rocks[i].geometry.boundingBox.center(), pos);
				var len = dist.lengthSq();
				if( len < distThreshold ){
					rocks[i].collisions += 0.5 * Math.min(1.0, (0.3 * distThreshold) / len) + 1.0;	
					aff ++;		
					if( rocks[i].collisions > 3.0 ){
						rocks[i].mass += 0.05;
						detachedRocks.push(rocks[i]);
						rocks.remove(i);
						i ++;
					}
					if( aff >= maxEffect )
						break;
				}
			}
		}
	}
}

function onDocumentMouseMove( event ) {	
	event.preventDefault();
	if(camMovable){
		mouseX = ( event.clientX - windowHalfX ) * 0.05;
		mouseY = ( event.clientY - windowHalfY ) * 0.05;
	}
}

function animate() {
	requestAnimationFrame( animate );
	render();
	render_stats.update();
}

function render() {
	if(camMovable){
		camera.position.x += ( mouseX - camera.position.x ) * .05;
		camera.position.y += ( - mouseY - camera.position.y ) * .05;
	}
	camera.lookAt( scene.position );
	
	renderer.render( scene, camera );
}

window.onload = init;