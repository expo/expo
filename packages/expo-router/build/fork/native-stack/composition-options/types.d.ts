import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
/**
 * Registry mapping route keys to composition component options.
 *
 * Structure: Record<routeKey, options[]>
 *
 * Each composition component (Title, BackButton, Header, Toolbar) registers
 * its memoized options object. Array order reflects registration order,
 * so later registrations override earlier ones during merge.
 *
 * @internal
 */
export type CompositionRegistry = Record<string, Partial<NativeStackNavigationOptions>[]>;
/** @internal */
export interface CompositionContextValue {
    /**
     * Register or update options for a composition component.
     */
    set(routeKey: string, options: Partial<NativeStackNavigationOptions>): void;
    /**
     * Remove a composition component's options by reference (should be called on unmount).
     */
    unset(routeKey: string, options: Partial<NativeStackNavigationOptions>): void;
}
//# sourceMappingURL=types.d.ts.map