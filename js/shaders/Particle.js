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

	'Particle_Env' : {

		uniforms: THREE.UniformsUtils.merge( [

			THREE.UniformsLib[ "fog" ],
			//THREE.UniformsLib[ "shadowmap" ],

			{
				//"uCubeMapTex" 	: {type: "t",  value: null},
				"uBaseColorMap" : {type: "t",  value: null},
				
				//"uRoughness" 	 : {type: "f",  value: 0},
				//"uRoughness4" 	 : {type: "f",  value: 0},
				//"uMetallic" 	 : {type: "f",  value: 0},
				//"uSpecular" 	 : {type: "f",  value: 0},
				
				//"uExposure" 	 : {type: "f",  value: 0},
				"uGamma" 	 	 : {type: "f",  value: 0},
			}

		] ),

		fragmentShader: [

			"#extension GL_OES_standard_derivatives : enable",
			
			//"uniform samplerCube uCubeMapTex;",
			"uniform sampler2D 	 uBaseColorMap;",

			//"uniform float	uRoughness;",
			//"uniform float	uRoughness4;",
			//"uniform float	uMetallic;",
			//"uniform float	uSpecular;",

			//"uniform float	uExposure;",
			"uniform float	uGamma;",

			//"varying vec3 vEyePosition;",
			"varying vec3 vColor;",
			
			//THREE.ShaderChunk[ "shadowmap_pars_fragment" ],
			THREE.ShaderChunk[ "fog_pars_fragment" ],
			
			"#define saturate(x) clamp(x, 0.0, 1.0)",
			"#define PI 3.14159265359",

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

			// https://www.unrealengine.com/blog/physically-based-shading-on-mobile
			"vec3 EnvBRDFApprox( vec3 SpecularColor, float Roughness, float NoV )",
			"{",
				"const vec4 c0 = vec4( -1.0, -0.0275, -0.572, 0.022 );",
				"const vec4 c1 = vec4( 1.0, 0.0425, 1.04, -0.04 );",
				"vec4 r = Roughness * c0 + c1;",
				"float a004 = min( r.x * r.x, exp2( -9.28 * NoV ) ) * r.x + r.y;",
				"vec2 AB = vec2( -1.04, 1.04 ) * a004 + r.zw;",
				"return SpecularColor * AB.x + AB.y;",
			"}",

			// http://the-witness.net/news/2012/02/seamless-cube-map-filtering/
			"vec3 fix_cube_lookup( vec3 v, float cube_size, float lod ) {",
				"float M = max(max(abs(v.x), abs(v.y)), abs(v.z));",
				"float scale = 1.0 - exp2(lod) / cube_size;",
				"if (abs(v.x) != M) v.x *= scale;",
				"if (abs(v.y) != M) v.y *= scale;",
				"if (abs(v.z) != M) v.z *= scale;",
				"return v;",
			"}",

			"void main() {",
				//"vec3 N                  = normalize( vec3(1,0,0) );",
				//"vec3 V                  = normalize( vEyePosition );",
	
				//"vec3 baseColor			= texture2D( uBaseColorMap, gl_PointCoord ).rgb * vColor;",
				"float alpha 				= texture2D( uBaseColorMap, gl_PointCoord ).a;",
				"vec3 color					= texture2D( uBaseColorMap, gl_PointCoord ).rgb * vColor;",
				
				// deduce the specular color from the baseColor and how metallic the material is
				//"vec3 specularColor		= mix( vec3( 0.08 * uSpecular ), baseColor, uMetallic );",
	
				//"vec3 color;",
				
				// sample the pre-filtered cubemap at the corresponding mipmap level
				//"int numMips			= 6;",
				//"float mip				= float(numMips) - 1.0 + log2(uRoughness);",
				//"vec3 lookup			= -reflect( V, N );",
				//lookup					= fix_cube_lookup( lookup, 512, mip );
				//"vec3 sampledColor		= textureCube( uCubeMapTex, lookup, mip ).rgb;",
	
				// combine the specular IBL and the BRDF
				//"color					= sampledColor * specularColor;",
	
				// apply the tone-mapping
				//"color					= Uncharted2Tonemap( color * uExposure );",
	
				// white balance
				//"const float whiteInputLevel = 20.0;",
				//"vec3 whiteScale		= 1.0 / Uncharted2Tonemap( vec3( whiteInputLevel ) );",
				//"color					= color * whiteScale;",
	
				// gamma correction
				"color					= pow( color, vec3( 1.0 / uGamma ) );",
	
				// output the fragment color
    			"gl_FragColor           = vec4( color, alpha );",

				THREE.ShaderChunk[ "fog_fragment" ],
			"}"

		].join("\n"),

		vertexShader: [

			//"varying vec3 		vEyePosition;",
			"varying vec3 		vColor;",

			"attribute float    size;",
			"attribute vec3 	pcolor;",
			
			//THREE.ShaderChunk[ "shadowmap_pars_vertex" ],

			"void main(){",

			    "vec4 worldPosition		= modelMatrix * vec4(position,1.0);;",
    			"vec4 viewSpacePosition	= viewMatrix * worldPosition;",
	
				//"vEyePosition			= - worldPosition.xyz;", //wrong math??
				"gl_PointSize 			= size * ( 600.0 / length( viewSpacePosition.xyz ) );",
				"vColor					= pcolor;",
    			"gl_Position			= projectionMatrix * viewSpacePosition;",

				//THREE.ShaderChunk[ "shadowmap_vertex" ],
			"}"

		].join( "\n" )

	}
};