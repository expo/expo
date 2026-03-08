import { Host, WorkletList } from '@expo/ui/swift-ui';
import { installOnUIRuntime } from 'expo-modules-core/src/worklets';
import * as React from 'react';
import { StyleSheet, View, Text as RNText } from 'react-native';

type Item = {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
};

const ICONS = ['star.fill', 'heart.fill', 'bolt.fill', 'moon.fill', 'sun.max.fill', 'cloud.fill'];

function generateItems(count: number): Item[] {
  return Array.from({ length: count }, (_, i) => ({
    id: String(i),
    title: `Item ${i + 1}`,
    subtitle: `This is the description for item ${i + 1}`,
    iconName: ICONS[i % ICONS.length],
  }));
}

// Initialize the worklet UI runtime — required before using WorkletList.
try {
  installOnUIRuntime();
} catch (e) {
  console.warn('Failed to install UI runtime:', e);
}

// The render function source. This gets eval'd into the UI runtime (UI thread).
// `createElement` is available as a global after the runtime bootstraps.
const RENDER_ITEM_SOURCE = `(function(item, index) {
  var h = createElement;
  return h('HStack', { spacing: 12 },
    h('Image', { systemName: item.iconName, color: 'blue' }),
    h('VStack', { spacing: 2, alignment: 'leading' },
      h('Text', { content: item.title }),
      h('Text', { content: item.subtitle, color: 'gray' })
    )
  );
})`;

export default function WorkletListScreen() {
  const [items] = React.useState(() => generateItems(10_000));

  return (
    <View style={styles.container}>
      <RNText style={styles.header}>
        WorkletList — {items.length.toLocaleString()} items (UI thread rendering)
      </RNText>
      <Host style={styles.list}>
        <WorkletList data={items} renderItemSource={RENDER_ITEM_SOURCE} />
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    fontSize: 13,
    paddingVertical: 12,
    paddingHorizontal: 16,
    textAlign: 'center',
    color: '#888',
    backgroundColor: '#f8f8f8',
  },
  list: {
    flex: 1,
  },
});
