import { useCallback, useEffect, useRef, useState } from 'react';

import { POLL_INTERVAL_MS } from '../constants/config';
import { getPicoStatus, setPicoTarget } from '../services/pico';
import { getPicoIp, setPicoIp } from '../storage/settings';
import type { PicoStatus } from '../types/freshshield';

export function useFreshShield() {
  const [ip, setIp] = useState<string | null>(null);
  const [status, setStatus] = useState<PicoStatus | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ipRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    if (!ipRef.current) return;
    try {
      setStatus(await getPicoStatus(ipRef.current));
      setConnected(true);
      setError(null);
    } catch {
      setConnected(false);
      setError('Unable to reach the Pico W.');
    }
  }, []);

  useEffect(() => {
    getPicoIp().then((savedIp) => {
      ipRef.current = savedIp;
      setIp(savedIp);
    });
  }, []);

  useEffect(() => {
    if (!ip) return;
    void refresh();
    const interval = setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [ip, refresh]);

  const connect = useCallback(async (nextIp: string) => {
    const value = nextIp.trim();
    if (!value) {
      setError('Enter the Pico W IP address.');
      return;
    }
    ipRef.current = value;
    setIp(value);
    await setPicoIp(value);
  }, []);

  const changeTargetTemperature = useCallback(async (targetTemperature: number) => {
    if (!ipRef.current) return;
    try {
      const nextStatus = await setPicoTarget(ipRef.current, targetTemperature);
      setStatus(nextStatus);
      setConnected(true);
      setError(null);
    } catch {
      setError('Could not update the target temperature.');
    }
  }, []);

  return { ip, status, connected, error, connect, refresh, changeTargetTemperature };
}
