package expo.modules.observe

import android.app.Activity
import expo.modules.core.interfaces.ReactActivityLifecycleListener
import expo.modules.observe.shared.appstartup.AppStartupManager
import expo.modules.observe.shared.appstartup.StartupState

internal class AppMetricsActivityLifecycleListeners : ReactActivityLifecycleListener {
  override fun onResume(activity: Activity) {
    super.onResume(activity)
    // Native loading should be finished by this time
    AppStartupManager.markLoadedIfNeeded(activity)
  }

  override fun onPause(activity: Activity) {
    super.onPause(activity)
    if (AppStartupManager.startupState == StartupState.LAUNCHING) {
      AppStartupManager.startupState = StartupState.INTERRUPTED
    }
  }
}
