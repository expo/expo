import * as DevMenu from 'expo-dev-menu';
import React, { useCallback, useEffect, useState } from 'react';
import { Button, Text, View, useColorScheme } from 'react-native';

export default function DevMenuScreen() {
  const color = useColorScheme() === 'dark' ? '#fff' : '#000';
  const [lastAction, setLastAction] = useState('None');

  const registerItems = useCallback(
    () =>
      DevMenu.registerDevMenuItems([
        {
          name: 'Preview welcome',
          group: 'Previews',
          icon: { ios: 'sparkles', android: 'lightbulb' },
          shouldCollapse: false,
          callback: () => setLastAction('Preview welcome'),
        },
        {
          name: 'Switch account',
          group: 'Account',
          icon: { ios: 'person.crop.circle', android: 'gear_fill' },
          shouldCollapse: true,
          callback: () => setLastAction('Switch account'),
        },
        {
          name: 'Preview card',
          group: 'Previews',
          icon: { ios: 'rectangle.portrait', android: 'layers' },
          shouldCollapse: true,
          callback: () => setLastAction('Preview card'),
        },
        {
          name: 'Legacy action',
          shouldCollapse: true,
          callback: () => setLastAction('Legacy action'),
        },
        {
          name: 'Missing icon',
          group: 'Account',
          icon: { android: 'missing_dev_menu_icon' },
          shouldCollapse: true,
          callback: () => setLastAction('Missing icon'),
        },
      ]),
    []
  );

  useEffect(() => {
    registerItems();
    return () => {
      DevMenu.registerDevMenuItems([]);
    };
  }, [registerItems]);

  return (
    <View style={{ padding: 20, gap: 8 }}>
      <Text style={{ color }}>Custom dev menu items</Text>
      <Text style={{ color }}>Last action: {lastAction}</Text>
      <Button title="Open dev menu" onPress={() => DevMenu.openMenu()} />
      <Button
        title="Register legacy items"
        onPress={() =>
          DevMenu.registerDevMenuItems([
            {
              name: 'Legacy one',
              callback: () => setLastAction('Legacy one'),
              shouldCollapse: true,
            },
            {
              name: 'Legacy two',
              callback: () => setLastAction('Legacy two'),
              shouldCollapse: true,
            },
          ])
        }
      />
      <Button title="Register grouped items" onPress={registerItems} />
      <Button title="Clear custom items" onPress={() => DevMenu.registerDevMenuItems([])} />
    </View>
  );
}

DevMenuScreen.navigationOptions = { title: 'Dev Menu' };
