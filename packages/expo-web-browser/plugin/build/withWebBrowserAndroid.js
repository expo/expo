"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withWebBrowserAndroid = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const codeMod_1 = require("@expo/config-plugins/build/android/codeMod");
const generateCode_1 = require("@expo/config-plugins/build/utils/generateCode");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const withWebBrowserAndroid = (config) => {
    config = addActivityToManifest(config);
    config = modifyMainApplication(config);
    config = modifyMainActivity(config);
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
        application?.activity?.[0]['intent-filter']?.splice(0, 1);
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
        if (!application?.activity?.includes(launcherActivity)) {
            application?.activity?.push(launcherActivity);
        }
        return config;
    });
}
function addLauncherClassToProject(config) {
    return (0, config_plugins_1.withDangerousMod)(config, [
        'android',
        async (config) => {
            const fileName = 'BrowserLauncherActivity.kt';
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
}`;
            const dir = path_1.default.dirname(config_plugins_1.AndroidConfig.Paths.getProjectFilePath(config.modRequest.projectRoot, 'MainApplication'));
            const fullPath = path_1.default.join(dir, fileName);
            await promises_1.default.writeFile(fullPath, classTemplate);
            return config;
        },
    ]);
}
function modifyMainApplication(config) {
    return (0, config_plugins_1.withMainApplication)(config, (config) => {
        const mainApplication = config.modResults;
        const newSrc = `  private val runningActivities = ArrayList<Class<*>>()

  fun addActivityToStack(cls: Class<*>?) {
    cls?.let {
      if (!runningActivities.contains(it)) runningActivities.add(it)
    }
  }

  fun removeActivityFromStack(cls: Class<*>?) {
    cls?.let {
      if (runningActivities.contains(cls)) runningActivities.remove(it)
    }
  }

  fun isActivityInBackStack(cls: Class<*>?) = runningActivities.contains(cls)`;
        const init = (0, generateCode_1.mergeContents)({
            src: mainApplication.contents,
            comment: '  //',
            tag: 'expo-web-browser',
            offset: 2,
            anchor: /ApplicationLifecycleDispatcher\.onConfigurationChanged/,
            newSrc,
        });
        return {
            ...config,
            modResults: {
                ...config.modResults,
                contents: init.contents,
            },
        };
    });
}
function modifyMainActivity(config) {
    return (0, config_plugins_1.withMainActivity)(config, (config) => {
        const { modResults } = config;
        if (modResults.contents.includes('addActivityToStack') ||
            modResults.contents.includes('removeActivityFromStack')) {
            return config;
        }
        const onCreateMod = (0, codeMod_1.appendContentsInsideDeclarationBlock)(modResults.contents, 'onCreate', '  (application as MainApplication).addActivityToStack(this.javaClass)');
        const onDestroyMod = (0, codeMod_1.appendContentsInsideDeclarationBlock)(onCreateMod, 'class MainActivity', `
  override fun onDestroy() {
    super.onDestroy()
    (application as MainApplication).removeActivityFromStack(this.javaClass)
  }`);
        return {
            ...config,
            modResults: {
                ...config.modResults,
                contents: onDestroyMod,
            },
        };
    });
}
