package expo.modules.devlauncher.modules

import android.content.ActivityNotFoundException
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import expo.modules.devlauncher.DevLauncherController
import expo.modules.devlauncher.DevLauncherController.Companion.wasInitialized
import expo.modules.devlauncher.helpers.DevLauncherInstallationIDHelper
import expo.modules.devlauncher.koin.DevLauncherKoinComponent
import expo.modules.devlauncher.launcher.DevLauncherControllerInterface
import expo.modules.devlauncher.launcher.DevLauncherIntentRegistryInterface
import expo.modules.devlauncher.launcher.errors.DevLauncherErrorRegistry
import expo.modules.devmenu.DevMenuManager
import kotlinx.coroutines.launch
import org.koin.core.component.inject

private const val ON_NEW_DEEP_LINK_EVENT = "expo.modules.devlauncher.onnewdeeplink"
private const val CLIENT_PACKAGE_NAME = "host.exp.exponent"
private val CLIENT_HOME_QR_SCANNER_DEEP_LINK = Uri.parse("expo-home://qr-scanner")
private const val LAUNCHER_NAVIGATION_STATE_KEY = "expo.modules.devlauncher.navigation-state"


class DevLauncherInternalModule(reactContext: ReactApplicationContext?) :
  ReactContextBaseJavaModule(reactContext), DevLauncherKoinComponent {
  private val controller: DevLauncherControllerInterface by inject()
  private val intentRegistry: DevLauncherIntentRegistryInterface by inject()
  private val installationIDHelper: DevLauncherInstallationIDHelper by inject()

  override fun initialize() {
    super.initialize()
    if (wasInitialized()) {
      intentRegistry.subscribe(this::onNewPendingIntent)
    }
  }

  override fun invalidate() {
    super.invalidate()
    if (wasInitialized()) {
      intentRegistry.unsubscribe(this::onNewPendingIntent)
    }
  }

  override fun getName() = "EXDevLauncherInternal"

  override fun hasConstants(): Boolean = true

  override fun getConstants(): Map<String, Any> {
    val isRunningOnGenymotion = Build.FINGERPRINT.contains("vbox")
    val isRunningOnStockEmulator = Build.FINGERPRINT.contains("generic")
    return mapOf(
      "installationID" to installationIDHelper.getOrCreateInstallationID(reactApplicationContext),
      "isDevice" to (!isRunningOnGenymotion && !isRunningOnStockEmulator),
      "updatesConfig" to getUpdatesConfig(),
    )
  }

  private fun getUpdatesConfig(): WritableMap {
    val map = Arguments.createMap()

    val runtimeVersion = DevLauncherController.getMetadataValue(reactApplicationContext, "expo.modules.updates.EXPO_RUNTIME_VERSION")
    val sdkVersion = DevLauncherController.getMetadataValue(reactApplicationContext, "expo.modules.updates.EXPO_SDK_VERSION")
    var projectUrl = DevLauncherController.getMetadataValue(reactApplicationContext, "expo.modules.updates.EXPO_UPDATE_URL")

    val appId = if (projectUrl.isNotEmpty()) {
      Uri.parse(projectUrl).lastPathSegment ?: ""
    } else {
      ""
    }

    val projectUri = Uri.parse(projectUrl)

    val isModernManifestProtocol = projectUri.host.equals("u.expo.dev") || projectUri.host.equals("staging-u.expo.dev")
    val usesEASUpdates = isModernManifestProtocol && appId.isNotEmpty()

    return map.apply {
      putString("appId", appId)
      putString("runtimeVersion", runtimeVersion)
      putString("sdkVersion", sdkVersion)
      putBoolean("usesEASUpdates", usesEASUpdates)
      putString("projectUrl", projectUrl)
    }
  }

  private fun sanitizeUrlString(url: String): Uri {
    return Uri.parse(url.trim())
  }

  @ReactMethod
  fun loadUpdate(url: String, projectUrlString: String?, promise: Promise) {
    controller.coroutineScope.launch {
      try {
        val appUrl = sanitizeUrlString(url)
        var projectUrl: Uri? = null
        if (projectUrlString != null) {
          projectUrl = sanitizeUrlString(projectUrlString)
        }
        controller.loadApp(appUrl, projectUrl)
      } catch (e: Exception) {
        promise.reject("ERR_DEV_LAUNCHER_CANNOT_LOAD_APP", e.message, e)
        return@launch
      }
      promise.resolve(null)
    }
  }

  @ReactMethod
  fun loadApp(url: String, promise: Promise) {
    controller.coroutineScope.launch {
      try {
        val parsedUrl = sanitizeUrlString(url)
        controller.loadApp(parsedUrl)
      } catch (e: Exception) {
        promise.reject("ERR_DEV_LAUNCHER_CANNOT_LOAD_APP", e.message, e)
        return@launch
      }
      promise.resolve(null)
    }
  }

  @ReactMethod
  fun getRecentlyOpenedApps(promise: Promise) {
    val apps = Arguments.createArray()

    for (recentlyOpenedApp in controller.getRecentlyOpenedApps()) {
      val app = Arguments.createMap()
      
      app.putDouble("timestamp", recentlyOpenedApp.timestamp.toDouble())
      app.putString("name", recentlyOpenedApp.name)
      app.putString("url", recentlyOpenedApp.url)
      app.putBoolean("isEASUpdate", recentlyOpenedApp.isEASUpdate == true)

      if (recentlyOpenedApp.isEASUpdate == true) {
        app.putString("updateMessage", recentlyOpenedApp.updateMessage)
        app.putString("branchName", recentlyOpenedApp.branchName)
      }

      apps.pushMap(app)
    }

    return promise.resolve(apps)
  }

  @ReactMethod
  fun clearRecentlyOpenedApps(promise: Promise) {
    controller.clearRecentlyOpenedApps()
    return promise.resolve(null)
  }

  @ReactMethod
  fun openCamera(promise: Promise) {
    val packageManager = reactApplicationContext.packageManager

    packageManager.getLaunchIntentForPackage(CLIENT_PACKAGE_NAME)
      ?.let {
        tryToDeepLinkIntoQRScannerDirectly(it)
        promise.resolve(null)
        return
      }

    // try to open the Play Store app...
    if (openLink(Uri.parse("market://details?id=$CLIENT_PACKAGE_NAME"))) {
      return
    }

    // ...app isn't installed so fallback to the Play Store website
    if (openLink(Uri.parse("https://play.google.com/store/apps/details?id=$CLIENT_PACKAGE_NAME"))) {
      return
    }

    promise.reject("ERR_DEVELOPMENT_CLIENT_CANNOT_OPEN_CAMERA", "Couldn't find the Expo Go app.")
  }

  @ReactMethod
  fun getPendingDeepLink(promise: Promise) {
    intentRegistry.intent?.data?.let {
      promise.resolve(it.toString())
      return
    }

    promise.resolve(intentRegistry.intent?.action)
  }

  @ReactMethod
  fun getCrashReport(promise: Promise) {
    val registry = DevLauncherErrorRegistry(reactApplicationContext)
    promise.resolve(registry.consumeException()?.toWritableMap())
  }

  private fun onNewPendingIntent(intent: Intent) {
    intent.data?.toString()?.let {
      reactApplicationContext
        .getJSModule(RCTDeviceEventEmitter::class.java)
        .emit(ON_NEW_DEEP_LINK_EVENT, it)
    }
  }

  private fun tryToDeepLinkIntoQRScannerDirectly(fallback: Intent) {
    if (openLink(CLIENT_HOME_QR_SCANNER_DEEP_LINK)) {
      return
    }

    reactApplicationContext.startActivity(fallback)
  }

  private fun openLink(uri: Uri): Boolean {
    return try {
      reactApplicationContext.startActivity(
        Intent(Intent.ACTION_VIEW, uri).apply {
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
      )
      true
    } catch (_: ActivityNotFoundException) {
      false
    }
  }

  @ReactMethod
  fun getBuildInfo(promise: Promise) {
    val map = Arguments.createMap()
    val packageManager = reactApplicationContext.packageManager
    val packageName = reactApplicationContext.packageName

    val packageInfo = packageManager.getPackageInfo(packageName, 0)
    val applicationInfo = packageManager.getApplicationInfo(packageName, PackageManager.GET_META_DATA)
    val appName = packageManager.getApplicationLabel(applicationInfo).toString()
    val runtimeVersion = DevLauncherController.getMetadataValue(reactApplicationContext, "expo.modules.updates.EXPO_RUNTIME_VERSION")
    val sdkVersion = DevLauncherController.getMetadataValue(reactApplicationContext, "expo.modules.updates.EXPO_SDK_VERSION")
    var appIcon = getApplicationIconUri()

    var updatesUrl = DevLauncherController.getMetadataValue(reactApplicationContext, "expo.modules.updates.EXPO_UPDATE_URL")
    var appId = ""

    if (updatesUrl.isNotEmpty()) {
      var uri = Uri.parse(updatesUrl)
      appId = uri.lastPathSegment ?: ""
    }

    map.apply {
      putString("appVersion", packageInfo.versionName)
      putString("appId", appId)
      putString("appName", appName)
      putString("appIcon", appIcon)
      putString("runtimeVersion", runtimeVersion)
      putString("sdkVersion", sdkVersion)
    }

    promise.resolve(map)
  }

  @ReactMethod
  fun copyToClipboard(content: String, promise: Promise) {
    val clipboard = reactApplicationContext.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
    val clip = ClipData.newPlainText(null, content)
    clipboard.setPrimaryClip(clip)
    promise.resolve(null)
  }

  private fun getApplicationIconUri(): String {
    val packageManager = reactApplicationContext.packageManager
    val packageName = reactApplicationContext.packageName
    val applicationInfo = packageManager.getApplicationInfo(packageName, 0)
//    TODO - figure out how to get resId for AdaptiveIconDrawable icons
    return "" + applicationInfo.icon
  }

  @ReactMethod
  fun loadFontsAsync(promise: Promise) {
    DevMenuManager.loadFonts(reactApplicationContext)
    promise.resolve(null)
  }

  @ReactMethod
  fun getNavigationState(promise: Promise) {
    val sharedPreferences = reactApplicationContext.getSharedPreferences(LAUNCHER_NAVIGATION_STATE_KEY, Context.MODE_PRIVATE)
    val serializedNavigationState = sharedPreferences.getString("navigationState", null) ?: ""
    promise.resolve(serializedNavigationState)
  }

  @ReactMethod
  fun saveNavigationState(serializedNavigationState: String, promise: Promise) {
    val sharedPreferences = reactApplicationContext.getSharedPreferences(LAUNCHER_NAVIGATION_STATE_KEY, Context.MODE_PRIVATE)
    sharedPreferences.edit().putString("navigationState", serializedNavigationState).apply()
    promise.resolve(null)
  }

  @ReactMethod
  fun clearNavigationState(promise: Promise) {
    val sharedPreferences = reactApplicationContext.getSharedPreferences(LAUNCHER_NAVIGATION_STATE_KEY, Context.MODE_PRIVATE)
    sharedPreferences.edit().clear().apply()
    promise.resolve(null)
  }
}
