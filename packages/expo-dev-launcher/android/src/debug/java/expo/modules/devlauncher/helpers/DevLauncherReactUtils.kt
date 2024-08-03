package expo.modules.devlauncher.helpers

import android.content.Context
import android.net.Uri
import android.util.Log
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.defaults.DefaultReactHostDelegate
import com.facebook.react.devsupport.DevLauncherDevServerHelper
import com.facebook.react.devsupport.DevLauncherSettings
import com.facebook.react.devsupport.DevServerHelper
import com.facebook.react.devsupport.DevSupportManagerBase
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.modules.systeminfo.AndroidInfoHelpers
import com.facebook.react.runtime.ReactHostDelegate
import com.facebook.react.runtime.ReactHostImpl
import expo.interfaces.devmenu.ReactHostWrapper
import expo.modules.devlauncher.launcher.DevLauncherControllerInterface
import expo.modules.devlauncher.react.DevLauncherDevSupportManagerSwapper
import expo.modules.devlauncher.rncompatibility.DevLauncherBridgeDevSupportManager
import expo.modules.devlauncher.rncompatibility.DevLauncherBridgelessDevSupportManager
import expo.modules.devmenu.helpers.setPrivateDeclaredFieldValue
import okhttp3.HttpUrl

// Sync this class name with ExpoReactHostFactory.kt
private const val EXPO_REACT_HOST_DELEGATE_CLASS = "expo.modules.ExpoReactHostFactory.ExpoReactHostDelegate"

fun injectReactInterceptor(
  context: Context,
  reactHost: ReactHostWrapper,
  url: Uri
): Boolean {
  val (debugServerHost, appBundleName) = parseUrl(url)

  injectDevSupportManager(reactHost)

  val result = injectDebugServerHost(
    context,
    reactHost,
    debugServerHost,
    appBundleName
  )
  if (reactHost.isBridgelessMode) {
    (reactHost.devSupportManager as? DevLauncherBridgelessDevSupportManager)?.startInspectorWhenDevLauncherReady()
  } else {
    (reactHost.devSupportManager as? DevLauncherBridgeDevSupportManager)?.startInspectorWhenDevLauncherReady()
  }
  return result
}

private fun injectDevSupportManager(reactHost: ReactHostWrapper) {
  DevLauncherDevSupportManagerSwapper().swapDevSupportManagerImpl(reactHost)
}

fun injectDebugServerHost(
  context: Context,
  reactHost: ReactHostWrapper,
  debugServerHost: String,
  appBundleName: String
): Boolean {
  return if (reactHost.isBridgelessMode) {
    injectDebugServerHost(context, reactHost.reactHost, debugServerHost, appBundleName)
  } else {
    injectDebugServerHost(context, reactHost.reactNativeHost, debugServerHost, appBundleName)
  }
}

fun injectDebugServerHost(
  context: Context,
  reactNativeHost: ReactNativeHost,
  debugServerHost: String,
  appBundleName: String
): Boolean {
  return try {
    val instanceManager = reactNativeHost.reactInstanceManager
    val devSupportManager = instanceManager.devSupportManager
    injectDebugServerHost(context, devSupportManager, debugServerHost, appBundleName)

    // set useDeveloperSupport to true in case it was previously set to false from loading a published app
    val mUseDeveloperSupportField = instanceManager.javaClass.getDeclaredField("mUseDeveloperSupport")
    mUseDeveloperSupportField.isAccessible = true
    mUseDeveloperSupportField[instanceManager] = true
    true
  } catch (e: Exception) {
    Log.e("DevLauncher", "Unable to inject debug server host settings.", e)
    false
  }
}

fun injectDebugServerHost(
  context: Context,
  reactHost: ReactHost,
  debugServerHost: String,
  appBundleName: String
): Boolean {
  return try {
    val devSupportManager = requireNotNull(reactHost.devSupportManager)
    injectDebugServerHost(context, devSupportManager, debugServerHost, appBundleName)
    true
  } catch (e: Exception) {
    Log.e("DevLauncher", "Unable to inject debug server host settings.", e)
    false
  }
}

private fun injectDebugServerHost(
  context: Context,
  devSupportManager: DevSupportManager,
  debugServerHost: String,
  appBundleName: String
) {
  val settings = DevLauncherSettings(context, debugServerHost)
  val devSupportManagerBaseClass: Class<*> = DevSupportManagerBase::class.java
  devSupportManagerBaseClass.setProtectedDeclaredField(
    devSupportManager,
    "mJSAppBundleName",
    appBundleName
  )
  val mDevSettingsField = devSupportManagerBaseClass.getDeclaredField("mDevSettings")
  mDevSettingsField.isAccessible = true
  mDevSettingsField[devSupportManager] = settings
  val mDevServerHelperField = devSupportManagerBaseClass.getDeclaredField("mDevServerHelper")
  mDevServerHelperField.isAccessible = true
  val devServerHelper = mDevServerHelperField[devSupportManager]
  check(devServerHelper is DevLauncherDevServerHelper)
  val mSettingsField = DevServerHelper::class.java.getDeclaredField("mSettings")
  mSettingsField.isAccessible = true
  mSettingsField[devServerHelper] = settings

  val packagerConnectionSettingsField = DevServerHelper::class.java.getDeclaredField("mPackagerConnectionSettings")
  packagerConnectionSettingsField.isAccessible = true
  packagerConnectionSettingsField[devServerHelper] = settings.public_getPackagerConnectionSettings()
}

fun injectLocalBundleLoader(
  reactHost: ReactHostWrapper,
  bundlePath: String
): Boolean {
  return if (reactHost.isBridgelessMode) {
    injectLocalBundleLoader(reactHost.reactHost, bundlePath)
  } else {
    injectLocalBundleLoader(reactHost.reactNativeHost, bundlePath)
  }
}

private fun injectLocalBundleLoader(
  reactNativeHost: ReactNativeHost,
  bundlePath: String
): Boolean {
  return try {
    val instanceManager = reactNativeHost.reactInstanceManager
    val instanceManagerClass = instanceManager.javaClass

    val jsBundleLoader = JSBundleLoader.createFileLoader(bundlePath)
    val mBundleLoaderField = instanceManagerClass.getDeclaredField("mBundleLoader")
    mBundleLoaderField.isAccessible = true
    mBundleLoaderField[instanceManager] = jsBundleLoader

    val mUseDeveloperSupportField = instanceManagerClass.getDeclaredField("mUseDeveloperSupport")
    mUseDeveloperSupportField.isAccessible = true
    mUseDeveloperSupportField[instanceManager] = false
    true
  } catch (e: Exception) {
    Log.e("DevLauncher", "Unable to load local bundle file", e)
    false
  }
}

@OptIn(UnstableReactNativeAPI::class)
private fun injectLocalBundleLoader(
  reactHost: ReactHost,
  bundlePath: String
): Boolean {
  return try {
    check(reactHost is ReactHostImpl)

    // [0] Disable `mAllowPackagerServerAccess`
    // so that ReactHost could use jsBundlerLoader from ReactHostDelegate
    val reactHostClass = ReactHostImpl::class.java
    val mAllowPackagerServerAccessField = reactHostClass.getDeclaredField("mAllowPackagerServerAccess")
    mAllowPackagerServerAccessField.isAccessible = true
    mAllowPackagerServerAccessField[reactHost] = false

    val newJsBundleLoader = JSBundleLoader.createFileLoader(bundlePath)

    // [1] Replace the ReactHostDelegate.jsBundlerLoader with our new loader
    val mReactHostDelegateField = reactHostClass.getDeclaredField("mReactHostDelegate")
    mReactHostDelegateField.isAccessible = true
    val reactHostDelegate = mReactHostDelegateField[reactHost] as ReactHostDelegate
    if (reactHostDelegate.javaClass.canonicalName == EXPO_REACT_HOST_DELEGATE_CLASS) {
      reactHostDelegate.javaClass.setPrivateDeclaredFieldValue(
        "_jsBundleLoader",
        reactHostDelegate,
        newJsBundleLoader
      )
    } else if (reactHostDelegate is DefaultReactHostDelegate) {
      DefaultReactHostDelegate::class.java.setPrivateDeclaredFieldValue(
        "jsBundleLoader",
        reactHostDelegate,
        newJsBundleLoader
      )
    } else {
      throw IllegalStateException("[injectLocalBundleLoader] Unsupported reactHostDelegate: ${reactHostDelegate.javaClass}")
    }

    true
  } catch (e: Exception) {
    Log.e("DevLauncher", "Unable to load local bundle file", e)
    false
  }
}

fun injectDevServerHelper(context: Context, devSupportManager: DevSupportManager, controller: DevLauncherControllerInterface?) {
  val defaultServerHost = AndroidInfoHelpers.getServerHost(context)
  val devSettings = DevLauncherSettings(context, defaultServerHost)
  val devLauncherDevServerHelper = DevLauncherDevServerHelper(
    context = context,
    controller = controller,
    devSettings = devSettings,
    packagerConnection = devSettings.public_getPackagerConnectionSettings()
  )
  DevSupportManagerBase::class.java.setProtectedDeclaredField(
    devSupportManager,
    "mDevServerHelper",
    devLauncherDevServerHelper
  )
}

fun findDevMenuPackage(): ReactPackage? {
  return try {
    val clazz = Class.forName("expo.modules.devmenu.DevMenuPackage")
    clazz.newInstance() as? ReactPackage
  } catch (e: Exception) {
    null
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
