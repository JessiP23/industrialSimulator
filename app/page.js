'use client'

import React, { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { Chart } from 'chart.js/auto'
import { IndustrialProcessSimulator } from './process/page'
import { processConfigs } from './process/page'
import { createScene } from './scene/page'
import { Crystallization } from './crystallization/page'
import { Distillation } from './distillation/page'
import { Filtration } from './filtration/page'
import { Fermentation } from './fermentation/page'
import { ReactorDesign } from './reactor/page'

function ProcessAnimation({ process, parameters, results, container }) {
  const sceneSetup = createScene(container)

  if (sceneSetup.error) {
    // Handle WebGL not supported error
    const errorMessage = document.createElement('div')
    errorMessage.textContent = "Your browser does not support WebGL, which is required for this simulation."
    errorMessage.style.color = "red"
    errorMessage.style.padding = "20px"
    container.appendChild(errorMessage)
    return () => {
      container.removeChild(errorMessage)
    }
  }

  const { scene, camera, renderer, controls, composer } = sceneSetup

  let animate
  switch (process) {
    case 'crystallization':
      animate = Crystallization({ scene, parameters, results })
      break
    case 'filtration':
      animate = Filtration({ scene, parameters, results })
      break
    case 'distillation':
      animate = Distillation({ scene, parameters, results })
      break
    case 'fermentation':
      animate = Fermentation({ scene, parameters, results })
      break
    case 'reactorDesign':
      animate = ReactorDesign({ scene, parameters, results })
      break
    default:
      animate = () => {}
  }

  function render() {
    requestAnimationFrame(render)
    animate()
    controls.update()
    composer.render()
  }

  render()

  return () => {
    if (renderer) {
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }
  }
}

function ResultsChart({ results }) {
  const chartRef = useRef(null)
  const chartInstance = useRef(null)

  useEffect(() => {
    if (results) {
      updateChart()
    }
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [results])

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

  return <canvas ref={chartRef} width="400" height="200"></canvas>
}

export default function Component() {
  const [selectedProcess, setSelectedProcess] = useState('crystallization')
  const [parameters, setParameters] = useState({})
  const [results, setResults] = useState(null)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const visualizationRef = useRef(null)
  const simulator = new IndustrialProcessSimulator()

  useEffect(() => {
    setParameters(Object.fromEntries(processConfigs[selectedProcess].map(config => [config.name, config.default])))
  }, [selectedProcess])

  useEffect(() => {
    let cleanup
    if (visualizationRef.current && results) {
      cleanup = ProcessAnimation({
        process: selectedProcess,
        parameters,
        results,
        container: visualizationRef.current
      })
    }
    return () => {
      if (cleanup) cleanup()
    }
  }, [selectedProcess, parameters, results])

  function runSimulation() {
    const simulationResults = simulator.simulateProcess(selectedProcess, parameters)
    // Ensure all result values are numbers
    const validResults = Object.fromEntries(
      Object.entries(simulationResults).map(([key, value]) => [key, isNaN(value) ? 0 : value])
    );
    setResults(validResults)
  }

  const handleParameterChange = (name, value) => {
    const config = processConfigs[selectedProcess].find(c => c.name === name)
    const newValue = Math.max(config.min, Math.min(config.max, parseFloat(value) || config.min))
    setParameters(prev => ({ ...prev, [name]: newValue }))
    // Run simulation immediately when a parameter changes
    runSimulation()
  }

  const mainOptions = processConfigs[selectedProcess].slice(0, 3)
  const advancedOptions = processConfigs[selectedProcess].slice(3)

  return (
    <div className="flex flex-col h-screen bg-white"> {/* White background */}
      {/* Control Panel (20% height) */}
      <div className="h-1/5 bg-gray-100 shadow-lg p-4"> {/* Light gray background for control panel */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Enhanced Industrial Process Simulator</h1>
          <button
            onClick={runSimulation}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out"
          >
            Run Simulation
          </button>
        </div>
        <div className="flex space-x-4">
          <div className="w-1/4">
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
          <div className="w-3/4 grid grid-cols-3 gap-4">
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
            {advancedOptions.length > 0 && (
              <div className="col-span-3">
                <button
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  className="text-blue-600 hover:text-blue-800 focus:outline-none"
                >
                  {showAdvancedOptions ? 'Hide' : 'Show'} Advanced Options
                </button>
              </div>
            )}
          </div>
        </div>
        {showAdvancedOptions && (
          <div className="mt-4 grid grid-cols-3 gap-4">
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

      {/* Simulation Area (80% height) */}
      <div className="h-4/5 flex">
        {/* 3D Visualization */}
        <div className="w-2/3 bg-white p-4"> {/* White background for visualization area */}
          <div ref={visualizationRef} className="w-full h-full"></div>
        </div>

        {/* Results Panel */}
        <div className="w-1/3 bg-white p-4 overflow-y-auto"> {/* White background for results panel */}
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Simulation Results</h2>
          {results ? (
            <div>
              <ResultsChart results={results} />
              <div className="mt-4 grid grid-cols-2 gap-2">
                {Object.entries(results).map(([key, value]) => (
                  <p key={key} className="text-sm text-black"> {/* Black text for results */}
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
  )
}