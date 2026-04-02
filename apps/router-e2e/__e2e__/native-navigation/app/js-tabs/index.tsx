import { Link, usePathname } from 'expo-router';
import { Text, View } from 'react-native';

export default function Home() {
  const pathname = usePathname();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text testID="e2e-screen">Home</Text>
      <Text testID="e2e-pathname">{pathname}</Text>
      <Link testID="e2e-goto-profile" href="/js-tabs/profile">
        Go to Profile
      </Link>
      <Link testID="e2e-goto-settings" href="/js-tabs/settings">
        Go to Settings
      </Link>
    </View>
  );
}
