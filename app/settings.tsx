import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';

import { ConnectionStatus } from '../components/ConnectionStatus';
import { ScreenContainer } from '../components/ScreenContainer';
import { useFreshShield } from '../hooks/useFreshShield';
import { usePicoDiscovery } from '../hooks/usePicoDiscovery';

export default function SettingsScreen() {
  const { ip, connected, connecting, error, connect, disconnect, moldSettings, updateMoldSettings } = useFreshShield();
  const [address, setAddress] = useState('');
  const { devices, scanning, error: discoveryError, scan } = usePicoDiscovery();

  useEffect(() => {
    if (ip) setAddress(ip);
  }, [ip]);
  useEffect(() => { void scan(); }, [scan]);

  const useDevice = async (nextAddress: string) => {
    if (await connect(nextAddress)) router.replace('/dashboard');
  };
  const reconnect = () => useDevice(address);

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-4 pb-4 pt-4">
        <View className="px-1">
          <Text className="font-poppins text-xs text-[#657178]">FreshShield</Text>
          <Text className="font-poppins text-2xl font-semibold tracking-[-0.8px] text-[#111719]">Settings</Text>
        </View>

        <View className="rounded-[26px] bg-[#DDECCB] p-5">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-full bg-white/80"><Ionicons name="hardware-chip" size={20} color="#536B49" /></View>
              <View><Text className="font-poppins text-xs text-[#58654F]">Local device</Text><Text className="font-poppins text-lg font-semibold text-[#182015]">Pico W</Text></View>
            </View>
            <ConnectionStatus connected={connected} />
          </View>
        </View>

        <View className="gap-3 rounded-[26px] bg-[#E7D9F3] p-5">
          <View className="flex-row items-center justify-between">
            <View><Text className="font-poppins text-base font-semibold text-[#2E2537]">Nearby FreshShield Devices</Text><Text className="font-poppins mt-1 text-xs text-[#62546D]">Find devices on this Wi-Fi network</Text></View>
            <Pressable accessibilityLabel="Refresh nearby devices" disabled={scanning} onPress={() => void scan()} className="h-10 w-10 items-center justify-center rounded-full bg-white/80"><Ionicons name="refresh" size={20} color="#4C3C59" /></Pressable>
          </View>
          {scanning && <View className="flex-row items-center gap-2 py-2"><ActivityIndicator color="#665178" /><Text className="font-poppins text-xs text-[#62546D]">Scanning nearby devices…</Text></View>}
          {!scanning && discoveryError && <Text className="font-poppins text-xs leading-5 text-[#72534B]">{discoveryError} You can still enter an address manually.</Text>}
          {!scanning && !discoveryError && !devices.length && <Text className="font-poppins text-xs text-[#62546D]">No FreshShield devices found.</Text>}
          {devices.map(({ ip: deviceIp, status }) => <View key={deviceIp} className={`gap-2 rounded-[18px] p-4 ${ip === deviceIp ? 'bg-[#FCE1E3]' : 'bg-white/70'}`}>
            <View className="flex-row items-center justify-between"><View><Text className="font-poppins text-sm font-semibold text-[#2E2537]">FreshShield</Text><Text className="font-poppins text-xs text-[#62546D]">{deviceIp}{ip === deviceIp ? ' · Configured device' : ' · Found on Wi-Fi'}</Text></View><Ionicons name="radio-outline" size={18} color="#665178" /></View>
            <Text className="font-poppins text-xs text-[#4C3C59]">{status.temperature.toFixed(1)}°C · {status.humidity.toFixed(0)}% RH</Text>
            <Pressable disabled={connecting} onPress={() => void useDevice(deviceIp)} className="items-center rounded-full bg-[#17191B] px-4 py-3"><Text className="font-poppins text-xs font-semibold text-white">{ip === deviceIp ? 'Use Device' : 'Connect'}</Text></Pressable>
          </View>)}
        </View>

        <View className="gap-4 rounded-[26px] bg-[#CEDFF0] p-5">
          <View>
            <Text className="font-poppins text-xs font-medium text-[#26353C]">Device address</Text>
            <Text className="font-poppins mt-1 text-xs text-[#617078]">Stored only on this phone</Text>
          </View>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            onChangeText={setAddress}
            placeholder="192.168.1.50"
            placeholderTextColor="#7A878D"
            value={address}
            className="rounded-[18px] bg-white/80 px-4 py-4 text-base text-[#111719]"
          />
          {error && <Text className="font-poppins text-sm text-[#A64B40]">{error}</Text>}
          <Pressable disabled={connecting} onPress={reconnect} className="items-center rounded-full bg-[#17191B] px-4 py-4">
            <Text className="font-poppins text-sm font-semibold text-white">{connecting ? 'Checking device…' : 'Save and reconnect'}</Text>
          </Pressable>
          {connected && <Pressable onPress={() => { void disconnect(); setAddress(''); }} className="items-center rounded-full bg-[#F0525E] px-4 py-4">
            <Text className="font-poppins text-sm font-semibold text-white">Disconnect</Text>
          </Pressable>}
        </View>


        <View className="flex-row items-center justify-between rounded-[26px] bg-[#E7D9F3] p-5">
          <View className="flex-1 pr-4"><Text className="font-poppins text-base font-semibold text-[#2E2537]">Mold Notifications</Text><Text className="font-poppins mt-1 text-xs leading-5 text-[#62546D]">Show mold warnings in the app and on this device.</Text></View>
          <Switch value={moldSettings.notificationsEnabled} onValueChange={(notificationsEnabled) => updateMoldSettings({ notificationsEnabled })} trackColor={{ false: '#C4B4D1', true: '#665178' }} />
        </View>

        <View className="flex-row items-center gap-3 rounded-[22px] bg-[#F5DED7] p-4">
          <Ionicons name="lock-closed" size={17} color="#86574C" />
          <Text className="font-poppins flex-1 text-xs leading-5 text-[#72534B]">Local Wi-Fi only. FreshShield does not require a cloud account.</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
