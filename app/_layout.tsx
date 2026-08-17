import '../global.css';

import { Poppins_400Regular, useFonts } from '@expo-google-fonts/poppins';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Poppins_400Regular });

  if (!fontsLoaded) return null;

  return (
    <>
      <StatusBar style="dark" />
      <NativeTabs
        backgroundColor="transparent"
        iconColor={{ default: '#526168', selected: '#F0525E' }}
        indicatorColor="#FCE1E3"
        labelStyle={{ default: { color: '#526168', fontFamily: 'Poppins_400Regular', fontSize: 10 }, selected: { color: '#F0525E', fontFamily: 'Poppins_400Regular', fontSize: 10 } }}
        minimizeBehavior="onScrollDown"
        tabBarRespectsIMEInsets
        tintColor="#F0525E"
      >
        <NativeTabs.Trigger name="dashboard">
          <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md={{ default: 'home', selected: 'home_filled' }} />
          <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="settings">
          <NativeTabs.Trigger.Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} md="settings" />
          <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    </>
  );
}
