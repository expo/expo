import {
  Link,
  // Slot,
  Stack,
  router,
  useGlobalSearchParams,
  usePathname,
  useSegments,
} from 'expo-router';
import { Pressable, Text } from 'react-native';
export default function Layout() {
  const { '#': hash } = useGlobalSearchParams();
  return (
    <>
      <Text testID="e2e-pathname">{usePathname()}</Text>
      <Text testID="e2e-segments">{`/${useSegments().join('/')}`}</Text>
      <Text testID="e2e-hash">{hash}</Text>
      <Text testID="e2e-global-params">{JSON.stringify(useGlobalSearchParams())}</Text>
      <Link testID="e2e-home" href="/">
        Goto Home
      </Link>
      <Pressable testID="e2e-back" onPress={() => router.back()}>
        <Text>Go back</Text>
      </Pressable>
      <Stack screenOptions={{ animation: 'none' }} />
    </>
  );
}
