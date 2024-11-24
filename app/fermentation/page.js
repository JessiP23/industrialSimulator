import * as THREE from 'three';

// Biochemical constants
const MONOD_KS = 2.0;
const MAINTENANCE_COEFFICIENT = 0.05;
const YIELD_COEFFICIENT = 0.485;
const DEATH_RATE = 0.01;
const MAX_GROWTH_RATE = 0.3;

export function Fermentation({ scene, parameters, results }) {
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

  // Optimized particle creation
  const particleGeometries = {
    bubble: new THREE.SphereGeometry(0.03, 16, 16),
    yeast: new THREE.SphereGeometry(0.02, 16, 16),
    substrate: new THREE.BoxGeometry(0.02, 0.02, 0.02)
  };

  const particleMaterials = {
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

  // Optimized particle system
  class ParticleSystem {
    constructor(type, count) {
      this.type = type;
      this.particles = [];
      this.geometry = particleGeometries[type];
      this.material = particleMaterials[type];

      for (let i = 0; i < count; i++) {
        const mesh = new THREE.Mesh(this.geometry, this.material);
        this.resetParticle(mesh);
        fermenterGroup.add(mesh);
        this.particles.push({
          mesh,
          velocity: new THREE.Vector3(),
          age: 0
        });
      }
    }

    resetParticle(mesh) {
      const radius = Math.random() * 0.9;
      const theta = Math.random() * Math.PI * 2;
      mesh.position.set(
        Math.cos(theta) * radius,
        -1.2 + Math.random() * 2.4,
        Math.sin(theta) * radius
      );
    }

    update(deltaTime, parameters, μ, viscosity) {
      this.particles.forEach(particle => {
        switch(this.type) {
          case 'bubble':
            this.updateBubble(particle, deltaTime, parameters, viscosity);
            break;
          case 'yeast':
            this.updateYeast(particle, deltaTime, μ);
            break;
          case 'substrate':
            this.updateSubstrate(particle, deltaTime, parameters);
            break;
        }

        particle.mesh.position.add(particle.velocity.multiplyScalar(0.95));
        
        const pos = particle.mesh.position;
        const r = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
        if (r > 0.95 || Math.abs(pos.y) > 1.2) {
          this.resetParticle(particle.mesh);
          particle.velocity.set(0, 0, 0);
        }
      });
    }

    updateBubble(particle, deltaTime, parameters, viscosity) {
      const buoyancyForce = 0.02 * (1 - viscosity * 10) * deltaTime;
      particle.velocity.y += buoyancyForce;
      
      const impellerEffect = 0.01 * parameters.temperature / 30 * deltaTime;
      particle.velocity.add(new THREE.Vector3(
        (Math.random() - 0.5) * impellerEffect,
        0,
        (Math.random() - 0.5) * impellerEffect
      ));
    }

    updateYeast(particle, deltaTime, μ) {
      const cellMotion = 0.005 * μ * deltaTime;
      particle.velocity.add(new THREE.Vector3(
        (Math.random() - 0.5) * cellMotion,
        (Math.random() - 0.5) * cellMotion,
        (Math.random() - 0.5) * cellMotion
      ));
    }

    updateSubstrate(particle, deltaTime, parameters) {
      const diffusion = 0.003 * parameters.temperature / 30 * deltaTime;
      particle.velocity.add(new THREE.Vector3(
        (Math.random() - 0.5) * diffusion,
        (Math.random() - 0.5) * diffusion,
        (Math.random() - 0.5) * diffusion
      ));
    }
  }

  // Create optimized particle systems
  const particleSystems = {
    bubbles: new ParticleSystem('bubble', 300),
    yeast: new ParticleSystem('yeast', 200),
    substrate: new ParticleSystem('substrate', 150)
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
  function animate(time) {
    const deltaTime = time - (animate.lastTime || 0);
    animate.lastTime = time;

    // Update biological state
    const μ = calculateGrowthRate(substrateConcentration, parameters.temperature, parameters.pH);
    const viscosity = calculateViscosity(biomassConcentration);
    
    // Update concentrations
    const biomassProduction = μ * biomassConcentration * deltaTime;
    const substrateConsumption = (biomassProduction / YIELD_COEFFICIENT + MAINTENANCE_COEFFICIENT * biomassConcentration) * deltaTime;
    const productFormation = substrateConsumption * YIELD_COEFFICIENT * deltaTime;

    biomassConcentration += biomassProduction - DEATH_RATE * biomassConcentration * deltaTime;
    substrateConcentration -= substrateConsumption;
    productConcentration += productFormation;

    // Update results
    results.setBiomassConcentration(biomassConcentration);
    results.setSubstrateConcentration(substrateConcentration);
    results.setProductConcentration(productConcentration);
    
    // Update impeller rotation
    impellerGroup.rotation.y += 0.1 * parameters.temperature / 30 * deltaTime / 1000;

    // Adjust liquid color based on progress
    liquid.material.color.setHSL(
      0.1 - (productConcentration / 100) * 0.05,
      0.6 + (productConcentration / 100) * 0.2,
      0.8 - (productConcentration / 100) * 0.3
    );

    // Update particles
    Object.values(particleSystems).forEach(system => {
      system.update(deltaTime / 1000, parameters, μ, viscosity);
    });

    fermenterGroup.rotation.y += 0.001 * deltaTime / 1000;

    // Add foam formation
    if (Math.random() < 0.05) {
      createFoamBubble();
    }

    // Update foam bubbles
    updateFoamBubbles(deltaTime / 1000);
  }

  // Foam formation
  const foamBubbles = [];
  const foamGeometry = new THREE.SphereGeometry(0.05, 16, 16);
  const foamMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.7,
    transmission: 0.2,
    thickness: 0.5,
    roughness: 0.1
  });

  function createFoamBubble() {
    const bubble = new THREE.Mesh(foamGeometry, foamMaterial);
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.9 + Math.random() * 0.1;
    bubble.position.set(
      Math.cos(angle) * radius,
      1.2 + Math.random() * 0.2,
      Math.sin(angle) * radius
    );
    bubble.scale.setScalar(0.5 + Math.random() * 0.5);
    fermenterGroup.add(bubble);
    foamBubbles.push({
      mesh: bubble,
      life: 5 + Math.random() * 5
    });
  }

  function updateFoamBubbles(deltaTime) {
    for (let i = foamBubbles.length - 1; i >= 0; i--) {
      const bubble = foamBubbles[i];
      bubble.life -= deltaTime;
      if (bubble.life <= 0) {
        fermenterGroup.remove(bubble.mesh);
        foamBubbles.splice(i, 1);
      } else {
        bubble.mesh.material.opacity = Math.min(0.7, bubble.life / 2);
      }
    }
  }

  // Temperature fluctuation
  let temperatureFluctuation = 0;
  function updateTemperature(deltaTime) {
    temperatureFluctuation += (Math.random() - 0.5) * 0.1 * deltaTime;
    temperatureFluctuation *= 0.98; // Damping
    parameters.temperature += temperatureFluctuation;
    parameters.temperature = Math.max(20, Math.min(40, parameters.temperature));
  }

  // Enhanced animation loop
  function enhancedAnimate(time) {
    animate(time);
    updateTemperature(time - (enhancedAnimate.lastTime || 0));
    enhancedAnimate.lastTime = time;
  }

  return enhancedAnimate;
}

