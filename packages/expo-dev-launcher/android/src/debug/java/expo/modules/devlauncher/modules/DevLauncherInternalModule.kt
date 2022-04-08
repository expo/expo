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
import expo.modules.devlauncher.DevLauncherController.Companion.wasInitialized
import expo.modules.devlauncher.helpers.DevLauncherInstallationIDHelper
import expo.modules.devlauncher.helpers.getAppUrlFromDevLauncherUrl
import expo.modules.devlauncher.helpers.isDevLauncherUrl
import expo.modules.devlauncher.koin.DevLauncherKoinComponent
import expo.modules.devlauncher.launcher.DevLauncherControllerInterface
import expo.modules.devlauncher.launcher.DevLauncherIntentRegistryInterface
import expo.modules.devlauncher.launcher.errors.DevLauncherErrorRegistry
import expo.modules.devmenu.DevMenuAppInfo
import expo.modules.devmenu.DevMenuManager
import kotlinx.coroutines.launch
import org.koin.core.component.inject

private const val ON_NEW_DEEP_LINK_EVENT = "expo.modules.devlauncher.onnewdeeplink"
private const val CLIENT_PACKAGE_NAME = "host.exp.exponent"
private val CLIENT_HOME_QR_SCANNER_DEEP_LINK = Uri.parse("expo-home://qr-scanner")

class DevLauncherInternalModule(reactContext: ReactApplicationContext?)
  : ReactContextBaseJavaModule(reactContext), DevLauncherKoinComponent {
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
      "isDevice" to (!isRunningOnGenymotion && !isRunningOnStockEmulator)
    )
  }

  @ReactMethod
  fun loadApp(url: String, promise: Promise) {
    controller.coroutineScope.launch {
      try {
        val parsedUrl = Uri.parse(url.trim())
        val appUrl = if (isDevLauncherUrl(parsedUrl)) {
          requireNotNull(getAppUrlFromDevLauncherUrl(parsedUrl)) { "The provided url doesn't contain the app url." }
        } else {
          parsedUrl
        }
        controller.loadApp(appUrl)
      } catch (e: Exception) {
        promise.reject("ERR_DEV_LAUNCHER_CANNOT_LOAD_APP", e.message, e)
        return@launch
      }
      promise.resolve(null)
    }
  }

  @ReactMethod
  fun getRecentlyOpenedApps(promise: Promise) {
    promise.resolve(Arguments
      .createMap()
      .apply {
        controller.getRecentlyOpenedApps().forEach { (key, value) ->
          putString(key, value)
        }
      })
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

    val packageInfo =  packageManager.getPackageInfo(packageName, 0)
    val applicationInfo = packageManager.getApplicationInfo(packageName, PackageManager.GET_META_DATA)
    val appName = packageManager.getApplicationLabel(applicationInfo).toString()
    val runtimeVersion = getMetadataValue("expo.modules.updates.EXPO_RUNTIME_VERSION")
    val sdkVersion = getMetadataValue("expo.modules.updates.EXPO_SDK_VERSION")
    var appIcon = getApplicationIconUri()

    // TODO - the logic related to getting the appId could be moved into the expo-updates package and used inside the dev launcher JS
    var updatesUrl = getMetadataValue("expo.modules.updates.EXPO_UPDATE_URL")
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

  private fun getMetadataValue(key: String): String {
    val packageManager = reactApplicationContext.packageManager
    val packageName = reactApplicationContext.packageName
    val applicationInfo = packageManager.getApplicationInfo(packageName, PackageManager.GET_META_DATA)
    var metaDataValue = ""

    if (applicationInfo.metaData != null) {
      val value = applicationInfo.metaData.get(key)
      
      if (value != null) {
        metaDataValue = value.toString()
      }
    }

    return metaDataValue
  }

  private fun getApplicationIconUri(): String {
    var appIcon = ""
    val packageManager = reactApplicationContext.packageManager
    val packageName = reactApplicationContext.packageName
    val applicationInfo = packageManager.getApplicationInfo(packageName, 0)
    appIcon = "" + applicationInfo.icon
//    TODO - figure out how to get resId for AdaptiveIconDrawable icons
    return appIcon
  }

  @ReactMethod
  fun loadFontsAsync(promise: Promise) {
    DevMenuManager.loadFonts(reactApplicationContext)
    promise.resolve(null)
  }
}
