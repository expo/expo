package expo.modules.appmetrics.sink

import expo.modules.appmetrics.crashreporting.CrashReport
import expo.modules.appmetrics.records.LogEvent
import expo.modules.appmetrics.records.MetricRecord
import expo.modules.appmetrics.records.NetworkSpan

/**
 * Receives every record that expo-app-metrics collects. Register an implementation with
 * `MetricsSinkRegistry.register`. `recordSpans` and `recordCrash` must not throw, except
 * `CancellationException`.
 *
 * For expo-observe. Not a stable API.
 */
interface MetricsSink {
  /**
   * Not suspending, so a session can start from any thread. The sink orders the later records
   * of this session after it.
   */
  fun sessionStarted(session: SessionInfo)

  suspend fun sessionEnded(sessionId: String, endTimestamp: String)

  suspend fun recordMetrics(metrics: List<MetricRecord>, sessionId: String)

  suspend fun recordLogs(logs: List<LogEvent>, sessionId: String)

  suspend fun recordSpans(spans: List<NetworkSpan>, sessionId: String)

  /** A crash from a previous launch. The sink attributes it to a session with `hint`. */
  suspend fun recordCrash(report: CrashReport, log: LogEvent, hint: CrashAttributionHint)
}
