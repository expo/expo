import type { AppleAutolinkCondition } from '../../types';
declare module 'node:module' {
    function _nodeModulePaths(base: string): readonly string[];
}
export interface AppleAutolinkContext {
    /** JS project root, used to resolve npm packages. */
    appRoot?: string;
    /** Native (iOS) project directory where `Podfile.properties.json` lives. */
    commandRoot?: string;
}
/**
 * Evaluates whether a conditional podspec entry should be autolinked.
 *
 * This runs in the autolinking resolver — the component that already resolves the
 * dependency graph — so installability is checked in-process rather than from a
 * subprocess at `pod install` time.
 */
export declare function appleAutolinkConditionMetAsync(condition: AppleAutolinkCondition, context: AppleAutolinkContext): Promise<boolean>;
