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
			THREE.UniformsLib[ "lights" ],
			THREE.UniformsLib[ "shadowmap" ],

			{
			//	"uLightPositions": {type: "v3v", value: [new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, 0 )]},
			//	"uLightColors" 	 : {type: "v3v", value: [new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, 0 )]},
			//	"uLightRadiuses" : {type: "fv1", value: [ 30.0, 30.0 ] },    // float array (plain)

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
			"varying vec3 vPosition;",
			"varying vec2 vTexCoord;",
			
			"uniform vec3 ambientLightColor;",

			"#if MAX_DIR_LIGHTS > 0",

				"uniform vec3 directionalLightColor[ MAX_DIR_LIGHTS ];",
				"uniform vec3 directionalLightDirection[ MAX_DIR_LIGHTS ];",

			"#endif",

			"#if MAX_HEMI_LIGHTS > 0",

				"uniform vec3 hemisphereLightSkyColor[ MAX_HEMI_LIGHTS ];",
				"uniform vec3 hemisphereLightGroundColor[ MAX_HEMI_LIGHTS ];",
				"uniform vec3 hemisphereLightDirection[ MAX_HEMI_LIGHTS ];",

			"#endif",

			"#if MAX_POINT_LIGHTS > 0",

				"uniform vec3 pointLightColor[ MAX_POINT_LIGHTS ];",
				"uniform vec3 pointLightPosition[ MAX_POINT_LIGHTS ];",
				"uniform float pointLightDistance[ MAX_POINT_LIGHTS ];",

			"#endif",

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
	
				"#if MAX_POINT_LIGHTS > 0",
					"for( int i = 0; i < MAX_POINT_LIGHTS; i++ ){",
		
						"vec4 lPosition = viewMatrix * vec4( pointLightPosition[ i ], 1.0 );",
						"vec3 L 		= normalize( lPosition - vPosition );",
						"vec3 H			= normalize(V + L);",
					
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
						"vec3 directLighting	= pointLightColor[i] * ( diffuse + specular );",
		
						// get the light attenuation from its radius
						"float attenuation	= getAttenuation( lPosition, vPosition, pointLightDistance[i] );",
						"color				+= attenuation * directLighting;",
		
						// add in-scattering coeff
						"color				+= saturate( pow( getScattering( -V, lPosition, -vPosition.z ), 1.35 ) * pointLightColor[i] * pointLightDistance[i] * 0.002 );",
					"}",
				"#endif",

				// directional lights
				"#if MAX_DIR_LIGHTS > 0",
					"for( int i = 0; i < MAX_DIR_LIGHTS; i++ ) {",

						"vec4 lDirection 	= viewMatrix * vec4( directionalLightDirection[ i ], 0.0 );",
						"vec3 L 			= normalize( lDirection.xyz );",
						"vec3 H				= normalize(V + L);",
					
						// get all the usefull dot products and clamp them between 0 and 1 just to be safe
						"float NoL	= saturate( dot( N, L ) );",
						"float NoV	= saturate( dot( N, V ) );",
						"float VoH	= saturate( dot( V, H ) );",
						"float NoH	= saturate( dot( N, H ) );",
						"float wei  = (NoL * 0.5 + 0.5);",
		
						// compute the brdf terms
						"float distribution		= getNormalDistribution( roughness, NoH );",
						"vec3 fresnel			= getFresnel( specularColor, VoH );",
						"float geom				= getGeometricShadowing( roughness, NoV, NoL, VoH, L, V );",
		
						// get the specular and diffuse and combine them
						"vec3 diffuse			= getDiffuse( diffuseColor, roughness, NoV, NoL, VoH );",
						"vec3 specular			= NoL * ( distribution * fresnel * geom );",
						"vec3 directLighting	= directionalLightColor[i] * ( diffuse + specular );",
		
						// get the light strongness
						"color					+= wei * directLighting;",
					"}",
				"#endif",

				// hemisphere lights
				"#if MAX_HEMI_LIGHTS > 0",
					"for ( int i = 0; i < MAX_HEMI_LIGHTS; i ++ ) {",

						"vec4 lDirection 	= viewMatrix * vec4( hemisphereLightDirection[ i ], 0.0 );",
						"vec3 L 			= normalize( lDirection.xyz );",
						"vec3 H				= normalize(V + L);",
					
						// get all the usefull dot products and clamp them between 0 and 1 just to be safe
						"float wei  = dot( N, L ) * 0.5 + 0.5;",
						"float NoL	= saturate( dot( N, L ) );",
						"float NoV	= saturate( dot( N, V ) );",
						"float VoH	= saturate( dot( V, H ) );",
						"float NoH	= saturate( dot( N, H ) );",
						
						// compute the brdf terms
						"float distribution		= getNormalDistribution( roughness, NoH );",
						"vec3 fresnel			= getFresnel( specularColor, VoH );",
						"float geom				= getGeometricShadowing( roughness, NoV, NoL, VoH, L, V );",

						// get the specular and diffuse and combine them
						"vec3 diffuse			= getDiffuse( diffuseColor, roughness, NoV, NoL, VoH );",
						"vec3 specular			= NoL * ( distribution * fresnel * geom );",
						
						"color += (diffuse + specular) * mix( hemisphereLightGroundColor[ i ], hemisphereLightSkyColor[ i ], wei );",
					"}",
				"#endif",
	
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
			"varying vec3	vPosition;",
			"varying vec2	vTexCoord;",
			
			THREE.ShaderChunk[ "shadowmap_pars_vertex" ],

			"void main(){",
    			"vec4 worldPosition			= modelMatrix * vec4(position,1.0);",
    			"vec4 viewSpacePosition		= viewMatrix * worldPosition;",
	
				"vNormal 					= normalize( normalMatrix * normal );",
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
			THREE.UniformsLib[ "lights" ],
			THREE.UniformsLib[ "shadowmap" ],

			{
				//"uLightPositions": {type: "v3v", value: [new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, 0 )]},
				//"uLightColors" 	 : {type: "v3v", value: [new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, 0 )]},
				//"uLightRadiuses" : {type: "fv1", value: [ 30.0, 30.0 ] },    // float array (plain)

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
			
			"uniform vec3	uBaseColor;",
			"uniform float	uRoughness;",
			"uniform float	uMetallic;",
			"uniform float	uSpecular;",

			"uniform float	uExposure;",
			"uniform float	uGamma;",

			"varying vec3 vNormal;",
			"varying vec3 vPosition;",
			
			"uniform vec3 ambientLightColor;",

			"#if MAX_DIR_LIGHTS > 0",

				"uniform vec3 directionalLightColor[ MAX_DIR_LIGHTS ];",
				"uniform vec3 directionalLightDirection[ MAX_DIR_LIGHTS ];",

			"#endif",

			"#if MAX_HEMI_LIGHTS > 0",

				"uniform vec3 hemisphereLightSkyColor[ MAX_HEMI_LIGHTS ];",
				"uniform vec3 hemisphereLightGroundColor[ MAX_HEMI_LIGHTS ];",
				"uniform vec3 hemisphereLightDirection[ MAX_HEMI_LIGHTS ];",

			"#endif",

			"#if MAX_POINT_LIGHTS > 0",

				"uniform vec3 pointLightColor[ MAX_POINT_LIGHTS ];",
				"uniform vec3 pointLightPosition[ MAX_POINT_LIGHTS ];",
				"uniform float pointLightDistance[ MAX_POINT_LIGHTS ];",

			"#endif",

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
	
				"#if MAX_POINT_LIGHTS > 0",
					"for( int i = 0; i < MAX_POINT_LIGHTS; i++ ){",
		
						"vec4 lPosition = viewMatrix * vec4( pointLightPosition[ i ], 1.0 );",
						"vec3 L 		= normalize( lPosition - vPosition );",
						"vec3 H			= normalize(V + L);",
					
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
						"vec3 directLighting	= pointLightColor[i] * ( diffuse + specular );",
		
						// get the light attenuation from its radius
						"float attenuation	= getAttenuation( lPosition, vPosition, pointLightDistance[i] );",
						"color				+= attenuation * directLighting;",
		
						// add in-scattering coeff
						"color				+= saturate( pow( getScattering( -V, lPosition, -vPosition.z ), 1.35 ) * pointLightColor[i] * pointLightDistance[i] * 0.002 );",
					"}",
				"#endif",

				// directional lights
				"#if MAX_DIR_LIGHTS > 0",
					"for( int i = 0; i < MAX_DIR_LIGHTS; i++ ) {",

						"vec4 lDirection 	= viewMatrix * vec4( directionalLightDirection[ i ], 0.0 );",
						"vec3 L 			= normalize( lDirection.xyz );",
						"vec3 H				= normalize(V + L);",
					
						// get all the usefull dot products and clamp them between 0 and 1 just to be safe
						"float NoL	= saturate( dot( N, L ) );",
						"float NoV	= saturate( dot( N, V ) );",
						"float VoH	= saturate( dot( V, H ) );",
						"float NoH	= saturate( dot( N, H ) );",
						"float wei  = (NoL * 0.5 + 0.5);",
		
						// compute the brdf terms
						"float distribution		= getNormalDistribution( uRoughness, NoH );",
						"vec3 fresnel			= getFresnel( specularColor, VoH );",
						"float geom				= getGeometricShadowing( uRoughness, NoV, NoL, VoH, L, V );",
		
						// get the specular and diffuse and combine them
						"vec3 diffuse			= getDiffuse( diffuseColor, uRoughness, NoV, NoL, VoH );",
						"vec3 specular			= NoL * ( distribution * fresnel * geom );",
						"vec3 directLighting	= directionalLightColor[i] * ( diffuse + specular );",
		
						// get the light strongness
						"color					+= wei * directLighting;",
					"}",
				"#endif",

				// hemisphere lights
				"#if MAX_HEMI_LIGHTS > 0",
					"for ( int i = 0; i < MAX_HEMI_LIGHTS; i ++ ) {",

						"vec4 lDirection 	= viewMatrix * vec4( hemisphereLightDirection[ i ], 0.0 );",
						"vec3 L 			= normalize( lDirection.xyz );",
						"vec3 H				= normalize(V + L);",
					
						// get all the usefull dot products and clamp them between 0 and 1 just to be safe
						"float NoL	= saturate( dot( N, L ) );",
						"float NoV	= saturate( dot( N, V ) );",
						"float VoH	= saturate( dot( V, H ) );",
						"float NoH	= saturate( dot( N, H ) );",
						"float wei  = (dot( N, L ) * 0.5 + 0.5);",
				
						// compute the brdf terms
						"float distribution		= getNormalDistribution( roughness, NoH );",
						"vec3 fresnel			= getFresnel( specularColor, VoH );",
						"float geom				= getGeometricShadowing( roughness, NoV, NoL, VoH, L, V );",

						// get the specular and diffuse and combine them
						"vec3 diffuse			= getDiffuse( diffuseColor, uRoughness, NoV, NoL, VoH );",
						"vec3 specular			= NoL * ( distribution * fresnel * geom );",
						
						"color += (diffuse + specular) * mix( hemisphereLightGroundColor[ i ], hemisphereLightSkyColor[ i ], wei );",
					"}",
				"#endif",
	
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

			"varying vec3	vNormal;",
			"varying vec3	vPosition;",
			
			THREE.ShaderChunk[ "shadowmap_pars_vertex" ],

			"void main(){",

    			"vec4 worldPosition			= modelMatrix * vec4(position,1.0);",
    			"vec4 viewSpacePosition		= viewMatrix * worldPosition;",
	
				"vNormal 					= normalize( normalMatrix * normal );",
				"vPosition					= viewSpacePosition.xyz;",
				
    			"gl_Position				= projectionMatrix * viewSpacePosition;",

				THREE.ShaderChunk[ "shadowmap_vertex" ],
			"}"

		].join( "\n" )

	},

	/* ------------------------------------------------------------------------------------------
	//	Physical Based Rendering - Environmental cubemap mapping
	//		- no light
	//		- need environmental cubemap for light mapping
	//		- fog (use with "fog: true" material option)
	//		- shadow maps
	//		- this shader is planned for rock core only, not sure if we need add lighting to it
	//		- if do, refer to next shader
	// ------------------------------------------------------------------------------------------ */

	'PBR_Env' : {

		uniforms: THREE.UniformsUtils.merge( [

			THREE.UniformsLib[ "fog" ],
			THREE.UniformsLib[ "shadowmap" ],

			{
				"uCubeMapTex" 	: {type: "t",  value: null},
				"uBaseColor" 	: {type: "c",  value: new THREE.Color( 0xffffff )},

				"uRoughness" 	 : {type: "f",  value: 0},
				"uRoughness4" 	 : {type: "f",  value: 0},
				"uMetallic" 	 : {type: "f",  value: 0},
				"uSpecular" 	 : {type: "f",  value: 0},
				
				"uExposure" 	 : {type: "f",  value: 0},
				"uGamma" 	 	 : {type: "f",  value: 0},
			}

		] ),

		fragmentShader: [

			"#extension GL_OES_standard_derivatives : enable",
			
			"uniform samplerCube uCubeMapTex;",

			"uniform vec3	uBaseColor;",
			"uniform float	uRoughness;",
			"uniform float	uRoughness4;",
			"uniform float	uMetallic;",
			"uniform float	uSpecular;",

			"uniform float	uExposure;",
			"uniform float	uGamma;",

			"varying vec3 vEyePosition;",
			"varying vec3 vWsNormal;",
			
			THREE.ShaderChunk[ "shadowmap_pars_fragment" ],
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
				"vec3 N                  = normalize( vWsNormal );",
				"vec3 V                  = normalize( vEyePosition );",
	
				// deduce the specular color from the baseColor and how metallic the material is
				"vec3 specularColor		= mix( vec3( 0.08 * uSpecular ), uBaseColor, uMetallic );",
	
				"vec3 color;",
	
				// sample the pre-filtered cubemap at the corresponding mipmap level
				"int numMips			= 6;",
				"float mip				= float(numMips) - 1.0 + log2(uRoughness);",
				"vec3 lookup			= -reflect( V, N );",
				//lookup					= fix_cube_lookup( lookup, 512, mip );
				"vec3 sampledColor		= textureCube( uCubeMapTex, lookup, mip ).rgb;",
	
				// get the approximate reflectance
				"float NoV				= saturate( dot( N, V ) );",
				"vec3 reflectance		= EnvBRDFApprox( specularColor, uRoughness4, NoV );",
	
				// combine the specular IBL and the BRDF
				"color					= sampledColor * reflectance;",
	
				// apply the tone-mapping
				"color					= Uncharted2Tonemap( color * uExposure );",
	
				// white balance
				"const float whiteInputLevel = 20.0;",
				"vec3 whiteScale		= 1.0 / Uncharted2Tonemap( vec3( whiteInputLevel ) );",
				"color					= color * whiteScale;",
	
				// gamma correction
				"color					= pow( color, vec3( 1.0 / uGamma ) );",
	
				// output the fragment color
    			"gl_FragColor           = vec4( color, 1.0 );",

				THREE.ShaderChunk[ "shadowmap_fragment" ],
				THREE.ShaderChunk[ "fog_fragment" ],
			"}"

		].join("\n"),

		vertexShader: [

			"varying vec3		vWsNormal;",
			"varying vec3		vEyePosition;",
			
			THREE.ShaderChunk[ "shadowmap_pars_vertex" ],

			"void main(){",

			    "vec4 worldPosition		= modelMatrix * vec4(position,1.0);;",
    			"vec4 viewSpacePosition	= viewMatrix * worldPosition;",
	
				"vec3 vWsPosition		= worldPosition.xyz;",
				"vEyePosition			= - vWsPosition.xyz;", //wrong math??
				"vWsNormal				= vec3( modelMatrix * vec4( normal, 0.0 ) );",
	
    			"gl_Position			= projectionMatrix * viewSpacePosition;",

				THREE.ShaderChunk[ "shadowmap_vertex" ],
			"}"

		].join( "\n" )

	},

	/* ------------------------------------------------------------------------------------------
	//	Physical Based Rendering - Environmental cubemap mapping w/ bump maps
	//		- threejs system lights
	//		- textures - diffuse and normal
	//		- environmental cubemap for light mapping
	//		- fog (use with "fog: true" material option)
	//		- shadow maps
	//		- this shader is planned for rock core only, not sure if we need add lighting to it
	//		- if do, refer to next shader
	// ------------------------------------------------------------------------------------------ */

	'PBR_Env_Bump' : {

		uniforms: THREE.UniformsUtils.merge( [

			THREE.UniformsLib[ "fog" ],
			//THREE.UniformsLib[ "lights" ],
			THREE.UniformsLib[ "shadowmap" ],

			{
				"uBaseColorMap" : {type: "t",  value: null},
				"uNormalMap" 	: {type: "t",  value: null},

				"uCubeMapTex" 	: {type: "t",  value: null},
				
				"uBaseColor" 	: {type: "c",  value: new THREE.Color( 0xffffff )},
				"uRoughness" 	: {type: "f",  value: 0},
				"uRoughness4" 	: {type: "f",  value: 0},
				"uMetallic" 	: {type: "f",  value: 0},
				"uSpecular" 	: {type: "f",  value: 0},
				"uDetails" 	 	: {type: "f",  value: 1.0},

				"uExposure" 	: {type: "f",  value: 0},
				"uGamma" 	 	: {type: "f",  value: 0},
			}

		] ),

		fragmentShader: [

			"#extension GL_OES_standard_derivatives : enable",
			
			"uniform samplerCube uCubeMapTex;",

			"uniform sampler2D	uBaseColorMap;",
			"uniform sampler2D	uNormalMap;",

			"uniform vec3	uBaseColor;",
			"uniform float	uRoughness;",
			"uniform float	uRoughness4;",
			"uniform float	uMetallic;",
			"uniform float	uSpecular;",
			"uniform float  uDetails;",

			"uniform float	uExposure;",
			"uniform float	uGamma;",

			"varying vec3 vNormal;",
			"varying vec3 vPosition;",
			"varying vec2 vTexCoord;",
			"varying vec3 vEyePosition;",
			"varying vec3 vWsNormal;",

			THREE.ShaderChunk[ "shadowmap_pars_fragment" ],
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
				"vec3 specularColorSqrt = sqrt( clamp( vec3(0.0, 0.0, 0.0), vec3(0.99, 0.99, 0.99), specularColor ) );",
				"vec3 n = ( vec3(1.0) + specularColorSqrt ) / ( vec3(1.0) - specularColorSqrt );",
				"vec3 g = sqrt( n * n + VoH * VoH - 1.0 );",
				"return 0.5 * pow( (g - VoH) / (g + VoH), vec3(2.0) ) * ( 1.0 + pow( ((g+VoH)*VoH - 1.0) / ((g-VoH)*VoH + 1.0), vec3(2.0) ) );",
			"}",

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

			// From "I'm doing it wrong"
			// http://imdoingitwrong.wordpress.com/2011/01/31/light-attenuation/
			/*"float getAttenuation( vec3 lightPosition, vec3 vertexPosition, float lightRadius )",
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
			"}",*/

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
				"normalDetails		= mix( vec3( 0.0,0.0,1), normalDetails, uDetails );",
	
				// get the normal, light, position and half vector normalized
				"vec3 N             = blendNormals( vNormal, normalDetails );",
				"vec3 V				= normalize( -vPosition );",
	
				"vec3 wsN           = blendNormals( vWsNormal, normalDetails );",
				"vec3 wsV           = normalize( vEyePosition );",
	
				"vec3 baseColor		= texture2D( uBaseColorMap, uv ).rgb * uBaseColor;",
				//
				"vec3 diffuseColor	= baseColor - baseColor * uMetallic;",
				// deduce the specular color from the baseColor and how metallic the material is
				"vec3 specularColor	= mix( vec3( 0.08 * uSpecular ), baseColor, uMetallic );",
	
				"vec3 color			= vec3( 0.0 );",
	
				// sample the pre-filtered cubemap at the corresponding mipmap level
				"int numMips			= 6;",
				"float mip				= float(numMips) - 1.0 + log2(uRoughness);",
				"vec3 lookup			= -reflect( V, N );",
				//lookup					= fix_cube_lookup( lookup, 512, mip );
				"vec3 sampledColor		= textureCube( uCubeMapTex, lookup, mip ).rgb;",
	
				// get the approximate reflectance
				"float NoV				= saturate( dot( N, V ) );",
				"vec3 reflectance		= EnvBRDFApprox( specularColor, uRoughness4, NoV );",
	
				// combine the specular IBL and the BRDF
				"vec3 specularIBL		= sampledColor * reflectance * uSpecular;",
		
				// still have to figure out how to do env. irradiance
				"vec3 diffuseIBL		= textureCube( uCubeMapTex, vWsNormal, 5.0 ).rgb * ( 1.0 - 1.0 * uMetallic ) * diffuseColor;",
		
				// not sure how to combine this with the rest
				"color					+= diffuseIBL + specularIBL;",
		
				//lightings!

				// apply the tone-mapping
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

			"varying vec3	vNormal;",
			"varying vec3	vPosition;",
			"varying vec3	vWsNormal;",
			"varying vec3	vEyePosition;",
			"varying vec2	vTexCoord;",
			
			THREE.ShaderChunk[ "shadowmap_pars_vertex" ],

			"void main(){",

			    "vec4 worldPosition		= modelMatrix * vec4(position,1.0);;",
    			"vec4 viewSpacePosition	= viewMatrix * worldPosition;",
	
    			"vNormal 				= normalize( normalMatrix * normal );",
				"vPosition				= viewSpacePosition.xyz;",
				"vec3 vWsPosition		= worldPosition.xyz;",
				"vTexCoord				= uv;",
	
				"vEyePosition			= - vWsPosition.xyz;", //wrong math??
				"vWsNormal				= vec3( modelMatrix * vec4( normal, 0.0 ) );",
	
    			"gl_Position			= projectionMatrix * viewSpacePosition;",

				THREE.ShaderChunk[ "shadowmap_vertex" ],
			"}"

		].join( "\n" )
	}

};