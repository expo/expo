package expo.modules.appmetrics.sink

import android.util.Log
import expo.modules.appmetrics.BuildConfig
import expo.modules.appmetrics.GlobalAttributes
import expo.modules.appmetrics.TAG
import expo.modules.appmetrics.crashreporting.CrashReport
import expo.modules.appmetrics.records.LogEvent
import expo.modules.appmetrics.records.MetricRecord
import expo.modules.appmetrics.records.NetworkSpan
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

private const val BUFFER_CAPACITY = 500

/**
 * Hands every collected record to the registered `MetricsSink`, with the global attributes merged
 * into metrics and logs. Each call runs the sink on the caller's coroutine. Records emitted before
 * the first registration wait in a bounded buffer and are replayed, in order, to the first
 * registered sink.
 *
 * For expo-observe. Not a stable API.
 */
class MetricsSinkRegistry internal constructor(
  /** Runs the replay. Owned by the registry by default, so a module teardown cannot cancel it. */
  private val replayScope: CoroutineScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
) {
  private val lock = Any()
  private var sink: MetricsSink? = null

  /** Records that wait for the first sink, and then for the replay to it. */
  private val buffer = ArrayDeque<SinkEvent>()

  /** The first sink, while the buffer replays to it. */
  private var replaySink: MetricsSink? = null
  private var hasWarnedFullBuffer = false

  internal fun register(newSink: MetricsSink) {
    synchronized(lock) {
      val previous = sink
      if (previous === newSink) {
        return
      }
      if (BuildConfig.DEBUG && previous != null) {
        Log.w(TAG, "Replacing the registered metrics sink")
      }
      sink = newSink
      if (previous != null || buffer.isEmpty()) {
        return
      }
      replaySink = newSink
    }
    replayScope.launch { replayBuffer() }
  }

  internal fun sessionStarted(session: SessionInfo) {
    sinkOrBuffer(SinkEvent.SessionStarted(session))?.sessionStarted(session)
  }

  internal suspend fun sessionEnded(sessionId: String, endTimestamp: String) {
    sinkOrBuffer(SinkEvent.SessionEnded(sessionId, endTimestamp))?.sessionEnded(sessionId, endTimestamp)
  }

  internal suspend fun recordMetrics(metrics: List<MetricRecord>, sessionId: String) {
    val merged = metrics.map { it.withGlobalAttributes() }
    sinkOrBuffer(SinkEvent.Metrics(merged, sessionId))?.recordMetrics(merged, sessionId)
  }

  internal suspend fun recordLogs(logs: List<LogEvent>, sessionId: String) {
    val merged = logs.map { it.withGlobalAttributes() }
    sinkOrBuffer(SinkEvent.Logs(merged, sessionId))?.recordLogs(merged, sessionId)
  }

  internal suspend fun recordSpans(spans: List<NetworkSpan>, sessionId: String) {
    sinkOrBuffer(SinkEvent.Spans(spans, sessionId))?.recordSpans(spans, sessionId)
  }

  internal suspend fun recordCrash(report: CrashReport, log: LogEvent, hint: CrashAttributionHint) {
    val merged = log.withGlobalAttributes()
    sinkOrBuffer(SinkEvent.Crash(report, merged, hint))?.recordCrash(report, merged, hint)
  }

  /**
   * The sink to call for `event`. Returns `null` after it appends `event` to the buffer, which
   * happens while no sink is registered or the replay runs, so `event` cannot pass a buffered
   * record.
   */
  private fun sinkOrBuffer(event: SinkEvent): MetricsSink? =
    synchronized(lock) {
      val current = sink
      when {
        current == null -> {
          if (buffer.size < BUFFER_CAPACITY) {
            buffer.addLast(event)
          } else if (BuildConfig.DEBUG && !hasWarnedFullBuffer) {
            hasWarnedFullBuffer = true
            Log.w(TAG, "The metrics sink buffer is full. Dropping new records until a sink registers")
          }
          null
        }
        replaySink != null -> {
          buffer.addLast(event)
          null
        }
        else -> current
      }
    }

  /**
   * Sends the buffered records to the first sink in order, one at a time. Records emitted during
   * the replay join the end of the buffer. The buffer closes once it is empty.
   */
  private suspend fun replayBuffer() {
    while (true) {
      val (event, target) = synchronized(lock) {
        val target = replaySink ?: return
        if (buffer.isEmpty()) {
          replaySink = null
          return
        }
        buffer.removeFirst() to target
      }
      try {
        event.sendTo(target)
      } catch (e: Exception) {
        Log.w(TAG, "Failed to replay a buffered record", e)
      }
    }
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

/** One sink operation, kept until a sink can receive it. */
private sealed interface SinkEvent {
  suspend fun sendTo(sink: MetricsSink)

  data class SessionStarted(val session: SessionInfo) : SinkEvent {
    override suspend fun sendTo(sink: MetricsSink) = sink.sessionStarted(session)
  }

  data class SessionEnded(val sessionId: String, val endTimestamp: String) : SinkEvent {
    override suspend fun sendTo(sink: MetricsSink) = sink.sessionEnded(sessionId, endTimestamp)
  }

  data class Metrics(val metrics: List<MetricRecord>, val sessionId: String) : SinkEvent {
    override suspend fun sendTo(sink: MetricsSink) = sink.recordMetrics(metrics, sessionId)
  }

  data class Logs(val logs: List<LogEvent>, val sessionId: String) : SinkEvent {
    override suspend fun sendTo(sink: MetricsSink) = sink.recordLogs(logs, sessionId)
  }

  data class Spans(val spans: List<NetworkSpan>, val sessionId: String) : SinkEvent {
    override suspend fun sendTo(sink: MetricsSink) = sink.recordSpans(spans, sessionId)
  }

  data class Crash(val report: CrashReport, val log: LogEvent, val hint: CrashAttributionHint) : SinkEvent {
    override suspend fun sendTo(sink: MetricsSink) = sink.recordCrash(report, log, hint)
  }
}

/** The metric with the global attributes merged into its params. Per-metric keys win. */
private fun MetricRecord.withGlobalAttributes() = copy(params = GlobalAttributes.mergeIntoJsonString(params))

/** The log with the global attributes merged into its attributes. Per-event keys win. */
private fun LogEvent.withGlobalAttributes() = copy(attributes = GlobalAttributes.mergeIntoJsonString(attributes))
