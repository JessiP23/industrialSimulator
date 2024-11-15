import * as THREE from 'three';
// Biochemical constants
const MONOD_KS = 2.0; // Substrate half-saturation constant (g/L)
const MAINTENANCE_COEFFICIENT = 0.05; // Energy required for cell maintenance (g/g/h)
const YIELD_COEFFICIENT = 0.485; // Theoretical max yield (g ethanol/g glucose)
const DEATH_RATE = 0.01; // Cell death rate constant
const MAX_GROWTH_RATE = 0.3; // Maximum specific growth rate (h^-1)
  
function Fermentation({ scene, parameters, results }) {
    // Create a more sophisticated fermentation vessel
    const fermenterGroup = new THREE.Group();
    
    // Main vessel with realistic materials
    const tankGeometry = new THREE.CylinderGeometry(1, 1.2, 3, 32, 32, true);
    const tankMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x316b83,
      metalness: 0.8,
      roughness: 0.2,
      transparent: true,
      opacity: 0.85,
      thickness: 0.5,
      transmission: 0.2,
      clearcoat: 1.0
    });
    const tank = new THREE.Mesh(tankGeometry, tankMaterial);
    fermenterGroup.add(tank);
  
    // Add cooling jacket
    const jacketGeometry = new THREE.CylinderGeometry(1.1, 1.3, 2.8, 32, 1, true);
    const jacketMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x444444,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.3
    });
    const coolingJacket = new THREE.Mesh(jacketGeometry, jacketMaterial);
    fermenterGroup.add(coolingJacket);
  
    // Add impeller system
    const impellerGroup = new THREE.Group();
    const shaftGeometry = new THREE.CylinderGeometry(0.05, 0.05, 3, 16);
    const metalMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.9,
      roughness: 0.1
    });
    const shaft = new THREE.Mesh(shaftGeometry, metalMaterial);
    impellerGroup.add(shaft);
  
    // Create Rushton turbine impellers
    for (let i = 0; i < 2; i++) {
      const impellerDisc = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 0.05, 32),
        metalMaterial
      );
      impellerDisc.position.y = -0.5 + i * 1;
      
      // Add blades to each impeller
      for (let j = 0; j < 6; j++) {
        const blade = new THREE.Mesh(
          new THREE.BoxGeometry(0.2, 0.1, 0.05),
          metalMaterial
        );
        blade.position.x = Math.cos(j * Math.PI / 3) * 0.4;
        blade.position.z = Math.sin(j * Math.PI / 3) * 0.4;
        blade.rotation.y = j * Math.PI / 3;
        impellerDisc.add(blade);
      }
      impellerGroup.add(impellerDisc);
    }
    fermenterGroup.add(impellerGroup);
  
    // Create liquid volume
    const liquidGeometry = new THREE.CylinderGeometry(0.98, 1.18, 2.5, 32);
    const liquidMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffeb99,
      transparent: true,
      opacity: 0.6,
      transmission: 0.3,
      thickness: 1.0,
      roughness: 0.2
    });
    const liquid = new THREE.Mesh(liquidGeometry, liquidMaterial);
    liquid.position.y = -0.25;
    fermenterGroup.add(liquid);
  
    scene.add(fermenterGroup);
  
    const createParticleGeometry = (size) => {
      const geometry = new THREE.SphereGeometry(size, 16, 16)
      geometry.computeBoundingSphere()
      return geometry
    }
  
    // Advanced particle systems
    class FermentationParticle {
      constructor(type) {
        this.type = type;
        this.age = 0;
        this.active = true;
        
        // Different geometries and materials for different particle types
        const geometries = {
          bubble: createParticleGeometry(0.03 + Math.random() * 0.02),
          yeast: createParticleGeometry(0.02),
          substrate: new THREE.BoxGeometry(0.02, 0.02, 0.02)
        }
  
        const materials = {
          bubble: new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3,
            transmission: 0.9,
            thickness: 0.5,
            roughness: 0.1
          }),
          yeast: new THREE.MeshPhysicalMaterial({
            color: 0xecd6a7,
            transparent: true,
            opacity: 0.8
          }),
          substrate: new THREE.MeshPhysicalMaterial({
            color: 0xffcc00,
            transparent: true,
            opacity: 0.6
          })
        };
  
        this.mesh = new THREE.Mesh(geometries[type], materials[type])
        this.velocity = new THREE.Vector3()
        this.resetPosition()
        fermenterGroup.add(this.mesh)
      }
  
      resetPosition() {
        const radius = Math.random() * 0.9;
        const theta = Math.random() * Math.PI * 2;
        this.mesh.position.set(
          Math.cos(theta) * radius,
          -1.2 + Math.random() * 2.4,
          Math.sin(theta) * radius
        );
      }
    }
  
    // Create particle systems
    const particles = {
      bubbles: Array(300).fill().map(() => new FermentationParticle('bubble')),
      yeast: Array(200).fill().map(() => new FermentationParticle('yeast')),
      substrate: Array(150).fill().map(() => new FermentationParticle('substrate'))
    };
  
    // Simulation state
    let biomassConcentration = 1.0;
    let substrateConcentration = parameters.sugarConcentration;
    let productConcentration = 0;
  
    // Helper functions for biological calculations
    const calculateGrowthRate = (s, temp, ph) => {
      const tempFactor = Math.exp(-(Math.pow(temp - 30, 2) / 100));
      const phFactor = Math.exp(-(Math.pow(ph - 5, 2) / 2));
      return MAX_GROWTH_RATE * (s / (MONOD_KS + s)) * tempFactor * phFactor;
    };
  
    const calculateViscosity = (biomass) => {
      return 0.001 * Math.exp(0.15 * biomass); // Simple viscosity model
    };
  
    // Main animation loop
    function animate() {
      const deltaTime = 1/60;
      const currentTime = parameters.time;
      
      // Update biological state
      const μ = calculateGrowthRate(substrateConcentration, parameters.temperature, parameters.pH);
      const viscosity = calculateViscosity(biomassConcentration);
      
      // Update impeller rotation
      impellerGroup.rotation.y += 0.1 * parameters.temperature / 30;
  
      // Adjust liquid color based on progress
      liquid.material.color.setHSL(
        0.1 - (productConcentration / 100) * 0.05,
        0.6 + (productConcentration / 100) * 0.2,
        0.8 - (productConcentration / 100) * 0.3
      );
  
      // Update particles
      Object.entries(particles).forEach(([type, particleArray]) => {
        particleArray.forEach(particle => {
          switch(type) {
            case 'bubbles':
              // Bubble movement with realistic fluid dynamics
              const buoyancyForce = 0.02 * (1 - viscosity * 10);
              particle.velocity.y += buoyancyForce;
              
              // Add random movement influenced by impeller
              const impellerEffect = 0.01 * parameters.temperature / 30;
              particle.velocity.add(new THREE.Vector3(
                (Math.random() - 0.5) * impellerEffect,
                0,
                (Math.random() - 0.5) * impellerEffect
              ));
              break;
              
            case 'yeast':
              // Yeast cell movement
              const cellMotion = 0.005 * μ;
              particle.velocity.add(new THREE.Vector3(
                (Math.random() - 0.5) * cellMotion,
                (Math.random() - 0.5) * cellMotion,
                (Math.random() - 0.5) * cellMotion
              ));
              break;
              
            case 'substrate':
              // Substrate particle movement
              const diffusion = 0.003 * parameters.temperature / 30;
              particle.velocity.add(new THREE.Vector3(
                (Math.random() - 0.5) * diffusion,
                (Math.random() - 0.5) * diffusion,
                (Math.random() - 0.5) * diffusion
              ));
              break;
          }
  
          // Apply velocity with damping
          particle.mesh.position.add(particle.velocity.multiplyScalar(0.95));
          
          // Boundary checking
          const pos = particle.mesh.position;
          const r = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
          if (r > 0.95 || Math.abs(pos.y) > 1.2) {
            particle.resetPosition();
            particle.velocity.set(0, 0, 0);
          }
        });
      });
  
      fermenterGroup.rotation.y += 0.001;
    }
  
    return animate;
}


export {Fermentation}