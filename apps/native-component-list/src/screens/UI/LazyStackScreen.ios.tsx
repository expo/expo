import {
  Host,
  ScrollView,
  LazyVStack,
  LazyHStack,
  VStack,
  ZStack,
  Text,
  RoundedRectangle,
} from '@expo/ui/swift-ui';
import {
  frame,
  font,
  foregroundStyle,
  padding,
  onAppear,
  onDisappear,
} from '@expo/ui/swift-ui/modifiers';
import { useState } from 'react';
import { View } from 'react-native';

const ITEM_COUNT = 50;

const COLORS = [
  '#FF6B6B',
  '#FF8E53',
  '#FFC53D',
  '#52C41A',
  '#36CFC9',
  '#4096FF',
  '#9254DE',
  '#F759AB',
];

function useVisibleTracking() {
  const [visible, setVisible] = useState<Set<number>>(new Set());
  const min = visible.size ? Math.min(...visible) : -1;
  const max = visible.size ? Math.max(...visible) : -1;

  const appear = (i: number) => setVisible((prev) => new Set(prev).add(i));
  const disappear = (i: number) => {
    setVisible((prev) => {
      const next = new Set(prev);
      next.delete(i);
      return next;
    });
  };

  return { count: visible.size, min, max, appear, disappear };
}

export default function LazyStackScreen() {
  const vTracking = useVisibleTracking();
  const hTracking = useVisibleTracking();

  return (
    <>
      <View style={{ flex: 1 }}>
        <Host style={{ flex: 1 }}>
          <VStack alignment="leading">
            <Text
              modifiers={[
                font({ size: 13, weight: 'bold' }),
                padding({ horizontal: 16, top: 12 }),
              ]}>
              LazyVStack
            </Text>
            <Text
              modifiers={[
                font({ size: 12, design: 'monospaced' }),
                padding({ horizontal: 16, bottom: 8 }),
              ]}>
              {`${vTracking.count} / ${ITEM_COUNT} rendered (index ${vTracking.min}–${vTracking.max})`}
            </Text>
            <ScrollView>
              <LazyVStack spacing={12} alignment="leading">
                {Array.from({ length: ITEM_COUNT }, (_, i) => (
                  <ZStack
                    key={i}
                    modifiers={[
                      frame({ height: 50 }),
                      padding({ horizontal: 16 }),
                      onAppear(() => vTracking.appear(i)),
                      onDisappear(() => vTracking.disappear(i)),
                    ]}>
                    <RoundedRectangle
                      cornerRadius={12}
                      modifiers={[foregroundStyle(COLORS[i % COLORS.length])]}
                    />
                    <Text
                      modifiers={[
                        foregroundStyle('#FFFFFF'),
                        font({ size: 17, weight: 'semibold' }),
                      ]}>
                      {`Item ${i}`}
                    </Text>
                  </ZStack>
                ))}
              </LazyVStack>
            </ScrollView>
          </VStack>
        </Host>
      </View>

      <View style={{ height: 8, backgroundColor: '#E0E0E0' }} />

      <View style={{ flex: 1 }}>
        <Host style={{ flex: 1 }}>
          <VStack alignment="leading">
            <Text
              modifiers={[
                font({ size: 13, weight: 'bold' }),
                padding({ horizontal: 16, top: 12 }),
              ]}>
              LazyHStack
            </Text>
            <Text
              modifiers={[
                font({ size: 12, design: 'monospaced' }),
                padding({ horizontal: 16, bottom: 8 }),
              ]}>
              {`${hTracking.count} / ${ITEM_COUNT} rendered (index ${hTracking.min}–${hTracking.max})`}
            </Text>
            <ScrollView axes="horizontal">
              <LazyHStack spacing={12}>
                {Array.from({ length: ITEM_COUNT }, (_, i) => (
                  <ZStack
                    key={i}
                    modifiers={[
                      frame({ width: 100, height: 100 }),
                      onAppear(() => hTracking.appear(i)),
                      onDisappear(() => hTracking.disappear(i)),
                    ]}>
                    <RoundedRectangle
                      cornerRadius={12}
                      modifiers={[foregroundStyle(COLORS[i % COLORS.length])]}
                    />
                    <Text
                      modifiers={[
                        foregroundStyle('#FFFFFF'),
                        font({ size: 17, weight: 'semibold' }),
                      ]}>
                      {`${i}`}
                    </Text>
                  </ZStack>
                ))}
              </LazyHStack>
            </ScrollView>
          </VStack>
        </Host>
      </View>
    </>
  );
}

LazyStackScreen.navigationOptions = {
  title: 'LazyVStack / LazyHStack',
};
