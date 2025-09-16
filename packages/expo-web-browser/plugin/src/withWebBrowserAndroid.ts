import type { ManifestActivity } from '@expo/config-plugins/build/android/Manifest';
import type { ExpoConfig } from '@expo/config-types';
import {
  AndroidConfig,
  ConfigPlugin,
  withAndroidManifest,
  withDangerousMod,
  withMainApplication,
} from 'expo/config-plugins';
import fs from 'fs';
import path from 'path';

import { appendContentsInsideDeclarationBlock, addImports } from './utils';

export type PluginConfig = {
  experimentalLauncherActivity?: boolean;
};

export const withWebBrowserAndroid: ConfigPlugin = (config) => {
  config = addActivityToManifest(config);
  config = modifyMainApplication(config);
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

    const launcherActivity: ManifestActivity = {
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

      const classTemplate = `package ${config.android?.package || ''};
  
import android.app.Activity
import android.content.Intent
import android.os.Bundle

class BrowserLauncherActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    val application = application as MainApplication
    if (!application.isActivityInBackStack(MainActivity::class.java)) {
      val intent = Intent(this, MainActivity::class.java)
      startActivity(intent)
    }
    finish()
  }
}
`;

      await fs.promises.writeFile(fullPath, classTemplate);
      return config;
    },
  ]);
}

function modifyMainApplication(config: ExpoConfig) {
  return withMainApplication(config, (config) => {
    const mainApplication = config.modResults;

    const importsMod = addImports(
      mainApplication.contents,
      ['android.app.Activity', 'android.os.Bundle'],
      false
    );

    let contents = importsMod;
    if (
      !mainApplication.contents.includes('registerActivityLifecycleCallbacks(lifecycleCallbacks)')
    ) {
      contents = appendContentsInsideDeclarationBlock(
        importsMod,
        'onCreate',
        'registerActivityLifecycleCallbacks(lifecycleCallbacks)'
      );
    }

    const result = addMainApplicationMod(contents);

    return {
      ...config,
      modResults: {
        ...config.modResults,
        contents: result,
      },
    };
  });
}

function addMainApplicationMod(contents: string) {
  if (contents.includes('private val runningActivities = ArrayList<Class<*>>()')) {
    return contents;
  }

  const codeMod = `
  private val runningActivities = ArrayList<Class<*>>()

  private val lifecycleCallbacks = object : ActivityLifecycleCallbacks {
    override fun onActivityCreated(activity: Activity, p1: Bundle?) {
      if (!runningActivities.contains(activity::class.java)) runningActivities.add(activity::class.java)
    }

    override fun onActivityStarted(p0: Activity) = Unit
    override fun onActivityResumed(p0: Activity) = Unit
    override fun onActivityPaused(p0: Activity) = Unit
    override fun onActivityStopped(p0: Activity) = Unit
    override fun onActivitySaveInstanceState(p0: Activity, p1: Bundle) = Unit

    override fun onActivityDestroyed(activity: Activity) {
      if (runningActivities.contains(activity::class.java)) runningActivities.remove(activity::class.java)
    }
  }
  
  fun isActivityInBackStack(cls: Class<*>?) = runningActivities.contains(cls)

  override fun onTerminate() {
    super.onTerminate()
    unregisterActivityLifecycleCallbacks(lifecycleCallbacks)
  }
  `;

  return appendContentsInsideDeclarationBlock(contents, 'class MainApplication', codeMod);
}
