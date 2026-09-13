import {
  alpha,
  background,
  border,
  clickable,
  clip,
  fillMaxHeight,
  fillMaxSize,
  fillMaxWidth,
  height,
  padding,
  paddingAll,
  Shapes,
  size,
  testID as testIDModifier,
  width,
  type ModifierConfig,
} from '@expo/ui/jetpack-compose/modifiers';

import { omitUserOverridden } from './modifierUtils';
import type { UniversalBaseProps, UniversalStyle } from './types';

/**
 * Parses a CSS percentage string (e.g. "100%", "50%") into a fraction (1.0, 0.5).
 * Returns null when the value is not a percentage string.
 */
function parsePercentage(value: unknown): number | null {
  if (typeof value !== 'string' || !value.endsWith('%')) return null;
  const n = parseFloat(value);
  return isNaN(n) ? null : n / 100;
}

/**
 * Converts universal style/event/lifecycle/behavior props into a Jetpack
 * Compose modifier array.
 *
 * Compose modifiers apply outside-in (left to right). To match React Native's
 * box model where background includes the padding area and border is outermost:
 *   sizing → border → clip → background → padding → opacity
 *   → events → behavior → user escape-hatch
 *
 * Style-derived modifiers yield to user-supplied modifiers of the same
 * `$type`, so the escape hatch can override anything derived from props.
 */
export function transformToModifiers(
  style: UniversalStyle | undefined,
  props: Pick<UniversalBaseProps, 'onPress' | 'disabled' | 'hidden' | 'testID'>,
  extraModifiers?: ModifierConfig[]
): ModifierConfig[] {
  let mods: ModifierConfig[] = [];

  if (style) {
    // Sizing (outermost)
    // Percentage strings (e.g. "100%") must be converted to fillMax* modifiers
    // because the native bridge expects Int for width/height and throws a
    // FieldCastException when it receives a string.
    const wPct = parsePercentage(style.width);
    const hPct = parsePercentage(style.height);
    if (style.width != null && style.height != null) {
      if (wPct !== null && hPct !== null) {
        if (wPct === hPct) {
          mods.push(fillMaxSize(wPct));
        } else {
          mods.push(fillMaxWidth(wPct));
          mods.push(fillMaxHeight(hPct));
        }
      } else if (wPct !== null) {
        mods.push(fillMaxWidth(wPct));
        mods.push(height(style.height as number));
      } else if (hPct !== null) {
        mods.push(width(style.width as number));
        mods.push(fillMaxHeight(hPct));
      } else {
        mods.push(size(style.width as number, style.height as number));
      }
    } else if (style.width != null) {
      mods.push(wPct !== null ? fillMaxWidth(wPct) : width(style.width as number));
    } else if (style.height != null) {
      mods.push(hPct !== null ? fillMaxHeight(hPct) : height(style.height as number));
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

  // A user-supplied modifier replaces any style-derived modifier of the same
  // type. The event and behavior modifiers below are never dropped.
  mods = omitUserOverridden(mods, extraModifiers);

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
