package expo.modules.appmetrics.sink

import android.util.Log
import expo.modules.appmetrics.BuildConfig
import expo.modules.appmetrics.GlobalAttributes
import expo.modules.appmetrics.TAG
import expo.modules.appmetrics.crashreporting.CrashReport
import expo.modules.appmetrics.records.LogEvent
import expo.modules.appmetrics.records.MetricRecord
import expo.modules.appmetrics.records.NetworkSpan
import java.util.concurrent.atomic.AtomicReference

/**
 * Hands every collected record to the registered `MetricsSink`, with the global attributes merged
 * into metrics and logs. Records emitted while no sink is registered are dropped. Each call runs
 * the sink on the caller's coroutine.
 *
 * For expo-observe. Not a stable API.
 */
class MetricsSinkRegistry internal constructor() {
  private val sink = AtomicReference<MetricsSink?>(null)

  internal fun register(newSink: MetricsSink) {
    val previous = sink.getAndSet(newSink)
    if (BuildConfig.DEBUG && previous != null && previous !== newSink) {
      Log.w(TAG, "Replacing the registered metrics sink")
    }
  }

  internal fun sessionStarted(session: SessionInfo) {
    sink.get()?.sessionStarted(session)
  }

  internal suspend fun sessionEnded(sessionId: String, endTimestamp: String) {
    sink.get()?.sessionEnded(sessionId, endTimestamp)
  }

  internal suspend fun recordMetrics(metrics: List<MetricRecord>, sessionId: String) {
    sink.get()?.recordMetrics(metrics.map { it.withGlobalAttributes() }, sessionId)
  }

  internal suspend fun recordLogs(logs: List<LogEvent>, sessionId: String) {
    sink.get()?.recordLogs(logs.map { it.withGlobalAttributes() }, sessionId)
  }

  internal suspend fun recordSpans(spans: List<NetworkSpan>, sessionId: String) {
    sink.get()?.recordSpans(spans, sessionId)
  }

  internal suspend fun recordCrash(report: CrashReport, log: LogEvent, hint: CrashAttributionHint) {
    sink.get()?.recordCrash(report, log.withGlobalAttributes(), hint)
  }

  companion object {
    internal val shared = MetricsSinkRegistry()

    /**
     * Registers `sink` as the receiver of all records. Registering the same instance again does
     * nothing. A different instance replaces the current one.
     */
    fun register(sink: MetricsSink) {
      shared.register(sink)
    }
  }
}

/** The metric with the global attributes merged into its params. Per-metric keys win. */
private fun MetricRecord.withGlobalAttributes() = copy(params = GlobalAttributes.mergeIntoJsonString(params))

/** The log with the global attributes merged into its attributes. Per-event keys win. */
private fun LogEvent.withGlobalAttributes() = copy(attributes = GlobalAttributes.mergeIntoJsonString(attributes))
