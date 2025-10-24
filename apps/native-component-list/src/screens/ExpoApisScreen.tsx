import { memo } from 'react';
import { Platform } from 'react-native';

import ComponentListScreen, { type ListElement } from './ComponentListScreen';
import ExpoAPIIcon from '../components/ExpoAPIIcon';

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
      shouldShowList: true,
      shouldShowBanner: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export default memo(function ExpoApisScreen({ apis }: { apis: ListElement[] }) {
  return (
    <ComponentListScreen
      renderItemRight={({ name }: { name: string }) => (
        <ExpoAPIIcon name={name} style={{ marginRight: 10, marginLeft: 6 }} />
      )}
      apis={apis}
    />
  );
});
