import * as Notifications from 'expo-notifications';

import Dashboard from '../../components/www/dashboard';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function Route() {
  return (
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
  );
}
