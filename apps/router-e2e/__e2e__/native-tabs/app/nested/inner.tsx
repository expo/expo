import { Link } from 'expo-router';
import { Text, View } from 'react-native';

export default function Inner() {
  return (
    <View testID="native-tabs-nested-inner">
      <Text>Inner Nested Screen</Text>
      <Link href="/nested">Go to /nested</Link>
      <Link href="/">Go to /</Link>
    </View>
  );
}
