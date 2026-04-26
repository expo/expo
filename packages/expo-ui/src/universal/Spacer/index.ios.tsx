import { Spacer as SwiftUISpacer } from '@expo/ui/swift-ui';
import { frame } from '@expo/ui/swift-ui/modifiers';

import { transformToModifiers } from '../transformStyle';
import type { SpacerProps } from './types';

/**
 * A layout spacer that produces empty space between siblings in a
 * [`Row`](#row) or [`Column`](#column).
 *
 * On iOS this wraps SwiftUI's `Spacer`. When `flexible` is `true`, the spacer
 * keeps SwiftUI's default `.infinity` ideal length so it grows to fill the
 * available space. When `flexible` is `false` and `size` is provided, we pin
 * both dimensions with a `frame` modifier — without this, the Spacer's
 * infinity ideal propagates up and forces the enclosing `HStack` / `VStack`
 * to stretch, which causes sibling Spacers to share the extra space equally
 * instead of each rendering at their requested size.
 */
export function Spacer({
  size,
  flexible = false,
  style,
  onAppear,
  onDisappear,
  disabled,
  hidden,
  testID,
  modifiers: extraModifiers,
}: SpacerProps) {
  const baseModifiers = transformToModifiers(
    style,
    { onAppear, onDisappear, disabled, hidden, testID },
    extraModifiers
  );

  if (flexible) {
    return <SwiftUISpacer minLength={size} modifiers={baseModifiers} testID={testID} />;
  }

  const sizeModifier = size != null ? [frame({ width: size, height: size })] : [];
  return <SwiftUISpacer modifiers={[...sizeModifier, ...baseModifiers]} testID={testID} />;
}

export * from './types';
