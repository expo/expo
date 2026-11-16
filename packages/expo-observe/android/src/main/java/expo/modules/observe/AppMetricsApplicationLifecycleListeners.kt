package expo.modules.observe

import android.app.Application
import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarkerConstants
import expo.modules.core.interfaces.ApplicationLifecycleListener
import expo.modules.easclient.EASClientID
import expo.modules.observe.networkrequests.OkHttpClientProviderHook
import expo.modules.observe.shared.AppMetrics
import expo.modules.observe.shared.AppMetricsHost
import expo.modules.observe.shared.appstartup.AppStartupManager
import expo.modules.observe.shared.crashreporting.CrashFileWriter
import expo.modules.observe.shared.crashreporting.JvmCrashHandler

internal class AppMetricsApplicationLifecycleListeners : ApplicationLifecycleListener {
  override fun onCreate(application: Application) {
    super.onCreate(application)
    // Set before the main session starts: the session reads these values when it builds its row.
    val clientId = EASClientID(application).uuid
    AppMetrics.configure(
      AppMetricsHost(
        updatesInfo = ::expoUpdatesInfo,
        clientId = clientId.toString(),
        clientSampleValue = EASClientID.deterministicUniformValue(clientId),
        isDebugBuild = BuildConfig.DEBUG
      )
    )
    ReactMarker.addListener { name, _, _ ->
      when (name) {
        ReactMarkerConstants.RUN_JS_BUNDLE_START -> AppStartupManager.markBundleLoadStart()
        ReactMarkerConstants.RUN_JS_BUNDLE_END -> AppStartupManager.markBundleLoadEnd()
        else -> {}
      }
    }
    AppStartupManager.recordAppCreated(application)
    // Crash capture starts at process start, not at module creation: the module
    // system spins up lazily (when JS first touches a module), and a crash
    // during startup would otherwise be missed entirely. The session id is null
    // until the module creates its main session (see `JvmCrashHandler.currentSessionId`),
    // so a crash before then is captured as an orphan rather than misattributed.
    JvmCrashHandler.install(CrashFileWriter.forContext(application))
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
