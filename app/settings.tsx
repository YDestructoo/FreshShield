import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { ConnectionStatus } from '../components/ConnectionStatus';
import { ScreenContainer } from '../components/ScreenContainer';
import { useFreshShield } from '../hooks/useFreshShield';

export default function SettingsScreen() {
  const { ip, connected, connecting, error, connect } = useFreshShield();
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (ip) setAddress(ip);
  }, [ip]);

  const reconnect = async () => {
    if (await connect(address)) router.replace('/dashboard');
  };

  return (
    <ScreenContainer>
      <View className="flex-1 gap-5 pt-6">
        <Text className="text-2xl font-bold text-white">Settings</Text>
        <ConnectionStatus connected={connected} />
        <View className="gap-2">
          <Text className="text-sm text-slate-400">Pico W IP address</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            onChangeText={setAddress}
            placeholder="192.168.1.50"
            placeholderTextColor="#64748b"
            value={address}
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-base text-white"
          />
        </View>
        {error && <Text className="text-sm text-rose-400">{error}</Text>}
        <Pressable disabled={connecting} onPress={reconnect} className="rounded-xl bg-cyan-400 px-4 py-3">
          <Text className="text-center font-semibold text-slate-950">{connecting ? 'Connecting…' : 'Save and reconnect'}</Text>
        </Pressable>
        <Text className="mt-auto pb-6 text-center text-sm text-slate-500">FreshShield · Local Wi-Fi only</Text>
      </View>
    </ScreenContainer>
  );
}
