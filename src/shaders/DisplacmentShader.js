const DisplacementShader = {
	uniforms: {
		tDiffuse: { value: null },
		uTime: { value: 0 },
	},

	vertexShader: /* glsl */ `
			varying vec2 vUV;
			void main () {
				gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
				vUV = uv;
					
	}`,
	fragmentShader: /* glsl */ `
			uniform sampler2D tDiffuse;
			uniform float uTime;
			varying vec2 vUV;
			void main () {
				vec2 newUV = vec2(vUV.x, vUV.y+ sin(vUV.x* 10.0 + uTime)* 0.1 );
				float offset = 0.01;
				newUV.y +=offset; 

				vec4 color = texture2D(tDiffuse, newUV);
				gl_FragColor = color;


			} 
	`,
};

export default DisplacementShader;
