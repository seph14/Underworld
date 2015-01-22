'use strict';

var rockMat;
var coreMat;
var rockParticle;

var rockConfig = {
		distThreshold 	: 800,
		rockParticleCnt	: 5000,
		terrainLevel	: -400
		/*uRoughness : 1.0,
		uMetallic  : 0.2,
		uSpecular  : 0.1,
		uDetails   : 1.0,
		uExposure  : 6.3375,
		uGamma	   : 2.2,
		uBaseColor : new THREE.Color( 0x413e3c ),
		uLightPositions : [ new THREE.Vector3( 0, 300, 0 ), new THREE.Vector3( 200, 0, 200 ) ],
		uLightRadiuses0 : 5.0,
		uLightRadiuses1 : 5.0,
		uLightColors 	: [ new THREE.Vector3( 189, 137, 96 ), new THREE.Vector3( 201, 171, 114 ) ]*/
	};

function RockAssemble () {
	this.core  		= null; //core rock reference
	this.crack 		= [];   //crack rock array
	this.crackMesh	= [];   //crack rock mesh, for raycasting
	
	this.target 	= 1.0;
	this.scaler 	= 1.0;
	this.speed 		= 0.1;
	this.breakPer	= 0.0;	//break percentage
    this.pos 		= new THREE.Vector3(0,0,0);
    this.bound 		= new THREE.Box3(new THREE.Vector3( -0.0, -0.0, -0.0 ), new THREE.Vector3( +0.0, +0.0, +0.0 ));
}

//particle structures
function RockParticle(){
	this.particleCloud;
	this.firstAvailable   = 0;
	this.cnt 			  = 5000;
	this.enabled 		  = false;
	this.particleVelocity = [];
	this.particlePosition = [];
	this.particleMass 	  = [];
	this.particleColor 	  = [];
	this.particleSize 	  = [];
}

/*function RockParticle () {
	this.size 		= 1.0;
	this.dead 		= false;
	this.droprate 	= 0.008 + 0.012 * Math.random();
	this.velocity	= new THREE.Vector3(0,0,0);
	this.position 	= new THREE.Vector3(0,0,0);
	var m 			= 0.2 + 0.4 * Math.random();
	this.mass 		= new THREE.Vector3( 0, - 15.0/m, 0 ); 
}*/

function RockCrack () {
   	this.idx 		= 0;
    this.type 		= 0;    //0 - drop, 1 - orbit
    this.mode 		= 0;	//0 - attached, 1 - detached
    this.mesh 		= null; //rock mesh

    this.offset 	= new THREE.Vector3(0,0,0); //mesh offset to zero
    this.pos 		= new THREE.Vector3(0,0,0); //offset to its root position
    this.rotAxis 	= new THREE.Vector3(0,1,0); //rotation axis - default to y axis
    this.rotSpeed  	= 0.0; 						//rotation speed
    this.rotTarget	= 0.0;						//rotation target speed
    this.revAxis 	= new THREE.Vector3(0,1,0); //revolution axis - default to y axis
    this.velocity  	= new THREE.Vector3(0,0,0); //revolution velocity
    this.speed		= 0;						//current rotation speed
    this.maxSpeed 	= 0;						//maximum rotation speed
}

function RockCore () {
	this.mesh 		= null; //rock mesh
	this.velocity 	= new THREE.Vector3(0,0,0);
    this.rotAxis 	= new THREE.Vector3(0,1,0);
    this.speed		= 0;
    this.maxSpeed 	= 0;
}

//update position when dropping down or 
RockAssemble.prototype.update = function() {
	
	this.scaler += (this.target - this.scaler) * this.speed;
	if( Math.abs( this.scaler - this.target ) < 0.01 ){
		if( this.target < 0.5 ){
			this.target    = 1.0;
			this.speed     = 0.09;
		}
	}

	if( this.breakPer > 1.0 ){
		this.pos.y += this.scaler * 0.2;
		this.core.update( this.pos, this.scaler );
	}
	for( var i = this.crack.length-1; i >= 0; i-- ){
		this.crack[i].update( this.pos, this.scaler );
	}
};

RockAssemble.prototype.cast = function( raycaster ) {
	if( this.breakPer > 1.0 ) return false;

	//var intersects = raycaster.intersectObjects( this.crackMesh );
	//if( intersects.length <= 0 ) return false;

	var intersects = raycaster.intersectObject( this.core.mesh );
	if( intersects.length <= 0 ) return false;
	if( intersects[0].distance >= FAR ) return false;
	//if( intersects[0].point) ) return false;

	var pos  = intersects[0].point;
	var dist = new THREE.Vector3;
	var cnt  = 35;
	//this.scaler    = 0.01;
	this.target    = 0.0;
	this.speed     = 0.3;
	this.breakPer += 0.45;

	rockParticle.drop( pos, this.pos, Math.floor(200 + 100 * Math.random()) );

	for( var i = (this.crack.length-1); i >= 0; i-- ){
		if( this.crack[i].mode >= 1.0 ) continue;
		dist.addVectors(this.crack[i].offset, this.pos);
		dist.sub(pos);
		var len = dist.lengthSq();
		if( len < rockConfig.distThreshold ){
			this.crack[i].detach( Math.random() < 0.3 );
			cnt --;
			if(cnt < 0) break;
		}
	}

	if( (this.breakPer > 1.0)  || 
		( (this.breakPer > 0.5) && (Math.random() < 0.3 * this.breakPer) ) ){
		for( var i = (this.crack.length-1); i >= 0; i-- ){
			if( this.crack[i].mode < 1.0 )
				this.crack[i].detach( Math.random() < 0.5 );
		}
		this.breakPer = 1.1;
	}

	return true;
};

RockCrack.prototype.detach = function( outburst ){
	this.mode = 1.0;
	this.pos  = this.offset;
	if(outburst){
		this.pos.multiplyScalar( 0.5 + Math.random() * 0.7 );		
		this.rotSpeed *= 1.0 + Math.random();
	}else{
		this.pos.multiplyScalar( 0.2 + Math.random() * 0.8 );		
	}
}

RockCrack.prototype.update = function( position, scaler ) {
	if( this.mode < 1 ) return;

	//rotation
	this.rotSpeed		 += (this.rotTarget - this.rotSpeed) * 0.04;
	this.mesh.rotation.x += scaler * this.rotSpeed * this.rotAxis.x;
	this.mesh.rotation.y += scaler * this.rotSpeed * this.rotAxis.y;
	this.mesh.rotation.z += scaler * this.rotSpeed * this.rotAxis.z;

	//revolution	
	var prerad  = this.maxSpeed / this.speed / this.speed;
	this.speed += ( this.maxSpeed - this.speed ) * 0.002;
	var currad  = this.maxSpeed / this.speed / this.speed;

	var ang     = Math.atan2( this.pos.z, this.pos.x );
	var omega 	= this.speed / currad;
	ang 		+= scaler * omega;

	this.velocity.x = this.pos.x;
	this.velocity.z = this.pos.z;

	this.pos.x  = 0.95 * this.pos.x + 0.5 * currad * Math.cos(ang);
	this.pos.z  = 0.95 * this.pos.z + 0.5 * currad * Math.sin(ang);

	this.velocity.x = this.pos.x - this.velocity.x;
	this.velocity.z = this.pos.z - this.velocity.z;
	this.mesh.position.set( position.x + this.pos.x + this.offset.x, 
							position.y + this.pos.y + this.offset.y, 
							position.z + this.pos.z + this.offset.z );
};

RockCore.prototype.update = function( pos, scaler ) {
	this.speed		+= (this.maxSpeed - this.speed) * 0.005;
	this.mesh.rotation.x += scaler * this.speed * this.rotAxis.x;
	this.mesh.rotation.y += scaler * this.speed * this.rotAxis.y;
	this.mesh.rotation.z += scaler * this.speed * this.rotAxis.z;
	this.mesh.position.x  = pos.x;
	this.mesh.position.y  = pos.y;
	this.mesh.position.z  = pos.z;
};

RockParticle.prototype.drop   = function( point, center, cnt ) {
	if( this.firstAvailable >= this.cnt ) return false;

	this.enabled = true;
	
	var idx 	= this.firstAvailable;
	var vel 	= new THREE.Vector3;
	vel.subVectors(point, center);
	vel.normalize();
	var ran 	= new THREE.Vector3;
	var axis 	= new THREE.Vector3(Math.random()-0.5,
									Math.random()-0.5,
									Math.random()-0.5);
	axis.cross( vel );
	axis.normalize();

	for( var i = 0; i < cnt; i++ ){
		this.particlePosition[3*idx+0] = point.x;
		this.particlePosition[3*idx+1] = point.y;
		this.particlePosition[3*idx+2] = point.z;

		ran.x 	= vel.x; ran.y 	= vel.y; ran.z 	= vel.z;
		axis.x 	= Math.random()-0.5;
		axis.y 	= Math.random()-0.5;
		axis.z 	= Math.random()-0.5;
		axis.cross( vel );
		axis.normalize();
		ran.applyAxisAngle (axis, Math.random() * Math.PI / 6 );
		
		this.particleVelocity[3*idx+0] = ran.x * 0.5; 
		this.particleVelocity[3*idx+1] = ran.y * 0.5; 
		this.particleVelocity[3*idx+2] = ran.z * 0.5; 

		for( ; idx < this.cnt; idx++ ){
			if( this.particlePosition[3*idx+1] <= rockConfig.terrainLevel ){
				break;
			}
		}
		if( idx >= this.cnt ) break;
	}

	return true;
}

RockParticle.prototype.update = function( scaler ) {
	if( this.enabled ){
		this.enabled 		= false;
		this.firstAvailable = this.cnt + 1;
		for( var i = 0; i < this.cnt; i++ ){
			if( this.particlePosition[3*i+1] > rockConfig.terrainLevel ){
				this.particleVelocity[3*i+1] -= this.particleMass[i] * 0.008;
				this.particlePosition[3*i+0] += scaler * this.particleVelocity[3*i+0];
				this.particlePosition[3*i+1] += scaler * this.particleVelocity[3*i+1];
				this.particlePosition[3*i+2] += scaler * this.particleVelocity[3*i+2];
				this.enabled = true;
			}else{
				this.firstAvailable = Math.min( this.firstAvailable, i );
			}
		}
	}

	if( this.enabled ){
		this.particleCloud.geometry.addAttribute( 'position', 	
			new THREE.BufferAttribute( this.particlePosition, 3 ) );
		this.particleCloud.geometry.addAttribute( 'color', 	
			new THREE.BufferAttribute( this.particleColor,    3 ) );
		this.particleCloud.geometry.addAttribute( 'size', 		
			new THREE.BufferAttribute( this.particleSize, 	  1 ) );
		this.particleCloud.geometry.computeBoundingSphere();
	}

	this.particleCloud.visible = this.enabled;
}

function LoadLightMat( texDiffuse, texNormal ){
	var shader 	 = THREE.ShaderPBR[ "PBR_Bump" ];
	var uniforms = THREE.UniformsUtils.clone( shader.uniforms );

	uniforms[ "uBaseColorMap" ].value 		= THREE.ImageUtils.loadTexture( "textures/" + texDiffuse );
	uniforms[ "uBaseColorMap" ].value.wrapS = THREE.RepeatWrapping;
	uniforms[ "uBaseColorMap" ].value.wrapT = THREE.RepeatWrapping;
	uniforms[ "uBaseColorMap" ].value.repeat.set( 2, 2 );
		
	uniforms[ "uNormalMap" ].value    		= THREE.ImageUtils.loadTexture( "textures/" + texNormal  );
	uniforms[ "uNormalMap" ].value.wrapS 	= THREE.RepeatWrapping;
	uniforms[ "uNormalMap" ].value.wrapT 	= THREE.RepeatWrapping;
	uniforms[ "uNormalMap" ].value.repeat.set( 2, 2 );
	
	uniforms[ "uRoughness" ].value    	= 0.8;	
	uniforms[ "uMetallic"  ].value    	= 0.3;	
	uniforms[ "uSpecular"  ].value    	= 0.3;	
	uniforms[ "uDetails"   ].value    	= 1.0;	
			
	uniforms[ "uExposure"  ].value    	= 6.3375;
	uniforms[ "uGamma" 	   ].value    	= 2.2;
			
	uniforms[ "uBaseColor"].value     	= new THREE.Color( 0x413e3c );
		
	var parameters = { fragmentShader: 	shader.fragmentShader, 
					   vertexShader: 	shader.vertexShader, 
					   uniforms: 		uniforms, 
					   lights: 			true, 
					   fog: 			true,
					   morphTargets:    false,
					   morphNormals:    false,
					   shading: 		THREE.SmoothShading };
	rockMat = new THREE.ShaderMaterial( parameters );


	var shadermono 	 = THREE.ShaderPBR[ "PBR_Color" ];
	var uniformsmono = THREE.UniformsUtils.clone( shadermono.uniforms );

	uniformsmono[ "uRoughness" ].value    	= 1.0;	
	uniformsmono[ "uMetallic"  ].value    	= 1.0;	
	uniformsmono[ "uSpecular"  ].value    	= 1.0;	
			
	uniformsmono[ "uExposure"  ].value    	= 19.3375;
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
	coreMat = new THREE.ShaderMaterial( parametersmono );

	return rockMat;
}

function LoadEnvCubeMat( texDiffuse, texNormal ){
	var shader 	 = THREE.ShaderPBR[ "PBR_Env_Bump" ];
	var uniforms = THREE.UniformsUtils.clone( shader.uniforms );

	var path = "textures/envmap/";
	var format = '.png';
	var urls = [
		path + 'px' + format, path + 'nx' + format,
		path + 'py' + format, path + 'ny' + format,
		path + 'pz' + format, path + 'nz' + format
	];
	var textureCube = THREE.ImageUtils.loadTextureCube( urls, new THREE.CubeRefractionMapping() );
	
	uniforms[ "uBaseColorMap" ].value 		= THREE.ImageUtils.loadTexture( "textures/" + texDiffuse );
	uniforms[ "uBaseColorMap" ].value.wrapS = THREE.RepeatWrapping;
	uniforms[ "uBaseColorMap" ].value.wrapT = THREE.RepeatWrapping;
	uniforms[ "uBaseColorMap" ].value.repeat.set( 1, 1 );
		
	uniforms[ "uNormalMap" ].value    		= THREE.ImageUtils.loadTexture( "textures/" + texNormal  );
	uniforms[ "uNormalMap" ].value.wrapS 	= THREE.RepeatWrapping;
	uniforms[ "uNormalMap" ].value.wrapT 	= THREE.RepeatWrapping;
	uniforms[ "uNormalMap" ].value.repeat.set( 1, 1 );
	
	uniforms[ "uCubeMapTex" ].value 		= textureCube;
	uniforms[ "uRoughness" ].value    		= 0.8;	
	uniforms[ "uRoughness4" ].value    		= 0.8 * 0.8 * 0.8 * 0.8;	
	uniforms[ "uMetallic"  ].value    		= 0.3;	
	uniforms[ "uSpecular"  ].value    		= 0.3;	
	uniforms[ "uExposure"  ].value    		= 6.3375;
	uniforms[ "uGamma" 	   ].value    		= 2.2;			
	uniforms[ "uBaseColor"].value     		= new THREE.Color( 0x251a22 );		
		
	var parameters = { fragmentShader: 	shader.fragmentShader, 
					   vertexShader: 	shader.vertexShader, 
					   uniforms: 		uniforms, 
					   lights: 			false, //temporarily disable lights - tests for performance 
					   fog: 			true,
					   morphTargets:    false,
					   morphNormals:    false,
					   shading: 		THREE.SmoothShading };
	rockMat = new THREE.ShaderMaterial( parameters );


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
	coreMat = new THREE.ShaderMaterial( parametersmono );

	return rockMat;
}

//use a point cloud as the particle mesh holder
function PrepareRockParticle( cnt, scaleMin, scaleMax ){
	rockConfig.rockParticleCnt 		= cnt;
	
	rockParticle 					= new RockParticle();
	rockParticle.cnt 				= cnt;
	var geometry 					= new THREE.BufferGeometry();
	rockParticle.particleVelocity 	= new Float32Array( cnt * 3 );
	rockParticle.particlePosition 	= new Float32Array( cnt * 3 );
	rockParticle.particleMass 		= new Float32Array( cnt * 1 );
	rockParticle.particleColor 		= new Float32Array( cnt * 3 );
	rockParticle.particleSize 		= new Float32Array( cnt * 1 );

	var color 			= new THREE.Color(0x67535e);
	//color.setHSL( 0.908, 0.3, 0.11 );
	//need to randomize this later

	for ( var i = 0; i < cnt; i ++ ) {
		//velocity, default to 0
		rockParticle.particleVelocity[3*i+0] = 0;
		rockParticle.particleVelocity[3*i+1] = 0;
		rockParticle.particleVelocity[3*i+2] = 0;
		//position, default below terrain
		rockParticle.particlePosition[3*i+0] = 0;
		rockParticle.particlePosition[3*i+1] = -800; //make it beneath terrain
		rockParticle.particlePosition[3*i+2] = 0;
		//mass, randomize
		rockParticle.particleMass[i]	= Math.random() * 0.5 + 0.5;
		//color, random in hsl
		//color.setHSL( 0.85 + 0.1 * Math.random(), 0.3, 0.11 );
		rockParticle.particleColor[3*i+0] = color.r;
		rockParticle.particleColor[3*i+1] = color.g;
		rockParticle.particleColor[3*i+2] = color.b;
		//size, randomize
		rockParticle.particleSize[i]	  = scaleMin + Math.random() * (scaleMax - scaleMin);
	}

	geometry.addAttribute( 'position', 	
		new THREE.BufferAttribute( rockParticle.particlePosition, 3 ) );
	geometry.addAttribute( 'color', 	
		new THREE.BufferAttribute( rockParticle.particleColor,    3 ) );
	geometry.addAttribute( 'size', 		
		new THREE.BufferAttribute( rockParticle.particleSize, 	  1 ) );
	geometry.computeBoundingSphere();

	var material  = new THREE.PointCloudMaterial( 
		{ size: (scaleMin + Math.random() * (scaleMax - scaleMin)), vertexColors: THREE.VertexColors } ); 
		//need to make a customized shader for different sizes

	rockParticle.particleCloud = new THREE.PointCloud( geometry, material );
	rockParticle.particleCloud.visible = false;
	scene.add( rockParticle.particleCloud );
}

function LoadRockParticle( cnt, max, scaleMin, scaleMax ){
	//temp meshes - need simpler ones
	var manager = new THREE.LoadingManager();
	manager.onProgress = function ( item, loaded, total ) { };
	var loader = new THREE.OBJLoader( manager );

	var onProgress 	= function ( xhr ) { };
	var onError 	= function ( xhr ) { trace("file not found"); };
	var matrix 		= new THREE.Matrix4;

	var root = "models/RockHollow" + 0 + "/Rock";
	for (var i = 1; i <= cnt; i++) {
		var str = root + Math.floor(max * Math.random()) + ".obj";
		loader.load( str, function ( object ) {
			object.traverse( function ( child ) {
				if ( child instanceof THREE.Mesh ) {
					child.material = rockMat;
					var scale = scaleMin + Math.random() * (scaleMax - scaleMin);	
					matrix.makeScale(scale, scale, scale);
					child.geometry.applyMatrix(matrix);
					child.geometry.computeBoundingBox ();
					var center = child.geometry.boundingBox.center();
					child.geometry.applyMatrix( 
						new THREE.Matrix4().makeTranslation( - center.x, - center.y, - center.z ) );
					particleMesh.push(child);	
				}
			});
		}, onProgress, onError );
	}
}

//TODO: need to compile OBJs into json files for fast loading
function CreateRock( idx, cnt, scale, pos ){
	var manager = new THREE.LoadingManager();
	manager.onProgress = function ( item, loaded, total ) { };
	
	var rock = new RockAssemble();
	rock.pos = pos;

	var matrix = new THREE.Matrix4;
	matrix.multiplyScalar(scale);

	var onProgress 	= function ( xhr ) { };
	var onError 	= function ( xhr ) { trace("file not found"); };

	// model
	var loader = new THREE.OBJLoader( manager );

	var cidx = 0;
	var root = "models/RockHollow" + idx + "/Rock";
	for (var i = 1; i <= cnt; i++) {
		var str = root + i + ".obj";
		loader.load( str, function ( object ) {
			object.traverse( function ( child ) {
				if ( child instanceof THREE.Mesh ) {
					child.material = rockMat;				
					child.geometry.applyMatrix(matrix);
					child.geometry.computeBoundingBox ();
					
					var crack 	 	= new RockCrack();
					crack.idx 		= cidx ++;
					crack.offset 	= child.geometry.boundingBox.center();
					
					child.geometry.applyMatrix( new THREE.Matrix4().makeTranslation( - crack.offset.x, - crack.offset.y, - crack.offset.z ) );
					child.position.set( pos.x + crack.offset.x, 
										pos.y + crack.offset.y, 
										pos.z + crack.offset.z );
					child.castShadow 	= true;
				
					crack.mesh 	 	= child;
					crack.rotAxis.set( Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5 );
					crack.rotAxis.normalize();
					crack.rotTarget = 0.005 + 0.05 * Math.random();
					crack.rotSpeed	= (1 + 9 * Math.random()) * crack.rotTarget;
					crack.maxSpeed  = 0.075 + 0.35 * Math.random();
					crack.speed 	= 2 * crack.maxSpeed;
					
					rock.bound.union(child.geometry.boundingBox);
					rock.crackMesh.push(child);
					rock.crack.push(crack);
					scene.add(child);
				}
			} );
		}, onProgress, onError );
	}

	var str = "models/Monolite" + idx + ".obj";
	loader.load( str, function ( object ) {
		object.traverse( function ( child ) {
			if ( child instanceof THREE.Mesh ) {
				child.material = coreMat;
				child.geometry.applyMatrix(matrix);
				child.receiveShadow = false; 
				child.castShadow 	= true;
				child.position.set( pos.x, pos.y, pos.z );
				child.geometry.computeBoundingBox ();

				var core = new RockCore();
				core.mesh = child;
				core.mesh.rotation.y = 1.3; //somehow the rotation is off
				core.maxSpeed = 0.005 + 0.0125 * Math.random();
				rock.core = core;
				scene.add(child);
			}
		} );
	}, onProgress, onError );

	return rock;
}

function CreateRockGUI(){

	var gui = new dat.GUI();

	gui.add( rockConfig, 'distThreshold', 0.0, 5000.0 ).onChange( function() {
	});


	/*gui.add( rockConfig, 'uRoughness', 0.0, 1.0 ).onChange( function() {
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