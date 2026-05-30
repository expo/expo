import { ConfigPlugin } from 'expo/config-plugins';
import { WidgetConfig } from '../types/WidgetConfig.type';
type IosWidgetsProps = {
    bundleIdentifier?: string;
    groupIdentifier?: string;
    enablePushNotifications?: boolean;
    frequentUpdates?: boolean;
    widgets: WidgetConfig[];
};
declare const withIosWidgets: ConfigPlugin<IosWidgetsProps>;
export default withIosWidgets;
