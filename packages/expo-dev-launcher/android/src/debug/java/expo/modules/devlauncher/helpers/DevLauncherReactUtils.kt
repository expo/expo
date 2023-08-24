package expo.modules.devlauncher.helpers

import android.content.Context
import android.net.Uri
import android.util.Log
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.devsupport.DevLauncherInternalSettings
import expo.interfaces.devmenu.annotations.ContainsDevMenuExtension
import expo.modules.devlauncher.react.DevLauncherDevSupportManagerSwapper
import expo.modules.devlauncher.rncompatibility.DevLauncherDevSupportManager
import okhttp3.HttpUrl

fun injectReactInterceptor(
  context: Context,
  reactNativeHost: ReactNativeHost,
  url: Uri
): Boolean {
  val port = if (url.port != -1) url.port else HttpUrl.defaultPort(url.scheme)
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

  injectDevSupportManager(reactNativeHost)

  val result = injectDebugServerHost(
    context,
    reactNativeHost,
    debugServerHost,
    appBundleName
  )
  (reactNativeHost.reactInstanceManager.devSupportManager as? DevLauncherDevSupportManager)?.startInspectorWhenDevLauncherReady()

  return result
}

fun injectDevSupportManager(
  reactNativeHost: ReactNativeHost
) {
  DevLauncherDevSupportManagerSwapper()
    .swapDevSupportManagerImpl(reactNativeHost.reactInstanceManager)
}

fun injectDebugServerHost(
  context: Context,
  reactNativeHost: ReactNativeHost,
  debugServerHost: String,
  appBundleName: String
): Boolean {
  return try {
    val instanceManager = reactNativeHost.reactInstanceManager
    val settings = DevLauncherInternalSettings(context, debugServerHost)
    val devSupportManager = instanceManager.devSupportManager
    val devSupportManagerBaseClass: Class<*>? = devSupportManager.javaClass.superclass
    devSupportManagerBaseClass!!.setProtectedDeclaredField(
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
    val mSettingsField = devServerHelper.javaClass.getDeclaredField("mSettings")
    mSettingsField.isAccessible = true
    mSettingsField[devServerHelper] = settings
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

fun injectLocalBundleLoader(
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

fun findDevMenuPackage(): ReactPackage? {
  return try {
    val clazz = Class.forName("expo.modules.devmenu.DevMenuPackage")
    clazz.newInstance() as? ReactPackage
  } catch (e: Exception) {
    null
  }
}

fun findPackagesWithDevMenuExtension(reactNativeHost: ReactNativeHost): List<ReactPackage> {
  return try {
    val clazz = Class.forName("com.facebook.react.PackageList")
    val ctor = clazz.getConstructor(ReactNativeHost::class.java)
    val packageList = ctor.newInstance(reactNativeHost)

    val getPackagesMethod = packageList.javaClass.getDeclaredMethod("getPackages")
    val packages = getPackagesMethod.invoke(packageList) as List<*>
    return packages
      .filterIsInstance<ReactPackage>()
      .filter {
        it.javaClass.isAnnotationPresent(ContainsDevMenuExtension::class.java)
      }
  } catch (e: Exception) {
    Log.e("DevLauncher", "Unable find packages with dev menu extension.`.", e)
    emptyList()
  }
}
