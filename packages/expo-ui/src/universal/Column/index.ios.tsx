import { VStack } from '@expo/ui/swift-ui';

import { transformToModifiers } from '../transformStyle';
import type { UniversalAlignment } from '../types';
import type { ColumnProps } from './types';

const alignmentMap: Record<UniversalAlignment, 'leading' | 'center' | 'trailing'> = {
  start: 'leading',
  center: 'center',
  end: 'trailing',
};

const frameAlignmentMap: Record<UniversalAlignment, 'topLeading' | 'top' | 'topTrailing'> = {
  start: 'topLeading',
  center: 'top',
  end: 'topTrailing',
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
  const modifiers = transformToModifiers(
    style,
    { onPress, onAppear, onDisappear, disabled, hidden, testID },
    extraModifiers,
    { frameAlignment: frameAlignmentMap[alignment] }
  );

  return (
    <VStack
      alignment={alignmentMap[alignment]}
      spacing={spacing}
      modifiers={modifiers}
      testID={testID}>
      {children}
    </VStack>
  );
}

export * from './types';
