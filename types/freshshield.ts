export type DeviceMode = 'APP' | 'STOCK';

export type PicoStatus = {
  temperature: number;
  humidity: number;
  gas: number;
  targetTemperature: number;
  mode: DeviceMode;
};
