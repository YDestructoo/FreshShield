import { calculateMoldRisk, isFavorableForMoldGrowth, isValidEnvironmentReading } from './moldRisk';

const equal = (actual: unknown, expected: unknown, label = '') => {
  if (actual !== expected) throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
};
const risk = (temperatureC: number, humidity: number, exposureMinutes: number, sensitivity?: number) => calculateMoldRisk({ temperatureC, humidity, exposureMinutes, sensitivity });

equal(risk(25, 48, 0).level, 'low');
equal(risk(27, 82, 5).level, 'moderate');
equal(risk(27, 82, 240).level, 'high');
equal(risk(27, 91, 480).level, 'very_high');
equal(risk(25, 48, 10_000).score <= 20, true, 'dry-condition safeguard');
equal(risk(25, 70, 0).level, 'elevated');
equal(risk(25, 70, 0, 10).level, 'moderate', 'sensitivity is clamped and added to score');
equal(isFavorableForMoldGrowth(5, 70), false);
equal(isFavorableForMoldGrowth(25, 70), true);
equal(isFavorableForMoldGrowth(25, 69.9), false);
equal(isValidEnvironmentReading(-40, 0), true);
equal(isValidEnvironmentReading(80, 100), true);
equal(isValidEnvironmentReading(81, 70), false);
equal(isValidEnvironmentReading(25, Number.NaN), false);

console.log('mold-risk scenarios passed');
