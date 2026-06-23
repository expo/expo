import { Column, Row } from '@expo/ui/jetpack-compose';
import { horizontalScroll, verticalScroll } from '@expo/ui/jetpack-compose/modifiers';

import { useUniversalLifecycle } from '../hooks';
import { transformToModifiers } from '../transformStyle';
import type { ScrollViewProps } from './types';

export function ScrollView({
  children,
  direction = 'vertical',
  style,
  onPress,
  onAppear,
  onDisappear,
  disabled,
  hidden,
  testID,
  modifiers: extraModifiers,
}: ScrollViewProps) {
  useUniversalLifecycle(onAppear, onDisappear);

  if (hidden) return null;

  const modifiers = transformToModifiers(
    style,
    { onPress: disabled ? undefined : onPress, disabled, hidden, testID },
    extraModifiers
  );

  if (direction === 'horizontal') {
    return <Row modifiers={[...modifiers, horizontalScroll()]}>{children}</Row>;
  }

  return <Column modifiers={[...modifiers, verticalScroll()]}>{children}</Column>;
}

export * from './types';
