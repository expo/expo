import * as React from 'react';
import { List, DataList, ListStyle } from '@expo/ui/components/List';
import { Label } from '@expo/ui/components/Label';
import { Button } from '@expo/ui/components/Button';
import { ColorPicker } from '@expo/ui/components/ColorPicker';
import { Picker } from '@expo/ui/components/Picker';
import { Switch } from '@expo/ui/components/Switch';

export default function ListScreen() {
  const [color, setColor] = React.useState<string | null>('blue');
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(0);
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
      <List listStyle="automatic" editModeEnabled={editModeEnabled}>
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

      <DataList
        scrollEnabled={false}
        editModeEnabled={editModeEnabled}
        onSelectionChange={(event) =>
          alert(`indexes of selected items: ${event.nativeEvent?.selection.join(', ')}`)
        }
        moveEnabled={moveEnabled}
        onMoveItem={(event) =>
          alert(`moved item at index ${event.nativeEvent.from} to index ${event.nativeEvent.to}`)
        }
        onDeleteItem={(event) => alert(`deleted item at index: ${event.nativeEvent.index}`)}
        style={{ flex: 1 }}
        listStyle={listStyleOptions[selectedIndex ?? 0]}
        deleteEnabled={deleteEnabled}
        selectEnabled={selectEnabled}
        data={[
          { text: 'Good Morning', systemImage: 'sun.max.fill' },
          { text: 'Weather', systemImage: 'cloud.sun.fill' },
          { text: 'Settings', systemImage: 'gearshape.fill' },
          { text: 'Music', systemImage: 'music.note' },
          { text: 'Home', systemImage: 'house.circle.fill' },
          { text: 'Location', systemImage: 'location.fill' },
        ]}
        renderItem={({ item }) => (
          <Label color={color!} title={item.text} systemImage={item.systemImage} />
        )}
      />
    </>
  );
}

ListScreen.navigationOptions = {
  title: 'List',
};
