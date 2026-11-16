import { HStack, ScrollView as SwiftUIScrollView, VStack } from '@expo/ui/swift-ui';
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
  // Extract padding from style — it goes on the inner stack so content is
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
  const innerModifiers: ModifierConfig[] = [frame({ maxWidth: Infinity, alignment: 'topLeading' })];

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

  const stack =
    direction === 'horizontal' ? (
      <HStack alignment="top" modifiers={innerModifiers}>
        {children}
      </HStack>
    ) : (
      <VStack alignment="leading" modifiers={innerModifiers}>
        {children}
      </VStack>
    );

  return (
    <SwiftUIScrollView
      axes={direction}
      showsIndicators={showsIndicators}
      modifiers={scrollModifiers}
      testID={testID}>
      {stack}
    </SwiftUIScrollView>
  );
}

export * from './types';
