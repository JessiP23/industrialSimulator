import * as THREE from 'three'

function Crystallization({ scene, parameters, results }) {
    // Use InstancedMesh for better performance
    const particleCount = 1000;
    const geometry = new THREE.SphereGeometry(0.05, 8, 8); // Reduced segments for better performance
    const material = new THREE.MeshPhongMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.8
    });
    
    const instancedMesh = new THREE.InstancedMesh(geometry, material, particleCount);
    scene.add(instancedMesh);
    
    // Particle system data structures
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const matrix = new THREE.Matrix4();
    const dummy = new THREE.Object3D();
    
    // Crystal nucleation points
    const nucleationPoints = [];
    const maxNucleationPoints = 5;
    
    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 4;
      positions[i3 + 1] = (Math.random() - 0.5) * 4;
      positions[i3 + 2] = (Math.random() - 0.5) * 4;
      
      velocities[i3] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
    }
    
    // Initialize nucleation points
    for (let i = 0; i < maxNucleationPoints; i++) {
      nucleationPoints.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 3
        ),
        radius: 0.1
      });
    }
    
    const tempVector = new THREE.Vector3();
    const attractionForce = new THREE.Vector3();
    
    function calculateForces(index) {
      const i3 = index * 3;
      attractionForce.set(0, 0, 0);
      
      // Current particle position
      tempVector.set(
        positions[i3],
        positions[i3 + 1],
        positions[i3 + 2]
      );
      
      // Find closest nucleation point and calculate attraction
      let minDist = Infinity;
      let closestPoint = null;
      
      for (const point of nucleationPoints) {
        const dist = tempVector.distanceTo(point.position);
        if (dist < minDist) {
          minDist = dist;
          closestPoint = point;
        }
      }
      
      if (closestPoint) {
        // Calculate attraction to closest nucleation point
        attractionForce.subVectors(closestPoint.position, tempVector);
        const dist = attractionForce.length();
        
        if (dist < closestPoint.radius * 3) {
          // Particle is close to crystal - slow it down and start crystallizing
          const strength = Math.min(1, (3 * closestPoint.radius - dist) / (3 * closestPoint.radius));
          attractionForce.normalize().multiplyScalar(strength * 0.01 * parameters.coolingRate);
          
          // Gradually increase crystal size
          if (dist < closestPoint.radius) {
            closestPoint.radius += 0.0001 * parameters.coolingRate;
          }
        } else {
          // Particle is far from crystal - normal Brownian motion
          attractionForce.set(
            (Math.random() - 0.5) * 0.01,
            (Math.random() - 0.5) * 0.01,
            (Math.random() - 0.5) * 0.01
          );
        }
      }
      
      return attractionForce;
    }
    
    function updateParticle(index) {
      const i3 = index * 3;
      const force = calculateForces(index);
      
      // Update velocity
      velocities[i3] += force.x;
      velocities[i3 + 1] += force.y;
      velocities[i3 + 2] += force.z;
      
      // Apply drag
      const drag = 0.98;
      velocities[i3] *= drag;
      velocities[i3 + 1] *= drag;
      velocities[i3 + 2] *= drag;
      
      // Update position
      positions[i3] += velocities[i3];
      positions[i3 + 1] += velocities[i3 + 1];
      positions[i3 + 2] += velocities[i3 + 2];
      
      // Keep particles in bounds
      const bound = 2;
      if (Math.abs(positions[i3]) > bound) positions[i3] *= 0.95;
      if (Math.abs(positions[i3 + 1]) > bound) positions[i3 + 1] *= 0.95;
      if (Math.abs(positions[i3 + 2]) > bound) positions[i3 + 2] *= 0.95;
    }
    
    function animate() {
      // Update particle physics in batches for better performance
      const batchSize = 100;
      for (let batch = 0; batch < particleCount; batch += batchSize) {
        const end = Math.min(batch + batchSize, particleCount);
        for (let i = batch; i < end; i++) {
          updateParticle(i);
        }
      }
      
      // Update instance matrices
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        dummy.position.set(
          positions[i3],
          positions[i3 + 1],
          positions[i3 + 2]
        );
        
        // Scale particles based on proximity to crystals
        let minDist = Infinity;
        for (const point of nucleationPoints) {
          const dist = dummy.position.distanceTo(point.position);
          minDist = Math.min(minDist, dist);
        }
        
        const scale = minDist < 0.2 ? 
          1 + (results.crystalSize / 50) * (1 - minDist / 0.2) : 1;
        
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);
      }
      
      instancedMesh.instanceMatrix.needsUpdate = true;
    }
    
    return animate;
  }

export {Crystallization}