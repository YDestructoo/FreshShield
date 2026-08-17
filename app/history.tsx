import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { ScreenContainer } from '../components/ScreenContainer';

export default function HistoryScreen() {
  return (
    <ScreenContainer>
      <View className="flex-1 gap-4 pt-4">
        <View className="px-1">
          <Text className="font-poppins text-xs text-[#657178]">FreshShield</Text>
          <Text className="font-poppins text-2xl font-semibold tracking-[-0.8px] text-[#111719]">History</Text>
        </View>
        <View className="rounded-[26px] bg-[#CEDFF0] p-5">
          <View className="mb-8 flex-row items-center justify-between">
            <Text className="font-poppins text-xs font-medium text-[#26353C]">Temperature trend</Text>
            <View className="h-9 w-9 items-center justify-center rounded-full bg-white/80"><Ionicons name="pulse" size={17} color="#526168" /></View>
          </View>
          <View className="h-20 flex-row items-end justify-between">
            {[35, 55, 42, 70, 58, 78, 50, 65, 45, 74, 60, 82].map((height, index) => (
              <View key={index} style={{ height }} className={`w-2 rounded-full ${index > 8 ? 'bg-[#F05B68]' : 'bg-white/80'}`} />
            ))}
          </View>
        </View>
        <View className="rounded-[24px] bg-[#E7D9F3] p-5">
          <Text className="font-poppins text-xs font-medium text-[#3F3948]">Local records</Text>
          <Text className="font-poppins mt-3 text-2xl font-semibold text-[#17141A]">Coming soon</Text>
          <Text className="font-poppins mt-2 text-sm leading-5 text-[#625B69]">Live readings are available now. Saved trends will appear here when local history is enabled.</Text>
        </View>
      </View>
    </ScreenContainer>
  );
}
