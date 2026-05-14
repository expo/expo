import { type ObservableState } from '../../State/useNativeState';
type AppearSymbolEffect = {
    effect: 'appear';
    scale?: 'down' | 'up';
    scope?: 'byLayer' | 'wholeSymbol';
};
type BounceSymbolEffect = {
    effect: 'bounce';
    direction?: 'down' | 'up';
    scope?: 'byLayer' | 'wholeSymbol';
};
type BreatheSymbolEffect = {
    effect: 'breathe';
    style?: 'plain' | 'pulse';
    scope?: 'byLayer' | 'wholeSymbol';
};
type DisappearSymbolEffect = {
    effect: 'disappear';
    scale?: 'down' | 'up';
    scope?: 'byLayer' | 'wholeSymbol';
};
type DrawOffSymbolEffect = {
    effect: 'drawOff';
    playbackStyle?: 'nonReversed' | 'reversed';
    scope?: 'byLayer' | 'individually' | 'wholeSymbol';
};
type DrawOnSymbolEffect = {
    effect: 'drawOn';
    scope?: 'byLayer' | 'individually' | 'wholeSymbol';
};
type PulseSymbolEffect = {
    effect: 'pulse';
    scope?: 'byLayer' | 'wholeSymbol';
};
type RotateSymbolEffect = {
    effect: 'rotate';
    direction?: 'clockwise' | 'counterClockwise';
    scope?: 'byLayer' | 'wholeSymbol';
};
type ScaleSymbolEffect = {
    effect: 'scale';
    scale?: 'down' | 'up';
    scope?: 'byLayer' | 'wholeSymbol';
};
type VariableColorSymbolEffect = {
    effect: 'variableColor';
    fillStyle?: 'cumulative' | 'iterative';
    playbackStyle?: 'nonReversing' | 'reversing';
    inactiveLayers?: 'dim' | 'hide';
};
type WiggleSymbolEffect = {
    effect: 'wiggle';
    direction?: 'backward' | 'clockwise' | 'counterClockwise' | 'down' | 'forward' | 'left' | 'right' | 'up';
    customAngle?: number;
    scope?: 'byLayer' | 'wholeSymbol';
};
export type SymbolEffect = AppearSymbolEffect | BounceSymbolEffect | BreatheSymbolEffect | DisappearSymbolEffect | DrawOffSymbolEffect | DrawOnSymbolEffect | PulseSymbolEffect | RotateSymbolEffect | ScaleSymbolEffect | VariableColorSymbolEffect | WiggleSymbolEffect;
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
    repeat?: 'continuous' | 'nonRepeating' | {
        count?: number;
        delay?: number;
    };
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
export declare const symbolEffect: (effect: SymbolEffect, args?: {
    options?: SymbolEffectOptions;
    /** Indefinite effects: runs while `state.value === true`. Default active when omitted. */
    isActive?: ObservableState<boolean>;
    /** Discrete effects: the effect fires once each time this value changes. */
    value?: ObservableState<DiscreteSymbolEffectValue>;
}) => import("./createModifier").ModifierConfig;
export { type ObservableState };
//# sourceMappingURL=symbolEffect.d.ts.map