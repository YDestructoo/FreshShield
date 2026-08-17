import { Text, View } from 'react-native';

import { ScreenContainer } from '../components/ScreenContainer';

export default function HistoryScreen() {
  return (
    <ScreenContainer>
      <View className="flex-1 justify-center gap-2">
        <Text className="text-2xl font-bold text-white">History</Text>
        <Text className="text-base text-slate-400">Local sensor history is not enabled yet.</Text>
      </View>
    </ScreenContainer>
  );
}
