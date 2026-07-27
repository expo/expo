import { ConfigPlugin } from 'expo/config-plugins';

import withAndroidWidgetFiles from './withAndroidWidgetFiles';
import withAndroidWidgetManifest from './withAndroidWidgetManifest';
import { WidgetConfig } from '../types/WidgetConfig.type';

const withAndroidWidgets: ConfigPlugin<{ widgets: WidgetConfig[] }> = (config, { widgets }) => {
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
