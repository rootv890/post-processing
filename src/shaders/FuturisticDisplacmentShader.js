const FuturisticDisplacementShader = {
	uniforms: {
		tDiffuse: { value: null },

		uNormalMap: {
			value: null,
		},
	},

	vertexShader: /* glsl */ `
			varying vec2 vUV;
			void main () {
				gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
				vUV = uv;
					
	}`,
	fragmentShader: /* glsl */ `
			uniform sampler2D tDiffuse;
			uniform sampler2D uNormalMap;
			
			varying vec2 vUV;
			void main () {
				vec3 normalColor = texture2D(uNormalMap, vUV).xyz * 2.0 -1.0;
				vec2 newUV = vUV + normalColor.xy * 0.1;
				vec4 color = texture2D(tDiffuse, newUV); 

				vec3 lightDirection = normalize(vec3(-1.0,1.0,0.0));
				float lightness = clamp(dot(normalColor,lightDirection),0.0,1.0);
				

				
				color.rgb += lightness *.5;

				gl_FragColor =  color;


			} 
	`,
};

export default FuturisticDisplacementShader;
