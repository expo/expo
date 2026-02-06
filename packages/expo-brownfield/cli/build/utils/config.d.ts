import type { OptionValues } from 'commander';
import type { AndroidConfig, IosConfig, TasksConfigAndroid } from './types';
export declare const resolveBuildConfigAndroid: (options: OptionValues) => AndroidConfig;
export declare const resolveBuildConfigIos: (options: OptionValues) => IosConfig;
export declare const resolveTasksConfigAndroid: (options: OptionValues) => TasksConfigAndroid;
