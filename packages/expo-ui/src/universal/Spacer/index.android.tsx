import { Spacer as ComposeSpacer } from '@expo/ui/jetpack-compose';
import {
  height as heightModifier,
  size as sizeModifier,
  weight as weightModifier,
  width as widthModifier,
  type ModifierConfig,
} from '@expo/ui/jetpack-compose/modifiers';

import { transformToModifiers } from '../transformStyle';
import type { SpacerProps } from './types';
import { useUniversalLifecycle } from '../hooks';

/**
 * A layout spacer that produces empty space between siblings in a
 * [`Row`](#row) or [`Column`](#column).
 *
 * On Android, a fixed-size spacer applies `size(size, size)` so it works in
 * both horizontal and vertical containers. A flexible spacer uses Compose's
 * `weight(1)` modifier to fill remaining space.
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
  useUniversalLifecycle(onAppear, onDisappear);

  if (hidden) return null;

  const layoutMods: ModifierConfig[] = [];
  if (flexible) {
    layoutMods.push(weightModifier(1));
    if (size != null) {
      // When both are supplied, let weight drive main-axis size and pin the
      // cross-axis to `size` using whichever dimension is not governed by the
      // parent. Since we can't know the parent here, apply both.
      layoutMods.push(widthModifier(size));
      layoutMods.push(heightModifier(size));
    }
  } else if (size != null) {
    layoutMods.push(sizeModifier(size, size));
  }

  const modifiers = transformToModifiers(style, { disabled, hidden, testID }, [
    ...layoutMods,
    ...(extraModifiers ?? []),
  ]);

  return <ComposeSpacer modifiers={modifiers} />;
}

export * from './types';
