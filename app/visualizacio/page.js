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
  
    const createParticleGeometry = (size) => {
      const validSize = Math.max(0.001, Number(size) || 0.01);
      return new THREE.SphereGeometry(validSize, 8, 8);
    };
  
  
    // Particle system for visualization
    class FilterParticle {
      constructor(type) {
        this.type = type;
        this.active = true;
        this.timeAlive = 0;
        
        // Different particle types
        const geometries = {
          large: createParticleGeometry(parameters.particleSize * 0.1),
          medium: createParticleGeometry(parameters.particleSize * 0.07),
          small: createParticleGeometry(parameters.particleSize * 0.05)
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


export {Crystallization, Distillation, Filtration, Fermentation, ReactorDesign}