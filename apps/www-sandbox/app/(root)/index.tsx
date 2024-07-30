import * as Notifications from 'expo-notifications';

import Dashboard from '../../components/www/dashboard';

export default function Route() {
  return <Dashboard />;
}

async function notify() {
  await Notifications.requestPermissionsAsync();

  await Notifications.scheduleNotificationAsync({
    identifier: 'hello',
    content: {
      title: 'New Order',
      body: '(from a DOM component 🚀)',
    },
    trigger: {
      seconds: 1,
    },
  });
}
