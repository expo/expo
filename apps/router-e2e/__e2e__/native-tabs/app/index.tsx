import { Link } from 'expo-router';
import { Text, View } from 'react-native';

export default function Index() {
  return (
    <View
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#faa' }}>
      <Text testID="e2e-screen">One</Text>
      <Link testID="e2e-goto-apple" href="/two">
        Goto TWO
      </Link>
      <Link testID="e2e-goto-three" href="/three/orange">
        Goto Orange
      </Link>
    </View>
  );
}
