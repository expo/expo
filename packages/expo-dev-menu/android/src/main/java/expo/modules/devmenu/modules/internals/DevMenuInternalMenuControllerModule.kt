package expo.modules.devmenu.modules.internals

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.pm.PackageManager
import com.facebook.react.ReactInstanceManager
import com.facebook.react.bridge.*
import expo.modules.devmenu.DevMenuManager
import expo.modules.devmenu.devtools.DevMenuDevSettings
import expo.modules.devmenu.modules.DevMenuInternalMenuControllerModuleInterface
import kotlinx.coroutines.launch

class DevMenuInternalMenuControllerModule(private val reactContext: ReactContext) :
  DevMenuInternalMenuControllerModuleInterface {

  override fun hideMenu() {
    DevMenuManager.hideMenu()
  }

  override fun setOnboardingFinished(finished: Boolean) {
    DevMenuManager.getSettings()?.isOnboardingFinished = finished
  }

  override fun getSettingsAsync(promise: Promise) = promise.resolve(DevMenuManager.getSettings()?.serialize())

  override fun setSettingsAsync(settings: ReadableMap, promise: Promise) {
    if (settings.hasKey("motionGestureEnabled")) {
      DevMenuManager.getSettings()?.motionGestureEnabled = settings.getBoolean("motionGestureEnabled")
    }

    if (settings.hasKey("keyCommandsEnabled")) {
      DevMenuManager.getSettings()?.keyCommandsEnabled = settings.getBoolean("keyCommandsEnabled")
    }

    if (settings.hasKey("showsAtLaunch")) {
      DevMenuManager.getSettings()?.showsAtLaunch = settings.getBoolean("showsAtLaunch")
    }

    if (settings.hasKey("touchGestureEnabled")) {
      DevMenuManager.getSettings()?.touchGestureEnabled = settings.getBoolean("touchGestureEnabled")
    }

    promise.resolve(null)
  }

  override fun openDevMenuFromReactNative() {
    DevMenuManager.getReactInstanceManager()?.devSupportManager?.let {
      DevMenuManager.closeMenu()
      it.devSupportEnabled = true
      it.showDevOptionsDialog()
    }
  }

  override fun fetchDataSourceAsync(id: String?, promise: Promise) {
    if (id == null) {
      promise.reject("ERR_DEVMENU_FETCH_FAILED", "DataSource ID not provided.")
      return
    }

    DevMenuManager.coroutineScope.launch {
      val data = DevMenuManager.fetchDataSource(id)
      val result = Arguments.fromList(data.map { it.serialize() })
      promise.resolve(result)
    }
  }

  override fun getDevSettingsAsync(promise: Promise) {
    val devSettings = DevMenuDevSettings.getSettings()

    val map = Arguments.createMap().apply {
      putBoolean("isDebuggingRemotely", devSettings["isDebuggingRemotely"] ?: false)
      putBoolean("isElementInspectorShown", devSettings["isElementInspectorShown"] ?: false)
      putBoolean("isHotLoadingEnabled", devSettings["isHotLoadingEnabled"] ?: false)
      putBoolean("isPerfMonitorShown", devSettings["isPerfMonitorShown"] ?: false)
    }

    promise.resolve(map)
  }

  override fun getAppInfoAsync(promise: Promise) {
    val map = Arguments.createMap()
    val packageManager = reactContext.packageManager
    val packageName = reactContext.packageName
    val packageInfo =  packageManager.getPackageInfo(packageName, 0)

    var appVersion = packageInfo.versionName
    val applicationInfo = packageManager.getApplicationInfo(packageName, PackageManager.GET_META_DATA)
    var appName = packageManager.getApplicationLabel(applicationInfo).toString()
    val runtimeVersion = getMetadataValue("expo.modules.updates.EXPO_RUNTIME_VERSION")
    val sdkVersion = getMetadataValue("expo.modules.updates.EXPO_SDK_VERSION")
    var appIcon = getApplicationIconUri()
    var hostUrl = reactContext.sourceURL

    val manifest = DevMenuManager.currentManifest

    if (manifest != null) {
      val manifestName = manifest.getName()
      if (manifestName != null) {
        appName = manifestName
      }

      val manifestVersion = manifest.getVersion()
      if (manifestVersion != null) {
        appVersion = manifestVersion
      }
    }

    if (DevMenuManager.currentManifestURL != null) {
      hostUrl = DevMenuManager.currentManifestURL
    }

    map.apply {
      putString("appVersion", appVersion)
      putString("appName", appName)
      putString("appIcon", appIcon)
      putString("runtimeVersion", runtimeVersion)
      putString("sdkVersion", sdkVersion)
      putString("hostUrl", hostUrl)
    }

    promise.resolve(map)
  }

  private fun getMetadataValue(key: String): String {
    val packageManager = reactContext.packageManager
    val packageName = reactContext.packageName
    val applicationInfo = packageManager.getApplicationInfo(packageName, PackageManager.GET_META_DATA)
    return applicationInfo.metaData?.get(key)?.toString() ?: ""
  }

  private fun getApplicationIconUri(): String {
    var appIcon = ""
    val packageManager = reactContext.packageManager
    val packageName = reactContext.packageName
    val applicationInfo = packageManager.getApplicationInfo(packageName, 0)

    if (applicationInfo.icon != null) {
      appIcon = "" + applicationInfo.icon
    }
    //    TODO - figure out how to get resId for AdaptiveIconDrawable icons
    return appIcon
  }

  override fun copyToClipboardAsync(content: String, promise: Promise) {
    val clipboard = reactContext.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
    val clip = ClipData.newPlainText(null, content)
    clipboard.setPrimaryClip(clip)
    promise.resolve(null)
  }

  override fun navigateToLauncherAsync(promise: Promise) {
    if (DevMenuManager.launcherDelegate != null) {
      DevMenuManager.launcherDelegate?.navigateToLauncher()
      promise.resolve(null)
      return
    }

    promise.reject("ERR_DEVMENU_ACTION_FAILED", "navigateToLauncherAsync()")
  }

  override fun togglePerformanceMonitorAsync(promise: Promise) {
    DevMenuDevSettings.togglePerformanceMonitor()
    promise.resolve(null)
  }

  override fun toggleElementInspectorAsync(promise: Promise) {
    DevMenuDevSettings.toggleElementInspector()
    promise.resolve(null)
  }

  override fun reloadAsync(promise: Promise) {
    DevMenuDevSettings.reload()
    promise.resolve(null)
  }

  override fun toggleDebugRemoteJSAsync(promise: Promise) {
    DevMenuDevSettings.toggleRemoteDebugging()
    promise.resolve(null)
  }

  override fun toggleFastRefreshAsync(promise: Promise) {
    DevMenuDevSettings.toggleFastRefresh()
    promise.resolve(null)
  }
}
