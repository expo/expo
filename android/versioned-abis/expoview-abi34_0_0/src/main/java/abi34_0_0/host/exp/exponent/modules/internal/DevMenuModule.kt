package abi34_0_0.host.exp.exponent.modules.internal

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import abi34_0_0.com.facebook.react.bridge.LifecycleEventListener
import abi34_0_0.com.facebook.react.bridge.ReactApplicationContext
import abi34_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule
import abi34_0_0.com.facebook.react.bridge.UiThreadUtil
import abi34_0_0.com.facebook.react.devsupport.DevInternalSettings
import abi34_0_0.com.facebook.react.devsupport.interfaces.DevSupportManager
import host.exp.exponent.di.NativeModuleDepsProvider
import host.exp.exponent.experience.ExperienceActivity
import host.exp.exponent.experience.ReactNativeActivity
import host.exp.exponent.kernel.DevMenuManager
import host.exp.exponent.kernel.DevMenuModuleInterface
import host.exp.exponent.kernel.KernelConstants
import host.exp.exponent.utils.JSONBundleConverter
import org.json.JSONException
import org.json.JSONObject
import java.util.*
import javax.inject.Inject

class DevMenuModule(reactContext: ReactApplicationContext, val experienceProperties: Map<String, Any>, val manifest: JSONObject?) : ReactContextBaseJavaModule(reactContext), LifecycleEventListener, DevMenuModuleInterface {

  @Inject
  internal var devMenuManager: DevMenuManager? = null

  init {
    NativeModuleDepsProvider.getInstance().inject(DevMenuModule::class.java, this)
    reactContext.addLifecycleEventListener(this)
  }

  //region publics

  override fun getName(): String = "ExpoDevMenu"

  //endregion publics
  //region DevMenuModuleInterface

  /**
   * Returns manifestUrl of the experience which can be used as its ID.
   */
  override fun getManifestUrl(): String {
    val manifestUrl = experienceProperties[KernelConstants.MANIFEST_URL_KEY] as String?
    return manifestUrl ?: ""
  }

  /**
   * Returns a [Bundle] containing initialProps that will be used to render the dev menu for related experience.
   */
  override fun getInitialProps(): Bundle {
    val bundle = Bundle()
    val taskBundle = Bundle()

    taskBundle.putString("manifestUrl", getManifestUrl())
    taskBundle.putBundle("manifest", JSONBundleConverter.JSONToBundle(manifest))

    bundle.putBundle("task", taskBundle)
    bundle.putString("uuid", UUID.randomUUID().toString())

    return bundle
  }

  /**
   * Returns a [Bundle] with all available dev menu options for related experience.
   */
  override fun getMenuItems(): Bundle {
    val devSupportManager = getDevSupportManager()
    val devSettings = devSupportManager?.devSettings

    val items = Bundle()
    val inspectorBundle = Bundle()
    val debuggerBundle = Bundle()
    val hmrBundle = Bundle()
    val perfBundle = Bundle()

    if (devSettings != null && devSupportManager.devSupportEnabled) {
      inspectorBundle.putString("label", if (devSettings.isElementInspectorEnabled) "Hide Element Inspector" else "Show Element Inspector")
      inspectorBundle.putBoolean("isEnabled", true)
    } else {
      inspectorBundle.putString("label", "Element Inspector Unavailable")
      inspectorBundle.putBoolean("isEnabled", false)
    }
    items.putBundle("dev-inspector", inspectorBundle)

    if (devSettings != null && devSupportManager.devSupportEnabled) {
      debuggerBundle.putString("label", if (devSettings.isRemoteJSDebugEnabled) "Stop Remote Debugging" else "Debug Remote JS")
      debuggerBundle.putBoolean("isEnabled", devSupportManager.devSupportEnabled)
    } else {
      debuggerBundle.putString("label", "Remote Debugger Unavailable")
      debuggerBundle.putBoolean("isEnabled", false)
    }
    items.putBundle("dev-remote-debug", debuggerBundle)

    if (devSettings != null && devSupportManager.devSupportEnabled && devSettings is DevInternalSettings) {
      hmrBundle.putString("label", if (devSettings.isHotModuleReplacementEnabled) "Disable Fast Refresh" else "Enable Fast Refresh")
      hmrBundle.putBoolean("isEnabled", true)
    } else {
      hmrBundle.putString("label", "Fast Refresh Unavailable")
      hmrBundle.putString("detail", "Use the Reload button above to reload when in production mode. Switch back to development mode to use Fast Refresh.")
      hmrBundle.putBoolean("isEnabled", false)
    }
    items.putBundle("dev-hmr", hmrBundle)

    if (devSettings != null && devSupportManager.devSupportEnabled) {
      perfBundle.putString("label", if (devSettings.isFpsDebugEnabled) "Hide Performance Monitor" else "Show Performance Monitor")
      perfBundle.putBoolean("isEnabled", true)
    } else {
      perfBundle.putString("label", "Performance Monitor Unavailable")
      perfBundle.putBoolean("isEnabled", false)
    }
    items.putBundle("dev-perf-monitor", perfBundle)

    return items
  }

  /**
   * Handles selecting dev menu options returned by [getMenuItems].
   */
  override fun selectItemWithKey(itemKey: String) {
    val devSupportManager = getDevSupportManager()
    val devSettings = devSupportManager?.devSettings as DevInternalSettings?

    if (devSupportManager == null || devSettings == null) {
      return
    }

    UiThreadUtil.runOnUiThread {
      when (itemKey) {
        "dev-remote-debug" -> {
          devSettings.isRemoteJSDebugEnabled = !devSettings.isRemoteJSDebugEnabled
          devSupportManager.handleReloadJS()
        }
        "dev-hmr" -> {
          devSettings.isHotModuleReplacementEnabled = !devSettings.isHotModuleReplacementEnabled
          devSupportManager.handleReloadJS()
        }
        "dev-inspector" -> {
          devSettings.isElementInspectorEnabled = !devSettings.isElementInspectorEnabled
          if (devSettings.isElementInspectorEnabled) devSupportManager.startInspector() else devSupportManager.stopInspector()
        }
        "dev-perf-monitor" -> {
          if (!devSettings.isFpsDebugEnabled) {
            // Request overlay permission if needed when "Show Perf Monitor" option is selected
            requestOverlaysPermission()
          }
          devSettings.isFpsDebugEnabled = !devSettings.isFpsDebugEnabled
        }
      }
    }
  }

  /**
   * Reloads JavaScript bundle without reloading the manifest.
   */
  override fun reloadApp() {
    getDevSupportManager()?.handleReloadJS()
  }

  /**
   * Returns boolean value determining whether this app supports developer tools.
   */
  override fun isDevSupportEnabled(): Boolean {
    return try {
      manifest?.getJSONObject("developer")?.get("tool") != null
    } catch (e: JSONException) {
      false
    }
  }

  //endregion DevMenuModuleInterface
  //region LifecycleEventListener

  override fun onHostResume() {
    val activity = currentActivity

    if (activity is ExperienceActivity) {
      devMenuManager?.registerDevMenuModuleForActivity(this, activity)
    }
  }

  override fun onHostPause() {}

  override fun onHostDestroy() {}

  //endregion LifecycleEventListener
  //region internals

  /**
   * Returns versioned instance of [DevSupportManager],
   * or null if no activity is currently attached to react context.
   */
  private fun getDevSupportManager(): DevSupportManager? {
    val activity = currentActivity as ReactNativeActivity?
    return activity?.devSupportManager?.get() as DevSupportManager
  }

  /**
   * Requests for the permission that allows the app to draw overlays on other apps.
   * Such permission is required for example to enable performance monitor.
   */
  private fun requestOverlaysPermission() {
    val context = currentActivity ?: return

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      // Get permission to show debug overlay in dev builds.
      if (!Settings.canDrawOverlays(context)) {
        val intent = Intent(
            Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
            Uri.parse("package:" + context.packageName))
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
        if (intent.resolveActivity(context.packageManager) != null) {
          context.startActivity(intent)
        }
      }
    }
  }

  //endregion internals
}
