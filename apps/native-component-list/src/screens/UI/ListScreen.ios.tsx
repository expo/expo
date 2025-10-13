import {
  Button,
  ColorPicker,
  Host,
  HStack,
  Image,
  Label,
  List,
  type ListStyle,
  Picker,
  Section,
  Switch,
  Text,
} from '@expo/ui/swift-ui';
import {
  background,
  clipShape,
  disabled,
  frame,
  headerProminence,
  padding,
  scrollDismissesKeyboard,
} from '@expo/ui/swift-ui/modifiers';
import { useNavigation } from '@react-navigation/native';
import type { SFSymbol } from 'expo-symbols';
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
  const [increasedHeader, setIncreasedHeader] = React.useState(false);
  const [collapsible, setCollapsible] = React.useState<boolean>(false);
  const [customHeaderFooter, setCustomHeaderFooter] = React.useState<{
    header: boolean;
    footer: boolean;
  }>({ header: false, footer: false });

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
          headerProminence(increasedHeader ? 'increased' : 'standard'),
        ]}
        deleteEnabled={deleteEnabled}
        selectEnabled={selectEnabled}>
        <Section collapsible={collapsible} title="Collapsible section" footer="Footer text">
          {customHeaderFooter.header && (
            <Section.Header>
              <HStack modifiers={[background('red'), clipShape('roundedRectangle')]}>
                <HStack modifiers={[padding({ all: 8 })]}>
                  <Image systemName="list.bullet" color="white" size={22} />
                  <Text color="white" size={16}>
                    Custom header
                  </Text>
                </HStack>
              </HStack>
            </Section.Header>
          )}
          {customHeaderFooter.footer && (
            <Section.Footer>
              <HStack modifiers={[background('red'), clipShape('roundedRectangle')]}>
                <Text size={16} color="white" modifiers={[padding({ all: 8 })]}>
                  Custom Footer
                </Text>
              </HStack>
            </Section.Footer>
          )}
          <Section.Content>
            <Text size={17}>Some text!</Text>
            <Switch
              label="Use increased section header"
              value={increasedHeader}
              onValueChange={setIncreasedHeader}
            />
            <Switch label="Collapsible" value={collapsible} onValueChange={setCollapsible} />
            <Switch
              label="Custom header"
              value={customHeaderFooter.header}
              onValueChange={(v) => setCustomHeaderFooter((prev) => ({ ...prev, header: v }))}
            />
            <Switch
              label="Custom footer"
              value={customHeaderFooter.footer}
              onValueChange={(v) => setCustomHeaderFooter((prev) => ({ ...prev, footer: v }))}
              modifiers={[disabled(collapsible)]}
            />
          </Section.Content>
        </Section>
        <Section title="Controls" collapsible>
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
            <Label
              key={index}
              modifiers={[frame({ height: 24 })]}
              title={item.text}
              systemImage={item.systemImage}
              color={color}
            />
          ))}
        </Section>
      </List>
    </Host>
  );
}
