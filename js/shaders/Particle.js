/**
 * @author seph li http://solid-jellyfish.com
 *
 */


THREE.ShaderParticle = {

	/* ------------------------------------------------------------------------------------------
	//	Rock Particles usage
	//		- no light
	//		- need environmental cubemap for light mapping
	//		- fog (use with "fog: true" material option)
	//		- use a base color map for rock particle shape masking
	//		- color of each particle will be retrived from vertex color
	// ------------------------------------------------------------------------------------------ */

	'Particle' : {

		uniforms: THREE.UniformsUtils.merge( [

			THREE.UniformsLib[ "fog" ],
			{
				"uBaseColorMap" : {type: "t",  value: null},
				"uTime" 	 	: {type: "f",  value: 0},
			}

		] ),

		fragmentShader: [

			"#extension GL_OES_standard_derivatives : enable",
			
			"uniform sampler2D 	 uBaseColorMap;",
			"uniform float 		 uTime;",

			"varying vec3 	vColor;",
			"varying float 	vRot;",

			THREE.ShaderChunk[ "fog_pars_fragment" ],
			
			"void main() {",
				"float c = cos(vRot + uTime);",
				"float s = sin(vRot + uTime);",
				"vec2 rotatedUV = vec2(c * (gl_PointCoord.x - 0.5) + s * (gl_PointCoord.y - 0.5) + 0.5,", 
	                      	          "c * (gl_PointCoord.y - 0.5) - s * (gl_PointCoord.x - 0.5) + 0.5);", 

				"vec4 texColor 	= texture2D( uBaseColorMap, rotatedUV );",
				"float alpha 	= texColor.a;",
				"vec3 color		= texColor.rgb * vColor;",
				
				// output the fragment color
    			"gl_FragColor           = vec4( color, alpha );",

				THREE.ShaderChunk[ "fog_fragment" ],
			"}"

		].join("\n"),

		vertexShader: [

			"varying vec3 		vColor;",
			"varying float 		vRot;",

			"attribute float    size;",
			"attribute vec3 	pcolor;",
			"attribute float 	rotation;",

			"void main(){",

			    "vec4 worldPosition		= modelMatrix * vec4(position,1.0);;",
    			"vec4 viewSpacePosition	= viewMatrix * worldPosition;",
				
				"vRot					= rotation;",
				"gl_PointSize 			= size * ( 600.0 / length( viewSpacePosition.xyz ) );",
				"vColor					= pcolor;",
    			"gl_Position			= projectionMatrix * viewSpacePosition;",
			"}"

		].join( "\n" )

	},

	'Particle_Simple' : {

		uniforms: THREE.UniformsUtils.merge( [
			THREE.UniformsLib[ "fog" ],
			{

			}
		] ),

		fragmentShader: [

			"#extension GL_OES_standard_derivatives : enable",
			
			"varying vec3 	vColor;",
			
			THREE.ShaderChunk[ "fog_pars_fragment" ],
			
			"void main() {",
				// output the fragment color
    			"gl_FragColor           = vec4( vColor, 1.0 );",
				THREE.ShaderChunk[ "fog_fragment" ],
			"}"

		].join("\n"),

		vertexShader: [

			"varying vec3 		vColor;",
			
			"attribute float    size;",
			"attribute vec3 	pcolor;",

			"void main(){",

			    "vec4 worldPosition		= modelMatrix * vec4(position,1.0);;",
    			"vec4 viewSpacePosition	= viewMatrix * worldPosition;",
				
				"gl_PointSize 			= size * ( 600.0 / length( viewSpacePosition.xyz ) );",
				"vColor					= pcolor;",
    			"gl_Position			= projectionMatrix * viewSpacePosition;",
			"}"

		].join( "\n" )

	}
};