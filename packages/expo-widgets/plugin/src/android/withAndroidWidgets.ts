import { ConfigPlugin } from 'expo/config-plugins';

import { WidgetConfig } from '../types/WidgetConfig.type';
import withAndroidNotificationPermission from './withAndroidNotificationPermission';
import withAndroidWidgetFiles from './withAndroidWidgetFiles';
import withAndroidWidgetManifest from './withAndroidWidgetManifest';

type AndroidWidgetsProps = {
  enablePushNotifications?: boolean;
  widgets: WidgetConfig[];
};

const withAndroidWidgets: ConfigPlugin<AndroidWidgetsProps> = (config, props) => {
  const { widgets } = props;
  config = withAndroidNotificationPermission(config, {
    enablePushNotifications: props.enablePushNotifications ?? false,
  });
  if (widgets.length === 0) {
    return config;
  }

  const androidWidgets = widgets.filter((widget) => widget.android !== null);
  let nextConfig = config;
  if (androidWidgets.length > 0) {
    nextConfig = withAndroidWidgetFiles(nextConfig, androidWidgets);
  }

  return withAndroidWidgetManifest(nextConfig, androidWidgets);
};

export default withAndroidWidgets;
