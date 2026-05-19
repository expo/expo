import { RNHostView as SwiftUIRNHostView } from '@expo/ui/swift-ui';

import { transformToModifiers } from '../transformStyle';
import type { RNHostViewProps } from './types';

/**
 * Hosts React Native views inside SwiftUI views.
 */
export function RNHostView({
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
    <SwiftUIRNHostView matchContents={matchContents} modifiers={modifiers} testID={testID}>
      {children}
    </SwiftUIRNHostView>
  );
}

export * from './types';
