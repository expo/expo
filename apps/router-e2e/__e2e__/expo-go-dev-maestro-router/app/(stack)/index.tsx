import { CustomLink, Link, router } from 'expo-router';
import { Text } from 'react-native';

export default function Index() {
  return (
    <>
      <Text testID="e2e-screen">Stack index</Text>
      <Text testID="e2e-can-go-back">{router.canGoBack()}</Text>
      <Link testID="e2e-navigate-apple" href="./(stack)/apple">
        Navigate apple
      </Link>
      <CustomLink testID="e2e-push-apple" href="./(stack)/apple" push preview>
        Push apple
      </CustomLink>
      <Link testID="e2e-push-index" href="./(stack)" push>
        Push index
      </Link>
    </>
  );
}
