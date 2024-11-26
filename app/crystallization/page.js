'use client'

import React, {useRef, useEffect} from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'


// Physical constants
const GRAVITY = 9.81
const NUCLEATION_THRESHOLD = 0.1
const GROWTH_RATE_CONSTANT = 0.01

// Liquid properties database
const LIQUIDS = {
  water: {
    density: 1000,
    color: 0x64B5F6,
    viscosity: 1.0,
    boilingPoint: 373.15,
    freezingPoint: 273.15,
    name: "Water"
  },
  ethanol: {
    density: 789,
    color: 0xE3F2FD,
    viscosity: 1.2,
    boilingPoint: 351.15,
    freezingPoint: 159.15,
    name: "Ethanol"
  },
  glycerol: {
    density: 1260,
    color: 0xB3E5FC,
    viscosity: 1.412,
    boilingPoint: 563.15,
    freezingPoint: 291.15,
    name: "Glycerol"
  },
  acetone: {
    density: 784,
    color: 0xE1F5FE,
    viscosity: 0.316,
    boilingPoint: 329.15,
    freezingPoint: 178.15,
    name: "Acetone"
  }
}

// Crystal types database
const CRYSTAL_TYPES = {
  cubic: {
    density: 2500,
    geometry: 'BoxGeometry',
    growthRate: 1.0,
    name: "Cubic Crystal"
  },
  octahedral: {
    density: 2300,
    geometry: 'OctahedronGeometry',
    growthRate: 0.8,
    name: "Octahedral Crystal"
  },
  hexagonal: {
    density: 2700,
    geometry: 'CylinderGeometry',
    growthRate: 1.2,
    name: "Hexagonal Crystal"
  }
}

const CrystallizationSimulation = ({ parameters }) => {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05

    // Post-processing setup
    const composer = new EffectComposer(renderer)
    const renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,
      0.4,
      0.85
    )
    composer.addPass(bloomPass)

    // Refraction shader
    const refractionShader = {
      uniforms: {
        "tDiffuse": { value: null },
        "time": { value: 0 },
        "distortion": { value: 0.1 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float time;
        uniform float distortion;
        varying vec2 vUv;
        
        void main() {
          vec2 p = vUv;
          float d = distortion * sin(time * 2.0 + p.y * 10.0) * 0.01;
          p.x += d;
          gl_FragColor = texture2D(tDiffuse, p);
        }
      `
    }

    const refractionPass = new ShaderPass(refractionShader)
    composer.addPass(refractionPass)

    // Simulation configuration
    const config = {
      containerCount: parameters.containerCount || 4,
      particleCount: 2000,
      temperature: parameters.temperature || 300,
      coolingRate: parameters.coolingRate || 1,
      crystalType: parameters.crystalType || 'cubic',
      liquidType: parameters.liquidType || 'water',
      saturationLevel: parameters.saturationLevel || 0.5,
      agitationLevel: parameters.agitationLevel || 1,
      containerSize: { x: 4, y: 4, z: 4 },
      gridSize: 128,
    }

    let containers = []
    let flames = []
    let time = 0

    function initializeSystem() {
      const spacing = 6
      const gridSize = Math.ceil(Math.sqrt(config.containerCount))

      for (let i = 0; i < config.containerCount; i++) {
        const row = Math.floor(i / gridSize)
        const col = i % gridSize

        const position = new THREE.Vector3(
          (col - (gridSize - 1) / 2) * spacing,
          0,
          (row - (gridSize - 1) / 2) * spacing
        )

        const containerData = createContainer(scene, position, i, config)
        containers.push(containerData)
        createFlame(scene, position, flames)
      }

      initializeCrystalMaterial(config)
    }

    function updateSystem(deltaTime) {
      time += deltaTime

      containers.forEach((containerData, index) => {
        const tempVariation = Math.sin(time + index) * 5
        const currentTemp = Math.max(
          50,
          config.temperature - config.coolingRate * deltaTime + tempVariation
        )

        if (currentTemp < LIQUIDS[config.liquidType].freezingPoint) {
          containerData.crystallizationProgress = Math.min(
            1,
            containerData.crystallizationProgress + deltaTime * 0.1
          )
        }

        updateParticlesForContainer(containerData, config, deltaTime)
        updateCrystalsForContainer(containerData, config, time, deltaTime)
        updateSolutionAppearance(containerData, config)

        containerData.temperatureGauge.rotation.y = 
          ((currentTemp - 273.15) / 300) * Math.PI * 0.75

        containerData.container.rotation.y += 0.001
      })

      updateFlames(flames, deltaTime, config.temperature)

      refractionPass.uniforms.time.value = time
      refractionPass.uniforms.distortion.value = Math.sin(time * 0.5) * 0.05 + 0.05
    }

    function animate() {
      requestAnimationFrame(animate)
      const deltaTime = 0.016 // Assuming 60fps
      updateSystem(deltaTime)
      controls.update()
      composer.render()
    }

    camera.position.set(0, 10, 20)
    initializeSystem()
    animate()

    return () => {
      // Cleanup
      containers.forEach(containerData => {
        containerData.particles.geometry.dispose()
        containerData.particles.material.dispose()
        scene.remove(containerData.container)
      })

      flames.forEach(flame => {
        flame.particles.forEach(particle => {
          particle.mesh.geometry.dispose()
          particle.mesh.material.dispose()
        })
        scene.remove(flame.group)
      })

      renderer.dispose()
    }
  }, [parameters])

  return <canvas ref={canvasRef} />
}

export default CrystallizationSimulation
