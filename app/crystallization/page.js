import * as THREE from 'three'

// Physical constants
const GRAVITY = 9.81
const NUCLEATION_THRESHOLD = 0.1
const GROWTH_RATE_CONSTANT = 0.01

// Liquid properties database
const LIQUIDS = {
  water: {
    density: 1000,
    color: 0x64B5F6,
    viscosity: 1.0,
    boilingPoint: 373.15,
    freezingPoint: 273.15,
    name: "Water"
  },
  ethanol: {
    density: 789,
    color: 0xE3F2FD,
    viscosity: 1.2,
    boilingPoint: 351.15,
    freezingPoint: 159.15,
    name: "Ethanol"
  },
  glycerol: {
    density: 1260,
    color: 0xB3E5FC,
    viscosity: 1.412,
    boilingPoint: 563.15,
    freezingPoint: 291.15,
    name: "Glycerol"
  },
  acetone: {
    density: 784,
    color: 0xE1F5FE,
    viscosity: 0.316,
    boilingPoint: 329.15,
    freezingPoint: 178.15,
    name: "Acetone"
  }
}

// Crystal types database
const CRYSTAL_TYPES = {
  cubic: {
    density: 2500,
    geometry: 'BoxGeometry',
    growthRate: 1.0,
    name: "Cubic Crystal"
  },
  octahedral: {
    density: 2300,
    geometry: 'OctahedronGeometry',
    growthRate: 0.8,
    name: "Octahedral Crystal"
  },
  hexagonal: {
    density: 2700,
    geometry: 'CylinderGeometry',
    growthRate: 1.2,
    name: "Hexagonal Crystal"
  }
}

export function Crystallization({ scene, parameters, results }) {
  const config = {
    containerCount: parameters.containerCount || 4,
    particleCount: 2000,
    temperature: parameters.temperature || 300,
    coolingRate: parameters.coolingRate || 1,
    crystalType: parameters.crystalType || 'cubic',
    liquidType: parameters.liquidType || 'water',
    saturationLevel: parameters.saturationLevel || 0.5,
    agitationLevel: parameters.agitationLevel || 1,
    containerSize: { x: 4, y: 4, z: 4 },
    gridSize: 128,
  }

  let containers = []
  let flames = []
  let time = 0

  function createTemperatureGauge(position) {
    const gauge = new THREE.Group()
    
    // Main gauge housing
    const gaugeGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16)
    const gaugeMaterial = new THREE.MeshStandardMaterial({
      color: 0xE0E0E0,
      metalness: 0.8,
      roughness: 0.2
    })
    const gaugeHousing = new THREE.Mesh(gaugeGeometry, gaugeMaterial)
    
    // Gauge face
    const faceGeometry = new THREE.CircleGeometry(0.18, 32)
    const faceMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF
    })
    const gaugeFace = new THREE.Mesh(faceGeometry, faceMaterial)
    gaugeFace.position.y = 0.051
    gaugeFace.rotation.x = -Math.PI / 2
    
    // Temperature indicator needle
    const needleGeometry = new THREE.BoxGeometry(0.01, 0.12, 0.01)
    const needleMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF0000,
      metalness: 0.6,
      roughness: 0.3
    })
    const needle = new THREE.Mesh(needleGeometry, needleMaterial)
    needle.position.y = 0.052
    needle.position.z = 0.06
    
    // Add markings around the gauge
    const markingsGroup = new THREE.Group()
    for (let i = 0; i < 8; i++) {
      const marking = new THREE.Mesh(
        new THREE.BoxGeometry(0.01, 0.02, 0.002),
        new THREE.MeshBasicMaterial({ color: 0x000000 })
      )
      marking.position.y = 0.052
      marking.position.z = 0.16
      marking.rotation.y = (i / 8) * Math.PI * 1.5 - Math.PI * 0.75
      markingsGroup.add(marking)
    }
    
    gauge.add(gaugeHousing)
    gauge.add(gaugeFace)
    gauge.add(needle)
    gauge.add(markingsGroup)
    
    gauge.position.copy(position)
    gauge.rotation.z = Math.PI / 2
    
    return gauge
  }

  function createFlame(position) {
    const flameGroup = new THREE.Group()
    
    // Create multiple flame particles
    const particleCount = 50
    const particles = []
    
    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.1, 8, 8)
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(),
        transparent: true,
        opacity: 0.6
      })
      
      const particle = new THREE.Mesh(geometry, material)
      particle.position.y = Math.random() * 0.5
      particle.scale.setScalar(Math.random() * 0.5 + 0.5)
      
      particles.push({
        mesh: particle,
        speed: Math.random() * 0.02 + 0.01,
        wobble: Math.random() * Math.PI * 2
      })
      
      flameGroup.add(particle)
    }
    
    flameGroup.position.copy(position)
    flameGroup.position.y -= 2.2 // Position below container
    
    flames.push({ group: flameGroup, particles })
    scene.add(flameGroup)
  }

  function updateFlames(deltaTime, temperature) {
    const tempFactor = (temperature - 273.15) / 300 // Convert to Celsius and normalize
    
    flames.forEach(flame => {
      flame.particles.forEach(particle => {
        // Update particle position
        particle.mesh.position.y += particle.speed
        if (particle.mesh.position.y > 1) {
          particle.mesh.position.y = 0
        }
        
        // Wobble motion
        particle.wobble += deltaTime * 5
        particle.mesh.position.x = Math.sin(particle.wobble) * 0.1
        
        // Update color and opacity based on temperature
        const hue = 0.05 - (tempFactor * 0.05) // Shift from yellow to red
        const saturation = 0.8 + (tempFactor * 0.2)
        const lightness = 0.5 + (tempFactor * 0.2)
        
        particle.mesh.material.color.setHSL(hue, saturation, lightness)
        particle.mesh.material.opacity = 0.4 + (tempFactor * 0.4)
        
        // Scale based on temperature
        const scale = 0.5 + (tempFactor * 0.5)
        particle.mesh.scale.setScalar(scale * (Math.random() * 0.2 + 0.9))
      })
    })
  }

  function createContainer(position, index) {
    const container = new THREE.Group()
    
    // Create housing
    const housingGeometry = new THREE.CylinderGeometry(1.5, 1.5, 4, 32, 32)
    const housingMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x2196F3,
      metalness: 0.7,
      roughness: 0.2,
      transparent: true,
      opacity: 0.85,
      transmission: 0.2,
      thickness: 0.5,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1
    })
    const housing = new THREE.Mesh(housingGeometry, housingMaterial)
    
    // Create solution based on liquid type
    const liquid = LIQUIDS[config.liquidType]
    const solutionGeometry = new THREE.CylinderGeometry(1.45, 1.45, 3, 32)
    const solutionMaterial = new THREE.MeshPhysicalMaterial({
      color: liquid.color,
      transparent: true,
      opacity: 0.4,
      transmission: 0.6,
      thickness: 0.5,
      roughness: 0.1,
      ior: 1.33
    })
    const solution = new THREE.Mesh(solutionGeometry, solutionMaterial)
    solution.position.y = 0.5
    
    // Add temperature gauge and other components
    const temperatureGauge = createTemperatureGauge(new THREE.Vector3(1.5, 0, 0))
    
    // Add all components
    container.add(housing)
    container.add(solution)
    container.add(temperatureGauge)
    container.add(createFlangesAndBolts())
    
    // Position container
    container.position.copy(position)
    
    // Initialize particles and crystals for this container
    const containerData = {
      container,
      solution,
      temperatureGauge,
      particles: initializeParticles(),
      crystals: [],
      crystallizationProgress: 0,
      nucleationPoints: []
    }
    
    container.add(containerData.particles)
    containers.push(containerData)
    
    // Create flame under container
    createFlame(position)
    
    scene.add(container)
    return containerData
  }

  function createFlangesAndBolts() {
    const group = new THREE.Group()
    
    // Flanges
    const flangeGeometry = new THREE.CylinderGeometry(1.8, 1.8, 0.15, 32)
    const flangeMaterial = new THREE.MeshStandardMaterial({
      color: 0xCCCCCC,
      metalness: 0.9,
      roughness: 0.1
    })
    
    const topFlange = new THREE.Mesh(flangeGeometry, flangeMaterial)
    topFlange.position.y = 2
    const bottomFlange = new THREE.Mesh(flangeGeometry, flangeMaterial)
    bottomFlange.position.y = -2
    
    group.add(topFlange)
    group.add(bottomFlange)
    
    // Add bolts
    const boltGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.25, 8)
    const boltMaterial = new THREE.MeshStandardMaterial({
      color: 0xE0E0E0,
      metalness: 0.95,
      roughness: 0.1
    })
    
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2
      const radius = 1.65
      
      // Top bolts
      const topBolt = new THREE.Mesh(boltGeometry, boltMaterial)
      topBolt.position.set(
        Math.cos(angle) * radius,
        2,
        Math.sin(angle) * radius
      )
      group.add(topBolt)
      
      // Bottom bolts
      const bottomBolt = new THREE.Mesh(boltGeometry, boltMaterial)
      bottomBolt.position.set(
        Math.cos(angle) * radius,
        -2,
        Math.sin(angle) * radius
      )
      group.add(bottomBolt)
    }
    
    return group
  }

  function initializeParticles() {
    const particleGeometry = new THREE.BufferGeometry()
    const positions = new Float32Array(config.particleCount * 3)
    const colors = new Float32Array(config.particleCount * 3)

    for (let i = 0; i < config.particleCount; i++) {
      const i3 = i * 3
      positions[i3] = (Math.random() - 0.5) * config.containerSize.x
      positions[i3 + 1] = (Math.random() - 0.5) * config.containerSize.y
      positions[i3 + 2] = (Math.random() - 0.5) * config.containerSize.z
      
      colors[i3] = 0.2
      colors[i3 + 1] = 0.5
      colors[i3 + 2] = 1.0
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })

    return new THREE.Points(particleGeometry, particleMaterial)
  }

  function updateParticlesForContainer(containerData, deltaTime) {
    const positions = containerData.particles.geometry.attributes.position.array
    const colors = containerData.particles.geometry.attributes.color.array

    for (let i = 0; i < config.particleCount; i++) {
      const i3 = i * 3
      const pos = new THREE.Vector3(positions[i3], positions[i3 + 1], positions[i3 + 2])

      // Simulated Brownian motion
      pos.x += (Math.random() - 0.5) * 0.01 * config.agitationLevel
      pos.y += (Math.random() - 0.5) * 0.01 * config.agitationLevel
      pos.z += (Math.random() - 0.5) * 0.01 * config.agitationLevel

      // Keep particles within bounds
      pos.x = Math.max(-config.containerSize.x / 2, Math.min(config.containerSize.x / 2, pos.x))
      pos.y = Math.max(-config.containerSize.y / 2, Math.min(config.containerSize.y / 2, pos.y))
      pos.z = Math.max(-config.containerSize.
z / 2, Math.min(config.containerSize.z / 2, pos.z))

      positions[i3] = pos.x
      positions[i3 + 1] = pos.y
      positions[i3 + 2] = pos.z

      // Update color based on temperature and crystallization
      const tempFactor = (config.temperature - 273.15) / 300
      const crystalFactor = containerData.crystallizationProgress
      colors[i3] = 0.2 + tempFactor * 0.8
      colors[i3 + 1] = 0.5 - crystalFactor * 0.3
      colors[i3 + 2] = 1.0 - tempFactor * 0.8 - crystalFactor * 0.5
    }

    containerData.particles.geometry.attributes.position.needsUpdate = true
    containerData.particles.geometry.attributes.color.needsUpdate = true
  }

  let crystalMaterial

  function initializeCrystalMaterial() {
    crystalMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        temperature: { value: config.temperature / 1000 },
        crystallization: { value: 0 },
        liquidColor: { value: new THREE.Color(LIQUIDS[config.liquidType].color) }
      },
      vertexShader: `
        uniform float time;
        uniform float crystallization;
        
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying float vCrystallization;
        varying vec2 vUv;
        
        void main() {
          vPosition = position;
          vNormal = normal;
          vCrystallization = crystallization;
          vUv = uv;
          
          // Add subtle movement based on crystallization state
          vec3 pos = position;
          float displacement = sin(time * 2.0 + position.y * 10.0) * 0.02;
          
          // Add faceting effect as crystallization progresses
          float faceting = crystallization * 0.1;
          pos += normal * sin(position.x * 20.0 + time) * faceting;
          pos += normal * sin(position.y * 20.0 + time) * faceting;
          pos += normal * sin(position.z * 20.0 + time) * faceting;
          
          // Add growth wobble that decreases with crystallization
          pos += normal * displacement * (1.0 - crystallization);
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float temperature;
        uniform float time;
        uniform vec3 liquidColor;
        
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying float vCrystallization;
        varying vec2 vUv;
        
        // Function to create crystal-like patterns
        float crystallinePattern(vec3 pos) {
          return fract(sin(dot(pos.xyz, vec3(12.9898, 78.233, 45.164))) * 43758.5453123);
        }
        
        void main() {
          // Enhanced lighting
          vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
          vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0));
          vec3 halfDir = normalize(lightDir + viewDir);
          
          // Calculate different light components
          float diffuse = max(0.0, dot(vNormal, lightDir));
          float specular = pow(max(0.0, dot(vNormal, halfDir)), 32.0);
          
          // Temperature-based colors
          vec3 hotColor = vec3(1.0, 0.3, 0.1);
          vec3 coldColor = liquidColor;
          vec3 crystalColor = vec3(0.9, 0.95, 1.0);
          
          // Enhanced iridescence effect
          float iridescence = sin(vPosition.y * 20.0 + time) * 0.2 +
                            sin(vPosition.x * 15.0 + time * 0.7) * 0.2 +
                            sin(vPosition.z * 25.0 + time * 1.3) * 0.2;
          
          vec3 iridescentColor = vec3(0.5 + iridescence, 0.7 + iridescence, 1.0);
          
          // Crystallization progress
          float crystal = smoothstep(0.0, 1.0, vCrystallization);
          
          // Enhanced sparkle effect
          float sparkle = pow(crystallinePattern(vPosition * 50.0 + time), 20.0) * crystal;
          sparkle += pow(crystallinePattern(vPosition * 30.0 - time * 0.5), 25.0) * crystal;
          
          // Faceting effect
          float faceting = pow(abs(dot(vNormal, viewDir)), 3.0) * crystal;
          
          // Combine all effects
          vec3 baseColor = mix(
            mix(coldColor, hotColor, temperature),
            mix(crystalColor, iridescentColor, iridescence),
            crystal
          );
          
          vec3 finalColor = baseColor * (diffuse * 0.7 + 0.3); // Ambient light
          finalColor += vec3(1.0) * specular * crystal; // Specular highlights
          finalColor += vec3(1.0) * sparkle * 0.5; // Sparkles
          finalColor += vec3(0.5, 0.7, 1.0) * faceting * 0.3; // Faceting highlights
          
          // Transparency that increases with crystallization
          float alpha = 0.8 + 0.2 * crystal;
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });
  }

  function initializeSystem() {
    // Create containers in a grid layout
    const spacing = 4
    const gridSize = Math.ceil(Math.sqrt(config.containerCount))
    
    for (let i = 0; i < config.containerCount; i++) {
      const row = Math.floor(i / gridSize)
      const col = i % gridSize
      
      const position = new THREE.Vector3(
        (col - (gridSize - 1) / 2) * spacing,
        0,
        (row - (gridSize - 1) / 2) * spacing
      )
      
      createContainer(position, i)
    }
    
    initializeCrystalMaterial()
  }

  function updateCrystalsForContainer(containerData, deltaTime) {
    const { temperature } = config
    const liquid = LIQUIDS[config.liquidType]
    const crystal = CRYSTAL_TYPES[config.crystalType]
    
    // Update existing crystals
    containerData.crystals.forEach(crystal => {
      // Growth rate depends on temperature difference from freezing point
      const tempDiff = liquid.freezingPoint - temperature
      const growthRate = GROWTH_RATE_CONSTANT * tempDiff * crystal.growthRate * deltaTime
      
      if (tempDiff > 0) {
        crystal.grow(growthRate * config.saturationLevel)
      }
    })
    
    // Check for new nucleation points
    if (temperature < liquid.freezingPoint && 
        containerData.crystals.length < 50 && 
        Math.random() < NUCLEATION_THRESHOLD * config.saturationLevel * deltaTime) {
      
      // Create new crystal at random position within container
      const position = new THREE.Vector3(
        (Math.random() - 0.5) * config.containerSize.x * 0.8,
        (Math.random() - 0.5) * config.containerSize.y * 0.8,
        (Math.random() - 0.5) * config.containerSize.z * 0.8
      )
      
      // Check minimum distance from other crystals to prevent overlap
      const minDistance = 0.5
      const tooClose = containerData.crystals.some(existingCrystal => 
        position.distanceTo(existingCrystal.position) < minDistance
      )
      
      if (!tooClose) {
        const newCrystal = new Crystal(position, crystalMaterial)
        containerData.crystals.push(newCrystal)
        containerData.container.add(newCrystal.mesh)
      }
    }
    
    // Update crystal shader uniforms
    if (crystalMaterial) {
      crystalMaterial.uniforms.time.value = time
      crystalMaterial.uniforms.temperature.value = temperature / 1000
      crystalMaterial.uniforms.crystallization.value = containerData.crystallizationProgress
    }
  }
  
  function updateSolutionAppearance(containerData) {
    const { temperature } = config
    const liquid = LIQUIDS[config.liquidType]
    
    // Update solution opacity and color based on crystallization progress
    if (containerData.solution) {
      const material = containerData.solution.material
      
      // Make solution more transparent as crystallization progresses
      material.opacity = Math.max(0.1, 0.4 - containerData.crystallizationProgress * 0.3)
      
      // Adjust solution color based on temperature and crystallization
      const baseColor = new THREE.Color(liquid.color)
      const crystalColor = new THREE.Color(0xFFFFFF)
      const tempColor = new THREE.Color()
      
      // Color shifts towards white as temperature drops
      const tempFactor = Math.max(0, Math.min(1, (liquid.freezingPoint - temperature) / 50))
      tempColor.lerpColors(baseColor, crystalColor, tempFactor * 0.3)
      
      // Further adjust color based on crystallization progress
      const finalColor = new THREE.Color()
      finalColor.lerpColors(tempColor, crystalColor, containerData.crystallizationProgress * 0.5)
      
      material.color = finalColor
      
      // Update material properties
      material.roughness = 0.1 + containerData.crystallizationProgress * 0.2
      material.ior = 1.33 + containerData.crystallizationProgress * 0.1
    }
  }

  function updateSystem(deltaTime) {
    time += deltaTime
    
    containers.forEach((containerData, index) => {
      // Update temperature with slight variations between containers
      const tempVariation = Math.sin(time + index) * 5
      const currentTemp = Math.max(
        50,
        config.temperature - config.coolingRate * deltaTime + tempVariation
      )
      
      // Update crystallization progress
      if (currentTemp < LIQUIDS[config.liquidType].freezingPoint) {
        containerData.crystallizationProgress = Math.min(
          1,
          containerData.crystallizationProgress + deltaTime * 0.1
        )
      }
      
      // Update particles and crystals
      updateParticlesForContainer(containerData, deltaTime)
      updateCrystalsForContainer(containerData, deltaTime)
      updateSolutionAppearance(containerData)
      
      // Update temperature gauge
      containerData.temperatureGauge.rotation.y = 
        ((currentTemp - 273.15) / 300) * Math.PI * 0.75
      
      // Rotate container slightly
      containerData.container.rotation.y += 0.001
    })
    
    // Update flame effects
    updateFlames(deltaTime, config.temperature)
    
    // Update results if needed
    if (results) {
      results.temperature = config.temperature
      results.containerData = containers.map(container => ({
        crystallizationProgress: container.crystallizationProgress,
        crystalCount: container.crystals.length
      }))
    }
  }

  function dispose() {
    containers.forEach(containerData => {
      containerData.particles.geometry.dispose()
      containerData.particles.material.dispose()
      scene.remove(containerData.container)
    })
    
    flames.forEach(flame => {
      flame.particles.forEach(particle => {
        particle.mesh.geometry.dispose()
        particle.mesh.material.dispose()
      })
      scene.remove(flame.group)
    })
    
    crystalMaterial.dispose()
  }

  // Initialize the system
  initializeSystem()

  // Return the animate function
  return (deltaTime) => updateSystem(deltaTime)
}

class Crystal {
  constructor(position, material) {
    this.position = position
    this.size = 0.1
    this.maxSize = 0.5 + Math.random() * 0.5

    const geometry = new THREE.OctahedronGeometry(this.size, 0)
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.copy(this.position)
  }

  grow(amount) {
    if (this.size < this.maxSize) {
      this.size = Math.min(this.maxSize, this.size + amount)
      this.mesh.scale.setScalar(this.size)
    }
  }
}
