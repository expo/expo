import { Link } from 'expo-router';
import { Text, View } from 'react-native';

export default function Page() {
  return (
    <View testID="browser-buttons-index">
      <Text>Index</Text>
      <Link href="/browser-buttons/one">Go to One</Link>
      <Link href="/browser-buttons/two">Go to 404</Link>
    </View>
  );
}
