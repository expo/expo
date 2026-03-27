import { Link, usePathname } from 'expo-router';
import { Text, View } from 'react-native';

export default function Profile() {
  const pathname = usePathname();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text testID="e2e-screen">Profile</Text>
      <Text testID="e2e-pathname">{pathname}</Text>
      <Link testID="e2e-goto-home" href="/js-tabs">
        Go to Home
      </Link>
      <Link testID="e2e-goto-hidden" href="/js-tabs/hidden">
        Go to Hidden
      </Link>
    </View>
  );
}
