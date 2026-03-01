import { ConfigPlugin } from 'expo/config-plugins';
import { WidgetConfig } from './types/WidgetConfig.type';
type ExpoWidgetsConfigPluginProps = {
    bundleIdentifier?: string;
    groupIdentifier?: string;
    enablePushNotifications?: boolean;
    frequentUpdates?: boolean;
    widgets?: WidgetConfig[];
};
declare const _default: ConfigPlugin<ExpoWidgetsConfigPluginProps>;
export default _default;
