import { ConfigPlugin } from 'expo/config-plugins';
import { WidgetConfig } from './types/WidgetConfig.type';
interface ExpoWidgetsConfigPluginProps {
    groupIdentifier: string;
    enablePushNotifications?: boolean;
    widgets: WidgetConfig[];
}
declare const _default: ConfigPlugin<ExpoWidgetsConfigPluginProps>;
export default _default;
