import { ExpoConfig } from 'expo/config';
import { AndroidConfig, ConfigPlugin } from 'expo/config-plugins';
export type Props = {
    userInterfaceStyle?: ExpoConfig['userInterfaceStyle'];
};
export declare const withAndroidUserInterfaceStyle: ConfigPlugin<void>;
export declare function resolveProps(config: Pick<ExpoConfig, 'userInterfaceStyle' | 'android'>): Props;
export declare function setStrings(strings: AndroidConfig.Resources.ResourceXML, { userInterfaceStyle }: Props): AndroidConfig.Resources.ResourceXML;
