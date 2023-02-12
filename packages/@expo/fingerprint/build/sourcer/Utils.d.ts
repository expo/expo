import type { HashSource } from '../Fingerprint.types';
export declare function getFileBasedHashSourceAsync(projectRoot: string, filePath: string, reason: string): Promise<HashSource | null>;
