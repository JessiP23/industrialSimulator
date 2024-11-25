'use client'

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const DistillationApparatus = () => {
  const containerRef = useRef();
  const sceneRef = useRef();
  const cameraRef = useRef();
  const rendererRef = useRef();
  const controlsRef = useRef();

  useEffect(() => {
    // Initialize scene
    sceneRef.current = new THREE.Scene();
    cameraRef.current = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    
    rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    rendererRef.current.setPixelRatio(window.devicePixelRatio);
    rendererRef.current.shadowMap.enabled = true;
    
    containerRef.current.appendChild(rendererRef.current.domElement);
    
    cameraRef.current.position.set(0, 2, 5);
    controlsRef.current = new OrbitControls(cameraRef.current, rendererRef.current.domElement);

    // Create lighting
    const createLighting = () => {
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
      sceneRef.current.add(ambientLight);

      const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
      mainLight.position.set(5, 5, 5);
      mainLight.castShadow = true;
      sceneRef.current.add(mainLight);

      const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
      fillLight.position.set(-5, 5, -5);
      sceneRef.current.add(fillLight);
    };

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

    // Component creators
    const createFlask = (radius, height, neckHeight, neckRadius) => {
      const flaskGeometry = new THREE.Group();
      
      const sphereGeometry = new THREE.SphereGeometry(radius, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
      const sphere = new THREE.Mesh(sphereGeometry, createGlassTexture());
      
      const neckGeometry = new THREE.CylinderGeometry(neckRadius, neckRadius, neckHeight, 32);
      const neck = new THREE.Mesh(neckGeometry, createGlassTexture());
      neck.position.y = height / 2 + neckHeight / 2;
      
      flaskGeometry.add(sphere);
      flaskGeometry.add(neck);
      
      return flaskGeometry;
    };

    const createCondenser = () => {
      const container = new THREE.Group();
      
      const outerTube = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 3, 32),
        createGlassTexture()
      );
      
      const innerTube = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 3.2, 32),
        createGlassTexture()
      );
      innerTube.material.color = new THREE.Color(0xadd8e6);
      
      container.add(outerTube);
      container.add(innerTube);
      
      return container;
    };

    // Create apparatus
    const createApparatus = () => {
      const roundBottomFlask = createFlask(0.8, 1.6, 1, 0.2);
      roundBottomFlask.position.set(-2, 0, 0);
      
      const condenser = createCondenser();
      condenser.rotation.z = Math.PI / 4;
      condenser.position.set(0, 2, 0);
      
      const receivingFlask = createFlask(0.6, 1.2, 0.8, 0.15);
      receivingFlask.position.set(2, 0, 0);
      
      const liquid = new THREE.Mesh(
        new THREE.SphereGeometry(0.7, 32, 32, 0, Math.PI * 2, 0, Math.PI / 3),
        createLiquidTexture(0x3498db)
      );
      liquid.position.copy(roundBottomFlask.position);
      liquid.position.y -= 0.3;
      
      const stand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 4, 16),
        new THREE.MeshStandardMaterial({ color: 0x444444 })
      );
      stand.position.set(-2.5, 0, 0);
      
      sceneRef.current.add(roundBottomFlask);
      sceneRef.current.add(condenser);
      sceneRef.current.add(receivingFlask);
      sceneRef.current.add(liquid);
      sceneRef.current.add(stand);
    };

    // Handle window resize
    const handleResize = () => {
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controlsRef.current.update();
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    // Initialize everything
    createLighting();
    createApparatus();
    animate();

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      containerRef.current?.removeChild(rendererRef.current.domElement);
      sceneRef.current.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      rendererRef.current.dispose();
    };
  }, []);

  return <div ref={containerRef} style={{ width: '100%', height: '100vh' }} />;
};

export default DistillationApparatus;