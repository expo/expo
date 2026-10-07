import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, Text } from 'react-native';

export default function Query() {
  const params = useLocalSearchParams();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fff' }}
      contentContainerStyle={{ padding: 16, gap: 16 }}
      contentInsetAdjustmentBehavior="automatic">
      <Stack.Screen options={{ title: 'Query serialization' }} />
      <Text testID="query-params">{JSON.stringify(params)}</Text>
      <Pressable
        testID="query-set-params"
        accessibilityRole="button"
        style={{ backgroundColor: 'rgb(11, 103, 175)', padding: 16, borderRadius: 8 }}
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
        <Text style={{ color: '#fff' }}>Set query params</Text>
      </Pressable>
    </ScrollView>
  );
}
