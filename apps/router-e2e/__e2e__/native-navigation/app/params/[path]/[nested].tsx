import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

export default function Screen() {
  const params = useLocalSearchParams();
  useEffect(() => {
    console.log(
      'globalThis.expo.router.navigationEvents',
      // @ts-expect-error
      globalThis.expo?.router?.currentPathname,
      // @ts-expect-error
      globalThis.expo?.router?.currentParams
    );
  }, []);
  return (
    <View style={{ flex: 1, justifyContent: 'space-between', alignItems: 'center' }}>
      <Text>Nested Param: {JSON.stringify(params)}</Text>
    </View>
  );
}
