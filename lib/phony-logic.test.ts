import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateBatteryEstimate, comparePhoneSpecs, PHONY_DEVICES } from './phony-logic.ts';

test('device specs dictionary contains all 3 tiers', () => {
  assert.ok(PHONY_DEVICES['x1-pro'], 'x1-pro exists');
  assert.ok(PHONY_DEVICES['x1'], 'x1 exists');
  assert.ok(PHONY_DEVICES['lite'], 'lite exists');
  assert.equal(PHONY_DEVICES['x1-pro'].price, 1199);
  assert.equal(PHONY_DEVICES['lite'].price, 599);
});

test('calculateBatteryEstimate outputs realistic hours and positive values', () => {
  const heavyUsage = calculateBatteryEstimate({
    gamingHours: 4,
    streamingHours: 4,
    brightnessPct: 90,
    network5G: true,
    refreshRate: 144,
    batteryCapacityMah: 5400
  });

  const lightUsage = calculateBatteryEstimate({
    gamingHours: 0.5,
    streamingHours: 2,
    brightnessPct: 40,
    network5G: false,
    refreshRate: 60,
    batteryCapacityMah: 5400
  });

  assert.ok(heavyUsage.estimatedRunTimeHours > 0, 'heavy usage run time > 0');
  assert.ok(lightUsage.estimatedRunTimeHours > heavyUsage.estimatedRunTimeHours, 'light usage lasts longer than heavy usage');
  assert.equal(heavyUsage.activeScreenOnHours, 8);
  assert.equal(lightUsage.activeScreenOnHours, 2.5);
});

test('comparePhoneSpecs correctly identifies winners between flagship and mid-tier', () => {
  const comparison = comparePhoneSpecs('x1-pro', 'lite');
  // Flagship beats lite in nits, camera, charging, battery
  assert.equal(comparison.displayNits, 'A');
  assert.equal(comparison.mainCamMp, 'A');
  assert.equal(comparison.chargeWatts, 'A');
  assert.equal(comparison.batteryMah, 'A');
  // Lite wins on price (cheaper) and weight (lighter)
  assert.equal(comparison.price, 'B');
  assert.equal(comparison.weightGrams, 'B');
});
