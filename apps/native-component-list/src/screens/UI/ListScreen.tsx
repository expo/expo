import { List } from '@expo/ui/components/List';
import * as React from 'react';
import { Text, Image, View } from 'react-native';

import { Page } from '../../components/Page';
import { Switch } from '@expo/ui/components/Switch';

export default function UIScreen() {
  return (
    <Page>
      <List style={{ height: 500 }}>
        <Switch label="Audio" value onValueChange={() => {}} />
        {Array.from({ length: 10 }).map((_, index) => (
          <Text key={index}>Item {index}</Text>
        ))}
        <Switch label="Dark Mode" value onValueChange={() => {}} />
      </List>
    </Page>
  );
}
