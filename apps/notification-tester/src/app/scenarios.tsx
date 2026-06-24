import * as Notifications from 'expo-notifications';
import { getPresentedNotificationsAsync } from 'expo-notifications';
import { sendPushNotificationsAsync } from 'native-component-list/src/api/sendPushNotificationsAsync';
import HeadingText from 'native-component-list/src/components/HeadingText';
import ListButton from 'native-component-list/src/components/ListButton';
import React from 'react';

import { ScrollView } from '../misc/Themed';

export default function ScenariosPage() {
  return (
    <ScrollView contentContainerStyle={{ rowGap: 10, padding: 10 }}>
      <HeadingText>Local notification with custom sound</HeadingText>
      <ListButton
        title="Schedule notification with bells_sound.wav"
        onPress={async () => {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Custom sound test',
              body: 'This should play bells_sound.wav',
              sound: 'bells_sound.wav',
            },
            trigger: null,
          });
        }}
      />
      <ListButton
        title="Schedule notification with nonexistent sound"
        onPress={async () => {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Missing sound test',
              body: 'This should warn about missing sound',
              sound: 'does_not_exist.wav',
            },
            trigger: null,
          });
        }}
      />

      <HeadingText>Notification grouping (threadIdentifier)</HeadingText>
      <ListButton
        title='Schedule 3 notifications in "chat-alice" thread'
        onPress={async () => {
          for (let i = 1; i <= 3; i++) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `Alice`,
                body: `Message ${i} from Alice`,
                threadIdentifier: 'chat-alice',
              },
              trigger: null,
            });
          }
        }}
      />
      <ListButton
        title='Schedule 3 notifications in "chat-bob" thread'
        onPress={async () => {
          for (let i = 1; i <= 3; i++) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `Bob`,
                body: `Message ${i} from Bob`,
                threadIdentifier: 'chat-bob',
              },
              trigger: null,
            });
          }
        }}
      />
      <ListButton
        title="Schedule 1 notification with no thread"
        onPress={async () => {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'No thread',
              body: 'This notification has no threadIdentifier',
            },
            trigger: null,
          });
        }}
      />
      <ListButton
        title="getPresentedNotificationsAsync"
        onPress={async () => {
          const result = await Notifications.getPresentedNotificationsAsync();
          alert(`Presented notifications: ${JSON.stringify(result, null, 2)}`);
        }}
      />

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
