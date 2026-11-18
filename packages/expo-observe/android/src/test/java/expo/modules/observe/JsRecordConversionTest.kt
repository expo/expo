package expo.modules.observe

import expo.modules.observe.logevents.JsSeverity
import expo.modules.observe.shared.jserrors.ErrorReport
import expo.modules.observe.shared.jserrors.ErrorSource
import expo.modules.observe.shared.logevents.FeedbackReport
import expo.modules.observe.shared.logevents.FeedbackScale
import expo.modules.observe.shared.logevents.Severity
import expo.modules.observe.shared.memory.MemoryUsageSnapshot
import org.junit.Assert.assertEquals
import org.junit.Test

class JsRecordConversionTest {
  @Test
  fun `JsSeverity has every Severity and converts to the one with the same JS value`() {
    assertEquals(
      Severity.entries.map { it.rawValue },
      JsSeverity.entries.map { it.rawValue }
    )
    JsSeverity.entries.forEach {
      assertEquals(it.rawValue, it.toSeverity().rawValue)
    }
  }

  @Test
  fun `JsErrorSource has every ErrorSource`() {
    assertEquals(
      ErrorSource.entries.map { it.rawValue },
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
