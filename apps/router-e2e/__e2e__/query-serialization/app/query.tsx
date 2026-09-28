import { Link, router, useLocalSearchParams } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export default function Query() {
  const params = useLocalSearchParams();
  return (
    <View style={{ padding: 60 }}>
      <Text testID="query-params">{JSON.stringify(params)}</Text>
      <Pressable
        testID="query-set-params"
        onPress={() =>
          router.setParams({
            space: 'changed space',
            plus: 'a+b',
            array: ['first value', 'second+value'],
            unicode: 'café 😀',
            symbols: '*~&=#/?',
            '#': 'updated',
          })
        }>
        <Text>Set query params</Text>
      </Pressable>
      <Link testID="query-home" href="/">
        Home
      </Link>
    </View>
  );
}
