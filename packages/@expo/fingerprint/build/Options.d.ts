import type { NormalizedOptions, Options } from './Fingerprint.types';
export declare const FINGERPRINT_IGNORE_FILENAME = ".fingerprintignore";
export declare const DEFAULT_IGNORE_PATHS: string[];
export declare function normalizeOptionsAsync(projectRoot: string, options?: Options): Promise<NormalizedOptions>;
