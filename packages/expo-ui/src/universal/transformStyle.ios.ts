import {
  background,
  border,
  clipShape,
  disabled as disabledMod,
  frame,
  hidden as hiddenMod,
  onAppear,
  onDisappear,
  onTapGesture,
  opacity,
  padding,
  type ModifierConfig,
} from '@expo/ui/swift-ui/modifiers';

import type { UniversalBaseProps, UniversalStyle } from './types';

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
  }
): ModifierConfig[] {
  const mods: ModifierConfig[] = [];

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
