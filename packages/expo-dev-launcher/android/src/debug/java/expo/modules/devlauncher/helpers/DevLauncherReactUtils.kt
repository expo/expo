package expo.modules.devlauncher.helpers

import android.content.Context
import android.net.Uri
import android.util.Log
import com.facebook.react.ReactHost
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.defaults.DefaultReactHostDelegate
import com.facebook.react.devsupport.DevLauncherDevServerHelper
import com.facebook.react.devsupport.DevLauncherSettings
import com.facebook.react.devsupport.DevServerHelper
import com.facebook.react.devsupport.DevSupportManagerBase
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.modules.debug.interfaces.DeveloperSettings
import com.facebook.react.modules.systeminfo.AndroidInfoHelpers
import com.facebook.react.runtime.ReactHostDelegate
import com.facebook.react.runtime.ReactHostImpl
import expo.modules.devlauncher.launcher.DevLauncherControllerInterface
import expo.modules.devlauncher.react.DevLauncherBridgelessDevSupportManager
import expo.modules.devmenu.helpers.setPrivateDeclaredFieldValue
import okhttp3.HttpUrl

// Sync this class name with ExpoReactHostFactory.kt
private const val EXPO_REACT_HOST_DELEGATE_CLASS = "expo.modules.ExpoReactHostFactory.ExpoReactHostDelegate"

fun injectReactInterceptor(
  context: Context,
  reactHost: ReactHost,
  url: Uri
): Boolean {
  val (debugServerHost, appBundleName) = parseUrl(url)

  setPackagerServerAccess(reactHost, true)

  val result = injectDebugServerHost(
    reactHost,
    debugServerHost,
    appBundleName
  )
  (reactHost.devSupportManager as? DevLauncherBridgelessDevSupportManager)?.startInspectorWhenDevLauncherReady()
  return result
}

@OptIn(UnstableReactNativeAPI::class)
private fun setPackagerServerAccess(reactHost: ReactHost, enabled: Boolean) {
  try {
    check(reactHost is ReactHostImpl)
    val field = ReactHostImpl::class.java.getDeclaredField("allowPackagerServerAccess")
    field.isAccessible = true
    field[reactHost] = enabled
  } catch (e: Exception) {
    Log.e(
      "DevLauncher",
      "Unable to set packager server access to $enabled. " +
        "The dev menu's remote debugging toggle may not reflect the actual connection state. " +
        "This can happen if the installed react-native version renamed or removed " +
        "ReactHostImpl.allowPackagerServerAccess — check that field against the installed " +
        "react-native version.",
      e
    )
  }
}

fun injectDebugServerHost(
  reactHost: ReactHost,
  debugServerHost: String,
  appBundleName: String
): Boolean {
  return try {
    val devSupportManager = requireNotNull(reactHost.devSupportManager) as DevSupportManagerBase
    // A previously loaded file bundle would otherwise take precedence over the
    // packager on the next load (bundleFilePath is checked first by ReactHostImpl).
    devSupportManager.bundleFilePath = null
    devSupportManager.devServerHelper.closePackagerConnection()
    devSupportManager.devSettings.packagerConnectionSettings.debugServerHost = debugServerHost
    devSupportManager.jsAppBundleName = appBundleName
    true
  } catch (e: Exception) {
    Log.e("DevLauncher", "Unable to inject debug server host settings.", e)
    false
  }
}

/**
 * Loads a bundle from a local file path (published apps / EAS Update downloads).
 * bundleFilePath is checked *before* the packager and delegate loaders by
 * ReactHostImpl.jsBundleLoader, so no delegate mutation is needed.
 */
fun injectLocalBundleLoader(
  reactHost: ReactHost,
  bundlePath: String
): Boolean {
  setPackagerServerAccess(reactHost, false)
  return try {
    requireNotNull(reactHost.devSupportManager).bundleFilePath = bundlePath
    true
  } catch (e: Exception) {
    Log.e("DevLauncher", "Unable to set the local bundle path on the DevSupportManager.", e)
    false
  }
}

@OptIn(UnstableReactNativeAPI::class)
fun injectBundleLoader(
  reactHost: ReactHost,
  jsBundleLoader: JSBundleLoader
): Boolean {
  setPackagerServerAccess(reactHost, false)

  return try {
    check(reactHost is ReactHostImpl)
    // A leftover file path would take precedence over the injected loader.
    reactHost.devSupportManager?.bundleFilePath = null

    val reactHostClass = ReactHostImpl::class.java
    val mReactHostDelegateField = reactHostClass.getDeclaredField("reactHostDelegate")
    mReactHostDelegateField.isAccessible = true
    val reactHostDelegate = mReactHostDelegateField[reactHost] as ReactHostDelegate
    if (reactHostDelegate.javaClass.canonicalName == EXPO_REACT_HOST_DELEGATE_CLASS) {
      reactHostDelegate.javaClass.setPrivateDeclaredFieldValue(
        "_jsBundleLoader",
        reactHostDelegate,
        jsBundleLoader
      )
    } else if (reactHostDelegate is DefaultReactHostDelegate) {
      DefaultReactHostDelegate::class.java.setPrivateDeclaredFieldValue(
        "jsBundleLoader",
        reactHostDelegate,
        jsBundleLoader
      )
    } else {
      throw IllegalStateException("[injectBundleLoader] Unsupported reactHostDelegate: ${reactHostDelegate.javaClass}")
    }

    true
  } catch (e: Exception) {
    Log.e("DevLauncher", "Unable to inject bundle loader", e)
    false
  }
}

fun injectDevServerHelper(
  context: Context,
  devSupportManager: DevSupportManager,
  controllerProvider: () -> DevLauncherControllerInterface?
) {
  try {
    val devSettings: DeveloperSettings = (devSupportManager as? DevSupportManagerBase)?.devSettings
      ?: run {
        Log.w(
          "DevLauncher",
          "The DevSupportManager (${devSupportManager.javaClass.name}) doesn't " +
            "extend DevSupportManagerBase, so the dev-launcher can't share its developer settings. " +
            "Falling back to standalone settings — a dev server picked in the launcher UI may not " +
            "be used for packager connections. This can happen if the installed react-native " +
            "version restructured its DevSupportManager class hierarchy."
        )
        DevLauncherSettings(context, AndroidInfoHelpers.getServerHost(context))
      }
    val devLauncherDevServerHelper = DevLauncherDevServerHelper(
      context = context,
      controllerProvider = controllerProvider,
      devSettings = devSettings,
      packagerConnection = devSettings.packagerConnectionSettings
    )
    val oldDevServerHelper: DevServerHelper = DevSupportManagerBase::class.java.getProtectedFieldValue(
      devSupportManager,
      "devServerHelper"
    )
    DevSupportManagerBase::class.java.setProtectedDeclaredField(
      devSupportManager,
      "devServerHelper",
      devLauncherDevServerHelper
    )
    try {
      oldDevServerHelper.closePackagerConnection()
      oldDevServerHelper.closeInspectorConnection()
    } catch (e: Exception) {
      Log.w(
        "DevLauncher",
        "The dev-launcher's DevServerHelper was injected, but closing the " +
          "previous helper's packager/inspector connections failed. Stale connections may linger " +
          "for this session.",
        e
      )
    }
  } catch (e: Exception) {
    Log.e(
      "DevLauncher",
      "Unable to inject the dev-launcher's DevServerHelper. " +
        "Remote debugging and dev-menu packager commands may not work for this session, " +
        "though the app will still load. This can happen if the installed react-native " +
        "version renamed or removed DevSupportManagerBase.devServerHelper — check that field " +
        "against the installed react-native version.",
      e
    )
  }
}

private fun parseUrl(url: Uri): Pair<String, String> {
  val port = if (url.port != -1) url.port else HttpUrl.defaultPort(url.scheme ?: "http")
  val debugServerHost = url.host + ":" + port
  // We need to remove "/" which is added to begin of the path by the Uri
  // and the bundle type
  val appBundleName = if (url.path.isNullOrEmpty()) {
    "index"
  } else {
    url.path
      ?.substring(1)
      ?.replace(".bundle", "")
      ?: "index"
  }
  return Pair(debugServerHost, appBundleName)
}
