import { requireNativeView } from 'expo';
import React from 'react';

// Native component declaration using the same pattern as Button
const HostView: React.ComponentType<any> = requireNativeView('ExpoUI', 'HostView');

/**
 * Displays a native chip component.
 */
export function Host(props: any): React.JSX.Element {
  return <HostView {...props} />;
}
