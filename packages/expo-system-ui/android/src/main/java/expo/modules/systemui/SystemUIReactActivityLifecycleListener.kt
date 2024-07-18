package expo.modules.systemui

import android.app.Activity
import android.content.Context
import android.os.Bundle
import android.util.Log
import expo.modules.core.AppConfig
import expo.modules.core.interfaces.ReactActivityLifecycleListener
import expo.modules.systemui.singletons.SystemUI
import org.json.JSONObject

class SystemUIReactActivityLifecycleListener : ReactActivityLifecycleListener {
  override fun onCreate(activity: Activity, savedInstanceState: Bundle?) {
    val appConfigString = AppConfig.get(activity);

    if (appConfigString.isNullOrEmpty()) {
      Log.w("ExpoSystemUI", "Unable to read the app config")
    } else {
      val manifest = JSONObject(appConfigString)
      val experiments = manifest.optJSONObject("experiments")
      val edgeToEdge = experiments?.optBoolean("edgeToEdge")

      if (edgeToEdge == true) {
        Log.i("ExpoSystemUI", "Enable edge to edge")
      }
    }

    SystemUI.setUserInterfaceStyle(getUserInterfaceStyle(activity))
  }

  private fun getUserInterfaceStyle(context: Context): String =
    context.getString(R.string.expo_system_ui_user_interface_style).lowercase()
}
