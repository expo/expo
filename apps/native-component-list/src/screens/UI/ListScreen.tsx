import { List, ListItem } from '@expo/ui/components/List';
import * as React from 'react';
import { Text, Image, Alert } from 'react-native';

export default function ListScreen() {
  return (
    <List style={{ flex: 1 }}>
      {Array.from({ length: 10 }).map((_, index) => (
        <ListItem
          key={index}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
          onPress={() => Alert.alert('Hello')}>
          <Image
            source={{ uri: 'https://picsum.photos/200/300' }}
            style={{ height: 50, width: 50 }}
          />
          <Text style={{ flex: 1 }}>
            Lorem ipsum, dolor sit amet consectetur adipisicing elit. Nemo seq
          </Text>
        </ListItem>
      ))}
    </List>
  );
}

ListScreen.navigationOptions = {
  title: 'List',
};
