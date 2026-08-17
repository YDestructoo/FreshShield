import { Text, View } from 'react-native';

type SensorCardProps = { label: string; value: string; icon?: string };

export function SensorCard({ label, value, icon }: SensorCardProps) {
  return (
    <View className="rounded-2xl bg-slate-900 p-4">
      <Text className="text-sm text-slate-400">{icon ? `${icon}  ${label}` : label}</Text>
      <Text className="mt-2 text-2xl font-semibold text-white">{value}</Text>
    </View>
  );
}
