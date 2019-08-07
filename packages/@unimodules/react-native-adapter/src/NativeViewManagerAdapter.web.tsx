import React from 'react';
import { UnavailabilityError } from './errors/UnavailabilityError';

export function requireNativeViewManager<P = any>(viewName: string): React.ComponentType<P> {
  throw new UnavailabilityError('@unimodules/react-native-adapter', 'requireNativeViewManager');
}
