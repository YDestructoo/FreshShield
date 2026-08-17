import { Ionicons } from '@expo/vector-icons';
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
    <View className="rounded-[24px] bg-[#E5DDF3] p-4">
      <View className="mb-5 flex-row items-start justify-between">
        <View>
          <Text className="font-poppins text-xs font-medium text-[#3F3948]">Target temperature</Text>
          <Text className="font-poppins mt-1 text-xs text-[#706879]">Cooling setpoint</Text>
        </View>
        <Text className="font-poppins text-3xl font-semibold tracking-[-1px] text-[#141217]">{value.toFixed(1)}°</Text>
      </View>
      <View className="flex-row gap-2">
        <Pressable accessibilityLabel="Decrease target temperature" disabled={disabled} onPress={() => changeBy(-1)} className="h-12 w-12 items-center justify-center rounded-full bg-white/80">
          <Ionicons name="remove" size={21} color="#28232E" />
        </Pressable>
        <Pressable accessibilityLabel="Increase target temperature" disabled={disabled} onPress={() => changeBy(1)} className="h-12 w-12 items-center justify-center rounded-full bg-white/80">
          <Ionicons name="add" size={21} color="#28232E" />
        </Pressable>
        <Pressable disabled={disabled || applying} onPress={onApply} className="h-12 flex-1 items-center justify-center rounded-full bg-[#17191B] px-4">
          <Text className="font-poppins text-sm font-semibold text-white">{applying ? 'Applying…' : 'Apply target'}</Text>
        </Pressable>
      </View>
    </View>
  );
}
