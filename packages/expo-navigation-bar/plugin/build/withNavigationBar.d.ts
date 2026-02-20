import { ExpoConfig } from 'expo/config';
import { ConfigPlugin, AndroidConfig } from 'expo/config-plugins';
import { NavigationBarVisibility, NavigationBarBehavior, NavigationBarPosition, NavigationBarButtonStyle } from 'expo-navigation-bar';
export type Props = {
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
    /**
     * @deprecated
     */
    legacyVisible?: NonNullable<NonNullable<ExpoConfig['androidNavigationBar']>['visible']>;
};
export declare function resolveProps(config: Pick<ExpoConfig, 'androidNavigationBar'>, props: Props | void): Props;
/**
 * Ensure the Expo Go manifest is updated when the project is using config plugin properties instead
 * of the static values that Expo Go reads from (`androidNavigationBar`).
 */
export declare const withAndroidNavigationBarExpoGoManifest: ConfigPlugin<Props>;
export declare function setStrings(strings: AndroidConfig.Resources.ResourceXML, { visibility }: Props): AndroidConfig.Resources.ResourceXML;
export declare function setNavigationBarStyles({ barStyle }: Props, styles: AndroidConfig.Resources.ResourceXML): AndroidConfig.Resources.ResourceXML;
declare const _default: ConfigPlugin<void | Props>;
export default _default;
