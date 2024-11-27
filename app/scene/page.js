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

    // Create the Applications button
    const applicationsButton = document.createElement('button');
    applicationsButton.textContent = 'Applications';
    applicationsButton.style.cssText = `
        position: absolute;
        bottom: 20px;
        right: 20px;
        padding: 10px 20px;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 16px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    container.appendChild(applicationsButton);

    // Create the Applications container
    const applicationsContainer = document.createElement('div');
    applicationsContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(255, 255, 255, 0.9);
        display: none;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        box-sizing: border-box;
        overflow-y: auto;
    `;
    container.appendChild(applicationsContainer);

    // Function to update applications based on the current process
    function updateApplications(process) {
        applicationsContainer.innerHTML = '';
        
        const title = document.createElement('h2');
        title.textContent = 'Applications';
        title.style.marginBottom = '20px';
        applicationsContainer.appendChild(title);

        const applications = getApplications(process);
        applications.forEach(app => {
            const appDiv = document.createElement('div');
            appDiv.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                margin-bottom: 20px;
            `;

            const img = document.createElement('img');
            img.src = app.image;
            img.alt = app.name;
            img.style.cssText = `
                width: 200px;
                height: 200px;
                object-fit: cover;
                border-radius: 10px;
                margin-bottom: 10px;
            `;

            const name = document.createElement('p');
            name.textContent = app.name;
            name.style.fontWeight = 'bold';

            appDiv.appendChild(img);
            appDiv.appendChild(name);
            applicationsContainer.appendChild(appDiv);
        });
    }

    // Function to get applications based on the process (replace with your own logic)
    function getApplications(process) {
        // This is a placeholder. Replace with your own logic to return applications based on the process
        const applications = {
            distillation: [
                { name: 'Petroleum Refining', image: 'https://example.com/petroleum-refining.jpg' },
                { name: 'Alcohol Production', image: 'https://example.com/alcohol-production.jpg' },
            ],
            crystallization: [
                { name: 'Sugar Production', image: 'https://example.com/sugar-production.jpg' },
                { name: 'Pharmaceutical Manufacturing', image: 'https://example.com/pharma-manufacturing.jpg' },
            ],
            // Add more processes and their applications as needed
        };

        return applications[process] || [];
    }

    // Event listener for the Applications button
    applicationsButton.addEventListener('click', () => {
        applicationsContainer.style.display = 'flex';
        updateApplications('distillation'); // Replace 'distillation' with the current process
    });

    // Close applications container when clicking outside
    applicationsContainer.addEventListener('click', (e) => {
        if (e.target === applicationsContainer) {
            applicationsContainer.style.display = 'none';
        }
    });

    // Animation loop to render the scene
    function animate() {
        requestAnimationFrame(animate);
        controls.update(); // Only updates controls when interacting
        renderer.render(scene, camera);
    }
    animate(); // Start the animation loop

    // Return the scene, camera, and renderer
    return { scene, camera, renderer, controls, updateApplications };
}

export { createScene };
