package expo.modules.appmetrics

import android.app.Application
import expo.modules.appmetrics.appstartup.AppStartupManager
import expo.modules.core.interfaces.ApplicationLifecycleListener

class AppMetricsApplicationLifecycleListeners : ApplicationLifecycleListener {
  override fun onCreate(application: Application) {
    super.onCreate(application)
    AppStartupManager.recordAppCreated(application)
  }
}
