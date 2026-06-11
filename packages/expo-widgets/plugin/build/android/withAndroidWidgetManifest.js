"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const resourceNames_1 = require("./resourceNames");
const EXPO_WIDGETS_INTERACTION_ACTION = 'expo.modules.widgets.ACTION_WIDGET_INTERACTION';
const EXPO_WIDGETS_NAME_METADATA = 'expo.modules.widgets.NAME';
const createWidgetReceiver = (widget) => {
    return {
        $: {
            'android:name': `.${(0, resourceNames_1.getProviderClassName)(widget)}`,
            'android:exported': 'true',
            'android:label': `@string/${(0, resourceNames_1.getWidgetDisplayNameResourceName)(widget)}`,
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
                    'android:resource': `@xml/${(0, resourceNames_1.getWidgetInfoResourceName)(widget)}`,
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
const withAndroidWidgetManifest = (config, widgets) => {
    return (0, config_plugins_1.withAndroidManifest)(config, (config) => {
        const mainApplication = config_plugins_1.AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
        const receivers = (mainApplication.receiver ?? []);
        const isNotWidgetReceiver = (receiver) => !receiver['meta-data']?.some((metaData) => metaData.$['android:name'] === EXPO_WIDGETS_NAME_METADATA);
        mainApplication.receiver = [
            ...receivers.filter(isNotWidgetReceiver),
            ...widgets.map(createWidgetReceiver),
        ];
        return config;
    });
};
exports.default = withAndroidWidgetManifest;
