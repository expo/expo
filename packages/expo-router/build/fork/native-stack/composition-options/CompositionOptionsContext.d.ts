import type { CompositionContextValue, CompositionRegistry } from './types';
import type { NativeStackNavigationOptions } from '../../../react-navigation/native-stack';
/** @internal */
export declare const CompositionContext: import("react").Context<CompositionContextValue | null>;
type RegistryAction = {
    type: 'set';
    routeKey: string;
    options: Partial<NativeStackNavigationOptions>;
} | {
    type: 'unset';
    routeKey: string;
    options: Partial<NativeStackNavigationOptions>;
};
/** @internal */
export declare function registryReducer(state: CompositionRegistry, action: RegistryAction): CompositionRegistry;
/**
 * Provides the composition registry to descendant composition components.
 *
 * Uses useReducer with immutable object updates for React Compiler compatibility.
 * Each set/unset call produces a new object reference, which the compiler can
 * track as a reactive dependency.
 */
export declare function useCompositionRegistry(): {
    registry: CompositionRegistry;
    contextValue: {
        set: (routeKey: string, options: Partial<NativeStackNavigationOptions>) => void;
        unset: (routeKey: string, options: Partial<NativeStackNavigationOptions>) => void;
    };
};
/**
 * Hook used by composition components to register their options in the composition registry.
 *
 * Registers options on mount/update via useSafeLayoutEffect, and unregisters on unmount.
 *
 * The `options` argument MUST be referentially stable across renders that
 * do not intend to re-register. The hook compares by identity, not by
 * structure: passing a fresh object every render causes the effect to
 * re-fire on every parent render, which dispatches into the registry, which
 * re-renders the navigator, which re-renders the parent screen, and so on.
 * On a screen with state this loops until React aborts with
 * "Maximum update depth exceeded".
 *
 * For callers whose options derive from JSX children, inline style objects,
 * inline color values, or inline event handlers, prefer
 * `useStableCompositionOption`. It absorbs the memoization burden by
 * structurally fingerprinting its input.
 */
export declare function useCompositionOption(options: Partial<NativeStackNavigationOptions>): void;
export {};
//# sourceMappingURL=CompositionOptionsContext.d.ts.map