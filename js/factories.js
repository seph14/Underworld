function LoadSTL(){

	var matrix = new THREE.Matrix4;
	matrix.multiplyScalar(1.0);
	// model
	var manager = new THREE.LoadingManager();
	var loader = new THREE.STLLoader( manager );

	var geometry = new THREE.Object3D();

	var url = "models/cube.obj";
	loader.load( url, function ( geometry ) {
					var material = new THREE.MeshPhongMaterial( { ambient: 0xff5533, color: 0xff5533, specular: 0x111111, shininess: 200 } );
					var mesh = new THREE.Mesh( geometry, material );
					mesh.position.set( 0, - 0.25, 0.6 );
					mesh.rotation.set( 0, - Math.PI / 2, 0 );
					var s = 100;
					mesh.scale.set( 0.5*s, 0.5*s, 0.5*s );
					mesh.castShadow = true;
					mesh.receiveShadow = true;
					scene.add( mesh );
				} );

	return geometry;
}