package expo.modules.observe.shared

import android.util.Log
import java.util.concurrent.atomic.AtomicReference

/**
 * Values that only the host app knows. The host passes them to `AppMetrics.configure` once in
 * `Application.onCreate`, before the main session starts. The defaults describe a host without expo-updates.
 */
internal class AppMetricsHost(
  // Reads the running update.
  val updatesInfo: () -> AppUpdatesInfo = { AppUpdatesInfo.EMPTY },
  // Identifies the install in dispatched telemetry.
  val clientId: () -> String = { "" },
  // The install's stable value in [0, 1) that the sample rates compare against.
  val clientSampleValue: () -> Double = { 0.0 }
)

internal object AppMetrics {
  private val defaultHost = AppMetricsHost()
  private val configuredHost = AtomicReference<AppMetricsHost?>(null)

  /** The host values, or the defaults until `configure` runs. */
  val host: AppMetricsHost
    get() = configuredHost.get() ?: defaultHost

  /** Sets the host values. Call once at launch, before the main session starts. A second call is ignored with a warning. */
  fun configure(host: AppMetricsHost) {
    if (!configuredHost.compareAndSet(null, host)) {
      Log.w(
        TAG,
        "[AppMetrics] Ignoring `configure`: the host values were already set. Call it once at launch, before the main session starts."
      )
    }
  }
}
