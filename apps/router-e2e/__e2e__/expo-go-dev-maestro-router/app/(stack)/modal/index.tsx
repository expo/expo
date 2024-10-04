import { Link, router } from 'expo-router';
import { Pressable, Text } from 'react-native';

export default function () {
  return (
    <>
      <Text testID="e2e-screen">Modal</Text>
      <Link testID="e2e-goto-modal2" href="/(stack)/modal2" push>
        Push new modal
      </Link>
      <Link testID="e2e-push-one" href="/(stack)/modal/one" push>
        Push value
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
