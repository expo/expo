import { ExpoConfig } from '@expo/config-types';
export type LocaleJson = Record<string, string> & {
    ios?: Record<string, string>;
    android?: Record<string, string>;
};
export type ResolvedLocalesJson = Record<string, LocaleJson>;
export type ExpoConfigLocales = NonNullable<ExpoConfig['locales']>;
export declare function getResolvedLocalesAsync(projectRoot: string, input: ExpoConfigLocales, forPlatform: 'ios' | 'android'): Promise<ResolvedLocalesJson>;
