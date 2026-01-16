import type { Result, Spec } from 'arg';
import type { BuildConfigAndroid, BuildConfigCommon, BuildConfigIos, BuildTypeAndroid, BuildTypeCommon } from './types';
export declare const getCommonConfig: (args: Result<Spec>) => BuildConfigCommon;
export declare const getAndroidConfig: (args: Result<Spec>) => Promise<BuildConfigAndroid>;
export declare const getIosConfig: (args: Result<Spec>) => Promise<BuildConfigIos>;
export declare const getTasksAndroidConfig: (args: Result<Spec>) => Promise<{
    libraryName: string;
    help: boolean;
    verbose: boolean;
}>;
export declare const getBuildTypeCommon: (args: Result<Spec>) => BuildTypeCommon;
export declare const getBuildTypeAndroid: (args: Result<Spec>) => BuildTypeAndroid;
