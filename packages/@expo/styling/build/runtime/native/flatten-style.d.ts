import { Interaction, Style, StyleProp } from "../../types";
export interface FlattenStyleOptions {
    variables: Record<string, any>;
    interaction?: Interaction;
    containers?: Record<string, any>;
    ch?: number;
    cw?: number;
}
/**
 * Reduce a StyleProp to a flat Style object.
 *
 * @remarks
 * As we loop over keys & values, we will resolve any dynamic values.
 * Some values cannot be calculated until the entire style has been flattened.
 * These values are defined as a getter and will be resolved lazily.
 *
 * @param styles The style or styles to flatten.
 * @param options The options for flattening the styles.
 * @param flatStyle The flat style object to add the flattened styles to.
 * @returns The flattened style object.
 */
export declare function flattenStyle(styles: StyleProp, options: FlattenStyleOptions, flatStyle?: Style): Style;
//# sourceMappingURL=flatten-style.d.ts.map