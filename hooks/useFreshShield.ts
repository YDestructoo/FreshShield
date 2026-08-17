import { useCallback, useEffect, useRef, useState } from 'react';

import { POLL_INTERVAL_MS } from '../constants/config';
import { getPicoStatus, setPicoTarget } from '../services/pico';
import { getPicoIp, setPicoIp } from '../storage/settings';
import type { PicoStatus } from '../types/freshshield';

const messageFor = (error: unknown) =>
  error instanceof Error && error.name === 'AbortError'
    ? 'The Pico W request timed out.'
    : error instanceof Error && error.message
      ? error.message
      : 'Unable to reach the Pico W.';

export function useFreshShield() {
  const [ip, setIp] = useState<string | null>(null);
  const [status, setStatus] = useState<PicoStatus | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [updatingTarget, setUpdatingTarget] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const ipRef = useRef<string | null>(null);

  const acceptStatus = useCallback((nextStatus: PicoStatus) => {
    setStatus(nextStatus);
    setConnected(true);
    setError(null);
    setLastUpdated(new Date());
  }, []);

  const refresh = useCallback(async () => {
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
    void getPicoIp().then((savedIp) => {
      ipRef.current = savedIp;
      setIp(savedIp);
    }).catch(() => setError('Could not load the saved Pico W IP address.'));
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
      return false;
    }

    setConnecting(true);
    setError(null);
    try {
      const nextStatus = await getPicoStatus(value);
      ipRef.current = value;
      setIp(value);
      acceptStatus(nextStatus);
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
    if (!ipRef.current || !connected) return false;

    setUpdatingTarget(true);
    try {
      acceptStatus(await setPicoTarget(ipRef.current, targetTemperature));
      return true;
    } catch (cause) {
      setConnected(false);
      setError(messageFor(cause));
      return false;
    } finally {
      setUpdatingTarget(false);
    }
  }, [acceptStatus, connected]);

  return { ip, status, connected, connecting, updatingTarget, error, lastUpdated, connect, refresh, changeTargetTemperature };
}
