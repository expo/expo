import { Host, LazyList, RNHostView } from '@expo/ui/swift-ui';
import { FlashList } from '@shopify/flash-list';
import { TabBackground } from 'native-component-list/src/components/TabBackground';
import TabIcon from 'native-component-list/src/components/TabIcon';
import { useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text as RNText, View } from 'react-native';

// Scratch screen for isolating reproductions. Replace the contents with your repro code and open it
// from the Playground tab. Revert your changes before committing unrelated work.

// A/B comparison: the same chat list of real RN views rendered by our expo-ui LazyList (each row
// hosted via RNHostView) vs FlashList. Switch tabs and fling each to compare scroll performance.
const COUNT = 1000;
const SCREEN_WIDTH = Dimensions.get('window').width;

type ChatItem = {
  id: number;
  text: string;
  mine: boolean;
};

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

function makeItem(id: number): ChatItem {
  return {
    id,
    text: `${id + 1}. ${messageFor(id)}`,
    mine: id % 3 !== 0,
  };
}

function makeInitialData(): ChatItem[] {
  return Array.from({ length: COUNT }, (_, i) => makeItem(i));
}

// expo-ui LazyList — real RN views hosted per row via RNHostView (matchContents), so heights vary
// with message length. Data-driven so onSelect (tap) and onDelete (swipe-to-delete) can be exercised.
function LazyListDemo({
  data,
  onDelete,
}: {
  data: ChatItem[];
  onDelete: (indices: number[]) => void;
}) {
  return (
    <Host style={{ flex: 1 }} ignoreSafeArea="all">
      <LazyList
        count={data.length}
        estimatedItemSize={64}
        keyExtractor={(index) => String(data[index]?.id ?? index)}
        onSelect={(index) => console.log('selected', data[index]?.id)}
        onDelete={onDelete}
        renderItem={(index) => {
          const item = data[index];
          const mine = item?.mine ?? false;
          return (
            <RNHostView matchContents>
              <View style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <RNText style={mine ? styles.textMine : styles.textTheirs}>
                    {item?.text ?? '—'}
                  </RNText>
                </View>
              </View>
            </RNHostView>
          );
        }}
      />
    </Host>
  );
}

// FlashList — equivalent React Native View/Text bubbles.
function FlashListDemo({ data }: { data: ChatItem[] }) {
  return (
    <FlashList
      data={data}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => {
        const mine = item.mine;
        return (
          <View style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
            <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
              <RNText style={mine ? styles.textMine : styles.textTheirs}>{item.text}</RNText>
            </View>
          </View>
        );
      }}
    />
  );
}

export default function Playground() {
  const [tab, setTab] = useState<'lazy' | 'flash'>('lazy');
  const [data, setData] = useState(makeInitialData);
  const nextId = useRef(COUNT);

  const addCell = () => {
    const id = nextId.current++;
    setData((prev) => [makeItem(id), ...prev]);
  };

  const removeCell = () => {
    setData((prev) => prev.slice(1));
  };

  const deleteCells = (indices: number[]) => {
    const remove = new Set(indices);
    setData((prev) => prev.filter((_, i) => !remove.has(i)));
  };

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
      <View style={styles.controls}>
        <Pressable style={styles.controlButton} onPress={addCell}>
          <RNText style={styles.controlButtonText}>Add Cell</RNText>
        </Pressable>
        <Pressable
          disabled={data.length === 0}
          style={[
            styles.controlButton,
            styles.removeButton,
            data.length === 0 && styles.controlButtonDisabled,
          ]}
          onPress={removeCell}>
          <RNText
            style={[
              styles.controlButtonText,
              data.length === 0 && styles.controlButtonTextDisabled,
            ]}>
            Remove Cell
          </RNText>
        </Pressable>
        <RNText style={styles.countText}>{data.length} cells</RNText>
      </View>
      <View style={styles.list}>
        {tab === 'lazy' ? (
          <LazyListDemo data={data} onDelete={deleteCells} />
        ) : (
          <FlashListDemo data={data} />
        )}
      </View>
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
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  controlButton: {
    borderRadius: 8,
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  removeButton: { backgroundColor: '#111827' },
  controlButtonDisabled: { backgroundColor: '#d1d5db' },
  controlButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  controlButtonTextDisabled: { color: '#6b7280' },
  countText: { marginLeft: 'auto', color: '#6b7280', fontSize: 14 },
  list: { flex: 1 },
  row: { width: SCREEN_WIDTH, flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 4 },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleMine: { backgroundColor: '#ec4899' },
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
