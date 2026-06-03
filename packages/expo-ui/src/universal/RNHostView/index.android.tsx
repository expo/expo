import { RNHostView as ComposeRNHostView } from '@expo/ui/jetpack-compose';

import { withReactNativeHostBoundary } from '../hostContext';
import { transformToModifiers } from '../transformStyle';
import type { RNHostViewProps } from './types';

/**
 * Hosts React Native views inside Jetpack Compose views.
 */
function RNHostViewContent({
  children,
  matchContents,
  style,
  onAppear,
  onDisappear,
  disabled,
  hidden,
  testID,
  modifiers: extraModifiers,
}: RNHostViewProps) {
  const modifiers = transformToModifiers(
    style,
    { onAppear, onDisappear, disabled, hidden, testID },
    extraModifiers
  );

  return (
    <ComposeRNHostView matchContents={matchContents} modifiers={modifiers}>
      {children}
    </ComposeRNHostView>
  );
}

export const RNHostView = withReactNativeHostBoundary<RNHostViewProps>(RNHostViewContent);

export * from './types';
