import * as THREE from 'three';

// Enhanced biochemical constants based on real fermentation data
const MONOD_KS = 1.8; // Substrate half-saturation constant (g/L) - typical for S. cerevisiae
const MAINTENANCE_COEFFICIENT = 0.045; // Energy required for cell maintenance (g/g/h)
const YIELD_COEFFICIENT = 0.51; // Theoretical max yield (g ethanol/g glucose) - closer to real value
const DEATH_RATE = 0.008; // Cell death rate constant - adjusted for typical conditions
const MAX_GROWTH_RATE = 0.28; // Maximum specific growth rate (h^-1) - realistic for yeast

function Fermentation({ scene, parameters, results }) {
    const fermenterGroup = new THREE.Group();
    
    // Enhanced vessel with more realistic materials
    const tankGeometry = new THREE.CylinderGeometry(1, 1.2, 3, 32, 32, true);
    const tankMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x1a3a4a,  // Darker steel blue for better contrast
      metalness: 0.9,
      roughness: 0.3,
      transparent: true,
      opacity: 0.92,
      thickness: 0.8,
      transmission: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.2,
      envMapIntensity: 1.5
    });
    const tank = new THREE.Mesh(tankGeometry, tankMaterial);
    fermenterGroup.add(tank);
  
    // Enhanced cooling jacket with industrial appearance
    const jacketGeometry = new THREE.CylinderGeometry(1.1, 1.3, 2.8, 32, 1, true);
    const jacketMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x2c3e50,  // Dark slate for industrial look
      metalness: 0.95,
      roughness: 0.15,
      transparent: true,
      opacity: 0.4,
      clearcoat: 0.5
    });
    const coolingJacket = new THREE.Mesh(jacketGeometry, jacketMaterial);
    fermenterGroup.add(coolingJacket);
  
    // Enhanced impeller system with more detailed components
    const impellerGroup = new THREE.Group();
    const shaftGeometry = new THREE.CylinderGeometry(0.05, 0.05, 3, 16);
    const metalMaterial = new THREE.MeshStandardMaterial({
      color: 0xc0c0c0,  // Bright steel color
      metalness: 0.95,
      roughness: 0.15,
      envMapIntensity: 1.2
    });
    const shaft = new THREE.Mesh(shaftGeometry, metalMaterial);
    impellerGroup.add(shaft);
  
    // Create more detailed Rushton turbine impellers
    for (let i = 0; i < 2; i++) {
      const impellerDisc = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 0.05, 32),
        metalMaterial
      );
      impellerDisc.position.y = -0.5 + i * 1;
      
      // Enhanced blades with more realistic dimensions
      for (let j = 0; j < 6; j++) {
        const blade = new THREE.Mesh(
          new THREE.BoxGeometry(0.25, 0.08, 0.04),  // More realistic blade dimensions
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
  
    // Enhanced liquid with more realistic fermentation broth appearance
    const liquidGeometry = new THREE.CylinderGeometry(0.98, 1.18, 2.5, 32);
    const liquidMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xd4b483,  // Warm beige color typical of fermentation
      transparent: true,
      opacity: 0.85,
      transmission: 0.2,
      thickness: 1.5,
      roughness: 0.3,
      metalness: 0.1
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
  
    // Enhanced particle systems with more realistic appearances
    class FermentationParticle {
      constructor(type) {
        this.type = type;
        this.age = 0;
        this.active = true;
        
        // Enhanced particle geometries and materials
        const geometries = {
          bubble: createParticleGeometry(0.02 + Math.random() * 0.015),  // Smaller, more realistic bubbles
          yeast: createParticleGeometry(0.015 + Math.random() * 0.005),  // Variable yeast cell sizes
          substrate: new THREE.BoxGeometry(0.015, 0.015, 0.015)  // Smaller substrate particles
        }
  
        const materials = {
          bubble: new THREE.MeshPhysicalMaterial({
            color: 0xe8e8e8,  // Slight grey for CO2 bubbles
            transparent: true,
            opacity: 0.15,
            transmission: 0.95,
            thickness: 0.3,
            roughness: 0.1,
            metalness: 0.1
          }),
          yeast: new THREE.MeshPhysicalMaterial({
            color: 0xd4c26a,  // Warm golden color for yeast
            transparent: true,
            opacity: 0.9,
            metalness: 0.1,
            roughness: 0.8
          }),
          substrate: new THREE.MeshPhysicalMaterial({
            color: 0xf4d03f,  // Bright yellow for glucose
            transparent: true,
            opacity: 0.7,
            metalness: 0.2,
            roughness: 0.3
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
  
    // Optimized particle counts for better performance and realism
    const particles = {
      bubbles: Array(250).fill().map(() => new FermentationParticle('bubble')),
      yeast: Array(180).fill().map(() => new FermentationParticle('yeast')),
      substrate: Array(120).fill().map(() => new FermentationParticle('substrate'))
    };
  
    // Enhanced simulation state
    let biomassConcentration = 1.0;
    let substrateConcentration = parameters.sugarConcentration;
    let productConcentration = 0;
  
    // Enhanced biological calculations
    const calculateGrowthRate = (s, temp, ph) => {
      // More realistic temperature and pH dependencies
      const tempFactor = Math.exp(-(Math.pow(temp - 32, 2) / 80));  // Optimum at 32°C
      const phFactor = Math.exp(-(Math.pow(ph - 4.5, 2) / 1.5));    // Optimum at pH 4.5
      return MAX_GROWTH_RATE * (s / (MONOD_KS + s)) * tempFactor * phFactor;
    };
  
    const calculateViscosity = (biomass) => {
      // Enhanced viscosity model including substrate effects
      return 0.001 * (1 + Math.exp(0.18 * biomass)) * (1 + 0.1 * substrateConcentration);
    };
  
    // Enhanced animation loop
    function animate() {
      const deltaTime = 1/60;
      const currentTime = parameters.time;
      
      // Update biological state
      const μ = calculateGrowthRate(substrateConcentration, parameters.temperature, parameters.pH);
      const viscosity = calculateViscosity(biomassConcentration);
      
      // Temperature-dependent impeller speed
      impellerGroup.rotation.y += 0.12 * (parameters.temperature / 30) * (1 / (viscosity * 5));
  
      // Enhanced liquid color changes
      liquid.material.color.setHSL(
        0.08 - (productConcentration / 100) * 0.03,  // Subtle hue shift
        0.5 + (productConcentration / 100) * 0.3,    // Increased saturation
        0.7 - (productConcentration / 100) * 0.2     // Darker as fermentation progresses
      );
  
      // Enhanced particle behavior
      Object.entries(particles).forEach(([type, particleArray]) => {
        particleArray.forEach(particle => {
          switch(type) {
            case 'bubbles':
              // Enhanced bubble dynamics
              const buoyancyForce = 0.025 * (1 - viscosity * 8);
              particle.velocity.y += buoyancyForce;
              
              // Improved impeller effects
              const impellerEffect = 0.015 * (parameters.temperature / 30) * (1 / (viscosity * 2));
              particle.velocity.add(new THREE.Vector3(
                (Math.random() - 0.5) * impellerEffect,
                (Math.random() - 0.5) * impellerEffect * 0.5,
                (Math.random() - 0.5) * impellerEffect
              ));
              break;
              
            case 'yeast':
              // Enhanced cell movement with viscosity effects
              const cellMotion = 0.006 * μ * (1 / (viscosity * 3));
              particle.velocity.add(new THREE.Vector3(
                (Math.random() - 0.5) * cellMotion,
                (Math.random() - 0.5) * cellMotion * 0.8,
                (Math.random() - 0.5) * cellMotion
              ));
              break;
              
            case 'substrate':
              // Enhanced substrate diffusion
              const diffusion = 0.004 * (parameters.temperature / 30) * (1 / Math.sqrt(viscosity));
              particle.velocity.add(new THREE.Vector3(
                (Math.random() - 0.5) * diffusion,
                (Math.random() - 0.5) * diffusion * 0.7,
                (Math.random() - 0.5) * diffusion
              ));
              break;
          }
  
          // Enhanced particle dynamics
          particle.velocity.multiplyScalar(0.93 + (viscosity * 0.02));
          particle.mesh.position.add(particle.velocity);
          
          // Improved boundary behavior
          const pos = particle.mesh.position;
          const r = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
          if (r > 0.95 || Math.abs(pos.y) > 1.2) {
            particle.resetPosition();
            particle.velocity.set(0, 0, 0);
          }
        });
      });
  
      fermenterGroup.rotation.y += 0.0008;
    }
  
    return animate;
}

export {Fermentation}