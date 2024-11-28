import * as THREE from 'three';
const UNIVERSAL_GAS_CONSTANT = 8.314;
const REFERENCE_PRESSURE = 101325;
const FLUID_VISCOSITY = 0.001;

function ReactorDesign({ scene, parameters, results }) {
    // Initialize reactor geometry with industrial components
    const reactorBody = new THREE.Group();
    
    // Main vessel with proper industrial proportions
    const vesselGeometry = new THREE.CylinderGeometry(1, 1, 3, 32);
    const vesselMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x316b83,
        metalness: 0.9,
        roughness: 0.3,
        transparent: false,
        thickness: 0.5
    });
    const vessel = new THREE.Mesh(vesselGeometry, vesselMaterial);
    reactorBody.add(vessel);

    // Add top and bottom flanges
    const flangeGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.1, 32);
    const flangeMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x444444,
        metalness: 0.9,
        roughness: 0.2
    });
    
    const topFlange = new THREE.Mesh(flangeGeometry, flangeMaterial);
    topFlange.position.y = 1.5;
    const bottomFlange = new THREE.Mesh(flangeGeometry, flangeMaterial);
    bottomFlange.position.y = -1.5;
    reactorBody.add(topFlange);
    reactorBody.add(bottomFlange);

    // Add inlet and outlet pipes
    const pipeGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.8, 16);
    const pipeMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x316b83,
        metalness: 0.9,
        roughness: 0.3
    });

    // Inlet pipe
    const inletPipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
    inletPipe.rotation.z = Math.PI / 2;
    inletPipe.position.set(-1.4, 1, 0);
    reactorBody.add(inletPipe);

    // Outlet pipe
    const outletPipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
    outletPipe.rotation.z = Math.PI / 2;
    outletPipe.position.set(1.4, -1, 0);
    reactorBody.add(outletPipe);

    // Add pipe flanges
    const pipeFlangeGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
    
    const inletFlange = new THREE.Mesh(pipeFlangeGeometry, flangeMaterial);
    inletFlange.rotation.z = Math.PI / 2;
    inletFlange.position.set(-1.8, 1, 0);
    reactorBody.add(inletFlange);

    const outletFlange = new THREE.Mesh(pipeFlangeGeometry, flangeMaterial);
    outletFlange.rotation.z = Math.PI / 2;
    outletFlange.position.set(1.8, -1, 0);
    reactorBody.add(outletFlange);

    // Add internal baffles with more industrial design
    const baffleGeometry = new THREE.BoxGeometry(0.1, 2.8, 0.8);
    const baffleMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x444444,
        metalness: 0.9,
        roughness: 0.2
    });

    for (let i = 0; i < 4; i++) {
        const baffle = new THREE.Mesh(baffleGeometry, baffleMaterial);
        baffle.rotation.y = (Math.PI / 2) * i;
        baffle.position.x = Math.cos(i * Math.PI / 2) * 0.8;
        baffle.position.z = Math.sin(i * Math.PI / 2) * 0.8;
        reactorBody.add(baffle);
    }

    // Add agitator shaft and impeller
    const shaftGeometry = new THREE.CylinderGeometry(0.05, 0.05, 3.5, 16);
    const shaft = new THREE.Mesh(shaftGeometry, baffleMaterial);
    shaft.position.y = 0.5;
    reactorBody.add(shaft);

    // Add impeller blades
    const impellerGroup = new THREE.Group();
    const bladeGeometry = new THREE.BoxGeometry(0.4, 0.05, 0.1);
    for (let i = 0; i < 6; i++) {
        const blade = new THREE.Mesh(bladeGeometry, baffleMaterial);
        blade.rotation.y = (Math.PI / 3) * i;
        blade.position.x = Math.cos(i * Math.PI / 3) * 0.2;
        blade.position.z = Math.sin(i * Math.PI / 3) * 0.2;
        impellerGroup.add(blade);
    }
    impellerGroup.position.y = 0;
    reactorBody.add(impellerGroup);

    // Add temperature sensor
    const sensorGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8);
    const sensorMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xcccccc,
        metalness: 0.9,
        roughness: 0.1
    });
    const tempSensor = new THREE.Mesh(sensorGeometry, sensorMaterial);
    tempSensor.rotation.z = Math.PI / 4;
    tempSensor.position.set(-0.8, 0.5, 0.8);
    reactorBody.add(tempSensor);

    scene.add(reactorBody);

    // Particle system setup
    const particles = [];
    const particleCount = 1000;
    const particleGeometry = new THREE.SphereGeometry(0.02, 8, 8);
    
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

    // Particle class definition (same as before)
    class ReactorParticle {
        constructor() {
            this.mesh = new THREE.Mesh(particleGeometry, reactantMaterial);
            this.velocity = new THREE.Vector3();
            this.isReacted = false;
            this.residence = 0;
            this.temperature = parameters.temperature;
            
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

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
        new ReactorParticle();
    }

    // Helper functions (same as before)
    const calculateReynoldsNumber = (velocity, diameter) => {
        const density = 1000;
        return (density * velocity * diameter) / FLUID_VISCOSITY;
    };

    const calculateReactionProbability = (temperature, activation_energy = 50000) => {
        return Math.exp(-activation_energy / (UNIVERSAL_GAS_CONSTANT * temperature));
    };

    // Animation function
    function animate() {
        const deltaTime = 1/60;
        const Re = calculateReynoldsNumber(parameters.flowRate, 2);
        const turbulentMixing = Re > 4000 ? 1.5 : 1.0;
        const reactionProb = calculateReactionProbability(parameters.temperature);

        // Rotate impeller based on flow rate
        impellerGroup.rotation.y += parameters.flowRate * 0.1;

        particles.forEach(particle => {
            particle.residence += deltaTime;

            const radialPosition = new THREE.Vector2(particle.mesh.position.x, particle.mesh.position.z).length();
            const tangentialVelocity = (parameters.flowRate * 0.2) * (1 - Math.pow(radialPosition / 0.9, 2));
            
            particle.velocity.x += (Math.random() - 0.5) * turbulentMixing * parameters.flowRate * 0.1;
            particle.velocity.y += parameters.flowRate * 0.05;
            particle.velocity.z += (Math.random() - 0.5) * turbulentMixing * parameters.flowRate * 0.1;
            
            const rotationAngle = tangentialVelocity * deltaTime;
            const currentPos = new THREE.Vector2(particle.mesh.position.x, particle.mesh.position.z);
            currentPos.rotateAround(new THREE.Vector2(0, 0), rotationAngle);
            particle.mesh.position.x = currentPos.x;
            particle.mesh.position.z = currentPos.y;
            
            particle.mesh.position.add(particle.velocity.multiplyScalar(deltaTime));

            if (!particle.isReacted && Math.random() < reactionProb * deltaTime) {
                particle.isReacted = true;
                particle.mesh.material = productMaterial;
                particle.temperature += parameters.reactionRate * 10;
            }

            if (Math.abs(particle.mesh.position.y) > 1 || radialPosition > 0.9) {
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

        // Subtle reactor body rotation for better visualization
        reactorBody.rotation.y += 0.0005 * parameters.flowRate;
    }

    return animate;
}

export {ReactorDesign};