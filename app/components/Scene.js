import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Dist from '../../public/dist.png'

function createScene(container) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0); // Light gray background

    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.autoRotate = false;

    // Create the Process Selection button
    const processButton = document.createElement('button');
    processButton.textContent = 'Select Process';
    processButton.style.cssText = `
        position: absolute;
        bottom: 20px;
        right: 20px;
        padding: 12px 24px;
        background-color: #2c3e50;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 600;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
    `;
    processButton.onmouseover = () => processButton.style.backgroundColor = '#34495e';
    processButton.onmouseout = () => processButton.style.backgroundColor = '#2c3e50';
    container.appendChild(processButton);

    // Create the Process Selection container
    const processContainer = document.createElement('div');
    processContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(240, 240, 240, 0.95);
        display: none;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px;
        box-sizing: border-box;
    `;
    container.appendChild(processContainer);

    // Create the Applications container
    const applicationsContainer = document.createElement('div');
    applicationsContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(240, 240, 240, 0.95);
        display: none;
        flex-direction: column;
        align-items: center;
        padding: 40px;
        box-sizing: border-box;
        overflow-y: auto;
    `;
    container.appendChild(applicationsContainer);

    function showProcessSelection() {
        processContainer.innerHTML = '';
        
        const title = document.createElement('h2');
        title.textContent = 'Select a Chemical Process';
        title.style.cssText = `
            margin-bottom: 30px;
            font-size: 28px;
            font-size: 24px;
            color: #2c3e50;
            text-align: center;
            padding: 0 15px;
        `;
        processContainer.appendChild(title);

        const processes = ['Distillation', 'Fermentation', 'Filtration', 'Reactor Design'];
        const processGrid = document.createElement('div');
        processGrid.style.cssText = `
            display: grid;
            grid-template-columns: 1fr;
            gap: 15px;
            width: 100%;
            max-width: 400px;
            padding: 0 15px;
        `;

        processes.forEach(process => {
            const button = document.createElement('button');
            button.textContent = process;
            button.style.cssText = `
                padding: 12px 15px;
                background-color: #3498db;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                font-weight: 600;
                transition: all 0.3s ease;
                width: 100%;
            `;
            button.onmouseover = () => button.style.backgroundColor = '#2980b9';
            button.onmouseout = () => button.style.backgroundColor = '#3498db';
            button.onclick = () => {
                processContainer.style.display = 'none';
                showApplications(process.toLowerCase());
            };
            processGrid.appendChild(button);
        });

        processContainer.appendChild(processGrid);
        processContainer.style.cssText += `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px 10px; 
            overflow-y: auto; 
        `;
    }

    function showApplications(process) {
        applicationsContainer.innerHTML = '';
        
        const title = document.createElement('h2');
        title.textContent = `Applications of ${process.charAt(0).toUpperCase() + process.slice(1)}`;
        title.style.cssText = `
            margin-bottom: 20px;
            font-size: 22px;
            color: #2c3e50;
            text-align: center;
            padding: 0 15px;
        `;
        applicationsContainer.appendChild(title);

        const applications = getApplications(process);
        const appContainer = document.createElement('div');
        appContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
            max-width: 100%;
            padding: 0 15px; /* Add side padding */
        `;

        applications.forEach((app, index) => {
            const appDiv = document.createElement('div');
            appDiv.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                margin-bottom: 20px;
                width: 100%;
                max-width: 500px; /* Constrain width */
                background-color: white;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                padding: 15px;
            `;
    
            const imageContainer = document.createElement('div');
            imageContainer.style.cssText = `
                position: relative;
                width: 100%;
                height: 200px;
                overflow: hidden;
                border-radius: 10px;
                margin-bottom: 20px;
            `;
    
            const img = document.createElement('img');
            img.src = app.image;
            img.alt = app.name;
            img.style.cssText = `
                width: 100%;
                height: 100%;
                object-fit: cover;
            `;
    
            const arrowLeft = createArrow('left', () => changeImage(index, -1, applications));
            const arrowRight = createArrow('right', () => changeImage(index, 1, applications));
    
            imageContainer.appendChild(img);
            imageContainer.appendChild(arrowLeft);
            imageContainer.appendChild(arrowRight);
    
            const name = document.createElement('h3');
            name.textContent = app.name;
            name.style.cssText = `
                margin-bottom: 10px;
                font-size: 24px;
                color: #2c3e50;
            `;
    
            const description = document.createElement('p');
            description.textContent = app.description;
            description.style.cssText = `
                text-align: center;
                color: #34495e;
                font-size: 16px;
                line-height: 1.6;
            `;
    
            appDiv.appendChild(imageContainer);
            appDiv.appendChild(name);
            appDiv.appendChild(description);
            appContainer.appendChild(appDiv);
        });

        applicationsContainer.appendChild(appContainer);
        applicationsContainer.style.display = 'flex';
    }

    function createArrow(direction, onClick) {
        const arrow = document.createElement('button');
        arrow.innerHTML = direction === 'left' ? '&#10094;' : '&#10095;';
        arrow.style.cssText = `
            position: absolute;
            top: 50%;
            ${direction}: 10px;
            transform: translateY(-50%);
            background-color: rgba(0, 0, 0, 0.5);
            color: white;
            border: none;
            border-radius: 50%;
            width: 35px; /* Slightly smaller on mobile */
            height: 35px; /* Slightly smaller on mobile */
            font-size: 20px; /* Reduced font size */
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background-color 0.3s ease;
        `;
        arrow.onmouseover = () => arrow.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        arrow.onmouseout = () => arrow.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        arrow.onclick = onClick;
        return arrow;
    }

    function changeImage(appIndex, direction, applications) {
        const app = applications[appIndex];
        const currentImageIndex = app.images.indexOf(app.image);
        const newImageIndex = (currentImageIndex + direction + app.images.length) % app.images.length;
        app.image = app.images[newImageIndex];
        
        // Update the displayed image
        const img = document.querySelector(`img[alt="${app.name}"]`);
        img.src = app.image; // Update the image source
    }

    let currentProcess = '';

    function getApplications(process) {
        currentProcess = process;
        const applications = {
            distillation: [
                { 
                    name: 'Petroleum Refining', 
                    images: [
                        '/dist.png',
                        '/dist1.png',
                        '/dist2.png'
                    ],
                    image: '/dist.png',
                    description: 'Separation of crude oil into various fractions like gasoline, diesel, and kerosene. This process is crucial for producing a wide range of petroleum products used in everyday life.'
                },
                { 
                    name: 'Alcohol Production', 
                    images: [
                        '/pet.png',
                        '/pet1.png',
                        '/pet2.png'
                    ],
                    image: '/pet.png',
                    description: 'Purification of alcoholic beverages to increase alcohol content. This process is essential in the production of spirits and high-proof alcohols used in various industries.'
                },
            ],
            fermentation: [
                { 
                    name: 'Beer Brewing', 
                    images: [
                        '/fer.png',
                        '/fer1.png',
                        '/fer2.png',
                    ],
                    image: '/fer.png',
                    description: 'Production of beer through yeast fermentation of malted grains. This ancient process combines art and science to create a wide variety of beer styles enjoyed worldwide.'
                },
                { 
                    name: 'Yogurt Production', 
                    images: [
                        '/yog.png',
                        '/yog1.png',
                        '/yog2.png'
                    ],
                    image: '/yog1.png',
                    description: 'Bacterial fermentation of milk to produce yogurt. This process not only creates a delicious dairy product but also increases its nutritional value and digestibility.'
                },
            ],
            filtration: [
                { 
                    name: 'Water Treatment', 
                    images: [
                        '/wat.png',
                        '/wat1.png',
                        '/wat2.png',
                    ],
                    image: '/wat.png',
                    description: 'Removal of impurities from water for safe drinking and industrial use. This critical process ensures clean water supply for communities and various industrial applications.'
                },
            ],
            'reactor design': [
                { 
                    name: 'Pharmaceutical Manufacturing', 
                    images: [
                        '/pha.png',
                        '/pha1.png',
                        '/pha2.png',
                    ],
                    image: '/pha.png',
                    description: 'Design of reactors for the synthesis of pharmaceutical compounds. This process is at the heart of drug development and production, ensuring the efficient and safe manufacture of life-saving medications.'
                },
                { 
                    name: 'Polymer Production', 
                    images: [
                        '/rec.png',
                        '/rec1.png',
                        '/rec2.png',
                    ],
                    image: '/rec.png',
                    description: 'Reactor design for the polymerization of monomers into various plastics. This process is fundamental to the production of a wide range of materials used in countless applications, from packaging to advanced technologies.'
                },
            ],
        };

        return applications[process] || [];
    }

    processButton.addEventListener('click', showProcessSelection);

    [processContainer, applicationsContainer].forEach(container => {
        container.addEventListener('click', (e) => {
            if (e.target === container) {
                container.style.display = 'none';
            }
        });
    });

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    return { scene, camera, renderer, controls };
}

export { createScene };

