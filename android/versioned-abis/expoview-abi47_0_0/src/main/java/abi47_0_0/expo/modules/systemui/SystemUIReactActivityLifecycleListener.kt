package abi47_0_0.expo.modules.systemui

import android.app.Activity
import android.content.Context
import android.os.Bundle
import abi47_0_0.expo.modules.core.interfaces.ReactActivityLifecycleListener

import abi47_0_0.host.exp.expoview.R

class SystemUIReactActivityLifecycleListener(activityContext: Context) : ReactActivityLifecycleListener {
  override fun onCreate(activity: Activity, savedInstanceState: Bundle?) {
    SystemUI.setUserInterfaceStyle(getUserInterfaceStyle(activity))
  }

  private fun getUserInterfaceStyle(context: Context): String =
    context.getString(R.string.expo_system_ui_user_interface_style).toLowerCase()
}
