import {
  alpha,
  background,
  border,
  clickable,
  clip,
  height,
  padding,
  paddingAll,
  Shapes,
  size,
  testID as testIDModifier,
  width,
  type ModifierConfig,
} from '@expo/ui/jetpack-compose/modifiers';

import type { UniversalBaseProps, UniversalStyle } from './types';

/**
 * Converts universal style/event/lifecycle/behavior props into a Jetpack
 * Compose modifier array.
 *
 * Compose modifiers apply outside-in (left to right). To match React Native's
 * box model where background includes the padding area and border is outermost:
 *   sizing → border → clip → background → padding → opacity
 *   → events → behavior → user escape-hatch
 */
export function transformToModifiers(
  style: UniversalStyle | undefined,
  props: Pick<UniversalBaseProps, 'onPress' | 'disabled' | 'hidden' | 'testID'>,
  extraModifiers?: ModifierConfig[]
): ModifierConfig[] {
  const mods: ModifierConfig[] = [];

  if (style) {
    // Sizing (outermost)
    if (style.width != null && style.height != null) {
      mods.push(size(style.width as number, style.height as number));
    } else if (style.width != null) {
      mods.push(width(style.width as number));
    } else if (style.height != null) {
      mods.push(height(style.height as number));
    }

    // Border + background + borderRadius handling.
    // Compose's border() doesn't accept a shape, so when borderRadius is set
    // alongside border, we simulate a rounded border using layered backgrounds:
    // clip(outer) → background(borderColor) → padding(borderWidth) → clip(inner) → background(bgColor)
    const hasBorder = style.borderWidth != null && style.borderColor != null;
    const hasRadius = style.borderRadius != null;

    if (hasBorder && hasRadius) {
      const radius = style.borderRadius as number;
      const bw = style.borderWidth as number;
      mods.push(clip(Shapes.RoundedCorner(radius)));
      mods.push(background(String(style.borderColor)));
      mods.push(paddingAll(bw));
      mods.push(clip(Shapes.RoundedCorner(Math.max(0, radius - bw))));
      if (style.backgroundColor) {
        mods.push(background(String(style.backgroundColor)));
      }
    } else {
      if (hasBorder) {
        mods.push(border(style.borderWidth!, String(style.borderColor!)));
      }
      if (hasRadius) {
        mods.push(clip(Shapes.RoundedCorner(style.borderRadius as number)));
      }
      if (style.backgroundColor) {
        mods.push(background(String(style.backgroundColor)));
      }
    }

    // Padding (innermost — inside background)
    // Specific paddings override directional, which override shorthand,
    // matching CSS/RN cascade: paddingTop > paddingVertical > padding.
    {
      const all = (style.padding as number) ?? 0;
      const top = (style.paddingTop as number) ?? (style.paddingVertical as number) ?? all;
      const bottom = (style.paddingBottom as number) ?? (style.paddingVertical as number) ?? all;
      const start = (style.paddingLeft as number) ?? (style.paddingHorizontal as number) ?? all;
      const end = (style.paddingRight as number) ?? (style.paddingHorizontal as number) ?? all;
      if (top || bottom || start || end) {
        if (top === bottom && bottom === start && start === end) {
          mods.push(paddingAll(top));
        } else {
          mods.push(padding(start, top, end, bottom));
        }
      }
    }

    // Opacity
    if (style.opacity != null) {
      mods.push(alpha(style.opacity as number));
    }
  }

  // Events — Compose uses clickable modifier
  if (props.onPress) mods.push(clickable(props.onPress));

  // Behavior
  if (props.hidden) mods.push(alpha(0));
  if (props.testID) mods.push(testIDModifier(props.testID));
  // disabled: handled at component level (Button → enabled prop; others → skip clickable)

  // Escape hatch — user-supplied modifiers come last
  if (extraModifiers) mods.push(...extraModifiers);

  return mods;
}
