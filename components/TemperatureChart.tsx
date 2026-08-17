import { useMemo, useState } from 'react';
import type { GestureResponderEvent, LayoutChangeEvent } from 'react-native';
import { Pressable, Text, View } from 'react-native';

const HOURS = ['6 AM', '8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM'];
const OFFSETS = [-0.5, -0.2, -0.35, 0.15, 0.4, 0.1, 0.3];
const CHART_HEIGHT = 116;
const PAD = 10;

type TemperatureChartProps = { currentTemperature: number };

export function TemperatureChart({ currentTemperature }: TemperatureChartProps) {
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState(HOURS.length - 1);
  const values = useMemo(() => OFFSETS.map((offset) => currentTemperature + offset), [currentTemperature]);
  const min = Math.min(...values) - 0.3;
  const max = Math.max(...values) + 0.3;
  const plotWidth = Math.max(0, width - PAD * 2);
  const points = values.map((value, index) => ({
    x: PAD + (plotWidth * index) / (values.length - 1),
    y: PAD + ((max - value) / (max - min)) * (CHART_HEIGHT - PAD * 2),
  }));

  const selectAt = (event: GestureResponderEvent) => {
    if (!plotWidth) return;
    const index = Math.round(((event.nativeEvent.locationX - PAD) / plotWidth) * (values.length - 1));
    setSelected(Math.max(0, Math.min(values.length - 1, index)));
  };

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  return (
    <View className="rounded-[26px] bg-[#17191B] p-4">
      <View className="flex-row items-start justify-between">
        <View>
          <Text className="font-poppins text-xs font-medium text-[#BEC5C8]">Temperature timeline</Text>
          <Text className="font-poppins mt-1 text-[11px] text-[#7F8A8F]">Touch and drag across the chart</Text>
        </View>
        <View className="items-end">
          <Text className="font-poppins text-2xl font-semibold text-white">{values[selected].toFixed(1)}°</Text>
          <Text className="font-poppins text-[11px] text-[#AAB2B5]">{HOURS[selected]}</Text>
        </View>
      </View>

      <View
        className="mt-3 overflow-hidden rounded-[18px] bg-[#242729]"
        style={{ height: CHART_HEIGHT }}
        onLayout={onLayout}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={selectAt}
        onResponderMove={selectAt}
      >
        <View className="absolute left-0 right-0 top-1/3 h-px bg-white/5" />
        <View className="absolute left-0 right-0 top-2/3 h-px bg-white/5" />
        {width > 0 && points.slice(0, -1).map((point, index) => {
          const next = points[index + 1];
          const dx = next.x - point.x;
          const dy = next.y - point.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * 180 / Math.PI;
          return <View key={`line-${index}`} pointerEvents="none" className="absolute h-0.5 rounded-full bg-[#F06A75]" style={{ left: point.x, top: point.y, width: length, transform: [{ rotateZ: `${angle}deg` }], transformOrigin: 'left center' }} />;
        })}
        {width > 0 && points.map((point, index) => (
          <Pressable
            key={HOURS[index]}
            accessibilityLabel={`${HOURS[index]}, ${values[index].toFixed(1)} degrees Celsius`}
            onHoverIn={() => setSelected(index)}
            onPress={() => setSelected(index)}
            className="absolute h-7 w-7 items-center justify-center rounded-full"
            style={{ left: point.x - 14, top: point.y - 14 }}
          >
            <View className={`rounded-full border-2 border-[#242729] ${selected === index ? 'h-3.5 w-3.5 bg-white' : 'h-2.5 w-2.5 bg-[#F06A75]'}`} />
          </Pressable>
        ))}
      </View>

      <View className="mt-2 flex-row justify-between px-1">
        <Text className="font-poppins text-[10px] text-[#7F8A8F]">6 AM</Text>
        <Text className="font-poppins text-[10px] text-[#7F8A8F]">12 PM</Text>
        <Text className="font-poppins text-[10px] text-[#7F8A8F]">6 PM</Text>
      </View>
    </View>
  );
}
