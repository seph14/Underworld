'use strict';

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
