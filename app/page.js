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
    const filtrationRate = (filterArea * 0.1) / (particleSize * fluidViscosity);
    const filtrationEfficiency = 100 - (particleSize * 10);
    
    return {
      filtrationRate: Math.max(0, filtrationRate),
      filtrationEfficiency: Math.max(0, Math.min(100, filtrationEfficiency))
    };
  }

  simulateFermentation({ temperature, pH, sugarConcentration, time }) {
    const yields = (sugarConcentration * 0.5) * (1 - Math.abs(pH - 7) * 0.1) * (temperature / 30) * (time / 72);
    const alcoholContent = yields * 0.48;
    
    return {
      yield: Math.max(0, Math.min(100, yields)),
      alcoholContent: Math.max(0, alcoholContent)
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

function Fermentation({ scene, parameters, results }) {
  const tank = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 3, 32),
    new THREE.MeshPhongMaterial({ color: 0x666666, transparent: true, opacity: 0.5 })
  )
  scene.add(tank)

  const bubbles = []
  const bubbleGeometry = new THREE.SphereGeometry(0.05, 32, 32)
  const bubbleMaterial = new THREE.MeshPhongMaterial({ color: 0xffff00, transparent: true, opacity: 0.7 })

  for (let i = 0; i < 200; i++) {
    const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial)
    bubble.position.set(
      (Math.random() - 0.5) * 1.8,
      Math.random() * 3 - 1.5,
      (Math.random() - 0.5) * 1.8
    )
    scene.add(bubble)
    bubbles.push(bubble)
  }

  function animate() {
    bubbles.forEach(bubble => {
      bubble.position.y += 0.01 * parameters.temperature / 30
      if (bubble.position.y > 1.5) {
        bubble.position.y = -1.5
        bubble.position.x = (Math.random() - 0.5) * 1.8
        bubble.position.z = (Math.random() - 0.5) * 1.8
      }
    })

    tank.rotation.y += 0.005
  }

  return animate
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