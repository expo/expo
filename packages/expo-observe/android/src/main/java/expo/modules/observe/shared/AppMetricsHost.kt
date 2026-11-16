package expo.modules.observe.shared

import android.util.Log
import expo.modules.observe.shared.utils.WriteOnce

/**
 * Values that only the host app knows. The host passes them to `AppMetrics.configure` once in
 * `Application.onCreate`, before the main session starts. The defaults describe a host without expo-updates.
 */
internal class AppMetricsHost(
  // Reads the running update. Called when the app metadata is first built and when the main session starts.
  val updatesInfo: () -> AppUpdatesInfo = { AppUpdatesInfo(updateId = null, runtimeVersion = null, requestHeaders = null) },
  // Identifies the install in dispatched telemetry.
  val clientId: String = "",
  // The install's stable value in [0, 1) that the sample rates compare against.
  val clientSampleValue: Double = 0.0,
  // Treats the app as a development build when deciding whether to dispatch.
  val isDebugBuild: Boolean = false
)

internal object AppMetrics {
  private val hostValue = WriteOnce(AppMetricsHost())

  /** The host values, or the defaults until `configure` runs. */
  val host: AppMetricsHost
    get() = hostValue.value

  /** Whether `configure` ran. */
  val isConfigured: Boolean
    get() = hostValue.isSet

  /** Sets the host values. Call once at launch, before the main session starts. A second call is ignored with a warning. */
  fun configure(host: AppMetricsHost) {
    if (!hostValue.set(host)) {
      Log.w(
        TAG,
        "[AppMetrics] Ignoring `configure`: the host values were already set. Call it once at launch, before the main session starts."
      )
    }
  }
}
