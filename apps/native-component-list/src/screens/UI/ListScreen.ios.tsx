import {
  Button,
  Image,
  ColorPicker,
  Text,
  Host,
  HStack,
  Label,
  List,
  ListStyle,
  Picker,
  Switch,
  TextField,
  VStack,
  Section,
} from '@expo/ui/swift-ui';
import { scrollDismissesKeyboard, frame } from '@expo/ui/swift-ui/modifiers';
import { useNavigation } from '@react-navigation/native';
import { type SFSymbol } from 'expo-symbols';
import * as React from 'react';
import { useLayoutEffect } from 'react';

export default function ListScreen() {
  const [color, setColor] = React.useState<string>('blue');
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(0);
  const data: { text: string; systemImage: SFSymbol }[] = [
    { text: 'Good Morning', systemImage: 'sun.max.fill' },
    { text: 'Weather', systemImage: 'cloud.sun.fill' },
    { text: 'Settings', systemImage: 'gearshape.fill' },
    { text: 'Music', systemImage: 'music.note' },
    { text: 'Home', systemImage: 'house.circle.fill' },
    { text: 'Location', systemImage: 'location.fill' },
  ];
  const listStyleOptions: ListStyle[] = [
    'automatic',
    'plain',
    'inset',
    'insetGrouped',
    'grouped',
    'sidebar',
  ];
  const scrollDismissesKeyboardOptions = [
    'automatic',
    'never',
    'interactively',
    'immediately',
  ] as const;
  const [selectEnabled, setSelectEnabled] = React.useState<boolean>(true);
  const [deleteEnabled, setDeleteEnabled] = React.useState<boolean>(true);
  const [moveEnabled, setMoveEnabled] = React.useState<boolean>(true);
  const [editModeEnabled, setEditModeEnabled] = React.useState<boolean>(false);
  const [scrollDismissesKeyboardIndex, setScrollDismissesKeyboardIndex] = React.useState<
    number | null
  >(0);

  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'List',
      headerSearchBarOptions: {
        placeholder: 'Test different keyboard dismissals',
      },
    });
  }, [navigation]);

  return (
    <Host style={{ flex: 1 }}>
      <List
        editModeEnabled={editModeEnabled}
        onSelectionChange={(items) => alert(`indexes of selected items: ${items.join(', ')}`)}
        moveEnabled={moveEnabled}
        onMoveItem={(from, to) => alert(`moved item at index ${from} to index ${to}`)}
        onDeleteItem={(item) => alert(`deleted item at index: ${item}`)}
        listStyle={listStyleOptions[selectedIndex ?? 0]}
        modifiers={[
          scrollDismissesKeyboard(
            scrollDismissesKeyboardOptions[scrollDismissesKeyboardIndex ?? 0]
          ),
        ]}
        deleteEnabled={deleteEnabled}
        selectEnabled={selectEnabled}>
        <Section title="Controls">
          <Button onPress={() => setEditModeEnabled(!editModeEnabled)}>Toggle Edit</Button>
          <Switch value={selectEnabled} label="Select enabled" onValueChange={setSelectEnabled} />
          <Switch value={deleteEnabled} label="Delete enabled" onValueChange={setDeleteEnabled} />
          <Switch value={moveEnabled} label="Move enabled" onValueChange={setMoveEnabled} />
          <ColorPicker
            label="Item icon color"
            selection={color}
            supportsOpacity
            onValueChanged={setColor}
          />
          <Picker
            label="Scroll dismisses keyboard"
            options={[...scrollDismissesKeyboardOptions]}
            selectedIndex={scrollDismissesKeyboardIndex}
            onOptionSelected={({ nativeEvent: { index } }) => {
              setScrollDismissesKeyboardIndex(index);
            }}
            variant="menu"
          />
          <Picker
            label="List style"
            options={listStyleOptions}
            selectedIndex={selectedIndex}
            onOptionSelected={({ nativeEvent: { index } }) => {
              setSelectedIndex(index);
            }}
            variant="menu"
          />
        </Section>
        <Section title="Data">
          {data.map((item, index) => (
            <HStack key={index}>
              <Label
                modifiers={[frame({ height: 24 })]}
                title={item.text}
                systemImage={item.systemImage}
                color={color}
              />
              <Text>{item.text}</Text>
            </HStack>
          ))}
        </Section>
      </List>
    </Host>
  );
}
