import { Button, Host, List, RNHostView, Text as SwiftUIText, VStack } from '@expo/ui/swift-ui';
import { buttonStyle, environment, opacity } from '@expo/ui/swift-ui/modifiers';
import { useTheme } from 'ThemeProvider';
import { useCallback, useState } from 'react';
import { Button as RNButton, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ListGalleryExample from './list-gallery-example';

type Item = { id: string };
const makeItems = (count: number): Item[] =>
  Array.from({ length: count }, (_, index) => ({ id: String(index) }));
const keyExtractor = (item: Item) => item.id;

function Row({ item }: { item: Item }) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  return (
    <VStack alignment="leading" spacing={8}>
      <Button
        label={`Row ${item.id} · ${expanded ? 'Collapse' : 'Expand'}`}
        modifiers={[buttonStyle('borderless')]}
        onPress={() => setExpanded((value) => !value)}
      />
      <SwiftUIText>
        {'Variable-height SwiftUI content. '.repeat((Number(item.id) % 3) + 1)}
      </SwiftUIText>
      <RNHostView matchContents>
        <View
          style={{
            width: 260,
            padding: 12,
            backgroundColor: theme.background.element,
            borderRadius: 8,
          }}>
          <Text style={{ color: theme.text.default }}>
            {expanded
              ? 'Expanded React Native content. '.repeat(12)
              : 'Measured React Native content.'}
          </Text>
        </View>
      </RNHostView>
    </VStack>
  );
}

export default function ListWindowedScreen() {
  const { theme } = useTheme();
  const [gallery, setGallery] = useState(false);
  return (
    <View style={{ flex: 1, backgroundColor: theme.background.default }}>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, padding: 8 }}>
        <RNButton title="Rows" disabled={!gallery} onPress={() => setGallery(false)} />
        <RNButton title="Gallery" disabled={gallery} onPress={() => setGallery(true)} />
      </View>
      {gallery ? <ListGalleryExample /> : <WindowedRowsExample />}
    </View>
  );
}

function WindowedRowsExample() {
  const { theme } = useTheme();
  const [items, setItems] = useState(() => makeItems(200));
  const [nextId, setNextId] = useState(200);
  const [editing, setEditing] = useState(false);
  const renderItem = useCallback((item: Item) => <Row item={item} />, []);
  const handleDelete = useCallback((indices: number[]) => {
    const removed = new Set(indices);
    setItems((current) => current.filter((_, index) => !removed.has(index)));
  }, []);
  const handleMove = useCallback((sourceIndices: number[], destination: number) => {
    setItems((current) => {
      const sources = new Set(sourceIndices);
      const moved = current.filter((_, index) => sources.has(index));
      const remaining = current.filter((_, index) => !sources.has(index));
      // SwiftUI's destination is an insertion offset in the original array.
      const target = destination - sourceIndices.filter((index) => index < destination).length;
      remaining.splice(target, 0, ...moved);
      return remaining;
    });
  }, []);
  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: theme.background.default }}>
      <View style={{ padding: 16, gap: 8 }}>
        <Text style={{ color: theme.text.default }}>
          {items.length} rows · windowed List.ForEach
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <RNButton
            title={editing ? 'Done editing' : 'Edit rows'}
            onPress={() => setEditing((value) => !value)}
          />
          <RNButton
            title="Append 20"
            onPress={() => {
              const added = Array.from({ length: 20 }, (_, index) => ({
                id: String(nextId + index),
              }));
              setItems((current) => [...current, ...added]);
              setNextId((value) => value + 20);
            }}
          />
          <RNButton title="Remove first" onPress={() => setItems((current) => current.slice(1))} />
          <RNButton
            title="Clear / reset"
            onPress={() => {
              setItems((current) => (current.length ? [] : makeItems(200)));
              setNextId(200);
            }}
          />
        </View>
        <Text style={{ color: theme.text.secondary }}>
          Swipe to delete. Edit to reorder; rows dim to exercise ForEach modifiers. Tap a row to
          change its height. Local row state resets after eviction.
        </Text>
      </View>
      <Host style={{ flex: 1 }}>
        <List modifiers={[environment('editMode', editing ? 'active' : 'inactive')]}>
          <List.ForEach
            data={items}
            keyExtractor={keyExtractor}
            estimatedRowHeight={160}
            onDelete={handleDelete}
            onMove={handleMove}
            testID="windowed-rows"
            modifiers={[opacity(editing ? 0.85 : 1)]}>
            {renderItem}
          </List.ForEach>
        </List>
      </Host>
    </SafeAreaView>
  );
}

ListWindowedScreen.navigationOptions = { title: 'List — windowed rendering' };
