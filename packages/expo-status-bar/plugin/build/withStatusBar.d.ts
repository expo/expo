import { ExpoConfig } from 'expo/config';
import { AndroidConfig, ConfigPlugin, InfoPlist } from 'expo/config-plugins';
type StatusBarStyle = 'light' | 'dark';
export type Props = {
    /** Determines whether the status bar starts hidden. */
    hidden?: boolean;
    /** Determines which style the status bar starts with. */
    style?: StatusBarStyle;
};
export declare const resolveAndroidLegacyProps: (config: Pick<ExpoConfig, "androidStatusBar">) => Props;
export declare const setAndroidStatusBarStyles: (styles: AndroidConfig.Resources.ResourceXML, { style }: Props) => AndroidConfig.Resources.ResourceXML;
export declare const setAndroidStrings: (strings: AndroidConfig.Resources.ResourceXML, { hidden }: Props) => AndroidConfig.Resources.ResourceXML;
export declare const setIOSStatusBarInfoPlist: (plist: InfoPlist, { hidden, style }?: Props) => InfoPlist;
/**
 * Ensure the Expo Go manifest is updated when the project is using config plugin properties instead
 * of the static values that Expo Go reads from (`androidStatusBar`).
 */
export declare const withStatusBarExpoGoManifest: ConfigPlugin<Props | undefined>;
declare const _default: ConfigPlugin<Props | undefined>;
export default _default;
