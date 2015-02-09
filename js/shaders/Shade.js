/**
 * @author seph li http://solid-jellyfish.com
 *
 */


THREE.ShaderShade = {

	/* ------------------------------------------------------------------------------------------
	//	Environmental cubemap mapping npr shading
	//		- no light
	//		- need environmental cubemap for light mapping
	//		- fog (use with "fog: true" material option)
	//		- shadow maps
	//		- this shader is planned for rock core only, not sure if we need add lighting to it
	//		- if do, refer to next shader
	// ------------------------------------------------------------------------------------------ */

	'Env' : {

		uniforms: THREE.UniformsUtils.merge( [

			THREE.UniformsLib[ "fog" ],
			THREE.UniformsLib[ "shadowmap" ],

			{
				"uCubeMapTex" 	: {type: "t",  value: null},
				"uSunPosition" 	: {type: "v3", value: new THREE.Vector3 },
				"uBaseColor" 	: {type: "c",  value: new THREE.Color( 0xffffff )},
				"uExposure"		: {type: "f",  value: 0},
				"uGamma" 	 	: {type: "f",  value: 0},
				"uWorldTop" 	: {type: "f",  value: 0}
			}

		] ),

		fragmentShader: [

			"#extension GL_OES_standard_derivatives : enable",
			
			"uniform samplerCube uCubeMapTex;",
			"uniform vec3		 uBaseColor;",
			"uniform float		 uGamma;",
			"uniform float		 uExposure;",
			"uniform vec3 		 uSunPosition;",
			"uniform float 		 uWorldTop;",

			"varying vec3 vEyeDir;",
			"varying vec4 vVertex;",
			"varying vec3 vNormal;",
			//"varying vec2 vUv;",
			
			THREE.ShaderChunk[ "shadowmap_pars_fragment" ],
			THREE.ShaderChunk[ "fog_pars_fragment" ],

			// Filmic tonemapping from
			// http://filmicgames.com/archives/75
			"const float A = 0.15;",
			"const float B = 0.50;",
			"const float C = 0.10;",
			"const float D = 0.20;",
			"const float E = 0.02;",
			"const float F = 0.30;",

			"vec3 Uncharted2Tonemap( vec3 x )",
			"{",
				"return ((x*(A*x+C*B)+D*E)/(x*(A*x+B)+D*F))-E/F;",
			"}",

			"void main() {",
				
				"vec3 ppNormal		= vNormal * 0.8;",
				"vec3 lightDir		= uSunPosition - vVertex.xyz;",
	
				"float ppDiff		= max( dot( ppNormal, normalize( lightDir ) ), 0.0 );",
				"float ppFres		= pow( 1.0 - ppDiff, 2.5 );",
	
				"float ppEyeDiff	= max( dot( ppNormal, vEyeDir ), 0.05 );",
				"float ppEyeFres	= pow( 1.0 - ppEyeDiff, 6.0 );",
	
				"vec3 reflectDir	= reflect( vEyeDir, vNormal );",
				"vec3 cubeMapColor	= textureCube( uCubeMapTex, reflectDir ).rgb;",
				"float cubeDiff		= cubeMapColor.r * 0.3;",
				"float cubeSpec		= cubeMapColor.g;",
	
				"float distFromCeiling 		= clamp( 1.0 - ( uWorldTop - vVertex.y ) * 0.003, 0.0, 1.0 ) * 0.5;",
				"float distFromCeilingShine = pow( distFromCeiling * 2.0, 5.0 );",
	
				"float yPer 			= min( ( vNormal.y * 0.5 + 0.5 ) * 1.5, 1.0 );",
				
				//"vec3 color 		= cubeDiff * ppEyeDiff * uBaseColor;",
				//"vec3 color 		= vec3( cubeSpec * pow( 1.0 - ppEyeDiff, 2.0 ) );",
				//"vec3 color 		= vec3( ppEyeFres * yPer );",
				//"vec3 color 		= distFromCeilingShine * uBaseColor;",

				"float lightTerm 		= cubeSpec * pow( 1.0 - ppEyeDiff, 2.0 ) + ppEyeFres * yPer - ( 0.2 - ( vNormal.y * 0.5 + 0.5 ) * 0.2 );",
				"vec3 color 			= cubeDiff * ppEyeDiff * uBaseColor + 0.5 * lightTerm * uBaseColor + distFromCeilingShine * uBaseColor;",
				
				"color					= Uncharted2Tonemap( color * uExposure );",
	
				// white balance
				"const float whiteInputLevel = 20.0;",
				"vec3 whiteScale			 = 1.0 / Uncharted2Tonemap( vec3( whiteInputLevel ) );",
				"color						 = color * whiteScale;",
	
				// gamma correction
				"color					= pow( color, vec3( 1.0 / uGamma ) );",
	
				// output the fragment color
    			"gl_FragColor           = vec4( color, 1.0 );",

				THREE.ShaderChunk[ "shadowmap_fragment" ],
				THREE.ShaderChunk[ "fog_fragment" ],
			"}"

		].join("\n"),

		vertexShader: [

			"varying vec3 vEyeDir;",
			"varying vec4 vVertex;",
			"varying vec3 vNormal;",
			//"varying vec2 vUv;",
			
			THREE.ShaderChunk[ "shadowmap_pars_vertex" ],

			"void main()",
			"{",
				"vNormal		= normalize( normalMatrix * normal );",
				//"vUv 			= uv;",
				"vVertex		= modelMatrix * vec4( position, 1.0 );",
				"vEyeDir		= normalize( cameraPosition - vVertex.xyz );",
	
				"gl_Position	= projectionMatrix * viewMatrix * vVertex;",
				THREE.ShaderChunk[ "shadowmap_vertex" ],
			"}",

		].join( "\n" )

	},

	/* ------------------------------------------------------------------------------------------
	//	Environmental cubemap mapping npr shading
	//		- no light
	//		- need environmental cubemap for light mapping
	//		- fog (use with "fog: true" material option)
	//		- shadow maps
	//		- this shader is planned for rock core only, not sure if we need add lighting to it
	//		- if do, refer to next shader
	// ------------------------------------------------------------------------------------------ */

	'Env_Bump' : {

		uniforms: THREE.UniformsUtils.merge( [

			THREE.UniformsLib[ "fog" ],
			THREE.UniformsLib[ "shadowmap" ],

			{
				"uCubeMapTex" 	: {type: "t",  value: null},
				"uBaseColorMap" : {type: "t",  value: null},
				"uNormalMap" 	: {type: "t",  value: null},

				"uBaseColor" 	: {type: "c",  value: new THREE.Color( 0xffffff )},
				
				"uSunPosition" 	: {type: "v3", value: new THREE.Vector3 },
				"uExposure"		: {type: "f",  value: 0},
				"uGamma" 	 	: {type: "f",  value: 0},
				"uWorldTop" 	: {type: "f",  value: 0}
			}

		] ),

		fragmentShader: [

			"#extension GL_OES_standard_derivatives : enable",
			
			"uniform samplerCube uCubeMapTex;",

			"uniform sampler2D   uBaseColorMap;",
			"uniform sampler2D 	 uNormalMap;",	

			"uniform vec3		 uBaseColor;",
			"uniform float		 uGamma;",
			"uniform float		 uExposure;",
			"uniform vec3 		 uSunPosition;",
			"uniform float 		 uWorldTop;",

			"uniform mat3 		 normalMatrix;",

			"varying vec3 vEyeDir;",
			"varying vec4 vVertex;",
			"varying vec3 vNormal;",
			"varying vec2 vUv;",
			
			THREE.ShaderChunk[ "shadowmap_pars_fragment" ],
			THREE.ShaderChunk[ "fog_pars_fragment" ],

			// Filmic tonemapping from
			// http://filmicgames.com/archives/75
			"const float A = 0.15;",
			"const float B = 0.50;",
			"const float C = 0.10;",
			"const float D = 0.20;",
			"const float E = 0.02;",
			"const float F = 0.30;",

			"vec3 Uncharted2Tonemap( vec3 x )",
			"{",
				"return ((x*(A*x+C*B)+D*E)/(x*(A*x+B)+D*F))-E/F;",
			"}",

			// Normal Blending (Unity normal blending)
			// Source adapted from http://blog.selfshadow.com/publications/blending-in-detail/
			"vec3 blendNormals( vec3 baseNormal, vec3 detailsNormal )",
			"{",
				"vec3 n1 = baseNormal;",
				"vec3 n2 = detailsNormal;",
				"mat3 nBasis = mat3(",
        			"vec3(n1.z, n1.y, -n1.x),", // +90 degree rotation around y axis
        			"vec3(n1.x, n1.z, -n1.y),", // -90 degree rotation around x axis
        			"vec3(n1.x, n1.y,  n1.z));",
				"return normalize(n2.x*nBasis[0] + n2.y*nBasis[1] + n2.z*nBasis[2]);",
			"}",

			"void main() {",
				
				"vec3 detailNorm 	= normalMatrix * texture2D( uNormalMap, vUv ).rgb;",
				"vec3 mixedNormal 	= blendNormals( vNormal, detailNorm );",
				"vec3 ppNormal		= mixedNormal * 0.8;",
				"vec3 lightDir		= uSunPosition - vVertex.xyz;",
	
				"float ppDiff		= max( dot( ppNormal, normalize( lightDir ) ), 0.0 );",
				"float ppFres		= pow( 1.0 - ppDiff, 2.5 );",
	
				"float ppEyeDiff	= max( dot( ppNormal, vEyeDir ), 0.05 );",
				"float ppEyeFres	= pow( 1.0 - ppEyeDiff, 6.0 );",
	
				"vec3 reflectDir	= reflect( vEyeDir, mixedNormal );",
				"vec3 cubeMapColor	= textureCube( uCubeMapTex, reflectDir ).rgb;",
				"float cubeDiff		= cubeMapColor.r * 0.3;",
				"float cubeSpec		= cubeMapColor.g;",
	
				"float distFromCeiling 		= clamp( 1.0 - ( uWorldTop - vVertex.y ) * 0.003, 0.0, 1.0 ) * 0.5;",
				"float distFromCeilingShine = pow( distFromCeiling * 2.0, 5.0 );",
	
				"float yPer 			= min( ( mixedNormal.y * 0.5 + 0.5 ) * 1.5, 1.0 );",
				
				"vec3 texColor 			= texture2D(uBaseColorMap, vUv).rgb * uBaseColor;",
				
				//"vec3 color 		= cubeDiff * ppEyeDiff * texColor;",
				//"vec3 color 		= vec3( cubeSpec * pow( 1.0 - ppEyeDiff, 2.0 ) );",
				//"vec3 color 		= vec3( 0.5 * ppEyeFres * yPer );",
				//"vec3 color 		= distFromCeilingShine * texColor;",

				"float lightTerm 		= cubeSpec * pow( 1.0 - ppEyeDiff, 2.0 ) + ppEyeFres * yPer;",
				"vec3 color 			= clamp(cubeDiff * ppEyeDiff * texColor + 0.5 * lightTerm * texColor + distFromCeilingShine * texColor, 0.0, 1.0);",
				
				"color					= Uncharted2Tonemap( color * uExposure );",
	
				// white balance
				"const float whiteInputLevel = 20.0;",
				"vec3 whiteScale			 = 1.0 / Uncharted2Tonemap( vec3( whiteInputLevel ) );",
				"color						 = color * whiteScale;",
	
				// gamma correction
				"color					= pow( color, vec3( 1.0 / uGamma ) );",
	
				// output the fragment color
    			"gl_FragColor           = vec4( color, 1.0 );",

				THREE.ShaderChunk[ "shadowmap_fragment" ],
				THREE.ShaderChunk[ "fog_fragment" ],
			"}"

		].join("\n"),

		vertexShader: [

			"varying vec3 vEyeDir;",
			"varying vec4 vVertex;",
			"varying vec3 vNormal;",
			"varying vec2 vUv;",
			
			THREE.ShaderChunk[ "shadowmap_pars_vertex" ],

			"void main()",
			"{",
				"vNormal		= normalize( normalMatrix * normal );",
				"vUv 			= uv;",
				"vVertex		= modelMatrix * vec4( position, 1.0 );",
				"vEyeDir		= normalize( cameraPosition - vVertex.xyz );",
	
				"gl_Position	= projectionMatrix * viewMatrix * vVertex;",
				THREE.ShaderChunk[ "shadowmap_vertex" ],
			"}",

		].join( "\n" )

	}

};