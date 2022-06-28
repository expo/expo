import type { ExpoConfig } from '@expo/config-types';
/**
 * Rule to transform from config to build properties
 *
 * @example
 * ```ts
 * {
 *   propName: 'expo.jsEngine',
 *   propValueGetter: (config) => config.android?.jsEngine ?? config.jsEngine ?? 'jsc',
 * }
 * ```
 * Will lookup a value through the `propValueGetter` and update to `android/gradle.properties` / `ios/Podfile.properties.json`
 * with the `expo.jsEngine` property name and the lookuped value.
 *
 */
/**
 * Source config can be either expo config or generic config
 */
export declare type BuildPropertiesConfig = ExpoConfig | Record<string, any>;
export interface ConfigToPropertyRuleType<SourceConfigType extends BuildPropertiesConfig> {
    /** Property name in `android/gradle.properties` or `ios/Podfile.properties.json` */
    propName: string;
    /** Passing config and get the property value */
    propValueGetter: (config: SourceConfigType) => string | null | undefined;
}
