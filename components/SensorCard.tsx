import type { ReactNode } from 'react';
import { useState } from 'react';
import { Text, View } from 'react-native';

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

function MiniTrend({ values }: { values: number[] }) {
  const [width, setWidth] = useState(0);
  const height = 58;
  const min = Math.min(...values) - 1;
  const max = Math.max(...values) + 1;
  const points = values.map((value, index) => ({
    x: (width * index) / (values.length - 1),
    y: 15 + ((max - value) / (max - min)) * (height - 27),
  }));

  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} className="mt-5 overflow-hidden" style={{ height }}>
      {width > 0 && points.slice(0, -1).map((point, index) => {
        const next = points[index + 1];
        const dx = next.x - point.x;
        const dy = next.y - point.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        return <View key={index} className="absolute h-px bg-[#7A5D91]" style={{ left: point.x, top: point.y, width: length, transform: [{ rotateZ: `${Math.atan2(dy, dx) * 180 / Math.PI}deg` }], transformOrigin: 'left center' }} />;
      })}
      {width > 0 && points.map((point, index) => <View key={`point-${index}`} className="absolute h-1.5 w-1.5 rounded-full bg-[#7A5D91]" style={{ left: point.x - 3, top: point.y - 3 }} />)}
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
      <View className="mt-4 flex-row items-end gap-1">
        <Text className="font-poppins text-[30px] font-semibold tracking-[-1.2px] text-[#101517]">{value}</Text>
        {unit && <Text className="font-poppins mb-1 text-xs text-[#4F5A60]">{unit}</Text>}
      </View>
      {trend && <MiniTrend values={trend} />}
    </View>
  );
}
