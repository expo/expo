package expo.modules.systemui

import android.app.Activity
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.util.Log
import expo.modules.core.interfaces.ReactActivityLifecycleListener
import expo.modules.systemui.singletons.SystemUI
import com.google.android.material.color.DynamicColors


class SystemUIReactActivityLifecycleListener : ReactActivityLifecycleListener {
  override fun onCreate(activity: Activity, savedInstanceState: Bundle?) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      Log.d("EXPO COLORS", "applyToActivityIfAvailable")
      DynamicColors.applyToActivityIfAvailable(activity)
    }
    SystemUI.setUserInterfaceStyle(getUserInterfaceStyle(activity))
    Log.d("EXPO COLORS", activity.resources.getResourceName(getActivityThemeId(activity)))
  }

  fun getActivityThemeId(activity: Activity): Int {
    return try {
      val activityInfo = activity.packageManager.getActivityInfo(
        activity.componentName,
        PackageManager.GET_META_DATA
      )
      activityInfo.theme
    } catch (e: Exception) {
      // Fallback to application theme
      activity.applicationInfo.theme
    }
  }


  private fun getUserInterfaceStyle(context: Context): String =
    context.getString(R.string.expo_system_ui_user_interface_style).lowercase()
}
