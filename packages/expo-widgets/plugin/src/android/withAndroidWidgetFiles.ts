import { AndroidConfig, ConfigPlugin, withDangerousMod } from 'expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';

import {
  getProviderClassName,
  getWidgetDescriptionResourceName,
  getWidgetDisplayNameResourceName,
  getWidgetInfoResourceName,
} from './resourceNames';
import { WidgetConfig } from '../types/WidgetConfig.type';

const withAndroidWidgetFiles: ConfigPlugin<WidgetConfig[]> = (config, widgets) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const androidPackage = AndroidConfig.Package.getPackage(config);
      if (
        typeof androidPackage !== 'string' ||
        !/^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)+$/.test(androidPackage)
      ) {
        throw new Error(
          'Android package is required for expo-widgets. Please set `android.package` in `app.json` or `app.config.js`.'
        );
      }

      const projectRoot = config.modRequest.platformProjectRoot;
      const packageDirectory = path.join(
        projectRoot,
        'app/src/main/java',
        ...androidPackage.split('.')
      );
      const xmlDirectory = path.join(projectRoot, 'app/src/main/res/xml');
      const valuesDirectory = path.join(projectRoot, 'app/src/main/res/values');
      const widgetsXmlPath = path.join(valuesDirectory, 'expo_widgets.xml');

      fs.mkdirSync(packageDirectory, { recursive: true });
      fs.mkdirSync(xmlDirectory, { recursive: true });
      fs.mkdirSync(valuesDirectory, { recursive: true });

      if (fs.existsSync(widgetsXmlPath)) {
        fs.rmSync(widgetsXmlPath);
      }
      fs.writeFileSync(widgetsXmlPath, createWidgetStringsXml(widgets));

      for (const widget of widgets) {
        const providerPath = path.join(packageDirectory, `${getProviderClassName(widget)}.kt`);
        if (fs.existsSync(providerPath)) {
          fs.rmSync(providerPath);
        }
        fs.writeFileSync(
          path.join(packageDirectory, `${getProviderClassName(widget)}.kt`),
          createWidgetProviderKt(androidPackage, widget)
        );

        const widgetInfoPath = path.join(xmlDirectory, `${getWidgetInfoResourceName(widget)}.xml`);
        if (fs.existsSync(widgetInfoPath)) {
          fs.rmSync(widgetInfoPath);
        }
        fs.writeFileSync(
          path.join(xmlDirectory, `${getWidgetInfoResourceName(widget)}.xml`),
          createWidgetInfoXml(widget)
        );
      }

      return config;
    },
  ]);
};

const createWidgetProviderKt = (androidPackage: string, widget: WidgetConfig): string => {
  return `package ${androidPackage}

import expo.modules.widgets.ExpoWidgetsAppWidgetProvider

class ${getProviderClassName(widget)} : ExpoWidgetsAppWidgetProvider(${JSON.stringify(widget.name)})
`;
};

const createWidgetInfoXml = (widget: WidgetConfig): string => {
  const android = getAndroidWidgetConfig(widget);

  return `<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
  android:minWidth="${android.minWidth}dp"
  android:minHeight="${android.minHeight}dp"
  android:targetCellWidth="${android.targetCellWidth}"
  android:targetCellHeight="${android.targetCellHeight}"
  android:updatePeriodMillis="0"
  android:initialLayout="@layout/glance_default_loading_layout"
  android:description="@string/${getWidgetDescriptionResourceName(widget)}"
  android:resizeMode="${getWidgetResizeMode(widget)}"
  android:widgetCategory="home_screen" />
`;
};

const getWidgetResizeMode = (widget: WidgetConfig): string => {
  const resizeMode = widget.android?.resizeMode;
  switch (resizeMode) {
    case 'none':
      return 'none';
    case 'horizontal':
      return 'horizontal';
    case 'vertical':
      return 'vertical';
    case 'both':
    default:
      return 'horizontal|vertical';
  }
};

const getAndroidWidgetConfig = (widget: WidgetConfig): NonNullable<WidgetConfig['android']> => {
  return {
    minWidth: widget.android?.minWidth ?? 180,
    minHeight: widget.android?.minHeight ?? 110,
    targetCellWidth: widget.android?.targetCellWidth ?? 4,
    targetCellHeight: widget.android?.targetCellHeight ?? 2,
  };
};

const escapeXmlSpecialChars = (value: string): string => {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

const createWidgetStringsXml = (widgets: WidgetConfig[]): string => {
  return `<?xml version="1.0" encoding="utf-8"?>
<resources>
${widgets
  .map((widget) => {
    return `  <string name="${getWidgetDisplayNameResourceName(widget)}">${escapeXmlSpecialChars(widget.displayName)}</string>
  <string name="${getWidgetDescriptionResourceName(widget)}">${escapeXmlSpecialChars(widget.description)}</string>`;
  })
  .join('\n')}
</resources>
`;
};

export default withAndroidWidgetFiles;
