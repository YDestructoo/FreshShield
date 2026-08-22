export type MoldRiskLevel = 'low' | 'elevated' | 'moderate' | 'high' | 'very_high';

export type MoldRiskInput = {
  temperatureC: number;
  humidity: number;
  exposureMinutes: number;
  sensitivity?: number;
};

export type MoldRisk = {
  score: number;
  level: MoldRiskLevel;
  message: string;
  humidityScore: number;
  temperatureScore: number;
  exposureScore: number;
  favorableForGrowth: boolean;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const interpolate = (value: number, min: number, max: number, outputMin: number, outputMax: number) => outputMin + clamp((value - min) / (max - min), 0, 1) * (outputMax - outputMin);

export const isValidEnvironmentReading = (temperatureC: number, humidity: number) => Number.isFinite(temperatureC) && Number.isFinite(humidity) && temperatureC >= -40 && temperatureC <= 80 && humidity >= 0 && humidity <= 100;
export const isFavorableForMoldGrowth = (temperatureC: number, humidity: number) => humidity >= 70 && temperatureC > 5 && temperatureC < 40;

export function calculateMoldRisk({ temperatureC, humidity, exposureMinutes, sensitivity = 0 }: MoldRiskInput): MoldRisk {
  const rh = clamp(humidity, 0, 100);
  const minutes = Math.max(0, exposureMinutes);
  const humidityScore = rh < 50 ? 0 : rh < 55 ? interpolate(rh, 50, 55, 0, 5) : rh < 60 ? interpolate(rh, 55, 60, 5, 15) : rh < 65 ? interpolate(rh, 60, 65, 15, 30) : rh < 70 ? interpolate(rh, 65, 70, 30, 45) : rh < 75 ? interpolate(rh, 70, 75, 45, 60) : rh < 80 ? interpolate(rh, 75, 80, 60, 75) : rh < 85 ? interpolate(rh, 80, 85, 75, 88) : rh < 90 ? interpolate(rh, 85, 90, 88, 95) : interpolate(rh, 90, 100, 95, 100);
  const temperatureScore = temperatureC <= 4 ? 0 : temperatureC < 10 ? interpolate(temperatureC, 4, 10, 0, 25) : temperatureC < 15 ? interpolate(temperatureC, 10, 15, 25, 50) : temperatureC < 20 ? interpolate(temperatureC, 15, 20, 50, 80) : temperatureC <= 30 ? 100 : temperatureC <= 35 ? interpolate(temperatureC, 30, 35, 100, 70) : temperatureC <= 40 ? interpolate(temperatureC, 35, 40, 70, 20) : 0;
  const exposureScore = minutes < 15 ? interpolate(minutes, 0, 15, 0, 5) : minutes < 60 ? interpolate(minutes, 15, 60, 5, 15) : minutes < 180 ? interpolate(minutes, 60, 180, 15, 30) : minutes < 360 ? interpolate(minutes, 180, 360, 30, 45) : minutes < 720 ? interpolate(minutes, 360, 720, 45, 60) : minutes < 1440 ? interpolate(minutes, 720, 1440, 60, 75) : minutes < 2880 ? interpolate(minutes, 1440, 2880, 75, 90) : 100;
  let score = humidityScore * 0.6 + temperatureScore * 0.15 + exposureScore * 0.25;
  if (rh < 55) score = Math.min(score, 20);
  if (rh < 60) score = Math.min(score, 30);
  if (rh >= 80 && minutes >= 60) score = Math.max(score, 65);
  if (rh >= 85 && minutes >= 180) score = Math.max(score, 80);
  if (rh >= 90 && minutes >= 360) score = Math.max(score, 90);
  score = Math.round(clamp(score + clamp(sensitivity, -10, 10), 0, 100));
  const level: MoldRiskLevel = score < 25 ? 'low' : score < 45 ? 'elevated' : score < 65 ? 'moderate' : score < 80 ? 'high' : 'very_high';
  const message = level === 'low' ? 'Conditions are currently unfavorable for mold growth.' : level === 'elevated' ? 'Humidity is becoming favorable for mold growth. Monitor conditions.' : level === 'moderate' ? 'Persistent moisture may support mold growth. Consider reducing humidity.' : level === 'high' ? 'Conditions are strongly favorable for mold growth. Reduce moisture and inspect damp areas.' : 'Prolonged damp conditions indicate a very high mold-growth risk.';
  return { score, level, message, humidityScore: Math.round(humidityScore), temperatureScore: Math.round(temperatureScore), exposureScore: Math.round(exposureScore), favorableForGrowth: isFavorableForMoldGrowth(temperatureC, rh) };
}
