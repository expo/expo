import { HStack } from '@expo/ui/swift-ui';

import { transformToModifiers } from '../transformStyle';
import type { UniversalAlignment } from '../types';
import type { RowProps } from './types';

const alignmentMap: Record<UniversalAlignment, 'top' | 'center' | 'bottom'> = {
  start: 'top',
  center: 'center',
  end: 'bottom',
};

const frameAlignmentMap: Record<UniversalAlignment, 'topLeading' | 'leading' | 'bottomLeading'> = {
  start: 'topLeading',
  center: 'leading',
  end: 'bottomLeading',
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
  const modifiers = transformToModifiers(
    style,
    { onPress, onAppear, onDisappear, disabled, hidden, testID },
    extraModifiers,
    { frameAlignment: frameAlignmentMap[alignment] }
  );

  return (
    <HStack
      alignment={alignmentMap[alignment]}
      spacing={spacing}
      modifiers={modifiers}
      testID={testID}>
      {children}
    </HStack>
  );
}

export * from './types';
