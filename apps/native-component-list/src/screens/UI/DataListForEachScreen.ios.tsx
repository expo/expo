import {
  Button,
  Host,
  HStack,
  Label,
  List,
  Section,
  Spacer,
  Text,
  Toggle,
  VStack,
} from '@expo/ui/swift-ui';
import {
  accessibilityLabel,
  background,
  buttonStyle,
  environment,
  font,
  foregroundStyle,
  frame,
  labelStyle,
  listStyle,
  monospacedDigit,
  padding,
  shapes,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { useCallback, useState } from 'react';
import { PlatformColor } from 'react-native';

const MESSAGES = Array.from({ length: 10_000 }, (_, index) => ({
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

export default function DataListForEachScreen() {
  const [saved, setSaved] = useState<ReadonlySet<string>>(() => new Set());
  const [largeBuffer, setLargeBuffer] = useState(false);
  const [reversed, setReversed] = useState(false);
  const [items, setItems] = useState(() => MESSAGES.slice(0, 5000));
  const [archive, setArchive] = useState(() => MESSAGES.slice(5000));
  const [selection, setSelection] = useState<(string | number)[]>([]);
  const [editing, setEditing] = useState(false);
  const group = (data: typeof MESSAGES, update: typeof setItems) => (
    <List.ForEach
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      overscanCount={largeBuffer ? 20 : 10}
      estimatedItemSize={110}
      onDelete={(indices) => update((previous) => previous.filter((_, i) => !indices.includes(i)))}
      onMove={(sources, destination) =>
        update((previous) => {
          const moved = sources.map((index) => previous[index]);
          const remaining = previous.filter((_, index) => !sources.includes(index));
          const adjusted = destination - sources.filter((index) => index < destination).length;
          return [...remaining.slice(0, adjusted), ...moved, ...remaining.slice(adjusted)];
        })
      }
    />
  );
  const renderItem = useCallback(
    ({ item }: { item: (typeof MESSAGES)[number] }) => (
      <VStack alignment="leading" spacing={10} modifiers={[padding({ vertical: 6 })]}>
        <HStack spacing={8}>
          <Label
            title={`Message ${item.index + 1}`}
            systemImage={item.index % 2 ? 'person.crop.circle' : 'bubble.left.and.bubble.right'}
            modifiers={[font({ textStyle: 'headline' })]}
          />
          <Spacer minLength={0} />
          <Button
            label={saved.has(item.id) ? 'Unsave message' : 'Save message'}
            systemImage={saved.has(item.id) ? 'bookmark.fill' : 'bookmark'}
            modifiers={[
              buttonStyle('borderless'),
              labelStyle('iconOnly'),
              tint(PlatformColor(saved.has(item.id) ? 'systemOrange' : 'secondaryLabel')),
              frame({ minWidth: 44, minHeight: 44 }),
              accessibilityLabel(
                `${saved.has(item.id) ? 'Unsave' : 'Save'} message ${item.index + 1}`
              ),
            ]}
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
          <Label
            title="Saved for later"
            systemImage="bookmark.fill"
            modifiers={[
              font({ textStyle: 'caption' }),
              foregroundStyle(PlatformColor('systemOrange')),
            ]}
          />
        )}
        {item.index % 5 === 0 && (
          <Label
            title="Weekend itinerary.pdf · 248 KB"
            systemImage="doc.text"
            modifiers={[
              font({ textStyle: 'caption' }),
              foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
              padding({ horizontal: 10, vertical: 8 }),
              background(
                PlatformColor('tertiarySystemFill'),
                shapes.roundedRectangle({ cornerRadius: 8 })
              ),
            ]}
          />
        )}
      </VStack>
    ),
    [saved]
  );

  return (
    <Host style={{ flex: 1 }}>
      <VStack spacing={0} modifiers={[background(PlatformColor('systemGroupedBackground'))]}>
        <VStack spacing={12} modifiers={[padding({ horizontal: 20, vertical: 12 })]}>
          <HStack spacing={12}>
            <Button
              label={reversed ? 'Restore order' : 'Reverse order'}
              systemImage="arrow.up.arrow.down"
              modifiers={[buttonStyle('bordered')]}
              onPress={() => {
                setReversed((value) => !value);
                setItems((value) => [...value].reverse());
                setArchive((value) => [...value].reverse());
              }}
            />
            <Spacer />
            <Button
              label={editing ? 'Done' : 'Edit'}
              systemImage={editing ? 'checkmark' : 'slider.horizontal.3'}
              modifiers={[buttonStyle(editing ? 'borderedProminent' : 'bordered')]}
              onPress={() => setEditing((value) => !value)}
            />
          </HStack>
          <Toggle isOn={largeBuffer} onIsOnChange={setLargeBuffer}>
            <Text>Larger scroll buffer</Text>
            <Text>{`${largeBuffer ? 20 : 10} extra rows on each side`}</Text>
          </Toggle>
        </VStack>
        <List
          selection={selection}
          onSelectionChange={setSelection}
          modifiers={[
            listStyle('insetGrouped'),
            environment('editMode', editing ? 'active' : 'inactive'),
          ]}>
          <Section
            footer={<Text>Save a message, scroll away, and come back. Your bookmarks stay.</Text>}>
            <VStack alignment="leading" spacing={12} modifiers={[padding({ vertical: 8 })]}>
              <Text
                modifiers={[
                  font({ textStyle: 'title2', weight: 'bold', design: 'rounded' }),
                  monospacedDigit(),
                ]}>
                {`${(items.length + archive.length).toLocaleString()} messages`}
              </Text>
              <HStack
                spacing={16}
                modifiers={[
                  font({ textStyle: 'subheadline' }),
                  foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
                ]}>
                <Label title={`${saved.size} saved`} systemImage="bookmark" />
                <Label title={`${selection.length} selected`} systemImage="checkmark.circle" />
              </HStack>
            </VStack>
          </Section>
          <Section
            title={`Inbox · ${items.length.toLocaleString()}`}
            footer={<Text>Swipe to delete. Use Edit to select messages or drag to reorder.</Text>}>
            {group(items, setItems)}
          </Section>
          <Text
            modifiers={[
              font({ textStyle: 'footnote' }),
              foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
            ]}>
            Inbox and Archive each keep their own scroll buffer.
          </Text>
          <Section title={`Archive · ${archive.length.toLocaleString()}`}>
            {group(archive, setArchive)}
          </Section>
          <Section
            footer={
              <Text>Fast scrolling may briefly show placeholders while the next rows load.</Text>
            }>
            <Label
              title="You’re all caught up"
              systemImage="checkmark.circle"
              modifiers={[foregroundStyle({ type: 'hierarchical', style: 'secondary' })]}
            />
          </Section>
        </List>
      </VStack>
    </Host>
  );
}
