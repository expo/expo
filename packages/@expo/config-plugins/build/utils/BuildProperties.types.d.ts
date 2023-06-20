import type { ExpoConfig } from '@expo/config-types';
/**
 * Rule to transform from config to build properties
 *
 * @example
 * ```ts
 * {
 *   propName: 'expo.jsEngine',
 *   propValueGetter: (config) => config.ios?.jsEngine ?? config.jsEngine ?? 'hermes',
 * }
 * ```
 * Will lookup a value through the `propValueGetter`, and update to `hermesEnabled` key-value in **android/gradle.properties**
 * or `expo.jsEngine` key-value in **ios/Podfile.properties.json**.
 *
 */
/**
 * Source config can be either expo config or generic config
 */
export type BuildPropertiesConfig = ExpoConfig | Record<string, any>;
export interface ConfigToPropertyRuleType<SourceConfigType extends BuildPropertiesConfig> {
    /** Property name in `android/gradle.properties` or `ios/Podfile.properties.json` */
    propName: string;
    /** Passing config and get the property value */
    propValueGetter: (config: SourceConfigType) => string | null | undefined;
}
