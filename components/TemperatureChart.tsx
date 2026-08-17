import { useState } from 'react';
import type { GestureResponderEvent, LayoutChangeEvent } from 'react-native';
import { Pressable, Text, View } from 'react-native';

const CHART_HEIGHT = 116;
const PAD = 10;

type TemperatureChartProps = { data: { timestamp: number; value: number }[] };

export function TemperatureChart({ data }: TemperatureChartProps) {
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState(0);
  const values = data.map(({ value }) => value);
  const labels = data.map(({ timestamp }) => new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
  const selectedIndex = Math.min(selected, values.length - 1);
  const min = Math.min(...values) - 0.3;
  const max = Math.max(...values) + 0.3;
  const plotWidth = Math.max(0, width - PAD * 2);
  const points = values.map((value, index) => ({
    x: PAD + (plotWidth * index) / Math.max(values.length - 1, 1),
    y: PAD + ((max - value) / (max - min)) * (CHART_HEIGHT - PAD * 2),
  }));

  const selectAt = (event: GestureResponderEvent) => {
    if (!plotWidth || values.length < 2) return;
    const index = Math.round(((event.nativeEvent.locationX - PAD) / plotWidth) * (values.length - 1));
    setSelected(Math.max(0, Math.min(values.length - 1, index)));
  };

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  return (
    <View className="rounded-[26px] bg-[#17191B] p-4">
      <View className="flex-row items-start justify-between">
        <View>
          <Text className="font-poppins text-xs font-medium text-[#BEC5C8]">Temperature timeline</Text>
          <Text className="font-poppins mt-1 text-[11px] text-[#7F8A8F]">Fifteen-minute averages · touch and drag</Text>
        </View>
        <View className="items-end">
          <Text className="font-poppins text-2xl font-semibold text-white">{values[selectedIndex].toFixed(1)}°</Text>
          <Text className="font-poppins text-[11px] text-[#AAB2B5]">{labels[selectedIndex]}</Text>
        </View>
      </View>

      <View className="mt-3 overflow-hidden rounded-[18px] bg-[#242729]" style={{ height: CHART_HEIGHT }} onLayout={onLayout} onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true} onResponderGrant={selectAt} onResponderMove={selectAt}>
        <View className="absolute left-0 right-0 top-1/3 h-px bg-white/5" />
        <View className="absolute left-0 right-0 top-2/3 h-px bg-white/5" />
        {width > 0 && points.slice(0, -1).map((point, index) => {
          const next = points[index + 1];
          const dx = next.x - point.x;
          const dy = next.y - point.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          return <View key={`line-${data[index].timestamp}`} pointerEvents="none" className="absolute h-0.5 rounded-full bg-[#F06A75]" style={{ left: point.x, top: point.y, width: length, transform: [{ rotateZ: `${Math.atan2(dy, dx) * 180 / Math.PI}deg` }], transformOrigin: 'left center' }} />;
        })}
        {width > 0 && points[selectedIndex] && (
          <View pointerEvents="none" style={{ position: 'absolute', left: Math.max(PAD, Math.min(width - 92, points[selectedIndex].x - 46)), top: Math.max(4, points[selectedIndex].y - 36) }}>
            <View className="rounded-xl bg-white px-2 py-1 shadow-sm"><Text className="font-poppins text-[10px] font-medium text-[#17191B]">{labels[selectedIndex]} · {values[selectedIndex].toFixed(1)}°C</Text></View>
          </View>
        )}
        {width > 0 && points.map((point, index) => (
          <Pressable key={data[index].timestamp} accessibilityLabel={`${labels[index]}, ${values[index].toFixed(1)} degrees Celsius`} onHoverIn={() => setSelected(index)} onPress={() => setSelected(index)} className="absolute h-7 w-7 items-center justify-center rounded-full" style={{ left: point.x - 14, top: point.y - 14 }}>
            <View className={`rounded-full border-2 border-[#242729] ${selectedIndex === index ? 'h-3.5 w-3.5 bg-white' : 'h-2.5 w-2.5 bg-[#F06A75]'}`} />
          </Pressable>
        ))}
      </View>

      <View className="mt-2 flex-row justify-between px-1">
        <Text className="font-poppins text-[10px] text-[#7F8A8F]">{labels[0]}</Text>
        <Text className="font-poppins text-[10px] text-[#7F8A8F]">15 min avg</Text>
        <Text className="font-poppins text-[10px] text-[#7F8A8F]">{labels[labels.length - 1]}</Text>
      </View>
    </View>
  );
}
