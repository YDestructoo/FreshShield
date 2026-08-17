import type { PropsWithChildren } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

export function ScreenContainer({ children }: PropsWithChildren) {
  return <SafeAreaView className="flex-1 bg-slate-950 px-5">{children}</SafeAreaView>;
}
