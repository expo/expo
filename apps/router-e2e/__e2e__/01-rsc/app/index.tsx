import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router/build/rsc/exports';

import { Counter } from '../components/counter';
import { Pokemon } from '../components/pokemon';
import { Image, Text, ScrollView } from 'react-native';
import { unstable_headers } from 'expo-router/rsc/headers';

export default function IndexRoute({ path, query }) {
  const headers = unstable_headers();
  console.log('Headers:', headers);

  return (
    <ScrollView
      style={{ flex: 1, padding: 12 }}
      testID="child-wrapper"
      contentContainerStyle={{
        gap: 8,
      }}>
      <Text testID="index-text">Hello World</Text>
      <Link href="/second">Go to second</Link>
      <Text testID="index-path">{path}</Text>
      <Text testID="index-query">{query}</Text>
      <Text>Platform: {process.env.EXPO_OS}</Text>
      <Text testID="secret-text">Secret: {process.env.TEST_SECRET_VALUE}</Text>
      <Text>Render: {Date.now()}</Text>
      <Text>Headers: {JSON.stringify(Object.fromEntries(headers.entries()), null, 2)}</Text>

      <Image
        testID="main-image"
        source={require('../../../assets/icon.png')}
        style={{ width: 100, height: 100 }}
      />

      <Ionicons name="airplane" />
      <Counter />

      <Pokemon id={45} />
    </ScrollView>
  );
}

export const unstable_settings = {
  render: 'static',
};
