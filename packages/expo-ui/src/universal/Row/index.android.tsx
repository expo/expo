import { Row as ComposeRow } from '@expo/ui/jetpack-compose';

import { useUniversalLifecycle } from '../hooks';
import { transformToModifiers } from '../transformStyle';
import type { UniversalAlignment } from '../types';
import type { RowProps } from './types';

const alignmentMap: Record<UniversalAlignment, 'top' | 'center' | 'bottom'> = {
  start: 'top',
  center: 'center',
  end: 'bottom',
};

export function Row({
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
}: RowProps) {
  useUniversalLifecycle(onAppear, onDisappear);

  if (hidden) return null;

  const modifiers = transformToModifiers(
    style,
    { onPress: disabled ? undefined : onPress, disabled, hidden, testID },
    extraModifiers
  );

  return (
    <ComposeRow
      verticalAlignment={alignmentMap[alignment]}
      horizontalArrangement={spacing != null ? { spacedBy: spacing } : undefined}
      modifiers={modifiers}>
      {children}
    </ComposeRow>
  );
}

export * from './types';
