package expo.modules.developmentclient.react

import android.content.Context
import android.util.Log
import com.facebook.react.ReactNativeHost

fun injectDebugServerHost(context: Context, reactNativeHost: ReactNativeHost, debugServerHost: String): Boolean {
  return try {
    val instanceManager = reactNativeHost.reactInstanceManager
    val settings = DevelopmentClientInternalSettings(context, debugServerHost)
    val devSupportManager = instanceManager.devSupportManager
    val devSupportManagerBaseClass: Class<*>? = devSupportManager.javaClass.superclass
    val mDevSettingsField = devSupportManagerBaseClass!!.getDeclaredField("mDevSettings")
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
    Log.e("ExpoDevelopmentClient", "Unable to inject debug server host settings.", e)
    false
  }
}
