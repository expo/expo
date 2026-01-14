import * as Notifications from 'expo-notifications';
import { sendPushNotificationsAsync } from 'native-component-list/src/api/sendPushNotificationsAsync';
import HeadingText from 'native-component-list/src/components/HeadingText';
import ListButton from 'native-component-list/src/components/ListButton';
import React from 'react';

import { ScrollView } from '../misc/Themed';

export default function ScenariosPage() {
  return (
    <ScrollView contentContainerStyle={{ rowGap: 10, padding: 10 }}>
      <HeadingText>Send push notification with deep link</HeadingText>
      <ListButton
        title="Subscribe to Topic, Send Notification manually from firebase console"
        onPress={() => {
          Notifications.subscribeToTopicAsync('news')
            .then(() => {
              alert('subscribed to topic "news"');
            })
            .catch(console.error);
        }}
      />
      <ListButton
        title="Send a push notification with a deep link"
        onPress={() => {
          // captured by useNotificationResponseRedirect()
          sendPushNotificationsAsync({
            data: { url: 'playground' },
          }).catch(console.error);
        }}
      />
    </ScrollView>
  );
}
