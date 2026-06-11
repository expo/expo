import type { Platform } from './types';
export declare const validatePrebuild: (platform: Platform, options?: {
    dryRun?: boolean;
}) => Promise<void>;
export declare const validatePackageInstalled: () => void;
