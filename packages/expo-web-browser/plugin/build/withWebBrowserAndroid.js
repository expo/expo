"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withWebBrowserAndroid = void 0;
const config_plugins_1 = require("expo/config-plugins");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const utils_1 = require("./utils");
const withWebBrowserAndroid = (config) => {
    config = addActivityToManifest(config);
    config = modifyMainApplication(config);
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
        application?.activity?.push(launcherActivity);
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
}
`;
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
        const importsMod = (0, utils_1.addImports)(mainApplication.contents, ['android.app.Activity', 'android.os.Bundle'], false);
        const onCreateMod = (0, utils_1.appendContentsInsideDeclarationBlock)(importsMod, 'onCreate', '  registerActivityLifecycleCallbacks(lifecycleCallbacks)');
        const result = addMainApplicationMod(onCreateMod);
        return {
            ...config,
            modResults: {
                ...config.modResults,
                contents: result,
            },
        };
    });
}
function addMainApplicationMod(contents) {
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
    return (0, utils_1.appendContentsInsideDeclarationBlock)(contents, 'class MainApplication', codeMod);
}
