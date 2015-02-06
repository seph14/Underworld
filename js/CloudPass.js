/**
 * environmental cloud, as post-processing
 * general idea is use depth map as a mask, and generate cloud-ish shape with sin/cos curve, and then merge them together
 */

//var depthTexture = new THREE.DepthTexture(window.innerWidth, window.innerHeight, true); // True means attach a stencil buffer
//https://github.com/mrdoob/three.js/issues/5308 <- waiting on this to be merged
//then we should be able to save a path on re-rendering all meshes for depth map - and probably we could make it to a single channel to save some memory...

THREE.CloudPass = function ( scene, camera, params ) {

	this.scene  = scene;
	this.camera = camera;

	var uTime 	= ( params.time 	!== undefined ) ? params.time 		: 0.0;
	var cam   	= ( params.cam  	!== undefined ) ? params.cam  		: (new THREE.Vector3);
	//this.trace 	= ( params.raytrace !== undefined ) ? params.raytrace 	: true;
	var tCloud;

	if( params.tCloud !== undefined ){
		tCloud = params.tCloud;
	}else{
		tCloud 		 = THREE.ImageUtils.loadTexture( "textures/noise.png" );
		tCloud.wrapS = THREE.RepeatWrapping;
		tCloud.wrapT = THREE.RepeatWrapping;
		//tCloud.repeat.set( 3, 3 );
	}

	// render targets
	var width  = params.width  || window.innerWidth  || 1;
	var height = params.height || window.innerHeight || 1;

	this.renderTargetDepth = new THREE.WebGLRenderTarget( width, height, {
		minFilter: THREE.LinearFilter,
		magFilter: THREE.LinearFilter,
		format: THREE.RGBFormat //we only need one channel here, but seems LuminanceFormat not supported by default depth material
								//and there is no Rformat for us to save some memory, uh 
	} );//this.renderTargetColor.clone();
	this.materialDepth 	   = new THREE.MeshDepthMaterial();

	// cloud material
	/*if ( !this.trace && THREE.CloudShader === undefined ) {
		console.error( "THREE.CloudPass relies on THREE.CloudShader" );
	}*/

	if ( THREE.CloudRayMarchShader === undefined ) {
		console.error( "THREE.CloudPass relies on THREE.CloudRayMarchShader" );
	}
	
	var cloudShader   = THREE.CloudRayMarchShader; //this.trace ? THREE.CloudRaytraceShader : THREE.CloudShader;
	var cloudUniforms = THREE.UniformsUtils.clone( cloudShader.uniforms );

	cloudUniforms[ "resolution" ].value = new THREE.Vector2( width, height );
	cloudUniforms[ "tDepth" ].value 	= this.renderTargetDepth;
	cloudUniforms[ "tCloud" ].value 	= tCloud;

	cloudUniforms[ "uTime" ].value 		= uTime;
	
	this.materialCloud = new THREE.ShaderMaterial({
		uniforms: 		cloudUniforms,
		vertexShader: 	cloudShader.vertexShader,
		fragmentShader: cloudShader.fragmentShader
	});

	this.uniforms  		= cloudUniforms;
	this.enabled   		= true;
	this.needsSwap 		= true;
	this.renderToScreen = false;
	this.clear 	   		= false;

	this.camera2 = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
	this.scene2  = new THREE.Scene();

	this.quad2   = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), null );
	this.scene2.add( this.quad2 );
};

THREE.CloudPass.prototype = {

	render: function ( renderer, writeBuffer, readBuffer, delta, maskActive ) {

		this.quad2.material = this.materialCloud;

		// Render depth into texture
		this.scene.overrideMaterial = this.materialDepth;
		var clearCol 				= this.scene.fog.color;
		renderer.setClearColor( 0x000000, 1 ); 
		//we need to make sure the buffer been cleared to black so the depth map is consistent
		renderer.render( this.scene, this.camera, this.renderTargetDepth, true );
		renderer.setClearColor( clearCol, 1 );

		// Render cloud effect
     	var inverse 	= new THREE.Matrix4();
     	var projview	= new THREE.Matrix4();
     	projview.multiplyMatrices( this.camera.projectionMatrix, this.camera.matrixWorldInverse );
        inverse.getInverse(projview);
        //inverse matrix to unproj fragment position to world coordinates

        this.uniforms[ "tColor" ].value 	= readBuffer;	//color buffer
		this.uniforms["cameraPos" ].value.x = this.camera.position.x; 
        this.uniforms["cameraPos" ].value.y = this.camera.position.y;
        this.uniforms["cameraPos" ].value.z = this.camera.position.z;
        this.uniforms["uNear" ].value 		= this.camera.near;
        this.uniforms["uFar"  ].value 		= this.camera.far;
        this.uniforms["inverseMat"].value 	= inverse;

		if ( this.renderToScreen ) {
			renderer.render( this.scene2, this.camera2 );
		} else {
			renderer.render( this.scene2, this.camera2, writeBuffer, this.clear );
		}
		this.scene.overrideMaterial = null;
	},

	setTime: function( time ){
		this.materialCloud.uniforms["uTime"].value = time;
	},

	setSize: function( width, height ){
		//this.renderTargetDepth.setSize(width, height);
		this.materialCloud.uniforms[ "resolution" ].value = new THREE.Vector2( width, height );
	},

	setCloudColor: function( bright, dark ){
		this.materialCloud.uniforms["cloudBright"].value = new THREE.Color(bright);
		this.materialCloud.uniforms["cloudDark" ].value  = new THREE.Color(dark);
	}
};

