import { ExpoConfig } from 'expo/config';
import { ConfigPlugin, AndroidConfig } from 'expo/config-plugins';
import { NavigationBarVisibility, NavigationBarBehavior, NavigationBarPosition, NavigationBarButtonStyle } from 'expo-navigation-bar';
export type WithNavigationBarProps = {
    borderColor?: string;
    backgroundColor?: string | null;
    barStyle?: NavigationBarButtonStyle | null;
    visibility?: NavigationBarVisibility;
    behavior?: NavigationBarBehavior;
    position?: NavigationBarPosition;
    legacyVisible?: NonNullable<NonNullable<ExpoConfig['androidNavigationBar']>['visible']>;
};
/**
 * @deprecated Use `WithNavigationBarProps` instead.
 */
export type Props = WithNavigationBarProps;
export declare function resolveProps(config: Pick<ExpoConfig, 'androidNavigationBar'>, _props: WithNavigationBarProps | void): WithNavigationBarProps;
/**
 * Ensure the Expo Go manifest is updated when the project is using config plugin properties instead
 * of the static values that Expo Go reads from (`androidNavigationBar`).
 */
export declare const withAndroidNavigationBarExpoGoManifest: ConfigPlugin<WithNavigationBarProps>;
export declare function setStrings(strings: AndroidConfig.Resources.ResourceXML, { borderColor, visibility, position, behavior, legacyVisible, }: Omit<WithNavigationBarProps, 'backgroundColor' | 'barStyle'>): AndroidConfig.Resources.ResourceXML;
export declare function setNavigationBarColors({ backgroundColor }: Pick<WithNavigationBarProps, 'backgroundColor'>, colors: AndroidConfig.Resources.ResourceXML): AndroidConfig.Resources.ResourceXML;
export declare function setNavigationBarStyles({ backgroundColor, barStyle }: Pick<WithNavigationBarProps, 'backgroundColor' | 'barStyle'>, styles: AndroidConfig.Resources.ResourceXML): AndroidConfig.Resources.ResourceXML;
declare const _default: ConfigPlugin<void | WithNavigationBarProps>;
export default _default;
