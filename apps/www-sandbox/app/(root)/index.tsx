import * as Notifications from 'expo-notifications';

import Dashboard from '../../components/www/dashboard';

export default function Route() {
  return <Dashboard notify={notify} />;
}

async function notify(content: Notifications.NotificationContentInput) {
  if (process.env.EXPO_OS === 'web') return;

  await Notifications.requestPermissionsAsync();

  await Notifications.scheduleNotificationAsync({
    identifier: 'hello',
    content,
    trigger: {
      seconds: 1,
    },
  });
}
