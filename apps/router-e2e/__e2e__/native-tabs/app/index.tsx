import { Link } from 'expo-router';
import { View } from 'react-native';

export default function Index() {
  return (
    <View testID="native-tabs-index">
      <Link href="/nested/inner">Go to /nested/inner</Link>
      <Link href="/nested">Go to /nested</Link>
    </View>
  );
}
