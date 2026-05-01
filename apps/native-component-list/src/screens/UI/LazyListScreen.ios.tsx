import { Host, List, useNativeState } from '@expo/ui/swift-ui';
import { type LazyDescriptor } from '@expo/ui/swift-ui/lazy';
import * as React from 'react';
import { Button, View, StyleSheet, Text as RNText } from 'react-native';

type Row = {
  id: string;
  title: string;
  subtitle: string;
  starred: boolean;
};

const INITIAL_COUNT = 200;

function makeInitial(): Row[] {
  return Array.from({ length: INITIAL_COUNT }, (_, i) => ({
    id: String(i),
    title: `Row ${i}`,
    subtitle: `Subtitle for row ${i}`,
    starred: i % 5 === 0,
  }));
}

export default function LazyListScreen() {
  const data = useNativeState<Row[]>(makeInitial());
  const idCounter = React.useRef(INITIAL_COUNT);

  const renderItem = React.useCallback((item: Row, index: number): LazyDescriptor => {
    'worklet';
    return {
      type: 'HStack',
      id: item.id,
      spacing: 12,
      children: [
        {
          type: 'Image',
          systemName: item.starred ? 'star.fill' : 'star',
          foregroundColor: item.starred ? 'orange' : 'gray',
        },
        {
          type: 'VStack',
          spacing: 2,
          children: [
            { type: 'Text', value: item.title, font: 'headline' },
            {
              type: 'Text',
              value: `#${index} · ${item.subtitle}`,
              font: 'subheadline',
              foregroundColor: 'secondary',
            },
          ],
        },
      ],
    };
  }, []);

  const prepend = () => {
    const id = `new-${idCounter.current++}`;
    data.value = [
      { id, title: `Inserted ${id}`, subtitle: 'just added', starred: true },
      ...data.value,
    ];
  };

  const removeFirst = () => {
    data.value = data.value.slice(1);
  };

  const updateFirstTitle = () => {
    data.value = data.value.map((row, i) =>
      i === 0 ? { ...row, title: `${row.title}!` } : row
    );
  };

  const toggleStarOn5 = () => {
    data.value = data.value.map((row) =>
      row.id === '5' ? { ...row, starred: !row.starred } : row
    );
  };

  const shuffle = () => {
    const next = [...data.value];
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    data.value = next;
  };

  const reset = () => {
    idCounter.current = INITIAL_COUNT;
    data.value = makeInitial();
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.controls}>
        <RNText style={styles.label}>{data.value.length} rows</RNText>
        <View style={styles.row}>
          <Button title="Prepend" onPress={prepend} />
          <Button title="Remove first" onPress={removeFirst} />
          <Button title="Edit first title" onPress={updateFirstTitle} />
        </View>
        <View style={styles.row}>
          <Button title="Toggle star on #5" onPress={toggleStarOn5} />
          <Button title="Shuffle" onPress={shuffle} />
          <Button title="Reset" onPress={reset} />
        </View>
      </View>
      <Host style={{ flex: 1 }}>
        <List>
          <List.LazyWorkletForEach data={data} idKey="id" renderItem={renderItem} />
        </List>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  controls: {
    padding: 8,
    gap: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  label: {
    fontSize: 12,
    color: '#666',
  },
});
