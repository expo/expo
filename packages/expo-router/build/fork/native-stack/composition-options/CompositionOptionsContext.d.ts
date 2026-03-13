import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import type { CompositionContextValue, CompositionRegistry } from './types';
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
 * Callers should memoize the options object to avoid unnecessary re-registrations.
 */
export declare function useCompositionOption(options: Partial<NativeStackNavigationOptions>): void;
export {};
//# sourceMappingURL=CompositionOptionsContext.d.ts.map