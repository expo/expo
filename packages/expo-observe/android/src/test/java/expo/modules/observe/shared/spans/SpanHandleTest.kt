package expo.modules.observe.shared.spans

import expo.modules.observe.shared.storage.Span
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

private const val START_MS = 1_782_131_895_000
private const val END_MS = 1_782_131_895_250

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class SpanHandleTest {
  @Test
  fun `end hands the row to onEnd once`() {
    val recorder = SpanRecorder(name = "checkout", sessionId = "s", startTimestampMs = START_MS)
    val rows = mutableListOf<Span>()
    val handle = SpanHandle(recorder = recorder, onEnd = { rows.add(it) })

    handle.end(statusCode = Span.STATUS_OK, statusMessage = null, endTimestampMs = END_MS)
    handle.end(statusCode = Span.STATUS_ERROR, statusMessage = null, endTimestampMs = END_MS)

    assertEquals(1, rows.size)
    assertEquals(recorder.spanId, rows.single().spanId)
    assertEquals(Span.STATUS_OK, rows.single().statusCode)
  }
}
