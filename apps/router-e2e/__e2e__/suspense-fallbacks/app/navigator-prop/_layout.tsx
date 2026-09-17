import { Slot } from 'expo-router';

import { createFallback } from '../../components/suspense';

// The navigator prop takes precedence over this export for the same screens.
export const SuspenseFallback = createFallback('navigator-prop-layout-fallback');

const NavigatorFallback = createFallback('navigator-prop-fallback');

export default function NavigatorPropLayout() {
  return <Slot suspenseFallback={NavigatorFallback} />;
}
