package versioned.host.exp.exponent.modules.internal

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.devsupport.DevInternalSettings
import com.facebook.react.devsupport.HMRClient
import com.facebook.react.devsupport.interfaces.DevSupportManager
import expo.modules.manifests.core.Manifest
import host.exp.exponent.di.NativeModuleDepsProvider
import host.exp.exponent.experience.ExperienceActivity
import host.exp.exponent.experience.ReactNativeActivity
import host.exp.exponent.kernel.DevMenuManager
import host.exp.exponent.kernel.DevMenuModuleInterface
import host.exp.exponent.kernel.KernelConstants
import host.exp.expoview.Exponent
import host.exp.expoview.R
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.UUID
import javax.inject.Inject

class DevMenuModule(reactContext: ReactApplicationContext, val experienceProperties: Map<String, Any?>, val manifest: Manifest?) : ReactContextBaseJavaModule(reactContext), LifecycleEventListener, DevMenuModuleInterface {

  @Inject
  internal lateinit var devMenuManager: DevMenuManager

  init {
    NativeModuleDepsProvider.instance.inject(DevMenuModule::class.java, this)
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
    taskBundle.putString("manifestString", manifest?.toString())

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
    val inspectorMap = Bundle()
    val debuggerMap = Bundle()
    val hmrMap = Bundle()
    val perfMap = Bundle()

    if (devSettings != null && devSupportManager.devSupportEnabled) {
      inspectorMap.putString("label", getString(if (devSettings.isElementInspectorEnabled) R.string.devmenu_hide_element_inspector else R.string.devmenu_show_element_inspector))
      inspectorMap.putBoolean("isEnabled", true)
    } else {
      inspectorMap.putString("label", getString(R.string.devmenu_element_inspector_unavailable))
      inspectorMap.putBoolean("isEnabled", false)
    }
    items.putBundle("dev-inspector", inspectorMap)

    if (devSettings != null && devSupportManager.devSupportEnabled && isJsExecutorInspectable) {
      debuggerMap.putString("label", getString(R.string.devmenu_open_js_debugger))
      debuggerMap.putBoolean("isEnabled", devSupportManager.devSupportEnabled)
      items.putBundle("dev-remote-debug", debuggerMap)
    }

    if (devSettings != null && devSupportManager.devSupportEnabled && devSettings is DevInternalSettings) {
      hmrMap.putString("label", getString(if (devSettings.isHotModuleReplacementEnabled) R.string.devmenu_disable_fast_refresh else R.string.devmenu_enable_fast_refresh))
      hmrMap.putBoolean("isEnabled", true)
    } else {
      hmrMap.putString("label", getString(R.string.devmenu_fast_refresh_unavailable))
      hmrMap.putString("detail", getString(R.string.devmenu_fast_refresh_unavailable_details))
      hmrMap.putBoolean("isEnabled", false)
    }
    items.putBundle("dev-hmr", hmrMap)

    if (devSettings != null && devSupportManager.devSupportEnabled) {
      perfMap.putString("label", getString(if (devSettings.isFpsDebugEnabled) R.string.devmenu_hide_performance_monitor else R.string.devmenu_show_performance_monitor))
      perfMap.putBoolean("isEnabled", true)
    } else {
      perfMap.putString("label", getString(R.string.devmenu_performance_monitor_unavailable))
      perfMap.putBoolean("isEnabled", false)
    }
    items.putBundle("dev-perf-monitor", perfMap)

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
          if (isJsExecutorInspectable) {
            openJsInspector()
          } else {
            devSettings.isRemoteJSDebugEnabled = !devSettings.isRemoteJSDebugEnabled
            devSupportManager.handleReloadJS()
          }
        }
        "dev-hmr" -> {
          val nextEnabled = !devSettings.isHotModuleReplacementEnabled
          val hmrClient: HMRClient? = reactApplicationContext?.getJSModule(HMRClient::class.java)

          devSettings.isHotModuleReplacementEnabled = nextEnabled
          if (nextEnabled) hmrClient?.enable() else hmrClient?.disable()
        }
        "dev-inspector" -> devSupportManager.toggleElementInspector()
        "dev-perf-monitor" -> {
          if (!devSettings.isFpsDebugEnabled) {
            // Request overlay permission if needed when "Show Perf Monitor" option is selected
            requestOverlaysPermission()
          }
          devSupportManager.setFpsDebugEnabled(!devSettings.isFpsDebugEnabled)
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
    return manifest != null && manifest.isUsingDeveloperTool()
  }

  //endregion DevMenuModuleInterface
  //region LifecycleEventListener

  override fun onHostResume() {
    val activity = currentActivity

    if (activity is ExperienceActivity) {
      devMenuManager.registerDevMenuModuleForActivity(this, activity)
    }
  }

  override fun onHostPause() {}

  override fun onHostDestroy() {}

  //endregion LifecycleEventListener
  //region internals

  /**
   * Returns instance of [DevSupportManager],
   * or null if no activity is currently attached to react context.
   */
  private fun getDevSupportManager(): DevSupportManager? {
    val activity = currentActivity as? ReactNativeActivity?
    return activity?.devSupportManager
  }

  /**
   * Requests for the permission that allows the app to draw overlays on other apps.
   * Such permission is required for example to enable performance monitor.
   */
  private fun requestOverlaysPermission() {
    val context = currentActivity ?: return
    // Get permission to show debug overlay in dev builds.
    if (!Settings.canDrawOverlays(context)) {
      val intent = Intent(
        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
        Uri.parse("package:" + context.packageName)
      )
      intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
      if (intent.resolveActivity(context.packageManager) != null) {
        context.startActivity(intent)
      }
    }
  }

  /**
   * Helper for getting localized [String] from `strings.xml` file.
   */
  private fun getString(ref: Int): String {
    return reactApplicationContext.resources.getString(ref)
  }

  /**
   * Indicates whether the underlying js executor supports inspecting.
   * NOTE: because current react-native doesn't pass jsi runtime `isInspectable` to java,
   * workaround to determine the state by executor name.
   */
  private val isJsExecutorInspectable: Boolean by lazy {
    val activity = currentActivity as? ReactNativeActivity
//    activity?.jsExecutorName == "JSIExecutor+HermesRuntime"
    true
  }

  /**
   * Open the JavaScript inspector
   */
  private fun openJsInspector() {
    reactApplicationContext.runOnNativeModulesQueueThread {
      val devSupportManager = getDevSupportManager()
      devSupportManager?.devSettings?.packagerConnectionSettings?.debugServerHost?.let {
        val url = "http://$it/_expo/debugger?applicationId=${reactApplicationContext.packageName}"
        val request = Request.Builder().url(url).put("".toRequestBody()).build()
        Exponent.instance.exponentNetwork.noCacheClient.newCall(request).execute()
      }
    }
  }

  //endregion internals
}
