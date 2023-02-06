package abi48_0_0.expo.modules.systemui

import android.content.Context
import abi48_0_0.expo.modules.core.interfaces.Package
import abi48_0_0.expo.modules.core.interfaces.ReactActivityLifecycleListener

class SystemUIPackage : Package {
  override fun createReactActivityLifecycleListeners(activityContext: Context): List<ReactActivityLifecycleListener> {
    return listOf(SystemUIReactActivityLifecycleListener(activityContext))
  }
}
