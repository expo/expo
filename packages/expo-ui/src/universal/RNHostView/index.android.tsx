import { RNHostView as ComposeRNHostView } from '@expo/ui/jetpack-compose';

import { transformToModifiers } from '../transformStyle';
import type { RNHostViewProps } from './types';

/**
 * Hosts React Native views inside Jetpack Compose views.
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
  ref,
}: RNHostViewProps) {
  const modifiers = transformToModifiers(
    style,
    { onAppear, onDisappear, disabled, hidden, testID },
    extraModifiers
  );

  return (
    <ComposeRNHostView matchContents={matchContents} modifiers={modifiers} {...{ ref }}>
      {children}
    </ComposeRNHostView>
  );
}

export * from './types';
