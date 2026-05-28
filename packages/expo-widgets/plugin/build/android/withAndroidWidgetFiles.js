"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const resourceNames_1 = require("./resourceNames");
const withAndroidWidgetFiles = (config, widgets) => {
    return (0, config_plugins_1.withDangerousMod)(config, [
        'android',
        async (config) => {
            const androidPackage = config_plugins_1.AndroidConfig.Package.getPackage(config);
            if (typeof androidPackage !== 'string' ||
                !/^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)+$/.test(androidPackage)) {
                throw new Error('Android package is required for expo-widgets. Please set `android.package` in `app.json` or `app.config.js`.');
            }
            const projectRoot = config.modRequest.platformProjectRoot;
            const packageDirectory = path.join(projectRoot, 'app/src/main/java', ...androidPackage.split('.'));
            const xmlDirectory = path.join(projectRoot, 'app/src/main/res/xml');
            const valuesDirectory = path.join(projectRoot, 'app/src/main/res/values');
            const widgetsXmlPath = path.join(xmlDirectory, 'expo_widgets.xml');
            fs.mkdirSync(packageDirectory, { recursive: true });
            fs.mkdirSync(xmlDirectory, { recursive: true });
            fs.mkdirSync(valuesDirectory, { recursive: true });
            if (fs.existsSync(widgetsXmlPath)) {
                fs.rmSync(widgetsXmlPath);
            }
            fs.writeFileSync(widgetsXmlPath, createWidgetStringsXml(widgets));
            for (const widget of widgets) {
                const providerPath = path.join(packageDirectory, `${(0, resourceNames_1.getProviderClassName)(widget)}.kt`);
                if (fs.existsSync(providerPath)) {
                    fs.rmSync(providerPath);
                }
                fs.writeFileSync(path.join(packageDirectory, `${(0, resourceNames_1.getProviderClassName)(widget)}.kt`), createWidgetProviderKt(androidPackage, widget));
                const widgetInfoPath = path.join(xmlDirectory, `${(0, resourceNames_1.getWidgetInfoResourceName)(widget)}.xml`);
                if (fs.existsSync(widgetInfoPath)) {
                    fs.rmSync(widgetInfoPath);
                }
                fs.writeFileSync(path.join(xmlDirectory, `${(0, resourceNames_1.getWidgetInfoResourceName)(widget)}.xml`), createWidgetInfoXml(widget));
            }
            return config;
        },
    ]);
};
const createWidgetProviderKt = (androidPackage, widget) => {
    return `package ${androidPackage}

import expo.modules.widgets.ExpoWidgetsAppWidgetProvider

class ${(0, resourceNames_1.getProviderClassName)(widget)} : ExpoWidgetsAppWidgetProvider(${JSON.stringify(widget.name)})
`;
};
const createWidgetInfoXml = (widget) => {
    const android = getAndroidWidgetConfig(widget);
    return `<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
  android:minWidth="${android.minWidth}dp"
  android:minHeight="${android.minHeight}dp"
  android:targetCellWidth="${android.targetCellWidth}"
  android:targetCellHeight="${android.targetCellHeight}"
  android:updatePeriodMillis="0"
  android:initialLayout="@layout/glance_default_loading_layout"
  android:description="@string/${(0, resourceNames_1.getWidgetDescriptionResourceName)(widget)}"
  android:resizeMode="${getWidgetResizeMode(widget)}"
  android:widgetCategory="home_screen" />
`;
};
const getWidgetResizeMode = (widget) => {
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
const getAndroidWidgetConfig = (widget) => {
    return {
        minWidth: widget.android?.minWidth ?? 180,
        minHeight: widget.android?.minHeight ?? 110,
        targetCellWidth: widget.android?.targetCellWidth ?? 4,
        targetCellHeight: widget.android?.targetCellHeight ?? 2,
    };
};
const escapeXmlSpecialChars = (value) => {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
};
const createWidgetStringsXml = (widgets) => {
    return `<?xml version="1.0" encoding="utf-8"?>
<resources>
${widgets
        .map((widget) => {
        return `  <string name="${(0, resourceNames_1.getWidgetDisplayNameResourceName)(widget)}">${escapeXmlSpecialChars(widget.displayName)}</string>
  <string name="${(0, resourceNames_1.getWidgetDescriptionResourceName)(widget)}">${escapeXmlSpecialChars(widget.description)}</string>`;
    })
        .join('\n')}
</resources>
`;
};
exports.default = withAndroidWidgetFiles;
