import { Column, Row } from '@expo/ui/jetpack-compose';
import { horizontalScroll, verticalScroll } from '@expo/ui/jetpack-compose/modifiers';

import { EnsureHost, fullHostOptions } from '../autoHost';
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

  const content =
    direction === 'horizontal' ? (
      <Row modifiers={[...modifiers, horizontalScroll()]}>{children}</Row>
    ) : (
      <Column modifiers={[...modifiers, verticalScroll()]}>{children}</Column>
    );

  return <EnsureHost {...fullHostOptions(style)}>{content}</EnsureHost>;
}

export * from './types';
