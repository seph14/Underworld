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

	var uTime 	= ( params.time 	!== undefined ) ? params.time 	: 0.0;
	var cam   	= ( params.cam  	!== undefined ) ? params.cam  	: (new THREE.Vector2);
	var tCloud;

	if( params.tCloud !== undefined ){
		tCloud = params.tCloud;
	}else{
		tCloud 		 = THREE.ImageUtils.loadTexture( "textures/cloud.png" );
		tCloud.wrapS = THREE.RepeatWrapping;
		tCloud.wrapT = THREE.RepeatWrapping;
		tCloud.repeat.set( 3, 3 );
	}

	// render targets
	var width  = params.width || window.innerWidth || 1;
	var height = params.height || window.innerHeight || 1;

	this.renderTargetColor = new THREE.WebGLRenderTarget( width, height, {
		minFilter: THREE.LinearFilter,
		magFilter: THREE.LinearFilter,
		format: THREE.RGBFormat //we only need one channel here, but seems LuminanceFormat not supported by default depth material
								//and there is no Rformat for us to save some memory, uh 
	} );

	this.renderTargetDepth = this.renderTargetColor.clone();

	// depth material
	this.materialDepth = new THREE.MeshDepthMaterial();

	// cloud material
	if ( THREE.CloudShader === undefined ) {
		console.error( "THREE.CloudPass relies on THREE.CloudShader" );
	}
	
	var cloudShader   = THREE.CloudShader;
	var cloudUniforms = THREE.UniformsUtils.clone( cloudShader.uniforms );

	cloudUniforms[ "tDepth" ].value 	= this.renderTargetDepth;
	cloudUniforms[ "tCloud" ].value 	= tCloud;

	cloudUniforms[ "uTime" ].value 		= uTime;
	cloudUniforms[ "camDirec" ].value 	= cam;

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
		renderer.render( this.scene, this.camera, this.renderTargetDepth, true );

		// Render cloud effect
		this.uniforms[ "tColor" ].value = readBuffer;

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

	setCameraDirection : function( x, y ){
		this.materialCloud.uniforms["camDirec"].value.x = x;
		this.materialCloud.uniforms["camDirec"].value.y = y;
	}


};

