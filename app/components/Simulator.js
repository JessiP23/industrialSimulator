'use client'

import { useState, useEffect } from 'react'

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
  const [selectedProcess, setSelectedProcess] = useState('crystallization');
  const [parameters, setParameters] = useState({});
  const [results, setResults] = useState(null);
  const simulator = new IndustrialProcessSimulator();

  useEffect(() => {
    setParameters(Object.fromEntries(processConfigs[selectedProcess].map(config => [config.name, config.default])));
  }, [selectedProcess]);

  useEffect(() => {
    const container = document.getElementById('simulator-container');
    if (!container) return;

    container.innerHTML = '';

    // Create control panel
    const controlPanel = document.createElement('div');
    controlPanel.className = 'control-panel';
    container.appendChild(controlPanel);

    // Create process selector
    const processSelector = document.createElement('select');
    processSelector.id = 'process-selector';
    Object.keys(processConfigs).forEach(process => {
      const option = document.createElement('option');
      option.value = process;
      option.textContent = process.charAt(0).toUpperCase() + process.slice(1);
      processSelector.appendChild(option);
    });
    processSelector.value = selectedProcess;
    processSelector.addEventListener('change', (e) => setSelectedProcess(e.target.value));
    controlPanel.appendChild(processSelector);

    // Create run button
    const runButton = document.createElement('button');
    runButton.textContent = 'Run Simulation';
    runButton.addEventListener('click', runSimulation);
    controlPanel.appendChild(runButton);

    // Create parameter controls
    const parameterControls = document.createElement('div');
    parameterControls.className = 'parameter-controls';
    container.appendChild(parameterControls);

    processConfigs[selectedProcess].forEach(config => {
      const parameterContainer = document.createElement('div');
      parameterContainer.className = 'parameter-container';

      const label = document.createElement('label');
      label.textContent = `${config.name.charAt(0).toUpperCase() + config.name.slice(1)}: ${parameters[config.name]}`;
      label.htmlFor = config.name;

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.id = config.name;
      slider.min = config.min;
      slider.max = config.max;
      slider.step = config.step;
      slider.value = parameters[config.name];
      slider.addEventListener('input', (e) => {
        setParameters(prev => ({ ...prev, [config.name]: parseFloat(e.target.value) }));
        label.textContent = `${config.name.charAt(0).toUpperCase() + config.name.slice(1)}: ${e.target.value}`;
      });

      parameterContainer.appendChild(label);
      parameterContainer.appendChild(slider);
      parameterControls.appendChild(parameterContainer);
    });

    // Create results display
    const resultsDisplay = document.createElement('div');
    resultsDisplay.id = 'results-display';
    resultsDisplay.className = 'results-display';
    container.appendChild(resultsDisplay);

    updateResults();
  }, [selectedProcess, parameters, results]);

  function runSimulation() {
    const simulationResults = simulator.simulateProcess(selectedProcess, parameters);
    setResults(simulationResults);
  }

  function updateResults() {
    const resultsDisplay = document.getElementById('results-display');
    if (!resultsDisplay) return;

    resultsDisplay.innerHTML = '';
    if (results) {
      const resultsList = document.createElement('ul');
      Object.entries(results).forEach(([key, value]) => {
        const listItem = document.createElement('li');
        listItem.textContent = `${key}: ${typeof value === 'number' ? value.toFixed(2) : value}`;
        resultsList.appendChild(listItem);
      });
      resultsDisplay.appendChild(resultsList);
    } else {
      resultsDisplay.textContent = 'Run the simulation to see results.';
    }
  }

  return (
    <div id="simulator-container" className="simulator-container"></div>
  );
}