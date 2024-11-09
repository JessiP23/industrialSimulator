'use client'

import { useState, useEffect, useRef } from 'react'
import { Chart } from 'chart.js/auto'

// Industrial Process Simulator class (previously defined)
class IndustrialProcessSimulator {
  constructor() {
    this.processes = {
      crystallization: this.simulateCrystallization,
      distillation: this.simulateDistillation,
      filtration: this.simulateFiltration,
      fermentation: this.simulateFermentation,
      reactorDesign: this.simulateReactorDesign
    };
  }

  simulateProcess(processName, parameters) {
    if (this.processes[processName]) {
      return this.processes[processName](parameters);
    } else {
      throw new Error(`Process ${processName} not found`);
    }
  }

  simulateCrystallization({ temperature, concentration, coolingRate }) {
    const yieldPercentage = 100 - (temperature * 0.5) + (concentration * 0.3) - (coolingRate * 0.2);
    const crystalSize = (100 - temperature) * 0.1 + (concentration * 0.05) - (coolingRate * 0.02);
    
    return {
      yieldPercentage: Math.max(0, Math.min(100, yieldPercentage)),
      crystalSize: Math.max(0, crystalSize)
    };
  }

  simulateDistillation({ feedRate, refluxRatio, numberOfPlates }) {
    const separation = (numberOfPlates * 0.1) + (refluxRatio * 0.2);
    const energyConsumption = feedRate * (1 + refluxRatio) * 0.5;
    
    return {
      separation: Math.min(99, separation),
      energyConsumption
    };
  }

  simulateFiltration({ particleSize, fluidViscosity, filterArea }) {
    const filtrationRate = (filterArea * 0.1) / (particleSize * fluidViscosity);
    const filtrationEfficiency = 100 - (particleSize * 10);
    
    return {
      filtrationRate: Math.max(0, filtrationRate),
      filtrationEfficiency: Math.max(0, Math.min(100, filtrationEfficiency))
    };
  }

  simulateFermentation({ temperature, pH, sugarConcentration, time }) {
    const yields = (sugarConcentration * 0.5) * (1 - Math.abs(pH - 7) * 0.1) * (temperature / 30) * (time / 72);
    const alcoholContent = yields * 0.48;
    
    return {
      yield: Math.max(0, Math.min(100, yields)),
      alcoholContent: Math.max(0, alcoholContent)
    };
  }

  simulateReactorDesign({ reactorVolume, flowRate, reactionRate, temperature }) {
    const conversionRate = (reactionRate * reactorVolume) / flowRate;
    const residenceTime = reactorVolume / flowRate;
    const heatGenerated = reactionRate * reactorVolume * 100;
    
    return {
      conversionRate: Math.min(99, conversionRate),
      residenceTime,
      heatGenerated
    };
  }
}

const processConfigs = {
  crystallization: [
    { name: 'temperature', min: 0, max: 100, step: 1, default: 25 },
    { name: 'concentration', min: 0, max: 100, step: 1, default: 75 },
    { name: 'coolingRate', min: 0, max: 10, step: 0.1, default: 2 },
  ],
  distillation: [
    { name: 'feedRate', min: 0, max: 200, step: 1, default: 100 },
    { name: 'refluxRatio', min: 0, max: 10, step: 0.1, default: 3 },
    { name: 'numberOfPlates', min: 1, max: 50, step: 1, default: 20 },
  ],
  filtration: [
    { name: 'particleSize', min: 0.01, max: 1, step: 0.01, default: 0.1 },
    { name: 'fluidViscosity', min: 0.1, max: 10, step: 0.1, default: 1 },
    { name: 'filterArea', min: 1, max: 50, step: 1, default: 10 },
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

export default function ProcessSimulator() {
  const [selectedProcess, setSelectedProcess] = useState('crystallization')
  const [parameters, setParameters] = useState({})
  const [results, setResults] = useState(null)
  const chartRef = useRef(null)
  const chartInstance = useRef(null)
  const simulator = new IndustrialProcessSimulator()

  useEffect(() => {
    setParameters(Object.fromEntries(processConfigs[selectedProcess].map(config => [config.name, config.default])))
  }, [selectedProcess])

  useEffect(() => {
    if (results) {
      updateChart()
    }
  }, [results])

  function runSimulation() {
    const simulationResults = simulator.simulateProcess(selectedProcess, parameters)
    setResults(simulationResults)
  }

  function updateChart() {
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext('2d')
    const labels = Object.keys(results)
    const data = Object.values(results)

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Simulation Results',
          data: data,
          backgroundColor: [
            'rgba(59, 130, 246, 0.6)',
            'rgba(16, 185, 129, 0.6)',
            'rgba(249, 115, 22, 0.6)',
            'rgba(236, 72, 153, 0.6)',
          ],
          borderColor: [
            'rgba(59, 130, 246, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(249, 115, 22, 1)',
            'rgba(236, 72, 153, 1)',
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    })
  }

  return (
    <div className="container mx-auto p-4 bg-gray-100 min-h-screen">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <h1 className="text-2xl font-bold">Industrial Process Simulator</h1>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap items-center space-x-4 mb-6">
            <select
              value={selectedProcess}
              onChange={(e) => setSelectedProcess(e.target.value)}
              className="block w-64 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.keys(processConfigs).map((process) => (
                <option key={process} value={process}>
                  {process.charAt(0).toUpperCase() + process.slice(1)}
                </option>
              ))}
            </select>
            <button
              onClick={runSimulation}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out"
            >
              Run Simulation
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Process Parameters</h2>
              {processConfigs[selectedProcess].map((config) => (
                <div key={config.name} className="mb-4">
                  <label htmlFor={config.name} className="block text-sm font-medium text-gray-700 mb-1">
                    {config.name.charAt(0).toUpperCase() + config.name.slice(1)}: {parameters[config.name] || config.default}
                  </label>
                  <input
                    type="range"
                    id={config.name}
                    min={config.min}
                    max={config.max}
                    step={config.step}
                    value={parameters[config.name] || config.default}
                    onChange={(e) => setParameters(prev => ({ ...prev, [config.name]: parseFloat(e.target.value) }))}
                    className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              ))}
            </div>
            <div className="bg-gray-50 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Simulation Results</h2>
              {results ? (
                <div>
                  <canvas ref={chartRef} width="400" height="200"></canvas>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {Object.entries(results).map(([key, value]) => (
                      <p key={key} className="text-sm">
                        <span className="font-semibold">{key}:</span> {typeof value === 'number' ? value.toFixed(2) : value}
                      </p>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 italic">Run the simulation to see results.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}