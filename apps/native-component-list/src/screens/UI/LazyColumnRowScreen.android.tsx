import { Host, LazyColumn, LazyRow, Column, Row, Text } from '@expo/ui/jetpack-compose';
import {
  background,
  height as heightModifier,
  onVisibilityChanged,
  padding,
  paddingAll,
  size,
  weight,
  fillMaxWidth,
} from '@expo/ui/jetpack-compose/modifiers';
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

  const onChanged = (i: number) => (isVisible: boolean) => {
    setVisible((prev) => {
      const next = new Set(prev);
      if (isVisible) {
        next.add(i);
      } else {
        next.delete(i);
      }
      return next;
    });
  };

  return { count: visible.size, min, max, onChanged };
}

export default function LazyColumnRowScreen() {
  const colTracking = useVisibleTracking();
  const rowTracking = useVisibleTracking();

  return (
    <>
      <View style={{ flex: 1 }}>
        <Host style={{ flex: 1 }}>
          <Column>
            <Text style={{ typography: 'titleMedium' }} modifiers={[paddingAll(16)]}>
              LazyColumn
            </Text>
            <Text style={{ typography: 'bodySmall' }} modifiers={[padding(16, 0, 16, 8)]}>
              {`${colTracking.count} / ${ITEM_COUNT} visible (index ${colTracking.min}–${colTracking.max})`}
            </Text>
            <LazyColumn
              verticalArrangement={{ spacedBy: 12 }}
              horizontalAlignment="center"
              contentPadding={{ start: 16, end: 16, top: 8, bottom: 8 }}
              modifiers={[weight(1)]}>
              {Array.from({ length: ITEM_COUNT }, (_, i) => (
                <Row
                  key={i}
                  verticalAlignment="center"
                  horizontalArrangement={{ spacedBy: 12 }}
                  modifiers={[
                    fillMaxWidth(),
                    heightModifier(56),
                    background(COLORS[i % COLORS.length]),
                    paddingAll(8),
                    onVisibilityChanged(colTracking.onChanged(i)),
                  ]}>
                  <Text color="#FFFFFF" style={{ typography: 'titleMedium' }}>{`Item ${i}`}</Text>
                </Row>
              ))}
            </LazyColumn>
          </Column>
        </Host>
      </View>

      <View style={{ height: 8, backgroundColor: '#E0E0E0' }} />

      <View style={{ flex: 1 }}>
        <Host style={{ flex: 1 }}>
          <Column>
            <Text style={{ typography: 'titleMedium' }} modifiers={[paddingAll(16)]}>
              LazyRow
            </Text>
            <Text style={{ typography: 'bodySmall' }} modifiers={[padding(16, 0, 16, 8)]}>
              {`${rowTracking.count} / ${ITEM_COUNT} visible (index ${rowTracking.min}–${rowTracking.max})`}
            </Text>
            <LazyRow
              horizontalArrangement={{ spacedBy: 12 }}
              verticalAlignment="center"
              contentPadding={{ start: 16, end: 16 }}
              modifiers={[weight(1)]}>
              {Array.from({ length: ITEM_COUNT }, (_, i) => (
                <Column
                  key={i}
                  horizontalAlignment="center"
                  verticalArrangement={{ spacedBy: 8 }}
                  modifiers={[
                    size(100, 100),
                    background(COLORS[i % COLORS.length]),
                    paddingAll(8),
                    onVisibilityChanged(rowTracking.onChanged(i)),
                  ]}>
                  <Text color="#FFFFFF" style={{ typography: 'labelLarge' }}>{`Item ${i}`}</Text>
                </Column>
              ))}
            </LazyRow>
          </Column>
        </Host>
      </View>
    </>
  );
}

LazyColumnRowScreen.navigationOptions = {
  title: 'LazyColumn / LazyRow',
};
