import { DISCOVERY_CONCURRENCY } from '../constants/config';
import { probePicoStatus } from './pico';
import type { PicoStatus } from '../types/freshshield';

export type DiscoveredPico = { ip: string; status: PicoStatus };

export function subnetCandidates(phoneIp: string) {
  const parts = phoneIp.split('.').map(Number);
  const [first, second, third, fourth] = parts;
  const privateIp = first === 10 || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255) || !privateIp) throw new Error('Wi-Fi discovery needs a private IPv4 connection.');

  return Array.from({ length: 254 }, (_, index) => index + 1)
    .filter((host) => host !== fourth)
    .map((host) => `${first}.${second}.${third}.${host}`);
}

export async function scanSubnet(ips: string[], onFound: (device: DiscoveredPico) => void, signal: AbortSignal) {
  let next = 0;
  const worker = async () => {
    while (!signal.aborted) {
      const ip = ips[next++];
      if (!ip) return;
      const status = await probePicoStatus(ip, signal);
      if (status && !signal.aborted) onFound({ ip, status });
    }
  };

  await Promise.all(Array.from({ length: Math.min(DISCOVERY_CONCURRENCY, ips.length) }, worker));
}
