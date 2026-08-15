function notificationScreen(requirer: () => { default: React.ComponentType }) {
  try {
    return requirer().default;
  } catch {
    return null;
  }
}

export const NotificationScreen = notificationScreen(() =>
  require('native-component-list/src/screens/NotificationScreen')
) as any;

export default function Page() {
  return <NotificationScreen />;
}
