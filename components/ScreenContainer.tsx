import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function ScreenContainer({ children }: PropsWithChildren) {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-[#F3F7F8] px-4">
      <View className="flex-1">{children}</View>
    </SafeAreaView>
  );
}
