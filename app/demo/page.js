'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import * as THREE from 'three'
import { Chart } from 'chart.js/auto'
import { IndustrialProcessSimulator } from '../lib/page'
import { processConfigs } from '../lib/page'
import { createScene } from '../scene/page'
import { Distillation } from '../distillation/page'
import { Filtration } from '../filtration/page'
import { Fermentation } from '../fermentation/page'
import { ReactorDesign } from '../reactor/page'

function AIAnalysis({ process, parameters, results }) {
  const [analysis, setAnalysis] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const generateAnalysis = async () => {
      setLoading(true)

      try {
        const response = await fetch('/backend/api', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            process,
            parameters,
            results,
          }),
        })

        if (!response.ok) {
          throw new Error('Analysis request failed')
        }

        const data = await response.json()
        setAnalysis(data.content)
      } catch (error) {
        console.error('Error generating analysis:', error)
        setAnalysis('Failed to generate analysis. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    if (results) {
      generateAnalysis()
    }
  }, [process, parameters, results])

  return (
    <div className="mt-8 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-black border-b pb-2">AI Analysis</h2>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            <span className="ml-3 text-black font-medium">Generating analysis...</span>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none">
            {analysis.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-4 text-black leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Custom hook for throttling
function useThrottle(callback, delay) {
  const lastCall = useRef(0)
  const lastCallTimer = useRef()

  return useCallback((...args) => {
    const now = Date.now()
    if (now - lastCall.current >= delay) {
      callback(...args)
      lastCall.current = now
    } else {
      clearTimeout(lastCallTimer.current)
      lastCallTimer.current = setTimeout(() => {
        callback(...args)
        lastCall.current = Date.now()
      }, delay)
    }
  }, [callback, delay])
}

function ProcessAnimation({ process, parameters, results, container }) {
  const sceneRef = useRef()
  const cameraRef = useRef()
  const rendererRef = useRef()
  const animationFrameRef = useRef()

  useEffect(() => {
    if (!container) return

    const sceneSetup = createScene(container)

    if (sceneSetup.error) {
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
    sceneRef.current = scene
    cameraRef.current = camera
    rendererRef.current = renderer

    let animate
    switch (process) {
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
      animationFrameRef.current = requestAnimationFrame(render)
      animate()
      controls.update()
    }

    render()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (rendererRef.current) {
        rendererRef.current.dispose()
        container.removeChild(rendererRef.current.domElement)
      }
    }
  }, [process, parameters, results, container])

  return null
}

function ResultsChart({ results }) {
  const chartRef = useRef(null)
  const chartInstanceRef = useRef(null)

  useEffect(() => {
    if (!chartRef.current || !results) return

    const ctx = chartRef.current.getContext('2d')
    const labels = Object.keys(results)
    const data = Object.values(results)

    const chartConfig = {
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
    }

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy()
    }

    chartInstanceRef.current = new Chart(ctx, chartConfig)

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy()
      }
    }
  }, [results])

  return <canvas ref={chartRef} width="400" height="200"></canvas>
}

export default function Component() {
  const [selectedProcess, setSelectedProcess] = useState('filtration')
  const [parameters, setParameters] = useState({})
  const [results, setResults] = useState(null)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const visualizationRef = useRef(null)
  const simulator = useMemo(() => new IndustrialProcessSimulator(), [])

  useEffect(() => {
    setParameters(Object.fromEntries(processConfigs[selectedProcess].map(config => [config.name, config.default])))
  }, [selectedProcess])

  const runSimulation = useCallback(() => {
    const simulationResults = simulator.simulateProcess(selectedProcess, parameters)
    const validResults = Object.fromEntries(
      Object.entries(simulationResults).map(([key, value]) => [key, isNaN(value) ? 0 : value])
    )
    setResults(validResults)
  }, [selectedProcess, parameters, simulator])

  const throttledRunSimulation = useThrottle(runSimulation, 200)

  const handleParameterChange = useCallback((name, value) => {
    const config = processConfigs[selectedProcess].find(c => c.name === name)
    if (config) {
      const newValue = Math.max(config.min, Math.min(config.max, parseFloat(value) || config.min))
      setParameters(prev => ({ ...prev, [name]: newValue }))
      throttledRunSimulation()
    }
  }, [selectedProcess, throttledRunSimulation])

  const mainOptions = useMemo(() => processConfigs[selectedProcess].slice(0, 3), [selectedProcess])
  const advancedOptions = useMemo(() => processConfigs[selectedProcess].slice(3), [selectedProcess])

  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="h-1/5 bg-gray-100 shadow-lg p-4">
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
          </div>
        </div>
        {advancedOptions.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="text-blue-600 hover:text-blue-800 focus:outline-none"
            >
              {showAdvancedOptions ? 'Hide' : 'Show'} Advanced Options
            </button>
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
        )}
      </div>

      <div className="h-4/5 flex">
        <div className="w-2/3 bg-white p-4">
          <div ref={visualizationRef} className="w-full h-full">
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

        <div className="w-1/3 bg-white p-4 overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Simulation Results</h2>
          {results ? (
            <div>
              <ResultsChart results={results} />
              <div className="mt-4 grid grid-cols-2 gap-2">
                {Object.entries(results).map(([key, value]) => (
                  <p key={key} className="text-sm text-black">
                    <span className="font-semibold">{key}:</span> {typeof value === 'number' ? value.toFixed(2) : value}
                  </p>
                ))}
              </div>
              <AIAnalysis process={selectedProcess} parameters={parameters} results={results} />
            </div>
          ) : (
            <p className="text-gray-500 italic">Run the simulation to see results.</p>
          )}
        </div>
      </div>
    </div>
  )
}

