import { ExpoConfig } from '@expo/config-types';
import { XcodeProject } from 'xcode';
import { ConfigPlugin } from '../Plugin.types';
type LocaleJson = Record<string, string>;
type ResolvedLocalesJson = Record<string, LocaleJson>;
type ExpoConfigLocales = NonNullable<ExpoConfig['locales']>;
export declare const withLocales: ConfigPlugin;
export declare function getLocales(config: Pick<ExpoConfig, 'locales'>): Record<string, string | LocaleJson> | null;
export declare function setLocalesAsync(config: Pick<ExpoConfig, 'locales'>, { projectRoot, project }: {
    projectRoot: string;
    project: XcodeProject;
}): Promise<XcodeProject>;
export declare function getResolvedLocalesAsync(projectRoot: string, input: ExpoConfigLocales): Promise<ResolvedLocalesJson>;
export {};
