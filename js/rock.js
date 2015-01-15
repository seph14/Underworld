'use strict';

var rockMat;
var coreMat;

var rockConfig = {
		uRoughness : 1.0,
		uMetallic  : 0.2,
		uSpecular  : 0.1,
		uDetails   : 1.0,
		uExposure  : 6.3375,
		uGamma	   : 2.2,
		uBaseColor : new THREE.Color( 0x413e3c ),
		uLightPositions : [ new THREE.Vector3( 0, 300, 0 ), new THREE.Vector3( 200, 0, 200 ) ],
		uLightRadiuses0 : 5.0,
		uLightRadiuses1 : 5.0,
		uLightColors 	: [ new THREE.Vector3( 189, 137, 96 ), new THREE.Vector3( 201, 171, 114 ) ]
	};

function RockAssemble () {
	this.core  		= null; //core rock reference
	this.crack 		= [];   //crack rock array

    this.pos 		= new THREE.Vector3(0,1,0);
    this.bound 		= new THREE.Box3(new THREE.Vector3( -0.0, -0.0, -0.0 ), new THREE.Vector3( +0.0, +0.0, +0.0 ));
}

function RockCrack () {
    this.type 		= 0;    //0 - drop, 1 - orbit
    this.mode 		= 0;	  //0 - attached, 1 - detached
    this.mesh 		= null; //rock mesh

    this.pos 		= new THREE.Vector3(0,0,0); //offset to its root position
    this.axis 		= new THREE.Vector3(0,1,0); //rotation axis - default to y axis
    this.vel  		= new THREE.Vector3(0,0,0); //rotation velocity
    this.speed		= 0;						//current rotation speed
    this.maxSpeed 	= 0;						//maximum rotation speed
    //this.bound 		= new THREE.Box3(new THREE.Vector3( -0.0, -0.0, -0.0 ), new THREE.Vector3( +0.0, +0.0, +0.0 ));
}

function RockCore () {
	this.mesh 		= null; //rock mesh
	this.vel 		= new THREE.Vector3(0,0,0);
    this.axis 		= new THREE.Vector3(0,1,0);
    this.vel  		= new THREE.Vector3(0,0,0);
    this.speed		= 0;
    this.maxSpeed 	= 0;
}

//update position when dropping down or 
//RockAssemble.prototype.update = function() {
//
//};

//RockAssemble.prototype.getInfo = function() {
//};

function LoadMat( texDiffuse, texNormal, name ){
	var shader 	 = THREE.ShaderPBR[ name ];
	var uniforms = THREE.UniformsUtils.clone( shader.uniforms );

	uniforms[ "uBaseColorMap" ].value 		= THREE.ImageUtils.loadTexture( "textures/" + texDiffuse );
	uniforms[ "uBaseColorMap" ].value.wrapS = THREE.RepeatWrapping;
	uniforms[ "uBaseColorMap" ].value.wrapT = THREE.RepeatWrapping;
	
	uniforms[ "uNormalMap" ].value    		= THREE.ImageUtils.loadTexture( "textures/" + texNormal  );
	uniforms[ "uNormalMap" ].value.wrapS 	= THREE.RepeatWrapping;
	uniforms[ "uNormalMap" ].value.wrapT 	= THREE.RepeatWrapping;
	
	uniforms[ "uRoughness" ].value    	= 0.8;	
	uniforms[ "uMetallic"  ].value    	= 0.3;	
	uniforms[ "uSpecular"  ].value    	= 0.3;	
	uniforms[ "uDetails"   ].value    	= 1.0;	
			
	uniforms[ "uExposure"  ].value    	= 6.3375;
	uniforms[ "uGamma" 	   ].value    	= 2.2;
			
	uniforms[ "uBaseColor"].value     	= new THREE.Color( 0x413e3c );
	
	uniforms[ "uLightPositions"].value	= [ new THREE.Vector3( -200, 60, -200 ), new THREE.Vector3( 200, 0, 200 ) ];
	uniforms[ "uLightRadiuses"].value   = [ 25.0, 25.0 ];
	uniforms[ "uLightColors" ].value	= [ new THREE.Vector3( 119, 132, 153 ), new THREE.Vector3( 73, 84, 104 ) ];
					
	var parameters = { fragmentShader: shader.fragmentShader, vertexShader: shader.vertexShader, uniforms: uniforms, lights: false, fog: true };
	rockMat = new THREE.ShaderMaterial( parameters );

	
	/*var manager = new THREE.LoadingManager();
	manager.onProgress = function ( item, loaded, total ) { };
	var loader = new THREE.ImageLoader( manager );
	
	// texture
	var texture = new THREE.Texture();
	
	loader.load( 'textures/' + texDiffuse, function ( image ) {
		texture.image = image;
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set( 1, 1 );
		texture.needsUpdate = true;
	} );

	rockMat = new THREE.MeshBasicMaterial();
	rockMat.map = texture;*/

	return rockMat;
}

function CreateRock( path, cnt, format, scale ){
	var manager = new THREE.LoadingManager();
	manager.onProgress = function ( item, loaded, total ) { };
	
	var rock = new RockAssemble();

	var matrix = new THREE.Matrix4;
	matrix.multiplyScalar(scale);

	var onProgress = function ( xhr ) {
		//if ( xhr.lengthComputable ) {
			//var percentComplete = xhr.loaded / xhr.total * 100;
			//trace( Math.round(percentComplete, 2) + '% downloaded' );
		//}
	};

	var onError = function ( xhr ) { trace("file not found"); };

	// model
	var loader = new THREE.OBJLoader( manager );
	for (var i = 2; i <= cnt; i++) {
		var str = "models/" + path + i + format;
		loader.load( str, function ( object ) {
			object.traverse( function ( child ) {
				if ( child instanceof THREE.Mesh ) {
					child.material = rockMat;
					child.applyMatrix(matrix);
					var crack = new RockCrack();
					child.geometry.computeBoundingBox ();
					rock.bound.union(child.geometry.boundingBox);
					crack.mesh = child;
					rock.crack.push(crack);
					scene.add(child);
				}
			} );
		}, onProgress, onError );
	};

	return rock;
}

function CreateRockGUI(){

	var gui = new dat.GUI();

	gui.add( rockConfig, 'uRoughness', 0.0, 1.0 ).onChange( function() {
		rockMat.uRoughness = rockConfig.uRoughness;
	});

	gui.add( rockConfig, 'uMetallic', 0.0, 1.0 ).onChange( function() {
		rockMat.uMetallic = rockConfig.uMetallic;
	});

	gui.add( rockConfig, 'uSpecular', 0.0, 1.0 ).onChange( function() {
		rockMat.uSpecular = rockConfig.uSpecular;
	});

	gui.add( rockConfig, 'uDetails', 0.0, 1.0 ).onChange( function() {
		rockMat.uDetails = rockConfig.uDetails;
	});

	gui.add( rockConfig, 'uExposure', 0.0, 10.0 ).onChange( function() {
		rockMat.uExposure = rockConfig.uExposure;
	});

	gui.add( rockConfig, 'uGamma', 1.0, 3.0 ).onChange( function() {
		rockMat.uGamma = rockConfig.uGamma;
	});

	/*gui.add( rockConfig, 'uBaseColor' ).onChange( function() {
		rockMat.uBaseColor = rockConfig.uBaseColor;
	});*/

	/*gui.add( rockConfig, 'uLightPositions[0]' ).onChange( function() {
		rockMat.uLightPositions[0] = rockConfig.uLightPositions[0];
	});

	gui.add( rockConfig, 'uLightPositions[1]' ).onChange( function() {
		rockMat.uLightPositions[1] = rockConfig.uLightPositions[1];
	});

	gui.add( rockConfig, 'uLightColors[0]' ).onChange( function() {
		rockMat.uLightColors[0] = rockConfig.uLightColors[0];
	});

	gui.add( rockConfig, 'uLightColors[1]' ).onChange( function() {
		rockMat.uLightColors[1] = rockConfig.uLightColors[1];
	});*/

	/*gui.add( rockConfig, 'uLightRadiuses[0]', 0.0, 100.0 ).onChange( function() {
		rockMat.uLightRadiuses[0] = rockConfig.uLightRadiuses0;
	});

	gui.add( rockConfig, 'uLightRadiuses[1]', 0.0, 100.0 ).onChange( function() {
		rockMat.uLightRadiuses[1] = rockConfig.uLightRadiuses1;
	});*/
	gui.close();

	return gui;
}