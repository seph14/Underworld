/**
 * @author seph li http://solid-jellyfish.com
 *
 */


THREE.ShaderPBR = {

	/* ------------------------------------------------------------------------------------------
	//	Physical Based Rendering - Bump 
	//		- diffuse map
	//		- bump map
	//		- roughness map *
	//		- point, directional and hemisphere lights (use with "lights: true" material option)
	//		- fog (use with "fog: true" material option)
	//		- shadow maps
	//
	// ------------------------------------------------------------------------------------------ */

	'PBR_Bump' : {

		uniforms: THREE.UniformsUtils.merge( [

			THREE.UniformsLib[ "fog" ],
			THREE.UniformsLib[ "shadowmap" ],

			{
				"uLightPositions": {type: "v3v", value: [new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, 0 )]},
				"uLightColors" 	 : {type: "v3v", value: [new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, 0 )]},
				"uLightRadiuses" : {type: "fv1", value: [ 30.0, 30.0 ] },    // float array (plain)

				"uBaseColor" 	 : {type: "c",  value: new THREE.Color( 0xffffff )},
				"uRoughness" 	 : {type: "f",  value: 0},
				"uMetallic" 	 : {type: "f",  value: 0},
				"uSpecular" 	 : {type: "f",  value: 0},
				"uDetails" 	 	 : {type: "f",  value: 0},
			
				"uExposure" 	 : {type: "f",  value: 0},
				"uGamma" 	 	 : {type: "f",  value: 0},
			
				"uBaseColorMap"	 : { type: "t", value: null },
				"uNormalMap"	 : { type: "t", value: null },
				//"uRoughnessMap"	 : { type: "t", value: null }
			}

		] ),

		fragmentShader: [

			"#extension GL_OES_standard_derivatives : enable",
			
			"uniform vec3   uLightColors[ 2 ];",
			"uniform float  uLightRadiuses[ 2 ];",

			"uniform vec3	uBaseColor;",
			"uniform float	uRoughness;",
			"uniform float	uMetallic;",
			"uniform float	uSpecular;",
			"uniform float	uDetails;",

			"uniform float	uExposure;",
			"uniform float	uGamma;",

			"uniform sampler2D	uBaseColorMap;",
			"uniform sampler2D	uNormalMap;",
			//"uniform sampler2D	uRoughnessMap;",

			"varying vec3 vNormal;",
			"varying vec3 vLightPositions[2];",
			"varying vec3 vPosition;",
			"varying vec2 vTexCoord;",

			THREE.ShaderChunk[ "shadowmap_pars_fragment" ],
			THREE.ShaderChunk[ "fog_pars_fragment" ],
			
			"#define saturate(x) clamp(x, 0.0, 1.0)",
			"#define PI 3.14159265359",

			// OrenNayar diffuse
			"vec3 getDiffuse( vec3 diffuseColor, float roughness4, float NoV, float NoL, float VoH )",
			"{",
				"float VoL = 2.0 * VoH - 1.0;",
				"float c1 = 1.0 - 0.5 * roughness4 / (roughness4 + 0.33);",
				"float cosri = VoL - NoV * NoL;",
				"float c2 = 0.45 * roughness4 / (roughness4 + 0.09) * cosri * ( cosri >= 0.0 ? min( 1.0, NoL / NoV ) : NoL );",
				"return diffuseColor / PI * ( NoL * c1 + c2 );",
			"}",

			// GGX Normal distribution
			"float getNormalDistribution( float roughness4, float NoH )",
			"{",
				"float d = ( NoH * roughness4 - NoH ) * NoH + 1.0;",
				"return roughness4 / ( d*d );",
			"}",

			// Smith GGX geometric shadowing from "Physically-Based Shading at Disney"
			"float getGeometricShadowing( float roughness4, float NoV, float NoL, float VoH, vec3 L, vec3 V )",
			"{",	
				"float gSmithV = NoV + sqrt( NoV * (NoV - NoV * roughness4) + roughness4 );",
				"float gSmithL = NoL + sqrt( NoL * (NoL - NoL * roughness4) + roughness4 );",
				"return 1.0 / ( gSmithV * gSmithL );",
			"}",

			// Fresnel term
			"vec3 getFresnel( vec3 specularColor, float VoH )",
			"{",
				"vec3 specularColorSqrt = sqrt( clamp( vec3(0, 0, 0), vec3(0.99, 0.99, 0.99), specularColor ) );",
				"vec3 n = vec3(( 1.0 + specularColorSqrt ) / ( 1.0 - specularColorSqrt ));",
				"vec3 g = sqrt( n * n + VoH * VoH - 1.0 );",
				"return vec3(0.5) * pow( (g - VoH) / (g + VoH), vec3(2.0) ) * ( 1.0 + pow( ((g+VoH)*VoH - 1.0) / ((g-VoH)*VoH + 1.0), vec3(2.0) ) );",
			"}",

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

			// From "I'm doing it wrong"
			// http://imdoingitwrong.wordpress.com/2011/01/31/light-attenuation/
			"float getAttenuation( vec3 lightPosition, vec3 vertexPosition, float lightRadius )",
			"{",
				"float r			= lightRadius;",
				"vec3 L				= lightPosition - vertexPosition;",
				"float dist			= length(L);",
				"float d			= max( dist - r, 0.0 );",
				"L					/= dist;",
				"float denom		= d / r + 1.0;",
				"float attenuation	= 1.0 / (denom*denom);",
				"float cutoff		= 0.0052;",
				"attenuation		= (attenuation - cutoff) / (1.0 - cutoff);",
				"attenuation		= max(attenuation, 0.0);",
	
				"return attenuation;",
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

			// Scattering Implementation
			// Code From Miles Macklin's
			// http://blog.mmacklin.com/2010/05/29/in-scattering-demo/
			"float getScattering( vec3 dir, vec3 lightPos, float d)",
			"{",
				// calculate quadratic coefficients a,b,c
				"vec3 q = - lightPos;",
	
				"float b = dot(dir, q);",
				"float c = dot(q, q);",
	
				// evaluate integral
				"float s = 1.0 / sqrt(c - b * b );",
	
				"return s * (atan( (d + b) * s) - atan( b*s ));",
			"}",

			"void main() {",
				"vec2 uv			= vTexCoord;",
	
				"vec3 normalDetails	= texture2D( uNormalMap, uv ).xyz * 2.0 - 1.0;",
				"normalDetails.x	*= -1.0;",
				"normalDetails.y	*= -1.0;",
				"normalDetails		= mix( vec3( 0.0,0.0,1.0), normalDetails, uDetails );",
	
				// get the normal, light, position and half vector normalized
				"vec3 N             = blendNormals( vNormal, normalDetails );",
				"vec3 V				= normalize( -vPosition );",
	
				"vec3 color			= vec3( 0.0 );",
				"vec3 baseColor		= texture2D( uBaseColorMap, uv ).rgb * uBaseColor;",
	
				//"float roughness	= saturate( pow( texture( uRoughnessMap, uv ).x, 4 ) * uRoughness );",
				"float roughness	= uRoughness;",
				"float metallic		= uMetallic;",
				//
				"vec3 diffuseColor	= baseColor - baseColor * metallic;",
				// deduce the specular color from the baseColor and how metallic the material is
				"vec3 specularColor	= mix( vec3( 0.08 * uSpecular ), baseColor, metallic );",
	
				"for( int i = 0; i < 2; i++ ){",
		
					"vec3 L = normalize( vLightPositions[i] - vPosition );",
					"vec3 H	= normalize(V + L);",
		
					// get all the usefull dot products and clamp them between 0 and 1 just to be safe
					"float NoL	= saturate( dot( N, L ) );",
					"float NoV	= saturate( dot( N, V ) );",
					"float VoH	= saturate( dot( V, H ) );",
					"float NoH	= saturate( dot( N, H ) );",
		
					// compute the brdf terms
					"float distribution	= getNormalDistribution( roughness, NoH );",
					"vec3 fresnel		= getFresnel( specularColor, VoH );",
					"float geom			= getGeometricShadowing( roughness, NoV, NoL, VoH, L, V );",
		
					// get the specular and diffuse and combine them
					"vec3 diffuse			= getDiffuse( diffuseColor, roughness, NoV, NoL, VoH );",
					"vec3 specular			= NoL * ( distribution * fresnel * geom );",
					"vec3 directLighting	= uLightColors[i] * ( diffuse + specular );",
		
					// get the light attenuation from its radius
					"float attenuation	= getAttenuation( vLightPositions[i], vPosition, uLightRadiuses[i] );",
					"color				+= attenuation * directLighting;",
		
					// add in-scattering coeff
					"color				+= saturate( pow( getScattering( -V, vLightPositions[i], -vPosition.z ), 1.35 ) * uLightColors[i] * uLightRadiuses[i] * 0.002 );",
				"}",
	
				// apply the tone-mapping
				"color					= Uncharted2Tonemap( color * uExposure );",
	
				// white balance
				"const float whiteInputLevel = 4.0;",
				"vec3 whiteScale		= 1.0 / Uncharted2Tonemap( vec3( whiteInputLevel ) );",
				"color					= color * whiteScale;",
	
				// gamma correction
				"color					= pow( color, vec3( 1.0 / uGamma ) );",
	
				// output the fragment color
				"gl_FragColor            = vec4( color, 1.0 );",

				THREE.ShaderChunk[ "shadowmap_fragment" ],
				THREE.ShaderChunk[ "fog_fragment" ],
			"}"

		].join("\n"),

		vertexShader: [

			"uniform vec3   uLightPositions[2];",

			"varying vec3	vNormal;",
			"varying vec3	vLightPositions[2];",
			"varying vec3	vPosition;",
			"varying vec2	vTexCoord;",
			
			THREE.ShaderChunk[ "shadowmap_pars_vertex" ],

			"void main(){",
    			"vec4 worldPosition			= modelMatrix * vec4(position,1.0);",
    			"vec4 viewSpacePosition		= viewMatrix * worldPosition;",
	
				"vNormal 					= normalize( normalMatrix * normal );",
				"vLightPositions[0]			= ( viewMatrix * vec4( uLightPositions[0], 1.0 ) ).xyz;",
				"vLightPositions[1]			= ( viewMatrix * vec4( uLightPositions[1], 1.0 ) ).xyz;",
    			"vPosition					= viewSpacePosition.xyz;",
				"vTexCoord					= uv;",
	
    			"gl_Position				= projectionMatrix * viewSpacePosition;",

				THREE.ShaderChunk[ "shadowmap_vertex" ],
			"}"

		].join( "\n" )

	},

	/* ------------------------------------------------------------------------------------------
	//	Physical Based Rendering - Color
	//		- point, directional and hemisphere lights (use with "lights: true" material option)
	//		- fog (use with "fog: true" material option)
	//		- shadow maps
	//
	// ------------------------------------------------------------------------------------------ */

	'PBR_Color' : {

		uniforms: THREE.UniformsUtils.merge( [

			THREE.UniformsLib[ "fog" ],
			THREE.UniformsLib[ "shadowmap" ],

			{
				"uLightPositions": {type: "v3v", value: [new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, 0 )]},
				"uLightColors" 	 : {type: "v3v", value: [new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, 0 )]},
				"uLightRadiuses" : {type: "fv1", value: [ 30.0, 30.0 ] },    // float array (plain)

				"uBaseColor" 	 : {type: "c",  value: new THREE.Color( 0xffffff )},
				"uRoughness" 	 : {type: "f",  value: 0},
				"uMetallic" 	 : {type: "f",  value: 0},
				"uSpecular" 	 : {type: "f",  value: 0},
				
				"uExposure" 	 : {type: "f",  value: 0},
				"uGamma" 	 	 : {type: "f",  value: 0},
			}

		] ),

		fragmentShader: [

			"#extension GL_OES_standard_derivatives : enable",
			
			"uniform vec3   uLightColors[ 2 ];",
			"uniform float  uLightRadiuses[ 2 ];",

			"uniform vec3	uBaseColor;",
			"uniform float	uRoughness;",
			"uniform float	uMetallic;",
			"uniform float	uSpecular;",

			"uniform float	uExposure;",
			"uniform float	uGamma;",

			"varying vec3 vNormal;",
			"varying vec3 vLightPositions[2];",
			"varying vec3 vPosition;",
			
			THREE.ShaderChunk[ "shadowmap_pars_fragment" ],
			THREE.ShaderChunk[ "fog_pars_fragment" ],
			
			"#define saturate(x) clamp(x, 0.0, 1.0)",
			"#define PI 3.14159265359",

			// OrenNayar diffuse
			"vec3 getDiffuse( vec3 diffuseColor, float roughness4, float NoV, float NoL, float VoH )",
			"{",
				"float VoL = 2.0 * VoH - 1.0;",
				"float c1 = 1.0 - 0.5 * roughness4 / (roughness4 + 0.33);",
				"float cosri = VoL - NoV * NoL;",
				"float c2 = 0.45 * roughness4 / (roughness4 + 0.09) * cosri * ( cosri >= 0.0 ? min( 1.0, NoL / NoV ) : NoL );",
				"return diffuseColor / PI * ( NoL * c1 + c2 );",
			"}",

			// GGX Normal distribution
			"float getNormalDistribution( float roughness4, float NoH )",
			"{",
				"float d = ( NoH * roughness4 - NoH ) * NoH + 1.0;",
				"return roughness4 / ( d*d );",
			"}",

			// Smith GGX geometric shadowing from "Physically-Based Shading at Disney"
			"float getGeometricShadowing( float roughness4, float NoV, float NoL, float VoH, vec3 L, vec3 V )",
			"{",	
				"float gSmithV = NoV + sqrt( NoV * (NoV - NoV * roughness4) + roughness4 );",
				"float gSmithL = NoL + sqrt( NoL * (NoL - NoL * roughness4) + roughness4 );",
				"return 1.0 / ( gSmithV * gSmithL );",
			"}",

			// Fresnel term
			"vec3 getFresnel( vec3 specularColor, float VoH )",
			"{",
				"vec3 specularColorSqrt = sqrt( clamp( vec3(0, 0, 0), vec3(0.99, 0.99, 0.99), specularColor ) );",
				"vec3 n = vec3(( 1.0 + specularColorSqrt ) / ( 1.0 - specularColorSqrt ));",
				"vec3 g = sqrt( n * n + VoH * VoH - 1.0 );",
				"return vec3(0.5) * pow( (g - VoH) / (g + VoH), vec3(2.0) ) * ( 1.0 + pow( ((g+VoH)*VoH - 1.0) / ((g-VoH)*VoH + 1.0), vec3(2.0) ) );",
			"}",

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

			// From "I'm doing it wrong"
			// http://imdoingitwrong.wordpress.com/2011/01/31/light-attenuation/
			"float getAttenuation( vec3 lightPosition, vec3 vertexPosition, float lightRadius )",
			"{",
				"float r			= lightRadius;",
				"vec3 L				= lightPosition - vertexPosition;",
				"float dist			= length(L);",
				"float d			= max( dist - r, 0.0 );",
				"L					/= dist;",
				"float denom		= d / r + 1.0;",
				"float attenuation	= 1.0 / (denom*denom);",
				"float cutoff		= 0.0052;",
				"attenuation		= (attenuation - cutoff) / (1.0 - cutoff);",
				"attenuation		= max(attenuation, 0.0);",
	
				"return attenuation;",
			"}",

			// https://www.shadertoy.com/view/4ssXRX
			//note: uniformly distributed, normalized rand, [0;1[
			"float nrand( vec2 n )",
			"{",
				"return fract(sin(dot(n.xy, vec2(12.9898, 78.233)))* 43758.5453);",
			"}",

			"float random( vec2 n, float seed )",
			"{",
				"float t = fract( seed );",
				"float nrnd0 = nrand( n + 0.07*t );",
				"float nrnd1 = nrand( n + 0.11*t );",
				"float nrnd2 = nrand( n + 0.13*t );",
				"float nrnd3 = nrand( n + 0.17*t );",
				"return (nrnd0+nrnd1+nrnd2+nrnd3) / 4.0;",
			"}",

			"void main() {",
				
				// get the normal, light, position and half vector normalized
				"vec3 N             = normalize( vNormal );",
				"vec3 V				= normalize( -vPosition );",
	
				"vec3 color			= vec3( 0.0 );",
	
				//
				"vec3 diffuseColor	= uBaseColor - uBaseColor * uMetallic;",
				// deduce the specular color from the baseColor and how metallic the material is
				"vec3 specularColor	= mix( vec3( 0.08 * uSpecular ), uBaseColor, uMetallic );",
	
				"for( int i = 0; i < 2; i++ ){",
		
					"vec3 L = normalize( vLightPositions[i] - vPosition );",
					"vec3 H	= normalize(V + L);",
		
					// get all the usefull dot products and clamp them between 0 and 1 just to be safe
					"float NoL	= saturate( dot( N, L ) );",
					"float NoV	= saturate( dot( N, V ) );",
					"float VoH	= saturate( dot( V, H ) );",
					"float NoH	= saturate( dot( N, H ) );",
		
					// compute the brdf terms
					"float distribution	= getNormalDistribution( uRoughness, NoH );",
					"vec3 fresnel		= getFresnel( specularColor, VoH );",
					"float geom			= getGeometricShadowing( uRoughness, NoV, NoL, VoH, L, V );",
		
					// get the specular and diffuse and combine them
					"vec3 diffuse			= getDiffuse( diffuseColor, uRoughness, NoV, NoL, VoH );",
					"vec3 specular			= NoL * ( distribution * fresnel * geom );",
					"vec3 directLighting	= uLightColors[i] * ( diffuse + specular );",
		
					// get the light attenuation from its radius
					"float attenuation	= getAttenuation( vLightPositions[i], vPosition, uLightRadiuses[i] );",
					"color				+= attenuation * directLighting;",
		
				"}",
	
				// apply the tone-mapping
				"color					= Uncharted2Tonemap( color * uExposure );",
	
				// white balance
				"const float whiteInputLevel = 2.0;",
				"vec3 whiteScale		= 1.0 / Uncharted2Tonemap( vec3( whiteInputLevel ) );",
				"color					= color * whiteScale;",
	
				// gamma correction
				"color					= pow( color, vec3( 1.0 / uGamma ) );",
	
				// output the fragment color
				"gl_FragColor            = vec4( color, 1.0 );",

				THREE.ShaderChunk[ "shadowmap_fragment" ],
				THREE.ShaderChunk[ "fog_fragment" ],
			"}"

		].join("\n"),

		vertexShader: [

			"uniform vec3   uLightPositions[2];",

			"varying vec3	vNormal;",
			"varying vec3	vLightPositions[2];",
			"varying vec3	vPosition;",
			
			THREE.ShaderChunk[ "shadowmap_pars_vertex" ],

			"void main(){",

    			"vec4 worldPosition			= modelMatrix * vec4(position,1.0);",
    			"vec4 viewSpacePosition		= viewMatrix * worldPosition;",
	
				"vNormal 					= normalize( normalMatrix * normal );",
				"vLightPositions[0]			= ( viewMatrix * vec4( uLightPositions[0], 1.0 ) ).xyz;",
				"vLightPositions[1]			= ( viewMatrix * vec4( uLightPositions[1], 1.0 ) ).xyz;",
    			"vPosition					= viewSpacePosition.xyz;",
				
    			"gl_Position				= projectionMatrix * viewSpacePosition;",

				THREE.ShaderChunk[ "shadowmap_vertex" ],
			"}"

		].join( "\n" )

	}
};