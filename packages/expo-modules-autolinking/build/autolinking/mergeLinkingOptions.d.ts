import { SearchOptions } from '../types';
/**
 * Find the path to the `package.json` of the closest project in the given project root.
 */
export declare function getProjectPackageJsonPathAsync(projectRoot: string): Promise<string>;
/**
 * Merges autolinking options from different sources (the later the higher priority)
 * - options defined in package.json's `expo.autolinking` field
 * - platform-specific options from the above (e.g. `expo.autolinking.apple`)
 * - options provided to the CLI command
 */
export declare function mergeLinkingOptionsAsync<OptionsType extends SearchOptions>(providedOptions: OptionsType): Promise<OptionsType>;
/**
 * Resolves autolinking search paths. If none is provided, it accumulates all node_modules when
 * going up through the path components. This makes workspaces work out-of-the-box without any configs.
 */
export declare function resolveSearchPathsAsync(searchPaths: string[] | null, cwd: string): Promise<string[]>;
