'use strict';

var rockMat;
var coreMat;
var rockParticle;

var rockConfig = {
		distThreshold 		: 700,
		// = square distance of click for rock crack
		rockParticleCnt		: 100000,
		//maximum particle count
		terrainLevel		: -400,
		//average terrain level, TODO: make this little more accurate by doing raycaster
		dropPercentage		: 0.8,
		//how much cracks will be dropping, other than orbiting
		gravity				: 0.0015,
		//gravity, accerleration for dropping pieces
		crackOrbitScaler	: 2.5,
		//crack orbit speed scaler
		crackOrbitRadius	: 0.65,
		//crack orbiting parameter
		velocityLimit		: 0.25,
		//maximum speed on every axis
		tickThreshold		: 210,
		//first 2s let the collision only dropping cracks move away from monolite
		minMoveThreshold	: 0.5,
		//minimum move threshold for physics detection, if smaller than this, set the crack be static
		particleDroprate	: 10
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
}

function RockCrack () {
   	this.idx 		= 0;
    this.type 		= 0;    //0 - drop, 1 - orbit
    this.mode 		= 0;	//0 - attached, 1 - detached
    this.radius 	= 0;	//mesh radius for collision detection
    this.mesh 		= null; //rock mesh
    this.collision 	= 1.0;	//collision factor, will affect rotation speed,
    						//every collision with other crack will slower down rotating speed
    this.tick 		= 0.0;

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

	var len = this.crack.length;
	for( var i = 0; i < len; i++ ){
		for( var j = 0; j < i; j++ ){
			this.crack[i].collide( this.pos, this.crack[j] );
		}
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
	
	this.target    = 0.0;
	this.speed     = 0.3;
	this.breakPer += 0.075;

	for( var i = (this.crack.length-1); i >= 0; i-- ){
		if( this.crack[i].mode >= 1.0 ) continue;
		dist.addVectors(this.crack[i].pos, this.pos);
		dist.sub(pos);
		var len = dist.lengthSq();
		if( len < rockConfig.distThreshold ){
			this.crack[i].detach( (Math.random() < 0.3), this.pos.y );
			cnt --;
			if(cnt < 0) break;
		}
	}

	if( (this.breakPer > 1.0)  || 
		( (this.breakPer > 0.7) && (Math.random() < 0.2 * this.breakPer) ) ){
		for( var i = (this.crack.length-1); i >= 0; i-- ){
			this.crack[i].detach( (Math.random() < 0.5), this.pos.y );
		}
		this.breakPer = 1.1;
	}

	return true;
};

RockCrack.prototype.collide = function( position, crack ){
	if( this.mode < 1 && crack.mode < 1 ) return;

	var xx = this.pos.x - crack.pos.x;
	var yy = this.pos.y - crack.pos.y;
	var zz = this.pos.z - crack.pos.z;
	var cx = this.pos.x + crack.pos.x;
	var cy = this.pos.y + crack.pos.y;
	var cz = this.pos.z + crack.pos.z;	

	var dist = xx * xx + yy * yy + zz * zz;
	var rad  = this.radius * this.radius + crack.radius * crack.radius;
	
	if( dist <= rad ){
		var p = new THREE.Vector3( cx/2.0 + position.x, 
								   cy/2.0 + position.y * this.type, 
								   cz/2.0 + position.z );
		rockParticle.drop( p, this.pos, 
			Math.floor( rockConfig.particleDroprate + 
						rockConfig.particleDroprate * Math.random()) );

		if( crack.mode < 1 )
			this.collision 		*= 0.9;
		else this.collision 	*= 1.1;

		if( this.mode < 1 )
			crack.collision		*= 0.9;
		else crack.collision 	*= 1.1;

		crack.addForce( -xx, -yy, -zz );
		this.addForce ( +xx, +yy, +zz );
	}
}

RockCrack.prototype.addForce = function( x, y, z ){
	if( this.type == 1 ){
		this.velocity.x += x;
		this.velocity.y += y;
		this.velocity.z += z;
	}else{
		this.velocity.y += 0.5 * y;
		if( this.tick > rockConfig.tickThreshold ){
			this.velocity.x += x;
			this.velocity.z += z;
		}else{
			this.velocity.x += toUnit(this.pos.x) * Math.abs(x);
			this.velocity.z += toUnit(this.pos.z) * Math.abs(z);
		}
	}
}

RockCrack.prototype.detach = function( outburst, level ){
	if( this.mode >= 1.0 || this.mode < 0.0 ) return;
	this.mode 	= 1.0;
	if(outburst){
		//this.pos.multiplyScalar( 0.5 + Math.random() * 0.7 );		
		this.rotSpeed *= 1.0 + Math.random();
	}
	//}else{
		//this.pos.multiplyScalar( 0.2 + Math.random() * 0.8 );		
	//}

	if( this.type == 0 ){
		this.pos.y 	 += level;
		this.speed 	  =  0;
	}
}

RockCrack.prototype.update = function( position, scaler ) {
	this.tick += 1;
	if( this.mode < 1 ) return;

	this.velocity.x = THREE.Math.clamp ( this.velocity.x, 
										 -rockConfig.velocityLimit, 
										 +rockConfig.velocityLimit );
	this.velocity.y = THREE.Math.clamp ( this.velocity.y, 
										 -rockConfig.velocityLimit, 
										 +rockConfig.velocityLimit );
	this.velocity.z = THREE.Math.clamp ( this.velocity.z, 
										 -rockConfig.velocityLimit, 
										 +rockConfig.velocityLimit );

	if( this.type == 1 ){	//orbiting cracks
		//rotation
		this.rotSpeed		 += (this.rotTarget - this.rotSpeed) * 0.04;
		this.mesh.rotation.x += this.collision * scaler * this.rotSpeed * this.rotAxis.x;
		this.mesh.rotation.y += this.collision * scaler * this.rotSpeed * this.rotAxis.y;
		this.mesh.rotation.z += this.collision * scaler * this.rotSpeed * this.rotAxis.z;

		//revolution	
		var prerad  = this.maxSpeed / this.speed / this.speed;
		this.speed += ( this.maxSpeed - this.speed ) * 0.002;
		var currad  = this.maxSpeed / this.speed / this.speed;

		var ang     = Math.atan2( this.pos.z + this.velocity.z, 
								  this.pos.x + this.velocity.x );
		var omega 	= this.speed / currad;
		ang 		+= rockConfig.crackOrbitScaler * scaler * omega;

		var px 		= this.pos.x + this.velocity.x;
		var pz 		= this.pos.z + this.velocity.z;

		this.pos.x  = 0.95 * (this.pos.x + this.velocity.x) 
					+ rockConfig.crackOrbitRadius * currad * Math.cos(ang);
		this.pos.z  = 0.95 * (this.pos.z + this.velocity.z) 
					+ rockConfig.crackOrbitRadius * currad * Math.sin(ang);

		this.velocity.x = 0.10 * (this.pos.x - px) + 0.9 * this.velocity.x;
		this.velocity.z = 0.10 * (this.pos.z - pz) + 0.9 * this.velocity.z;
		this.velocity.y = 0.98 * this.velocity.y;

		this.mesh.position.set( position.x + this.pos.x, 
								position.y + this.pos.y, 
								position.z + this.pos.z );
	}else if( this.type == 0 ){ //dropping cracks

		//falling down
		//for big cracks, they should fall at same speed
		this.speed 		=  Math.min( this.speed + rockConfig.gravity, this.maxSpeed );
		this.velocity.y	-= this.speed;

		this.pos.x 		+= this.velocity.x;
		this.pos.y 		+= this.velocity.y;
		this.pos.z 		+= this.velocity.z;

		var currlevel 	 = Math.max( rockConfig.terrainLevel, this.pos.y );
		this.mesh.position.set( position.x + this.pos.x, currlevel, position.z + this.pos.z );
	
		if( currlevel > rockConfig.terrainLevel ){
			//rotation - make dropping ones rotate a little faster than orbiting ones
			this.rotSpeed		 += (this.rotTarget - this.rotSpeed) * 0.08;
			this.mesh.rotation.x += this.collision * scaler * this.rotSpeed * this.rotAxis.x;
			this.mesh.rotation.y += this.collision * scaler * this.rotSpeed * this.rotAxis.y;
			this.mesh.rotation.z += this.collision * scaler * this.rotSpeed * this.rotAxis.z;
			
			if( currlevel < rockConfig.terrainLevel + 0.08 * (position.y - rockConfig.terrainLevel) ){
				var dist = 	this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y +
							this.velocity.z * this.velocity.z;
				if( dist <= rockConfig.minMoveThreshold )
					this.mode = -1;
			}
		
		}else{
			this.mode = - 1; //mark this crack's mode to -1, might need to dispose this mesh
							 //for memory concern?
		}
	}

	this.collision = 1.0;
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
		this.particlePosition[3*idx+0] = point.x + 25 * ran.x;
		this.particlePosition[3*idx+1] = point.y + 25 * ran.y;
		this.particlePosition[3*idx+2] = point.z + 25 * ran.z;

		ran.x 	= vel.x; ran.y 	= vel.y; ran.z 	= vel.z;
		axis.x 	= Math.random()-0.5;
		axis.y 	= Math.random()-0.5;
		axis.z 	= Math.random()-0.5;
		axis.cross( vel );
		axis.normalize();
		ran.applyAxisAngle (axis, Math.random() * Math.PI / 6 );
		
		this.particleVelocity[3*idx+0] = ran.x * 0.3; 
		this.particleVelocity[3*idx+1] = ran.y * 0.5; 
		this.particleVelocity[3*idx+2] = ran.z * 0.3; 

		for( ; idx < this.cnt; idx++ ){
			if( this.particlePosition[3*idx+1] <= rockConfig.terrainLevel ){
				break;
			}
		}
		if( idx >= this.cnt ) break;
	}

	return true;
}

RockParticle.prototype.update = function( scaler, elapsedTime ) {
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
		//this.particleCloud.geometry.computeBoundingSphere();
		//maybe we don't need this, just manually set visible every frame?
		this.particleCloud.material.uniforms.uTime.value = elapsedTime;
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
					       shading: 		THREE.FlatShading };
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
	uniforms[ "uBaseColorMap" ].value.repeat.set( 2, 2 );
		
	uniforms[ "uNormalMap" ].value    		= THREE.ImageUtils.loadTexture( "textures/" + texNormal  );
	uniforms[ "uNormalMap" ].value.wrapS 	= THREE.RepeatWrapping;
	uniforms[ "uNormalMap" ].value.wrapT 	= THREE.RepeatWrapping;
	uniforms[ "uNormalMap" ].value.repeat.set( 2, 2 );
	
	uniforms[ "uCubeMapTex" ].value 		= textureCube;
	uniforms[ "uRoughness" ].value    		= 0.8;	
	uniforms[ "uRoughness4" ].value    		= 0.8 * 0.8 * 0.8 * 0.8;	
	uniforms[ "uMetallic"  ].value    		= 0.3;	
	uniforms[ "uSpecular"  ].value    		= 0.3;	
	uniforms[ "uDetails"   ].value    		= 1.0;	

	uniforms[ "uExposure"  ].value    		= 6.3375;
	uniforms[ "uGamma" 	   ].value    		= 2.2;			
	
	uniforms[ "uBaseColor"].value     		= new THREE.Color( 0x1d1b1c );		
		
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
					       morphNormals:    false };
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
	
	var particleColor 				= new Float32Array( cnt * 3 );
	var particleSize 				= new Float32Array( cnt * 1 );
	var particleRot 				= new Float32Array( cnt * 1 );

	var color 			= new THREE.Color(0xffffff); //new THREE.Color(0x67535e);
	
	for ( var i = 0; i < cnt; i ++ ) {
		//velocity, default to 0
		rockParticle.particleVelocity[3*i+0] = 0;
		rockParticle.particleVelocity[3*i+1] = 0;
		rockParticle.particleVelocity[3*i+2] = 0;
		//position, default below terrain
		rockParticle.particlePosition[3*i+0] = 0;
		rockParticle.particlePosition[3*i+1] = rockConfig.terrainLevel - 1; //make it beneath terrain
		rockParticle.particlePosition[3*i+2] = 0;
		//mass, randomize
		rockParticle.particleMass[i]	= Math.random() * 0.5 + 0.5;
		
		//color, random in hsl
		color.setHSL( 0.64, 0.025 + 0.05 * Math.random(), 0.025 + 0.05 * Math.random() ); 
		particleColor[3*i+0] = color.r;
		particleColor[3*i+1] = color.g;
		particleColor[3*i+2] = color.b;
		
		//size, randomize
		particleSize[i]	  = scaleMin + Math.random() * (scaleMax - scaleMin);
		
		//rotation, randomize 
		particleRot[i]	  = 2 * Math.PI * Math.random();
	}

	geometry.addAttribute( 'position', 	
		new THREE.BufferAttribute( rockParticle.particlePosition, 	3 ) );
	geometry.addAttribute( 'rotation', 		
		new THREE.BufferAttribute( particleRot, 	  				1 ) );
	geometry.addAttribute( 'pcolor', 	
		new THREE.BufferAttribute( particleColor,    				3 ) );
	geometry.addAttribute( 'size', 		
		new THREE.BufferAttribute( particleSize, 	 				1 ) );
	geometry.computeBoundingSphere();

	var shader 	 = THREE.ShaderParticle[ "Particle" ];
	//var shader 	 = THREE.ShaderParticle[ "Particle_Simple" ];
	var uniforms = THREE.UniformsUtils.clone( shader.uniforms );

	uniforms[ "uBaseColorMap" ].value 	= THREE.ImageUtils.loadTexture( "textures/rock_particle.png" );
	uniforms[ "uTime" 	   ].value    	= 0.0;
	
	var attributes = {
		rotation:   { type: 'f', value: [] },
		size:   	{ type: 'f', value: [] },
		pcolor: 	{ type: 'c', value: [] }
	};

	var parameters 	= { fragmentShader: shader.fragmentShader, 
					    vertexShader: 	shader.vertexShader, 
					    uniforms: 		uniforms,
					    attributes: 	attributes,
					    fog: 			true,
					    blending: 		THREE.NormalBlending,
					    depthWrite: 	false,
					    depthTest: 		true,
					    transparent: 	true 
					};
	var material 	= new THREE.ShaderMaterial( parameters );

	rockParticle.particleCloud 		   = new THREE.PointCloud( geometry, material );
	rockParticle.particleCloud.visible = false;
	rockParticle.particleCloud.dynamic = true;

	scene.add( rockParticle.particleCloud );
}

//TODO: need to compile OBJs into json files for fast loading
function CreateRock( idx, cnt, scale, pos ){
	var manager = new THREE.LoadingManager();
	manager.onProgress = function ( item, loaded, total ) { 

		//console.log(item,loaded,total);
		uiSetProgress(loaded/total*100);
	};
	
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
					crack.pos 		= child.geometry.boundingBox.center();
					
					child.geometry.applyMatrix( new THREE.Matrix4().makeTranslation( 
						- crack.pos.x, - crack.pos.y, - crack.pos.z ) );
					child.position.set( pos.x + crack.pos.x, 
										pos.y + crack.pos.y, 
										pos.z + crack.pos.z );
					child.castShadow 	= true;
				
					crack.mesh 	 	= child;
					crack.radius 	= 0.6 * Math.min( child.geometry.boundingBox.max.x - 
												child.geometry.boundingBox.min.x,
												Math.min(
													child.geometry.boundingBox.max.y - 
													child.geometry.boundingBox.min.y,
													child.geometry.boundingBox.max.z - 
													child.geometry.boundingBox.min.z ) );

					crack.type 		= (Math.random() < rockConfig.dropPercentage) ? 0 : 1;
					crack.rotAxis.set( Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5 );
					crack.rotAxis.normalize();
					crack.rotTarget = 0.005 + 0.05 * Math.random();
					crack.rotSpeed	= (1 + 9 * Math.random()) * crack.rotTarget;
					crack.maxSpeed  = 0.5 * (0.075 + 0.35 * Math.random());
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
	gui.close();

	return gui;
}