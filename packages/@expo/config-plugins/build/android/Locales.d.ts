import type { ExpoConfig } from '@expo/config-types';
import type { ConfigPlugin } from '../Plugin.types';
import type { LocaleJson } from '../utils/locales';
export declare const withLocales: ConfigPlugin;
export declare function getLocales(config: Pick<ExpoConfig, 'locales'>): Record<string, string | LocaleJson> | null;
export declare function setLocalesAsync(config: Pick<ExpoConfig, 'locales'>, { projectRoot }: {
    projectRoot: string;
}): Promise<unknown>;
