import { Host, LazyList, RNHostView } from '@expo/ui/swift-ui';
import { TabBackground } from 'native-component-list/src/components/TabBackground';
import TabIcon from 'native-component-list/src/components/TabIcon';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

// Scratch screen for isolating reproductions. Replace the contents with your repro code and open it
// from the Playground tab. Revert your changes before committing unrelated work.

// Dynamic-height chat list of real RN views hosted per row via RNHostView (matchContents). Message
// lengths vary widely, so this exercises the pull-based sizeThatFits sizing path.
const SCREEN_WIDTH = Dimensions.get('window').width;

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

export default function Playground() {
  return (
    <Host style={{ flex: 1 }} ignoreSafeArea="all">
      <LazyList
        count={1000}
        estimatedItemSize={64}
        renderItem={(index) => {
          const mine = index % 3 !== 0;
          return (
            <RNHostView matchContents>
              <View style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={mine ? styles.textMine : styles.textTheirs}>
                    {`${index + 1}. ${messageFor(index)}`}
                  </Text>
                </View>
              </View>
            </RNHostView>
          );
        }}
      />
    </Host>
  );
}

const styles = StyleSheet.create({
  row: {
    width: SCREEN_WIDTH,
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleMine: { backgroundColor: '#2563eb', borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: '#e5e7eb', borderBottomLeftRadius: 4 },
  textMine: { color: 'white', fontSize: 16, lineHeight: 21 },
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
