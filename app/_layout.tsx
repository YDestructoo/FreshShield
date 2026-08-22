import '../global.css';

import { Poppins_400Regular, useFonts } from '@expo-google-fonts/poppins';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { FreshShieldProvider } from '../hooks/useFreshShield';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Poppins_400Regular });

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <FreshShieldProvider>
        <StatusBar style="dark" />
        <Slot />
      </FreshShieldProvider>
    </GestureHandlerRootView>
  );
}
