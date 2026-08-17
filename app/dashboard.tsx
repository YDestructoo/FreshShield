import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { ConnectionStatus } from '../components/ConnectionStatus';
import { ScreenContainer } from '../components/ScreenContainer';
import { SensorCard } from '../components/SensorCard';
import { TemperatureChart } from '../components/TemperatureChart';
import { TemperatureControl } from '../components/TemperatureControl';
import { useFreshShield } from '../hooks/useFreshShield';

type Reading = { timestamp: number; temperature: number; humidity: number };

function averageReadings(readings: Reading[], key: 'temperature' | 'humidity', bucketMs: number, limit: number) {
  const buckets = new Map<number, { total: number; count: number }>();
  for (const reading of readings) {
    const bucket = Math.floor(reading.timestamp / bucketMs) * bucketMs;
    const current = buckets.get(bucket) ?? { total: 0, count: 0 };
    buckets.set(bucket, { total: current.total + reading[key], count: current.count + 1 });
  }
  return [...buckets].slice(-limit).map(([timestamp, { total, count }]) => ({ timestamp, value: total / count }));
}

function Wave({ actual, target }: { actual: number; target: number }) {
  const difference = actual - target;
  const activeBars = Math.ceil(Math.min(Math.abs(difference) / 2, 1) * 10);
  const activeColor = difference > 0 ? '#F0525E' : '#526168';

  return (
    <View accessibilityLabel={`Temperature is ${difference.toFixed(1)} degrees from target`} className="items-end gap-1">
      <View className="flex-row items-end gap-1">
        {[10, 13, 16, 19, 22, 25, 28, 31, 34, 37].map((height, index) => (
          <View key={height} className="w-1 rounded-full" style={{ height, backgroundColor: index < activeBars ? activeColor : '#FFFFFF' }} />
        ))}
      </View>
      <Text className="font-poppins text-[10px] text-[#526168]">{Math.abs(difference).toFixed(1)}° from target</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const { ip, status, connected, error, lastUpdated, updatingTarget, changeTargetTemperature } = useFreshShield();
  const [targetTemperature, setTargetTemperature] = useState(0);
  const [readings, setReadings] = useState<Reading[]>([]);
  const temperatureTimeline = useMemo(() => averageReadings(readings, 'temperature', 15 * 60_000, 12), [readings]);
  const chartData = temperatureTimeline.length ? temperatureTimeline : status ? [{ timestamp: Date.now(), value: status.temperature }] : [];
  const humidityTrend = useMemo(() => averageReadings(readings, 'humidity', 5 * 60_000, 12).map(({ value }) => value), [readings]);
  const humidityAverage = humidityTrend.at(-1) ?? status?.humidity ?? 0;

  useEffect(() => {
    if (status) setTargetTemperature(status.targetTemperature);
  }, [status?.targetTemperature]);

  useEffect(() => {
    if (!status) return;
    setReadings((values) => [...values.slice(-3_599), { timestamp: Date.now(), temperature: status.temperature, humidity: status.humidity }]);
  }, [status?.temperature, status?.humidity]);

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1" contentContainerClassName="gap-4 pb-4 pt-3">
        <View className="flex-row items-center justify-between px-1">
          <View>
            <Text className="font-poppins text-xs text-[#657178]">FreshShield</Text>
            <Text className="font-poppins text-2xl font-semibold tracking-[-0.8px] text-[#111719]">Good morning</Text>
          </View>
          <ConnectionStatus connected={connected} />
        </View>

        {error && <View className="flex-row gap-2 rounded-[20px] bg-[#F6DDD8] p-4"><Ionicons name="alert-circle-outline" size={19} color="#A64B40" /><Text className="font-poppins flex-1 text-sm text-[#7F3C34]">{error}</Text></View>}

        {status ? (
          <>
            <View className="rounded-[26px] bg-[#CEDFF0] p-4">
              <View className="flex-row items-center justify-between">
                <View className="gap-1">
                  <Text className="font-poppins text-xs font-medium text-[#26353C]">Current temperature</Text>
                  <View className="mt-4 flex-row items-end gap-1">
                    <Text className="font-poppins text-5xl font-semibold tracking-[-2px] text-[#101517]">{status.temperature.toFixed(1)}°</Text>
                    <Text className="font-poppins mb-3 text-sm text-[#4C5960]">Celsius</Text>
                  </View>
                </View>
                <Wave actual={status.temperature} target={status.targetTemperature} />
              </View>
              <View className="mt-5 flex-row items-center justify-between border-t border-white/50 pt-3">
                <Text className="font-poppins text-xs text-[#526168]" numberOfLines={1}>{ip ?? 'No device configured'}</Text>
                <Text className="font-poppins text-xs text-[#526168]">{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Live reading'}</Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between px-1 pt-1">
              <Text className="font-poppins text-base font-semibold text-[#161C1F]">Overview</Text>
              <Text className="font-poppins text-xs text-[#657178]">Today</Text>
            </View>

            <TemperatureControl
              applying={updatingTarget}
              disabled={!connected}
              onApply={() => void changeTargetTemperature(targetTemperature)}
              onChange={setTargetTemperature}
              value={targetTemperature}
            />

            <View className="flex-row gap-3">
              <View className="flex-1">
                <SensorCard label="Humidity · 5 min avg" value={humidityAverage.toFixed(1)} unit="%" color="lilac" tall trend={humidityTrend} icon={<Ionicons name="water" size={16} color="#665178" />} />
              </View>
              <View className="flex-1 gap-3">
                <SensorCard label="Air quality" value={String(status.gasLevel)} unit="raw" color="green" icon={<Ionicons name="leaf" size={16} color="#4E6B42" />} />
                <SensorCard label="Current target" value={status.targetTemperature.toFixed(1)} unit="°C" color="peach" icon={<Ionicons name="thermometer" size={16} color="#86574C" />} />
              </View>
            </View>

            <TemperatureChart data={chartData} />
          </>
        ) : (
          <View className="items-center gap-3 rounded-[26px] bg-[#CEDFF0] p-8">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-white/70"><Ionicons name="radio-outline" size={24} color="#536970" /></View>
            <Text className="font-poppins text-xl font-semibold text-[#161C1F]">Waiting for a signal</Text>
            <Text className="font-poppins text-center text-sm leading-5 text-[#526168]">Add your Pico W address in settings to see live readings.</Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
