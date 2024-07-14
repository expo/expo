/// <reference types="xcode" />
import * as AppleImpl from '../apple/Locales';
export declare const withLocales: import("..").ConfigPlugin;
export declare const getLocales: typeof AppleImpl.getLocales;
export declare const setLocalesAsync: (config: Pick<import("@expo/config-types").ExpoConfig, "locales">, { projectRoot, project }: {
    projectRoot: string;
    project: import("xcode").XcodeProject;
}) => Promise<import("xcode").XcodeProject>;
export declare const getResolvedLocalesAsync: (projectRoot: string, input: {
    [k: string]: string | {
        [k: string]: any;
    };
}) => Promise<{
    [x: string]: {
        [x: string]: string;
    };
}>;
