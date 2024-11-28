import { Link, Stack } from 'expo-router';

export default function () {
  return (
    <>
      <Link testID="e2e-goto-stack-index" href="/(stack)" replace>
        Go to Stack Index
      </Link>
      <Link testID="e2e-goto-modal" href="/(stack)/modal">
        Go to modal
      </Link>
      <Stack>
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="modal2" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}
