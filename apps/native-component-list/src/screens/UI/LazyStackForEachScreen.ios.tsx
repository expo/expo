import {
  Button,
  Host,
  HStack,
  LazyHStack,
  LazyVStack,
  RoundedRectangle,
  ScrollView,
  Spacer,
  Text,
  Toggle,
  VStack,
} from '@expo/ui/swift-ui';
import {
  background,
  buttonStyle,
  font,
  foregroundStyle,
  frame,
  padding,
  shapes,
} from '@expo/ui/swift-ui/modifiers';
import { useCallback, useState } from 'react';
import { PlatformColor } from 'react-native';

const MESSAGES = Array.from({ length: 5_000 }, (_, index) => ({
  id: `message-${index}`,
  index,
  text: [
    'Are we still meeting for coffee?',
    'Yes! I found a place near the park. We can walk over afterward if the weather holds.',
    'Things to bring:\nCamera\nA warm jacket\nSomething for the picnic',
    'Sounds good. See you there ☕️',
  ][index % 4],
}));
const keyExtractor = (item: (typeof MESSAGES)[number]) => item.id;

const CONTACTS = Array.from({ length: 5_000 }, (_, index) => ({
  id: `contact-${index}`,
  name: `${['Ana', 'Ben', 'Chloe', 'Dev', 'Eli', 'Farah'][index % 6]} ${index + 1}`,
  color: ['#F6C1C1', '#C1D9F6', '#C7EBD1', '#F6E3B4', '#E2CDF6', '#F6D1E8'][index % 6],
}));
const contactKey = (item: (typeof CONTACTS)[number]) => item.id;

function renderContact({ item }: { item: (typeof CONTACTS)[number] }) {
  return (
    <VStack spacing={6} modifiers={[frame({ width: 72 })]}>
      <RoundedRectangle
        cornerRadius={28}
        modifiers={[foregroundStyle(item.color), frame({ width: 56, height: 56 })]}
      />
      <Text modifiers={[font({ textStyle: 'caption' })]}>{item.name}</Text>
    </VStack>
  );
}

export default function LazyStackForEachScreen() {
  const [saved, setSaved] = useState<ReadonlySet<string>>(() => new Set());
  const [largeBuffer, setLargeBuffer] = useState(false);
  const [reversed, setReversed] = useState(false);
  const [items, setItems] = useState(() => MESSAGES);

  const renderItem = useCallback(
    ({ item }: { item: (typeof MESSAGES)[number] }) => (
      <VStack
        alignment="leading"
        spacing={8}
        modifiers={[
          padding({ all: 16 }),
          frame({ maxWidth: Infinity, alignment: 'leading' }),
          background(
            PlatformColor('secondarySystemGroupedBackground'),
            shapes.roundedRectangle({ cornerRadius: 12 })
          ),
        ]}>
        <HStack spacing={12}>
          <Text modifiers={[font({ textStyle: 'headline' })]}>{`Message ${item.index + 1}`}</Text>
          <Spacer />
          <Button
            label={saved.has(item.id) ? 'Unsave' : 'Save'}
            modifiers={[buttonStyle('bordered')]}
            onPress={() =>
              setSaved((previous) => {
                const next = new Set(previous);
                if (next.has(item.id)) next.delete(item.id);
                else next.add(item.id);
                return next;
              })
            }
          />
        </HStack>
        <Text modifiers={[font({ textStyle: 'body' })]}>{item.text}</Text>
        {saved.has(item.id) && (
          <Text
            modifiers={[
              font({ textStyle: 'caption' }),
              foregroundStyle(PlatformColor('systemOrange')),
            ]}>
            Saved for later
          </Text>
        )}
      </VStack>
    ),
    [saved]
  );

  return (
    <Host style={{ flex: 1 }}>
      <VStack spacing={0} modifiers={[background(PlatformColor('systemGroupedBackground'))]}>
        <ScrollView axes="horizontal" modifiers={[frame({ height: 104 })]}>
          <LazyHStack spacing={8} modifiers={[padding({ horizontal: 16 })]}>
            <LazyHStack.ForEach
              data={CONTACTS}
              keyExtractor={contactKey}
              overscanCount={6}
              estimatedItemSize={72}>
              {renderContact}
            </LazyHStack.ForEach>
          </LazyHStack>
        </ScrollView>
        <VStack spacing={12} modifiers={[padding({ horizontal: 16, vertical: 12 })]}>
          <HStack spacing={12}>
            <Text modifiers={[font({ textStyle: 'title3', weight: 'bold' })]}>
              {`${items.length.toLocaleString()} messages · ${saved.size} saved`}
            </Text>
            <Spacer />
            <Button
              label={reversed ? 'Restore order' : 'Reverse order'}
              modifiers={[buttonStyle('bordered')]}
              onPress={() => {
                setReversed((value) => !value);
                setItems((value) => [...value].reverse());
              }}
            />
          </HStack>
          <Toggle isOn={largeBuffer} onIsOnChange={setLargeBuffer}>
            <Text>{`${largeBuffer ? 20 : 10} extra rows per side`}</Text>
          </Toggle>
        </VStack>
        <ScrollView>
          <LazyVStack spacing={12} modifiers={[padding({ horizontal: 16 })]}>
            <Text modifiers={[font({ textStyle: 'footnote' })]}>
              Save a message, scroll away, and come back. Your bookmarks stay.
            </Text>
            <LazyVStack.ForEach
              data={items}
              keyExtractor={keyExtractor}
              overscanCount={largeBuffer ? 20 : 10}
              estimatedItemSize={110}>
              {renderItem}
            </LazyVStack.ForEach>
            <Text modifiers={[font({ textStyle: 'footnote' })]}>You’re all caught up.</Text>
          </LazyVStack>
        </ScrollView>
      </VStack>
    </Host>
  );
}

LazyStackForEachScreen.navigationOptions = {
  title: 'LazyVStack.ForEach and LazyHStack.ForEach',
};
