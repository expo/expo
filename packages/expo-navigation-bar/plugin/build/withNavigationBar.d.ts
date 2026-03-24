import { ExpoConfig } from 'expo/config';
import { AndroidConfig, ConfigPlugin, ExportedConfigWithProps } from 'expo/config-plugins';
import { NavigationBarVisibility } from '../..';
export type ResourceXMLConfig = ExportedConfigWithProps<AndroidConfig.Resources.ResourceXML>;
type AndroidNavigationBar = NonNullable<ExpoConfig['androidNavigationBar']>;
type NavigationBarStyle = 'light' | 'dark';
export type Props = {
    enforceContrast?: boolean;
    hidden?: boolean;
    style?: NavigationBarStyle;
    /** @deprecated */
    barStyle?: NavigationBarStyle | null;
    /** @deprecated */
    visibility?: NavigationBarVisibility;
};
type ResolvedProps = {
    enforceContrast?: boolean;
    hidden?: boolean;
    style?: NavigationBarStyle;
    visible?: AndroidNavigationBar['visible'];
};
export declare function resolveProps(config: Pick<ExpoConfig, 'androidNavigationBar'>, props: Props | void): ResolvedProps;
/**
 * Ensure the Expo Go manifest is updated when the project is using config plugin properties instead
 * of the static values that Expo Go reads from (`androidNavigationBar`).
 */
export declare const withAndroidNavigationBarExpoGoManifest: ConfigPlugin<ResolvedProps>;
export declare function setStrings(strings: AndroidConfig.Resources.ResourceXML, { hidden }: ResolvedProps): AndroidConfig.Resources.ResourceXML;
export declare function setNavigationBarStyles({ style }: ResolvedProps, styles: AndroidConfig.Resources.ResourceXML): AndroidConfig.Resources.ResourceXML;
export declare function applyEnforceNavigationBarContrast(config: ResourceXMLConfig, enforceNavigationBarContrast: boolean): ResourceXMLConfig;
declare const _default: ConfigPlugin<void | Props>;
export default _default;
