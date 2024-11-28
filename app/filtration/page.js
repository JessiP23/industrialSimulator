'use client'

import * as THREE from 'three';

// Physical constants
const GRAVITY = 9.81;
const FLUID_DENSITY = 1000;
const PARTICLE_DENSITY = 2500;
const DARCY_COEFFICIENT = 1.75;
const KOZENY_CONSTANT = 5.0;

export function Filtration({ scene, parameters, results }) {
    const filtrationUnit = new THREE.Group();
    
    // Create a more attractive industrial-looking housing
    const housingGeometry = new THREE.CylinderGeometry(1.5, 1.5, 4, 32, 32);
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
    });
    const housing = new THREE.Mesh(housingGeometry, housingMaterial);
    
    // Enhanced flanges with chrome-like finish
    const flangeGeometry = new THREE.CylinderGeometry(1.8, 1.8, 0.15, 32);
    const flangeMaterial = new THREE.MeshStandardMaterial({
        color: 0xCCCCCC,
        metalness: 0.9,
        roughness: 0.1
    });
    
    const topFlange = new THREE.Mesh(flangeGeometry, flangeMaterial);
    topFlange.position.y = 2;
    const bottomFlange = new THREE.Mesh(flangeGeometry, flangeMaterial);
    bottomFlange.position.y = -2;
    
    // Chrome-like bolts
    const boltGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.25, 8);
    const boltMaterial = new THREE.MeshStandardMaterial({
        color: 0xE0E0E0,
        metalness: 0.95,
        roughness: 0.1
    });
    
    const createBolts = (y) => {
        const boltsGroup = new THREE.Group();
        for (let i = 0; i < 12; i++) {
            const bolt = new THREE.Mesh(boltGeometry, boltMaterial);
            const angle = (i / 12) * Math.PI * 2;
            bolt.position.set(
                Math.cos(angle) * 1.65,
                y,
                Math.sin(angle) * 1.65
            );
            boltsGroup.add(bolt);
        }
        return boltsGroup;
    };
    
    filtrationUnit.add(createBolts(2));
    filtrationUnit.add(createBolts(-2));

    // Enhanced filter medium with metallic sheen
    const filterGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.2, 32);
    const filterMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xE0E0E0,
        metalness: 0.5,
        roughness: 0.6,
        transparent: true,
        opacity: 0.95
    });
    const filter = new THREE.Mesh(filterGeometry, filterMaterial);
    filter.position.y = -0.5;
    
    // Enhanced support structure
    const supportGeometry = new THREE.CylinderGeometry(1.3, 1.3, 0.1, 32);
    const supportMaterial = new THREE.MeshStandardMaterial({
        color: 0x757575,
        metalness: 0.9,
        roughness: 0.2
    });
    const support = new THREE.Mesh(supportGeometry, supportMaterial);
    support.position.y = -0.7;
    
    // Enhanced pipe connections with chrome finish
    const createPipeConnection = (y) => {
        const connection = new THREE.Group();
        
        const pipeGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 16);
        const pipeMaterial = new THREE.MeshStandardMaterial({
            color: 0xE0E0E0,
            metalness: 0.9,
            roughness: 0.1
        });
        const pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
        
        const handleGeometry = new THREE.TorusGeometry(0.3, 0.04, 12, 32);
        const handle = new THREE.Mesh(handleGeometry, pipeMaterial);
        handle.rotation.x = Math.PI / 2;
        handle.position.y = 0.2;
        
        const valveGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.4, 16);
        const valve = new THREE.Mesh(valveGeometry, pipeMaterial);
        valve.rotation.z = Math.PI / 2;
        
        connection.add(pipe);
        connection.add(handle);
        connection.add(valve);
        connection.position.y = y;
        
        return connection;
    };
    
    const inletConnection = createPipeConnection(2);
    const outletConnection = createPipeConnection(-2);
    
    // Enhanced fluid visualization
    const fluidGeometry = new THREE.CylinderGeometry(1.45, 1.45, 3, 32);
    const fluidMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x64B5F6,
        transparent: true,
        opacity: 0.4,
        transmission: 0.6,
        thickness: 0.5,
        roughness: 0.1,
        ior: 1.33
    });
    const fluid = new THREE.Mesh(fluidGeometry, fluidMaterial);
    fluid.position.y = 0.5;
    
    // Enhanced pressure gauges
    const createPressureGauge = (position) => {
        const gauge = new THREE.Group();
        
        const gaugeGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16);
        const gaugeMaterial = new THREE.MeshStandardMaterial({
            color: 0xE0E0E0,
            metalness: 0.8,
            roughness: 0.2
        });
        const gaugeHousing = new THREE.Mesh(gaugeGeometry, gaugeMaterial);
        
        const faceGeometry = new THREE.CircleGeometry(0.18, 32);
        const faceMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF
        });
        const gaugeFace = new THREE.Mesh(faceGeometry, faceMaterial);
        gaugeFace.position.y = 0.051;
        gaugeFace.rotation.x = -Math.PI / 2;
        
        gauge.add(gaugeHousing);
        gauge.add(gaugeFace);
        gauge.position.copy(position);
        gauge.rotation.z = Math.PI / 2;
        
        return gauge;
    };
    
    const topGauge = createPressureGauge(new THREE.Vector3(1.5, 1, 0));
    const bottomGauge = createPressureGauge(new THREE.Vector3(1.5, -1, 0));
    
    // Add components to filtration unit
    filtrationUnit.add(housing);
    filtrationUnit.add(topFlange);
    filtrationUnit.add(bottomFlange);
    filtrationUnit.add(filter);
    filtrationUnit.add(support);
    filtrationUnit.add(inletConnection);
    filtrationUnit.add(outletConnection);
    filtrationUnit.add(fluid);
    filtrationUnit.add(topGauge);
    filtrationUnit.add(bottomGauge);
    
    scene.add(filtrationUnit);

    // Improved ParticleSystem class
    class ParticleSystem {
        constructor(count, size, color) {
            // Fix 1: Initialize geometry with non-zero size
            this.geometry = new THREE.SphereGeometry(Math.max(size * 2.0, 0.001), 8, 8);
            this.material = new THREE.MeshPhysicalMaterial({
                color: color,
                metalness: 0.2,
                roughness: 0.3,
                transparent: true,
                opacity: 0.9,
                emissive: color,
                emissiveIntensity: 0.6,
                toneMapped: false
            });
            
            // Fix 2: Initialize particles with valid positions before creating mesh
            this.particles = new Array(count).fill().map(() => ({
                position: new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    2,
                    (Math.random() - 0.5) * 2
                ),
                velocity: new THREE.Vector3(0, -0.2, 0),
                captured: false,
                scale: 0.5 + Math.random() * 0.5 // Reduced max scale to prevent boundary issues
            }));
            
            // Fix 3: Create mesh after particles are initialized
            this.mesh = new THREE.InstancedMesh(this.geometry, this.material, count);
            this.mesh.castShadow = true;
            this.mesh.receiveShadow = true;
            this.mesh.renderOrder = 1;
            
            // Fix 4: Create dummy object for matrix calculations
            this.dummy = new THREE.Object3D();
            
            // Fix 5: Initialize all matrices
            this.particles.forEach((particle, i) => {
                this.updateMatrix(i);
            });
            
            // Fix 6: Set instanceMatrix needsUpdate after initialization
            this.mesh.instanceMatrix.needsUpdate = true;
            
            filtrationUnit.add(this.mesh);
        }

        updateMatrix(index) {
            // Fix 7: Add safety checks
            if (!this.particles[index] || !this.particles[index].position) return;
            
            const particle = this.particles[index];
            this.dummy.position.copy(particle.position);
            this.dummy.scale.set(particle.scale, particle.scale, particle.scale);
            this.dummy.updateMatrix();
            
            // Fix 8: Ensure matrix is updated only if mesh exists
            if (this.mesh) {
                this.mesh.setMatrixAt(index, this.dummy.matrix);
            }
        }

        resetPositions() {
            this.particles.forEach((particle, i) => {
                // Fix 9: Ensure valid initial positions
                const radius = 1; // Reduced radius to prevent boundary issues
                const theta = Math.random() * Math.PI * 2;
                particle.position.set(
                    Math.cos(theta) * radius,
                    2,
                    Math.sin(theta) * radius
                );
                particle.velocity.set(
                    (Math.random() - 0.5) * 0.1,
                    -0.2,
                    (Math.random() - 0.5) * 0.1
                );
                particle.captured = false;
                this.updateMatrix(i);
            });
            
            // Fix 10: Ensure instance matrix is updated
            if (this.mesh) {
                this.mesh.instanceMatrix.needsUpdate = true;
            }
        }

        // Rest of the ParticleSystem methods remain unchanged
        update(deltaTime, cakeThickness, flowRate, terminalVel) {
            // ... [Previous update code remains exactly the same]
            
            // Fix 11: Ensure instance matrix is updated after all particles are processed
            if (this.mesh) {
                this.mesh.instanceMatrix.needsUpdate = true;
            }
        }

        resetParticle(index) {
            // ... [Previous resetParticle code remains exactly the same]
        }
    }

    // Create particle systems with enhanced parameters
    const particleSystems = [
        new ParticleSystem(300, parameters.particleSize * 0.4, 0xFF5252),
        new ParticleSystem(400, parameters.particleSize * 0.35, 0xFF9800),
        new ParticleSystem(500, parameters.particleSize * 0.3, 0xFFC107)
    ];

    // Calculation functions
    const calculatePorosity = () => {
        return 0.4 - (0.1 * results.filtrationEfficiency / 100);
    };

    const calculatePermeability = (porosity) => {
        const dp = parameters.particleSize * 0.001;
        return (porosity * porosity * dp * dp) / (KOZENY_CONSTANT * (1 - porosity) * (1 - porosity));
    };

    const calculateTerminalVelocity = (particleSize) => {
        const dp = particleSize * 0.001;
        const Re = (FLUID_DENSITY * dp * dp * GRAVITY) / (18 * parameters.fluidViscosity * 0.001);
        if (Re < 1) {
            return (dp * dp * (PARTICLE_DENSITY - FLUID_DENSITY) * GRAVITY) / (18 * parameters.fluidViscosity * 0.001);
        } else {
            return Math.sqrt((4 * dp * (PARTICLE_DENSITY - FLUID_DENSITY) * GRAVITY) / (3 * FLUID_DENSITY * DARCY_COEFFICIENT));
        }
    };

    // Animation state
    let cakeThickness = 0;
    let totalCapturedParticles = 0;
    let pressureIndicatorAngle = 0;

    // Enhanced animation function
    function animate(deltaTime) {
        const porosity = calculatePorosity();
        const permeability = calculatePermeability(porosity);
        
        cakeThickness = Math.min(0.2, totalCapturedParticles * 0.0001);
        filter.scale.y = 1 + cakeThickness * 2;
        filter.position.y = -0.5 + cakeThickness;
        
        const turbidity = totalCapturedParticles / 1000;
        fluid.material.opacity = 0.4 + turbidity * 0.3;
        fluid.material.color.setHSL(0.6, 0.5, 1 - turbidity * 0.3);
        
        pressureIndicatorAngle = (cakeThickness / 0.2) * Math.PI * 0.75;
        topGauge.rotation.y = pressureIndicatorAngle;
        bottomGauge.rotation.y = pressureIndicatorAngle * 0.5;

        const flowRate = results.filtrationRate / parameters.filterArea;
        const terminalVel = calculateTerminalVelocity(parameters.particleSize);
        
        particleSystems.forEach(system => {
            system.update(deltaTime, cakeThickness, flowRate, terminalVel);
            totalCapturedParticles += system.particles.filter(p => p.captured).length;
        });

        filtrationUnit.rotation.y += 0.001;

        // Update results
        results.cakeThickness = cakeThickness;
        results.porosity = porosity;
        results.permeability = permeability;
    }

    return animate;
}