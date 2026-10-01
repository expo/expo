package expo.modules.appmetrics.sessions

import expo.modules.appmetrics.GlobalAttributes
import expo.modules.appmetrics.records.LogEvent
import expo.modules.appmetrics.records.MetricRecord
import expo.modules.appmetrics.sink.FakeMetricsSink
import expo.modules.appmetrics.sink.MetricsSinkRegistry
import expo.modules.appmetrics.sink.SessionInfo
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * Checks that [SessionSharedObject] hands its lifecycle and records to the shared
 * `MetricsSinkRegistry`. The object is constructed with no runtime (the default) so it stays
 * unlinked from any JS runtime. Calls are filtered by session id, so records from other tests
 * that reach the shared registry don't matter.
 */
@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class SessionSharedObjectTest {
  private val sink = FakeMetricsSink()

  @Before
  fun setUp() {
    GlobalAttributes.set(null)
    MetricsSinkRegistry.register(sink)
  }

  @Test
  fun `start emits sessionStarted with the session info`() {
    val session = SessionSharedObject(type = "main", customStartTimestamp = "2025-01-01T00:00:00.000Z")

    session.start()

    assertEquals(
      listOf(
        FakeMetricsSink.SessionStarted(
          SessionInfo(id = session.sessionId, type = "main", startTimestamp = "2025-01-01T00:00:00.000Z", metadata = null)
        )
      ),
      callsFor(session)
    )
  }

  @Test
  fun `startDate defaults to construction time when omitted`() {
    val session = SessionSharedObject(type = "custom")

    assertTrue(session.startDate.isNotBlank())
  }

  @Test
  fun `each session gets its own id`() {
    val first = SessionSharedObject(type = "main")
    val second = SessionSharedObject(type = "main")

    assertTrue(first.sessionId.isNotBlank())
    assertTrue(first.sessionId != second.sessionId)
  }

  @Test
  fun `addMetrics and addLogs emit with the session id`() =
    runBlocking {
      val session = SessionSharedObject(type = "main")
      val metric = MetricRecord(timestamp = "2025-01-01T00:00:00.000Z", category = "test", name = "m", value = 1.0)
      val log = LogEvent(timestamp = "2025-01-01T00:00:00.000Z", name = "l", severity = "info")

      session.addMetrics(listOf(metric))
      session.addLogs(listOf(log))

      assertEquals(
        listOf(
          FakeMetricsSink.Metrics(listOf(metric), session.sessionId),
          FakeMetricsSink.Logs(listOf(log), session.sessionId)
        ),
        callsFor(session)
      )
    }

  @Test
  fun `stop emits sessionEnded with the in-memory end date`() =
    runBlocking {
      val session = SessionSharedObject(type = "main")
      assertTrue(session.isActive())
      assertNull(session.getEndDate())

      session.stop()

      val endDate = session.getEndDate()
      assertNotNull(endDate)
      assertFalse(session.isActive())
      assertEquals(listOf(FakeMetricsSink.SessionEnded(session.sessionId, endDate!!)), callsFor(session))
    }

  private fun callsFor(session: SessionSharedObject) =
    sink.calls.filter {
      when (it) {
        is FakeMetricsSink.SessionStarted -> it.session.id == session.sessionId
        is FakeMetricsSink.SessionEnded -> it.sessionId == session.sessionId
        is FakeMetricsSink.Metrics -> it.sessionId == session.sessionId
        is FakeMetricsSink.Logs -> it.sessionId == session.sessionId
        else -> false
      }
    }
}
