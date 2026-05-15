import { ConfigPlugin } from 'expo/config-plugins';
import { WidgetConfig } from './types/WidgetConfig.type';
export type ExpoWidgetsConfigPluginProps = {
    bundleIdentifier?: string;
    groupIdentifier?: string;
    enablePushNotifications?: boolean;
    frequentUpdates?: boolean;
    widgets?: WidgetConfig[];
};
declare const _default: ConfigPlugin<ExpoWidgetsConfigPluginProps | undefined>;
export default _default;
