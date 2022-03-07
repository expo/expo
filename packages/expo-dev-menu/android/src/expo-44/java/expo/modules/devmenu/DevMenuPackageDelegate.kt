package expo.modules.devmenu

import android.content.Context
import expo.modules.core.interfaces.ReactActivityHandler
import expo.modules.core.interfaces.ReactActivityLifecycleListener

object DevMenuPackageDelegate {
  @JvmField
  var enableAutoSetup: Boolean? = null

  fun createReactActivityLifecycleListeners(activityContext: Context?): List<ReactActivityLifecycleListener> = emptyList()
  fun createReactActivityHandlers(activityContext: Context?): List<ReactActivityHandler> = emptyList()
}
