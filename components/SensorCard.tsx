import type { ReactNode } from 'react';
import { useState } from 'react';
import type { GestureResponderEvent } from 'react-native';
import { Pressable, Text, View } from 'react-native';

const colors = {
  lilac: 'bg-[#E7D9F3]',
  green: 'bg-[#DDECCB]',
  peach: 'bg-[#F5DED7]',
  blue: 'bg-[#D6E5F2]',
};

type SensorCardProps = {
  label: string;
  value: string;
  unit?: string;
  icon?: ReactNode;
  color?: keyof typeof colors;
  tall?: boolean;
  trend?: number[];
};

function MiniTrend({ values, unit = '' }: { values: number[]; unit?: string }) {
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const height = 72;
  const min = Math.min(...values) - 1;
  const max = Math.max(...values) + 1;
  const points = values.map((value, index) => ({
    x: (width * index) / Math.max(values.length - 1, 1),
    y: 24 + ((max - value) / (max - min)) * (height - 34),
  }));
  const selectedIndex = Math.min(selected ?? values.length - 1, values.length - 1);

  const selectAt = (event: GestureResponderEvent) => {
    if (!width || values.length < 2) return;
    const index = Math.round((event.nativeEvent.locationX / width) * (values.length - 1));
    setSelected(Math.max(0, Math.min(values.length - 1, index)));
  };

  return (
    <View
      accessibilityLabel="Interactive five-minute humidity average chart"
      className="mt-3 overflow-hidden"
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={selectAt}
      onResponderMove={selectAt}
      onStartShouldSetResponder={() => true}
      style={{ height }}
    >
      {width > 0 && points.slice(0, -1).map((point, index) => {
        const next = points[index + 1];
        const dx = next.x - point.x;
        const dy = next.y - point.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        return <View key={index} pointerEvents="none" className="absolute h-px bg-[#7A5D91]" style={{ left: point.x, top: point.y, width: length, transform: [{ rotateZ: `${Math.atan2(dy, dx) * 180 / Math.PI}deg` }], transformOrigin: 'left center' }} />;
      })}
      {width > 0 && points.map((point, index) => (
        <Pressable
          key={`point-${index}`}
          accessibilityLabel={`${values[index].toFixed(1)}${unit}`}
          className="absolute h-6 w-6 items-center justify-center"
          onHoverIn={() => setSelected(index)}
          onPress={() => setSelected(index)}
          style={{ left: point.x - 12, top: point.y - 12 }}
        >
          <View className={`rounded-full bg-[#7A5D91] ${selectedIndex === index ? 'h-3 w-3 border-2 border-white' : 'h-1.5 w-1.5'}`} />
        </Pressable>
      ))}
      {width > 0 && points[selectedIndex] && (
        <View pointerEvents="none" className="absolute rounded-full bg-[#3F304B] px-2 py-1" style={{ left: Math.max(0, Math.min(width - 49, points[selectedIndex].x - 24)), top: 0 }}>
          <Text className="font-poppins text-[10px] text-white">{values[selectedIndex].toFixed(1)}{unit}</Text>
        </View>
      )}
    </View>
  );
}

export function SensorCard({ label, value, unit, icon, color = 'blue', tall = false, trend }: SensorCardProps) {
  return (
    <View className={`${tall ? 'min-h-[252px]' : 'min-h-[116px]'} rounded-[22px] p-4 ${colors[color]}`}>
      <View className="flex-row items-center justify-between">
        <Text className="font-poppins text-xs font-medium text-[#283239]">{label}</Text>
        {icon && <View className="h-8 w-8 items-center justify-center rounded-full bg-white/80">{icon}</View>}
      </View>
      <View className="mt-4 flex-row items-end">
        <Text className="font-poppins text-[30px] font-semibold tracking-[-1.2px] text-[#101517]">{value}</Text>
        {unit && <Text className="font-poppins mb-3 text-[10px] text-[#4F5A60]">{unit}</Text>}
      </View>
      {!!trend?.length && <MiniTrend values={trend} unit={unit} />}
    </View>
  );
}
