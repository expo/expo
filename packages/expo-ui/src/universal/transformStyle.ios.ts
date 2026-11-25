import {
  background,
  border,
  clipShape,
  contentShape,
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
  shapes,
  type ModifierConfig,
} from '@expo/ui/swift-ui/modifiers';

import type { UniversalTextStyle } from './Text/types';
import {
  createUniversalLayoutModifier,
  omitUserOverridden,
  omitUserOverriddenDimensions,
  serializeUniversalDimensions,
} from './modifierUtils';
import type { UniversalBaseProps, UniversalStyle } from './types';

// A user frame owns only the axes it sets. Keep a derived frame that still
// owns the other axis, and keep the layout value the parent stack reads.
const preservedSizingTypes = new Set(['frame', 'universalLayout']);

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
 *   padding → fixed frame → universal layout → background → border → clip → opacity
 *   → events → lifecycle → behavior → user escape-hatch
 *
 * Fixed sizes become a `frame`.
 * Percentages stay on `universalLayout` so the parent stack can resolve them.
 * Style-derived modifiers yield to user-supplied modifiers of the same
 * `$type`, so the escape hatch can override anything derived from props.
 */
export function transformToModifiers(
  style: UniversalStyle | undefined,
  props: Pick<
    UniversalBaseProps,
    'onPress' | 'onAppear' | 'onDisappear' | 'disabled' | 'hidden' | 'testID'
  >,
  extraModifiers?: ModifierConfig[],
  options?: {
    /** Component name included in invalid-dimension development warnings. */
    componentName?: string;
    /** Alignment for the frame modifier (used by Column/Row). */
    frameAlignment?: Parameters<typeof frame>[0]['alignment'];
    /** Text-styling props for text-rendering components. */
    textStyle?: UniversalTextStyle;
  }
): ModifierConfig[] {
  let mods: ModifierConfig[] = [];
  const dimensions = omitUserOverriddenDimensions(
    serializeUniversalDimensions(style, options?.componentName),
    extraModifiers,
    'ios'
  );
  const fixedWidth = dimensions.widthPoints;
  const fixedHeight = dimensions.heightPoints;

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
  }

  // Fixed sizing is applied directly. Percentages remain as layout values for
  // the owning universal layout to resolve against its content box.
  if (fixedWidth != null || fixedHeight != null) {
    mods.push(
      frame({
        width: fixedWidth,
        height: fixedHeight,
        alignment: options?.frameAlignment,
      })
    );
  }

  const universalLayoutModifier = createUniversalLayoutModifier(dimensions);
  if (universalLayoutModifier) mods.push(universalLayoutModifier);

  if (style) {
    // Background (fills the frame area including padding)
    if (style.backgroundColor) {
      mods.push(background(style.backgroundColor));
    }

    // Border (before clip so the clip rounds the border corners too)
    if (style.borderWidth != null && style.borderColor != null) {
      mods.push(border({ content: style.borderColor, width: style.borderWidth }));
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

  // A user-supplied modifier replaces any style-derived modifier of the same
  // type. The event, lifecycle, and behavior modifiers below are never dropped.
  // Axis-aware sizing precedence has already removed only the dimensions set
  // by a user frame. Preserve any derived frame that still owns the other axis.
  mods = omitUserOverridden(mods, extraModifiers, preservedSizingTypes);

  // Events. SwiftUI only hit-tests drawn content, so the `contentShape` lets
  // taps on empty space (for example a `Spacer` in a `Row`) reach `onPress`.
  if (props.onPress) mods.push(contentShape(shapes.rectangle()), onTapGesture(props.onPress));

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
