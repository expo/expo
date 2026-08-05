import { Column as ComposeColumn } from '@expo/ui/jetpack-compose';

import { useUniversalLifecycle } from '../hooks';
import { transformToModifiers } from '../transformStyle';
import type { UniversalAlignment } from '../types';
import type { ColumnProps } from './types';

const alignmentMap: Record<UniversalAlignment, 'start' | 'center' | 'end'> = {
  start: 'start',
  center: 'center',
  end: 'end',
};

export function Column({
  children,
  alignment = 'start',
  spacing,
  style,
  onPress,
  onAppear,
  onDisappear,
  disabled,
  hidden,
  testID,
  modifiers: extraModifiers,
}: ColumnProps) {
  useUniversalLifecycle(onAppear, onDisappear);

  if (hidden) return null;

  const modifiers = transformToModifiers(
    style,
    { onPress: disabled ? undefined : onPress, disabled, hidden, testID },
    extraModifiers
  );

  return (
    <ComposeColumn
      horizontalAlignment={alignmentMap[alignment]}
      verticalArrangement={spacing != null ? { spacedBy: spacing } : undefined}
      modifiers={modifiers}>
      {children}
    </ComposeColumn>
  );
}

export * from './types';
