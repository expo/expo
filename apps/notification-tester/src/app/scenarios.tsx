import * as Notifications from 'expo-notifications';
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
          Notifications.subscribeToTopicAsync('news')
            .then(() => {
              alert('subscribed to topic "news"');
            })
            .catch(console.error);
        }}
        title="Subscribe to Topic, Send Notification manually from firebase console"
      />
    </ScrollView>
  );
}
