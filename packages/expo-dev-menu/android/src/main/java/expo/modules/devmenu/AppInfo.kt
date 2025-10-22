package expo.modules.devmenu

import android.app.Application
import android.content.pm.PackageManager
import com.facebook.react.ReactHost
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.runtime.ReactHostDelegate
import com.facebook.react.runtime.ReactHostImpl
import java.lang.reflect.Field
import expo.modules.devmenu.compose.DevMenuState
import expo.modules.manifests.core.ExpoUpdatesManifest

object AppInfo {
  data class Native(
    val appName: String,
    val appVersion: String? = null
  )

  lateinit var native: Native

  fun init(application: Application) {
    native = getNativeAppInfo(application)
  }

  private fun getNativeAppInfo(application: Application): Native {
    val packageManager = application.packageManager
    val packageName = application.packageName
    val packageInfo = packageManager.getPackageInfo(packageName, 0)

    val appVersion = packageInfo.versionName
    val applicationInfo = packageManager.getApplicationInfo(packageName, PackageManager.GET_META_DATA)
    val appName = packageManager.getApplicationLabel(applicationInfo).toString()

    return Native(
      appName = appName,
      appVersion = appVersion
    )
  }

  @OptIn(UnstableReactNativeAPI::class)
  fun getAppInfo(reactHost: ReactHost): DevMenuState.AppInfo {
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

    val reactHostDelegateField: Field =
      ReactHostImpl::class.java.getDeclaredField("reactHostDelegate")
    reactHostDelegateField.isAccessible = true
    val reactHostDelegate = reactHostDelegateField.get(reactHost) as ReactHostDelegate
    val className = reactHostDelegate.jsRuntimeFactory::class.simpleName.toString()
    val jsExecutorName = className.removeSuffix("Instance").removeSuffix("Runtime")

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
