package expo.modules.devmenu

import android.app.Application
import android.content.pm.PackageManager
import com.facebook.react.ReactHost
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.runtime.ReactHostDelegate
import com.facebook.react.runtime.ReactHostImpl
import expo.modules.devmenu.compose.DevMenuState
import java.lang.reflect.Field

object AppInfo {
  data class Native(
    val appName: String,
    val appVersion: String? = null
  )

  private var _cachedAppInfo: Native? = null

  fun getNativeAppInfo(application: Application): Native {
    _cachedAppInfo?.let {
      return it
    }

    val packageManager = application.packageManager
    val packageName = application.packageName
    val packageInfo = packageManager.getPackageInfo(packageName, 0)

    val appVersion = packageInfo.versionName
    val applicationInfo = packageManager.getApplicationInfo(packageName, PackageManager.GET_META_DATA)
    val appName = packageManager.getApplicationLabel(applicationInfo).toString()

    val native = Native(
      appName = appName,
      appVersion = appVersion
    )

    _cachedAppInfo = native

    return native
  }

  @OptIn(UnstableReactNativeAPI::class)
  fun getAppInfo(application: Application, reactHost: ReactHost): DevMenuState.AppInfo {
    val native = getNativeAppInfo(application)
    // We want to override the native app name and version with the manifest values if available.
    val appName = native.appName
    val appVersion = native.appVersion

    val hostUrl = reactHost.currentReactContext?.sourceURL

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
      runtimeVersion = null,
      hostUrl = hostUrl ?: "Unknown",
      engine = engine
    )
  }
}
