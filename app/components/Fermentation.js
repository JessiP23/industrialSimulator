import * as THREE from 'three';

// Updated biochemical constants for lactic acid fermentation (L. lactis typical values)
const MONOD_KS = 2.4; // Substrate half-saturation constant (g/L)
const MAX_GROWTH_RATE = 0.8; // Maximum specific growth rate (h^-1)

function Fermentation({ scene, parameters, results }) {
    const fermenterGroup = new THREE.Group();
    
    // Enhanced vessel (unchanged from original)
    const tankGeometry = new THREE.CylinderGeometry(1, 1.2, 3, 32, 32, true);
    const tankMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x1a3a4a,
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

    // Cooling jacket (unchanged)
    const jacketGeometry = new THREE.CylinderGeometry(1.1, 1.3, 2.8, 32, 1, true);
    const jacketMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x2c3e50,
        metalness: 0.95,
        roughness: 0.15,
        transparent: true,
        opacity: 0.4,
        clearcoat: 0.5
    });
    const coolingJacket = new THREE.Mesh(jacketGeometry, jacketMaterial);
    fermenterGroup.add(coolingJacket);

    // Impeller system (unchanged)
    const impellerGroup = createImpellerSystem();
    fermenterGroup.add(impellerGroup);

    // Updated liquid appearance for lactic acid fermentation
    const liquidGeometry = new THREE.CylinderGeometry(0.98, 1.18, 2.5, 32);
    const liquidMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xf5f5f5, // Whiter color typical of milk/dairy fermentation
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

    // Add legend/annotations
    const legendGroup = createLegend();
    legendGroup.position.set(2, 1, 0);
    scene.add(legendGroup);

    scene.add(fermenterGroup);

    // Helper function to create particle geometry
    const createParticleGeometry = (size) => {
        const geometry = new THREE.SphereGeometry(size, 16, 16);
        geometry.computeBoundingSphere();
        return geometry;
    };

    // Enhanced particle system for lactic acid fermentation
    class FermentationParticle {
        constructor(type) {
            this.type = type;
            this.age = 0;
            this.active = true;

            // Updated particle characteristics for lactic acid fermentation
            const geometries = {
                lactobacillus: createParticleGeometry(0.02), // Rod-shaped bacteria
                glucose: new THREE.BoxGeometry(0.015, 0.015, 0.015),
                lactate: createParticleGeometry(0.012),
                protein: createParticleGeometry(0.018)
            };

            const materials = {
                lactobacillus: new THREE.MeshPhysicalMaterial({
                    color: 0x4CAF50, // Green for bacteria
                    transparent: true,
                    opacity: 0.9,
                    metalness: 0.1,
                    roughness: 0.8
                }),
                glucose: new THREE.MeshPhysicalMaterial({
                    color: 0xFFC107, // Amber for glucose
                    transparent: true,
                    opacity: 0.7,
                    metalness: 0.2,
                    roughness: 0.3
                }),
                lactate: new THREE.MeshPhysicalMaterial({
                    color: 0xE91E63, // Pink for lactic acid
                    transparent: true,
                    opacity: 0.8,
                    metalness: 0.1,
                    roughness: 0.4
                }),
                protein: new THREE.MeshPhysicalMaterial({
                    color: 0x2196F3, // Blue for proteins
                    transparent: true,
                    opacity: 0.75,
                    metalness: 0.15,
                    roughness: 0.5
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

    // Updated particle counts for lactic acid fermentation
    const particles = {
        lactobacillus: Array(200).fill().map(() => new FermentationParticle('lactobacillus')),
        glucose: Array(150).fill().map(() => new FermentationParticle('glucose')),
        lactate: Array(180).fill().map(() => new FermentationParticle('lactate')),
        protein: Array(100).fill().map(() => new FermentationParticle('protein'))
    };

    // Enhanced simulation state
    let biomassConcentration = 1.0;
    let substrateConcentration = parameters.sugarConcentration;
    let lactateConcentration = 0;
    let pH = parameters.pH;

    // Enhanced biological calculations for lactic acid fermentation
    const calculateGrowthRate = (s, temp, ph) => {
        // Optimum temperature around 37°C for most lactic acid bacteria
        const tempFactor = Math.exp(-(Math.pow(temp - 37, 2) / 100));
        // Optimum pH around 6.0-6.5
        const phFactor = Math.exp(-(Math.pow(ph - 6.2, 2) / 1.2));
        return MAX_GROWTH_RATE * (s / (MONOD_KS + s)) * tempFactor * phFactor;
    };

    const calculateViscosity = (biomass) => {
        // Enhanced viscosity model including lactate effects
        return 0.001 * (1 + Math.exp(0.15 * biomass)) * (1 + 0.08 * lactateConcentration);
    };

    // Animation loop
    function animate() {
        const deltaTime = 1/60;
        const currentTime = parameters.time;
        
        // Update biological state
        const μ = calculateGrowthRate(substrateConcentration, parameters.temperature, parameters.pH);
        const viscosity = calculateViscosity(biomassConcentration);
        
        // Temperature-dependent impeller speed
        impellerGroup.rotation.y += 0.12 * (parameters.temperature / 37) * (1 / (viscosity * 5));

        // Update liquid appearance based on fermentation progress
        liquid.material.color.setHSL(
            0.1,
            0.1 + (lactateConcentration / 100) * 0.2,
            0.9 - (lactateConcentration / 100) * 0.2
        );

        // Enhanced particle behavior
        Object.entries(particles).forEach(([type, particleArray]) => {
            particleArray.forEach(particle => {
                switch(type) {
                    case 'lactobacillus':
                        // Enhanced bacterial movement
                        const cellMotion = 0.008 * μ * (1 / (viscosity * 3));
                        particle.velocity.add(new THREE.Vector3(
                            (Math.random() - 0.5) * cellMotion,
                            (Math.random() - 0.5) * cellMotion * 0.8,
                            (Math.random() - 0.5) * cellMotion
                        ));
                        break;
                        
                    case 'glucose':
                        // Enhanced substrate diffusion
                        const diffusion = 0.005 * (parameters.temperature / 37) * (1 / Math.sqrt(viscosity));
                        particle.velocity.add(new THREE.Vector3(
                            (Math.random() - 0.5) * diffusion,
                            (Math.random() - 0.5) * diffusion * 0.7,
                            (Math.random() - 0.5) * diffusion
                        ));
                        break;
                        
                    case 'lactate':
                        // Lactic acid movement
                        const lactateMotion = 0.006 * (1 / (viscosity * 2));
                        particle.velocity.add(new THREE.Vector3(
                            (Math.random() - 0.5) * lactateMotion,
                            (Math.random() - 0.5) * lactateMotion * 0.9,
                            (Math.random() - 0.5) * lactateMotion
                        ));
                        break;
                        
                    case 'protein':
                        // Protein movement
                        const proteinMotion = 0.004 * (1 / (viscosity * 4));
                        particle.velocity.add(new THREE.Vector3(
                            (Math.random() - 0.5) * proteinMotion,
                            (Math.random() - 0.5) * proteinMotion * 0.6,
                            (Math.random() - 0.5) * proteinMotion
                        ));
                        break;
                }

                // Updated particle dynamics
                particle.velocity.multiplyScalar(0.94 + (viscosity * 0.02));
                particle.mesh.position.add(particle.velocity);
                
                // Boundary checking
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

    // Helper function to create impeller system
    function createImpellerSystem() {
        const impellerGroup = new THREE.Group();
        const shaftGeometry = new THREE.CylinderGeometry(0.05, 0.05, 3, 16);
        const metalMaterial = new THREE.MeshStandardMaterial({
            color: 0xc0c0c0,
            metalness: 0.95,
            roughness: 0.15,
            envMapIntensity: 1.2
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
            
            for (let j = 0; j < 6; j++) {
                const blade = new THREE.Mesh(
                    new THREE.BoxGeometry(0.25, 0.08, 0.04),
                    metalMaterial
                );
                blade.position.x = Math.cos(j * Math.PI / 3) * 0.4;
                blade.position.z = Math.sin(j * Math.PI / 3) * 0.4;
                blade.rotation.y = j * Math.PI / 3;
                impellerDisc.add(blade);
            }
            impellerGroup.add(impellerDisc);
        }
        return impellerGroup;
    }

    // Create legend/annotations
    function createLegend() {
        const legendGroup = new THREE.Group();
        
        const legendItems = [
            { color: 0x4CAF50, text: "Lactobacillus" },
            { color: 0xFFC107, text: "Glucose" },
            { color: 0xE91E63, text: "Lactic Acid" },
            { color: 0x2196F3, text: "Proteins" }
        ];

        legendItems.forEach((item, index) => {
            // Create sample sphere
            const sphere = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 16, 16),
                new THREE.MeshPhysicalMaterial({
                    color: item.color,
                    metalness: 0.1,
                    roughness: 0.8
                })
            );
            sphere.position.y = -index * 0.2;
            
            // Create text label using sprite
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 256;
            canvas.height = 64;
            context.fillStyle = '#ffffff';
            context.font = '24px Arial';
            context.fillText(item.text, 0, 40);
            
            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.position.set(0.2, -index * 0.2, 0);
            sprite.scale.set(0.5, 0.125, 1);
            
            legendGroup.add(sphere);
            legendGroup.add(sprite);
        });

        return legendGroup;
    }

    return animate;
}

export { Fermentation }