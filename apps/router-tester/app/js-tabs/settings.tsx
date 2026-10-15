import { Link, usePathname } from 'expo-router';
import { Text, View } from 'react-native';

export default function Settings() {
  const pathname = usePathname();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text testID="e2e-screen">Settings</Text>
      <Text testID="e2e-pathname">{pathname}</Text>
      <Link testID="e2e-goto-home" href="/js-tabs">
        Go to Home
      </Link>
    </View>
  );
}
