import { NavigationBarVisibility, NavigationBarBehavior, NavigationBarPosition, NavigationBarButtonStyle } from 'expo-navigation-bar';
import { ExpoConfig } from 'expo/config';
import { ConfigPlugin, AndroidConfig } from 'expo/config-plugins';
export type Props = {
    borderColor?: string;
    backgroundColor?: string | null;
    barStyle?: NavigationBarButtonStyle | null;
    visibility?: NavigationBarVisibility;
    behavior?: NavigationBarBehavior;
    position?: NavigationBarPosition;
    legacyVisible?: NonNullable<NonNullable<ExpoConfig['androidNavigationBar']>['visible']>;
};
export declare function resolveProps(config: Pick<ExpoConfig, 'androidNavigationBar'>, _props: Props | void): Props;
/**
 * Ensure the Expo Go manifest is updated when the project is using config plugin properties instead
 * of the static values that Expo Go reads from (`androidNavigationBar`).
 */
export declare const withAndroidNavigationBarExpoGoManifest: ConfigPlugin<Props>;
export declare function setStrings(strings: AndroidConfig.Resources.ResourceXML, { borderColor, visibility, position, behavior, legacyVisible, }: Omit<Props, 'backgroundColor' | 'barStyle'>): AndroidConfig.Resources.ResourceXML;
export declare function setNavigationBarColors({ backgroundColor }: Pick<Props, 'backgroundColor'>, colors: AndroidConfig.Resources.ResourceXML): AndroidConfig.Resources.ResourceXML;
export declare function setNavigationBarStyles({ backgroundColor, barStyle }: Pick<Props, 'backgroundColor' | 'barStyle'>, styles: AndroidConfig.Resources.ResourceXML): AndroidConfig.Resources.ResourceXML;
declare const _default: ConfigPlugin<void | Props>;
export default _default;
