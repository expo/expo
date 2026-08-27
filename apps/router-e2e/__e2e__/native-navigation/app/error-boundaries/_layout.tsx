import { Stack } from 'expo-router';

import { createErrorBoundary } from '../../components/error-boundaries';

const NavigatorErrorBoundary = createErrorBoundary('navigator');

export default function ErrorBoundaryLayout() {
  return <Stack unstable_screenErrorBoundary={NavigatorErrorBoundary} />;
}
