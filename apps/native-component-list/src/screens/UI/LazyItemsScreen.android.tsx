import {
  Button,
  Column,
  Host,
  LazyColumn,
  LazyRow,
  Row,
  Spacer,
  Switch,
  Text,
} from '@expo/ui/jetpack-compose';
import {
  background,
  clip,
  fillMaxWidth,
  height,
  padding,
  paddingAll,
  Shapes,
  size,
  weight,
  width,
} from '@expo/ui/jetpack-compose/modifiers';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

const MESSAGES = Array.from({ length: 5_000 }, (_, index) => ({
  id: `message-${index}`,
  index,
  text: [
    'Are we still meeting for coffee?',
    'Yes! I found a place near the park. We can walk over afterward if the weather holds.',
    'Things to bring:\nCamera\nA warm jacket\nSomething for the picnic',
    'Sounds good. See you there.',
  ][index % 4],
}));
const keyExtractor = (item: (typeof MESSAGES)[number]) => item.id;

const CONTACTS = Array.from({ length: 5_000 }, (_, index) => ({
  id: `contact-${index}`,
  name: `${['Ana', 'Ben', 'Chloe', 'Dev', 'Eli', 'Farah'][index % 6]} ${index + 1}`,
  color: ['#F6C1C1', '#C1D9F6', '#C7EBD1', '#F6E3B4', '#E2CDF6', '#F6D1E8'][index % 6],
}));
const contactKey = (item: (typeof CONTACTS)[number]) => item.id;

// Rows of a LazyRow need a bounded height, so the row itself gets a fixed height below.
function renderContact({ item }: { item: (typeof CONTACTS)[number] }) {
  return (
    <Column
      horizontalAlignment="center"
      verticalArrangement={{ spacedBy: 6 }}
      modifiers={[width(88)]}>
      <Column modifiers={[size(56, 56), clip(Shapes.Circle), background(item.color)]} />
      <Text style={{ typography: 'labelMedium' }}>{item.name}</Text>
    </Column>
  );
}

export default function LazyItemsScreen() {
  const [saved, setSaved] = useState<ReadonlySet<string>>(() => new Set());
  const [largeBuffer, setLargeBuffer] = useState(false);
  const [reversed, setReversed] = useState(false);
  const [items, setItems] = useState(() => MESSAGES);

  const renderItem = useCallback(
    ({ item }: { item: (typeof MESSAGES)[number] }) => (
      <Column
        verticalArrangement={{ spacedBy: 8 }}
        modifiers={[fillMaxWidth(), padding(16, 12, 16, 12)]}>
        <Row verticalAlignment="center" horizontalArrangement={{ spacedBy: 12 }}>
          <Text style={{ typography: 'titleMedium' }}>{`Message ${item.index + 1}`}</Text>
          <Spacer modifiers={[weight(1)]} />
          <Button
            onClick={() =>
              setSaved((previous) => {
                const next = new Set(previous);
                if (next.has(item.id)) next.delete(item.id);
                else next.add(item.id);
                return next;
              })
            }>
            <Text>{saved.has(item.id) ? 'Unsave' : 'Save'}</Text>
          </Button>
        </Row>
        <Text style={{ typography: 'bodyMedium' }}>{item.text}</Text>
        {saved.has(item.id) && (
          <Text
            style={{ typography: 'labelMedium' }}
            modifiers={[
              clip(Shapes.RoundedCorner(8)),
              background('#FFE7BA'),
              padding(10, 6, 10, 6),
            ]}>
            Saved for later
          </Text>
        )}
        {item.index % 5 === 0 && (
          <Text style={{ typography: 'labelSmall' }}>Weekend itinerary.pdf · 248 KB</Text>
        )}
      </Column>
    ),
    [saved]
  );

  return (
    <View style={{ flex: 1 }}>
      <Host style={{ flex: 1 }}>
        <Column modifiers={[fillMaxWidth()]}>
          <LazyRow
            modifiers={[fillMaxWidth(), height(96)]}
            verticalAlignment="center"
            horizontalArrangement={{ spacedBy: 8 }}
            contentPadding={{ start: 16, end: 16 }}>
            <LazyRow.Items
              data={CONTACTS}
              keyExtractor={contactKey}
              overscanCount={6}
              estimatedItemSize={88}>
              {renderContact}
            </LazyRow.Items>
          </LazyRow>
          <Column modifiers={[paddingAll(16)]} verticalArrangement={{ spacedBy: 8 }}>
            <Text style={{ typography: 'titleLarge' }}>
              {`${items.length.toLocaleString()} messages · ${saved.size} saved`}
            </Text>
            <Row verticalAlignment="center" horizontalArrangement={{ spacedBy: 12 }}>
              <Button
                onClick={() => {
                  setReversed((value) => !value);
                  setItems((value) => [...value].reverse());
                }}>
                <Text>{reversed ? 'Restore order' : 'Reverse order'}</Text>
              </Button>
              <Spacer modifiers={[weight(1)]} />
              <Text style={{ typography: 'bodySmall' }}>
                {`${largeBuffer ? 20 : 10} extra rows per side`}
              </Text>
              <Switch value={largeBuffer} onCheckedChange={setLargeBuffer} />
            </Row>
          </Column>
          <LazyColumn modifiers={[weight(1)]}>
            <Text style={{ typography: 'bodySmall' }} modifiers={[paddingAll(16)]}>
              Save a message, scroll away, and come back. Your bookmarks stay.
            </Text>
            <LazyColumn.Items
              data={items}
              keyExtractor={keyExtractor}
              overscanCount={largeBuffer ? 20 : 10}
              estimatedItemSize={110}>
              {renderItem}
            </LazyColumn.Items>
            <Text style={{ typography: 'bodySmall' }} modifiers={[paddingAll(16)]}>
              You’re all caught up.
            </Text>
          </LazyColumn>
        </Column>
      </Host>
    </View>
  );
}

LazyItemsScreen.navigationOptions = {
  title: 'LazyColumn.Items and LazyRow.Items',
};
