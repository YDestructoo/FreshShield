import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { ConnectionStatus } from '../components/ConnectionStatus';
import { ScreenContainer } from '../components/ScreenContainer';
import { useFreshShield } from '../hooks/useFreshShield';

export default function ConnectScreen() {
  const { ip, connected, connecting, error, connect } = useFreshShield();
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (ip) setAddress(ip);
  }, [ip]);

  const handleConnect = async () => {
    if (await connect(address)) router.replace('/dashboard');
  };

  return (
    <ScreenContainer>
      <View className="flex-1 justify-center gap-6">
        <Ionicons name="shield-checkmark-outline" size={52} color="#22d3ee" />
        <View className="gap-2">
          <Text className="text-3xl font-bold text-white">FreshShield</Text>
          <Text className="text-base text-slate-400">Connect to your Pico W on local Wi-Fi.</Text>
        </View>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          onChangeText={setAddress}
          placeholder="Pico W IP address, e.g. 192.168.1.50"
          placeholderTextColor="#64748b"
          value={address}
          className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-base text-white"
        />
        <ConnectionStatus connected={connected} />
        {connecting && <Text className="text-sm text-cyan-400">Connecting…</Text>}
        {error && <Text className="text-sm text-rose-400">{error}</Text>}
        <Pressable disabled={connecting} onPress={handleConnect} className="rounded-xl bg-cyan-400 px-4 py-3">
          <Text className="text-center font-semibold text-slate-950">{connecting ? 'Connecting…' : connected ? 'Reconnect' : 'Connect'}</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
