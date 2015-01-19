'use strict';

var rockMat;
var coreMat;
var particleMesh = [];

var rockConfig = {
		distThreshold : 800
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
	this.core  			= null; //core rock reference
	this.crack 			= [];   //crack rock array
	this.crackMesh		= [];   //crack rock mesh, for raycasting
	this.crackParticle	= [];	//crack rock particles

	this.breakPer	= 0.0;	//break percentage
    this.pos 		= new THREE.Vector3(0,0,0);
    this.bound 		= new THREE.Box3(new THREE.Vector3( -0.0, -0.0, -0.0 ), new THREE.Vector3( +0.0, +0.0, +0.0 ));
}

function RockParticle () {
	this.mesh 		= null;
	this.isdead 	= false;
	this.droprate 	= 0.008 + 0.012 * Math.random();
	this.velocity	= new THREE.Vector3(0,0,0);
	this.position 	= new THREE.Vector3(0,0,0);
	var m 			= 0.2 + 0.4 * Math.random();
	this.mass 		= new THREE.Vector3( 0, - 15.0/m, 0 ); 
	//console.log( this.droprate + "," + m );
}

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
	for( var i = this.crack.length-1; i >= 0; i-- ){
		this.crack[i].update();
	}
	var cnt = this.crackParticle.length;
	for( var i = 0; i < this.crackParticle.length; ){
		if( this.crackParticle[i].isdead ){
			scene.remove( this.crackParticle[i].mesh );
			this.crackParticle.remove(i);
		}else{
			this.crackParticle[i].update();
			i ++;
		}
	}
	if( this.breakPer > 1.0 ){
		this.core.update();
	}
};

RockAssemble.prototype.dropParticle = function( point ){
	var cnt 	= Math.floor(10 + 30 * Math.random()); 
	var offset 	= new THREE.Vector3();
	
	offset.subVectors(point, this.pos);
	for( var i = 0; i < cnt; i++ ){
		var particle 	= new RockParticle();
		var idx 		= Math.min( particleMesh.length-1, Math.floor(particleMesh.length * Math.random()) );
		particle.mesh  	= particleMesh[ idx ];
		particle.position.x = point.x + offset.x * 1.5 * ( Math.random() - 0.5 );
		particle.position.y = point.y + offset.y * 1.5 * ( Math.random() - 0.5 );
		particle.position.z = point.z + offset.z * 1.5 * ( Math.random() - 0.5 );
		particle.velocity.x = offset.x * 0.09 * ( Math.random() - 0.5 );
		particle.velocity.y = offset.y * 0.05 * ( Math.random() - 0.5 );
		particle.velocity.z = offset.z * 0.09 * ( Math.random() - 0.5 );
		
		scene.add(particle.mesh);
		this.crackParticle.push(particle);

		//not working ??
		setTimeout( 1500, function( particle){
			particle.countdown();
		});	
	}
}

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
	this.breakPer += 0.45;

	this.dropParticle(pos);

	for( var i = (this.crack.length-1); i >= 0; i-- ){
		if( this.crack[i].mode >= 1.0 ) continue;
		dist.subVectors(this.crack[i].offset, pos);
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

RockCrack.prototype.update = function( ) {
	if( this.mode < 1 ) return;

	//rotation
	this.rotSpeed		 += (this.rotTarget - this.rotSpeed) * 0.04;
	this.mesh.rotation.x += this.rotSpeed * this.rotAxis.x;
	this.mesh.rotation.y += this.rotSpeed * this.rotAxis.y;
	this.mesh.rotation.z += this.rotSpeed * this.rotAxis.z;

	//revolution	
	var prerad  = this.maxSpeed / this.speed / this.speed;
	this.speed += ( this.maxSpeed - this.speed ) * 0.002;
	var currad  = this.maxSpeed / this.speed / this.speed;

	var ang     = Math.atan2( this.pos.z, this.pos.x );
	var omega 	= this.speed / currad;
	ang 		+= omega;

	this.velocity.x = this.pos.x;
	this.velocity.z = this.pos.z;

	this.pos.x  = 0.95 * this.pos.x + 0.5 * currad * Math.cos(ang);
	this.pos.z  = 0.95 * this.pos.z + 0.5 * currad * Math.sin(ang);

	this.velocity.x = this.pos.x - this.velocity.x;
	this.velocity.z = this.pos.z - this.velocity.z;
	this.mesh.position.set( this.pos.x + this.offset.x, this.pos.y + this.offset.y, this.pos.z + this.offset.z );
};

RockCore.prototype.update = function() {
	this.speed		+= (this.maxSpeed - this.speed) * 0.005;
	this.mesh.rotation.x += this.speed * this.rotAxis.x;
	this.mesh.rotation.y += this.speed * this.rotAxis.y;
	this.mesh.rotation.z += this.speed * this.rotAxis.z;
};

RockParticle.prototype.countdown = function(){
	this.isdead = true;
}

RockParticle.prototype.update = function() {
	var tmp = new THREE.Vector3;
	tmp.subVectors(this.mass, this.velocity).multiplyScalar(this.droprate);
	//this.velocity.x = tmp.x;//this.velocity.x + this.droprate tmp.x;
	this.velocity.y = tmp.y;//Math.min( this.mass.y, this.velocity.y + this.droprate ); //tmp.y;
	//this.velocity.z = tmp.z;
	this.position.add(this.velocity);

	this.mesh.position.x = this.position.x;
	this.mesh.position.y = this.position.y;
	this.mesh.position.z = this.position.z;
}

function LoadMat( texDiffuse, texNormal, nameRock, nameMonolite ){
	var shader 	 = THREE.ShaderPBR[ nameRock ];
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
	
	//uniforms[ "uLightPositions"].value	= [ new THREE.Vector3( -200, 60, -200 ), new THREE.Vector3( 200, 0, 200 ) ];
	//uniforms[ "uLightRadiuses"].value   = [ 25.0, 25.0 ];
	//uniforms[ "uLightColors" ].value	= [ new THREE.Vector3( 119, 132, 153 ), new THREE.Vector3( 73, 84, 104 ) ];
					
	var parameters = { fragmentShader: 	shader.fragmentShader, 
					   vertexShader: 	shader.vertexShader, 
					   uniforms: 		uniforms, 
					   lights: 			true, 
					   fog: 			true,
					   morphTargets:    false,
					   morphNormals:    false,
					   shading: 		THREE.SmoothShading };
	rockMat = new THREE.ShaderMaterial( parameters );


	var shadermono 	 = THREE.ShaderPBR[ nameMonolite ];
	var uniformsmono = THREE.UniformsUtils.clone( shadermono.uniforms );

	uniformsmono[ "uRoughness" ].value    	= 1.0;	
	uniformsmono[ "uMetallic"  ].value    	= 1.0;	
	uniformsmono[ "uSpecular"  ].value    	= 1.0;	
			
	uniformsmono[ "uExposure"  ].value    	= 19.3375;
	uniformsmono[ "uGamma" 	   ].value    	= 2.2;
			
	uniformsmono[ "uBaseColor"].value     	= new THREE.Color( 0xffffff );
	
	//uniformsmono[ "uLightPositions"].value	= [ new THREE.Vector3( -200, 60, -200 ), new THREE.Vector3( 200, 0, 200 ) ];
	//uniformsmono[ "uLightRadiuses"].value   = [ 25.0, 25.0 ];
	//uniformsmono[ "uLightColors" ].value	= [ new THREE.Vector3( 119, 132, 153 ), new THREE.Vector3( 73, 84, 104 ) ];
					
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
function CreateRock( idx, cnt, scale ){
	var manager = new THREE.LoadingManager();
	manager.onProgress = function ( item, loaded, total ) { };
	
	var rock = new RockAssemble();

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
					child.position.set( crack.offset.x, crack.offset.y, crack.offset.z );
					child.castShadow 	= true;
				
					crack.mesh 	 	= child;
					crack.rotAxis.set( Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5 );
					crack.rotAxis.normalize();
					crack.rotTarget = 0.005 + 0.05 * Math.random();
					crack.rotSpeed	= (1 + 9 * Math.random()) * crack.rotTarget;
					crack.maxSpeed  = 0.035 + 0.15 * Math.random();
					crack.speed 	= 3 * crack.maxSpeed;
					
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
				child.receiveShadow = true; 
				//child.castShadow 	= true; //TODO: fix this bug
				//child.geometry.computeBoundingBox ();
				//var center 	= child.geometry.boundingBox.center();
				//child.geometry.applyMatrix( new THREE.Matrix4().makeTranslation( - center.x, - center.y, - center.z ) );
				//child.position.set( center.x, center.y, center.z );
				
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