import { Stack } from 'expo-router';

import { createErrorBoundary } from '../components';

export const unstable_settings = {
  screenErrorBoundary: createErrorBoundary('layout'),
};

export default function LayoutBoundaryLayout() {
  return <Stack />;
}
