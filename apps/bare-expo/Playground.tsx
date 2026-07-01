import { Host, HStack, LazyList, Spacer, Text } from '@expo/ui/swift-ui';
import { background, cornerRadius, foregroundStyle, padding } from '@expo/ui/swift-ui/modifiers';
import { FlashList } from '@shopify/flash-list';
import { TabBackground } from 'native-component-list/src/components/TabBackground';
import TabIcon from 'native-component-list/src/components/TabIcon';
import { useState } from 'react';
import { Pressable, StyleSheet, Text as RNText, View } from 'react-native';

// Scratch screen for isolating reproductions. Replace the contents with your repro code and open it
// from the Playground tab. Revert your changes before committing unrelated work.

// A/B comparison: the same chat list rendered by our expo-ui LazyList (SwiftUI-native rows) vs
// FlashList (React Native rows). Switch tabs and fling each to compare scroll performance.
const COUNT = 1000;
const DATA = Array.from({ length: COUNT }, (_, i) => i);

const WORDS =
  'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation'.split(
    ' '
  );

// Deterministic, per-index message so heights are stable across re-renders but vary widely by row.
function messageFor(index: number): string {
  const wordCount = 2 + ((index * 7) % 28);
  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    words.push(WORDS[(index * 3 + i) % WORDS.length]);
  }
  return words.join(' ');
}

// expo-ui LazyList — SwiftUI-native Text bubbles. Data-driven so onSelect (tap) and onDelete
// (swipe-to-delete) can be exercised against the lazy list.
function LazyListDemo() {
  const [data, setData] = useState(() =>
    Array.from({ length: COUNT }, (_, i) => ({
      id: i,
      text: `${i + 1}. ${messageFor(i)}`,
      mine: i % 3 !== 0,
    }))
  );
  return (
    <Host style={{ flex: 1 }} ignoreSafeArea="all">
      <LazyList
        count={data.length}
        estimatedItemSize={64}
        keyExtractor={(index) => String(data[index]?.id ?? index)}
        onSelect={(index) => console.log('selected', data[index]?.id)}
        onDelete={(indices) => {
          const remove = new Set(indices);
          setData((prev) => prev.filter((_, i) => !remove.has(i)));
        }}
        renderItem={(index) => {
          const item = data[index];
          if (!item) {
            return <Text>—</Text>;
          }
          const bubble = (
            <Text
              modifiers={[
                foregroundStyle(item.mine ? '#ffffff' : '#111827'),
                padding({ horizontal: 14, vertical: 10 }),
                background(item.mine ? '#2563eb' : '#e5e7eb'),
                cornerRadius(18),
              ]}>
              {item.text}
            </Text>
          );
          return (
            <HStack modifiers={[padding({ horizontal: 12, vertical: 4 })]}>
              {item.mine ? <Spacer /> : null}
              {bubble}
              {item.mine ? null : <Spacer />}
            </HStack>
          );
        }}
      />
    </Host>
  );
}

// FlashList — equivalent React Native View/Text bubbles.
function FlashListDemo() {
  return (
    <FlashList
      data={DATA}
      keyExtractor={(item) => String(item)}
      renderItem={({ item: index }) => {
        const mine = index % 3 !== 0;
        return (
          <View style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
            <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
              <RNText style={mine ? styles.textMine : styles.textTheirs}>
                {`${index + 1}. ${messageFor(index)}`}
              </RNText>
            </View>
          </View>
        );
      }}
    />
  );
}

export default function Playground() {
  const [tab, setTab] = useState<'lazy' | 'flash'>('lazy');
  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === 'lazy' && styles.tabActive]}
          onPress={() => setTab('lazy')}>
          <RNText style={[styles.tabText, tab === 'lazy' && styles.tabTextActive]}>
            LazyList (expo-ui)
          </RNText>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'flash' && styles.tabActive]}
          onPress={() => setTab('flash')}>
          <RNText style={[styles.tabText, tab === 'flash' && styles.tabTextActive]}>
            FlashList
          </RNText>
        </Pressable>
      </View>
      <View style={styles.list}>{tab === 'lazy' ? <LazyListDemo /> : <FlashListDemo />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabs: {
    flexDirection: 'row',
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#2563eb' },
  tabText: { fontSize: 15, color: '#6b7280' },
  tabTextActive: { color: '#2563eb', fontWeight: '600' },
  list: { flex: 1 },
  row: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 4 },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleMine: { backgroundColor: '#2563eb' },
  bubbleTheirs: { backgroundColor: '#e5e7eb' },
  textMine: { color: '#ffffff', fontSize: 16, lineHeight: 21 },
  textTheirs: { color: '#111827', fontSize: 16, lineHeight: 21 },
});

Playground.navigationOptions = {
  title: 'Playground',
  tabBarLabel: 'Playground',
  tabBarIcon: ({ focused }: { focused: boolean }) => {
    return <TabIcon name="flask-outline" focused={focused} />;
  },
  tabBarBackground: () => <TabBackground />,
};
