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
 * The symbol effect that the system selects for the content transition.
 *
 * @see Official [Apple documentation](https://developer.apple.com/documentation/symbols/automaticsymboleffect).
 */
export type AutomaticSymbolEffect = {
  effect: 'automatic';
};

/**
 * A symbol effect that replaces one symbol with another symbol.
 *
 * @see Official [Apple documentation](https://developer.apple.com/documentation/symbols/replacesymboleffect).
 */
export type ReplaceSymbolEffect = {
  effect: 'replace';
  /**
   * How the effect scales the outgoing and incoming symbols.
   * - `'downUp'` - scales the outgoing symbol down and the incoming symbol up.
   * - `'upUp'` - scales both symbols up.
   * - `'offUp'` - removes the outgoing symbol and scales the incoming symbol up.
   */
  direction?: 'downUp' | 'upUp' | 'offUp';
  /** Whether the effect animates each layer of the symbol or the symbol as a whole. */
  scope?: 'byLayer' | 'wholeSymbol';
};

/**
 * A symbol effect for the `symbolEffect` content transition.
 *
 * @see Official [Apple documentation](https://developer.apple.com/documentation/symbols/contenttransitionsymboleffect).
 */
export type ContentTransitionSymbolEffect = AutomaticSymbolEffect | ReplaceSymbolEffect;

/**
 * Animation options for a symbol effect.
 *
 * @see Official [Apple documentation](https://developer.apple.com/documentation/symbols/symboleffectoptions).
 */
export type SymbolEffectOptions = {
  /**
   * How the effect repeats. Omit for the effect's natural cadence.
   * - `'nonRepeating'` — play exactly once.
   * - `'continuous'` — smooth, indefinite repetition (iOS 18+).
   * - `{ count?, delay? }` — periodic repetition with optional count and delay in seconds (iOS 18+).
   */
  repeat?: 'continuous' | 'nonRepeating' | { count?: number; delay?: number };
  /** Animation speed multiplier (1.0 = default). */
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
