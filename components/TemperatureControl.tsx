import { Pressable, Text, View } from 'react-native';

type TemperatureControlProps = { value: number; onChange: (value: number) => void };

export function TemperatureControl({ value, onChange }: TemperatureControlProps) {
  return (
    <View className="flex-row items-center justify-between rounded-2xl bg-slate-900 p-4">
      <Text className="text-base text-white">Target temperature</Text>
      <View className="flex-row items-center gap-4">
        <Pressable onPress={() => onChange(value - 1)}><Text className="text-xl text-cyan-400">−</Text></Pressable>
        <Text className="text-xl font-semibold text-white">{value}°C</Text>
        <Pressable onPress={() => onChange(value + 1)}><Text className="text-xl text-cyan-400">+</Text></Pressable>
      </View>
    </View>
  );
}
