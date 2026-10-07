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
    extraModifiers,
    { componentName: 'ScrollView' }
  );

  // verticalScroll and horizontalScroll clear the main-axis max before measure.
  // A percentage on the scroll axis has no definite parent, so it is ignored.
  // The cross axis still resolves.
  if (direction === 'horizontal') {
    return (
      <Row resolvesChildPercentages modifiers={[...modifiers, horizontalScroll()]}>
        {children}
      </Row>
    );
  }

  return (
    <Column resolvesChildPercentages modifiers={[...modifiers, verticalScroll()]}>
      {children}
    </Column>
  );
}

export * from './types';
