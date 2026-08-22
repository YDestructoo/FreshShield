import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

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

const riskName = (level: 'low' | 'elevated' | 'moderate' | 'high' | 'very_high') => level === 'very_high' ? 'Very High' : `${level[0].toUpperCase()}${level.slice(1)}`;
const duration = (minutes: number) => minutes < 60 ? `${Math.floor(minutes)} min` : `${Math.floor(minutes / 60)} h ${Math.floor(minutes % 60)} min`;

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
  const { ip, status, connected, error, lastUpdated, refresh, updatingTarget, changeTargetTemperature, moldRisk, exposureMinutes, moldSettings, updateMoldSettings, moldWarning } = useFreshShield();
  const [selectedTarget, setSelectedTarget] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [readings, setReadings] = useState<Reading[]>([]);
  const temperatureTimeline = useMemo(() => averageReadings(readings, 'temperature', 5 * 60_000, 12), [readings]);
  const chartData = temperatureTimeline.length ? temperatureTimeline : status ? [{ timestamp: Date.now(), value: status.temperature }] : [];
  const humidityTrend = useMemo(() => averageReadings(readings, 'humidity', 60_000, 12).map(({ value }) => value), [readings]);
  const humidityAverage = humidityTrend.at(-1) ?? status?.humidity ?? 0;
  const onRefresh = useCallback(async () => { setRefreshing(true); await refresh(); setRefreshing(false); }, [refresh]);

  useEffect(() => {
    if (status) setSelectedTarget(status.targetTemperature);
  }, [status?.targetTemperature]);

  useEffect(() => {
    if (!status) return;
    setReadings((values) => [...values.slice(-3_599), { timestamp: Date.now(), temperature: status.temperature, humidity: status.humidity }]);
  }, [status?.temperature, status?.humidity]);

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1" contentContainerClassName={status && connected ? 'gap-4 pb-4 pt-3' : 'flex-grow gap-4 pb-4 pt-3'} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor="#F0525E" colors={['#F0525E']} />}>
        <View className="flex-row items-center justify-between px-1">
          <View>
            <Text className="font-poppins text-xs text-[#657178]">FreshShield</Text>
          </View>
          <ConnectionStatus connected={connected} />
        </View>

        {error && <View className="flex-row gap-2 rounded-[20px] bg-[#F6DDD8] p-4"><Ionicons name="alert-circle-outline" size={19} color="#A64B40" /><Text className="font-poppins flex-1 text-sm text-[#7F3C34]">{error}</Text></View>}
        {connected && moldWarning && moldRisk && <Pressable onPress={() => setDetailsOpen(true)} className="flex-row gap-2 rounded-[20px] bg-[#F6DDD8] p-4"><Ionicons name="warning" size={19} color="#A64B40" /><View className="flex-1"><Text className="font-poppins text-sm font-semibold text-[#7F3C34]">{riskName(moldRisk.level)} mold risk</Text><Text className="font-poppins text-xs text-[#7F3C34]">{moldRisk.message}</Text></View></Pressable>}

        {status && connected ? (
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

            <View className="px-1 pt-1">
              <Text className="font-poppins text-base font-semibold text-[#161C1F]">Overview</Text>
            </View>

            <TemperatureControl
              applying={updatingTarget}
              disabled={!connected}
              onApply={() => void changeTargetTemperature(selectedTarget)}
              onChange={setSelectedTarget}
              value={selectedTarget}
            />

            {connected && <>
            <View className="rounded-[26px] bg-[#E7D9F3] p-5">
              <Text className="font-poppins text-base font-semibold text-[#2E2537]">Mold Monitoring</Text>
              <View className="mt-4 flex-row items-center justify-between"><Text className="font-poppins text-xs text-[#62546D]">Warning Threshold</Text><Text className="font-poppins text-lg font-semibold text-[#2E2537]">{moldSettings.warningHumidityThreshold}% RH</Text></View>
              <View className="mt-4 flex-row items-center gap-3">
                <Pressable accessibilityLabel="Lower mold warning threshold" onPress={() => updateMoldSettings({ warningHumidityThreshold: moldSettings.warningHumidityThreshold - 1 })} className="h-10 w-10 items-center justify-center rounded-full bg-white/80"><Ionicons name="remove" size={20} color="#4C3C59" /></Pressable>
                <View className="h-10 flex-1 flex-row items-center overflow-hidden rounded-full bg-white/70 px-2">{Array.from({ length: 21 }, (_, index) => { const value = 60 + index; const selected = value <= moldSettings.warningHumidityThreshold; return <Pressable key={value} accessibilityLabel={`Set warning threshold to ${value}%`} onPress={() => updateMoldSettings({ warningHumidityThreshold: value })} className="flex-1 items-center py-3"><View className={`h-2 w-2 rounded-full ${selected ? 'bg-[#665178]' : 'bg-[#D2C2DF]'}`} /></Pressable>; })}</View>
                <Pressable accessibilityLabel="Raise mold warning threshold" onPress={() => updateMoldSettings({ warningHumidityThreshold: moldSettings.warningHumidityThreshold + 1 })} className="h-10 w-10 items-center justify-center rounded-full bg-white/80"><Ionicons name="add" size={20} color="#4C3C59" /></Pressable>
              </View>
            </View>

            <Pressable onPress={() => setDetailsOpen(true)} className="rounded-[26px] bg-[#DDECCB] p-5">
              <View className="flex-row items-center justify-between"><Text className="font-poppins text-base font-semibold text-[#182015]">Mold Risk</Text><Ionicons name="shield-checkmark-outline" size={20} color="#536B49" /></View>
              {moldRisk && status ? <>
                <View className="mt-3 flex-row items-end justify-between"><Text className="font-poppins text-3xl font-semibold text-[#182015]">{riskName(moldRisk.level)}</Text><Text className="font-poppins text-sm text-[#536B49]">{moldRisk.score} / 100</Text></View>
                <Text className="font-poppins mt-2 text-xs text-[#536B49]">Humidity {status.humidity.toFixed(1)}% · Temperature {status.temperature.toFixed(1)}°C · Exposure {duration(exposureMinutes)}</Text>
                <Text className="font-poppins mt-2 text-xs leading-5 text-[#405037]">{moldRisk.message}</Text>
              </> : <><Text className="font-poppins mt-3 text-xl font-semibold text-[#182015]">Unavailable</Text><Text className="font-poppins mt-1 text-xs text-[#536B49]">Waiting for valid environmental sensor data.</Text></>}
            </Pressable>
            </>}

            <View className="flex-row gap-3">
              <View className="flex-1">
                <SensorCard label="Humidity · 1 min avg" value={humidityAverage.toFixed(1)} unit="%" color="lilac" tall trend={humidityTrend} icon={<Ionicons name="water" size={16} color="#665178" />} />
              </View>
              <View className="flex-1 gap-3">
                <SensorCard label="Air quality" value={String(status.gasLevel)} unit="raw" color="green" icon={<Ionicons name="leaf" size={16} color="#4E6B42" />} />
                <SensorCard label="Current target" value={status.targetTemperature.toFixed(1)} unit="°C" color="peach" icon={<Ionicons name="thermometer" size={16} color="#86574C" />} />
              </View>
            </View>

            <TemperatureChart data={chartData} />
          </>
        ) : (
          <View className="flex-1 items-center justify-center gap-3 px-8">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-[#CEDFF0]"><Ionicons name="radio-outline" size={24} color="#536970" /></View>
            <Text className="font-poppins text-xl font-semibold text-[#161C1F]">Waiting for a signal</Text>
            <Text className="font-poppins text-center text-sm leading-5 text-[#526168]">Add your Pico W address in settings to see live readings.</Text>
          </View>
        )}

      </ScrollView>
      <Modal animationType="slide" transparent visible={detailsOpen} onRequestClose={() => setDetailsOpen(false)}>
        <Pressable className="flex-1 justify-end bg-black/30" onPress={() => setDetailsOpen(false)}><Pressable onPress={() => undefined} className="rounded-t-[30px] bg-[#F3F7F8] p-6">
          <View className="flex-row items-center justify-between"><Text className="font-poppins text-xl font-semibold text-[#161C1F]">Mold Risk Details</Text><Ionicons name="close" size={22} color="#526168" /></View>
          {moldRisk && status ? <View className="mt-5 gap-3"><Text className="font-poppins text-2xl font-semibold text-[#182015]">{riskName(moldRisk.level)} · {moldRisk.score}/100</Text><Text className="font-poppins text-sm text-[#526168]">Humidity {status.humidity.toFixed(1)}% RH · Warning threshold {moldSettings.warningHumidityThreshold}% RH</Text><Text className="font-poppins text-sm text-[#526168]">Temperature {status.temperature.toFixed(1)}°C · Exposure {duration(exposureMinutes)}</Text><Text className="font-poppins text-sm leading-6 text-[#364248]">{moldRisk.message}</Text><View className="rounded-[18px] bg-[#E7D9F3] p-4"><Text className="font-poppins text-xs font-semibold text-[#2E2537]">Why this is elevated</Text><Text className="font-poppins mt-1 text-xs leading-5 text-[#4C3C59]">{moldRisk.humidityScore >= 30 ? 'Humidity is contributing to risk. ' : ''}{moldRisk.temperatureScore >= 50 ? 'Current temperature supports growth. ' : ''}{moldRisk.exposureScore > 5 ? 'Moisture has persisted over time.' : 'Exposure duration is still short.'}</Text></View></View> : <Text className="font-poppins mt-5 text-sm text-[#526168]">Unavailable — waiting for valid environmental sensor data.</Text>}
        </Pressable></Pressable>
      </Modal>
    </ScreenContainer>
  );
}
