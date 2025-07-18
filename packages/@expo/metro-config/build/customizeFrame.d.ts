import type { SymbolicatorConfigT } from '@expo/metro/metro-config';
type CustomizeFrameFunc = SymbolicatorConfigT['customizeFrame'];
export declare const INTERNAL_CALLSITES_REGEX: RegExp;
/**
 * The default frame processor. This is used to modify the stack traces.
 * This method attempts to collapse all frames that aren't relevant to
 * the user by default.
 */
export declare function getDefaultCustomizeFrame(): CustomizeFrameFunc;
export {};
