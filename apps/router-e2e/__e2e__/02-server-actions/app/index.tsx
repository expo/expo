import { SafeAreaView, Text, View } from '../lib/react-native';

import { Counter } from '../components/counter';

// TODO: Server Actions from file with module-level directive should be tested too.

const renderView = async (message: string) => {
  'use server';
  return <Text testID="server-action-txt">{message}</Text>;
};

export default function IndexRoute({ query, path }) {
  const foo = '4';
  const serverAction2 = async (...props) => {
    'use server';
    console.log('Nested action', props);
    return [foo, ...props].join(', ');
  };
  const serverAction = async (...props) => {
    'use server';
    console.log('Action', props);
    return serverAction2.bind(null, '3')(...props);
  };
  return (
    <SafeAreaView style={{ flex: 1, padding: 12 }} testID="child-wrapper">
      <View style={{ flex: 1, padding: 12 }} testID="child-wrapper">
        <Text testID="index-text">Hello World</Text>
        <Counter onNestedAction={serverAction.bind(null, '2')} onRenderView={renderView} />
      </View>
    </SafeAreaView>
  );
}
