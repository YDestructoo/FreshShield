import { Text, View } from 'react-native';

export function ConnectionStatus({ connected }: { connected: boolean }) {
  return (
    <View className={`self-start rounded-full px-3 py-1.5 ${connected ? 'bg-[#DDF4E5]' : 'bg-[#F6DDD8]'}`}>
      <Text className={`font-poppins text-[11px] font-medium ${connected ? 'text-[#347154]' : 'text-[#A64B40]'}`}>
        {connected ? 'Connected' : 'Offline'}
      </Text>
    </View>
  );
}
