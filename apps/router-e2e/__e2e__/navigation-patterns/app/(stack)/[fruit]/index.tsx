import { Pressable, Text } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';

export default function () {
  return (
    <>
      <Text testID="e2e-screen">{JSON.stringify(useLocalSearchParams())}</Text>
      <Text testID="e2e-can-back">{router.canGoBack()}</Text>
      <Link testID="e2e-navigate-banana" href="../banana">
        Navigate banana
      </Link>
      <Link testID="e2e-push-banana" href="../banana" push>
        Push banana
      </Link>
      <Link testID="e2e-replace-banana" href="../banana" replace>
        Replace banana
      </Link>
    </>
  );
}
