/**
 * Base interface for all view modifiers.
 * All modifiers must have a type field and can include arbitrary parameters.
 */
export interface ModifierConfig {
    $type: string;
    [key: string]: any;
    eventListener?: (args: any) => void;
}
/**
 * Factory function to create modifier configuration objects.
 * This is used by all built-in modifier functions and can be used by 3rd party libraries to create custom modifiers.
 *
 * @param type - The modifier type string that maps to a registered native modifier.
 * @param params - Additional parameters to pass to the modifier.
 * @returns A `ModifierConfig` object that can be passed in the `modifiers` prop array.
 *
 * @example
 * ```ts
 * // In a 3rd party package
 * import { createModifier } from '@expo/ui/swift-ui/modifiers';
 *
 * export const blurEffect = (params: { radius: number; style?: string }) =>
 *   createModifier('blurEffect', params);
 * ```
 */
export declare function createModifier(type: string, params?: Record<string, any>): ModifierConfig;
//# sourceMappingURL=createModifier.d.ts.map