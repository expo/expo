package expo.modules.appmetrics

import android.app.Activity
import expo.modules.appmetrics.appstartup.AppStartupManager
import expo.modules.core.interfaces.ReactActivityLifecycleListener

class AppMetricsActivityLifecycleListeners : ReactActivityLifecycleListener {
  override fun onResume(activity: Activity) {
    super.onResume(activity)
    // Native loading should be finished by this time
    AppStartupManager.markLoadedIfNeeded(activity)
  }

  override fun onPause(activity: Activity) {
    super.onPause(activity)
    AppStartupManager.markEnteredBackground(activity)
  }
}
