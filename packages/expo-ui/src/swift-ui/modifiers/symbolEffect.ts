import { getStateId, type ObservableState } from '../../State';
import { createModifier } from './createModifier';
import { flattenOptions } from './symbolEffectOptions';

// https://developer.apple.com/documentation/symbols/appearsymboleffect
type AppearSymbolEffect = {
  effect: 'appear';
  scale?: 'down' | 'up';
  scope?: 'byLayer' | 'wholeSymbol';
};

// https://developer.apple.com/documentation/symbols/bouncesymboleffect
type BounceSymbolEffect = {
  effect: 'bounce';
  direction?: 'down' | 'up';
  scope?: 'byLayer' | 'wholeSymbol';
};

// https://developer.apple.com/documentation/symbols/breathesymboleffect
type BreatheSymbolEffect = {
  effect: 'breathe';
  style?: 'plain' | 'pulse';
  scope?: 'byLayer' | 'wholeSymbol';
};

// https://developer.apple.com/documentation/symbols/disappearsymboleffect
type DisappearSymbolEffect = {
  effect: 'disappear';
  scale?: 'down' | 'up';
  scope?: 'byLayer' | 'wholeSymbol';
};

// https://developer.apple.com/documentation/symbols/drawoffsymboleffect
type DrawOffSymbolEffect = {
  effect: 'drawOff';
  playbackStyle?: 'nonReversed' | 'reversed';
  scope?: 'byLayer' | 'individually' | 'wholeSymbol';
};

// https://developer.apple.com/documentation/symbols/drawonsymboleffect
type DrawOnSymbolEffect = {
  effect: 'drawOn';
  scope?: 'byLayer' | 'individually' | 'wholeSymbol';
};

// https://developer.apple.com/documentation/symbols/pulsesymboleffect
type PulseSymbolEffect = {
  effect: 'pulse';
  scope?: 'byLayer' | 'wholeSymbol';
};

// https://developer.apple.com/documentation/symbols/rotatesymboleffect
type RotateSymbolEffect = {
  effect: 'rotate';
  direction?: 'clockwise' | 'counterClockwise';
  scope?: 'byLayer' | 'wholeSymbol';
};

// https://developer.apple.com/documentation/symbols/scalesymboleffect
type ScaleSymbolEffect = {
  effect: 'scale';
  scale?: 'down' | 'up';
  scope?: 'byLayer' | 'wholeSymbol';
};

// https://developer.apple.com/documentation/symbols/variablecolorsymboleffect
type VariableColorSymbolEffect = {
  effect: 'variableColor';
  fillStyle?: 'cumulative' | 'iterative';
  playbackStyle?: 'nonReversing' | 'reversing';
  inactiveLayers?: 'dim' | 'hide';
};

// https://developer.apple.com/documentation/symbols/wigglesymboleffect
type WiggleSymbolEffect = {
  effect: 'wiggle';
  direction?:
    | 'backward'
    | 'clockwise'
    | 'counterClockwise'
    | 'down'
    | 'forward'
    | 'left'
    | 'right'
    | 'up';
  // Custom wiggle angle in degrees. Takes precedence over `direction` when set.
  customAngle?: number;
  scope?: 'byLayer' | 'wholeSymbol';
};

export type SymbolEffect =
  | AppearSymbolEffect
  | BounceSymbolEffect
  | BreatheSymbolEffect
  | DisappearSymbolEffect
  | DrawOffSymbolEffect
  | DrawOnSymbolEffect
  | PulseSymbolEffect
  | RotateSymbolEffect
  | ScaleSymbolEffect
  | VariableColorSymbolEffect
  | WiggleSymbolEffect;

/**
 * A transition that applies the default animation to a symbol-based image in a context-sensitive manner.
 *
 * @see Official [Apple documentation](https://developer.apple.com/documentation/symbols/symboleffect/automatic).
 */
export type AutomaticSymbolEffect = {
  effect: 'automatic';
};

/**
 * An animation that replaces the layers of one symbol-based image with those of another.
 *
 * @see Official [Apple documentation](https://developer.apple.com/documentation/symbols/symboleffect/replace).
 */
export type ReplaceSymbolEffect = {
  effect: 'replace';
  /**
   * The variant of the Replace animation.
   * - `'downUp'` - replaces a symbol by scaling it down, and scaling a different symbol up.
   * - `'upUp'` - replaces a symbol by scaling it up, and scaling a different symbol up.
   * - `'offUp'` - replaces a symbol by removing it, and scaling a different symbol up.
   */
  direction?: 'downUp' | 'upUp' | 'offUp';
  /**
   * How the effect replaces the symbol layers.
   * - `'byLayer'` - replaces each layer separately.
   * - `'wholeSymbol'` - replaces all layers simultaneously.
   */
  scope?: 'byLayer' | 'wholeSymbol';
};

/**
 * An effect that animates between symbols or different configurations of the same symbol.
 *
 * @see Official [Apple documentation](https://developer.apple.com/documentation/symbols/contenttransitionsymboleffect).
 */
export type ContentTransitionSymbolEffect = AutomaticSymbolEffect | ReplaceSymbolEffect;

/**
 * Options that configure how effects apply to symbol-based images.
 *
 * @see Official [Apple documentation](https://developer.apple.com/documentation/symbols/symboleffectoptions).
 */
export type SymbolEffectOptions = {
  /**
   * The preferred repeat behavior. Omit it to use the default set of effect options.
   * - `'nonRepeating'` - prefers to not repeat.
   * - `'continuous'` - prefers to repeat indefinitely, using continuous animations if available.
   * - `{ count?, delay? }` - repeats with a preferred play count and delay, using periodic animations.
   *   `count` is the preferred number of times to play the effect. Omit it to play indefinitely.
   *   `delay` is the preferred delay between repetitions, in seconds. Omit it for the default delay.
   *
   * The `'continuous'` and `{ count?, delay? }` values require iOS 18.0+ and tvOS 18.0+.
   * On earlier versions, the effect uses the default repeat behavior.
   */
  repeat?: 'continuous' | 'nonRepeating' | { count?: number; delay?: number };
  /**
   * The preferred speed multiplier to play the effect with. The default multiplier is `1.0`.
   * The system may clamp very large or small values.
   */
  speed?: number;
};

/** Equatable primitive accepted as a discrete effect trigger. */
export type DiscreteSymbolEffectValue = number | string | boolean;

/**
 * Applies an SF Symbol effect to a view.
 *
 * @platform ios 17.0+
 * @platform tvos 17.0+
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/SwiftUI/View/symbolEffect(_:options:value:)).
 *
 * @example
 * ```tsx
 * const trigger = useNativeState(0);
 * <Image
 *   systemName="bell.fill"
 *   modifiers={[symbolEffect({ effect: 'bounce', direction: 'up' }, { value: trigger })]}
 * />
 * ```
 */
export const symbolEffect = (
  effect: SymbolEffect,
  args: {
    options?: SymbolEffectOptions;
    /** Indefinite effects: runs while `state.value === true`. Default active when omitted. */
    isActive?: ObservableState<boolean>;
    /** Discrete effects: the effect fires once each time this value changes. */
    value?: ObservableState<DiscreteSymbolEffectValue>;
  } = {}
) => {
  const { options, isActive, value } = args;
  return createModifier('symbolEffect', {
    effect,
    options: flattenOptions(options),
    isActive: isActive ? getStateId(isActive) : undefined,
    value: value ? getStateId(value) : undefined,
  });
};

// exported for docs api data
export { type ObservableState };
