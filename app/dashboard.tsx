import { Link } from 'expo-router';
import { Text, View } from 'react-native';

import { ConnectionStatus } from '../components/ConnectionStatus';
import { ScreenContainer } from '../components/ScreenContainer';

export default function DashboardScreen() {
  return (
    <ScreenContainer>
      <View className="flex-1 gap-5 pt-6">
        <ConnectionStatus connected={false} />
        <Text className="text-2xl font-bold text-white">Dashboard</Text>
        <Text className="text-base text-slate-400">Sensor cards and temperature controls will appear here after connecting a Pico W.</Text>
        <Link href="/settings" className="text-cyan-400">Open settings</Link>
      </View>
    </ScreenContainer>
  );
}
