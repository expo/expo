package expo.modules.devmenu

import android.content.Context
import expo.modules.core.interfaces.ReactActivityHandler
import expo.modules.core.interfaces.ReactActivityLifecycleListener

object DevMenuPackageDelegate {
  fun createReactActivityLifecycleListeners(activityContext: Context?): List<ReactActivityLifecycleListener> = emptyList()
  fun createReactActivityHandlers(activityContext: Context?): List<ReactActivityHandler> = emptyList()
}
