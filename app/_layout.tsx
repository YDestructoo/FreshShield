import '../global.css';

import { Poppins_400Regular, useFonts } from '@expo-google-fonts/poppins';
import { useRouter } from 'expo-router';
import { TabList, TabSlot, Tabs, TabTrigger } from 'expo-router/ui';
import { GlassTabBar, GlassTabButton, TabBarMinimizeProvider, renderFadingTabScreen, type GlassTabItem } from 'expo-glass-tabs';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const TAB_ITEMS: (GlassTabItem & { href: '/dashboard' | '/history' | '/settings' })[] = [
  { name: 'dashboard', href: '/dashboard', label: 'Home', icon: 'house.fill' },
  { name: 'history', href: '/history', label: 'History', icon: 'chart.pie.fill' },
  { name: 'settings', href: '/settings', label: 'Settings', icon: 'gearshape.fill' },
];

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Poppins_400Regular });
  const router = useRouter();

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <TabBarMinimizeProvider>
        <Tabs>
          <TabSlot style={{ height: '100%' }} renderFn={renderFadingTabScreen} />
          <TabList asChild>
            <GlassTabBar
              onIndexSelected={(index) => router.navigate(TAB_ITEMS[index].href)}
              theme={{
                activeTint: '#F0525E',
                inactiveTint: '#526168',
                highlight: '#FFFFFF',
                glassTint: 'transparent',
                solidFallback: 'transparent',
              }}
            >
              {TAB_ITEMS.map(({ href, ...item }, index) => (
                <TabTrigger key={item.name} name={item.name} href={href} asChild>
                  <GlassTabButton item={item} index={index} />
                </TabTrigger>
              ))}
            </GlassTabBar>
          </TabList>
        </Tabs>
      </TabBarMinimizeProvider>
    </GestureHandlerRootView>
  );
}
