package expo.modules.devlauncher.helpers

import android.content.Context
import android.util.Log
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import expo.modules.devlauncher.react.DevLauncherInternalSettings

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
    true
  } catch (e: Exception) {
    Log.e("DevLauncher", "Unable to inject debug server host settings.", e)
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
