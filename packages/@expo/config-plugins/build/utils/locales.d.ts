import { ExpoConfig } from '@expo/config-types';
export type LocaleJson = Record<string, string> & {
    ios?: Record<string, string>;
    android?: Record<string, string>;
};
export type ResolvediOSLocalesJson = {
    locales: Record<string, LocaleJson>;
    localizableStrings: Record<string, LocaleJson>;
};
export type IOSConfig = {
    localizableStrings?: Record<string, string>;
    [key: string]: any;
};
export type ResolvedLocalesJson = Record<string, LocaleJson>;
export type ExpoConfigLocales = NonNullable<ExpoConfig['locales']>;
export declare function getResolvedLocalesAsync(projectRoot: string, input: ExpoConfigLocales, forPlatform: 'ios' | 'android'): Promise<ResolvedLocalesJson | ResolvediOSLocalesJson>;
