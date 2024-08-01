import type { NormalizedOptions, Options } from './Fingerprint.types';
import { SourceSkips } from './sourcer/SourceSkips';
export declare const FINGERPRINT_IGNORE_FILENAME = ".fingerprintignore";
export declare const DEFAULT_IGNORE_PATHS: string[];
export declare const DEFAULT_SOURCE_SKIPS = SourceSkips.PackageJsonAndroidAndIosScriptsIfNotContainRun;
export declare function normalizeOptionsAsync(projectRoot: string, options?: Options): Promise<NormalizedOptions>;
