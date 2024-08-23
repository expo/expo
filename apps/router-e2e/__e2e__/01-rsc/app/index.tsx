import { Image, Text, View } from '../lib/react-native';

import { Counter } from '../components/counter';

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
    <View style={{ flex: 1, padding: 12 }} testID="child-wrapper">
      <Text testID="index-text">Hello World</Text>
      <Text testID="index-path">{path}</Text>
      <Text testID="index-query">{query}</Text>
      <Text>Platform: {process.env.EXPO_OS}</Text>
      <Text testID="secret-text">Secret: {process.env.TEST_SECRET_VALUE}</Text>
      <Text>Render: {Date.now()}</Text>

      <Counter onPress={serverAction.bind(null, '2')} />
    </View>
  );
}
