import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TabList, TabSlot, Tabs, TabTrigger } from 'expo-router/ui';
import { GlassTabBar, GlassTabButton, TabBarMinimizeProvider, renderFadingTabScreen, type GlassTabItem } from 'expo-glass-tabs';

import { FRESHSIELD_COLORS } from '../../constants/theme';

const ITEMS: (GlassTabItem & { href: string })[] = [
  { name: 'index', href: '/', label: 'Home', renderIcon: ({ tint, size }) => <Ionicons name="home" color={tint} size={size} /> },
  { name: 'settings', href: '/settings', label: 'Settings', renderIcon: ({ tint, size }) => <Ionicons name="settings" color={tint} size={size} /> },
];

export default function TabLayout() {
  const router = useRouter();

  return (
    <TabBarMinimizeProvider>
      <Tabs>
        <TabSlot style={{ flex: 1 }} renderFn={renderFadingTabScreen} />
        <TabList asChild>
          <GlassTabBar
            haptics
            onIndexSelected={(index) => router.navigate(ITEMS[index].href as never)}
            theme={{
              activeTint: FRESHSIELD_COLORS.navigationActive,
              inactiveTint: FRESHSIELD_COLORS.navigationInactive,
              highlight: FRESHSIELD_COLORS.navigationIndicator,
              glassTint: FRESHSIELD_COLORS.navigation,
              solidFallback: FRESHSIELD_COLORS.navigation,
            }}
          >
            {ITEMS.map(({ href, ...item }, index) => (
              <TabTrigger key={item.name} name={item.name} href={href as never} asChild>
                <GlassTabButton item={item} index={index} />
              </TabTrigger>
            ))}
          </GlassTabBar>
        </TabList>
      </Tabs>
    </TabBarMinimizeProvider>
  );
}
