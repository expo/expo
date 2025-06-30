package expo.modules.devmenu

import android.content.Context
import android.content.pm.PackageManager
import expo.interfaces.devmenu.ReactHostWrapper
import expo.modules.devmenu.compose.DevMenuState
import expo.modules.manifests.core.ExpoUpdatesManifest

object AppInfo {
  data class Native (
    val appName: String,
    val appVersion: String? = null
  )

  fun getNativeAppInfo(context: Context): Native {
    val packageManager = context.packageManager
    val packageName = context.packageName
    val packageInfo = packageManager.getPackageInfo(packageName, 0)

    var appVersion = packageInfo.versionName
    val applicationInfo = packageManager.getApplicationInfo(packageName, PackageManager.GET_META_DATA)
    var appName = packageManager.getApplicationLabel(applicationInfo).toString()

    return Native(
      appName = appName,
      appVersion = appVersion
    )
  }

  fun getAppInfo(reactHost: ReactHostWrapper, context: Context): DevMenuState.AppInfo {
    val native = getNativeAppInfo(context)

    // We want to override the native app name and version with the manifest values if available.
    var appName = native.appName
    var appVersion = native.appVersion

    var hostUrl = reactHost.currentReactContext?.sourceURL
    var runtimeVersion = ""
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

      if (manifest is ExpoUpdatesManifest) {
        runtimeVersion = manifest.getRuntimeVersion()
      }
    }

    if (DevMenuManager.currentManifestURL != null) {
      hostUrl = DevMenuManager.currentManifestURL
    }

    val jsExecutorName = reactHost.jsExecutorName
    val engine = when {
      jsExecutorName.contains("Hermes") -> "Hermes"
      jsExecutorName.contains("V8") -> "V8"
      else -> "JSC"
    }

    return DevMenuState.AppInfo(
      appVersion = appVersion,
      appName = appName,
      runtimeVersion = runtimeVersion,
      hostUrl = hostUrl ?: "Unknown",
      engine = engine
    )
  }
}
