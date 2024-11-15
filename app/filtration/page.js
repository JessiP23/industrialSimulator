import * as THREE from 'three';
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

export { Filtration };