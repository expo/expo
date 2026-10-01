package expo.modules.appmetrics.sink

import expo.modules.appmetrics.GlobalAttributes
import expo.modules.appmetrics.TAG
import expo.modules.appmetrics.crashreporting.CrashOrigin
import expo.modules.appmetrics.crashreporting.CrashReport
import expo.modules.appmetrics.records.LogEvent
import expo.modules.appmetrics.records.MetricRecord
import expo.modules.appmetrics.records.NetworkSpan
import expo.modules.appmetrics.utils.JsonAny
import kotlinx.coroutines.runBlocking
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
  private val registry = MetricsSinkRegistry()
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
  fun `drops records while no sink is registered`() =
    runBlocking {
      registry.sessionStarted(session)
      registry.recordMetrics(listOf(metric()), "s")

      registry.register(sink)

      assertTrue(sink.calls.isEmpty())
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

  private fun log(attributes: Map<String, Any?>? = null): LogEvent =
    LogEvent(
      timestamp = "2025-01-01T00:00:00.000Z",
      name = "test.event",
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
