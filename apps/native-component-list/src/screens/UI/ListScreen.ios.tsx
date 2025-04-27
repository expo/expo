import {
  Button,
  ColorPicker,
  LabelPrimitive,
  List,
  ListStyle,
  Picker,
  Switch,
} from '@expo/ui/swift-ui';
import * as React from 'react';

export default function ListScreen() {
  const [color, setColor] = React.useState<string>('blue');
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(0);
  const data = [
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
  const [selectEnabled, setSelectEnabled] = React.useState<boolean>(true);
  const [deleteEnabled, setDeleteEnabled] = React.useState<boolean>(true);
  const [moveEnabled, setMoveEnabled] = React.useState<boolean>(true);
  const [editModeEnabled, setEditModeEnabled] = React.useState<boolean>(false);

  return (
    <>
      <List listStyle="automatic">
        <Button onPress={() => setEditModeEnabled(!editModeEnabled)}>Toggle Edit</Button>
        <Switch
          value={selectEnabled}
          label="Select enabled"
          onValueChange={setSelectEnabled}
          style={{
            width: 300,
            height: 100,
          }}
        />
        <Switch
          value={deleteEnabled}
          label="Delete enabled"
          onValueChange={setDeleteEnabled}
          style={{
            width: 300,
            height: 100,
          }}
        />
        <Switch
          value={moveEnabled}
          label="Move enabled"
          onValueChange={setMoveEnabled}
          style={{
            width: 300,
            height: 100,
          }}
        />
        <ColorPicker
          label="Item icon color"
          selection={color}
          supportsOpacity
          onValueChanged={setColor}
          style={{
            width: 300,
            height: 100,
          }}
        />
        <Picker
          label="List style"
          options={listStyleOptions}
          selectedIndex={selectedIndex}
          onOptionSelected={({ nativeEvent: { index } }) => {
            setSelectedIndex(index);
          }}
          variant="menu"
          style={{
            width: 300,
            height: 100,
          }}
        />
      </List>

      <List
        scrollEnabled={false}
        editModeEnabled={editModeEnabled}
        onSelectionChange={(items) => alert(`indexes of selected items: ${items.join(', ')}`)}
        moveEnabled={moveEnabled}
        onMoveItem={(from, to) => alert(`moved item at index ${from} to index ${to}`)}
        onDeleteItem={(item) => alert(`deleted item at index: ${item}`)}
        style={{ flex: 1 }}
        listStyle={listStyleOptions[selectedIndex ?? 0]}
        deleteEnabled={deleteEnabled}
        selectEnabled={selectEnabled}>
        {data.map((item, index) => (
          <LabelPrimitive
            key={index}
            title={item.text}
            systemImage={item.systemImage}
            color={color}
          />
        ))}
      </List>
    </>
  );
}

ListScreen.navigationOptions = {
  title: 'List',
};
