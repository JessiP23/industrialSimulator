import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

function createScene(container) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff); // White background

    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Add OrbitControls to allow rotation of the scene
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Enable damping for smoother rotation
    controls.dampingFactor = 0.25;

    // Disable auto-rotation
    controls.autoRotate = false;

    // Animation loop to render the scene
    function animate() {
        requestAnimationFrame(animate);
        controls.update(); // Only updates controls when interacting
        renderer.render(scene, camera);
    }
    animate(); // Start the animation loop

    // Return the scene, camera, and renderer
    return { scene, camera, renderer, controls };
}

export { createScene };
