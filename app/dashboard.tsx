import { Ionicons } from '@expo/vector-icons';
import { useMinimizeOnScroll } from 'expo-glass-tabs';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { ConnectionStatus } from '../components/ConnectionStatus';
import { ScreenContainer } from '../components/ScreenContainer';
import { SensorCard } from '../components/SensorCard';
import { TemperatureChart } from '../components/TemperatureChart';
import { TemperatureControl } from '../components/TemperatureControl';
import { useFreshShield } from '../hooks/useFreshShield';

const Wave = () => (
  <View className="flex-row items-center gap-1.5">
    {[22, 36, 28, 48, 34, 25, 41, 18, 32, 24].map((height, index) => (
      <View key={index} style={{ height }} className={`w-1 rounded-full ${index === 0 || index === 7 ? 'bg-[#F0525E]' : index % 3 === 0 ? 'bg-white' : 'bg-[#66737B]'}`} />
    ))}
  </View>
);

export default function DashboardScreen() {
  const { ip, status, connected, error, lastUpdated, updatingTarget, changeTargetTemperature } = useFreshShield();
  const [targetTemperature, setTargetTemperature] = useState(0);
  const onScroll = useMinimizeOnScroll();

  useEffect(() => {
    if (status) setTargetTemperature(status.targetTemperature);
  }, [status]);

  return (
    <ScreenContainer>
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} className="flex-1" contentContainerClassName="gap-4 pb-4 pt-3">
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
                    <Text className="font-poppins mb-1.5 text-sm text-[#4C5960]">Celsius</Text>
                  </View>
                </View>
                <Wave />
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
                <SensorCard label="Humidity" value={status.humidity.toFixed(1)} unit="%" color="lilac" tall trend={[72, 74, 73, 76, 75, 77, status.humidity]} icon={<Ionicons name="water" size={16} color="#665178" />} />
              </View>
              <View className="flex-1 gap-3">
                <SensorCard label="Air quality" value={String(status.gasLevel)} unit="raw" color="green" icon={<Ionicons name="leaf" size={16} color="#4E6B42" />} />
                <SensorCard label="Control mode" value={status.isStockMode ? 'Stock' : 'App'} color="peach" icon={<Ionicons name="options" size={16} color="#86574C" />} />
              </View>
            </View>

            <TemperatureChart currentTemperature={status.temperature} />
          </>
        ) : (
          <View className="items-center gap-3 rounded-[26px] bg-[#CEDFF0] p-8">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-white/70"><Ionicons name="radio-outline" size={24} color="#536970" /></View>
            <Text className="font-poppins text-xl font-semibold text-[#161C1F]">Waiting for a signal</Text>
            <Text className="font-poppins text-center text-sm leading-5 text-[#526168]">Add your Pico W address in settings to see live readings.</Text>
          </View>
        )}
      </Animated.ScrollView>
    </ScreenContainer>
  );
}
