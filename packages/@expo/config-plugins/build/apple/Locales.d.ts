import { ExpoConfig } from '@expo/config-types';
import { XcodeProject } from 'xcode';
import { ConfigPlugin } from '../Plugin.types';
type LocaleJson = Record<string, string>;
type ResolvedLocalesJson = Record<string, LocaleJson>;
type ExpoConfigLocales = NonNullable<ExpoConfig['locales']>;
export declare const withLocales: (applePlatform: 'ios' | 'macos') => ConfigPlugin;
export declare function getLocales(config: Pick<ExpoConfig, 'locales'>): Record<string, string | LocaleJson> | null;
export declare const setLocalesAsync: (applePlatform: 'ios' | 'macos') => (config: Pick<ExpoConfig, 'locales'>, { projectRoot, project }: {
    projectRoot: string;
    project: XcodeProject;
}) => Promise<XcodeProject>;
export declare const getResolvedLocalesAsync: (applePlatform: 'ios' | 'macos') => (projectRoot: string, input: ExpoConfigLocales) => Promise<ResolvedLocalesJson>;
export {};
