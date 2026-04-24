import { LazyColumn, useMaterialColors } from '@expo/ui/jetpack-compose';

import { groupFieldGroupChildren } from './groupChildren';
import type { FieldGroupProps } from './types';
import { useUniversalLifecycle } from '../hooks';
import { transformToModifiers } from '../transformStyle';

/**
 * A scrollable container for grouped settings-style rows. On Android this
 * wraps a Jetpack Compose `LazyColumn` that mirrors the Material 3 settings
 * layout and adapts to the enclosing `<Host>`'s theme. Pass
 * `style={{ backgroundColor }}` to override the default background.
 */
export function FieldGroup({
  children,
  style,
  onAppear,
  onDisappear,
  disabled,
  hidden,
  testID,
  modifiers: extraModifiers,
}: FieldGroupProps) {
  useUniversalLifecycle(onAppear, onDisappear);
  const colors = useMaterialColors();

  if (hidden) return null;

  const mergedStyle = { backgroundColor: colors.surface, ...style };
  const modifiers = transformToModifiers(mergedStyle, { disabled, hidden, testID }, extraModifiers);

  return (
    <LazyColumn
      verticalArrangement={{ spacedBy: 24 }}
      contentPadding={{ start: 16, end: 16, top: 16, bottom: 16 }}
      modifiers={modifiers}>
      {groupFieldGroupChildren(children)}
    </LazyColumn>
  );
}
