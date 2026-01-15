import {
  Button,
  ForEach,
  Host,
  Label,
  List,
  Picker,
  Section,
  Text,
  Toggle,
} from '@expo/ui/swift-ui';
import {
  animation,
  foregroundStyle,
  Animation,
  type ListStyle,
  listStyle,
  pickerStyle,
  refreshable,
  EnvironmentKey,
  tag,
  environment,
} from '@expo/ui/swift-ui/modifiers';
import type { SFSymbol } from 'expo-symbols';
import * as React from 'react';

type ListItem = {
  id: string;
  title: string;
  icon: SFSymbol;
};

const INITIAL_ITEMS: ListItem[] = [
  { id: '1', title: 'Sun', icon: 'sun.max.fill' },
  { id: '2', title: 'Moon', icon: 'moon.fill' },
  { id: '3', title: 'Star', icon: 'star.fill' },
  { id: '4', title: 'Cloud', icon: 'cloud.fill' },
  { id: '5', title: 'Rain', icon: 'cloud.rain.fill' },
];

const LIST_STYLES: ListStyle[] = [
  'automatic',
  'plain',
  'inset',
  'insetGrouped',
  'grouped',
  'sidebar',
];

export default function ListScreen() {
  const [items, setItems] = React.useState<ListItem[]>(INITIAL_ITEMS);
  const [selectedIds, setSelectedIds] = React.useState<string[]>(['1']);
  const [editMode, setEditMode] = React.useState(false);
  const [listStyleIndex, setListStyleIndex] = React.useState(0);

  const handleDelete = (indices: number[]) => {
    setItems((prev) => prev.filter((_, i) => !indices.includes(i)));
  };

  const handleMove = (sourceIndices: number[], destination: number) => {
    setItems((prev) => {
      const newItems = [...prev];
      const [removed] = newItems.splice(sourceIndices[0], 1);
      const adjustedDest = sourceIndices[0] < destination ? destination - 1 : destination;
      newItems.splice(adjustedDest, 0, removed);
      return newItems;
    });
  };

  const handleRefresh = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setItems(INITIAL_ITEMS);
  };

  const resetItems = () => setItems(INITIAL_ITEMS);
  const clearSelection = () => setSelectedIds([]);

  return (
    <Host style={{ flex: 1 }}>
      <List
        selection={selectedIds}
        onSelectionChange={(ids) => setSelectedIds(ids.map((id) => id.toString()))}
        modifiers={[
          listStyle(LIST_STYLES[listStyleIndex]),
          refreshable(handleRefresh),
          animation(Animation.default, editMode),
          environment(EnvironmentKey.editMode, editMode ? 'active' : 'inactive'),
        ]}>
        <Section title="Settings">
          <Toggle label="Edit Mode" isOn={editMode} onIsOnChange={setEditMode} />
          <Picker
            label="List Style"
            selection={listStyleIndex}
            onSelectionChange={setListStyleIndex}
            modifiers={[pickerStyle('menu')]}>
            {LIST_STYLES.map((style, i) => (
              <Text key={style} modifiers={[tag(i)]}>
                {style}
              </Text>
            ))}
          </Picker>
          <Button label="Reset Items" onPress={resetItems} />
          <Button label="Clear Selection" onPress={clearSelection} />
        </Section>

        <Section title="Info">
          <Label title={`${items.length} items`} systemImage="number" />
          <Label
            title={selectedIds.length > 0 ? `Selected: ${selectedIds.join(', ')}` : 'None selected'}
            systemImage="checkmark.circle"
            modifiers={[foregroundStyle(selectedIds.length > 0 ? 'blue' : 'gray')]}
          />
        </Section>

        <Section title="Items" footer={<Text>Swipe to delete, drag to reorder</Text>}>
          <ForEach
            onDelete={handleDelete}
            onMove={handleMove}
            modifiers={[animation(Animation.default, editMode)]}>
            {items.map((item) => (
              <Label
                key={item.id}
                title={item.title}
                systemImage={item.icon}
                modifiers={[tag(item.id)]}
              />
            ))}
          </ForEach>
        </Section>
      </List>
    </Host>
  );
}
