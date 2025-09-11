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
 * This is used internally by all modifier functions.
 */
export declare function createModifier(type: string, params?: Record<string, any>): ModifierConfig;
//# sourceMappingURL=createModifier.d.ts.map