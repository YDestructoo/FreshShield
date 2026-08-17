import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function ScreenContainer({ children }: PropsWithChildren) {
  return (
    <SafeAreaView className="flex-1 bg-[#F3F7F8] px-4">
      <View className="flex-1 pb-20">{children}</View>
    </SafeAreaView>
  );
}
