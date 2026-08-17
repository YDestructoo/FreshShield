import { REQUEST_TIMEOUT_MS } from '../constants/config';
import type { PicoStatus } from '../types/freshshield';

const baseUrl = (ip: string) => `http://${ip.trim().replace(/^https?:\/\//, '').replace(/\/$/, '')}`;

async function request<T>(ip: string, path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl(ip)}${path}`, { ...init, signal: controller.signal });
    if (!response.ok) throw new Error(`Pico request failed (${response.status})`);
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export const getPicoStatus = (ip: string) => request<PicoStatus>(ip, '/');

export const setPicoTarget = (ip: string, targetTemperature: number) =>
  request<PicoStatus>(ip, '/set_target', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetTemperature }),
  });
