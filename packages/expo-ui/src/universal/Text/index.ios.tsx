import { Text as SwiftUIText } from '@expo/ui/swift-ui';
import {
  font,
  foregroundStyle,
  kerning,
  lineLimit,
  lineSpacing,
  multilineTextAlignment,
} from '@expo/ui/swift-ui/modifiers';
import type { ModifierConfig } from '@expo/ui/swift-ui/modifiers';

import { transformToModifiers } from '../transformStyle';
import type { TextProps, UniversalFontWeight } from './types';

const fontWeightMap: Record<
  UniversalFontWeight,
  'regular' | 'bold' | 'ultraLight' | 'thin' | 'light' | 'medium' | 'semibold' | 'heavy' | 'black'
> = {
  normal: 'regular',
  bold: 'bold',
  '100': 'ultraLight',
  '200': 'thin',
  '300': 'light',
  '400': 'regular',
  '500': 'medium',
  '600': 'semibold',
  '700': 'bold',
  '800': 'heavy',
  '900': 'black',
};

const textAlignMap: Record<string, 'leading' | 'center' | 'trailing'> = {
  left: 'leading',
  center: 'center',
  right: 'trailing',
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
  // Build text-specific modifiers before the universal ones
  const textModifiers: ModifierConfig[] = [];

  if (textStyle) {
    if (
      typeof textStyle.fontSize === 'number' ||
      textStyle.fontWeight != null ||
      textStyle.fontFamily != null
    ) {
      textModifiers.push(
        font({
          size: textStyle.fontSize,
          weight: textStyle.fontWeight ? fontWeightMap[textStyle.fontWeight] : undefined,
          family: textStyle.fontFamily,
        })
      );
    }

    if (textStyle.color) {
      textModifiers.push(foregroundStyle(textStyle.color));
    }

    const mappedAlignment = textStyle.textAlign ? textAlignMap[textStyle.textAlign] : undefined;
    if (mappedAlignment) {
      textModifiers.push(multilineTextAlignment(mappedAlignment));
    }

    if (typeof textStyle.lineHeight === 'number') {
      // RN lineHeight = total line box height; SwiftUI lineSpacing = gap between lines.
      // Convert by subtracting the font size (default 17 = SwiftUI Body).
      const baseFontSize = textStyle.fontSize ?? 17;
      const spacing = Math.max(0, textStyle.lineHeight - baseFontSize);
      textModifiers.push(lineSpacing(spacing));
    }

    if (typeof textStyle.letterSpacing === 'number') {
      textModifiers.push(kerning(textStyle.letterSpacing));
    }
  }

  if (typeof numberOfLines === 'number') {
    textModifiers.push(lineLimit(numberOfLines));
  }

  const universalModifiers = transformToModifiers(
    style,
    { onPress, onAppear, onDisappear, disabled, hidden, testID },
    extraModifiers
  );

  const modifiers = [...textModifiers, ...universalModifiers];

  return (
    <SwiftUIText modifiers={modifiers} testID={testID}>
      {children}
    </SwiftUIText>
  );
}

export * from './types';
