import { Group, ScrollView as SwiftUIScrollView } from '@expo/ui/swift-ui';
import { frame, padding } from '@expo/ui/swift-ui/modifiers';
import type { ModifierConfig } from '@expo/ui/swift-ui/modifiers';

import { transformToModifiers } from '../transformStyle';
import type { ScrollViewProps } from './types';

export function ScrollView({
  children,
  direction = 'vertical',
  showsIndicators = true,
  style,
  onPress,
  onAppear,
  onDisappear,
  disabled,
  hidden,
  testID,
  modifiers: extraModifiers,
}: ScrollViewProps) {
  // Extract padding from style — it goes on the inner Group so content is
  // inset after stretching to full width.
  const {
    padding: paddingAll,
    paddingHorizontal,
    paddingVertical,
    paddingTop,
    paddingBottom,
    paddingLeft,
    paddingRight,
    ...styleWithoutPadding
  } = style ?? {};

  const scrollModifiers = transformToModifiers(
    Object.keys(styleWithoutPadding).length > 0 ? (styleWithoutPadding as typeof style) : undefined,
    { onPress, onAppear, onDisappear, disabled, hidden, testID },
    extraModifiers,
    { componentName: 'ScrollView' }
  );

  // SwiftUI ScrollView centers content by default. Stretch content to fill
  // the scroll area to match Android/web behavior.
  // maxWidth keeps the viewport width stable, so a width percentage is measured once.
  // A horizontal scroll needs the same pin on height. Without it, the frame
  // proposes the child's own height on the next pass, and 50% becomes 25%.
  // The scroll axis stays unbounded.
  const innerModifiers: ModifierConfig[] = [
    frame(
      direction === 'horizontal'
        ? { maxWidth: Infinity, maxHeight: Infinity, alignment: 'topLeading' }
        : { maxWidth: Infinity, alignment: 'topLeading' }
    ),
  ];

  const hasPadding =
    paddingAll != null ||
    paddingHorizontal != null ||
    paddingVertical != null ||
    paddingTop != null ||
    paddingBottom != null ||
    paddingLeft != null ||
    paddingRight != null;

  if (hasPadding) {
    innerModifiers.push(
      padding({
        all: paddingAll as number | undefined,
        horizontal: paddingHorizontal as number | undefined,
        vertical: paddingVertical as number | undefined,
        top: paddingTop as number | undefined,
        bottom: paddingBottom as number | undefined,
        leading: paddingLeft as number | undefined,
        trailing: paddingRight as number | undefined,
      })
    );
  }

  return (
    <SwiftUIScrollView
      axes={direction}
      showsIndicators={showsIndicators}
      modifiers={scrollModifiers}
      testID={testID}>
      <Group modifiers={innerModifiers}>{children}</Group>
    </SwiftUIScrollView>
  );
}

export * from './types';
