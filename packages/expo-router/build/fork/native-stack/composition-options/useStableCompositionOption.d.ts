import type { NativeStackNavigationOptions } from '../../../react-navigation/native-stack';
/**
 * Variant of `useCompositionOption` that absorbs the memoization burden by
 * structurally fingerprinting `input`. Use this when the caller's options
 * derive from data that may contain unstable references across renders:
 * JSX children (a fresh array on every parent render), inline style
 * objects, inline color values, inline event handlers, etc.
 *
 * The fingerprint walks `input` recursively and skips function values, so
 * inline `onPress`/`onChangeText` callbacks do not retrigger registration.
 * Function values still flow through the BUILT options object via the
 * `build` callback, so the rendered output uses the closure that was
 * active at the time of the last meaningful change. Handlers that need
 * to read live state should close over a ref, or be stabilized with
 * `useCallback` so the helper sees a single identity.
 *
 * The build callback runs only when the fingerprint changes, so callers
 * do not need their own `useMemo`.
 *
 * @example
 * ```tsx
 * useStableCompositionOption(
 *   { children, placement, asChild },
 *   (input) => appendStackToolbarPropsToOptions({}, input)
 * );
 * ```
 */
export declare function useStableCompositionOption<TInput>(input: TInput, build: (input: TInput) => Partial<NativeStackNavigationOptions>): void;
/**
 * Produces a stable structural string for any value. Two inputs that
 * produce the same string can be safely treated as equivalent for the
 * purposes of `useCompositionOption` registration. Function-typed values
 * are intentionally skipped — see `useStableCompositionOption` for the
 * rationale.
 *
 * @internal
 */
export declare function fingerprintValue(value: unknown, depth?: number): string;
//# sourceMappingURL=useStableCompositionOption.d.ts.map