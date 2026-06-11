import { ConfigPlugin } from 'expo/config-plugins';
import { WidgetConfig } from './types/WidgetConfig.type';
export type ExpoWidgetsConfigPluginProps = {
    bundleIdentifier?: string;
    groupIdentifier?: string;
    enablePushNotifications?: boolean;
    frequentUpdates?: boolean;
    /**
     * Enable the Android config plugin. Defaults to false.
     * This option will be removed and Android widget will be enabled by default in the future.
     */
    enableAndroid?: boolean;
    widgets?: WidgetConfig[];
};
declare const _default: ConfigPlugin<ExpoWidgetsConfigPluginProps | undefined>;
export default _default;
