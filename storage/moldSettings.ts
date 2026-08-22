import AsyncStorage from '@react-native-async-storage/async-storage';

export type MoldSettings = { enabled: boolean; sensitivity: number; warningHumidityThreshold: number; notificationsEnabled: boolean };
export type MoldExposure = { startedAt: number | null; lastTemperature: number | null; lastHumidity: number | null };

const SETTINGS_KEY = 'freshshield.mold-settings';
const EXPOSURE_KEY = 'freshshield.mold-exposure';
export const DEFAULT_MOLD_SETTINGS: MoldSettings = { enabled: true, sensitivity: 0, warningHumidityThreshold: 70, notificationsEnabled: true };
const threshold = (value: number) => Math.min(80, Math.max(60, Math.round(value)));
const sensitivity = (value: number) => Math.min(10, Math.max(-10, Math.round(value)));

export async function getMoldSettings(): Promise<MoldSettings> {
  const value = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!value) return DEFAULT_MOLD_SETTINGS;
  try {
    const saved = JSON.parse(value) as Partial<MoldSettings>;
    return { enabled: saved.enabled ?? true, sensitivity: sensitivity(saved.sensitivity ?? 0), warningHumidityThreshold: threshold(saved.warningHumidityThreshold ?? 70), notificationsEnabled: saved.notificationsEnabled ?? true };
  } catch { return DEFAULT_MOLD_SETTINGS; }
}

export const setStoredMoldSettings = (settings: MoldSettings) => AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...settings, sensitivity: sensitivity(settings.sensitivity), warningHumidityThreshold: threshold(settings.warningHumidityThreshold) }));

export async function getMoldExposure(): Promise<MoldExposure> {
  try {
    const value = await AsyncStorage.getItem(EXPOSURE_KEY);
    const saved = value ? JSON.parse(value) as Partial<MoldExposure> : null;
    return { startedAt: typeof saved?.startedAt === 'number' ? saved.startedAt : null, lastTemperature: typeof saved?.lastTemperature === 'number' ? saved.lastTemperature : null, lastHumidity: typeof saved?.lastHumidity === 'number' ? saved.lastHumidity : null };
  } catch { return { startedAt: null, lastTemperature: null, lastHumidity: null }; }
}

export const setMoldExposure = (exposure: MoldExposure) => AsyncStorage.setItem(EXPOSURE_KEY, JSON.stringify(exposure));
