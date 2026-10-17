/**
 * Pure calculation logic for PHONY Flagship Smartphone App
 * Testable with node:test
 */

export interface BatteryUsageFactors {
  gamingHours: number;      // 0 - 8 hours
  streamingHours: number;   // 0 - 12 hours
  brightnessPct: number;    // 10 - 100 %
  network5G: boolean;       // true = 5G, false = WiFi
  refreshRate: number;      // 60, 90, 120, 144 Hz
  batteryCapacityMah: number; // e.g. 5200 for X1 Pro
}

export interface BatteryCalcResult {
  estimatedRunTimeHours: number;
  activeScreenOnHours: number;
  efficiencyScore: number;
  drainPerHourAvgPct: number;
}

export function calculateBatteryEstimate(factors: BatteryUsageFactors): BatteryCalcResult {
  const baseMah = factors.batteryCapacityMah || 5000;
  
  // Power consumption model in mA
  const idlePowerMa = 45;
  const gamingPowerMa = 850;
  const streamingPowerMa = 380;
  
  // Multipliers
  const brightnessMultiplier = 0.7 + (factors.brightnessPct / 100) * 0.6; // 0.76 to 1.3
  const networkMultiplier = factors.network5G ? 1.25 : 1.0;
  const refreshRateMultiplier = 1.0 + ((factors.refreshRate - 60) / 84) * 0.28; // 1.0 at 60Hz to 1.28 at 144Hz

  const gamingTotalDrain = factors.gamingHours * gamingPowerMa * brightnessMultiplier * refreshRateMultiplier;
  const streamingTotalDrain = factors.streamingHours * streamingPowerMa * brightnessMultiplier * networkMultiplier;
  
  const totalScreenOnHours = factors.gamingHours + factors.streamingHours;
  const standbyHours = Math.max(0, 24 - totalScreenOnHours);
  const standbyTotalDrain = standbyHours * idlePowerMa;

  const totalUsedDrain = gamingTotalDrain + streamingTotalDrain + standbyTotalDrain;
  
  // Standard full day endurance (hours until 0%)
  const hourlyActiveDrain = (gamingTotalDrain + streamingTotalDrain) / (totalScreenOnHours || 1);
  const blendedHourlyDrain = totalUsedDrain / 24;
  
  const estimatedRunTimeHours = Math.max(4.5, Math.min(38, Number((baseMah / (blendedHourlyDrain || 150)).toFixed(1))));
  const drainPerHourAvgPct = Number(((100 / estimatedRunTimeHours)).toFixed(1));
  const efficiencyScore = Math.round(Math.min(100, (baseMah / (totalUsedDrain + 1)) * 95));

  return {
    estimatedRunTimeHours,
    activeScreenOnHours: Number(totalScreenOnHours.toFixed(1)),
    efficiencyScore,
    drainPerHourAvgPct
  };
}

export interface DeviceSpec {
  id: string;
  name: string;
  tagline: string;
  price: number;
  screenSize: string;
  displayNits: number;
  refreshRateMax: number;
  soc: string;
  cpuGhz: number;
  benchmarkScore: number;
  mainCamMp: number;
  telephotoZoom: string;
  batteryMah: number;
  chargeWatts: number;
  weightGrams: number;
  ipRating: string;
}

export const PHONY_DEVICES: Record<string, DeviceSpec> = {
  'x1-pro': {
    id: 'x1-pro',
    name: 'PHONY X1 Pro',
    tagline: 'The Cyber-Neural Flagship',
    price: 1199,
    screenSize: '6.82" 2K OLED',
    displayNits: 3000,
    refreshRateMax: 144,
    soc: 'Quantum Bionic X9 (3nm)',
    cpuGhz: 3.85,
    benchmarkScore: 2480000,
    mainCamMp: 200,
    telephotoZoom: '10x Periscope Optical (100x Space)',
    batteryMah: 5400,
    chargeWatts: 150,
    weightGrams: 209,
    ipRating: 'IP68 / IP69K'
  },
  'x1': {
    id: 'x1',
    name: 'PHONY X1',
    tagline: 'The Pure Performance Engine',
    price: 899,
    screenSize: '6.55" FHD+ OLED',
    displayNits: 2400,
    refreshRateMax: 120,
    soc: 'Quantum Bionic X9e (4nm)',
    cpuGhz: 3.4,
    benchmarkScore: 2150000,
    mainCamMp: 108,
    telephotoZoom: '5x Optical Periscope (50x)',
    batteryMah: 5000,
    chargeWatts: 100,
    weightGrams: 188,
    ipRating: 'IP68'
  },
  'lite': {
    id: 'lite',
    name: 'PHONY Lite',
    tagline: 'Hyper-Streamlined Elegance',
    price: 599,
    screenSize: '6.36" FHD+ OLED',
    displayNits: 1800,
    refreshRateMax: 120,
    soc: 'Quantum Bionic S7 (4nm)',
    cpuGhz: 3.1,
    benchmarkScore: 1650000,
    mainCamMp: 64,
    telephotoZoom: '3x Optical Telephoto (30x)',
    batteryMah: 4600,
    chargeWatts: 67,
    weightGrams: 172,
    ipRating: 'IP67'
  }
};

export type WinnerMap = Record<string, 'A' | 'B' | 'TIE'>;

export function comparePhoneSpecs(deviceAId: string, deviceBId: string): WinnerMap {
  const devA = PHONY_DEVICES[deviceAId] || PHONY_DEVICES['x1-pro'];
  const devB = PHONY_DEVICES[deviceBId] || PHONY_DEVICES['x1'];

  const pickWinner = (valA: number, valB: number, higherIsBetter = true): 'A' | 'B' | 'TIE' => {
    if (valA === valB) return 'TIE';
    if (higherIsBetter) return valA > valB ? 'A' : 'B';
    return valA < valB ? 'A' : 'B';
  };

  return {
    price: pickWinner(devA.price, devB.price, false), // lower price is friendlier
    displayNits: pickWinner(devA.displayNits, devB.displayNits, true),
    refreshRateMax: pickWinner(devA.refreshRateMax, devB.refreshRateMax, true),
    benchmarkScore: pickWinner(devA.benchmarkScore, devB.benchmarkScore, true),
    cpuGhz: pickWinner(devA.cpuGhz, devB.cpuGhz, true),
    mainCamMp: pickWinner(devA.mainCamMp, devB.mainCamMp, true),
    batteryMah: pickWinner(devA.batteryMah, devB.batteryMah, true),
    chargeWatts: pickWinner(devA.chargeWatts, devB.chargeWatts, true),
    weightGrams: pickWinner(devA.weightGrams, devB.weightGrams, false) // lighter is better
  };
}
