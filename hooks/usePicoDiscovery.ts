import * as Network from 'expo-network';
import { useCallback, useEffect, useRef, useState } from 'react';

import { scanSubnet, subnetCandidates, type DiscoveredPico } from '../services/discovery';
import { probePicoStatus } from '../services/pico';
import { getPicoIp } from '../storage/settings';

export function usePicoDiscovery() {
  const [devices, setDevices] = useState<DiscoveredPico[]>([]);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);

  const cancel = useCallback(() => controller.current?.abort(), []);
  const scan = useCallback(async () => {
    cancel();
    const current = new AbortController();
    controller.current = current;
    setDevices([]); setError(null); setScanning(true);
    const found = new Set<string>();
    const add = (device: DiscoveredPico) => {
      if (found.has(device.ip)) return;
      found.add(device.ip);
      setDevices((devices) => [...devices, device]);
    };

    try {
      const savedIp = await getPicoIp().catch(() => null);
      if (savedIp) {
        const status = await probePicoStatus(savedIp, current.signal);
        if (status && !current.signal.aborted) add({ ip: savedIp, status });
      }
      if (current.signal.aborted) return;

      const phoneIp = await Network.getIpAddressAsync();
      const ips = subnetCandidates(phoneIp).filter((ip) => ip !== savedIp);
      await scanSubnet(ips, add, current.signal);
    } catch (cause) {
      if (!current.signal.aborted) setError(cause instanceof Error ? cause.message : 'Could not scan this network.');
    } finally {
      if (controller.current === current) setScanning(false);
    }
  }, [cancel]);

  useEffect(() => cancel, [cancel]);
  return { devices, scanning, error, scan };
}
