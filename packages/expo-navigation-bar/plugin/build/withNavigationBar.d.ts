import { ExpoConfig } from 'expo/config';
import { AndroidConfig, ConfigPlugin, ExportedConfigWithProps } from 'expo/config-plugins';
import { NavigationBarBehavior, NavigationBarButtonStyle, NavigationBarPosition, NavigationBarVisibility } from 'expo-navigation-bar';
export type ResourceXMLConfig = ExportedConfigWithProps<AndroidConfig.Resources.ResourceXML>;
export type Props = {
    enforceContrast?: boolean;
    barStyle?: NavigationBarButtonStyle | null;
    visibility?: NavigationBarVisibility;
    /**
     * @deprecated
     */
    backgroundColor?: string | null;
    /**
     * @deprecated
     */
    behavior?: NavigationBarBehavior;
    /**
     * @deprecated
     */
    borderColor?: string;
    /**
     * @deprecated
     */
    position?: NavigationBarPosition;
};
export declare function resolveProps(config: Pick<ExpoConfig, 'androidNavigationBar'>, props: Props | void): Props;
/**
 * Ensure the Expo Go manifest is updated when the project is using config plugin properties instead
 * of the static values that Expo Go reads from (`androidNavigationBar`).
 */
export declare const withAndroidNavigationBarExpoGoManifest: ConfigPlugin<Props>;
export declare function setStrings(strings: AndroidConfig.Resources.ResourceXML, { visibility }: Props): AndroidConfig.Resources.ResourceXML;
export declare function setNavigationBarStyles({ barStyle }: Props, styles: AndroidConfig.Resources.ResourceXML): AndroidConfig.Resources.ResourceXML;
export declare function applyEnforceNavigationBarContrast(config: ResourceXMLConfig, enforceNavigationBarContrast: boolean): ResourceXMLConfig;
declare const _default: ConfigPlugin<void | Props>;
export default _default;
