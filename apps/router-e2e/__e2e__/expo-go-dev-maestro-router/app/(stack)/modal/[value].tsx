import { Link, router, useLocalSearchParams } from 'expo-router';
import { Pressable, Text } from 'react-native';

export default function () {
  return (
    <>
      <Text testID="e2e-screen">Modal value {JSON.stringify(useLocalSearchParams())}</Text>
      <Link testID="e2e-push-one" href="/(stack)/modal/one" push>
        Push one
      </Link>
      <Link testID="e2e-push-two" href="/(stack)/modal/two" push>
        Push two
      </Link>
      <Pressable testID="e2e-dismiss" onPress={() => router.dismiss()}>
        <Text>Dismiss</Text>
      </Pressable>
      <Pressable testID="e2e-dismiss-all" onPress={() => router.dismissAll()}>
        <Text>Dismiss all</Text>
      </Pressable>
    </>
  );
}
