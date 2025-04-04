import { memo } from 'react';
import { Platform } from 'react-native';

import ComponentListScreen from './ComponentListScreen';
import ExpoAPIIcon from '../components/ExpoAPIIcon';
import { type ScreenApiItem } from '../types/ScreenConfig';

if (Platform.OS !== 'web') {
  // Optionally require expo-notifications as we cannot assume that the module is linked.
  // It's not available on macOS and tvOS yet and we want to avoid errors caused by the top-level import.
  const Notifications = (() => {
    try {
      return require('expo-notifications');
    } catch {
      return null;
    }
  })();

  Notifications?.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export default memo(function ExpoApisScreen({ apis }: { apis: ScreenApiItem[] }) {
  return (
    <ComponentListScreen
      renderItemRight={({ name }: { name: string }) => (
        <ExpoAPIIcon name={name} style={{ marginRight: 10, marginLeft: 6 }} />
      )}
      apis={apis}
    />
  );
});
