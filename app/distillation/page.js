import * as THREE from 'three';
import { createDistillationApparatus } from '../ddd/page';

function Distillation({ scene, parameters, results }) {
    // Use Object3D for better performance
    const column = new THREE.Object3D();
    
    // Main column vessel using BufferGeometry for better performance
    const columnGeometry = new THREE.CylinderGeometry(0.5, 0.5, 4, 32);
    const columnMaterial = new THREE.MeshPhysicalMaterial({ 
        color: 0x888888, 
        transparent: true, 
        opacity: 0.5,
        roughness: 0.2,
        metalness: 0.8,
        envMapIntensity: 1
    });
    const columnMesh = new THREE.Mesh(columnGeometry, columnMaterial);
    column.add(columnMesh);

    // const aparatus = createDistillationApparatus();
    // aparatus.position.set(0, -1, 0);
    // scene.add(aparatus);
    
    // Add distillation plates using instancing for better performance
    const plateGeometry = new THREE.CylinderGeometry(0.48, 0.48, 0.05, 32);
    const plateMaterial = new THREE.MeshPhysicalMaterial({ 
        color: 0x666666,
        metalness: 0.9,
        roughness: 0.1
    });
    const plateInstances = new THREE.InstancedMesh(plateGeometry, plateMaterial, parameters.numberOfPlates);
    
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < parameters.numberOfPlates; i++) {
        matrix.setPosition(0, (i - parameters.numberOfPlates/2) * (3/parameters.numberOfPlates), 0);
        plateInstances.setMatrixAt(i, matrix);
    }
    column.add(plateInstances);
    
    scene.add(column);
    
    // Enhanced bubble system with instanced rendering
    const bubbleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const bubbleMaterial = new THREE.MeshPhysicalMaterial({ 
        color: 0xffffff, 
        transparent: true, 
        opacity: 0.7,
        roughness: 0,
        metalness: 0.1,
        envMapIntensity: 1
    });
    const bubbleInstances = new THREE.InstancedMesh(bubbleGeometry, bubbleMaterial, 100);
    scene.add(bubbleInstances);
    
    // Particle system for vapor flow visualization
    const particleCount = 1000;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
        particlePositions[i] = (Math.random() - 0.5) * 0.8;
    }
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
        color: 0xcccccc,
        size: 0.02,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);
    
    // Temperature gradient visualization using a custom shader
    const heatmapGeometry = new THREE.CylinderGeometry(0.51, 0.51, 4, 32);
    const heatmapMaterial = new THREE.ShaderMaterial({
        transparent: true,
        uniforms: {
            temperatureGradient: { value: new THREE.Vector4() }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec4 temperatureGradient;
            varying vec2 vUv;
            void main() {
                float temp = mix(temperatureGradient.x, temperatureGradient.y, vUv.y);
                float feedTemp = temperatureGradient.z;
                float reboilerDuty = temperatureGradient.w;
                vec3 color = mix(vec3(0.0, 0.0, 1.0), vec3(1.0, 0.0, 0.0), (temp - feedTemp) / (reboilerDuty * 0.1));
                gl_FragColor = vec4(color, 0.2);
            }
        `
    });
    const heatmap = new THREE.Mesh(heatmapGeometry, heatmapMaterial);
    column.add(heatmap);
    
    // Add liquid level indicator
    const liquidGeometry = new THREE.CylinderGeometry(0.49, 0.49, 0.1, 32);
    const liquidMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x3399ff,
        transparent: true,
        opacity: 0.8,
        roughness: 0.2,
        metalness: 0.1
    });
    const liquidMesh = new THREE.Mesh(liquidGeometry, liquidMaterial);
    liquidMesh.position.y = -1.95; // Start at the bottom of the column
    column.add(liquidMesh);
    
    // Add condenser and reboiler
    const condenserGeometry = new THREE.BoxGeometry(0.8, 0.4, 0.4);
    const condenserMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xaaaaaa,
        roughness: 0.5,
        metalness: 0.8
    });
    const condenser = new THREE.Mesh(condenserGeometry, condenserMaterial);
    condenser.position.set(0, 2.2, 0);
    column.add(condenser);
    
    const reboilerGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.6, 16);
    const reboilerMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xaaaaaa,
        roughness: 0.5,
        metalness: 0.8
    });
    const reboiler = new THREE.Mesh(reboilerGeometry, reboilerMaterial);
    reboiler.position.set(0, -2.3, 0);
    reboiler.rotation.z = Math.PI / 2;
    column.add(reboiler);
    
    // Animation loop with optimized physics calculations
    const bubblePositions = new Float32Array(300); // 100 bubbles * 3 components (x, y, z)
    const bubbleVelocities = new Float32Array(300);
    const matrix4 = new THREE.Matrix4();
    
    for (let i = 0; i < 300; i += 3) {
        resetBubble(i);
    }
    
    function resetBubble(index) {
        bubblePositions[index] = (Math.random() - 0.5) * 0.8;
        bubblePositions[index + 1] = -2;
        bubblePositions[index + 2] = (Math.random() - 0.5) * 0.8;
        bubbleVelocities[index] = 0;
        bubbleVelocities[index + 1] = 0;
        bubbleVelocities[index + 2] = 0;
    }
    
    function animate(time) {
        const deltaTime = 1/60;
        
        // Update bubble physics
        for (let i = 0; i < 300; i += 3) {
            // Apply acceleration
            bubbleVelocities[i] += (Math.random() - 0.5) * 0.001 * parameters.feedRate / 50;
            bubbleVelocities[i + 1] += 0.001 * parameters.feedRate / 50;
            bubbleVelocities[i + 2] += (Math.random() - 0.5) * 0.001 * parameters.feedRate / 50;
            
            // Update position
            bubblePositions[i] += bubbleVelocities[i];
            bubblePositions[i + 1] += bubbleVelocities[i + 1];
            bubblePositions[i + 2] += bubbleVelocities[i + 2];
            
            // Apply drag force
            const dragFactor = 0.99 - (parameters.refluxRatio * 0.001);
            bubbleVelocities[i] *= dragFactor;
            bubbleVelocities[i + 1] *= dragFactor;
            bubbleVelocities[i + 2] *= dragFactor;
            
            // Reset if out of bounds
            if (bubblePositions[i + 1] > 2 || 
                Math.abs(bubblePositions[i]) > 0.4 ||
                Math.abs(bubblePositions[i + 2]) > 0.4) {
                resetBubble(i);
            }
            
            // Update instance matrix
            matrix4.setPosition(bubblePositions[i], bubblePositions[i + 1], bubblePositions[i + 2]);
            bubbleInstances.setMatrixAt(i / 3, matrix4);
        }
        bubbleInstances.instanceMatrix.needsUpdate = true;
        
        // Update temperature gradient visualization
        if (results.temperatures && results.temperatures.length > 0) {
            const minTemp = Math.min(...results.temperatures);
            const maxTemp = Math.max(...results.temperatures);
            heatmap.material.uniforms.temperatureGradient.value.set(
                minTemp,
                maxTemp,
                parameters.feedTemperature,
                parameters.reboilerDuty
            );
        }
        
        // Update liquid level based on feed rate and bottom product rate
        const liquidLevel = Math.min(3.9, Math.max(0.1, 2 + (parameters.feedRate - parameters.bottomProductRate) * 0.01));
        liquidMesh.position.y = liquidLevel - 2;
        liquidMesh.scale.y = liquidLevel / 0.1;
        
        // Rotate column slightly
        column.rotation.y += 0.001 * parameters.feedRate / 50;
    }
    
    return animate;
}

export { Distillation };

