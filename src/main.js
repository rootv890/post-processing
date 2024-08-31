import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as dat from 'lil-gui';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { DotScreenPass } from 'three/addons/postprocessing/DotScreenPass.js';
import { GlitchPass } from 'three/addons/postprocessing/GlitchPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { RGBShiftShader } from 'three/addons/shaders/RGBShiftShader.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import { GammaCorrectionShader } from 'three/addons/shaders/GammaCorrectionShader.js';
import {
	GodRaysFakeSunShader,
	GodRaysDepthMaskShader,
	GodRaysCombineShader,
	GodRaysGenerateShader,
} from 'three/addons/shaders/GodRaysShader.js';
import FuturisticDisplacementShader from './shaders/FuturisticDisplacmentShader';
import DisplacementShader from './shaders/DisplacmentShader';

// GodRays

/**
 * Base
 */
// Debug
const gui = new dat.GUI();

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

/**
 * Loaders
 */
const gltfLoader = new GLTFLoader();
const cubeTextureLoader = new THREE.CubeTextureLoader();
const textureLoader = new THREE.TextureLoader();

/**
 * Update all materials
 */
const updateAllMaterials = () => {
	scene.traverse((child) => {
		if (
			child instanceof THREE.Mesh &&
			child.material instanceof THREE.MeshStandardMaterial
		) {
			child.material.envMapIntensity = 2.5;
			child.material.needsUpdate = true;
			child.castShadow = true;
			child.receiveShadow = true;
		}
	});
};

/**
 * Environment map
 */
const environmentMap = cubeTextureLoader.load([
	'/textures/environmentMaps/0/px.jpg',
	'/textures/environmentMaps/0/nx.jpg',
	'/textures/environmentMaps/0/py.jpg',
	'/textures/environmentMaps/0/ny.jpg',
	'/textures/environmentMaps/0/pz.jpg',
	'/textures/environmentMaps/0/nz.jpg',
]);
environmentMap.encoding = THREE.sRGBEncoding;

scene.background = environmentMap;
scene.environment = environmentMap;
// scene.backgroundBlurriness = 0.5;

/**
 * Models
 */
gltfLoader.load('/models/DamagedHelmet/glTF/DamagedHelmet.gltf', (gltf) => {
	gltf.scene.scale.set(2, 2, 2);
	gltf.scene.rotation.y = Math.PI * 0.5;
	scene.add(gltf.scene);

	updateAllMaterials();
});

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight('#ffffff', 3);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.normalBias = 0.05;
directionalLight.position.set(0.25, 3, -2.25);
scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
};

window.addEventListener('resize', () => {
	// Update sizes
	sizes.width = window.innerWidth;
	sizes.height = window.innerHeight;

	// Update camera
	camera.aspect = sizes.width / sizes.height;
	camera.updateProjectionMatrix();

	// Update renderer
	renderer.setSize(sizes.width, sizes.height);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

	// Update the effect composer
	effectComposer.setSize(sizes.width, sizes.height);
	effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
	75,
	sizes.width / sizes.height,
	0.1,
	100,
);
camera.position.set(4, 1, -4);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
	canvas: canvas,
	antialias: true,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.physicallyCorrectLights = true;
// renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 1.5;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Post processing
 */

/**
 * Custom Render Taget
 **/

const renderTarget = new THREE.WebGLRenderTarget(800, 600, {
	samples: renderer.getPixelRatio() === 1 ? 2 : 0,
});
const effectComposer = new EffectComposer(renderer, renderTarget);

// setup
effectComposer.setSize(sizes.width, sizes.height);
effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// RenderPass
// Default RenderPass
const renderPass = new RenderPass(scene, camera);
effectComposer.addPass(renderPass);

const dotScreenPass = new DotScreenPass();
dotScreenPass.enabled = false;
effectComposer.addPass(dotScreenPass);

// GlitchPass
const glitchPass = new GlitchPass();
glitchPass.goWild = false;
glitchPass.enabled = false;
effectComposer.addPass(glitchPass);
gui.add(glitchPass, 'enabled').name('GlitchPass');

// RGBShiftPass
const rgbShiftPass = new ShaderPass(RGBShiftShader);
rgbShiftPass.enabled = false;
effectComposer.addPass(rgbShiftPass);

// UnrealBloomPass
const unrealBloomPass = new UnrealBloomPass();
unrealBloomPass.strength = 0.3;
unrealBloomPass.radius = 1;
unrealBloomPass.threshold = 0.6;
unrealBloomPass.enabled = false;
const bloomPass = gui.addFolder('BloomPass');
bloomPass.close();
bloomPass.add(unrealBloomPass, 'enabled').name('UnrealBloomPass');
bloomPass.add(unrealBloomPass, 'strength').min(0).max(2).step(0.001);
bloomPass.add(unrealBloomPass, 'radius').min(0).max(2).step(0.001);
bloomPass.add(unrealBloomPass, 'threshold').min(0).max(1).step(0.001);
effectComposer.addPass(unrealBloomPass);

// Custom Pass

//  1. Tint Pass

const TintShader = {
	uniforms: {
		tDiffuse: { value: null },
		uTint: { value: null }, // Texture to be processed by this shader pass previouse render
	},
	vertexShader: /* glsl */ `
		varying vec2 vUV;

		void main()

		{
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
			vUV = uv;
		}
	`,
	fragmentShader: /* glsl */ `
		// Start
		uniform sampler2D tDiffuse;  // Texture to be processed by this shader pass previouse render
		uniform vec3 uTint; // Tint color
		varying vec2 vUV;

			void main ()
			{
				vec4 color =  texture2D(tDiffuse, vUV);
				color.rgb += uTint;
				
				gl_FragColor =  color;
			}
	`,
};

const tintPass = new ShaderPass(TintShader);
tintPass.material.uniforms.uTint.value = new THREE.Vector3(0.5, 0.1, 0.1);

const tintPassFolder = gui.addFolder('TintPass');
tintPass.enabled = false;
tintPassFolder.close();
tintPassFolder.add(tintPass, 'enabled').name('TintPass');
tintPassFolder
	.add(tintPass.material.uniforms.uTint.value, 'x')
	.min(0)
	.max(1)
	.step(0.001)
	.name('Red');
tintPassFolder
	.add(tintPass.material.uniforms.uTint.value, 'y')
	.min(0)
	.max(1)
	.step(0.001)
	.name('Green');
tintPassFolder
	.add(tintPass.material.uniforms.uTint.value, 'z')
	.min(0)
	.max(1)
	.step(0.001)
	.name('Blue');
effectComposer.addPass(tintPass);

// 2. DisplaceMent Pass
const displacementPass = new ShaderPass(DisplacementShader);
effectComposer.addPass(displacementPass);
displacementPass.enabled = false;
gui.add(displacementPass, 'enabled').name('DisplacementPass');
// displacementPass.enabled = true;

// 3. Futurstic Displacement Pass
// 2. DisplaceMent Pass

const FuturisticDisplacementPass = new ShaderPass(FuturisticDisplacementShader);
FuturisticDisplacementPass.material.uniforms.uNormalMap.value =
	textureLoader.load('/textures/interfaceNormalMap.png');

effectComposer.addPass(FuturisticDisplacementPass);
FuturisticDisplacementPass.enabled = false;
gui
	.add(FuturisticDisplacementPass, 'enabled')
	.name('FuturisticDisplacementPass');

// ^ Last Pass Gamma Correction Linear to sRGB
const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);
displacementPass.material.uniforms.uTime.value = 0;
effectComposer.addPass(gammaCorrectionPass);

// SMAAPass - Anti Aliasing
const smaaPass = new SMAAPass();

if (renderer.getPixelRatio() === 1 && !renderer.capabilities.isWebGL2) {
	effectComposer.addPass(smaaPass);
	console.log('SMAA Pass added');
}

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
	const elapsedTime = clock.getElapsedTime();

	// Update controls
	controls.update();

	// Update Time
	if (displacementPass.enabled) {
		displacementPass.material.uniforms.uTime.value = elapsedTime;
	}

	// Render
	// renderer.render(scene, camera);
	effectComposer.render();

	// Call tick again on the next frame
	window.requestAnimationFrame(tick);
};

tick();
