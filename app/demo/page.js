'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import * as THREE from 'three'
import AIAnalysis from '../components/AIAnalysis'
import ResultsChart from '../components/ResultsChart'
import useThrottle from '../components/Throttle'
import ProcessAnimation from '../components/Process'

const processConfigs = {
  filtration: [
    { name: 'particleSize', min: 0.01, max: 1, step: 0.01, default: 0.1 },
    { name: 'fluidViscosity', min: 0.1, max: 10, step: 0.1, default: 1 },
    { name: 'filterArea', min: 1, max: 50, step: 1, default: 10 },
  ],
  distillation: [
    { name: 'feedRate', min: 0, max: 200, step: 1, default: 100 },
    { name: 'refluxRatio', min: 0, max: 10, step: 0.1, default: 3 },
    { name: 'numberOfPlates', min: 1, max: 50, step: 1, default: 20 },
  ],
  fermentation: [
    { name: 'temperature', min: 20, max: 40, step: 0.1, default: 30 },
    { name: 'pH', min: 3, max: 9, step: 0.1, default: 6.5 },
    { name: 'sugarConcentration', min: 5, max: 30, step: 0.1, default: 15 },
    { name: 'time', min: 24, max: 120, step: 1, default: 48 },
  ],
  reactorDesign: [
    { name: 'reactorVolume', min: 100, max: 5000, step: 100, default: 1000 },
    { name: 'flowRate', min: 1, max: 50, step: 1, default: 10 },
    { name: 'reactionRate', min: 0.01, max: 0.2, step: 0.01, default: 0.05 },
    { name: 'temperature', min: 20, max: 200, step: 1, default: 80 },
  ],
};

// Constants for simulations
const MAX_GROWTH_RATE = 0.3;
const MONOD_KS = 2.0;
const MAINTENANCE_COEFFICIENT = 0.05;
const YIELD_COEFFICIENT = 0.485;
const DEATH_RATE = 0.01;
const FLUID_VISCOSITY = 0.001;
const UNIVERSAL_GAS_CONSTANT = 8.314;

class IndustrialProcessSimulator {
  constructor() {
    this.processes = {
      filtration: this.simulateFiltration,
      distillation: this.simulateDistillation,
      fermentation: this.simulateFermentation,
      reactorDesign: this.simulateReactorDesign,
    };
    
    // LRU Cache for simulation results
    this.simulationCache = new LRUCache(50);
  }

  simulateProcess(processName, parameters) {
    const cacheKey = JSON.stringify({ processName, parameters });
    
    // Check cache first
    if (this.simulationCache.has(cacheKey)) {
      return this.simulationCache.get(cacheKey);
    }

    const processFunc = this.processes[processName];
    if (!processFunc) {
      throw new Error(`Process ${processName} not found`);
    }

    // Perform simulation
    const result = processFunc.call(this, parameters);
    
    // Store in cache
    this.simulationCache.put(cacheKey, result);
    
    return result;
  }


   async simulateDistillation({ feedRate, refluxRatio, numberOfPlates, feedComposition = 0.5, pressure = 101325, feedTemperature = 78 }) {
    const minRefluxRatio = 0.5;
    const actualRefluxRatio = Math.max(refluxRatio, minRefluxRatio);
    const theoreticalStages = numberOfPlates * 0.7;
    
    const separation = (1 - Math.exp(-theoreticalStages / actualRefluxRatio)) * 100;
    const energyConsumption = feedRate * actualRefluxRatio * 0.1;
    const productPurity = Math.min(99.9, separation * 0.9);
    
    const bottomTemp = feedTemperature + 10;
    const topTemp = feedTemperature - 5;
    const temperatures = Array.from({length: numberOfPlates}, (_, i) => 
      bottomTemp - (bottomTemp - topTemp) * (i / (numberOfPlates - 1))
    );
    
    const compositions = Array.from({length: numberOfPlates}, (_, i) => 
      feedComposition + (productPurity/100 - feedComposition) * (i / (numberOfPlates - 1))
    );

    return {
      separation,
      energyConsumption,
      productPurity,
      numberOfTheoreticalStages: Math.round(theoreticalStages),
      actualRefluxRatio,
      temperatures,
      compositions,
      pressure_drop: numberOfPlates * 0.1 * (feedRate / 100)
    };
  }

  simulateFiltration({ particleSize, fluidViscosity, filterArea }) {
    particleSize = Math.max(0.001, Number(particleSize) || 0.1);
    fluidViscosity = Math.max(0.1, Number(fluidViscosity) || 1);
    filterArea = Math.max(0.1, Number(filterArea) || 10);

    const porosity = 0.4 - (0.1 * particleSize);
    const specificCakeResistance = 1e11 * Math.pow(particleSize, -1.5);
    const flowRate = (filterArea * (1 - porosity)) / (fluidViscosity * specificCakeResistance);
    const efficiency = (1 - Math.exp(-particleSize * 10)) * 100;
    const pressureDrop = flowRate * fluidViscosity * specificCakeResistance / filterArea;

    return {
      filtrationRate: Math.max(0, flowRate * 3600),
      filtrationEfficiency: Math.min(100, efficiency),
      pressureDrop: Math.max(0, pressureDrop),
      porosity: porosity * 100,
      cakeThickness: Math.min(0.1, flowRate * specificCakeResistance * 0.01)
    };
  }

  simulateFermentation({ temperature, pH, sugarConcentration, time }) {
    const tempFactor = Math.exp(-(Math.pow(temperature - 30, 2) / 100));
    const phFactor = Math.exp(-(Math.pow(pH - 5, 2) / 2));
    
    const μMax = MAX_GROWTH_RATE * tempFactor * phFactor;
    let X = 1.0;
    let S = sugarConcentration;
    let P = 0;
    
    const dt = 0.1;
    const steps = Math.floor(time / dt);
    
    for (let i = 0; i < steps; i++) {
      const μ = μMax * (S / (MONOD_KS + S));
      
      const dX = (μ * X - DEATH_RATE * X) * dt;
      const maintenance = MAINTENANCE_COEFFICIENT * X * dt;
      const dS = -(μ * X / YIELD_COEFFICIENT + maintenance) * dt;
      const dP = (μ * X * YIELD_COEFFICIENT * 0.9) * dt;
      
      X += dX;
      S = Math.max(0, S + dS);
      P += dP;
    }
    
    const substrateUtilization = ((sugarConcentration - S) / sugarConcentration) * 100;
    const actualYield = (P / (sugarConcentration - S));
    const yieldEfficiency = (actualYield / YIELD_COEFFICIENT) * 100;
    
    return {
      yield: Math.min(100, substrateUtilization),
      alcoholContent: Math.max(0, P),
      biomassConcentration: X,
      substrateRemaining: S,
      yieldEfficiency: Math.min(100, yieldEfficiency),
      productivityRate: P / time,
      metabolicEfficiency: (P / (sugarConcentration - S)) / YIELD_COEFFICIENT * 100
    };
  }

  simulateReactorDesign({ reactorVolume, flowRate, reactionRate, temperature }) {
    const characteristicLength = Math.pow(reactorVolume, 1/3);
    const superficialVelocity = flowRate / (Math.PI * Math.pow(characteristicLength/2, 2));
    const Re = (1000 * superficialVelocity * characteristicLength) / FLUID_VISCOSITY;
    
    const mixingEfficiency = Re > 4000 ? 0.95 : (Re > 2300 ? 0.7 : 0.4);
    
    const activationEnergy = 50000;
    const preExponentialFactor = 1e6;
    const reactionConstant = preExponentialFactor * Math.exp(-activationEnergy / (UNIVERSAL_GAS_CONSTANT * temperature));
    
    const theoreticalResidenceTime = reactorVolume / flowRate;
    const effectiveResidenceTime = theoreticalResidenceTime * mixingEfficiency;
    const damkohlerNumber = reactionConstant * effectiveResidenceTime;
    
    const numberOfIdealTanks = Math.max(1, Math.floor(Re / 1000));
    const conversionPerTank = 1 - Math.exp(-damkohlerNumber / numberOfIdealTanks);
    const totalConversion = (1 - Math.pow(1 - conversionPerTank, numberOfIdealTanks)) * 100;
    
    const reactionEnthalpy = -100000;
    const heatGenerated = reactionEnthalpy * reactionRate * reactorVolume * (totalConversion / 100);
    
    const voidFraction = 0.4;
    const particleDiameter = 0.005;
    const pressureDrop = (150 * FLUID_VISCOSITY * (1 - voidFraction) * (1 - voidFraction) * superficialVelocity) / 
                        (Math.pow(particleDiameter, 2) * Math.pow(voidFraction, 3)) +
                        (1.75 * 1000 * (1 - voidFraction) * Math.pow(superficialVelocity, 2)) / 
                        (particleDiameter * Math.pow(voidFraction, 3));
    
    return {
      conversionRate: Math.min(99.9, totalConversion),
      residenceTime: effectiveResidenceTime,
      heatGenerated: heatGenerated,
      reynoldsNumber: Re,
      mixingEfficiency: mixingEfficiency * 100,
      pressureDrop: pressureDrop,
      numberOfIdealTanks,
      damkohlerNumber
    };
  }
}

// Lightweight LRU Cache implementation
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return null;
    
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      this.cache.delete(this.cache.keys().next().value);
    }
    this.cache.set(key, value);
  }

  has(key) {
    return this.cache.has(key);
  }
}

export default function Component() {
  const [selectedProcess, setSelectedProcess] = useState('filtration')
  const [parameters, setParameters] = useState({})
  const [results, setResults] = useState(null)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const visualizationRef = useRef(null)
  const simulator = useMemo(() => new IndustrialProcessSimulator(), [])

  useEffect(() => {
    const initialParams = processConfigs[selectedProcess].reduce((acc, config) => {
      acc[config.name] = config.default;
      return acc;
    }, {});
    setParameters(initialParams);
  }, [selectedProcess])

  const runSimulation = useCallback(() => {
    try {
      const simulationResults = simulator.simulateProcess(selectedProcess, parameters);
      
      // More robust result validation
      const validResults = Object.fromEntries(
        Object.entries(simulationResults).map(([key, value]) => [
          key, 
          (typeof value === 'number' && !Number.isNaN(value)) ? value : 0
        ])
      );
      
      setResults(validResults);
    } catch (error) {
      console.error('Simulation failed:', error);
      // Optionally set an error state or show user-friendly message
    }
  }, [selectedProcess, parameters, simulator])

  const throttledRunSimulation = useThrottle(runSimulation, 200)

  const handleParameterChange = useCallback((name, value) => {
    const config = processConfigs[selectedProcess].find(c => c.name === name);
    if (config) {
      const newValue = Math.max(config.min, Math.min(config.max, parseFloat(value) || config.min));
      setParameters(prev => ({ ...prev, [name]: newValue }));
      throttledRunSimulation();
    }
  }, [selectedProcess, throttledRunSimulation])

  const mainOptions = useMemo(() => processConfigs[selectedProcess].slice(0, 3), [selectedProcess])
  const advancedOptions = useMemo(() => processConfigs[selectedProcess].slice(3), [selectedProcess])

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="bg-gray-100 shadow-lg p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-800">Enhanced Industrial Process Simulator</h1>
          <button
            onClick={runSimulation}
            className="w-full lg:w-auto px-4 lg:px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out"
          >
            Run Simulation
          </button>
        </div>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="w-full lg:w-1/4">
            <select
              value={selectedProcess}
              onChange={(e) => setSelectedProcess(e.target.value)}
              className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.keys(processConfigs).map((process) => (
                <option key={process} value={process}>
                  {process.charAt(0).toUpperCase() + process.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full lg:w-3/4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mainOptions.map((config) => (
              <div key={config.name} className="flex flex-col">
                <label htmlFor={config.name} className="text-sm font-medium text-gray-700 mb-1">
                  {config.name.charAt(0).toUpperCase() + config.name.slice(1)}
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    id={`${config.name}-slider`}
                    min={config.min}
                    max={config.max}
                    step={config.step}
                    value={parameters[config.name] || config.default}
                    onChange={(e) => handleParameterChange(config.name, e.target.value)}
                    className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <input
                    type="number"
                    id={`${config.name}-input`}
                    min={config.min}
                    max={config.max}
                    step={config.step}
                    value={parameters[config.name] || config.default}
                    onChange={(e) => handleParameterChange(config.name, e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="w-20 px-2 py-1 text-sm text-gray-700 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        {advancedOptions.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="text-blue-600 hover:text-blue-800 focus:outline-none text-sm lg:text-base"
            >
              {showAdvancedOptions ? 'Hide' : 'Show'} Advanced Options
            </button>
            {showAdvancedOptions && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {advancedOptions.map((config) => (
                  <div key={config.name} className="flex flex-col">
                    <label htmlFor={config.name} className="text-sm font-medium text-gray-700 mb-1">
                      {config.name.charAt(0).toUpperCase() + config.name.slice(1)}
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        id={`${config.name}-slider`}
                        min={config.min}
                        max={config.max}
                        step={config.step}
                        value={parameters[config.name] || config.default}
                        onChange={(e) => handleParameterChange(config.name, e.target.value)}
                        className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <input
                        type="number"
                        id={`${config.name}-input`}
                        min={config.min}
                        max={config.max}
                        step={config.step}
                        value={parameters[config.name] || config.default}
                        onChange={(e) => handleParameterChange(config.name, e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className="w-20 px-2 py-1 text-sm text-gray-700 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col lg:flex-row">
        <div className="w-full lg:w-2/3 bg-white p-4">
          <div ref={visualizationRef} className="w-full h-[300px] lg:h-full">
            {results && (
              <ProcessAnimation
                process={selectedProcess}
                parameters={parameters}
                results={results}
                container={visualizationRef.current}
              />
            )}
          </div>
        </div>

        <div className="w-full lg:w-1/3 bg-white p-4 overflow-y-auto">
          <h2 className="text-lg lg:text-xl font-semibold mb-4 text-gray-800">Simulation Results</h2>
          {results ? (
            <div>
              <ResultsChart results={results} />
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(results).map(([key, value]) => (
                  <p key={key} className="text-sm lg:text-base text-black">
                    <span className="font-semibold">{key}:</span> {typeof value === 'number' ? value.toFixed(2) : value}
                  </p>
                ))}
              </div>
              <AIAnalysis process={selectedProcess} parameters={parameters} results={results} />
            </div>
          ) : (
            <p className="text-gray-500 italic text-sm lg:text-base">Run the simulation to see results.</p>
          )}
        </div>
      </div>
    </div>
  )
}

