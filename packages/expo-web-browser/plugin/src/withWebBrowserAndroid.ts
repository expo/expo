import type { ExpoConfig } from 'expo/config';
import {
  AndroidConfig,
  ConfigPlugin,
  withAndroidManifest,
  withDangerousMod,
} from 'expo/config-plugins';
import fs from 'fs';
import path from 'path';

export type PluginConfig = {
  experimentalLauncherActivity?: boolean;
};

export const withWebBrowserAndroid: ConfigPlugin = (config) => {
  config = addActivityToManifest(config);
  config = addLauncherClassToProject(config);

  return config;
};

function addActivityToManifest(config: ExpoConfig) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const application = manifest?.application?.[0];

    for (const activity of application?.activity ?? []) {
      if (activity.$['android:name'] === '.BrowserLauncherActivity') {
        return config;
      }
    }

    const theme = application?.activity?.[0]?.$['android:theme'];
    application?.activity?.[0]['intent-filter']?.splice(0, 1);

    const launcherActivity: AndroidConfig.Manifest.ManifestActivity = {
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

function addLauncherClassToProject(config: ExpoConfig) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const fileName = 'BrowserLauncherActivity.kt';
      const dir = path.dirname(
        AndroidConfig.Paths.getProjectFilePath(config.modRequest.projectRoot, 'MainApplication')
      );

      const fullPath = path.join(dir, fileName);

      if (fs.existsSync(fullPath)) {
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

      await fs.promises.writeFile(fullPath, classTemplate);
      return config;
    },
  ]);
}
