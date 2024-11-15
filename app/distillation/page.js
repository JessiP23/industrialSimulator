import * as THREE from 'three';

function Distillation({ scene, parameters, results }) {
    // Enhanced visual representation
    const column = new THREE.Group();
    
    // Main column vessel
    const columnMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 4, 32),
      new THREE.MeshPhysicalMaterial({ 
        color: 0x888888, 
        transparent: true, 
        opacity: 0.5,
        roughness: 0.2,
        metalness: 0.8,
        envMapIntensity: 1
      })
    );
    column.add(columnMesh);
    
    // Add distillation plates
    const plateGeometry = new THREE.CylinderGeometry(0.48, 0.48, 0.05, 32);
    const plateMaterial = new THREE.MeshPhysicalMaterial({ 
      color: 0x666666,
      metalness: 0.9,
      roughness: 0.1
    });
    
    for (let i = 0; i < parameters.numberOfPlates; i++) {
      const plate = new THREE.Mesh(plateGeometry, plateMaterial);
      plate.position.y = (i - parameters.numberOfPlates/2) * (3/parameters.numberOfPlates);
      column.add(plate);
    }
    
    scene.add(column);
    
    // Enhanced bubble system with particle physics
    const bubbles = [];
    const bubbleGeometry = new THREE.SphereGeometry(0.05, 32, 32);
    const bubbleMaterial = new THREE.MeshPhysicalMaterial({ 
      color: 0xffffff, 
      transparent: true, 
      opacity: 0.7,
      roughness: 0,
      metalness: 0.1,
      envMapIntensity: 1
    });
    
    // Particle system for vapor flow visualization
    const particleSystem = new THREE.Points(
      new THREE.BufferGeometry(),
      new THREE.PointsMaterial({
        color: 0xcccccc,
        size: 0.02,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
      })
    );
    scene.add(particleSystem);
    
    // Temperature gradient visualization
    const heatmap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.51, 0.51, 4, 32),
      new THREE.ShaderMaterial({
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
            vec3 color = mix(vec3(0.0, 0.0, 1.0), vec3(1.0, 0.0, 0.0), temp);
            gl_FragColor = vec4(color, 0.2);
          }
        `
      })
    );
    column.add(heatmap);
    
    // Create bubbles with physics properties
    for (let i = 0; i < 100; i++) {
      const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
      bubble.velocity = new THREE.Vector3();
      bubble.acceleration = new THREE.Vector3();
      resetBubble(bubble);
      scene.add(bubble);
      bubbles.push(bubble);
    }
    
    function resetBubble(bubble) {
      bubble.position.set(
        (Math.random() - 0.5) * 0.8,
        -2,
        (Math.random() - 0.5) * 0.8
      );
      bubble.velocity.set(0, 0, 0);
      bubble.acceleration.set(
        (Math.random() - 0.5) * 0.001,
        0.001 * parameters.feedRate / 50,
        (Math.random() - 0.5) * 0.001
      );
    }
    
    // Animation loop with physics calculations
    function animate(time) {
      const deltaTime = 1/60;
      
      // Update bubble physics
      bubbles.forEach(bubble => {
        // Apply plate interactions
        const plateIndex = Math.floor((bubble.position.y + 2) / (4/parameters.numberOfPlates));
        if (plateIndex >= 0 && plateIndex < parameters.numberOfPlates) {
          const plateY = (plateIndex - parameters.numberOfPlates/2) * (3/parameters.numberOfPlates);
          if (Math.abs(bubble.position.y - plateY) < 0.05) {
            bubble.velocity.y *= 0.5;
            bubble.velocity.x += (Math.random() - 0.5) * 0.1;
            bubble.velocity.z += (Math.random() - 0.5) * 0.1;
          }
        }
        
        // Update position and velocity
        bubble.velocity.add(bubble.acceleration);
        bubble.position.add(bubble.velocity);
        
        // Apply drag force
        bubble.velocity.multiplyScalar(0.99);
        
        // Reset if out of bounds
        if (bubble.position.y > 2 || 
            Math.abs(bubble.position.x) > 0.4 ||
            Math.abs(bubble.position.z) > 0.4) {
          resetBubble(bubble);
        }
      });
      
      // Update temperature gradient visualization
      if (results.temperatures && results.temperatures.length > 0) {
        const minTemp = Math.min(...results.temperatures);
        const maxTemp = Math.max(...results.temperatures);
        heatmap.material.uniforms.temperatureGradient.value.set(
          minTemp,
          maxTemp,
          0,
          0
        );
      }
      
      // Rotate column slightly
      column.rotation.y += 0.001;
    }
    
    return animate;
}

export {Distillation}