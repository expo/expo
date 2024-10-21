import { Link } from 'expo-router';
import { unstable_headers } from 'expo-router/rsc/headers';
import { Image, Text, View } from 'react-native';

import { Counter } from '../components/counter';

export default function IndexRoute({ path, query }) {
  const headers = unstable_headers();
  console.log('Headers:', headers);

  return (
    <View style={{ flex: 1, padding: 12 }} testID="child-wrapper">
      <Text testID="second-text">Second</Text>
      <Link href="/">Go to index</Link>
      <Text testID="second-path">{path}</Text>
      <Text testID="second-query">{query}</Text>
      <Text>Platform: {process.env.EXPO_OS}</Text>
      <Text testID="secret-text">Secret: {process.env.TEST_SECRET_VALUE}</Text>
      <Text>Render: {Date.now()}</Text>

      <Image
        testID="main-image"
        source={require('../../../assets/icon.png')}
        style={{ width: 100, height: 100 }}
      />

      <Counter />
    </View>
  );
}
