import { BuildConfigAndroid, BuildConfigIos, WithSpinnerParams } from './types';
export declare const printConfig: (config: BuildConfigAndroid | BuildConfigIos) => void;
export declare const withSpinner: <T>({ operation, loaderMessage, successMessage, errorMessage, onError, verbose, }: WithSpinnerParams<T>) => Promise<T>;
export declare const checkPrebuild: (platform: "android" | "ios") => Promise<boolean>;
export declare const maybeRunPrebuild: (platform: "android" | "ios") => Promise<import("./types").RunCommandResult>;
export declare const ensurePrebuild: (platform: "android" | "ios") => Promise<void>;
