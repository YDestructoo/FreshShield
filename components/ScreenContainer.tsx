import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FRESHSIELD_COLORS } from '../constants/theme';

export function ScreenContainer({ children }: PropsWithChildren) {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 px-4" style={{ backgroundColor: FRESHSIELD_COLORS.background }}>
      <View className="flex-1">{children}</View>
    </SafeAreaView>
  );
}
