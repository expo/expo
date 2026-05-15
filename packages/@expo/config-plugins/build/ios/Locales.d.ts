import type { ExpoConfig } from '@expo/config-types';
import type { XcodeProject } from 'xcode';
import type { ConfigPlugin } from '../Plugin.types';
import type { LocaleJson, ResolvedLocalesJson } from '../utils/locales';
export declare const withLocales: ConfigPlugin;
export declare function writeStringsFile({ localesMap, supportingDirectory, fileName, projectName, project, }: {
    localesMap: LocaleJson | ResolvedLocalesJson;
    supportingDirectory: string;
    fileName: string;
    projectName: string;
    project: XcodeProject;
}): Promise<XcodeProject>;
export declare function getLocales(config: Pick<ExpoConfig, 'locales'>): Record<string, string | LocaleJson> | null;
export declare function setLocalesAsync(config: Pick<ExpoConfig, 'locales'>, { projectRoot, project }: {
    projectRoot: string;
    project: XcodeProject;
}): Promise<XcodeProject>;
