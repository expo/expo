package expo.modules.appmetrics

import android.app.Application
import expo.modules.appmetrics.appstartup.AppStartupManager
import expo.modules.appmetrics.crashreporting.CrashFileWriter
import expo.modules.appmetrics.crashreporting.JvmCrashHandler
import expo.modules.appmetrics.networkrequests.OkHttpClientProviderHook
import expo.modules.core.interfaces.ApplicationLifecycleListener

class AppMetricsApplicationLifecycleListeners : ApplicationLifecycleListener {
  override fun onCreate(application: Application) {
    super.onCreate(application)
    AppStartupManager.recordAppCreated(application)
    // Crash capture starts at process start, not at module creation: the module
    // system spins up lazily (when JS first touches a module), and a crash
    // during startup would otherwise be missed entirely. The session id is null
    // until the module creates its main session (see `JvmCrashHandler.currentSessionId`),
    // so a crash before then is captured as an orphan rather than misattributed.
    JvmCrashHandler.install(CrashFileWriter.forContext(application).also { it.prepare() })
    // Install the OkHttp factory hook as early as possible - before React Native lazily caches
    // its client. See `OkHttpClientProviderHook` for the race we're trying to win.
    //
    // `Application.onCreate` runs once per process. When Android keeps the process alive across
    // activity recreations (see expo/expo#44879), this method isn't called again - but it doesn't
    // need to be: `OkHttpClientProvider.factory` and `.client` are both process-scope statics, so
    // the previous install survives and RN's next `getOkHttpClient()` still returns a client with
    // our interceptor.
    OkHttpClientProviderHook.installIfNeeded()
  }
}
