'use client'

import React, { useState, useEffect, useRef } from 'react'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import * as THREE from 'three'
import { Chart } from 'chart.js/auto'

// Industrial Process Simulator class (unchanged)
class IndustrialProcessSimulator {
  constructor() {
    this.processes = {
      crystallization: this.simulateCrystallization,
      distillation: this.simulateDistillation,
      filtration: this.simulateFiltration,
      fermentation: this.simulateFermentation,
      reactorDesign: this.simulateReactorDesign
    };
  }

  simulateProcess(processName, parameters) {
    if (this.processes[processName]) {
      return this.processes[processName](parameters);
    } else {
      throw new Error(`Process ${processName} not found`);
    }
  }

  simulateCrystallization({ temperature, concentration, coolingRate }) {
    const yieldPercentage = 100 - (temperature * 0.5) + (concentration * 0.3) - (coolingRate * 0.2);
    const crystalSize = (100 - temperature) * 0.1 + (concentration * 0.05) - (coolingRate * 0.02);
    
    return {
      yieldPercentage: Math.max(0, Math.min(100, yieldPercentage)),
      crystalSize: Math.max(0, crystalSize)
    };
  }

  simulateDistillation({ feedRate, refluxRatio, numberOfPlates }) {
    const separation = (numberOfPlates * 0.1) + (refluxRatio * 0.2);
    const energyConsumption = feedRate * (1 + refluxRatio) * 0.5;
    
    return {
      separation: Math.min(99, separation),
      energyConsumption
    };
  }

  simulateFiltration({ particleSize, fluidViscosity, filterArea }) {
    // Advanced filtration calculations
    
    // Convert units to SI
    const dp = particleSize * 0.001; // m
    const mu = fluidViscosity * 0.001; // Pa·s
    const area = filterArea * 0.0001; // m²
    
    // Calculate filter characteristics
    const porosity = 0.4 - (0.1 * particleSize);
    const tortuosity = 1 / porosity;
    
    // Calculate permeability using Kozeny-Carman equation
    const permeability = (porosity * porosity * dp * dp) / 
                        (KOZENY_CONSTANT * (1 - porosity) * (1 - porosity));
    
    // Calculate pressure drop using Darcy's law
    const viscosity = fluidViscosity * 0.001; // Convert to Pa·s
    const flowRate = (permeability * area * 100000) / (viscosity * 0.1); // m³/s
    
    // Calculate filtration efficiency using particle capture models
    const inertialCapture = 1 - Math.exp(-1.5 * particleSize);
    const diffusionalCapture = 0.9 * Math.exp(-particleSize * 10);
    const interceptionCapture = 0.6 * particleSize;
    
    // Combined filtration efficiency
    const totalEfficiency = (inertialCapture + diffusionalCapture + interceptionCapture) * 100;
    
    // Calculate cake formation
    const specificCakeResistance = 1e11 * Math.pow(particleSize, -1.5);
    const cakeCompressibility = 0.2;
    const cakeResistance = specificCakeResistance * (1 + cakeCompressibility * 100000);
    
    return {
      filtrationRate: Math.max(0, flowRate * 1000 * 3600), // Convert to L/h
      filtrationEfficiency: Math.max(0, Math.min(100, totalEfficiency)),
      pressureDrop: cakeResistance * flowRate / area,
      permeability: permeability,
      porosity: porosity * 100,
      particleRetention: totalEfficiency,
      cakeThickness: Math.min(0.2, flowRate * 1000 * specificCakeResistance)
    };
  }

  simulateFermentation({ temperature, pH, sugarConcentration, time }) {
    // Advanced fermentation kinetics model
    
    // Temperature effects
    const tempFactor = Math.exp(-(Math.pow(temperature - 30, 2) / 100));
    
    // pH effects
    const phFactor = Math.exp(-(Math.pow(pH - 5, 2) / 2));
    
    // Calculate specific growth rate using Monod equation
    const μMax = MAX_GROWTH_RATE * tempFactor * phFactor;
    let X = 1.0; // Initial biomass concentration
    let S = sugarConcentration; // Initial substrate concentration
    let P = 0; // Initial product (ethanol) concentration
    
    // Numerical integration of fermentation dynamics
    const dt = 0.1; // Time step
    const steps = Math.floor(time / dt);
    
    for (let i = 0; i < steps; i++) {
      const μ = μMax * (S / (MONOD_KS + S));
      
      // Biomass growth
      const dX = (μ * X - DEATH_RATE * X) * dt;
      
      // Substrate consumption
      const maintenance = MAINTENANCE_COEFFICIENT * X * dt;
      const dS = -(μ * X / YIELD_COEFFICIENT + maintenance) * dt;
      
      // Product formation
      const dP = (μ * X * YIELD_COEFFICIENT * 0.9) * dt; // 90% of theoretical yield
      
      // Update concentrations
      X += dX;
      S = Math.max(0, S + dS);
      P += dP;
    }
    
    // Calculate yields and efficiencies
    const substrateUtilization = ((sugarConcentration - S) / sugarConcentration) * 100;
    const actualYield = (P / (sugarConcentration - S));
    const yieldEfficiency = (actualYield / YIELD_COEFFICIENT) * 100;
    
    return {
      yield: Math.min(100, substrateUtilization),
      alcoholContent: Math.max(0, P),
      biomassConcentration: X,
      substrateRemaining: S,
      yieldEfficiency: Math.min(100, yieldEfficiency),
      productivityRate: P / time,
      metabolicEfficiency: (P / (sugarConcentration - S)) / YIELD_COEFFICIENT * 100
    };
  }

  simulateReactorDesign({ reactorVolume, flowRate, reactionRate, temperature }) {
    // Advanced reactor performance calculations
    
    // Calculate dimensionless numbers
    const characteristicLength = Math.pow(reactorVolume, 1/3);
    const superficialVelocity = flowRate / (Math.PI * Math.pow(characteristicLength/2, 2));
    const Re = (1000 * superficialVelocity * characteristicLength) / FLUID_VISCOSITY;
    
    // Mixing efficiency based on Reynolds number
    const mixingEfficiency = Re > 4000 ? 0.95 : (Re > 2300 ? 0.7 : 0.4);
    
    // Calculate reaction kinetics using Arrhenius equation
    const activationEnergy = 50000; // J/mol (typical value)
    const preExponentialFactor = 1e6; // 1/s (typical value)
    const reactionConstant = preExponentialFactor * Math.exp(-activationEnergy / (UNIVERSAL_GAS_CONSTANT * temperature));
    
    // Calculate conversion using real reactor model (considering non-ideal mixing)
    const theoreticalResidenceTime = reactorVolume / flowRate;
    const effectiveResidenceTime = theoreticalResidenceTime * mixingEfficiency;
    const damkohlerNumber = reactionConstant * effectiveResidenceTime;
    
    // Calculate conversion using tank-in-series model
    const numberOfIdealTanks = Math.max(1, Math.floor(Re / 1000));
    const conversionPerTank = 1 - Math.exp(-damkohlerNumber / numberOfIdealTanks);
    const totalConversion = (1 - Math.pow(1 - conversionPerTank, numberOfIdealTanks)) * 100;
    
    // Calculate heat generation
    const reactionEnthalpy = -100000; // J/mol (exothermic)
    const heatGenerated = reactionEnthalpy * reactionRate * reactorVolume * (totalConversion / 100);
    
    // Calculate pressure drop using Ergun equation
    const voidFraction = 0.4;
    const particleDiameter = 0.005; // m
    const pressureDrop = (150 * FLUID_VISCOSITY * (1 - voidFraction) * (1 - voidFraction) * superficialVelocity) / 
                        (Math.pow(particleDiameter, 2) * Math.pow(voidFraction, 3)) +
                        (1.75 * 1000 * (1 - voidFraction) * Math.pow(superficialVelocity, 2)) / 
                        (particleDiameter * Math.pow(voidFraction, 3));
    
    return {
      conversionRate: Math.min(99.9, totalConversion),
      residenceTime: effectiveResidenceTime,
      heatGenerated: heatGenerated,
      reynoldsNumber: Re,
      mixingEfficiency: mixingEfficiency * 100,
      pressureDrop: pressureDrop,
      numberOfIdealTanks,
      damkohlerNumber
    };
  }
}

const processConfigs = {
  crystallization: [
    { name: 'temperature', min: 0, max: 100, step: 1, default: 25 },
    { name: 'concentration', min: 0, max: 100, step: 1, default: 75 },
    { name: 'coolingRate', min: 0, max: 10, step: 0.1, default: 2 },
  ],
  distillation: [
    { name: 'feedRate', min: 0, max: 200, step: 1, default: 100 },
    { name: 'refluxRatio', min: 0, max: 10, step: 0.1, default: 3 },
    { name: 'numberOfPlates', min: 1, max: 50, step: 1, default: 20 },
  ],
  filtration: [
    { name: 'particleSize', min: 0.01, max: 1, step: 0.01, default: 0.1 },
    { name: 'fluidViscosity', min: 0.1, max: 10, step: 0.1, default: 1 },
    { name: 'filterArea', min: 1, max: 50, step: 1, default: 10 },
  ],
  fermentation: [
    { name: 'temperature', min: 20, max: 40, step: 0.1, default: 30 },
    { name: 'pH', min: 3, max: 9, step: 0.1, default: 6.5 },
    { name: 'sugarConcentration', min: 5, max: 30, step: 0.1, default: 15 },
    { name: 'time', min: 24, max: 120, step: 1, default: 48 },
  ],
  reactorDesign: [
    { name: 'reactorVolume', min: 100, max: 5000, step: 100, default: 1000 },
    { name: 'flowRate', min: 1, max: 50, step: 1, default: 10 },
    { name: 'reactionRate', min: 0.01, max: 0.2, step: 0.01, default: 0.05 },
    { name: 'temperature', min: 20, max: 200, step: 1, default: 80 },
  ],
};

function createScene(container) {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000)
  const renderer = new THREE.WebGLRenderer()
  renderer.setSize(container.clientWidth, container.clientHeight)
  container.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambientLight)

  const pointLight = new THREE.PointLight(0xffffff, 1)
  pointLight.position.set(10, 10, 10)
  scene.add(pointLight)

  camera.position.z = 5

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.25

  return { scene, camera, renderer, controls }
}

function Crystallization({ scene, parameters, results }) {
  const particles = []
  const particleGeometry = new THREE.SphereGeometry(0.05, 32, 32)
  const particleMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 })

  for (let i = 0; i < 1000; i++) {
    const particle = new THREE.Mesh(particleGeometry, particleMaterial)
    particle.position.set(
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 4
    )
    scene.add(particle)
    particles.push(particle)
  }

  function animate() {
    particles.forEach(particle => {
      particle.position.y -= 0.01 * parameters.coolingRate / 5
      if (particle.position.y < -2) {
        particle.position.y = 2
      }
      particle.scale.setScalar(1 + results.crystalSize / 50)
    })
  }

  return animate
}

function Distillation({ scene, parameters, results }) {
  const column = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 4, 32),
    new THREE.MeshPhongMaterial({ color: 0x888888, transparent: true, opacity: 0.5 })
  )
  scene.add(column)

  const bubbles = []
  const bubbleGeometry = new THREE.SphereGeometry(0.05, 32, 32)
  const bubbleMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 })

  for (let i = 0; i < 100; i++) {
    const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial)
    bubble.position.set(
      (Math.random() - 0.5) * 0.8,
      Math.random() * 4 - 2,
      (Math.random() - 0.5) * 0.8
    )
    scene.add(bubble)
    bubbles.push(bubble)
  }

  function animate() {
    bubbles.forEach(bubble => {
      bubble.position.y += 0.02 * parameters.feedRate / 100
      if (bubble.position.y > 2) {
        bubble.position.y = -2
        bubble.position.x = (Math.random() - 0.5) * 0.8
        bubble.position.z = (Math.random() - 0.5) * 0.8
      }
    })

    column.rotation.y += 0.005
  }

  return animate
}

// Physical constants
const GRAVITY = 9.81; // m/s²
const FLUID_DENSITY = 1000; // kg/m³ (water)
const PARTICLE_DENSITY = 2500; // kg/m³ (typical solid particles)
const DARCY_COEFFICIENT = 1.75; // Ergun equation coefficient
const KOZENY_CONSTANT = 5.0; // Kozeny-Carman equation

function Filtration({ scene, parameters, results }) {
  // Create main filtration unit group
  const filtrationUnit = new THREE.Group();
  
  // Create housing with transparent material
  const housingGeometry = new THREE.CylinderGeometry(1.5, 1.5, 4, 32, 32, true);
  const housingMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x316b83,
    metalness: 0.8,
    roughness: 0.2,
    transparent: true,
    opacity: 0.4,
    transmission: 0.6,
    thickness: 0.5,
    clearcoat: 1.0
  });
  const housing = new THREE.Mesh(housingGeometry, housingMaterial);
  filtrationUnit.add(housing);

  // Create filter medium
  const filterGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.2, 32);
  const filterMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xcccccc,
    metalness: 0.3,
    roughness: 0.8,
    transparent: true,
    opacity: 0.9
  });
  const filter = new THREE.Mesh(filterGeometry, filterMaterial);
  filter.position.y = -0.5;
  filtrationUnit.add(filter);

  // Create filter support mesh
  const supportGeometry = new THREE.CylinderGeometry(1.3, 1.3, 0.1, 32);
  const supportMaterial = new THREE.MeshStandardMaterial({
    color: 0x666666,
    metalness: 0.9,
    roughness: 0.2
  });
  const support = new THREE.Mesh(supportGeometry, supportMaterial);
  support.position.y = -0.7;
  filtrationUnit.add(support);

  // Create inlet and outlet pipes
  const pipeGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 16);
  const pipeMaterial = new THREE.MeshStandardMaterial({
    color: 0x888888,
    metalness: 0.9,
    roughness: 0.1
  });
  
  const inletPipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
  inletPipe.position.y = 2;
  filtrationUnit.add(inletPipe);
  
  const outletPipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
  outletPipe.position.y = -2;
  filtrationUnit.add(outletPipe);

  // Create fluid volume above filter
  const fluidGeometry = new THREE.CylinderGeometry(1.45, 1.45, 3, 32);
  const fluidMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x99ccff,
    transparent: true,
    opacity: 0.3,
    transmission: 0.8,
    thickness: 0.5,
    roughness: 0.1
  });
  const fluid = new THREE.Mesh(fluidGeometry, fluidMaterial);
  fluid.position.y = 0.5;
  filtrationUnit.add(fluid);

  scene.add(filtrationUnit);

  // Particle system for visualization
  class FilterParticle {
    constructor(type) {
      this.type = type;
      this.active = true;
      this.timeAlive = 0;
      
      // Different particle types
      const geometries = {
        large: new THREE.SphereGeometry(parameters.particleSize * 0.1, 8, 8),
        medium: new THREE.SphereGeometry(parameters.particleSize * 0.07, 8, 8),
        small: new THREE.SphereGeometry(parameters.particleSize * 0.05, 8, 8)
      };
      
      const materials = {
        large: new THREE.MeshPhysicalMaterial({
          color: 0xff4444,
          transparent: true,
          opacity: 0.8
        }),
        medium: new THREE.MeshPhysicalMaterial({
          color: 0xff8844,
          transparent: true,
          opacity: 0.7
        }),
        small: new THREE.MeshPhysicalMaterial({
          color: 0xffcc44,
          transparent: true,
          opacity: 0.6
        })
      };

      this.mesh = new THREE.Mesh(geometries[type], materials[type]);
      this.velocity = new THREE.Vector3();
      this.captured = false;
      this.resetPosition();
      filtrationUnit.add(this.mesh);
    }

    resetPosition() {
      const radius = Math.random() * 1.2;
      const theta = Math.random() * Math.PI * 2;
      this.mesh.position.set(
        Math.cos(theta) * radius,
        2,
        Math.sin(theta) * radius
      );
    }
  }

  // Create particle systems for different sizes
  const particles = {
    large: Array(100).fill().map(() => new FilterParticle('large')),
    medium: Array(150).fill().map(() => new FilterParticle('medium')),
    small: Array(200).fill().map(() => new FilterParticle('small'))
  };

  // Calculate filter characteristics
  const calculatePorosity = () => {
    return 0.4 - (0.1 * results.filtrationEfficiency / 100);
  };

  const calculatePermeability = (porosity) => {
    const dp = parameters.particleSize * 0.001; // Convert to meters
    return (porosity * porosity * dp * dp) / (KOZENY_CONSTANT * (1 - porosity) * (1 - porosity));
  };

  // Calculate particle terminal velocity
  const calculateTerminalVelocity = (particleSize) => {
    const dp = particleSize * 0.001; // Convert to meters
    const Re = (FLUID_DENSITY * dp * dp * GRAVITY) / (18 * parameters.fluidViscosity * 0.001);
    if (Re < 1) {
      // Stokes regime
      return (dp * dp * (PARTICLE_DENSITY - FLUID_DENSITY) * GRAVITY) / (18 * parameters.fluidViscosity * 0.001);
    } else {
      // Newton regime
      return Math.sqrt((4 * dp * (PARTICLE_DENSITY - FLUID_DENSITY) * GRAVITY) / (3 * FLUID_DENSITY * DARCY_COEFFICIENT));
    }
  };

  // Animation state
  let cakeThickness = 0;
  let totalCapturedParticles = 0;

  // Main animation loop
  function animate() {
    const deltaTime = 1/60;
    const porosity = calculatePorosity();
    const permeability = calculatePermeability(porosity);
    
    // Update filter cake visualization
    cakeThickness = Math.min(0.2, totalCapturedParticles * 0.0001);
    filter.scale.y = 1 + cakeThickness * 2;
    filter.position.y = -0.5 + cakeThickness;
    
    // Update fluid color based on particle concentration
    const turbidity = totalCapturedParticles / 1000;
    fluid.material.opacity = 0.3 + turbidity * 0.2;
    fluid.material.color.setHSL(0.6, 0.5, 1 - turbidity * 0.3);

    // Update particles
    Object.entries(particles).forEach(([size, particleArray]) => {
      particleArray.forEach(particle => {
        if (!particle.captured) {
          // Calculate particle motion
          const terminalVel = calculateTerminalVelocity(parameters.particleSize);
          const flowRate = results.filtrationRate / parameters.filterArea;
          
          // Add vertical velocity component
          particle.velocity.y -= terminalVel * deltaTime;
          
          // Add radial flow component
          const radialPosition = new THREE.Vector2(
            particle.mesh.position.x,
            particle.mesh.position.z
          ).length();
          const radialVelocity = flowRate * (1.2 / (radialPosition + 0.1));
          
          // Update position
          particle.mesh.position.add(particle.velocity.multiplyScalar(deltaTime));
          
          // Check for capture at filter surface
          if (particle.mesh.position.y < (-0.5 + cakeThickness)) {
            const captureProb = 1 - (parameters.particleSize / (size === 'large' ? 1 : size === 'medium' ? 2 : 4));
            if (Math.random() < captureProb) {
              particle.captured = true;
              totalCapturedParticles++;
              particle.mesh.position.y = -0.5 + cakeThickness;
            } else {
              particle.resetPosition();
            }
          }
          
          // Check bounds
          if (particle.mesh.position.y < -2 || radialPosition > 1.4) {
            particle.resetPosition();
            particle.velocity.set(0, 0, 0);
          }
        }
      });
    });

    filtrationUnit.rotation.y += 0.001;
  }

  return animate;
}

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

  // Advanced particle systems
  class FermentationParticle {
    constructor(type) {
      this.type = type;
      this.age = 0;
      this.active = true;
      
      // Different geometries and materials for different particle types
      const geometries = {
        bubble: new THREE.SphereGeometry(0.03 + Math.random() * 0.02, 16, 16),
        yeast: new THREE.SphereGeometry(0.02, 12, 12),
        substrate: new THREE.BoxGeometry(0.02, 0.02, 0.02)
      };
      
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

      this.mesh = new THREE.Mesh(geometries[type], materials[type]);
      this.velocity = new THREE.Vector3();
      this.resetPosition();
      fermenterGroup.add(this.mesh);
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

function ProcessAnimation({ process, parameters, results, container }) {
  const { scene, camera, renderer, controls } = createScene(container)

  let animate
  switch (process) {
    case 'crystallization':
      animate = Crystallization({ scene, parameters, results })
      break
    case 'filtration':
      animate = Filtration({ scene, parameters, results })
      break
    case 'distillation':
      animate = Distillation({ scene, parameters, results })
      break
    case 'fermentation':
      animate = Fermentation({ scene, parameters, results })
      break
    case 'reactorDesign':
      animate = ReactorDesign({ scene, parameters, results })
      break
    default:
      animate = () => {}
  }

  function render() {
    requestAnimationFrame(render)
    animate()
    controls.update()
    renderer.render(scene, camera)
  }

  render()

  return () => {
    renderer.dispose()
    container.removeChild(renderer.domElement)
  }
}

function ResultsChart({ results }) {
  const chartRef = useRef(null)
  const chartInstance = useRef(null)

  useEffect(() => {
    if (results) {
      updateChart()
    }
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [results])

  function updateChart() {
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext('2d')
    const labels = Object.keys(results)
    const data = Object.values(results)

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Simulation Results',
          data: data,
          backgroundColor: [
            'rgba(59, 130, 246, 0.6)',
            'rgba(16, 185, 129, 0.6)',
            'rgba(249, 115, 22, 0.6)',
            'rgba(236, 72, 153, 0.6)',
          ],
          borderColor: [
            'rgba(59, 130, 246, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(249, 115, 22, 1)',
            'rgba(236, 72, 153, 1)',
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    })
  }

  return <canvas ref={chartRef} width="400" height="200"></canvas>
}

export default function Component() {
  const [selectedProcess, setSelectedProcess] = useState('crystallization')
  const [parameters, setParameters] = useState({})
  const [results, setResults] = useState(null)
  const visualizationRef = useRef(null)
  const simulator = new IndustrialProcessSimulator()

  useEffect(() => {
    setParameters(Object.fromEntries(processConfigs[selectedProcess].map(config => [config.name, config.default])))
  }, [selectedProcess])

  useEffect(() => {
    let cleanup
    if (visualizationRef.current && results) {
      cleanup = ProcessAnimation({
        process: selectedProcess,
        parameters,
        results,
        container: visualizationRef.current
      })
    }
    return () => {
      if (cleanup) cleanup()
    }
  }, [selectedProcess, parameters, results])

  function runSimulation() {
    const simulationResults = simulator.simulateProcess(selectedProcess, parameters)
    setResults(simulationResults)
  }

  return (
    <div className="container mx-auto p-4 bg-gray-100 min-h-screen">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <h1 className="text-2xl font-bold">Enhanced Industrial Process Simulator</h1>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap items-center space-x-4 mb-6">
            <select
              value={selectedProcess}
              onChange={(e) => setSelectedProcess(e.target.value)}
              className="block w-64 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.keys(processConfigs).map((process) => (
                <option key={process} value={process}>
                  {process.charAt(0).toUpperCase() + process.slice(1)}
                </option>
              ))}
            </select>
            <button
              onClick={runSimulation}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out"
            >
              Run Simulation
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Process Parameters</h2>
              {processConfigs[selectedProcess].map((config) => (
                <div key={config.name} className="mb-4">
                  <label htmlFor={config.name} className="block text-sm font-medium text-gray-700 mb-1">
                    {config.name.charAt(0).toUpperCase() + config.name.slice(1)}: {parameters[config.name] || config.default}
                  </label>
                  <input
                    type="range"
                    id={config.name}
                    min={config.min}
                    max={config.max}
                    step={config.step}
                    value={parameters[config.name] || config.default}
                    onChange={(e) => setParameters(prev => ({ ...prev, [config.name]: parseFloat(e.target.value) }))}
                    className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              ))}
            </div>
            <div className="bg-gray-50 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Simulation Results</h2>
              {results ? (
                <div>
                  <ResultsChart results={results} />
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {Object.entries(results).map(([key, value]) => (
                      <p key={key} className="text-sm">
                        <span className="font-semibold">{key}:</span> {typeof value === 'number' ? value.toFixed(2) : value}
                      </p>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 italic">Run the simulation to see results.</p>
              )}
            </div>
          </div>
          <div className="mt-6 bg-gray-50 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">3D Process Visualization</h2>
            <div ref={visualizationRef} className="h-[400px]"></div>
          </div>
        </div>
      </div>
    </div>
  )
}