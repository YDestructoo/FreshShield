import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Text, View } from 'react-native';

import { ScreenContainer } from '../components/ScreenContainer';

export default function ConnectScreen() {
  return (
    <ScreenContainer>
      <View className="flex-1 justify-center gap-6">
        <Ionicons name="shield-checkmark-outline" size={52} color="#22d3ee" />
        <View className="gap-2">
          <Text className="text-3xl font-bold text-white">FreshShield</Text>
          <Text className="text-base text-slate-400">Connect to your Pico W on local Wi-Fi.</Text>
        </View>
        <Link href="/dashboard" className="rounded-xl bg-cyan-400 px-4 py-3 text-center font-semibold text-slate-950">
          Open dashboard
        </Link>
      </View>
    </ScreenContainer>
  );
}
