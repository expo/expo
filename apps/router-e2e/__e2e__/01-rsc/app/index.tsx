import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router/build/rsc/exports';

import { Counter } from '../components/counter';
import { Pokemon } from '../components/pokemon';
import { Image, Text, ScrollView } from '../lib/react-native';

export default function IndexRoute({ query, path }) {
  const foo = '4';
  const serverAction2 = async (...props) => {
    'use server';
    console.log('Nested action', props);
    return [foo, ...props];
  };
  const serverAction = async (...props) => {
    'use server';
    console.log('Action', props);
    return serverAction2.bind(null, '3')(...props);
  };
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

      <Counter onPress={serverAction.bind(null, '2')} />
      <Image
        testID="main-image"
        source={require('../../../assets/icon.png')}
        style={{ width: 100, height: 100 }}
      />

      <Ionicons name="airplane" />

      <Pokemon id={45} />
    </ScrollView>
  );
}

export const unstable_settings = {
  render: 'static',
};
