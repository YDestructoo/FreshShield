import { REQUEST_TIMEOUT_MS } from '../constants/config';
import type { PicoStatus } from '../types/freshshield';

function picoUrl(ip: string) {
  const value = ip.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (!value || value.includes('/')) throw new Error('Enter a valid Pico W IP address.');

  const url = new URL(`http://${value}`);
  if (!url.hostname) throw new Error('Enter a valid Pico W IP address.');
  return url.origin;
}

function statusFromResponse(value: unknown): PicoStatus {
  if (!value || typeof value !== 'object') throw new Error('The Pico returned an invalid response.');
  const data = value as Record<string, unknown>;
  const fields = ['temperature', 'humidity', 'gas_level_raw', 'target_temp'];
  if (fields.some((field) => typeof data[field] !== 'number') || typeof data.is_stock_mode !== 'boolean') {
    throw new Error('The Pico returned an invalid response.');
  }

  return {
    temperature: data.temperature as number,
    humidity: data.humidity as number,
    gasLevel: data.gas_level_raw as number,
    targetTemperature: data.target_temp as number,
    isStockMode: data.is_stock_mode as boolean,
  };
}

async function request(ip: string, path: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${picoUrl(ip)}${path}`, { ...init, signal: controller.signal });
    if (!response.ok) throw new Error(`Pico request failed (${response.status}).`);
    return statusFromResponse(await response.json());
  } finally {
    clearTimeout(timeout);
  }
}

export const getPicoStatus = (ip: string) => request(ip, '/');

export const setPicoTarget = (ip: string, targetTemperature: number) => {
  if (!Number.isFinite(targetTemperature)) throw new Error('Enter a valid target temperature.');
  return request(ip, '/set_target', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target_temp: targetTemperature }),
  });
};
