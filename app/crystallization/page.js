import * as THREE from 'three'

// Physical constants
const GRAVITY = 9.81
const SOLUTION_DENSITY = 1000
const CRYSTAL_DENSITY = 2500
const NUCLEATION_THRESHOLD = 0.1
const GROWTH_RATE_CONSTANT = 0.01

export function Crystallization({ scene, parameters, results }) {
  const config = {
    particleCount: 2000,
    temperature: parameters.temperature || 300,
    coolingRate: parameters.coolingRate || 1,
    crystalType: parameters.crystalType || 'cubic',
    saturationLevel: parameters.saturationLevel || 0.5,
    agitationLevel: parameters.agitationLevel || 1,
    viscosity: parameters.viscosity || 1.0,
    containerSize: { x: 4, y: 4, z: 4 },
    gridSize: 128,
  }

  let nucleationPoints = []
  let crystals = []
  let time = 0
  let crystallizationProgress = 0
  let crystallizer, solution, temperatureGauge, particles, crystalMaterial

  function initializeCrystallizer() {
    crystallizer = new THREE.Group()
    
    // Create a more attractive industrial-looking housing
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
    
    // Enhanced flanges with chrome-like finish
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
    
    // Chrome-like bolts
    const boltGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.25, 8)
    const boltMaterial = new THREE.MeshStandardMaterial({
      color: 0xE0E0E0,
      metalness: 0.95,
      roughness: 0.1
    })
    
    const createBolts = (y) => {
      const boltsGroup = new THREE.Group()
      for (let i = 0; i < 12; i++) {
        const bolt = new THREE.Mesh(boltGeometry, boltMaterial)
        const angle = (i / 12) * Math.PI * 2
        bolt.position.set(
          Math.cos(angle) * 1.65,
          y,
          Math.sin(angle) * 1.65
        )
        boltsGroup.add(bolt)
      }
      return boltsGroup
    }
    
    crystallizer.add(createBolts(2))
    crystallizer.add(createBolts(-2))

    // Enhanced solution visualization
    const solutionGeometry = new THREE.CylinderGeometry(1.45, 1.45, 3, 32)
    const solutionMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x64B5F6,
      transparent: true,
      opacity: 0.4,
      transmission: 0.6,
      thickness: 0.5,
      roughness: 0.1,
      ior: 1.33
    })
    solution = new THREE.Mesh(solutionGeometry, solutionMaterial)
    solution.position.y = 0.5
    
    // Enhanced temperature gauge
    const createTemperatureGauge = (position) => {
      const gauge = new THREE.Group()
      
      const gaugeGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16)
      const gaugeMaterial = new THREE.MeshStandardMaterial({
        color: 0xE0E0E0,
        metalness: 0.8,
        roughness: 0.2
      })
      const gaugeHousing = new THREE.Mesh(gaugeGeometry, gaugeMaterial)
      
      const faceGeometry = new THREE.CircleGeometry(0.18, 32)
      const faceMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF
      })
      const gaugeFace = new THREE.Mesh(faceGeometry, faceMaterial)
      gaugeFace.position.y = 0.051
      gaugeFace.rotation.x = -Math.PI / 2
      
      gauge.add(gaugeHousing)
      gauge.add(gaugeFace)
      gauge.position.copy(position)
      gauge.rotation.z = Math.PI / 2
      
      return gauge
    }
    
    temperatureGauge = createTemperatureGauge(new THREE.Vector3(1.5, 0, 0))
    
    // Add components to crystallizer
    crystallizer.add(housing)
    crystallizer.add(topFlange)
    crystallizer.add(bottomFlange)
    crystallizer.add(solution)
    crystallizer.add(temperatureGauge)
    
    scene.add(crystallizer)
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

    particles = new THREE.Points(particleGeometry, particleMaterial)
    crystallizer.add(particles)
  }

  function initializeCrystalMaterial() {
    crystalMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        temperature: { value: config.temperature / 1000 },
        crystallization: { value: 0 }
      },
      vertexShader: `
        uniform float time;
        uniform float crystallization;
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying float vCrystallization;
        
        void main() {
          vPosition = position;
          vNormal = normal;
          vCrystallization = crystallization;
          
          vec3 pos = position;
          float displacement = sin(time * 2.0 + position.y * 10.0) * 0.02;
          pos += normal * displacement * (1.0 - crystallization);
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float temperature;
        uniform float time;
        
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying float vCrystallization;
        
        void main() {
          vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
          float diffuse = max(0.0, dot(vNormal, lightDir));
          
          vec3 hotColor = vec3(1.0, 0.3, 0.1);
          vec3 coldColor = vec3(0.2, 0.5, 1.0);
          vec3 crystalColor = vec3(0.9, 0.95, 1.0);
          
          float iridescence = sin(vPosition.y * 20.0 + time) * 0.2;
          vec3 iridescentColor = vec3(0.5 + iridescence, 0.7 + iridescence, 1.0);
          
          float crystal = smoothstep(0.0, 1.0, vCrystallization);
          
          float sparkle = pow(sin(time * 10.0 + vPosition.y * 50.0) * 0.5 + 0.5, 20.0);
          
          vec3 color = mix(
            mix(coldColor, hotColor, temperature),
            mix(crystalColor, iridescentColor, iridescence),
            crystal
          );
          
          color *= (diffuse * 0.5 + 0.5);
          color += sparkle * crystal * 0.5;
          
          gl_FragColor = vec4(color, 0.8 + 0.2 * crystal);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    })
  }

  function updateParticles(deltaTime) {
    const positions = particles.geometry.attributes.position.array
    const colors = particles.geometry.attributes.color.array

    for (let i = 0; i < config.particleCount; i++) {
      const i3 = i * 3
      const pos = new THREE.Vector3(positions[i3], positions[i3 + 1], positions[i3 + 2])

      // Simulated Brownian motion
      pos.x += (Math.random() - 0.5) * 0.01
      pos.y += (Math.random() - 0.5) * 0.01
      pos.z += (Math.random() - 0.5) * 0.01

      // Keep particles within the container
      pos.x = Math.max(-config.containerSize.x / 2, Math.min(config.containerSize.x / 2, pos.x))
      pos.y = Math.max(-config.containerSize.y / 2, Math.min(config.containerSize.y / 2, pos.y))
      pos.z = Math.max(-config.containerSize.z / 2, Math.min(config.containerSize.z / 2, pos.z))

      positions[i3] = pos.x
      positions[i3 + 1] = pos.y
      positions[i3 + 2] = pos.z

      // Update color based on temperature
      const tempFactor = (config.temperature - 50) / 250
      colors[i3] = 0.2 + tempFactor * 0.8
      colors[i3 + 1] = 0.5
      colors[i3 + 2] = 1.0 - tempFactor * 0.8
    }

    particles.geometry.attributes.position.needsUpdate = true
    particles.geometry.attributes.color.needsUpdate = true
  }

  function updateCrystals(deltaTime) {
    // Nucleation
    if (crystals.length < 100 && Math.random() < NUCLEATION_THRESHOLD * crystallizationProgress) {
      const position = new THREE.Vector3(
        (Math.random() - 0.5) * config.containerSize.x,
        (Math.random() - 0.5) * config.containerSize.y,
        (Math.random() - 0.5) * config.containerSize.z
      )
      crystals.push(new Crystal(position, crystalMaterial))
      crystallizer.add(crystals[crystals.length - 1].mesh)
    }

    // Crystal growth
    for (const crystal of crystals) {
      crystal.grow(deltaTime * GROWTH_RATE_CONSTANT * crystallizationProgress)
    }
  }

  function updateSolution() {
    // Update solution opacity and color based on crystallization progress
    solution.material.opacity = 0.4 - crystallizationProgress * 0.2
    solution.material.color.setHSL(0.6, 0.5, 1 - crystallizationProgress * 0.3)
  }

  function animate(deltaTime) {
    time += deltaTime
    
    config.temperature = Math.max(
      50,
      config.temperature - config.coolingRate * deltaTime
    )

    if (config.temperature < 200) {
      crystallizationProgress = Math.min(1, crystallizationProgress + deltaTime * 0.1)
    }

    updateParticles(deltaTime)
    updateCrystals(deltaTime)
    updateSolution()

    crystalMaterial.uniforms.time.value = time
    crystalMaterial.uniforms.temperature.value = config.temperature / 1000
    crystalMaterial.uniforms.crystallization.value = crystallizationProgress

    // Update temperature gauge
    temperatureGauge.rotation.y = ((config.temperature - 50) / 250) * Math.PI * 0.75

    if (results) {
      results.temperature = config.temperature
      results.crystallizationProgress = crystallizationProgress
      results.crystalCount = crystals.length
    }

    crystallizer.rotation.y += 0.001
  }

  function dispose() {
    particles.geometry.dispose()
    particles.material.dispose()
    crystalMaterial.dispose()
    scene.remove(crystallizer)
  }

  // Initialize the crystallization process
  initializeCrystallizer()
  initializeParticles()
  initializeCrystalMaterial()

  // Return the animate function
  return animate
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
      this.size = Math
.min(this.maxSize, this.size + amount)
      this.mesh.scale.setScalar(this.size)
    }
  }
}
