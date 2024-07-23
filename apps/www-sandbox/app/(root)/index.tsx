import { Button, ScrollView } from 'react-native';
import Dashboard from '../../components/www/dashboard';

import { useState } from 'react';

import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function Route() {
  const [index, setIndex] = useState(0);
  return (
    // <ScrollView style={{ flex: 1 }}>
    <Dashboard
      requestNotificationsPermissions={async (content: Notifications.NotificationContentInput) => {
        if (process.env.EXPO_OS === 'web') return;
        await Notifications.requestPermissionsAsync();

        await Notifications.scheduleNotificationAsync({
          identifier: 'hello',
          content,
          trigger: {
            seconds: 1,
          },
        });
      }}
    />
    // </ScrollView>
  );
}
