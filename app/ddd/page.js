'use client';

import * as THREE from 'three';

export const createDistillationApparatus = (parameters) => {
  const apparatus = new THREE.Group();

  // Material creators
  const createGlassTexture = () => {
    return new THREE.MeshPhysicalMaterial({
      transparent: true,
      transmission: 0.95,
      opacity: 0.3,
      roughness: 0,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0,
      ior: 1.5,
      thickness: 0.1,
      color: new THREE.Color(0xCCDDFF),
    });
  };

  // Modified createLiquidTexture function
  const createLiquidTexture = (color, temperature, isBoiling = false) => {
    const opacity = isBoiling ? 0.6 : 0.8;
    const transmission = isBoiling ? 0.8 : 0.7;
    const roughness = isBoiling ? 0.3 : 0.1;
    
    // Color shift based on temperature
    const temperatureColor = new THREE.Color(
      isBoiling ? 0xFF5733 : // Reddish when boiling
      temperature > 80 ? 0xFFA500 : // Orange at high temp
      temperature > 50 ? 0x2C3E50 : // Dark blue at medium temp
      0x3498DB // Light blue at low temp
    );

    return new THREE.MeshPhysicalMaterial({
      color: temperatureColor,
      transparent: true,
      opacity: opacity,
      transmission: transmission,
      roughness: roughness,
      metalness: 0,
      ior: isBoiling ? 1.6 : 1.4,
    });
  };

  // Create connecting tube between components
  const createConnectingTube = (startPoint, endPoint, radius = 0.08) => {
    const direction = new THREE.Vector3().subVectors(endPoint, startPoint);
    const length = direction.length();
    
    const tube = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, length, 16),
      createGlassTexture()
    );
    
    // Precisely position and rotate the tube
    tube.position.copy(startPoint);
    tube.position.addScaledVector(direction, 0.5);
    tube.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.normalize()
    );
    
    return tube;
  };

  // Flask creation with modified dimensions
  const createFlask = (radius, height, neckHeight, neckRadius) => {
    const flask = new THREE.Group();
    flask.name = 'flask';

    const sphereGeometry = new THREE.SphereGeometry(radius, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
    const sphere = new THREE.Mesh(sphereGeometry, createGlassTexture());

    const neckGeometry = new THREE.CylinderGeometry(neckRadius, neckRadius, neckHeight, 32);
    const neck = new THREE.Mesh(neckGeometry, createGlassTexture());
    neck.position.y = height / 2 + neckHeight / 2;

    // Improved liquid rendering with more realistic volume
    const liquidGeometry = new THREE.SphereGeometry(radius * 0.9, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
    const liquid = new THREE.Mesh(liquidGeometry, createLiquidTexture(0x2C3E50, 0.8, parameters.initialTemperature));
    liquid.position.y = -radius * 0.1; 
    liquid.scale.set(1, 0.5, 1); // Make liquid look more natural with vertical compression

    const evaporationParticles = createEvaporationParticles(radius);
    evaporationParticles.position.y = liquid.position.y + radius * 0.5;

    // Add slight wobble effect to simulate liquid movement
    liquid.userData.originalPosition = liquid.position.clone();

    flask.add(sphere);
    flask.add(neck);
    flask.add(liquid);
    flask.add(evaporationParticles);

    flask.topConnectionPoint = new THREE.Vector3(0, height / 2 + neckHeight, 0);
    flask.bottomConnectionPoint = new THREE.Vector3(0, -radius, 0);

    return flask;
  };

   // Create evaporation particles
   const createEvaporationParticles = (radius) => {
    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 200;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      // More dynamic initial positioning
      const theta = Math.random() * Math.PI * 2;
      const r = Math.random() * radius * 0.6;
      
      positions[i * 3] = r * Math.cos(theta);
      positions[i * 3 + 1] = Math.random() * radius * 0.3;
      positions[i * 3 + 2] = r * Math.sin(theta);

      // Add initial velocities for more natural movement
      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = 0.01 + Math.random() * 0.03;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      color: 0xFFFFFF,
      size: 0.015,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });

    const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);

    // Enhanced update method for particles
    particleSystem.userData.update = (isBoiling) => {
      const positions = particleSystem.geometry.attributes.position.array;
      const velocities = particleSystem.geometry.attributes.velocity.array;

      for (let i = 0; i < positions.length; i += 3) {
        // More dynamic vertical movement
        positions[i] += velocities[i];
        positions[i + 1] += velocities[i + 1] * (isBoiling ? 1.5 : 0.5);
        positions[i + 2] += velocities[i + 2];

        // Reset particles that go too high
        if (positions[i + 1] > radius * 0.8) {
          positions[i + 1] = 0;
          velocities[i + 1] = 0.01 + Math.random() * 0.03;
        }

        // Add slight randomness to movement
        velocities[i] += (Math.random() - 0.5) * 0.005;
        velocities[i + 1] += (Math.random() - 0.5) * 0.002;
        velocities[i + 2] += (Math.random() - 0.5) * 0.005;
      }

      particleSystem.geometry.attributes.position.needsUpdate = true;
    };

    return particleSystem;
  };

  // Create heating element
   // Create heating element
   const createHeatingElement = () => {
    const heatingElement = new THREE.Group();
    // Burner base
    const baseGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 32);
    const baseMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x444444,
      roughness: 0.7,
      metalness: 0.3
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    // More complex flame with multiple layers
    const flameGroup = new THREE.Group();
    // Inner blue flame
    const innerFlameGeometry = new THREE.ConeGeometry(0.15, 0.3, 32);
    const innerFlameMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x3498DB, 
      transparent: true, 
      opacity: 0.5 
    });
    const innerFlame = new THREE.Mesh(innerFlameGeometry, innerFlameMaterial);
    innerFlame.position.y = 0.2;
    // Outer orange flame
    const outerFlameGeometry = new THREE.ConeGeometry(0.2, 0.4, 32);
    const outerFlameMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xFF6600, 
      transparent: true, 
      opacity: 0.7 
    });
    const outerFlame = new THREE.Mesh(outerFlameGeometry, outerFlameMaterial);
    outerFlame.position.y = 0.3;
    flameGroup.add(innerFlame);
    flameGroup.add(outerFlame);
    heatingElement.add(base);
    heatingElement.add(flameGroup);
    // Animation method for flame
    heatingElement.userData.animateFlame = () => {
      const innerFlame = heatingElement.children[1].children[0];
      const outerFlame = heatingElement.children[1].children[1];
      // Dynamic scaling and position for more natural flame movement
      const timeScale = Date.now() * 0.005;
      innerFlame.scale.set(
        1 + Math.sin(timeScale) * 0.1, 
        1 + Math.cos(timeScale) * 0.1, 
        1 + Math.sin(timeScale) * 0.1
      );
      outerFlame.scale.set(
        1 + Math.cos(timeScale) * 0.15, 
        1 + Math.sin(timeScale) * 0.15, 
        1 + Math.cos(timeScale) * 0.15
      );
      innerFlame.position.y = 0.2 + Math.sin(timeScale) * 0.05;
      outerFlame.position.y = 0.3 + Math.cos(timeScale) * 0.07;
    };
    return heatingElement;
  };

  const createCondenserTubeParticles = (temperature) => {
    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 400;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
  
    const tubeRadius = 0.25;
    const tubeHeight = 2.5;  
  
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radialOffset = Math.random() * tubeRadius;
  
      positions[i * 3] = Math.cos(angle) * radialOffset;
      positions[i * 3 + 1] = (Math.random() - 0.5) * tubeHeight;
      positions[i * 3 + 2] = Math.sin(angle) * radialOffset;
  
      velocities[i * 3] = (Math.random() - 0.5) * 0.03;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.05;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.03;
    }
  
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
  
    const particlesMaterial = new THREE.PointsMaterial({
      color: 0x3498DB,
      size: 0.03,
      transparent: true,
      opacity: 0.8,
    });
  
    const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
  
    // Separate tube creation outside of particle system
    const condenserTube = new THREE.Mesh(
      new THREE.CylinderGeometry(tubeRadius, tubeRadius, tubeHeight, 32),
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.1,
        roughness: 0,
        transmission: 0.99,
        thickness: 0.02,
        clearcoat: 1,
        clearcoatRoughness: 0,
      })
    );
  
    // Create a group to hold particles and tube
    const condenserGroup = new THREE.Group();
    condenserGroup.add(particleSystem);
    condenserGroup.add(condenserTube);
      
    // Enhanced particle update method
    condenserGroup.userData.update = (currentTemperature) => {
      const positions = particleSystem.geometry.attributes.position.array;
      const velocities = particleSystem.geometry.attributes.velocity.array;
  
      // Adjust particle behavior based on temperature
      const temperatureMultiplier = currentTemperature > 100 ? 1.5 : 1;
  
      for (let i = 0; i < positions.length; i += 3) {
        // More controlled movement
        positions[i] += velocities[i] * temperatureMultiplier;
        positions[i + 1] += velocities[i + 1] * temperatureMultiplier;
        positions[i + 2] += velocities[i + 2] * temperatureMultiplier;
  
        const radius = Math.sqrt(positions[i] * positions[i] + positions[i + 2] * positions[i + 2]);
  
        // Boundary handling with more natural reflection
        if (radius > tubeRadius) {
          const angle = Math.atan2(positions[i + 2], positions[i]);
          velocities[i] = -Math.cos(angle) * Math.abs(velocities[i]) * 0.8;
          velocities[i + 2] = -Math.sin(angle) * Math.abs(velocities[i + 2]) * 0.8;
          
          positions[i] = Math.cos(angle) * tubeRadius * 0.99;
          positions[i + 2] = Math.sin(angle) * tubeRadius * 0.99;
        }
  
        // Vertical boundary with more dampening
        if (positions[i + 1] < -tubeHeight/2 || positions[i + 1] > tubeHeight/2) {
          velocities[i + 1] *= -0.7;
          positions[i + 1] = Math.max(-tubeHeight/2, Math.min(tubeHeight/2, positions[i + 1]));
        }
  
        // Reduced Brownian motion
        velocities[i] += (Math.random() - 0.5) * 0.0005;
        velocities[i + 1] += (Math.random() - 0.5) * 0.0003;
        velocities[i + 2] += (Math.random() - 0.5) * 0.0005;
  
        // More aggressive velocity damping
        velocities[i] *= 0.995;
        velocities[i + 1] *= 0.995;
        velocities[i + 2] *= 0.995;
      }
  
      particleSystem.geometry.attributes.position.needsUpdate = true;
      particleSystem.geometry.attributes.velocity.needsUpdate = true;
    };
  
    return condenserGroup;
  };

  // Create thermometer
  const createThermometer = () => {
    const thermometer = new THREE.Group();
    
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 16, 16),
      createGlassTexture()
    );
    
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.8, 16),
      createGlassTexture()
    );
    stem.position.y = 0.4;
    
    thermometer.add(bulb);
    thermometer.add(stem);
    
    return thermometer;
  };

  // Assemble apparatus with adjusted positions
  const roundBottomFlask = createFlask(0.8, 1.6, 0.8, 0.15);
  roundBottomFlask.position.set(-1.5, 0, 0);

  const condenser = createCondenserTubeParticles();
  condenser.rotation.z = -Math.PI / 6; // More vertical angle
  condenser.position.set(0, 1.8, 0);

  const receivingFlask = createFlask(0.6, 1.2, 0.6, 0.12);
  receivingFlask.position.set(1.2, 0, 0);

  // Realistic Distillation Simulation Parameters
  const defaultParameters = {
    initialTemperature: 20,  // Starting room temperature
    targetTemperature: 78,   // Boiling point of ethanol
    heatRate: 0.5,           // Temperature increase rate
    liquidVolume: 1.0,       // Initial liquid volume
    flowRate: 0.01,          // Liquid flow speed
    pressureLevel: 1,        // Atmospheric pressure
  };

  const processingParams = { ...defaultParameters, ...parameters };

   // Create liquid
   const liquid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 0.2, 32),
    createLiquidTexture(0x2C3E50, 0.8, parameters.initialTemperature)
  );
  liquid.position.copy(roundBottomFlask.position);
  liquid.position.y -= 0.3;

  // Create metal stand (darker color)
  const stand = new THREE.Group();
  
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(1, 0.1, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x1A1A1A })
  );
  base.position.set(-1.5, -0.8, 0);
  
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 4, 16),
    new THREE.MeshStandardMaterial({ color: 0x1A1A1A })
  );
  pole.position.set(-1.8, 1, 0);

  // Add clamps
  const createClamp = () => {
    const clamp = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.1, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x2A2A2A })
    );
    return clamp;
  };

  const clamp1 = createClamp();
  clamp1.position.set(-1.6, 1.8, 0);
  
  const clamp2 = createClamp();
  clamp2.position.set(-1.6, 0.8, 0);

  stand.add(base);
  stand.add(pole);
  stand.add(clamp1);
  stand.add(clamp2);

  // Add connecting tubes
  const tube1 = createConnectingTube(
    roundBottomFlask.topConnectionPoint.clone().add(roundBottomFlask.position),
    condenser.position.clone().add(new THREE.Vector3(-0.1, -1, 0)) // Adjust for condenser entry
  );
  
  const tube2 = createConnectingTube(
    condenser.position.clone().add(new THREE.Vector3(0, 0, 0)), 
    receivingFlask.topConnectionPoint.clone().add(receivingFlask.position.clone().sub(new THREE.Vector3(-0.1, 0, 0)))
  );

  receivingFlask.position.set(1.2, 0, 0);

  // Add thermometer
  const thermometer = createThermometer();
  thermometer.position.set(-1.5, 1.4, 0.2);
  thermometer.rotation.x = Math.PI / 6;

  // Add everything to the apparatus
  apparatus.add(roundBottomFlask);
  apparatus.add(condenser);
  apparatus.add(receivingFlask);
  apparatus.add(liquid);
  apparatus.add(stand);
  apparatus.add(tube1);
  apparatus.add(tube2);
  apparatus.add(thermometer);

  // Path for liquid to follow
  const path = new THREE.CurvePath();

  path.add(new THREE.LineCurve3(new THREE.Vector3(-1.5, -0.3, 0), new THREE.Vector3(-1.5, 0.8, 0)));

  path.add(new THREE.CubicBezierCurve3(
    new THREE.Vector3(0, 1.8, 0),
    new THREE.Vector3(0.4, 1.6, 0),
    new THREE.Vector3(0.8, 1.4, 0),
    new THREE.Vector3(1.2, 1.2, 0)
  ));
  
  // Path from condenser to receiving flask
  path.add(new THREE.CubicBezierCurve3(
    new THREE.Vector3(1.2, 1.2, 0),
    new THREE.Vector3(1.2, 0.8, 0),
    new THREE.Vector3(1.2, 0.4, 0),
    new THREE.Vector3(1.2, -0.3, 0)
  ));

  let pathProgress = 0;

  
  const animateLiquidFlow = () => {
    const flowSpeed = (parameters.flowSpeed || 0.01) * 0.5; // Reduce flow speed by half
    pathProgress += flowSpeed;
    
    if (pathProgress > 1) {
      pathProgress = 0;
    }

    const point = path.getPointAt(pathProgress);
    const tangent = path.getTangentAt(pathProgress);

    // liquid wobble effect
    if (roundBottomFlask.children[2]) {
      const liquid = roundBottomFlask.children[2];
      liquid.position.y = liquid.userData.originalPosition.y + Math.sin(Date.now() * 0.005) * 0.05;
    }

    // Only move the liquid if it's not in the initial flask
    if (pathProgress > 0.1) {
      liquid.position.copy(point);
      liquid.lookAt(point.clone().add(tangent));
    }

    // Adjust liquid properties based on its position in the path
    if (pathProgress < 0.4) {
      // In the round bottom flask: liquid state
      liquid.visible = true;
      liquid.scale.set(1, 1, 1);
      liquid.material = createLiquidTexture(0x2C3E50, 0.8, parameters.temperature);
    } else if (pathProgress < 0.7) {
      liquid.visible = false;
    } else {
      // In the receiving flask: back to liquid state
      liquid.visible = true;
      liquid.scale.set(0.8, 0.8, 0.8);
      liquid.material = createLiquidTexture(0x2C3E50, 0.8, parameters.temperature);
    }
  };

  const heatingElement = createHeatingElement();
  heatingElement.position.set(-1.5, -0.8, 0);
  apparatus.add(heatingElement);

  // Update function to be called in the animation loop
  const update = (time) => {
    animateLiquidFlow();
    const temperature = parameters.temperature || 25; // Default temperature
    const isBoiling = temperature >= 100;
    // Update liquid in round bottom flask
    if (roundBottomFlask.children[2]) {
      const liquid = roundBottomFlask.children[2];
      liquid.material = createLiquidTexture(0x3498DB, temperature, isBoiling);
      
      // Simulate evaporation by reducing liquid volume
      if (isBoiling) {
        liquid.scale.y = Math.max(0.1, liquid.scale.y - 0.001);
      }
    }
  
    // Update evaporation particles
    if (roundBottomFlask.children[3]) {
      const particles = roundBottomFlask.children[3];
      particles.userData.update(isBoiling)
    }
  
    // Animate flame
    if (heatingElement) {
      heatingElement.userData.animateFlame(time);
    }
  
    // Update condenser
    if (condenser) {
      condenser.userData.update(temperature);
    }
  
    parameters.temperature = Math.min(parameters.temperature + parameters.heatRate, parameters.targetTemperature)
  };

  // Return the apparatus and the update function
  return { apparatus, update };
};