import { Link } from 'expo-router';
import { Text, View } from 'react-native';

export default function NestedIndex() {
  return (
    <View testID="native-tabs-nested-index">
      <Text>Nested Index Screen</Text>
      <Link href="/nested/inner">Go to /nested/inner</Link>
      <Link href="/">Go to /</Link>
    </View>
  );
}
