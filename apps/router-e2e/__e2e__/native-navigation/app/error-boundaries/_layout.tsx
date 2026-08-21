import { Stack } from 'expo-router';

import { createErrorBoundary } from './components';

const NavigatorErrorBoundary = createErrorBoundary('navigator');
const ScreenErrorBoundary = createErrorBoundary('screen');

export default function ErrorBoundaryLayout() {
  return (
    <Stack unstable_screenErrorBoundary={NavigatorErrorBoundary}>
      <Stack.Screen name="screen" unstable_errorBoundary={ScreenErrorBoundary} />
    </Stack>
  );
}
