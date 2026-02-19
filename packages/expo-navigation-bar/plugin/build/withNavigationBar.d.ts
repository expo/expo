import { ExpoConfig } from 'expo/config';
import { ConfigPlugin, AndroidConfig } from 'expo/config-plugins';
import { NavigationBarVisibility, NavigationBarBehavior, NavigationBarPosition, NavigationBarButtonStyle } from 'expo-navigation-bar';
export type Props = {
    /**
     * @deprecated Due to Android edge-to-edge enforcement, this is deprecated and has no effect. This will be removed in a future release.
     */
    borderColor?: string;
    /**
     * @deprecated Due to Android edge-to-edge enforcement, this is deprecated and has no effect. This will be removed in a future release.
     */
    backgroundColor?: string | null;
    barStyle?: NavigationBarButtonStyle | null;
    visibility?: NavigationBarVisibility;
    /**
     * @deprecated Due to Android edge-to-edge enforcement, this is deprecated and has no effect. This will be removed in a future release.
     */
    behavior?: NavigationBarBehavior;
    /**
     * @deprecated Due to Android edge-to-edge enforcement, this is deprecated and has no effect. This will be removed in a future release.
     */
    position?: NavigationBarPosition;
    /**
     * @deprecated Due to Android edge-to-edge enforcement, this is deprecated and has no effect. This will be removed in a future release.
     */
    legacyVisible?: NonNullable<NonNullable<ExpoConfig['androidNavigationBar']>['visible']>;
};
export declare function resolveProps(config: Pick<ExpoConfig, 'androidNavigationBar'>, _props: Props | void): Props;
/**
 * Ensure the Expo Go manifest is updated when the project is using config plugin properties instead
 * of the static values that Expo Go reads from (`androidNavigationBar`).
 */
export declare const withAndroidNavigationBarExpoGoManifest: ConfigPlugin<Props>;
export declare function setStrings(strings: AndroidConfig.Resources.ResourceXML, { visibility }: Props): AndroidConfig.Resources.ResourceXML;
export declare function setNavigationBarStyles({ barStyle }: Props, styles: AndroidConfig.Resources.ResourceXML): AndroidConfig.Resources.ResourceXML;
declare const _default: ConfigPlugin<void | Props>;
export default _default;
