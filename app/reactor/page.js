import * as THREE from 'three';
const UNIVERSAL_GAS_CONSTANT = 8.314; // J/(mol·K)
const REFERENCE_PRESSURE = 101325; // Pa (1 atm)
const FLUID_VISCOSITY = 0.001; // Pa·s (water at 20°C)
  
function ReactorDesign({ scene, parameters, results }) {
    // Initialize reactor geometry with more complex structure
    const reactorBody = new THREE.Group();
    
    // Main vessel
    const vessel = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 2, 32),
      new THREE.MeshPhysicalMaterial({
        color: 0x316b83,
        metalness: 0.8,
        roughness: 0.2,
        transparent: true,
        opacity: 0.85,
        thickness: 0.5
      })
    );
    reactorBody.add(vessel);
  
    // Internal baffles for mixing
    const baffleGeometry = new THREE.BoxGeometry(0.1, 1.8, 0.8);
    const baffleMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x444444,
      metalness: 0.9,
      roughness: 0.1
    });
  
    for (let i = 0; i < 4; i++) {
      const baffle = new THREE.Mesh(baffleGeometry, baffleMaterial);
      baffle.rotation.y = (Math.PI / 2) * i;
      baffle.position.x = Math.cos(i * Math.PI / 2) * 0.8;
      baffle.position.z = Math.sin(i * Math.PI / 2) * 0.8;
      reactorBody.add(baffle);
    }
  
    scene.add(reactorBody);
  
    // Particle system for fluid simulation
    const particles = [];
    const particleCount = 1000;
    const particleGeometry = new THREE.SphereGeometry(0.02, 16, 16);
    
    // Create different particle materials for different species
    const reactantMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xff0000,
      emissive: 0x440000,
      transparent: true,
      opacity: 0.8
    });
    
    const productMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x00ff00,
      emissive: 0x004400,
      transparent: true,
      opacity: 0.8
    });
  
    // Initialize particle system with properties
    class ReactorParticle {
      constructor() {
        this.mesh = new THREE.Mesh(particleGeometry, reactantMaterial);
        this.velocity = new THREE.Vector3();
        this.isReacted = false;
        this.residence = 0;
        this.temperature = parameters.temperature;
        
        // Initialize position within reactor
        const theta = Math.random() * Math.PI * 2;
        const radius = Math.random() * 0.8;
        this.mesh.position.set(
          Math.cos(theta) * radius,
          (Math.random() - 0.5) * 1.8,
          Math.sin(theta) * radius
        );
        
        scene.add(this.mesh);
        particles.push(this);
      }
    }
  
    // Initialize particle system
    for (let i = 0; i < particleCount; i++) {
      new ReactorParticle();
    }
  
    // Calculate fluid dynamics parameters
    const calculateReynoldsNumber = (velocity, diameter) => {
      const density = 1000; // kg/m³ (water)
      return (density * velocity * diameter) / FLUID_VISCOSITY;
    };
  
    // Calculate reaction probability based on Arrhenius equation
    const calculateReactionProbability = (temperature, activation_energy = 50000) => {
      return Math.exp(-activation_energy / (UNIVERSAL_GAS_CONSTANT * temperature));
    };
  
    // Main animation and simulation loop
    function animate() {
      const deltaTime = 1/60; // Assuming 60 FPS
      const Re = calculateReynoldsNumber(parameters.flowRate, 2);
      const turbulentMixing = Re > 4000 ? 1.5 : 1.0;
      const reactionProb = calculateReactionProbability(parameters.temperature);
  
      particles.forEach(particle => {
        // Update particle residence time
        particle.residence += deltaTime;
  
        // Calculate base velocity components
        const radialPosition = new THREE.Vector2(particle.mesh.position.x, particle.mesh.position.z).length();
        const tangentialVelocity = (parameters.flowRate * 0.2) * (1 - Math.pow(radialPosition / 0.9, 2));
        
        // Apply velocity components
        particle.velocity.x += (Math.random() - 0.5) * turbulentMixing * parameters.flowRate * 0.1;
        particle.velocity.y += parameters.flowRate * 0.05;
        particle.velocity.z += (Math.random() - 0.5) * turbulentMixing * parameters.flowRate * 0.1;
        
        // Add rotational component
        const rotationAngle = tangentialVelocity * deltaTime;
        const currentPos = new THREE.Vector2(particle.mesh.position.x, particle.mesh.position.z);
        currentPos.rotateAround(new THREE.Vector2(0, 0), rotationAngle);
        particle.mesh.position.x = currentPos.x;
        particle.mesh.position.z = currentPos.y;
        
        // Update position based on velocity
        particle.mesh.position.add(particle.velocity.multiplyScalar(deltaTime));
  
        // Check for reaction occurrence
        if (!particle.isReacted && Math.random() < reactionProb * deltaTime) {
          particle.isReacted = true;
          particle.mesh.material = productMaterial;
          particle.temperature += parameters.reactionRate * 10; // Exothermic reaction
        }
  
        // Boundary checking and particle recycling
        if (Math.abs(particle.mesh.position.y) > 1 || radialPosition > 0.9) {
          // Reset particle at inlet
          particle.mesh.position.set(
            (Math.random() - 0.5) * 0.4,
            -0.9,
            (Math.random() - 0.5) * 0.4
          );
          particle.velocity.set(0, 0, 0);
          particle.isReacted = false;
          particle.residence = 0;
          particle.temperature = parameters.temperature;
          particle.mesh.material = reactantMaterial;
        }
      });
  
      // Rotate reactor body for visualization
      reactorBody.rotation.y += 0.001 * parameters.flowRate;
    }
  
    return animate;
}

export {ReactorDesign}