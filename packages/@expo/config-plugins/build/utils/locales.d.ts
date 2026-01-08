import { ExpoConfig } from '@expo/config-types';
/**
 * on iOS only, we support a special case where
 * StringsMap contains a 'Localizable.strings'?: StringsMap; entry
 * Values written into `Localizable.strings` for iOS.
 */
export type StringsMap = Record<string, string>;
export type LocaleJson = Record<string, string> & {
    ios?: StringsMap;
    android?: StringsMap;
};
export type ExpoConfigLocales = NonNullable<ExpoConfig['locales']>;
export type ResolvedLocalesJson = Record<string, LocaleJson>;
export declare function getResolvedLocalesAsync(projectRoot: string, input: ExpoConfigLocales, forPlatform: 'ios' | 'android'): Promise<{
    localesMap: ResolvedLocalesJson;
    localizableStringsIOS?: ResolvedLocalesJson;
}>;
