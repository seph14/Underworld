THREE.CloudShader = {

	uniforms: {
		"uTime"			: 	{ type: "f",  value: 0.0  },
		"tColor"		: 	{ type: "t",  value: null },
		"tDepth"		: 	{ type: "t",  value: null },
		"tCloud"		: 	{ type: "t",  value: null },
		"camDirec"		: 	{ type: "v3", value: new THREE.Vector3 },
		"camPos"		: 	{ type: "v3", value: new THREE.Vector3 }
	},

	vertexShader: [
		"varying vec2 vUv;",
		"void main() {",
			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
		"}"

	].join("\n"),

	fragmentShader: [
		"uniform sampler2D tColor;",
		"uniform sampler2D tDepth;",
		"uniform sampler2D tCloud;",

		"uniform vec3  camDirec;",
		"uniform vec3  camPos;",
		"uniform float uTime;",

		"varying vec2 vUv;",

		"#define _period	 2.8",
		"#define cloudScale  0.4",
		"#define saturate(x) clamp(x, 0.0, 1.0)",	
		"#define cloudCol    vec3(232.0/255.0, 210.0/255.0, 156.0/255.0)",

		// perlin noise 
		// Description : Array and textureless GLSL 2D simplex noise function.
		//      Author : Ian McEwan, Ashima Arts.
		//  Maintainer : ijm
		//     Lastmod : 20110822 (ijm)
		//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
		//               Distributed under the MIT License. See LICENSE file.
		//               https://github.com/ashima/webgl-noise
		// 

		"vec3 mod289(vec3 x) {",
  			"return x - floor(x * (1.0 / 289.0)) * 289.0;",
		"}",

		"vec2 mod289(vec2 x) {",
  			"return x - floor(x * (1.0 / 289.0)) * 289.0;",
		"}",

		"vec3 permute(vec3 x) {",
  			"return mod289(((x*34.0)+1.0)*x);",
		"}",

		"float snoise(vec2 v)",
  		"{",
  			"const vec4 C = vec4(0.211324865405187,",  // (3.0-sqrt(3.0))/6.0
                      			"0.366025403784439,",  // 0.5*(sqrt(3.0)-1.0)
                     			"-0.577350269189626,", // -1.0 + 2.0 * C.x
                      			"0.024390243902439);", // 1.0 / 41.0
			// First corner
  			"vec2 i  = floor(v + dot(v, C.yy) );",
  			"vec2 x0 = v -   i + dot(i, C.xx);",

			// Other corners
  			"vec2 i1;",
  			//i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
  			//i1.y = 1.0 - i1.x;
  			"i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);",
  			// x0 = x0 - 0.0 + 0.0 * C.xx ;
  			// x1 = x0 - i1 + 1.0 * C.xx ;
  			// x2 = x0 - 1.0 + 2.0 * C.xx ;
  			"vec4 x12 = x0.xyxy + C.xxzz;",
  			"x12.xy -= i1;",

			// Permutations
  			"i = mod289(i);", // Avoid truncation effects in permutation
  			"vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));",

  			"vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);",
  			"m = m*m ;",
  			"m = m*m ;",

			// Gradients: 41 points uniformly over a line, mapped onto a diamond.
			// The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)

  			"vec3 x = 2.0 * fract(p * C.www) - 1.0;",
  			"vec3 h = abs(x) - 0.5;",
  			"vec3 ox = floor(x + 0.5);",
  			"vec3 a0 = x - ox;",

			// Normalise gradients implicitly by scaling m
			// Approximation of: m *= inversesqrt( a0*a0 + h*h );
  			"m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );",

			// Compute final noise value at P
  			"vec3 g;",
  			"g.x  = a0.x  * x0.x  + h.x  * x0.y;",
  			"g.yz = a0.yz * x12.xz + h.yz * x12.yw;",
  			"return 130.0 * dot(m, g);",
		"}",

		"float wave( float period ){",
			"return sin( period * _period );",
		"}",

		"float displace( vec2 uv ){",
			"float d = wave( (uv.x * 0.5) - uTime * 0.01 );",
			"d -= 1.10 * wave((uv.x * 0.9) - uTime * 0.04 );",
			"d -= 0.25 * wave(((uv.x + uv.y) * 2.2) - uTime * 0.05 );",
			"d += 0.35 * wave((uv.y * 1.2) - uTime * 0.01 );",
			"d -= 0.25 * wave(((uv.x + uv.y) * 2.8) - uTime * 0.09 );",
			"d += 0.25 * wave(((uv.y - uv.x) * 1.9) - uTime * 0.08 );",
			"return d;",
		"}",

		"float noise( in vec3 x )",
		"{",
			"float z = x.z*64.0;",
			"const vec2 offz = vec2(0.317,0.123);",
			"vec2 uv1 = x.xy + offz*floor(z);",
			"vec2 uv2 = uv1  + offz;",
			"return mix(texture2D( tCloud, uv1 ,-100.0).x,texture2D( tCloud, uv2 ,-100.0).x,fract(z))-0.5;",
		"}",

		//https://www.shadertoy.com/view/Msf3zX#
  		"float noises( in vec3 p){",
			"float a = 0.0;",
			"for(float i=1.0;i<6.0;i++){",
				"a += noise(p)/i;",
				"p = p*2.0 + vec3(0.0,a*0.001/i,a*0.0001/i);",
			"}",
			"return a;",
		"}",

		"float clouds( in vec3 p )",
		"{",
			"return noises(vec3(p.x*0.3+(uTime*30.0),p.y,p.z)*0.0003)-max(p.y,0.0)*0.00009;",
		"}",

		"void main()",
		"{",	

			//"vec2 uv     	= gl_FragCoord.xy/(resolution.xx*0.5)-vec2(1.0,resolution.y/resolution.x);",
			//"vec2 p 		= (-resolution.xy + 2.0*gl_FragCoord.xy)/ resolution.y;",
    		"vec3 col 		= texture2D(tColor, vUv).rgb;",
			//"vec3 campos    = vec3(30.0,500.0,uTime*8.0);",
			//"vec3 ray   	= rotate(normalize(vec3(uv.x,uv.y-sin(uTime*0.05)*0.2-0.1,1.0).xyz),uTime*0.01);",
    
    		//matrixWorldInverse
    		// camera
    		//"vec3 uu = normalize(cross( vec3(0.0,1.0,0.0), camDirec ));",
    		//"vec3 vv = normalize(cross( camDirec,		  uu	    ));",
    		"vec3 rd = normalize( 2.0*(vUv.x-0.5)*vv + 2.0*(vUv.y-0.5)*uu + camDirec );",

    		"float cDepth 	= texture2D( tDepth, vUv ).r;",
			"vec2  cuv 	    = vec2(3.5 * rd.x, 2.0 * rd.y);",
			"float noise 	= 0.0;",//texture2D(tCloud, vUv).r;",
			"float dist 	= 1.0;",

			"for( float i = 0.0; i <= 16.0; i ++ )",
			"{",
				//"noise += 0.3 * displace( cuv * (0.05 + 0.15 * dist) );",
				//0.05 * camPos + 
				"vec3 p = camPos + i * rd;",
				"noise += 0.5 * noises(vec3(p.x*0.3+(uTime*3.0),p.y,p.z)*0.003);", 
				//noises( camPos + dist * rd + vec3(0.06 * uTime,0,0) );",// * displace( cuv * (0.05 + 0.15 * dist) );",
				//"noise += 0.2 * clouds( camPos + dist * rd );", //+ 0.2 * displace( cuv * (0.05 + 0.15 * dist) );",
				"dist  -= 0.0625;",
				"if( dist < cDepth ) break;",
			"}",

			//"float cloud    = saturate(noise);",
			"vec3  cloudc  	= noise * noise * cloudCol;",
			//"vec3  color 	= texture2D(tColor, vUv).rgb;",
			"float depth 	= cloudScale * (1.0 - 0.9 * cDepth * cDepth);",
			"gl_FragColor 	= vec4( col + depth * cloudc, 1.0 );",
			//"gl_FragColor 	= vec4( noise, noise, noise, 1.0 );",
		"}"

	].join("\n")

};

/*THREE.CloudRaytraceShader = {

	uniforms: {
		"uTime"			: 	{ type: "f",  value: 0.0  },
		"tColor"		: 	{ type: "t",  value: null },
		"tDepth"		: 	{ type: "t",  value: null },
		"tCloud"		: 	{ type: "t",  value: null },
		"camDirec"		: 	{ type: "v3", value: new THREE.Vector3 }
	},

	vertexShader: [
		"varying vec2 vUv;",
		"void main() {",
			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
		"}"

	].join("\n"),

	fragmentShader: [
		"uniform sampler2D tColor;",
		"uniform sampler2D tDepth;",
		"uniform sampler2D tCloud;",

		"uniform vec3  camDirec;",
		"uniform float uTime;",

		"varying vec2 vUv;",

		"#define _period	 6.8",
		"#define cloudScale  0.7",
		"#define saturate(x) clamp(x, 0.0, 1.0)",	
		"#define cloudCol    vec3(232.0/255.0, 210.0/255.0, 156.0/255.0)",

		// perlin noise 
		// Description : Array and textureless GLSL 3D simplex noise function.
		//      Author : Ian McEwan, Ashima Arts.
		//  Maintainer : ijm
		//     Lastmod : 20110822 (ijm)
		//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
		//               Distributed under the MIT License. See LICENSE file.
		//               https://github.com/ashima/webgl-noise
		// 

		"vec3 mod289(vec3 x) {",
  			"return x - floor(x * (1.0 / 289.0)) * 289.0;",
		"}",

		"vec2 mod289(vec2 x) {",
  			"return x - floor(x * (1.0 / 289.0)) * 289.0;",
		"}",

		"vec3 permute(vec3 x) {",
  			"return mod289(((x*34.0)+1.0)*x);",
		"}",

		"vec4 mod289(vec4 x) {",
  			"return x - floor(x * (1.0 / 289.0)) * 289.0;",
		"}",

		"vec4 permute(vec4 x) {",
     		"return mod289(((x*34.0)+1.0)*x);",
		"}",

		"vec4 taylorInvSqrt(vec4 r)",
		"{",
  			"return 1.79284291400159 - 0.85373472095314 * r;",
		"}",

		"float snoise(vec3 v)",
  		"{",
  			"const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;",
  			"const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);",

			// First corner
  			"vec3 i  = floor(v + dot(v, C.yyy) );",
  			"vec3 x0 =   v - i + dot(i, C.xxx) ;",

			// Other corners
  			"vec3 g = step(x0.yzx, x0.xyz);",
  			"vec3 l = 1.0 - g;",
  			"vec3 i1 = min( g.xyz, l.zxy );",
  			"vec3 i2 = max( g.xyz, l.zxy );",

  			//   x0 = x0 - 0.0 + 0.0 * C.xxx;
  			//   x1 = x0 - i1  + 1.0 * C.xxx;
  			//   x2 = x0 - i2  + 2.0 * C.xxx;
  			//   x3 = x0 - 1.0 + 3.0 * C.xxx;
  			"vec3 x1 = x0 - i1 + C.xxx;",
  			"vec3 x2 = x0 - i2 + C.yyy;", // 2.0*C.x = 1/3 = C.y
  			"vec3 x3 = x0 - D.yyy;",      // -1.0+3.0*C.x = -0.5 = -D.y

			// Permutations
  			"i = mod289(i);",
  			"vec4 p = permute( permute( permute(",
            		 "i.z + vec4(0.0, i1.z, i2.z, 1.0 ))",
           			 "+ i.y + vec4(0.0, i1.y, i2.y, 1.0 ))", 
           			 "+ i.x + vec4(0.0, i1.x, i2.x, 1.0 ));",

			// Gradients: 7x7 points over a square, mapped onto an octahedron.
			// The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
  			"float n_ = 0.142857142857;", // 1.0/7.0
  			"vec3  ns = n_ * D.wyz - D.xzx;",

  			"vec4 j = p - 49.0 * floor(p * ns.z * ns.z);",  //  mod(p,7*7)

  			"vec4 x_ = floor(j * ns.z);",
  			"vec4 y_ = floor(j - 7.0 * x_ );",    // mod(j,N)

  			"vec4 x = x_ *ns.x + ns.yyyy;",
  			"vec4 y = y_ *ns.x + ns.yyyy;",
  			"vec4 h = 1.0 - abs(x) - abs(y);",

  			"vec4 b0 = vec4( x.xy, y.xy );",
  			"vec4 b1 = vec4( x.zw, y.zw );",

  			//vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
  			//vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
  			"vec4 s0 = floor(b0)*2.0 + 1.0;",
  			"vec4 s1 = floor(b1)*2.0 + 1.0;",
  			"vec4 sh = -step(h, vec4(0.0));",

  			"vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;",
  			"vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;",

  			"vec3 p0 = vec3(a0.xy,h.x);",
  			"vec3 p1 = vec3(a0.zw,h.y);",
  			"vec3 p2 = vec3(a1.xy,h.z);",
  			"vec3 p3 = vec3(a1.zw,h.w);",

			//Normalise gradients
  			"vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));",
  			"p0 *= norm.x;",
  			"p1 *= norm.y;",
  			"p2 *= norm.z;",
  			"p3 *= norm.w;",

			// Mix final noise value
  			"vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);",
  			"m = m * m;",
  			"return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), ",
            			                  "dot(p2,x2), dot(p3,x3) ) );",
  		"}",

		"float wave( float period ){",
			"return sin( period * _period );",
		"}",

		"float displace( vec2 uv ){",
			"float d = wave( (uv.x * 0.5) - uTime * 0.01 );",
			"d -= 1.10 * wave((uv.x * 0.9) - uTime * 0.04 );",
			"d -= 0.25 * wave(((uv.x + uv.y) * 2.2) - uTime * 0.05 );",
			"d += 0.35 * wave((uv.y * 1.2) - uTime * 0.01 );",
			"d -= 0.25 * wave(((uv.x + uv.y) * 2.8) - uTime * 0.09 );",
			"d += 0.25 * wave(((uv.y - uv.x) * 1.9) - uTime * 0.08 );",
			"return d;",
		"}",

		//https://www.shadertoy.com/view/MdlGW7
		"const mat3 m   = mat3( 0.00,  0.80,  0.60,",
                    		  "-0.80,  0.36, -0.48,",
                    		  "-0.60, -0.48,  0.64 );",
		"const vec3 lig = vec3(0.8427009716,0.4815434123,0.2407717062);",

		"float fbm( vec3 p )",
		"{",
    		"float f;",
    		"f  = 0.5000*snoise( p ); p = m*p*2.02;",
    		"f += 0.2500*snoise( p ); p = m*p*2.03;",
    		"f += 0.1250*snoise( p ); p = m*p*2.01;",
    		"f += 0.0625*snoise( p );",
    		"return f;",
		"}",

		"vec4 mapClouds( in vec3 p )",
		"{",
			"float d = 1.0-0.3*abs(2.8 - p.y);",
			"d -= 1.6 * fbm( p*0.35 );",

			"d = clamp( d, 0.0, 1.0 );",
	
			"vec4 res = vec4( d );",

			"res.xyz = mix( 0.8*vec3(1.0,0.95,0.8), 0.2*vec3(0.6,0.6,0.6), res.x );",
			"res.xyz *= 0.65;",
	
			"return res;",
		"}",

		"vec4 raymarchClouds( in vec3 ro, in vec3 rd, in vec3 bcol, float tmax )",
		"{",
			"vec4 sum = vec4(0, 0, 0, 0);",
			"float kk = 0.0;",
			"float sun = clamp( dot(rd,lig), 0.0, 1.0 );",
			"float t = 0.0;",
			"for(int i=0; i<64; i++)",
			"{",
				"if( sum.w>0.99 || t>tmax ) break;",
				"vec3 pos = ro + t*rd;",
				"vec4 col = mapClouds( pos );",

				"float dt = max(0.1,0.05*t);",
				"float h = (2.8-pos.y)/lig.y;",
				"float c = fbm( (pos + lig*h)*0.35 );",
				//kk += 0.05*dt*(smoothstep( 0.38, 0.6, c ))*(1.0-col.a);
				"kk += 0.02*(smoothstep( 0.38, 0.6, c ))*(1.0-col.a)*(1.0-smoothstep(2.75,2.8,pos.y));",
		
				"col.xyz *= vec3(0.4,0.52,0.6);",
		
        		"col.xyz += vec3(1.0,0.7,0.4)*0.4*pow( sun, 6.0 )*(1.0-col.w);",
		
				"col.xyz = mix( col.xyz, bcol, 1.0-exp(-0.0018*t*t) );",
		
				"col.a *= 0.5;",
				"col.rgb *= col.a;",

				"sum = sum + col*(1.0 - sum.a);	",

				"t += dt;",//max(0.1,0.05*t);
			"}",
			"kk = clamp( kk, 0.0, 1.0 );",
			"sum.xyz /= (0.001+sum.w);",

			"return clamp( sum, 0.0, 1.0 );",
		"}",

		"void main()",
		"{",	
    		"float cDepth 	= texture2D( tDepth, vUv ).r;",
			"vec3  cuv 	    = vec3( 5.0*(vUv.x - 0.5)*camDirec.x, 5.0*(vUv.y - 0.5)*camDirec.y, camDirec.z + uTime * 0.1 );",
			
    		"float noise 	= texture2D(tCloud, vUv.xy).r;",
			//"float noise 	= snoise( cuv );",

			"float cloud    = 0.0;",
			"int   ldepth   = 16 - int(floor(16.0 * cDepth));",
			"for( int i = 0; i < 16; i ++ ) {",
				//"cloud += 0.175 * displace( vec2(float(i) * 0.0625, cloud) );", //* snoise( float(i) * 0.0625 * cuv );",
				"cloud += 0.175 * snoise( float(i) * 0.0625 * cuv );",
				"if( i > ldepth ) break;",
			"}",
			//"cloud 			= saturate(cloud);",
			
			"vec3  cloudc  	= saturate(cloud * cloud) * noise * cloudCol;",
			"vec3  color 	= texture2D(tColor, vUv).rgb;",
			"float depth 	= cloudScale * (1.0 - 0.9 * cDepth * cDepth);",
			"gl_FragColor 	= vec4( saturate(color + depth * cloudc), 1.0 );",
		"}"

	].join("\n")

};*/

THREE.CloudRaytraceShader = {

	uniforms: {
		"uTime"			: 	{ type: "f",  value: 0.0  },
		"tColor"		: 	{ type: "t",  value: null },
		"tDepth"		: 	{ type: "t",  value: null },
		"tCloud"		: 	{ type: "t",  value: null },
		"camDirec"		: 	{ type: "v3", value: new THREE.Vector3 },
		"camPos"		: 	{ type: "v3", value: new THREE.Vector3 },
		"resolution"	: 	{ type: "v2", value: new THREE.Vector2 }
	},

	vertexShader: [
		"varying vec2 vUv;",
		"void main() {",
			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
		"}"

	].join("\n"),

	fragmentShader: [
		"uniform sampler2D tColor;",
		"uniform sampler2D tDepth;",
		"uniform sampler2D tCloud;",

		"uniform vec3  camDirec;",
		"uniform vec3  camPos;",
		"uniform vec2  resolution;",
		"uniform float uTime;",

		"varying vec2 vUv;",

		"float noise( in vec3 x )",
		"{",
			"float z = x.z*64.0;",
			"const vec2 offz = vec2(0.317,0.123);",
			"vec2 uv1 = x.xy + offz*floor(z);",
			"vec2 uv2 = uv1  + offz;",
			"return mix(texture2D( tCloud, uv1 ,-100.0).x,texture2D( tCloud, uv2 ,-100.0).x,fract(z))-0.5;",
		"}",

		//would this be faster on mobiles?
		"float rand(vec2 co){",
    		"return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);",
		"}",

		//https://www.shadertoy.com/view/Msf3zX#
  		"float noises( in vec3 p){",
			"float a = 0.0;",
			"for(float i=1.0;i<6.0;i++){",
				"a += noise(p)/i;",
				"p = p*2.0 + vec3(0.0,a*0.001/i,a*0.0001/i);",
			"}",
			"return a;",
		"}",

		"float ground( in vec3 p){",
			"return noise(p*0.00002)*1200.0 + noises(p.zxy*0.00005+10.0) * 40.0 * (0.0+p.y*0.01) + p.y;",
		"}",

		"float clouds( in vec3 p )",
		"{",
			"float b	= noise(p*0.00002)*1200.0;",
			"p.y 		+= b*0.5/abs(p.y) + 100.0;",
			"return noises(vec3(p.x*0.3+(uTime*30.0),p.y,p.z)*0.00002)-max(p.y,0.0)*0.00009;",
		"}",

		"float raymarch( in vec3 ro, in vec3 rd, in float depth )",
		"{",
			"float t  	= 0.0;",
			"float fog 	= 0.0;",
			"vec3  pos  = ro + rd;",
			"float test = 0.0;",
			
			"for(float i=1.0; i<16.0; i++)",
			"{",
				"test  = ground(pos);",
				"fog  += max(test*clouds(pos),fog*0.02);",
				"pos  += rd*min(test,i*i*0.5);",
				"t    += test;",
				"if(abs(test)<10.0||t>depth) break;",
			"}",

			"return fog;",
		"}",

		"vec3 rotate(vec3 r, float v){ return vec3(r.x*cos(v)+r.z*sin(v),r.y,r.z*cos(v)-r.x*sin(v));}",

		"void main()",
		"{",	
    		//"float cDepth 	= texture2D( tDepth, vUv ).r;",
			//"vec2 uv     	= gl_FragCoord.xy/(resolution.xx*0.5)-vec2(1.0,resolution.y/resolution.x);",
			"vec2 uv     	= gl_FragCoord.xy/resolution.xy;",
			//"vec2 p 		= (-resolution.xy + 2.0*gl_FragCoord.xy)/ resolution.y;",
    		//"vec3 col 		= texture2D(tColor, vUv).rgb;",
			//"vec3 campos    = vec3(30.0,500.0,uTime*8.0);",
			//"vec3 ray   	= rotate(normalize(vec3(uv.x,uv.y-sin(uTime*0.05)*0.2-0.1,1.0).xyz),uTime*0.01);",
    
    		// camera
    		// inverse.getInverse(original);
    		/*"vec3 uu = normalize(cross( vec3(0.0,1.0,0.0), camDirec ));",
    		"vec3 vv = normalize(cross( camDirec,		  uu	    ));",
    		"vec3 rd = normalize( uv.x*uu + uv.y*vv + 1.5*camDirec    );",

    		"vec3 pos    = camPos+rd;",
    
    		// raymarch
    		"float test  = 0.0;",
    		"float fog   = 0.0;",
			"float dist  = 0.0;",

			"vec3  p1 = pos;",
			"for(float i=1.0;i<32.0;i++){",
        		"test  = ground(p1);",
				"fog  += max(test*clouds(p1),fog*0.02);",
				"p1   += rd*min(test,i*i*0.5);",
				"dist += test;",
				"if(abs(test)<10.0||dist>40000.0) break;",
			"}",

    		// clouds    
    		//"float fog   = raymarch( campos, ray, 40000.0 - 40000.0 * cDepth );",
    		"float f     = smoothstep(0.0, 800.0, fog);",
    		//"vec3  cloud = vec3(0.70,0.72,0.70)+sin(fog*0.0002)*0.2;",
    		
    		//"gl_FragColor = vec4( col, 1.0 );",
			//"gl_FragColor = vec4( fog, fog, fog, 1.0 );",
       		"gl_FragColor = vec4( f, f, f, 1.0 );",*/
       		//"gl_FragColor = vec4( mix(col,cloud,f),1.0);",
       		"gl_FragColor = texture2D(tColor, uv);",
			//"gl_FragColor = texture2D(tCloud,vUv, -100.0);",
    		//"gl_FragColor = vec4(noise( vec3(vUv,uTime) ), 0.0, 0.0, 1.0);",
		"}"

	].join("\n")

};

THREE.CloudRayMarchShader = {

	uniforms: {
		"uTime"			: 	{ type: "f",  value: 0.0  },
		"uNear"			: 	{ type: "f",  value: 0.0  },
		"uFar"			: 	{ type: "f",  value: 0.0  },
		"tColor"		: 	{ type: "t",  value: null },
		"tCloud"		: 	{ type: "t",  value: null },
		"tDepth"		: 	{ type: "t",  value: null },
		"inverseMat"	: 	{ type: "m4", value: new THREE.Matrix4 },
		"resolution"	: 	{ type: "v2", value: new THREE.Vector2 },
		"cameraPos"		: 	{ type: "v3", value: new THREE.Vector3 },
		"cloudBright"	: 	{ type: "c",  value: new THREE.Color( 0xffffff ) },
		"cloudDark"		: 	{ type: "c",  value: new THREE.Color( 0x323219 ) },
	},

	vertexShader: [
		"void main() {",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
		"}"
	].join("\n"),

	fragmentShader: [
		"uniform sampler2D tColor;",
		"uniform sampler2D tCloud;",
		"uniform sampler2D tDepth;",

		"uniform vec2  resolution;",
		"uniform vec3  cameraPos;",
		"uniform float uTime;",

		"uniform float uNear;",
		"uniform float uFar;",

		"uniform vec3  cloudBright;",
		"uniform vec3  cloudDark;",

		"uniform mat4  inverseMat;",

		"#define MARCHSTEPS   32",
		"#define MARCHINGDIST 450.0",
		"#define DEPTHSCALE  9.0",
		"#define MARCHSCALE  0.7",
		"const mat2 m2 = mat2(1.6,-1.2,1.2,1.6);",
		"const mat3 m3 = mat3( 0.00,  1.60,  1.20, -1.60,  0.72, -0.96, -1.20, -0.96,  1.28 );",

		"float texnoise( vec2 x ) {",
    		"return texture2D(tCloud, x*0.002).x*1.2;",
		"}",

		"float fbm3( vec3 p ) {",
     		"float f = 0.5000*texnoise(p.xz);  p = m3*p*1.1;",
          		  "f += 0.2500*texnoise(p.xy); p = m3*p*1.2;",
          		  "f += 0.0625*texnoise(p.xz);",
  			"return f;",
		"}",

		"vec4 raymarchClouds( in vec3 ro, in vec3 rd, float tmax )",
		"{",
			"vec4 sum = vec4(0, 0, 0, 0);",
			"float t  = 0.0;",
			"for(int i=0; i<MARCHSTEPS; i++)",
			"{",
				"if( sum.w>0.9 || t>tmax ) break;",
				"vec3 pos 	 = ro + t*rd;",
				"float dt 	 = max(0.1,0.05*t);",
				
				"pos 		*= MARCHSCALE;",
				"float a 	 = smoothstep(0.5, 1.0, fbm3( pos ))*0.9;",
        		"vec3 lc 	 = mix(cloudBright, cloudDark, a);",
        		"a 			 = (1.0-sum.w)*a;",
        		"sum 		+= vec4(lc*a, a);", 
				
      			"t 			+= 5.0*dt;",
			"}",
			"sum.rgb /= sum.w+0.001;",
			"return clamp( sum, 0.0, 1.0 );",
		"}",

		"vec3 decodeLocation( vec2 texcoord )",
		"{",
  			"vec4 clipSpaceLocation;",
  			"clipSpaceLocation.xy 		= texcoord * 2.0 - 1.0;",
  			"clipSpaceLocation.z 		= 1.0 - 2.0 * texture2D(tDepth, texcoord).r;",
  			"clipSpaceLocation.w 		= 1.0;",
  			"vec4 homogenousLocation 	= inverseMat * clipSpaceLocation;",
  			"return homogenousLocation.xyz / homogenousLocation.w;",
		"}",

		"void main()",
		"{",	
    		"vec2  uv     	= gl_FragCoord.xy/resolution.xy;",	
    		"vec3 col 		= texture2D(tColor, uv).rgb;",
    		"vec3 worldPos	= decodeLocation(uv);",
    		"vec3 direc 	= (worldPos - cameraPos);",
    		"float dist 	= length(direc);",
    		"direc 		    /= dist;",

    		"float f     	= MARCHINGDIST*smoothstep(0.0, DEPTHSCALE, dist);",
    		"vec3 startpos 	= vec3( 5.0*cos(0.2+0.55*uTime), 1.8, 8.0*sin(0.1+0.52*uTime) );",
    		"vec4 res 		= raymarchClouds( startpos, direc, f );",
			"col 		 	= mix( col, res.xyz, res.w );",
			
		    "gl_FragColor = vec4( col, 1.0 );",
    		//"gl_FragColor = vec4( f, f, f, 1.0 );",
       	"}"

	].join("\n")

};