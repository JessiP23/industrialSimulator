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

  simulateDistillation({ feedRate, refluxRatio, numberOfPlates, feedComposition = 0.5, pressure = 101325, feedTemperature = 78 }) {
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

export { IndustrialProcessSimulator, processConfigs };