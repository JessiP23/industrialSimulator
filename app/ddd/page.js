'use client';

import * as THREE from 'three';

export const createDistillationApparatus = () => {
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
      color: new THREE.Color(0xCCDDFF), // Slight blue tint to make glass visible
    });
  };

  const createLiquidTexture = (color) => {
    return new THREE.MeshPhysicalMaterial({
      color: color,
      transparent: true,
      transmission: 0.6,
      roughness: 0.1,
      metalness: 0,
      ior: 1.4,
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
    
    // Position and rotate the tube to connect the points
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

    // Create bottom sphere
    const sphereGeometry = new THREE.SphereGeometry(radius, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
    const sphere = new THREE.Mesh(sphereGeometry, createGlassTexture());

    // Create neck
    const neckGeometry = new THREE.CylinderGeometry(neckRadius, neckRadius, neckHeight, 32);
    const neck = new THREE.Mesh(neckGeometry, createGlassTexture());
    neck.position.y = height / 2 + neckHeight / 2;

    flask.add(sphere);
    flask.add(neck);

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

  // Create dark colored liquid
  const liquid = new THREE.Mesh(
    new THREE.SphereGeometry(0.7, 32, 32, 0, Math.PI * 2, 0, Math.PI / 3),
    createLiquidTexture(0x2C3E50) // Darker blue color
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
    new THREE.Vector3(-1.5, 1.2, 0),
    new THREE.Vector3(-0.8, 1.8, 0)
  );
  
  const tube2 = createConnectingTube(
    new THREE.Vector3(0.8, 1.2, 0),
    new THREE.Vector3(1.2, 0.8, 0)
  );

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

  return apparatus;
};