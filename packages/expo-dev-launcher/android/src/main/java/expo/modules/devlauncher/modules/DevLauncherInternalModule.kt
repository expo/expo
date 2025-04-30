// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.devlauncher.modules

import android.content.ActivityNotFoundException
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import androidx.core.os.bundleOf
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import expo.modules.core.utilities.EmulatorUtilities
import expo.modules.devlauncher.DevLauncherController
import expo.modules.devlauncher.DevLauncherController.Companion.wasInitialized
import expo.modules.devlauncher.helpers.DevLauncherInstallationIDHelper
import expo.modules.devlauncher.koin.DevLauncherKoinComponent
import expo.modules.devlauncher.launcher.DevLauncherControllerInterface
import expo.modules.devlauncher.launcher.DevLauncherIntentRegistryInterface
import expo.modules.devlauncher.launcher.DevLauncherPendingIntentListener
import expo.modules.devlauncher.launcher.errors.DevLauncherErrorRegistry
import expo.modules.devmenu.DevMenuManager
import kotlinx.coroutines.launch
import org.koin.core.component.inject

import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition


private const val ON_NEW_DEEP_LINK_EVENT = "expo.modules.devlauncher.onnewdeeplink"
private val CLIENT_HOME_QR_SCANNER_DEEP_LINK = Uri.parse("expo-home://qr-scanner")
private const val LAUNCHER_NAVIGATION_STATE_KEY = "expo.modules.devlauncher.navigation-state"

class DevLauncherInternalModule : Module(), DevLauncherKoinComponent {
  private val context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private val controller: DevLauncherControllerInterface by inject()
  private val intentRegistry: DevLauncherIntentRegistryInterface by inject()
  private val installationIDHelper: DevLauncherInstallationIDHelper by inject()

  override fun definition() = ModuleDefinition {
    Name("ExpoDevLauncherInternal")
    Events(ON_NEW_DEEP_LINK_EVENT)

    OnCreate {
      if (wasInitialized()) {
        intentRegistry.subscribe(this@DevLauncherInternalModule::onNewPendingIntent)
      }
    }

    OnDestroy {
      if (wasInitialized()) {
        intentRegistry.unsubscribe(this@DevLauncherInternalModule::onNewPendingIntent)
      }
    }

    Constants {
      val isRunningOnEmulator = EmulatorUtilities.isRunningOnEmulator()

      return@Constants mapOf(
        "installationID" to installationIDHelper.getOrCreateInstallationID(context),
        "isDevice" to !isRunningOnEmulator,
        "updatesConfig" to getUpdatesConfig()
      )
    }

    AsyncFunction("loadUpdate") { url: String, projectUrlString: String?, promise: Promise ->
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

    AsyncFunction("loadApp") { url: String, promise: Promise ->
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

    AsyncFunction<List<Bundle?>>("getRecentlyOpenedApps") {
      val apps = controller.getRecentlyOpenedApps().map {
          Bundle().apply {
           putDouble("timestamp", it.timestamp.toDouble())
           putString("name", it.name)
           putString("url", it.url)
           putBoolean("isEASUpdate", it.isEASUpdate == true)

            if (it.isEASUpdate == true) {
             putString("updateMessage", it.updateMessage)
             putString("branchName", it.branchName)
            }
         }
      }
      return@AsyncFunction apps
    }

    AsyncFunction("clearRecentlyOpenedApps") {
      controller.clearRecentlyOpenedApps()
    }

    AsyncFunction("getPendingDeepLink") { promise: Promise ->
      intentRegistry.intent?.data?.let {
        promise.resolve(it.toString())
        return@AsyncFunction
      }

      promise.resolve(intentRegistry.intent?.action)
    }

    AsyncFunction<WritableMap?>("getCrashReport") {
      val registry = DevLauncherErrorRegistry(context)

      return@AsyncFunction registry.consumeException()?.toWritableMap()
    }

    AsyncFunction("getBuildInfo") {
      val map = Bundle()
      val packageManager = context.packageManager
      val packageName = context.packageName

      val packageInfo = packageManager.getPackageInfo(packageName, 0)
      val applicationInfo = packageManager.getApplicationInfo(packageName, PackageManager.GET_META_DATA)
      val appName = packageManager.getApplicationLabel(applicationInfo).toString()
      val runtimeVersion = controller.updatesInterface?.runtimeVersion
      val appIcon = getApplicationIconUri()

      val updatesUrl = controller.updatesInterface?.updateUrl
      val appId = if (updatesUrl !== null) {
        updatesUrl.lastPathSegment ?: ""
      } else {
        ""
      }

      return@AsyncFunction Bundle().apply {
        putString("appVersion", packageInfo.versionName)
        putString("appId", appId)
        putString("appName", appName)
        putString("appIcon", appIcon)
        putString("runtimeVersion", runtimeVersion)
      }
    }

    AsyncFunction("copyToClipboard") { content: String ->
      val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
      val clip = ClipData.newPlainText(null, content)
      clipboard.setPrimaryClip(clip)
    }

    AsyncFunction("loadFontsAsync") {
      DevMenuManager.loadFonts(context)
    }

    AsyncFunction("getNavigationState") {
      val sharedPreferences = context.getSharedPreferences(LAUNCHER_NAVIGATION_STATE_KEY, Context.MODE_PRIVATE)
      val serializedNavigationState = sharedPreferences.getString("navigationState", null) ?: ""
      return@AsyncFunction serializedNavigationState
    }

    AsyncFunction("saveNavigationState") { serializedNavigationState: String ->
      val sharedPreferences = context.getSharedPreferences(LAUNCHER_NAVIGATION_STATE_KEY, Context.MODE_PRIVATE)
      sharedPreferences.edit().putString("navigationState", serializedNavigationState).apply()
    }

    AsyncFunction("clearNavigationState") {
      val sharedPreferences = context.getSharedPreferences(LAUNCHER_NAVIGATION_STATE_KEY, Context.MODE_PRIVATE)
      sharedPreferences.edit().clear().apply()
    }
  }

  private fun getApplicationIconUri(): String {
    val packageManager = context.packageManager
    val packageName = context.packageName
    val applicationInfo = packageManager.getApplicationInfo(packageName, 0)
    val appIconResId = applicationInfo.icon
    return "android.resource://$packageName/$appIconResId"
  }

  private fun sanitizeUrlString(url: String): Uri {
    var sanitizedUrl = url.trim()
    // If the url does contain a scheme use "http://"
    if (!sanitizedUrl.contains("://")) {
      sanitizedUrl = "http://" + sanitizedUrl
    }

    return Uri.parse(sanitizedUrl)
  }

  private fun getUpdatesConfig(): WritableMap {
    val map = Arguments.createMap()

    val runtimeVersion = controller.updatesInterface?.runtimeVersion
    val projectUrl = DevLauncherController.getMetadataValue(context, "expo.modules.updates.EXPO_UPDATE_URL")

    val projectUri = Uri.parse(projectUrl)
    val appId = projectUri?.lastPathSegment ?: ""

    val isModernManifestProtocol = projectUri?.host.equals("u.expo.dev") || projectUri?.host.equals("staging-u.expo.dev")
    val usesEASUpdates = isModernManifestProtocol && appId.isNotEmpty()

    return map.apply {
      putString("appId", appId)
      putString("runtimeVersion", runtimeVersion)
      putBoolean("usesEASUpdates", usesEASUpdates)
      putString("projectUrl", projectUri.toString())
    }
  }

  private fun onNewPendingIntent(intent: Intent) {
    intent.data?.toString()?.let {
      this@DevLauncherInternalModule.sendEvent(ON_NEW_DEEP_LINK_EVENT, bundleOf(
        "url" to it
      ))
    }
  }
}
