import type { Platform } from './types';
export declare const validatePrebuild: (platform: Platform) => Promise<void>;
export declare const validatePackageInstalled: () => void;
export declare const validatePrecompiledModules: () => void;
