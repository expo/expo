import { ExpoConfig } from '@expo/config-types';
import { ConfigPlugin } from '../Plugin.types';
/**
 * Sanitize a name, this should be used for files and gradle names.
 * - `[/, \, :, <, >, ", ?, *, |]` are not allowed
 * https://docs.gradle.org/4.2/release-notes.html#path-separator-characters-in-names-are-deprecated
 *
 * @param name
 */
export declare function sanitizeNameForGradle(name: string): string;
export declare const withName: ConfigPlugin<void>;
export declare const withNameSettingsGradle: ConfigPlugin;
export declare function getName(config: Pick<ExpoConfig, 'name'>): string | null;
/**
 * Regex a name change -- fragile.
 *
 * @param config
 * @param settingsGradle
 */
export declare function applyNameSettingsGradle(config: Pick<ExpoConfig, 'name'>, settingsGradle: string): string;
