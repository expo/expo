package expo.modules.systemui

import android.app.Activity
import android.content.Context
import android.os.Bundle
import expo.modules.core.interfaces.ReactActivityLifecycleListener
import expo.modules.systemui.singletons.SystemUI

// EXPO_VERSIONING_NEEDS_PACKAGE_R

class SystemUIReactActivityLifecycleListener(activityContext: Context) : ReactActivityLifecycleListener {
  override fun onCreate(activity: Activity, savedInstanceState: Bundle?) {
    SystemUI.setUserInterfaceStyle(getUserInterfaceStyle(activity))
  }

  private fun getUserInterfaceStyle(context: Context): String =
    context.getString(R.string.expo_system_ui_user_interface_style).lowercase()
}
