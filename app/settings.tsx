import { Ionicons } from '@expo/vector-icons';
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
      <View className="flex-1 gap-4 pt-4">
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
        </View>


        <View className="flex-row items-center gap-3 rounded-[22px] bg-[#F5DED7] p-4">
          <Ionicons name="lock-closed" size={17} color="#86574C" />
          <Text className="font-poppins flex-1 text-xs leading-5 text-[#72534B]">Local Wi-Fi only. FreshShield does not require a cloud account.</Text>
        </View>
      </View>
    </ScreenContainer>
  );
}
