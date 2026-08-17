import { Pressable, Text, View } from 'react-native';

type TemperatureControlProps = {
  value: number;
  onChange: (value: number) => void;
  onApply: () => void;
  disabled?: boolean;
  applying?: boolean;
};

export function TemperatureControl({ value, onChange, onApply, disabled = false, applying = false }: TemperatureControlProps) {
  const changeBy = (amount: number) => onChange(Math.round((value + amount) * 10) / 10);

  return (
    <View className="gap-4 rounded-2xl bg-slate-900 p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-base text-white">Target temperature</Text>
        <View className="flex-row items-center gap-5">
          <Pressable accessibilityLabel="Decrease target temperature" disabled={disabled} onPress={() => changeBy(-1)}><Text className="text-2xl text-cyan-400">−</Text></Pressable>
          <Text className="text-xl font-semibold text-white">{value.toFixed(1)}°C</Text>
          <Pressable accessibilityLabel="Increase target temperature" disabled={disabled} onPress={() => changeBy(1)}><Text className="text-2xl text-cyan-400">+</Text></Pressable>
        </View>
      </View>
      <Pressable disabled={disabled || applying} onPress={onApply} className="rounded-xl bg-cyan-400 px-4 py-3">
        <Text className="text-center font-semibold text-slate-950">{applying ? 'Setting target…' : 'Apply target'}</Text>
      </Pressable>
    </View>
  );
}
