package expo.modules.systemui

import android.app.Activity
import android.content.Context
import android.os.Build
import android.os.Bundle
import expo.modules.core.interfaces.ReactActivityLifecycleListener
import expo.modules.systemui.singletons.SystemUI
import com.google.android.material.color.DynamicColors


class SystemUIReactActivityLifecycleListener : ReactActivityLifecycleListener {
  override fun onCreate(activity: Activity, savedInstanceState: Bundle?) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      DynamicColors.applyToActivityIfAvailable(activity)
    }
    SystemUI.setUserInterfaceStyle(getUserInterfaceStyle(activity))
  }


  private fun getUserInterfaceStyle(context: Context): String =
    context.getString(R.string.expo_system_ui_user_interface_style).lowercase()
}
