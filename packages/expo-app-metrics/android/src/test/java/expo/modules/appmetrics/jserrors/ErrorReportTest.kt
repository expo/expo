package expo.modules.appmetrics.jserrors

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class ErrorReportTest {
  @Test
  fun `includes the component stack attribute when present`() {
    val report = ErrorReport(
      source = ErrorSource.ERROR_BOUNDARY,
      type = "Error",
      message = "boom",
      stacktrace = "at f (app.js:1:1)",
      componentStack = "at Boom (App.tsx:1:1)",
      isFatal = false
    )

    val attributes = report.toLogRecord(sessionId = "s").attributes ?: ""
    assertTrue(attributes.contains("expo.error.component_stack"))
    assertTrue(attributes.contains("at Boom"))
    assertEquals("errorBoundary", report.source.rawValue)
  }

  @Test
  fun `omits the component stack attribute when absent`() {
    val report = ErrorReport(
      source = ErrorSource.GLOBAL,
      type = "Error",
      message = "boom",
      stacktrace = "at f (app.js:1:1)",
      componentStack = null,
      isFatal = false
    )

    val attributes = report.toLogRecord(sessionId = "s").attributes ?: ""
    assertFalse(attributes.contains("expo.error.component_stack"))
  }

  @Test
  fun `tags a user-reported error with the reportedByUser source at error severity`() {
    val report = ErrorReport(
      source = ErrorSource.REPORTED_BY_USER,
      type = "TypeError",
      message = "nope",
      stacktrace = "at f (app.js:1:1)",
      isFatal = false
    )
    val record = report.toLogRecord(sessionId = "s")
    val attributes = record.attributes ?: ""
    assertTrue(attributes.contains("\"expo.error.source\":\"reportedByUser\""))
    assertEquals("error", record.severity)
  }
}
