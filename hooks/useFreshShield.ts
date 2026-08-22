import Constants from 'expo-constants';
import { createContext, createElement, type PropsWithChildren, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { POLL_INTERVAL_MS } from '../constants/config';
import { calculateMoldRisk, isFavorableForMoldGrowth, isValidEnvironmentReading, type MoldRisk } from '../services/moldRisk';
import { getPicoStatus, setPicoTarget } from '../services/pico';
import { DEFAULT_MOLD_SETTINGS, getMoldExposure, getMoldSettings, setMoldExposure, setStoredMoldSettings, type MoldSettings } from '../storage/moldSettings';
import { clearPicoIp, getPicoIp, setPicoIp } from '../storage/settings';
import type { PicoStatus } from '../types/freshshield';

const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';
const DEMO_INTERVAL_MS = 2_000;
const DEMO_STATUS: PicoStatus = { temperature: 3.8, humidity: 76.4, gasLevel: 142, targetTemperature: 4, isStockMode: false };
const getDemoStatus = (targetTemperature = DEMO_STATUS.targetTemperature): PicoStatus => ({ temperature: 3.8 + Math.sin(Date.now() / 3_000) * 0.35, humidity: 76.4 + Math.sin(Date.now() / 4_500) * 2.2, gasLevel: Math.round(142 + Math.sin(Date.now() / 2_500) * 12), targetTemperature, isStockMode: false });
const messageFor = (error: unknown) => error instanceof Error && error.name === 'AbortError' ? 'The Pico W request timed out.' : error instanceof Error && error.message ? error.message : 'Unable to reach the Pico W.';

async function sendMoldNotification(risk: MoldRisk) {
  if (Platform.OS === 'android' && Constants.appOwnership === 'expo') return;

  try {
    const Notifications = await import('expo-notifications');
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('mold-risk', { name: 'Mold risk', importance: Notifications.AndroidImportance.HIGH });
    const permissions = await Notifications.getPermissionsAsync();
    if (!permissions.granted && !(await Notifications.requestPermissionsAsync()).granted) return;
    await Notifications.scheduleNotificationAsync({ content: { title: risk.level === 'very_high' ? 'Very high mold risk' : 'High mold risk', body: risk.message, sound: 'default' }, trigger: Platform.OS === 'android' ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1, channelId: 'mold-risk' } : null });
  } catch {
    // Notifications are optional: Expo Go and unsupported devices still show the in-app warning.
  }
}

function useFreshShieldState() {
  const [ip, setIp] = useState<string | null>(DEMO_MODE ? 'Demo device' : null);
  const [status, setStatus] = useState<PicoStatus | null>(DEMO_MODE ? DEMO_STATUS : null);
  const [connected, setConnected] = useState(DEMO_MODE);
  const [connecting, setConnecting] = useState(false);
  const [updatingTarget, setUpdatingTarget] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(DEMO_MODE ? new Date() : null);
  const [moldSettings, setMoldSettingsState] = useState<MoldSettings>(DEFAULT_MOLD_SETTINGS);
  const [moldRisk, setMoldRisk] = useState<MoldRisk | null>(null);
  const [exposureMinutes, setExposureMinutes] = useState(0);
  const ipRef = useRef<string | null>(null);
  const demoTargetRef = useRef(DEMO_STATUS.targetTemperature);
  const exposureStartedAt = useRef<number | null>(null);
  const lastMoldNotification = useRef<MoldRisk['level'] | null>(null);

  const acceptStatus = useCallback((nextStatus: PicoStatus) => { setStatus(nextStatus); setConnected(true); setError(null); setLastUpdated(new Date()); }, []);

  useEffect(() => {
    void Promise.all([getMoldSettings(), getMoldExposure()]).then(([settings, exposure]) => { setMoldSettingsState(settings); exposureStartedAt.current = exposure.startedAt; });
  }, []);

  useEffect(() => {
    if (!status || !connected || !isValidEnvironmentReading(status.temperature, status.humidity)) { setMoldRisk(null); setExposureMinutes(0); return; }
    const now = Date.now();
    if (isFavorableForMoldGrowth(status.temperature, status.humidity)) {
      if (!exposureStartedAt.current) exposureStartedAt.current = now;
    } else exposureStartedAt.current = null;
    void setMoldExposure({ startedAt: exposureStartedAt.current, lastTemperature: status.temperature, lastHumidity: status.humidity });
    const minutes = exposureStartedAt.current ? (now - exposureStartedAt.current) / 60_000 : 0;
    setExposureMinutes(minutes);
    setMoldRisk(calculateMoldRisk({ temperatureC: status.temperature, humidity: status.humidity, exposureMinutes: minutes, sensitivity: moldSettings.sensitivity }));
  }, [status, connected, moldSettings.sensitivity]);

  useEffect(() => {
    if (!moldRisk || !moldSettings.enabled || !moldSettings.notificationsEnabled || !['high', 'very_high'].includes(moldRisk.level) || lastMoldNotification.current === moldRisk.level) return;
    lastMoldNotification.current = moldRisk.level;
    void sendMoldNotification(moldRisk);
  }, [moldRisk, moldSettings.enabled, moldSettings.notificationsEnabled]);

  const refresh = useCallback(async () => {
    if (DEMO_MODE) { acceptStatus(getDemoStatus(demoTargetRef.current)); return true; }
    if (!ipRef.current) return false;
    try { acceptStatus(await getPicoStatus(ipRef.current)); return true; } catch (cause) { setConnected(false); setError(messageFor(cause)); return false; }
  }, [acceptStatus]);

  useEffect(() => {
    if (DEMO_MODE) { ipRef.current = 'Demo device'; acceptStatus(DEMO_STATUS); return; }
    void getPicoIp().then((savedIp) => { ipRef.current = savedIp; setIp(savedIp); }).catch(() => setError('Could not load the saved Pico W IP address.'));
  }, [acceptStatus]);
  useEffect(() => { if (!ip) return; void refresh(); const interval = setInterval(() => void refresh(), DEMO_MODE ? DEMO_INTERVAL_MS : POLL_INTERVAL_MS); return () => clearInterval(interval); }, [ip, refresh]);

  const connect = useCallback(async (nextIp: string) => {
    if (DEMO_MODE) { acceptStatus(getDemoStatus(demoTargetRef.current)); return true; }
    const value = nextIp.trim();
    if (!value) { setError('Enter the Pico W IP address.'); return false; }
    setConnecting(true); setError(null);
    try { const nextStatus = await getPicoStatus(value); ipRef.current = value; acceptStatus(nextStatus); setIp(value); await setPicoIp(value); return true; } catch (cause) { setConnected(false); setError(messageFor(cause)); return false; } finally { setConnecting(false); }
  }, [acceptStatus]);
  const disconnect = useCallback(async () => {
    ipRef.current = null;
    setIp(null); setStatus(null); setConnected(false); setLastUpdated(null); setError(null);
    try { await clearPicoIp(); } catch { setError('Could not clear the saved Pico W IP address.'); }
  }, []);
  const changeTargetTemperature = useCallback(async (targetTemperature: number) => {
    if (DEMO_MODE) { demoTargetRef.current = targetTemperature; acceptStatus(getDemoStatus(targetTemperature)); return true; }
    if (!ipRef.current || !connected) return false;
    setUpdatingTarget(true);
    try { acceptStatus(await setPicoTarget(ipRef.current, targetTemperature)); return true; } catch (cause) { setError(messageFor(cause)); return false; } finally { setUpdatingTarget(false); }
  }, [acceptStatus, connected]);
  const updateMoldSettings = useCallback((next: Partial<MoldSettings>) => setMoldSettingsState((current) => { const value = { ...current, ...next, sensitivity: Math.min(10, Math.max(-10, Math.round(next.sensitivity ?? current.sensitivity))), warningHumidityThreshold: Math.min(80, Math.max(60, Math.round(next.warningHumidityThreshold ?? current.warningHumidityThreshold))) }; void setStoredMoldSettings(value); return value; }), []);
  const moldWarning = !!moldRisk && moldSettings.enabled && moldSettings.notificationsEnabled && (moldRisk.level === 'high' || moldRisk.level === 'very_high' || (status?.humidity ?? 0) >= moldSettings.warningHumidityThreshold);
  return { ip, status, connected, connecting, updatingTarget, error, lastUpdated, connect, disconnect, refresh, changeTargetTemperature, moldSettings, updateMoldSettings, moldRisk, exposureMinutes, moldWarning };
}
const FreshShieldContext = createContext<ReturnType<typeof useFreshShieldState> | null>(null);
export function FreshShieldProvider({ children }: PropsWithChildren) { return createElement(FreshShieldContext.Provider, { value: useFreshShieldState() }, children); }
export function useFreshShield() { const state = useContext(FreshShieldContext); if (!state) throw new Error('useFreshShield must be used inside FreshShieldProvider.'); return state; }
