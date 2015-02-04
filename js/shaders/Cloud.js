THREE.CloudShader = {

	uniforms: {
		"uTime"			: 	{ type: "f",  value: 0.0  },
		"tColor"		: 	{ type: "t",  value: null },
		"tDepth"		: 	{ type: "t",  value: null },
		"tCloud"		: 	{ type: "t",  value: null },
		"camDirec"		: 	{ type: "v2", value: new THREE.Vector2 }
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

		"uniform vec2  camDirec;",
		"uniform float uTime;",

		"varying vec2 vUv;",

		"#define _period	 6.8",
		"#define cloudScale  0.7",
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

		"void main()",
		"{",	
    		"float cDepth 	= texture2D( tDepth, vUv ).r;",
			"vec2  cuv 	    = vec2(3.5 * vUv.y + camDirec.y, 2.0 * vUv.x + camDirec.x) * (cDepth + 0.05);",
			//"float noise 	= snoise(2.0*vUv);",
			"float noise 	= texture2D(tCloud, vUv).r;",
			"float cloud    = saturate(displace( cuv ) * noise);",
			"vec3  cloudc  	= cloud * cloud * cloudCol;",
			"vec3  color 	= texture2D(tColor, vUv).rgb;",
			"float depth 	= cloudScale * (1.0 - cDepth * cDepth);",
			//"gl_FragColor 	= vec4( mix(cloudc, color, cDepth * cDepth), 1.0 );",
			"gl_FragColor 	= vec4( saturate(color + depth * cloudc), 1.0 );",
		"}"

	].join("\n")

};