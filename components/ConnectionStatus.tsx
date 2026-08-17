import { Text, View } from 'react-native';

export function ConnectionStatus({ connected }: { connected: boolean }) {
  return (
    <View className="flex-row items-center gap-2">
      <View className={`h-2.5 w-2.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
      <Text className="text-sm text-slate-300">{connected ? 'Connected' : 'Disconnected'}</Text>
    </View>
  );
}
