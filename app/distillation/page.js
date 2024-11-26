import * as THREE from 'three';
import { createDistillationApparatus } from '../ddd/page';

function Distillation({ scene, parameters, results }) {
    const { apparatus, update } = createDistillationApparatus(parameters);
    apparatus.position.set(0, -1, 0);
    scene.add(apparatus);

    // Distillation parameters
    const liquids = [
        { name: 'Ethanol', boilingPoint: 78.37, color: 0xFF5733, currentVolume: 0.8 },
        { name: 'Water', boilingPoint: 100, color: 0x2C3E50, currentVolume: 0.2 }
    ];

    // Update liquid level based on feed rate and bottom product rate
    const liquidLevel = {
        ethanol: 0.8, // Initial volume of ethanol
        water: 0.2 // Initial volume of water
    };

    // Simulation logic for distillation process
    const bubblePositions = new Float32Array(300);
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
        const deltaTime = 1 / 60;

        // Update bubble physics based on parameters
        for (let i = 0; i < 300; i += 3) {
            // Apply acceleration
            bubbleVelocities[i] += (Math.random() - 0.5) * 0.001 * parameters.feedRate / 50;
            bubbleVelocities[i + 1] += 0.001 * parameters.feedRate / 50; // Upward force
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
            // Assuming bubbleInstances is already added to the scene
            // bubbleInstances.setMatrixAt(i / 3, matrix4);
        }
        //bubbleInstances.instanceMatrix.needsUpdate = true;

        // Update liquid levels based on boiling points and feed rates
        const temperature = parameters.temperature || 25; // Default temperature
        if (temperature >= liquids[0].boilingPoint) {
            // Simulate ethanol vaporization
            liquidLevel.ethanol -= 0.01; // Reduce ethanol volume
            liquidLevel.water += 0.005; // Add to water volume (as a product)
        }
        if (temperature >= liquids[1].boilingPoint) {
            // Simulate water vaporization
            liquidLevel.water -= 0.01; // Reduce water volume
            // No product for water in this simulation
        }

        // Update the liquid mesh colors and volumes
        const liquid = apparatus.getObjectByName('liquid');
        if (liquid) {
            const mixedColor = new THREE.Color(
                (liquids[0].color >> 16 & 255) * liquidLevel.ethanol + 
                (liquids[1].color >> 16 & 255) * liquidLevel.water,
                (liquids[0].color >> 8 & 255) * liquidLevel.ethanol + 
                (liquids[1].color >> 8 & 255) * liquidLevel.water,
                (liquids[0].color & 255) * liquidLevel.ethanol + 
                (liquids[1].color & 255) * liquidLevel.water
            );

            liquid.material = createLiquidTexture(
                mixedColor, 
                Math.min(0.8, liquidLevel.ethanol + liquidLevel.water),
                temperature
            );

            // Adjust liquid level visually
            liquid.scale.y = Math.max(0.1, liquidLevel.ethanol + liquidLevel.water);
        }

        // Simulate condensation in the condenser
        const condenser = apparatus.getObjectByName('condenser');
        if (condenser) {
            // Simulate cooling and condensation based on temperature and reflux ratio
            const condensationRate = Math.min(1, (100 - temperature) / 100 * parameters.refluxRatio);
            
            // Update results object with current distillation state
            if (results) {
                results.current = {
                    temperature: temperature,
                    liquidComposition: {
                        ethanol: liquidLevel.ethanol,
                        water: liquidLevel.water
                    },
                    condensationRate: condensationRate
                };
            }
        }

        // Call the apparatus update function
        update();

        return {
            liquidLevels: liquidLevel,
            temperature: temperature
        };
    }

    // Helper function to create liquid texture (from previous implementation)
    function createLiquidTexture(color, alpha, temperature) {
        return new THREE.MeshPhysicalMaterial({
            color: color,
            transparent: true,
            opacity: alpha,
            transmission: temperature > 100 ? 0.8 : 0.6,
            roughness: temperature > 100 ? 0.3 : 0.1,
            metalness: 0,
            ior: temperature > 100 ? 1.6 : 1.4,
        });
    }

    return animate;
}

export { Distillation };