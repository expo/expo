package expo.modules.appmetrics

import expo.modules.appmetrics.jserrors.ErrorReport
import expo.modules.appmetrics.jserrors.ErrorSource
import expo.modules.appmetrics.logevents.FeedbackReport
import expo.modules.appmetrics.logevents.FeedbackScale
import expo.modules.appmetrics.logevents.JsSeverity
import expo.modules.appmetrics.memory.MemoryUsageSnapshot
import org.junit.Assert.assertEquals
import org.junit.Test

class JsRecordConversionTest {
  @Test
  fun `JsSeverity converts to the Severity with the same JS value`() {
    assertEquals(
      listOf("trace", "debug", "info", "warn", "error", "fatal"),
      JsSeverity.entries.map { it.rawValue }
    )
    JsSeverity.entries.forEach {
      assertEquals(it.rawValue, it.toSeverity().rawValue)
    }
  }

  @Test
  fun `JsErrorSource values match the JS strings`() {
    assertEquals(
      listOf("global", "errorBoundary", "reportedByUser", "integration"),
      JsErrorSource.entries.map { it.rawValue }
    )
  }

  @Test
  fun `JsErrorReport converts every field and the source`() {
    JsErrorSource.entries.forEach { source ->
      val report = JsErrorReport(
        source = source,
        type = "TypeError",
        message = "boom",
        stacktrace = "at f (app.js:1:1)",
        componentStack = "at Boom (App.tsx:1:1)",
        isFatal = true
      ).toErrorReport()

      assertEquals(
        ErrorReport(
          source = ErrorSource.entries.first { it.rawValue == source.rawValue },
          type = "TypeError",
          message = "boom",
          stacktrace = "at f (app.js:1:1)",
          componentStack = "at Boom (App.tsx:1:1)",
          isFatal = true
        ),
        report
      )
    }
  }

  @Test
  fun `JsErrorReport defaults convert to ErrorReport defaults`() {
    assertEquals(ErrorReport(), JsErrorReport().toErrorReport())
  }

  @Test
  fun `JsFeedbackReport converts every field and the scale`() {
    val report = JsFeedbackReport(
      id = "checkout",
      message = "Great",
      rating = 4,
      scale = JsFeedbackScale(min = 1, max = 5),
      attributes = mapOf("plan" to "pro")
    ).toFeedbackReport()

    assertEquals(
      FeedbackReport(
        id = "checkout",
        message = "Great",
        rating = 4,
        scale = FeedbackScale(min = 1, max = 5),
        attributes = mapOf("plan" to "pro")
      ),
      report
    )
  }

  @Test
  fun `JsFeedbackReport defaults convert to FeedbackReport defaults`() {
    assertEquals(FeedbackReport(), JsFeedbackReport().toFeedbackReport())
  }

  @Test
  fun `JsMemoryUsageSnapshot copies every field`() {
    val snapshot = JsMemoryUsageSnapshot.from(
      MemoryUsageSnapshot(physical = 1L, available = 2L, javaHeap = 3L)
    )

    assertEquals(JsMemoryUsageSnapshot(physical = 1L, available = 2L, javaHeap = 3L), snapshot)
  }
}
