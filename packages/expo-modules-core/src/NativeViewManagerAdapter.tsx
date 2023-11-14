import React from 'react';

import { UnavailabilityError } from './errors/UnavailabilityError';

/**
 * A drop-in replacement for `requireNativeComponent`.
 */
export function requireNativeViewManager<P = any>(viewName: string): React.ComponentType<P> {
  throw new UnavailabilityError('expo-modules-core', 'requireNativeViewManager');
}
