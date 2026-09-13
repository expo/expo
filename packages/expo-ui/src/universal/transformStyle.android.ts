import {
  alpha,
  background,
  border,
  clickable,
  clip,
  fillMaxHeight,
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
 * Returns null when the value is not a percentage string, or when the resulting
 * fraction is outside [0, 1] (Compose's fillMaxWidth/fillMaxHeight require
 * fraction ∈ [0, 1] and throw an IllegalArgumentException otherwise).
 */
function parsePercentage(value: unknown): number | null {
  if (typeof value !== 'string' || !value.endsWith('%')) return null;
  const n = parseFloat(value);
  if (isNaN(n)) return null;
  const fraction = n / 100;
  if (fraction < 0 || fraction > 1) {
    if (__DEV__) {
      console.warn(
        `expo-ui: percentage "${value}" is out of the valid range [0%, 100%] and will be ignored. ` +
          `Compose's fillMaxWidth/fillMaxHeight require a fraction in [0, 1].`
      );
    }
    return null;
  }
  return fraction;
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
    //
    // We always emit fillMaxWidth + fillMaxHeight separately (never fillMaxSize)
    // so that omitUserOverridden can match each axis independently when the user
    // supplies their own fillMaxWidth or fillMaxHeight modifier.
    //
    // Non-percentage strings (e.g. "auto") are skipped with a dev warning — the
    // native bridge cannot accept them and would throw a FieldCastException.
    const wPct = parsePercentage(style.width);
    const hPct = parsePercentage(style.height);

    // Returns true when a dimension value is safe to cast to number (i.e. it is
    // a number, not a string). A string that is not a valid percentage has already
    // been rejected by parsePercentage above, so any remaining string must be a
    // non-percentage value (e.g. "auto") that the bridge cannot accept.
    const isNumeric = (v: unknown): v is number => typeof v !== 'string';

    if (style.width != null && style.height != null) {
      if (wPct !== null && hPct !== null) {
        mods.push(fillMaxWidth(wPct));
        mods.push(fillMaxHeight(hPct));
      } else if (wPct !== null) {
        mods.push(fillMaxWidth(wPct));
        if (isNumeric(style.height)) {
          mods.push(height(style.height));
        } else if (__DEV__) {
          console.warn(
            `expo-ui: non-percentage string height "${style.height}" is not supported on Android and will be ignored.`
          );
        }
      } else if (hPct !== null) {
        if (isNumeric(style.width)) {
          mods.push(width(style.width));
        } else if (__DEV__) {
          console.warn(
            `expo-ui: non-percentage string width "${style.width}" is not supported on Android and will be ignored.`
          );
        }
        mods.push(fillMaxHeight(hPct));
      } else {
        if (isNumeric(style.width) && isNumeric(style.height)) {
          mods.push(size(style.width, style.height));
        } else if (isNumeric(style.width)) {
          mods.push(width(style.width));
          if (__DEV__) {
            console.warn(
              `expo-ui: non-percentage string height "${style.height}" is not supported on Android and will be ignored.`
            );
          }
        } else if (isNumeric(style.height)) {
          if (__DEV__) {
            console.warn(
              `expo-ui: non-percentage string width "${style.width}" is not supported on Android and will be ignored.`
            );
          }
          mods.push(height(style.height));
        } else {
          if (__DEV__) {
            console.warn(
              `expo-ui: non-percentage string width "${style.width}" and height "${style.height}" are not supported on Android and will be ignored.`
            );
          }
        }
      }
    } else if (style.width != null) {
      if (wPct !== null) {
        mods.push(fillMaxWidth(wPct));
      } else if (isNumeric(style.width)) {
        mods.push(width(style.width));
      } else if (__DEV__) {
        console.warn(
          `expo-ui: non-percentage string width "${style.width}" is not supported on Android and will be ignored.`
        );
      }
    } else if (style.height != null) {
      if (hPct !== null) {
        mods.push(fillMaxHeight(hPct));
      } else if (isNumeric(style.height)) {
        mods.push(height(style.height));
      } else if (__DEV__) {
        console.warn(
          `expo-ui: non-percentage string height "${style.height}" is not supported on Android and will be ignored.`
        );
      }
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
