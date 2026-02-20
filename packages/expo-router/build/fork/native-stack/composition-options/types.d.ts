import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
/**
 * Registry mapping route keys to composition component options.
 *
 * Structure: Record<routeKey, Record<componentId, options>>
 *
 * Each composition component (Title, BackButton, Header, Toolbar) registers
 * its options under a unique componentId (from React's useId).
 * Object property order is guaranteed for string keys,
 * so later registrations override earlier ones.
 *
 * @internal
 */
export type CompositionRegistry = Record<string, Record<string, Partial<NativeStackNavigationOptions>>>;
/** @internal */
export interface CompositionContextValue {
    /**
     * Register or update options for a composition component.
     */
    setOptionsFor(routeKey: string, componentId: string, options: Partial<NativeStackNavigationOptions>): void;
    /**
     * Unregister a composition component's options (should be called on unmount).
     */
    unregister(routeKey: string, componentId: string): void;
}
//# sourceMappingURL=types.d.ts.map