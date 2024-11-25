import * as THREE from 'three';
import { createDistillationApparatus } from '../ddd/page';

function Distillation({ scene, parameters, results }) {
    // Create the distillation apparatus
    const {apparatus} = createDistillationApparatus(parameters);
    apparatus.position.set(0, -1, 0);
    scene.add(apparatus);

    // Simulation logic for distillation process
    const bubblePositions = new Float32Array(300); // 100 bubbles * 3 components (x, y, z)
    const bubbleVelocities = new Float32Array(300);
    const matrix4 = new THREE.Matrix4();
    for (let i = 0; i < 300; i += 3) {
        resetBubble(i);
    }

    function resetBubble(index) {
        bubblePositions[index] = (Math.random() - 0.5) * 0.8;
        bubblePositions[index + 1] = -2; // Start below the apparatus
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

        // Update liquid level based on feed rate and bottom product rate
        const liquidLevel = Math.min(3.9, Math.max(0.1, 2 + (parameters.feedRate - parameters.bottomProductRate) * 0.01));
    }

    return animate;
}

export { Distillation };