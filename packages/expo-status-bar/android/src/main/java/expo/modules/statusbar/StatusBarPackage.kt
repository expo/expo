package expo.modules.statusbar

import android.content.Context
import expo.modules.core.BasePackage
import expo.modules.core.interfaces.ReactActivityLifecycleListener

class StatusBarPackage : BasePackage() {
  override fun createReactActivityLifecycleListeners(
    activityContext: Context
  ): List<ReactActivityLifecycleListener> {
    return listOf(StatusBarReactActivityLifecycleListener())
  }
}
