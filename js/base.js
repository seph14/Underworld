'use strict';

var terrainMatA, terrainMatD, charMat;

function LoadTerrainMatLight(){
	var shader 	 = THREE.ShaderPBR[ "PBR_Bump" ];
	var uniforms = THREE.UniformsUtils.clone( shader.uniforms );

	uniforms[ "uBaseColorMap" ].value 		= THREE.ImageUtils.loadTexture( "textures/QuantumArid_Diffuse_A.png" );
	uniforms[ "uBaseColorMap" ].value.wrapS = THREE.RepeatWrapping;
	uniforms[ "uBaseColorMap" ].value.wrapT = THREE.RepeatWrapping;
	uniforms[ "uBaseColorMap" ].value.repeat.set( 2, 2 );
		
	uniforms[ "uNormalMap" ].value    		= THREE.ImageUtils.loadTexture( "textures/QuantumArid_Normal_A.png"  );
	uniforms[ "uNormalMap" ].value.wrapS 	= THREE.RepeatWrapping;
	uniforms[ "uNormalMap" ].value.wrapT 	= THREE.RepeatWrapping;
	uniforms[ "uNormalMap" ].value.repeat.set( 2, 2 );
	
	uniforms[ "uRoughness" ].value    	= 0.8;	
	uniforms[ "uMetallic"  ].value    	= 0.3;	
	uniforms[ "uSpecular"  ].value    	= 0.3;	
	uniforms[ "uDetails"   ].value    	= 1.0;	
			
	uniforms[ "uExposure"  ].value    	= 6.3375;
	uniforms[ "uGamma" 	   ].value    	= 2.2;
			
	uniforms[ "uBaseColor"].value     	= new THREE.Color( 0x09090b );
	
	var parameters = { fragmentShader: 	shader.fragmentShader, 
					   vertexShader: 	shader.vertexShader, 
					   uniforms: 		uniforms, 
					   lights: 			true, 
					   fog: 			true,
					   morphTargets:    false,
					   morphNormals:    false,
					   shading: 		THREE.SmoothShading };
	terrainMatA = new THREE.ShaderMaterial( parameters );

	uniforms = THREE.UniformsUtils.clone( shader.uniforms );

	uniforms[ "uBaseColorMap" ].value 		= THREE.ImageUtils.loadTexture( "textures/QuantumArid_Diffuse_D.png" );
	uniforms[ "uBaseColorMap" ].value.wrapS = THREE.RepeatWrapping;
	uniforms[ "uBaseColorMap" ].value.wrapT = THREE.RepeatWrapping;
	uniforms[ "uBaseColorMap" ].value.repeat.set( 2, 2 );
		
	uniforms[ "uNormalMap" ].value    		= THREE.ImageUtils.loadTexture( "textures/QuantumArid_Normal_D.png"  );
	uniforms[ "uNormalMap" ].value.wrapS 	= THREE.RepeatWrapping;
	uniforms[ "uNormalMap" ].value.wrapT 	= THREE.RepeatWrapping;
	uniforms[ "uNormalMap" ].value.repeat.set( 2, 2 );
	
	uniforms[ "uRoughness" ].value    	= 0.8;	
	uniforms[ "uMetallic"  ].value    	= 0.3;	
	uniforms[ "uSpecular"  ].value    	= 0.3;	
	uniforms[ "uDetails"   ].value    	= 1.0;	
			
	uniforms[ "uExposure"  ].value    	= 6.3375;
	uniforms[ "uGamma" 	   ].value    	= 2.2;
			
	uniforms[ "uBaseColor"].value     	= new THREE.Color( 0x09090b );

	var parametersD 	= { fragmentShader: shader.fragmentShader, 
						   vertexShader: 	shader.vertexShader, 
						   uniforms: 		uniforms, 
						   lights: 			true, 
					       fog: 			true,
					       morphTargets:    false,
					       morphNormals:    false,
					       shading: 		THREE.SmoothShading };
	terrainMatD = new THREE.ShaderMaterial( parametersD );

	var shadermono 	 = THREE.ShaderPBR[ "PBR_Color" ];
	var uniformsmono = THREE.UniformsUtils.clone( shadermono.uniforms );

	uniformsmono[ "uRoughness" ].value    	= 1.0;	
	uniformsmono[ "uMetallic"  ].value    	= 0.8;	
	uniformsmono[ "uSpecular"  ].value    	= 1.0;	
			
	uniformsmono[ "uExposure"  ].value    	= 15.3375;
	uniformsmono[ "uGamma" 	   ].value    	= 2.2;
			
	uniformsmono[ "uBaseColor"].value     	= new THREE.Color( 0xffffff );
		
	var parametersmono = { fragmentShader: 	shadermono.fragmentShader, 
						   vertexShader: 	shadermono.vertexShader, 
						   uniforms: 		uniformsmono, 
						   lights: 			true, 
					       fog: 			true,
					       morphTargets:    false,
					       morphNormals:    false,
					       shading: 		THREE.SmoothShading };
	charMat = new THREE.ShaderMaterial( parametersmono );
}

function LoadTerrainMatEnvMap(){
	//var path = "textures/envmap_terrain/";
	var path = "textures/envmap_blueish/";
	var format = '.png';
	var urls = [
		path + 'px' + format, path + 'nx' + format,
		path + 'py' + format, path + 'ny' + format,
		path + 'pz' + format, path + 'nz' + format
	];
	var textureCube = THREE.ImageUtils.loadTextureCube( urls, new THREE.CubeRefractionMapping() );
	
	var shader 	 = THREE.ShaderPBR[ "PBR_Env_Bump" ];
	var uniforms = THREE.UniformsUtils.clone( shader.uniforms );

	uniforms[ "uBaseColorMap" ].value 		= THREE.ImageUtils.loadTexture( "textures/QuantumArid_Diffuse_A.png" );
	uniforms[ "uBaseColorMap" ].value.wrapS = THREE.RepeatWrapping;
	uniforms[ "uBaseColorMap" ].value.wrapT = THREE.RepeatWrapping;
	uniforms[ "uBaseColorMap" ].value.repeat.set( 2, 2 );
		
	uniforms[ "uNormalMap" ].value    		= THREE.ImageUtils.loadTexture( "textures/QuantumArid_Normal_A.png"  );
	uniforms[ "uNormalMap" ].value.wrapS 	= THREE.RepeatWrapping;
	uniforms[ "uNormalMap" ].value.wrapT 	= THREE.RepeatWrapping;
	uniforms[ "uNormalMap" ].value.repeat.set( 2, 2 );
	
	uniforms[ "uCubeMapTex" ].value 	= textureCube;
	uniforms[ "uRoughness" ].value    	= 0.8;	
	uniforms[ "uRoughness4" ].value    	= 0.8 * 0.8 * 0.8 * 0.8;	
	uniforms[ "uMetallic"  ].value    	= 0.3;	
	uniforms[ "uSpecular"  ].value    	= 0.3;	
	uniforms[ "uDetails"   ].value    	= 1.0;	
			
	uniforms[ "uExposure"  ].value    	= 6.3375;
	uniforms[ "uGamma" 	   ].value    	= 2.2;
			
	uniforms[ "uBaseColor"].value     	= new THREE.Color( 0x09090b );
	
	var parameters = { fragmentShader: 	shader.fragmentShader, 
					   vertexShader: 	shader.vertexShader, 
					   uniforms: 		uniforms, 
					   lights: 			false, 
					   fog: 			true,
					   morphTargets:    false,
					   morphNormals:    false,
					   shading: 		THREE.SmoothShading };
	terrainMatA = new THREE.ShaderMaterial( parameters );

	uniforms = THREE.UniformsUtils.clone( shader.uniforms );

	uniforms[ "uBaseColorMap" ].value 		= THREE.ImageUtils.loadTexture( "textures/QuantumArid_Diffuse_D.png" );
	uniforms[ "uBaseColorMap" ].value.wrapS = THREE.RepeatWrapping;
	uniforms[ "uBaseColorMap" ].value.wrapT = THREE.RepeatWrapping;
	uniforms[ "uBaseColorMap" ].value.repeat.set( 2, 2 );
		
	uniforms[ "uNormalMap" ].value    		= THREE.ImageUtils.loadTexture( "textures/QuantumArid_Normal_D.png"  );
	uniforms[ "uNormalMap" ].value.wrapS 	= THREE.RepeatWrapping;
	uniforms[ "uNormalMap" ].value.wrapT 	= THREE.RepeatWrapping;
	uniforms[ "uNormalMap" ].value.repeat.set( 2, 2 );
	
	uniforms[ "uCubeMapTex" ].value 	= textureCube;
	uniforms[ "uRoughness" ].value    	= 0.8;	
	uniforms[ "uRoughness4" ].value    	= 0.8 * 0.8 * 0.8 * 0.8;	
	uniforms[ "uMetallic"  ].value    	= 0.3;	
	uniforms[ "uSpecular"  ].value    	= 0.3;	
	uniforms[ "uDetails"   ].value    	= 1.0;	
			
	uniforms[ "uExposure"  ].value    	= 6.3375;
	uniforms[ "uGamma" 	   ].value    	= 2.2;
			
	uniforms[ "uBaseColor"].value     	= new THREE.Color( 0x09090b );

	var parametersD 	= { fragmentShader: shader.fragmentShader, 
						   vertexShader: 	shader.vertexShader, 
						   uniforms: 		uniforms, 
						   lights: 			false, 
					       fog: 			true,
					       morphTargets:    false,
					       morphNormals:    false,
					       shading: 		THREE.SmoothShading };
	terrainMatD = new THREE.ShaderMaterial( parametersD );

	var shadermono 	 = THREE.ShaderPBR[ "PBR_Env" ];
	var uniformsmono = THREE.UniformsUtils.clone( shadermono.uniforms );

	uniformsmono[ "uCubeMapTex" ].value 	= textureCube;
	uniformsmono[ "uRoughness" ].value    	= 1.0;	
	uniformsmono[ "uRoughness4" ].value    	= 1.0 * 1.0 * 1.0 * 1.0;	
	uniformsmono[ "uMetallic"  ].value    	= 1.0;	
	uniformsmono[ "uSpecular"  ].value    	= 1.0;	
	uniformsmono[ "uExposure"  ].value    	= 16.3375;
	uniformsmono[ "uGamma" 	   ].value    	= 2.2;			
	uniformsmono[ "uBaseColor"].value     	= new THREE.Color( 0xffffff );
	
	var parametersmono = { fragmentShader: 	shadermono.fragmentShader, 
						   vertexShader: 	shadermono.vertexShader, 
						   uniforms: 		uniformsmono, 
						   lights: 			false, 
					       fog: 			true,
					       morphTargets:    false,
					       morphNormals:    false,
					       shading: 		THREE.SmoothShading };
	charMat = new THREE.ShaderMaterial( parametersmono );
}

function LoadTerrain( ){
	var manager = new THREE.LoadingManager();
	manager.onProgress = function ( item, loaded, total ) { 

		console.log(item, loaded, total);

	};
	
	var onProgress 	= function ( xhr ) { };
	var onError 	= function ( xhr ) { trace("file not found"); };

	var matrix = new THREE.Matrix4;
	matrix.multiplyScalar(1.0);
	// model
	var loader = new THREE.OBJLoader( manager );

	var url = "models/terrainA.obj";
	loader.load( url, function ( object ) {
		object.traverse( function ( child ) {
			if ( child instanceof THREE.Mesh ) {
				child.geometry.computeFaceNormals ();
				child.geometry.computeVertexNormals ();
				child.material = terrainMatA;
				child.geometry.applyMatrix(matrix);
				child.receiveShadow = true; 
				child.castShadow 	= true;
				scene.add(child);
			}
		} );
	}, onProgress, onError );

	var url = "models/terrainD.obj";
	loader.load( url, function ( object ) {
		object.traverse( function ( child ) {
			if ( child instanceof THREE.Mesh ) {
				child.geometry.computeFaceNormals ();
				child.geometry.computeVertexNormals ();
				child.material = terrainMatD;
				child.geometry.applyMatrix(matrix);
				child.receiveShadow = true; 
				child.castShadow 	= true;
				scene.add(child);
			}
		} );
	}, onProgress, onError );
}

function LoadDummy(){

	var manager = new THREE.LoadingManager();
	manager.onProgress = function ( item, loaded, total ) { };
	
	var onProgress 	= function ( xhr ) { };
	var onError 	= function ( xhr ) { trace("file not found"); };

	var matrix = new THREE.Matrix4;
	matrix.multiplyScalar(1.0);
	// model
	var loader = new THREE.OBJLoader( manager );

	var url = "models/dummy.obj";
	loader.load( url, function ( object ) {
		object.traverse( function ( child ) {
			if ( child instanceof THREE.Mesh ) {
				child.geometry.computeFaceNormals ();
				child.geometry.computeVertexNormals ();
				child.material = charMat;
				child.position.set( 0, 2, 0 );
				child.geometry.applyMatrix(matrix);
				child.receiveShadow = true; 
				child.castShadow 	= true;
				scene.add(child);
			}
		} );
	}, onProgress, onError );
}

//TODO: need to compile OBJs into json files for fast loading
function CreateBase01( ){
	var manager = new THREE.LoadingManager();
	manager.onProgress = function ( item, loaded, total ) { };
	
	var onProgress 	= function ( xhr ) { };
	var onError 	= function ( xhr ) { trace("file not found"); };

	var matrix = new THREE.Matrix4;
	matrix.multiplyScalar(0.1);
	// model
	var loader = new THREE.OBJLoader( manager );

	var cidx = 0;
	var url = "models/BaseScene/BaseScene_01.obj";

	loader.load( url, function ( object ) {
		object.traverse( function ( child ) {
			if ( child instanceof THREE.Mesh ) {
				child.geometry.computeFaceNormals ();
				child.geometry.computeVertexNormals ();
				//console.log( child.geometry );
				//if( child.geometry.vertices.length > 0 ){
						child.material = rockMat;
				child.geometry.applyMatrix(matrix);
				child.receiveShadow = true; 
				//child.castShadow 	= true; //TODO: fix this bug

				scene.add(child);
			
				//}
			}
		} );
	}, onProgress, onError );

}
