import HeadingText from 'native-component-list/src/components/HeadingText';
import ListButton from 'native-component-list/src/components/ListButton';
import React from 'react';

import { ScrollView } from '../misc/Themed';

export default function ScenariosPage() {
  return (
    <ScrollView contentContainerStyle={{ rowGap: 10, padding: 10 }}>
      <HeadingText>Background Push Notifications</HeadingText>
      <ListButton
        onPress={() => {
          alert(`send a push notification with this payload:`);
        }}
        title="Send a push notification with a category, and observe the response value stored"
      />
    </ScrollView>
  );
}
