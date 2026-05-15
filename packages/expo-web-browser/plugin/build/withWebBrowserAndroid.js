"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withWebBrowserAndroid = void 0;
const config_plugins_1 = require("expo/config-plugins");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const withWebBrowserAndroid = (config) => {
    config = addActivityToManifest(config);
    config = addLauncherClassToProject(config);
    return config;
};
exports.withWebBrowserAndroid = withWebBrowserAndroid;
function addActivityToManifest(config) {
    return (0, config_plugins_1.withAndroidManifest)(config, (config) => {
        const manifest = config.modResults.manifest;
        const application = manifest?.application?.[0];
        for (const activity of application?.activity ?? []) {
            if (activity.$['android:name'] === '.BrowserLauncherActivity') {
                return config;
            }
        }
        const theme = application?.activity?.[0]?.$['android:theme'];
        application?.activity?.[0]?.['intent-filter']?.splice(0, 1);
        const launcherActivity = {
            $: {
                'android:name': '.BrowserLauncherActivity',
                'android:theme': theme,
                'android:exported': 'true',
            },
            'intent-filter': [
                {
                    action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }],
                    category: [{ $: { 'android:name': 'android.intent.category.LAUNCHER' } }],
                },
            ],
        };
        application?.activity?.push(launcherActivity);
        return config;
    });
}
function addLauncherClassToProject(config) {
    return (0, config_plugins_1.withDangerousMod)(config, [
        'android',
        async (config) => {
            const fileName = 'BrowserLauncherActivity.kt';
            const dir = path_1.default.dirname(config_plugins_1.AndroidConfig.Paths.getProjectFilePath(config.modRequest.projectRoot, 'MainApplication'));
            const fullPath = path_1.default.join(dir, fileName);
            if (fs_1.default.existsSync(fullPath)) {
                return config;
            }
            const classTemplate = `package ${config.android?.package || ''}

import android.app.Activity
import android.content.Intent
import android.os.Bundle

class BrowserLauncherActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    startActivity(
      Intent(intent).apply {
        setClassName(
          this@BrowserLauncherActivity,
          MainActivity::class.java.name
        )
      }
    )
    finish()
  }
}
`;
            await fs_1.default.promises.writeFile(fullPath, classTemplate);
            return config;
        },
    ]);
}
