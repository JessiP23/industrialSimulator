'use client';

import * as THREE from 'three';

export const createDistillationApparatus = (parameters) => {
  const apparatus = new THREE.Group();

  // Material creators
  const createGlassTexture = () => {
    return new THREE.MeshPhysicalMaterial({
      transparent: true,
      transmission: 0.95,
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
  const createLiquidTexture = (color, alpha, temperature, isGas = false) => {
    return new THREE.MeshPhysicalMaterial({
      color: color,
      transparent: true,
      opacity: isGas ? 0.3 : alpha, // Lower opacity for gas
      transmission: isGas ? 0.9 : (temperature > 100 ? 0.8 : 0.6),
      roughness: isGas ? 0.1 : (temperature > 100 ? 0.3 : 0.1),
      metalness: 0,
      ior: isGas ? 1.0 : (temperature > 100 ? 1.6 : 1.4),
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

    flask.add(sphere);
    flask.add(neck);

    // Add connection points for precise tube attachment
    flask.topConnectionPoint = new THREE.Vector3(0, height / 2 + neckHeight, 0);
    flask.bottomConnectionPoint = new THREE.Vector3(0, -radius, 0);

    return flask;
  };

  const createCondenser = () => {
    const container = new THREE.Group();

    // Outer jacket
    const outerTube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.25, 2.5, 32),
      createGlassTexture()
    );

    // Inner condensing tube
    const innerTube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 2.7, 32),
      createGlassTexture()
    );
    innerTube.material.color = new THREE.Color(0x8899AA);

    // Add water inlet and outlet tubes
    const inletTube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.4, 16),
      createGlassTexture()
    );
    inletTube.position.set(0.25, 0.5, 0);
    inletTube.rotation.z = -Math.PI / 2;

    const outletTube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.4, 16),
      createGlassTexture()
    );
    outletTube.position.set(0.25, -0.5, 0);
    outletTube.rotation.z = -Math.PI / 2;

    container.add(outerTube);
    container.add(innerTube);
    container.add(inletTube);
    container.add(outletTube);

    return container;
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

  const condenser = createCondenser();
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

  // Function to animate liquid flow
  const animateLiquidFlow = () => {
    const flowSpeed = parameters.flowSpeed || 0.01;
    pathProgress += flowSpeed;
    
    if (pathProgress > 1) {
      pathProgress = 0;
    }

    const point = path.getPointAt(pathProgress);
    const tangent = path.getTangentAt(pathProgress);
    liquid.position.copy(point);
    liquid.lookAt(point.clone().add(tangent));

    // Adjust liquid properties based on its position in the path
    if (pathProgress < 0.4) {
      // In the round bottom flask: liquid state
      liquid.scale.set(1, 1, 1);
      liquid.material = createLiquidTexture(0x2C3E50, 0.8, parameters.temperature);
    } else if (pathProgress < 0.7) {
      // In the condenser: gas state
      liquid.scale.set(0.8, 0.8, 0.8);
      liquid.material = createLiquidTexture(0xFF5733, 0.3, parameters.temperature, true);
      // Add some randomness to simulate gas movement
      liquid.position.x += (Math.random() - 0.5) * 0.05;
      liquid.position.y += (Math.random() - 0.5) * 0.05;
    } else {
      // In the receiving flask: back to liquid state
      liquid.scale.set(0.8, 0.8, 0.8);
      liquid.material = createLiquidTexture(0x2C3E50, 0.8, parameters.temperature);
    }
  };

  // Update function to be called in the animation loop
  const update = () => {
    animateLiquidFlow();
    // Update other parameters as needed
    // For example, you could change the liquid color based on temperature
    const temperature = parameters.temperature || 25; // Default temperature
    if (temperature > 100) {
      liquid.material = createLiquidTexture(0xFF5733, 0.8, temperature); // Change to a different color if boiling
    } else {
      liquid.material = createLiquidTexture(0x2C3E50, 0.8, temperature); // Default color
    }

    if (pathProgress > 0.4 && pathProgress < 0.7) {
      liquid.material.opacity = 0.5 + Math.sin(Date.now() * 0.01) * 0.2;
    } else {
      liquid.material.opacity = 0.8;
    }

    parameters.temperature = Math.min(parameters.temperature + parameters.heatRate, parameters.targetTemperature)
  };

  // Return the apparatus and the update function
  return { apparatus, update };
};