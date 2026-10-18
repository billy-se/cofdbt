import test from 'node:test';
import assert from 'node:assert';
import { 
  calculateInitialCaffeine, 
  calculateCaffeineDecay, 
  calculateFatigueDebtIndex 
} from './caffeineMath';

test('calculateInitialCaffeine handles standard and concentrated brews', () => {
  const standard = calculateInitialCaffeine(1.0, 100);
  assert.strictEqual(standard, 75.0);

  const concentrated = calculateInitialCaffeine(1.0, 20.0);
  assert.strictEqual(concentrated, 86.25);
});

test('calculateCaffeineDecay computes exponential half-life correctly', () => {
  const initialDose = 100.0;
  const halfLife = 5.0;

  const atZeroHours = calculateCaffeineDecay(initialDose, 0, halfLife);
  assert.strictEqual(atZeroHours, 100.0);

  const atOneHalfLife = calculateCaffeineDecay(initialDose, 5.0, halfLife);
  assert.strictEqual(atOneHalfLife, 50.0);

  const atTwoHalfLives = calculateCaffeineDecay(initialDose, 10.0, halfLife);
  assert.strictEqual(atTwoHalfLives, 25.0);
});

test('calculateFatigueDebtIndex returns valid risk score and tier', () => {
  const mockLogs = [
    { estimated_caffeine_mg: 150.0, timestamp: new Date().toISOString() },
    { estimated_caffeine_mg: 150.0, timestamp: new Date().toISOString() }
  ];

  const mockCheckins = [
    { sleep_hours: 4.5, fatigue_score: 5, check_in_date: '2026-10-17' },
    { sleep_hours: 5.0, fatigue_score: 4, check_in_date: '2026-10-16' }
  ];

  const result = calculateFatigueDebtIndex(mockLogs, mockCheckins);

  assert.ok(typeof result.fdiScore === 'number');
  assert.ok(['LOW', 'MODERATE', 'HIGH', 'CRITICAL'].includes(result.riskTier));
});