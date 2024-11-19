
import * as THREE from 'three'

function createWebGL2Context() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    depth: true,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: false,
    stencil: false
  });

  // gl
  
  if (!gl) {
    throw new Error('WebGL2 not supported');
  }
  
  gl.getExtension('EXT_color_buffer_float');
  gl.getExtension('OES_texture_float_linear');
  
  return gl;
}

function createSimulationProgram(gl) {
  const vertexShader = `#version 300 es
    in vec2 position;
    out vec2 vUv;
    void main() {
      vUv = position * 0.5 + 0.5;
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const fragmentShader = `#version 300 es
    precision highp float;
    precision highp sampler2D;
    
    in vec2 vUv;
    uniform sampler2D uPreviousState;
    uniform float uDeltaTime;
    uniform float uTemperature;
    uniform float uViscosity;
    uniform vec3 uGravity;
    out vec4 fragColor;
    
    void main() {
      vec4 previousState = texture(uPreviousState, vUv);
      
      // Unpack state
      float density = previousState.r;
      float temp = previousState.g;
      float pressure = previousState.b;
      vec2 velocity = previousState.ba;
      
      // Temperature diffusion
      temp += uDeltaTime * (uTemperature - temp) * 0.1;
      
      // Buoyancy force
      velocity.y += uDeltaTime * uGravity.y * (1.0 - density * temp * 0.1);
      
      // Viscous diffusion
      velocity *= (1.0 - uDeltaTime * uViscosity);
      
      // Pressure calculation
      pressure = density * temp * 0.01;
      
      // Pack state
      fragColor = vec4(density, temp, pressure, velocity.x);
    }
  `;

  const program = gl.createProgram();
  
  // Create and compile shaders
  const vs = gl.createShader(gl.VERTEX_SHADER);
  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  
  gl.shaderSource(vs, vertexShader);
  gl.shaderSource(fs, fragmentShader);
  
  gl.compileShader(vs);
  gl.compileShader(fs);
  
  if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
    throw new Error(`Vertex shader compilation failed: ${gl.getShaderInfoLog(vs)}`);
  }
  
  if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
    throw new Error(`Fragment shader compilation failed: ${gl.getShaderInfoLog(fs)}`);
  }
  
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`Program linking failed: ${gl.getProgramInfoLog(program)}`);
  }
  
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  
  return program;
}

export function Crystallization({ scene, parameters, results }) {
  const config = {
    particleCount: 1000,
    temperature: parameters.temperature || 300,
    coolingRate: parameters.coolingRate || 1,
    crystalType: parameters.crystalType || 'cubic',
    saturationLevel: parameters.saturationLevel || 0.5,
    agitationLevel: parameters.agitationLevel || 1,
    maxNucleationPoints: 5,
    containerSize: { x: 4, y: 4, z: 4 },
    viscosity: parameters.viscosity || 1.0,
    gravity: -9.81,
    surfaceTension: 0.07,
    pressureConstant: 0.04,
    gridSize: 64
  };

  // Initialize WebGL2 context and simulation
  const gl = createWebGL2Context();
  const simulationProgram = createSimulationProgram(gl);
  
  // Create simulation textures
  const createSimulationTexture = () => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA32F,
      config.gridSize,
      config.gridSize,
      0,
      gl.RGBA,
      gl.FLOAT,
      null
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
  };

  const stateTextures = [createSimulationTexture(), createSimulationTexture()];
  let currentStateIndex = 0;

  // Create framebuffers
  const framebuffers = stateTextures.map(texture => {
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0
    );
    return fb;
  });

  // Create Three.js visualization
  const containerGeometry = new THREE.BoxGeometry(
    config.containerSize.x,
    config.containerSize.y,
    config.containerSize.z
  );
  
  const containerMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      temperature: { value: config.temperature / 1000 }
    },
    vertexShader: `
      uniform float time;
      uniform float crystallization;
      varying vec3 vPosition;
      varying float vCrystallization;
      
      void main() {
        vPosition = position;
        vCrystallization = crystallization;
        
        // Crystal growth animation
        vec3 pos = position;
        pos += normal * sin(time * 2.0 + position.y * 10.0) * 0.02 * (1.0 - crystallization);
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,

    fragmentShader: `
      uniform float temperature;
      uniform float time;
      uniform sampler2D noiseTexture;
      varying vec3 vPosition;
      varying float vCrystallization;
      
      void main() {
        // Temperature-based coloring
        vec3 hotColor = vec3(1.0, 0.3, 0.1);
        vec3 coldColor = vec3(0.2, 0.5, 1.0);
        vec3 crystalColor = vec3(0.9, 0.95, 1.0);
        
        // Dynamic noise pattern
        vec2 noiseUV = vPosition.xy * 0.1 + time * 0.01;
        vec4 noise = texture2D(noiseTexture, noiseUV);
        
        // Crystal formation effect
        float crystal = smoothstep(0.0, 1.0, vCrystallization);
        float sparkle = pow(noise.r, 10.0) * crystal;
        
        // Final color
        vec3 color = mix(
          mix(coldColor, hotColor, temperature),
          crystalColor,
          crystal
        );
        
        // Add sparkle and iridescence
        color += sparkle * vec3(0.5, 0.7, 1.0);
        color += sin(vPosition.y * 20.0 + time) * 0.1 * crystal;
        
        gl_FragColor = vec4(color, 0.8 + 0.2 * crystal);
      }
    `,

    transparent: true,
    side: THREE.DoubleSide
  });

  const container = new THREE.Mesh(containerGeometry, containerMaterial);
  container.material.depthWrite = false;
  scene.add(container);

  // Create particle system
  const particleGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(config.particleCount * 3);
  const velocities = new Float32Array(config.particleCount * 3);
  
  // Initialize particles
  for (let i = 0; i < config.particleCount; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * config.containerSize.x;
    positions[i3 + 1] = (Math.random() - 0.5) * config.containerSize.y;
    positions[i3 + 2] = (Math.random() - 0.5) * config.containerSize.z;
  }
  
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const particleMaterial = new THREE.PointsMaterial({
    size: 0.05,
    vertexColors: true,
    transparent: true
  });

  const particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);

  // Animation loop
  function animate(deltaTime) {
    // Update simulation
    gl.useProgram(simulationProgram);
    
    const nextStateIndex = 1 - currentStateIndex;
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[nextStateIndex]);
    gl.viewport(0, 0, config.gridSize, config.gridSize);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, stateTextures[currentStateIndex]);
    
    gl.uniform1f(gl.getUniformLocation(simulationProgram, "uDeltaTime"), deltaTime);
    gl.uniform1f(gl.getUniformLocation(simulationProgram, "uTemperature"), config.temperature);
    gl.uniform1f(gl.getUniformLocation(simulationProgram, "uViscosity"), config.viscosity);
    gl.uniform3f(gl.getUniformLocation(simulationProgram, "uGravity"), 0, config.gravity, 0);
    
    // Draw fullscreen quad
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
    currentStateIndex = nextStateIndex;
    
    // Update particles
    updateParticles(deltaTime);
    
    // Update materials
    containerMaterial.uniforms.time.value += deltaTime;
  }

  function updateParticles(deltaTime) {
    const positions = particleGeometry.attributes.position.array;
    
    for (let i = 0; i < config.particleCount; i++) {
      const i3 = i * 3;
      
      // Update position based on velocity
      positions[i3] += velocities[i3] * deltaTime;
      positions[i3 + 1] += velocities[i3 + 1] * deltaTime;
      positions[i3 + 2] += velocities[i3 + 2] * deltaTime;
      
      // Boundary conditions
      for (let j = 0; j < 3; j++) {
        const idx = i3 + j;
        const size = j === 0 ? config.containerSize.x : 
                    j === 1 ? config.containerSize.y : 
                    config.containerSize.z;
        
        if (Math.abs(positions[idx]) > size / 2) {
          positions[idx] = Math.sign(positions[idx]) * size / 2;
          velocities[idx] *= -0.5; // Bounce with energy loss
        }
      }
    }
    
    particleGeometry.attributes.position.needsUpdate = true;
  }

  // Cleanup
  function dispose() {
    gl.deleteProgram(simulationProgram);
    stateTextures.forEach(texture => gl.deleteTexture(texture));
    framebuffers.forEach(fb => gl.deleteFramebuffer(fb));
    
    containerMaterial.dispose();
    containerGeometry.dispose();
    particleMaterial.dispose();
    particleGeometry.dispose();
  }

  return { animate, dispose };
}

