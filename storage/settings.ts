import AsyncStorage from '@react-native-async-storage/async-storage';

const PICO_IP_KEY = 'freshshield.picoIp';

export const getPicoIp = () => AsyncStorage.getItem(PICO_IP_KEY);

export const setPicoIp = (ip: string) => AsyncStorage.setItem(PICO_IP_KEY, ip.trim());

export const clearPicoIp = () => AsyncStorage.removeItem(PICO_IP_KEY);
