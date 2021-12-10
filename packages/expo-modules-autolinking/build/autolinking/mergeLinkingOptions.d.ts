import { SearchOptions } from '../types';
/**
 * Path to the `package.json` of the closest project in the current working dir.
 */
export declare const projectPackageJsonPath: string;
/**
 * Merges autolinking options from different sources (the later the higher priority)
 * - options defined in package.json's `expo.autolinking` field
 * - platform-specific options from the above (e.g. `expo.autolinking.ios`)
 * - options provided to the CLI command
 */
export declare function mergeLinkingOptionsAsync<OptionsType extends SearchOptions>(providedOptions: OptionsType): Promise<OptionsType>;
