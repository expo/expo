package expo.modules.appmetrics

import android.app.Application
import expo.modules.appmetrics.appstartup.AppStartupManager
import expo.modules.appmetrics.networkrequests.OkHttpClientProviderHook
import expo.modules.core.interfaces.ApplicationLifecycleListener

class AppMetricsApplicationLifecycleListeners : ApplicationLifecycleListener {
  override fun onCreate(application: Application) {
    super.onCreate(application)
    AppStartupManager.recordAppCreated(application)
    // Install the OkHttp factory hook as early as possible - before React Native lazily caches
    // its client. See `OkHttpClientProviderHook` for the race we're trying to win.
    OkHttpClientProviderHook.installIfNeeded()
  }
}
