import { Stack } from 'expo-router';

import { createErrorBoundary } from '../../components/error-boundaries';

const NavigatorErrorBoundary = createErrorBoundary('navigator');
const ScreenErrorBoundary = createErrorBoundary('screen');

export default function ErrorBoundaryLayout() {
  return (
    <Stack unstable_screenErrorBoundary={NavigatorErrorBoundary}>
      <Stack.Screen name="screen" unstable_errorBoundary={ScreenErrorBoundary} />
    </Stack>
  );
}
