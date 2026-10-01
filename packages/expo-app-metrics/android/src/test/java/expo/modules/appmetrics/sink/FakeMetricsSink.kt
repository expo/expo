package expo.modules.appmetrics.sink

import expo.modules.appmetrics.crashreporting.CrashReport
import expo.modules.appmetrics.records.LogEvent
import expo.modules.appmetrics.records.MetricRecord
import expo.modules.appmetrics.records.NetworkSpan
import java.util.Collections

/**
 * Records every call in order. `beforeWrite` runs at the start of each suspending operation, so a
 * test can suspend or cancel the caller mid-write.
 */
class FakeMetricsSink(
  private val beforeWrite: suspend () -> Unit = {}
) : MetricsSink {
  sealed interface Call

  data class SessionStarted(val session: SessionInfo) : Call

  data class SessionEnded(val sessionId: String, val endTimestamp: String) : Call

  data class Metrics(val metrics: List<MetricRecord>, val sessionId: String) : Call

  data class Logs(val logs: List<LogEvent>, val sessionId: String) : Call

  data class Spans(val spans: List<NetworkSpan>, val sessionId: String) : Call

  data class Crash(val report: CrashReport, val log: LogEvent, val hint: CrashAttributionHint) : Call

  private val recorded = Collections.synchronizedList(mutableListOf<Call>())

  val calls: List<Call>
    get() = synchronized(recorded) { recorded.toList() }

  override fun sessionStarted(session: SessionInfo) {
    recorded.add(SessionStarted(session))
  }

  override suspend fun sessionEnded(sessionId: String, endTimestamp: String) {
    beforeWrite()
    recorded.add(SessionEnded(sessionId, endTimestamp))
  }

  override suspend fun recordMetrics(metrics: List<MetricRecord>, sessionId: String) {
    beforeWrite()
    recorded.add(Metrics(metrics, sessionId))
  }

  override suspend fun recordLogs(logs: List<LogEvent>, sessionId: String) {
    beforeWrite()
    recorded.add(Logs(logs, sessionId))
  }

  override suspend fun recordSpans(spans: List<NetworkSpan>, sessionId: String) {
    beforeWrite()
    recorded.add(Spans(spans, sessionId))
  }

  override suspend fun recordCrash(report: CrashReport, log: LogEvent, hint: CrashAttributionHint) {
    beforeWrite()
    recorded.add(Crash(report, log, hint))
  }
}
