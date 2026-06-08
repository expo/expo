import { ConfigPlugin } from 'expo/config-plugins';
import { WidgetConfig } from '../types/WidgetConfig.type';
declare const withAndroidWidgets: ConfigPlugin<{
    widgets: WidgetConfig[];
}>;
export default withAndroidWidgets;
