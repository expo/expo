import { Icon, List, ListItem, Row, Text } from '@expo/ui';
import { useState } from 'react';

const CHEVRON = Icon.select({
  ios: 'chevron.right',
  android: require('@expo/material-symbols/chevron_right.xml'),
});

const STAR_FILLED = Icon.select({
  ios: 'star.fill',
  android: require('@expo/material-symbols/star.xml'),
});

const INITIAL_ITEMS = [
  { id: 1, name: 'Avocado toast' },
  { id: 2, name: 'Bagel with cream cheese' },
  { id: 3, name: 'Cappuccino' },
  { id: 4, name: 'Donut' },
  { id: 5, name: 'Espresso' },
  { id: 6, name: 'French toast' },
  { id: 7, name: 'Granola' },
  { id: 8, name: 'Hash browns' },
];

export default function ListScreen() {
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [lastTapped, setLastTapped] = useState('—');

  const handleRefresh = async () => {
    // Simulate a slow fetch.
    // The refresh indicator stays visible until the returned promise resolves.
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setItems((current) => [
      { id: Math.max(...current.map((c) => c.id)) + 1, name: 'Kimchi pancake' },
      ...current,
    ]);
  };

  return (
    <List onRefresh={handleRefresh}>
      {/* — ListItem variants — */}

      <ListItem onPress={() => setLastTapped('Simple row')}>Headline only</ListItem>

      <ListItem
        onPress={() => setLastTapped('Trailing chevron')}
        trailing={<Icon name={CHEVRON} size={14} color="gray" />}>
        Trailing chevron (shorthand prop)
      </ListItem>

      <ListItem
        onPress={() => setLastTapped('With supporting text')}
        supportingText="Secondary line that wraps below the headline">
        With supporting text (shorthand prop)
      </ListItem>

      <ListItem
        onPress={() => setLastTapped('Leading + trailing + supporting')}
        leading={<Icon name={STAR_FILLED} size={20} color="#FFD60A" />}
        trailing={<Icon name={CHEVRON} size={14} color="gray" />}
        supportingText="All three slots populated (shorthand props)">
        Leading + trailing + supporting
      </ListItem>

      <ListItem onPress={() => setLastTapped('Compound slots')}>
        <ListItem.Leading>
          <Icon name={STAR_FILLED} size={20} color="#FFD60A" />
        </ListItem.Leading>
        <Row spacing={0}>
          <Text textStyle={{ color: 'gray' }}>{`#42: `}</Text>
          <Text>Slot form (compound children)</Text>
        </Row>
        <ListItem.Supporting>Richer headline composed from children</ListItem.Supporting>
        <ListItem.Trailing>
          <Icon name={CHEVRON} size={14} color="gray" />
        </ListItem.Trailing>
      </ListItem>

      <ListItem
        onPress={() => setLastTapped('Rich trailing')}
        trailing={
          <Row spacing={8} alignment="center">
            <Text textStyle={{ fontSize: 14, color: 'gray' }}>1.2 km</Text>
            <Icon name={CHEVRON} size={14} color="gray" />
          </Row>
        }>
        Rich trailing slot (Row of value + chevron)
      </ListItem>

      {/* — Pull-to-refresh + virtualized data — */}

      <ListItem supportingText={`Last tapped: ${lastTapped} · pull down to refresh`}>
        {`${items.length} items`}
      </ListItem>

      {items.map((item) => (
        <ListItem
          key={item.id}
          onPress={() => setLastTapped(item.name)}
          trailing={<Icon name={CHEVRON} size={14} color="gray" />}>
          <Text>{`#${item.id}: ${item.name}`}</Text>
        </ListItem>
      ))}
    </List>
  );
}

ListScreen.navigationOptions = {
  title: 'List',
};
