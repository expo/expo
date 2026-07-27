import { AndroidConfig, ConfigPlugin, withAndroidManifest } from 'expo/config-plugins';

import {
  getProviderClassName,
  getWidgetDisplayNameResourceName,
  getWidgetInfoResourceName,
} from './resourceNames';
import { WidgetConfig } from '../types/WidgetConfig.type';

const EXPO_WIDGETS_INTERACTION_ACTION = 'expo.modules.widgets.ACTION_WIDGET_INTERACTION';
const EXPO_WIDGETS_NAME_METADATA = 'expo.modules.widgets.NAME';

type ManifestReceiver = {
  $: {
    'android:name': string;
    'android:exported'?: 'true' | 'false';
    'android:label'?: string;
    [key: string]: string | undefined;
  };
  'intent-filter'?: {
    action?: {
      $: {
        'android:name': string;
      };
    }[];
  }[];
  'meta-data'?: {
    $: {
      'android:name': string;
      'android:value'?: string;
      'android:resource'?: string;
    };
  }[];
};

const createWidgetReceiver = (widget: WidgetConfig): ManifestReceiver => {
  return {
    $: {
      'android:name': `.${getProviderClassName(widget)}`,
      'android:exported': 'true',
      'android:label': `@string/${getWidgetDisplayNameResourceName(widget)}`,
    },
    'intent-filter': [
      {
        action: [
          {
            $: {
              'android:name': 'android.appwidget.action.APPWIDGET_UPDATE',
            },
          },
          {
            $: {
              'android:name': EXPO_WIDGETS_INTERACTION_ACTION,
            },
          },
        ],
      },
    ],
    'meta-data': [
      {
        $: {
          'android:name': 'android.appwidget.provider',
          'android:resource': `@xml/${getWidgetInfoResourceName(widget)}`,
        },
      },
      {
        $: {
          'android:name': EXPO_WIDGETS_NAME_METADATA,
          'android:value': widget.name,
        },
      },
    ],
  };
};

const withAndroidWidgetManifest: ConfigPlugin<WidgetConfig[]> = (config, widgets) => {
  return withAndroidManifest(config, (config) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    const receivers = (mainApplication.receiver ?? []) as ManifestReceiver[];
    const isNotWidgetReceiver = (receiver: ManifestReceiver) =>
      !receiver['meta-data']?.some(
        (metaData) => metaData.$['android:name'] === EXPO_WIDGETS_NAME_METADATA
      );

    mainApplication.receiver = [
      ...receivers.filter(isNotWidgetReceiver),
      ...widgets.map(createWidgetReceiver),
    ];

    return config;
  });
};

export default withAndroidWidgetManifest;
