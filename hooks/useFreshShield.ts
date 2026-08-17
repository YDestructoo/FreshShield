import { createContext, createElement, type PropsWithChildren, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { POLL_INTERVAL_MS } from '../constants/config';
import { getPicoStatus, setPicoTarget } from '../services/pico';
import { getPicoIp, setPicoIp } from '../storage/settings';
import type { PicoStatus } from '../types/freshshield';

const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';
const DEMO_INTERVAL_MS = 2_000;
const DEMO_STATUS: PicoStatus = { temperature: 3.8, humidity: 76.4, gasLevel: 142, targetTemperature: 4, isStockMode: false };

const getDemoStatus = (targetTemperature = DEMO_STATUS.targetTemperature): PicoStatus => {
  const seconds = Date.now() / 1_000;
  return {
    temperature: 3.8 + Math.sin(seconds / 3) * 0.35,
    humidity: 76.4 + Math.sin(seconds / 4.5) * 2.2,
    gasLevel: Math.round(142 + Math.sin(seconds / 2.5) * 12),
    targetTemperature,
    isStockMode: false,
  };
};

const messageFor = (error: unknown) =>
  error instanceof Error && error.name === 'AbortError'
    ? 'The Pico W request timed out.'
    : error instanceof Error && error.message
      ? error.message
      : 'Unable to reach the Pico W.';

function useFreshShieldState() {
  const [ip, setIp] = useState<string | null>(DEMO_MODE ? 'Demo device' : null);
  const [status, setStatus] = useState<PicoStatus | null>(DEMO_MODE ? DEMO_STATUS : null);
  const [connected, setConnected] = useState(DEMO_MODE);
  const [connecting, setConnecting] = useState(false);
  const [updatingTarget, setUpdatingTarget] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(DEMO_MODE ? new Date() : null);
  const ipRef = useRef<string | null>(null);
  const demoTargetRef = useRef(DEMO_STATUS.targetTemperature);

  const acceptStatus = useCallback((nextStatus: PicoStatus) => {
    setStatus(nextStatus);
    setConnected(true);
    setError(null);
    setLastUpdated(new Date());
  }, []);

  const refresh = useCallback(async () => {
    if (DEMO_MODE) {
      acceptStatus(getDemoStatus(demoTargetRef.current));
      return true;
    }
    if (!ipRef.current) return false;
    try {
      acceptStatus(await getPicoStatus(ipRef.current));
      return true;
    } catch (cause) {
      setConnected(false);
      setError(messageFor(cause));
      return false;
    }
  }, [acceptStatus]);

  useEffect(() => {
    if (DEMO_MODE) {
      ipRef.current = 'Demo device';
      acceptStatus(DEMO_STATUS);
      return;
    }
    void getPicoIp().then((savedIp) => {
      ipRef.current = savedIp;
      setIp(savedIp);
    }).catch(() => setError('Could not load the saved Pico W IP address.'));
  }, [acceptStatus]);

  useEffect(() => {
    if (!ip) return;
    void refresh();
    const interval = setInterval(() => void refresh(), DEMO_MODE ? DEMO_INTERVAL_MS : POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [ip, refresh]);

  const connect = useCallback(async (nextIp: string) => {
    if (DEMO_MODE) {
      acceptStatus(getDemoStatus(demoTargetRef.current));
      return true;
    }
    const value = nextIp.trim();
    if (!value) {
      setError('Enter the Pico W IP address.');
      return false;
    }

    setConnecting(true);
    setError(null);
    try {
      const nextStatus = await getPicoStatus(value);
      ipRef.current = value;
      acceptStatus(nextStatus);
      setIp(value);
      await setPicoIp(value);
      return true;
    } catch (cause) {
      setConnected(false);
      setError(messageFor(cause));
      return false;
    } finally {
      setConnecting(false);
    }
  }, [acceptStatus]);

  const changeTargetTemperature = useCallback(async (targetTemperature: number) => {
    if (DEMO_MODE) {
      demoTargetRef.current = targetTemperature;
      acceptStatus(getDemoStatus(targetTemperature));
      return true;
    }
    if (!ipRef.current || !connected) return false;

    setUpdatingTarget(true);
    try {
      acceptStatus(await setPicoTarget(ipRef.current, targetTemperature));
      return true;
    } catch (cause) {
      setError(messageFor(cause));
      return false;
    } finally {
      setUpdatingTarget(false);
    }
  }, [acceptStatus, connected]);

  return { ip, status, connected, connecting, updatingTarget, error, lastUpdated, connect, refresh, changeTargetTemperature };
}

const FreshShieldContext = createContext<ReturnType<typeof useFreshShieldState> | null>(null);

export function FreshShieldProvider({ children }: PropsWithChildren) {
  return createElement(FreshShieldContext.Provider, { value: useFreshShieldState() }, children);
}

export function useFreshShield() {
  const state = useContext(FreshShieldContext);
  if (!state) throw new Error('useFreshShield must be used inside FreshShieldProvider.');
  return state;
}
