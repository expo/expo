import { List } from '@expo/ui/components/List';
import * as React from 'react';
import { Text, Image, View } from 'react-native';

import { Page } from '../../components/Page';
import { Switch } from '@expo/ui/components/Switch';

export default function UIScreen() {
  const [count, setCount] = React.useState(0);
  return (
    <Page>
      <Switch
        label="Audio"
        value
        onValueChange={() => {
          setCount((c) => (c > 0 ? 0 : 5));
        }}
      />
      <List style={{ height: 500 }}>
        {Array.from({ length: count }).map((_, index) => (
          <View key={index} style={{ width: 200, height: 200 }}>
            <Switch
              label="Dark Mode"
              style={{ width: 300, height: 100 }}
              value
              onValueChange={() => {}}
            />
            <Text style={{ width: 100, height: 100 }} key={index + 100}>
              Item {index}
            </Text>
          </View>
        ))}
        {Array.from({ length: count }).map((_, index) => (
          <Text style={{ width: 100, height: 100 }} key={index + 100}>
            Item {index}
          </Text>
        ))}
      </List>
    </Page>
  );
}
