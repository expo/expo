package expo.modules.devmenu.modules.internals

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.pm.PackageManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.devsupport.DevInternalSettings
import expo.modules.devmenu.DevMenuManager
import expo.modules.devmenu.devtools.DevMenuDevToolsDelegate
import expo.modules.devmenu.modules.DevMenuInternalMenuControllerModuleInterface
import kotlinx.coroutines.launch

class DevMenuInternalMenuControllerModule(private val reactContext: ReactContext) :
  DevMenuInternalMenuControllerModuleInterface {
  private val devMenuManager: DevMenuManager = DevMenuManager

  override fun dispatchCallableAsync(callableId: String?, args: ReadableMap?, promise: Promise) {
    if (callableId == null) {
      promise.reject("ERR_DEVMENU_ACTION_FAILED", "Callable ID not provided.")
      return
    }
    devMenuManager.dispatchCallable(callableId, args)
    promise.resolve(null)
  }

  override fun hideMenu() {
    devMenuManager.hideMenu()
  }

  override fun setOnboardingFinished(finished: Boolean) {
    devMenuManager.getSettings()?.isOnboardingFinished = finished
  }

  override fun getSettingsAsync(promise: Promise) = promise.resolve(devMenuManager.getSettings()?.serialize())

  override fun setSettingsAsync(settings: ReadableMap, promise: Promise) {
    if (settings.hasKey("motionGestureEnabled")) {
      devMenuManager.getSettings()?.motionGestureEnabled = settings.getBoolean("motionGestureEnabled")
    }

    if (settings.hasKey("keyCommandsEnabled")) {
      devMenuManager.getSettings()?.keyCommandsEnabled = settings.getBoolean("keyCommandsEnabled")
    }

    if (settings.hasKey("showsAtLaunch")) {
      devMenuManager.getSettings()?.showsAtLaunch = settings.getBoolean("showsAtLaunch")
    }

    if (settings.hasKey("touchGestureEnabled")) {
      devMenuManager.getSettings()?.touchGestureEnabled = settings.getBoolean("touchGestureEnabled")
    }

    promise.resolve(null)
  }

  override fun openDevMenuFromReactNative() {
    devMenuManager.getSession()?.reactInstanceManager?.devSupportManager?.let {
      devMenuManager.closeMenu()
      it.devSupportEnabled = true
      it.showDevOptionsDialog()
    }
  }

  override fun onScreenChangeAsync(currentScreen: String?, promise: Promise) {
    devMenuManager.setCurrentScreen(currentScreen)
    promise.resolve(null)
  }

  override fun fetchDataSourceAsync(id: String?, promise: Promise) {
    if (id == null) {
      promise.reject("ERR_DEVMENU_FETCH_FAILED", "DataSource ID not provided.")
      return
    }

    devMenuManager.coroutineScope.launch {
      val data = devMenuManager.fetchDataSource(id)
      val result = Arguments.fromList(data.map { it.serialize() })
      promise.resolve(result)
    }
  }

  override fun getDevSettingsAsync(promise: Promise) {
    val reactInstanceManager = devMenuManager.getSession()?.reactInstanceManager
    val map = Arguments.createMap()

    if (reactInstanceManager != null) {
      val devDelegate = DevMenuDevToolsDelegate(devMenuManager, reactInstanceManager)
      val devSettings = devDelegate.devSettings
      val devInternalSettings = (devSettings as? DevInternalSettings)

      map.apply {
        if (devInternalSettings != null) {
          putBoolean("isDebuggingRemotely", devSettings.isRemoteJSDebugEnabled)
          putBoolean("isElementInspectorShown", devSettings.isElementInspectorEnabled)
          putBoolean("isHotLoadingEnabled", devSettings.isHotModuleReplacementEnabled)
          putBoolean("isPerfMonitorShown", devSettings.isFpsDebugEnabled)
        }
      }
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

    val manifest = devMenuManager.currentManifest

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

    if (devMenuManager.currentManifestURL != null) {
      hostUrl = devMenuManager.currentManifestURL
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

  override fun copyToClipboardAsync(content: String, promise: Promise) {
    val clipboard = reactContext.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
    val clip = ClipData.newPlainText(null, content)
    clipboard.setPrimaryClip(clip)
    promise.resolve(null)
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
}
