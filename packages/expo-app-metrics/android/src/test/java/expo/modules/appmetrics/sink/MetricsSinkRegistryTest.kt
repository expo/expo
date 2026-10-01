package expo.modules.appmetrics.sink

import expo.modules.appmetrics.GlobalAttributes
import expo.modules.appmetrics.TAG
import expo.modules.appmetrics.crashreporting.CrashOrigin
import expo.modules.appmetrics.crashreporting.CrashReport
import expo.modules.appmetrics.records.LogEvent
import expo.modules.appmetrics.records.MetricRecord
import expo.modules.appmetrics.records.NetworkSpan
import expo.modules.appmetrics.utils.JsonAny
import java.util.concurrent.atomic.AtomicBoolean
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.job
import kotlinx.coroutines.joinAll
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeout
import kotlinx.coroutines.yield
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertSame
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.shadows.ShadowLog

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class MetricsSinkRegistryTest {
  private val replayScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
  private val registry = MetricsSinkRegistry(replayScope)
  private val sink = FakeMetricsSink()
  private val session = SessionInfo(id = "s", type = "main", startTimestamp = "2025-01-01T00:00:00.000Z", metadata = null)
  private val hint = CrashAttributionHint(sessionId = null, origin = CrashOrigin.EXIT_RECORD, currentSessionId = "s")

  @Before
  fun setUp() {
    GlobalAttributes.set(null)
    ShadowLog.clear()
  }

  @After
  fun tearDown() {
    GlobalAttributes.set(null)
  }

  // region Delivery

  @Test
  fun `delivers every operation to the registered sink in order`() =
    runBlocking {
      registry.register(sink)
      val metric = metric()
      val log = log()
      val span = span()
      val report = report()

      registry.sessionStarted(session)
      registry.recordMetrics(listOf(metric), "s")
      registry.recordLogs(listOf(log), "s")
      registry.recordSpans(listOf(span), "s")
      registry.recordCrash(report, log, hint)
      registry.sessionEnded("s", "2025-01-01T00:01:00.000Z")

      assertEquals(
        listOf(
          FakeMetricsSink.SessionStarted(session),
          FakeMetricsSink.Metrics(listOf(metric), "s"),
          FakeMetricsSink.Logs(listOf(log), "s"),
          FakeMetricsSink.Spans(listOf(span), "s"),
          FakeMetricsSink.Crash(report, log, hint),
          FakeMetricsSink.SessionEnded("s", "2025-01-01T00:01:00.000Z")
        ),
        sink.calls
      )
    }

  @Test
  fun `rethrows a sink error to the caller`() {
    registry.register(FakeMetricsSink(beforeWrite = { throw IllegalStateException("disk full") }))

    val error = assertThrows(IllegalStateException::class.java) {
      runBlocking { registry.recordMetrics(listOf(metric()), "s") }
    }
    assertEquals("disk full", error.message)
  }

  @Test
  fun `registering the same instance again keeps it without a warning`() =
    runBlocking {
      registry.register(sink)
      registry.register(sink)
      registry.sessionStarted(session)

      assertEquals(listOf(FakeMetricsSink.SessionStarted(session)), sink.calls)
      assertTrue(replacementWarnings().isEmpty())
    }

  @Test
  fun `registering a different instance replaces the sink and warns`() =
    runBlocking {
      val replacement = FakeMetricsSink()
      registry.register(sink)
      registry.register(replacement)
      registry.sessionStarted(session)

      assertTrue(sink.calls.isEmpty())
      assertEquals(listOf(FakeMetricsSink.SessionStarted(session)), replacement.calls)
      assertEquals(1, replacementWarnings().size)
    }

  // endregion

  // region Startup buffer

  @Test
  fun `replays records emitted before registration to the first sink in order`() =
    runBlocking {
      val metric = metric()
      registry.sessionStarted(session)
      registry.recordMetrics(listOf(metric), "s")
      registry.sessionEnded("s", "2025-01-01T00:01:00.000Z")

      registry.register(sink)
      awaitReplay()

      assertEquals(
        listOf(
          FakeMetricsSink.SessionStarted(session),
          FakeMetricsSink.Metrics(listOf(metric), "s"),
          FakeMetricsSink.SessionEnded("s", "2025-01-01T00:01:00.000Z")
        ),
        sink.calls
      )
    }

  @Test
  fun `merges globals before a record is buffered`() =
    runBlocking {
      GlobalAttributes.set(mapOf("subscription_tier" to "pro"))
      registry.recordLogs(listOf(log()), "s")
      GlobalAttributes.set(mapOf("subscription_tier" to "free"))

      registry.register(sink)
      awaitReplay()

      val logs = sink.calls.filterIsInstance<FakeMetricsSink.Logs>().flatMap { it.logs }
      assertEquals(mapOf("subscription_tier" to "pro"), decode(logs.single().attributes))
    }

  @Test
  fun `records emitted after registration skip the buffer`() =
    runBlocking {
      registry.register(sink)
      registry.recordMetrics(listOf(metric()), "s")

      assertEquals(1, sink.calls.size)
    }

  @Test
  fun `a record emitted during the replay goes after the buffered records`() =
    runBlocking {
      val replayStarted = CompletableDeferred<Unit>()
      val releaseReplay = CompletableDeferred<Unit>()
      val blockingSink = FakeMetricsSink(beforeWrite = {
        if (replayStarted.complete(Unit)) {
          releaseReplay.await()
        }
      })
      registry.recordLogs(listOf(log(name = "first")), "s")
      registry.recordLogs(listOf(log(name = "second")), "s")

      registry.register(blockingSink)
      withTimeout(5_000) { replayStarted.await() }
      registry.recordLogs(listOf(log(name = "third")), "s")
      assertTrue(blockingSink.calls.isEmpty())
      releaseReplay.complete(Unit)

      assertEquals(listOf("first", "second", "third"), logNames(awaitCalls(blockingSink, 3)))
    }

  @Test
  fun `keeps the first 500 buffered records, drops the rest, and warns once`() =
    runBlocking {
      for (index in 0..501) {
        registry.recordLogs(listOf(log(name = "$index")), "s")
      }

      registry.register(sink)
      awaitReplay()

      assertEquals((0 until 500).map { "$it" }, logNames(sink.calls))
      assertEquals(1, ShadowLog.getLogsForTag(TAG).count { it.msg.startsWith("The metrics sink buffer is full") })
    }

  @Test
  fun `keeps replaying after the sink throws`() =
    runBlocking {
      val failedOnce = AtomicBoolean(false)
      val failingSink = FakeMetricsSink(beforeWrite = {
        if (failedOnce.compareAndSet(false, true)) {
          throw IllegalStateException("disk full")
        }
      })
      registry.recordLogs(listOf(log(name = "first")), "s")
      registry.recordLogs(listOf(log(name = "second")), "s")

      registry.register(failingSink)
      awaitReplay()

      assertEquals(listOf("second"), logNames(failingSink.calls))
    }

  @Test
  fun `the buffer stays closed after the first registration`() =
    runBlocking {
      registry.recordLogs(listOf(log(name = "buffered")), "s")
      registry.register(sink)
      awaitReplay()

      val second = FakeMetricsSink()
      registry.register(second)
      registry.recordLogs(listOf(log(name = "live")), "s")

      assertEquals(listOf("buffered"), logNames(sink.calls))
      assertEquals(listOf("live"), logNames(second.calls))
    }

  @Test
  fun `every record emitted while register runs arrives once and in order per session`() =
    runBlocking {
      val slowSink = FakeMetricsSink(beforeWrite = { yield() })
      val sessions = (0 until 8).map { "s$it" }
      for (sessionId in sessions) {
        registry.recordLogs(listOf(log(name = "0")), sessionId)
      }

      coroutineScope {
        for (sessionId in sessions) {
          launch(Dispatchers.Default) {
            for (index in 1..50) {
              registry.recordLogs(listOf(log(name = "$index")), sessionId)
            }
          }
        }
        launch(Dispatchers.Default) { registry.register(slowSink) }
      }

      val calls = awaitCalls(slowSink, sessions.size * 51).filterIsInstance<FakeMetricsSink.Logs>()
      assertEquals(sessions.size * 51, calls.size)
      for (sessionId in sessions) {
        assertEquals((0..50).map { "$it" }, calls.filter { it.sessionId == sessionId }.flatMap { it.logs }.map { it.name })
      }
    }

  // endregion

  // region Global attributes

  @Test
  fun `passes metric params through unchanged when globals are empty`() =
    runBlocking {
      registry.register(sink)
      registry.recordMetrics(listOf(metric(params = mapOf("screen" to "home")), metric(params = null)), "s")

      val metrics = recordedMetrics()
      assertEquals(mapOf("screen" to "home"), decode(metrics[0].params))
      assertNull(metrics[1].params)
    }

  @Test
  fun `merges globals into metric params and per-metric keys win`() =
    runBlocking {
      GlobalAttributes.set(mapOf("subscription_tier" to "pro", "screen" to "global_default"))
      registry.register(sink)
      registry.recordMetrics(listOf(metric(params = mapOf("screen" to "checkout")), metric(params = null)), "s")

      val metrics = recordedMetrics()
      assertEquals(mapOf("subscription_tier" to "pro", "screen" to "checkout"), decode(metrics[0].params))
      assertEquals(mapOf("subscription_tier" to "pro", "screen" to "global_default"), decode(metrics[1].params))
    }

  @Test
  fun `passes log attributes through unchanged when globals are empty`() =
    runBlocking {
      registry.register(sink)
      registry.recordLogs(listOf(log(attributes = mapOf("userId" to "u_42")), log(attributes = null)), "s")

      val logs = recordedLogs()
      assertEquals(mapOf("userId" to "u_42"), decode(logs[0].attributes))
      assertNull(logs[1].attributes)
    }

  @Test
  fun `merges globals into log attributes and per-event keys win`() =
    runBlocking {
      GlobalAttributes.set(mapOf("subscription_tier" to "pro", "screen" to "global"))
      registry.register(sink)
      registry.recordLogs(listOf(log(attributes = mapOf("screen" to "checkout")), log(attributes = null)), "s")

      val logs = recordedLogs()
      assertEquals(mapOf("subscription_tier" to "pro", "screen" to "checkout"), decode(logs[0].attributes))
      assertEquals(mapOf("subscription_tier" to "pro", "screen" to "global"), decode(logs[1].attributes))
    }

  @Test
  fun `preserves unparseable params and attributes verbatim`() =
    runBlocking {
      GlobalAttributes.set(mapOf("subscription_tier" to "pro"))
      registry.register(sink)
      registry.recordMetrics(listOf(metric().copy(params = "not json")), "s")
      registry.recordLogs(listOf(log().copy(attributes = "not json")), "s")

      assertEquals("not json", recordedMetrics().single().params)
      assertEquals("not json", recordedLogs().single().attributes)
    }

  @Test
  fun `merges globals into the crash log`() =
    runBlocking {
      GlobalAttributes.set(mapOf("subscription_tier" to "pro"))
      registry.register(sink)
      val report = report()
      registry.recordCrash(report, log(attributes = mapOf("userId" to "u_42")), hint)

      val crash = sink.calls.single() as FakeMetricsSink.Crash
      assertSame(report, crash.report)
      assertEquals(hint, crash.hint)
      assertEquals(mapOf("subscription_tier" to "pro", "userId" to "u_42"), decode(crash.log.attributes))
    }

  @Test
  fun `does not add globals to spans`() =
    runBlocking {
      GlobalAttributes.set(mapOf("subscription_tier" to "pro"))
      registry.register(sink)
      val span = span()
      registry.recordSpans(listOf(span), "s")

      assertEquals(listOf(FakeMetricsSink.Spans(listOf(span), "s")), sink.calls)
    }

  // endregion

  // region Helpers

  /** Waits for the replay to finish, by joining the job it runs as on the injected scope. */
  private suspend fun awaitReplay() {
    withTimeout(5_000) { replayScope.coroutineContext.job.children.toList().joinAll() }
  }

  /** Polls for `count` calls. Use only when the replay cannot be joined directly, see above. */
  private suspend fun awaitCalls(sink: FakeMetricsSink, count: Int): List<FakeMetricsSink.Call> {
    withTimeout(5_000) {
      while (sink.calls.size < count) {
        delay(10)
      }
    }
    return sink.calls
  }

  private fun logNames(calls: List<FakeMetricsSink.Call>): List<String> =
    calls.filterIsInstance<FakeMetricsSink.Logs>().flatMap { it.logs }.map { it.name }

  private fun replacementWarnings() =
    ShadowLog.getLogsForTag(TAG).filter { it.msg == "Replacing the registered metrics sink" }

  private fun recordedMetrics(): List<MetricRecord> =
    sink.calls.filterIsInstance<FakeMetricsSink.Metrics>().flatMap { it.metrics }

  private fun recordedLogs(): List<LogEvent> =
    sink.calls.filterIsInstance<FakeMetricsSink.Logs>().flatMap { it.logs }

  private fun decode(json: String?): Map<String, Any?>? = json?.let { JsonAny.decodeJsonStringToMap(it) }

  private fun metric(params: Map<String, Any?>? = null): MetricRecord =
    MetricRecord(
      timestamp = "2025-01-01T00:00:00.000Z",
      category = "test",
      name = "test-metric",
      value = 1.0,
      params = params?.let { JsonAny.encodeMapToJsonString(it) }
    )

  private fun log(name: String = "test.event", attributes: Map<String, Any?>? = null): LogEvent =
    LogEvent(
      timestamp = "2025-01-01T00:00:00.000Z",
      name = name,
      severity = "info",
      attributes = attributes?.let { JsonAny.encodeMapToJsonString(it) }
    )

  private fun span(): NetworkSpan =
    NetworkSpan(
      name = "GET",
      kind = NetworkSpan.CLIENT_KIND,
      startTimestampMs = 1_000,
      endTimestampMs = 1_250,
      statusCode = null,
      statusMessage = null,
      attributes = """{"http.request.method":"GET"}""",
      events = null
    )

  private fun report(): CrashReport =
    CrashReport.fromThrowable(
      throwable = IllegalStateException("boom"),
      crashTimestamp = "2026-06-12T10:00:00.000Z",
      ingestedAt = "2026-06-12T10:05:00.000Z",
      appVersion = "1.0.0"
    )

  // endregion
}
