import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { ConnectionStatus } from '../components/ConnectionStatus';
import { ScreenContainer } from '../components/ScreenContainer';
import { SensorCard } from '../components/SensorCard';
import { TemperatureControl } from '../components/TemperatureControl';
import { useFreshShield } from '../hooks/useFreshShield';

export default function DashboardScreen() {
  const { ip, status, connected, error, lastUpdated, updatingTarget, changeTargetTemperature } = useFreshShield();
  const [targetTemperature, setTargetTemperature] = useState(0);

  useEffect(() => {
    if (status) setTargetTemperature(status.targetTemperature);
  }, [status]);

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" contentContainerClassName="gap-5 py-6">
        <View className="flex-row items-center justify-between">
          <ConnectionStatus connected={connected} />
          <Link href="/settings" className="text-sm text-cyan-400">Settings</Link>
        </View>
        <View>
          <Text className="text-2xl font-bold text-white">Dashboard</Text>
          <Text className="mt-1 text-sm text-slate-400">{ip ?? 'No Pico W configured'}</Text>
        </View>
        {error && <Text className="rounded-xl bg-rose-950 px-4 py-3 text-sm text-rose-300">{error}</Text>}
        {status ? (
          <>
            <View className="flex-row gap-3">
              <View className="flex-1"><SensorCard label="Temperature" value={`${status.temperature.toFixed(1)}°C`} icon="🌡" /></View>
              <View className="flex-1"><SensorCard label="Humidity" value={`${status.humidity.toFixed(1)}%`} icon="💧" /></View>
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1"><SensorCard label="gas_level_raw" value={String(status.gasLevel)} icon="◌" /></View>
              <View className="flex-1"><SensorCard label="Mode" value={status.isStockMode ? 'STOCK' : 'APP'} icon="◉" /></View>
            </View>
            <SensorCard label="Current target" value={`${status.targetTemperature.toFixed(1)}°C`} />
            <TemperatureControl
              applying={updatingTarget}
              disabled={!connected}
              onApply={() => void changeTargetTemperature(targetTemperature)}
              onChange={setTargetTemperature}
              value={targetTemperature}
            />
            {lastUpdated && <Text className="text-center text-xs text-slate-500">Updated {lastUpdated.toLocaleTimeString()}</Text>}
          </>
        ) : (
          <View className="gap-3 rounded-2xl bg-slate-900 p-5">
            <Text className="text-lg font-semibold text-white">Waiting for the Pico W</Text>
            <Text className="text-sm text-slate-400">Connect on the same Wi-Fi network to view live sensor readings.</Text>
            <Link href="/" className="text-cyan-400">Go to Connect</Link>
          </View>
        )}
        <Link href="/history" className="text-center text-sm text-cyan-400">History</Link>
      </ScrollView>
    </ScreenContainer>
  );
}
