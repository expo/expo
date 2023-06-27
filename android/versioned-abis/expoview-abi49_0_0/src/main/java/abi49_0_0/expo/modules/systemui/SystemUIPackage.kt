package abi49_0_0.expo.modules.systemui

import android.content.Context
import abi49_0_0.expo.modules.core.interfaces.Package
import abi49_0_0.expo.modules.core.interfaces.ReactActivityLifecycleListener

class SystemUIPackage : Package {
  override fun createReactActivityLifecycleListeners(activityContext: Context): List<ReactActivityLifecycleListener> {
    return listOf(SystemUIReactActivityLifecycleListener(activityContext))
  }
}
