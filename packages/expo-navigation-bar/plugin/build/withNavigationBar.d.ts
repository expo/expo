import { AndroidConfig, ConfigPlugin, ExportedConfigWithProps } from 'expo/config-plugins';
import { NavigationBarVisibility } from '../..';
export type ResourceXMLConfig = ExportedConfigWithProps<AndroidConfig.Resources.ResourceXML>;
type NavigationBarStyle = 'light' | 'dark';
export type Props = {
    /**
     * Whether the OS should keep the navigation bar translucent for contrast.
     * @default true
     * @platform android
     */
    enforceContrast?: boolean;
    /**
     * Whether the navigation bar starts hidden.
     * @platform android
     */
    hidden?: boolean;
    /**
     * Which style the navigation bar starts with. Accepts `light` and `dark`.
     * @platform android
     */
    style?: NavigationBarStyle;
    /** @deprecated */
    barStyle?: NavigationBarStyle | null;
    /** @deprecated */
    visibility?: NavigationBarVisibility;
};
export declare function resolveProps(props: Props | undefined): Props | undefined;
export declare const setNavigationBarStyles: ({ hidden, style }: Props, styles: AndroidConfig.Resources.ResourceXML) => AndroidConfig.Resources.ResourceXML;
export declare function applyEnforceNavigationBarContrast(config: ResourceXMLConfig, enforceNavigationBarContrast: boolean): ResourceXMLConfig;
declare const _default: ConfigPlugin<Props | undefined>;
export default _default;
