/// <reference types="node" />
import { StyleSheetRegisterOptions } from "../types";
export type CssToReactNativeRuntimeOptions = {
    inlineRem?: number | false;
    grouping?: (string | RegExp)[];
};
/**
 * Converts a CSS file to a collection of style declarations that can be used with the StyleSheet API
 *
 * @param {Buffer} code - The CSS file contents as a buffer
 * @param {CssToReactNativeRuntimeOptions} options - (Optional) Options for the conversion process
 * @returns {StyleSheetRegisterOptions} - An object containing the extracted style declarations and animations
 */
export declare function cssToReactNativeRuntime(code: Buffer, options?: CssToReactNativeRuntimeOptions): StyleSheetRegisterOptions;
//# sourceMappingURL=index.d.ts.map