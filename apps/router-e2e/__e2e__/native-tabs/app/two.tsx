import { Link } from 'expo-router';
import { Text, View } from 'react-native';

export default function Two() {
  console.log('two');

  return (
    <View
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#afa' }}>
      <Text testID="e2e-screen">Two</Text>
      <Link href="/three/apple">Go to apple</Link>
    </View>
  );
}
