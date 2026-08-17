import { Link } from 'expo-router';
import { Text, View } from 'react-native';

import { ScreenContainer } from '../components/ScreenContainer';

export default function SettingsScreen() {
  return (
    <ScreenContainer>
      <View className="flex-1 gap-4 pt-6">
        <Text className="text-2xl font-bold text-white">Settings</Text>
        <Text className="text-base text-slate-400">Pico W connection settings will be managed here.</Text>
        <Link href="/history" className="text-cyan-400">View history</Link>
      </View>
    </ScreenContainer>
  );
}
