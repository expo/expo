import { Text as ComposeText } from '@expo/ui/jetpack-compose';

import { transformToModifiers } from '../transformStyle';
import type { TextProps } from './types';
import { useUniversalLifecycle } from '../hooks';

const textAlignMap: Record<string, 'start' | 'center' | 'end'> = {
  left: 'start',
  center: 'center',
  right: 'end',
};

export function Text({
  children,
  textStyle,
  numberOfLines,
  style,
  onPress,
  onAppear,
  onDisappear,
  disabled,
  hidden,
  testID,
  modifiers: extraModifiers,
}: TextProps) {
  useUniversalLifecycle(onAppear, onDisappear);

  if (hidden) return null;

  const modifiers = transformToModifiers(
    style,
    { onPress: disabled ? undefined : onPress, disabled, hidden, testID },
    extraModifiers
  );

  // Build Compose Text style object
  const composeTextStyle: Record<string, unknown> = {};
  if (textStyle?.fontSize != null) composeTextStyle.fontSize = textStyle.fontSize;
  if (textStyle?.fontWeight != null) composeTextStyle.fontWeight = textStyle.fontWeight;
  if (textStyle?.fontFamily != null) composeTextStyle.fontFamily = textStyle.fontFamily;
  if (textStyle?.textAlign != null) composeTextStyle.textAlign = textAlignMap[textStyle.textAlign];
  if (textStyle?.letterSpacing != null) composeTextStyle.letterSpacing = textStyle.letterSpacing;
  if (textStyle?.lineHeight != null) composeTextStyle.lineHeight = textStyle.lineHeight;

  return (
    <ComposeText
      color={textStyle?.color}
      maxLines={numberOfLines}
      style={Object.keys(composeTextStyle).length > 0 ? composeTextStyle : undefined}
      modifiers={modifiers}>
      {children}
    </ComposeText>
  );
}

export * from './types';
