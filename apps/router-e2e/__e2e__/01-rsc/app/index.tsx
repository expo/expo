import { Image, Text, View } from '../lib/react-native';

import { Counter } from '../components/counter';

export default function IndexRoute({ path, query }) {
  return (
    <View style={{ flex: 1, padding: 12 }} testID="child-wrapper">
      <Text testID="index-text">Hello World</Text>
      <Text testID="index-path">{path}</Text>
      <Text testID="index-query">{query}</Text>
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
