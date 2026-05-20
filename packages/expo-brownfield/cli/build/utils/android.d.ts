import spawnAsync from '@expo/spawn-async';
import type { AndroidConfig, BuildVariant } from './types';
export declare const buildPublishingTask: (variant: BuildVariant, repository: string) => string;
export declare const findBrownfieldLibrary: () => string | undefined;
export declare const printAndroidConfig: (config: AndroidConfig) => void;
export declare const processRepositories: (tasks: string[]) => string[];
export declare const processTasks: (stdout: string) => string[];
export declare const runTask: (task: string, verbose: boolean, dryRun: boolean) => Promise<spawnAsync.SpawnResult | undefined>;
