import {
  background,
  border,
  clipShape,
  disabled as disabledMod,
  font,
  foregroundStyle,
  frame,
  hidden as hiddenMod,
  kerning,
  lineSpacing,
  multilineTextAlignment,
  onAppear,
  onDisappear,
  onTapGesture,
  opacity,
  padding,
  type ModifierConfig,
} from '@expo/ui/swift-ui/modifiers';

import type { UniversalTextStyle } from './Text/types';
import type { UniversalBaseProps, UniversalStyle } from './types';

const FONT_WEIGHT_MAP: Record<string, Parameters<typeof font>[0]['weight']> = {
  '100': 'ultraLight',
  '200': 'thin',
  '300': 'light',
  '400': 'regular',
  '500': 'medium',
  '600': 'semibold',
  '700': 'bold',
  '800': 'heavy',
  '900': 'black',
  normal: 'regular',
  bold: 'bold',
};

/**
 * Converts universal style/event/lifecycle/behavior props into a SwiftUI
 * modifier array.
 *
 * SwiftUI modifiers apply inside-out (each modifier wraps the previous).
 * To match React Native's box model (background fills the full box):
 *   padding → sizing → background → clip → border → opacity
 *   → events → lifecycle → behavior → user escape-hatch
 */
export function transformToModifiers(
  style: UniversalStyle | undefined,
  props: Pick<
    UniversalBaseProps,
    'onPress' | 'onAppear' | 'onDisappear' | 'disabled' | 'hidden' | 'testID'
  >,
  extraModifiers?: ModifierConfig[],
  options?: {
    /** Alignment for the frame modifier (used by Column/Row). */
    frameAlignment?: Parameters<typeof frame>[0]['alignment'];
    /** Text-styling props for text-rendering components. */
    textStyle?: UniversalTextStyle;
  }
): ModifierConfig[] {
  const mods: ModifierConfig[] = [];

  // Text styling (innermost — applies to text content before container modifiers)
  const textStyle = options?.textStyle;
  if (textStyle) {
    if (
      textStyle.fontFamily != null ||
      textStyle.fontSize != null ||
      textStyle.fontWeight != null
    ) {
      mods.push(
        font({
          family: textStyle.fontFamily,
          size: textStyle.fontSize,
          weight: textStyle.fontWeight ? FONT_WEIGHT_MAP[textStyle.fontWeight] : undefined,
        })
      );
    }
    if (textStyle.color != null) mods.push(foregroundStyle(textStyle.color));
    if (textStyle.letterSpacing != null) mods.push(kerning(textStyle.letterSpacing));
    if (textStyle.lineHeight != null) {
      // Approximation: SwiftUI's true `lineHeight(_:)` modifier exists only on iOS 26+.
      // Users who need exact spacing on iOS 26+ can use `lineHeight()` via the `modifiers` prop.
      const baseFontSize = textStyle.fontSize ?? 17;
      mods.push(lineSpacing(Math.max(0, textStyle.lineHeight - baseFontSize)));
    }
    if (textStyle.textAlign === 'left') mods.push(multilineTextAlignment('leading'));
    else if (textStyle.textAlign === 'right') mods.push(multilineTextAlignment('trailing'));
    else if (textStyle.textAlign === 'center') mods.push(multilineTextAlignment('center'));
  }

  if (style) {
    // Padding (innermost)
    const hasPadding =
      style.padding != null ||
      style.paddingHorizontal != null ||
      style.paddingVertical != null ||
      style.paddingTop != null ||
      style.paddingBottom != null ||
      style.paddingLeft != null ||
      style.paddingRight != null;

    if (hasPadding) {
      mods.push(
        padding({
          all: style.padding as number | undefined,
          horizontal: style.paddingHorizontal as number | undefined,
          vertical: style.paddingVertical as number | undefined,
          top: style.paddingTop as number | undefined,
          bottom: style.paddingBottom as number | undefined,
          leading: style.paddingLeft as number | undefined,
          trailing: style.paddingRight as number | undefined,
        })
      );
    }

    // Sizing (before background so background fills the frame)
    if (style.width != null || style.height != null) {
      mods.push(
        frame({
          width: style.width as number | undefined,
          height: style.height as number | undefined,
          alignment: options?.frameAlignment,
        })
      );
    }

    // Background (fills the frame area including padding)
    if (style.backgroundColor) {
      mods.push(background(String(style.backgroundColor)));
    }

    // Border (before clip so the clip rounds the border corners too)
    if (style.borderWidth != null && style.borderColor != null) {
      mods.push(border({ color: String(style.borderColor), width: style.borderWidth }));
    }

    // Clip (border radius — rounds both background and border)
    if (style.borderRadius != null) {
      mods.push(clipShape('roundedRectangle', style.borderRadius as number));
    }

    // Opacity
    if (style.opacity != null) {
      mods.push(opacity(style.opacity as number));
    }
  }

  // Events
  if (props.onPress) mods.push(onTapGesture(props.onPress));

  // Lifecycle
  if (props.onAppear) mods.push(onAppear(props.onAppear));
  if (props.onDisappear) mods.push(onDisappear(props.onDisappear));

  // Behavior
  if (props.disabled) mods.push(disabledMod(true));
  if (props.hidden) mods.push(hiddenMod(true));

  // Escape hatch — user-supplied modifiers come last
  if (extraModifiers) mods.push(...extraModifiers);

  return mods;
}
