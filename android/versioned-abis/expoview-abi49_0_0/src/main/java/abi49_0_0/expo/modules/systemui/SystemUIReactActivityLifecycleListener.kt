package abi49_0_0.expo.modules.systemui

import android.app.Activity
import android.content.Context
import android.os.Bundle
import abi49_0_0.expo.modules.core.interfaces.ReactActivityLifecycleListener
import abi49_0_0.expo.modules.systemui.singletons.SystemUI

import abi49_0_0.host.exp.expoview.R

class SystemUIReactActivityLifecycleListener(activityContext: Context) : ReactActivityLifecycleListener {
  override fun onCreate(activity: Activity, savedInstanceState: Bundle?) {
    SystemUI.setUserInterfaceStyle(getUserInterfaceStyle(activity))
  }

  private fun getUserInterfaceStyle(context: Context): String =
    context.getString(R.string.expo_system_ui_user_interface_style).lowercase()
}
