import { Text } from 'react-native';
import { Link, router } from 'expo-router';

export default function () {
  return (
    <>
      <Text testID="e2e-screen">Orange</Text>
      <Text testID="e2e-can-back">{router.canGoBack()}</Text>
      <Link testID="e2e-navigate-apple" href="/three/apple">
        Navigate apple
      </Link>
      <Link testID="e2e-push-apple" href="/three/apple" push>
        Push apple
      </Link>
      <Link testID="e2e-replace-apple" href="/three/apple" replace>
        Replace apple
      </Link>
      <Link testID="e2e-navigate-banana" href="/three/banana">
        Navigate banana
      </Link>
      <Link testID="e2e-push-banana" href="/three/banana" push>
        Push banana
      </Link>
      <Link testID="e2e-replace-banana" href="/three/banana" replace>
        Replace banana
      </Link>
    </>
  );
}
