import { Link, router, useLocalSearchParams, usePathname } from 'expo-router';
import { Text } from 'react-native';

export default function Index() {
  const pathname = usePathname();

  return (
    <>
      <Text testID="e2e-screen">{JSON.stringify(useLocalSearchParams())}</Text>
      <Text testID="e2e-can-back">{router.canGoBack()}</Text>
      <Text testID="e2e-pathname">{pathname}</Text>
      <Link testID="e2e-navigate-banana" href="../banana" experimentalPreview>
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
