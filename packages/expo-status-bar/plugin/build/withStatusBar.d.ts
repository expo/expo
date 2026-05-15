import { AndroidConfig, ConfigPlugin, InfoPlist } from 'expo/config-plugins';
type StatusBarStyle = 'light' | 'dark';
export type Props = {
    /** Determines whether the status bar starts hidden. */
    hidden?: boolean;
    /** Determines which style the status bar starts with. */
    style?: StatusBarStyle;
};
export declare function resolveProps(props: Props | undefined): Props | undefined;
export declare const setAndroidStatusBarStyles: (styles: AndroidConfig.Resources.ResourceXML, { hidden, style }: Props) => AndroidConfig.Resources.ResourceXML;
export declare const setIOSStatusBarInfoPlist: (plist: InfoPlist, { hidden, style }?: Props) => InfoPlist;
declare const _default: ConfigPlugin<Props | undefined>;
export default _default;
