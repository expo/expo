package expo.modules.appmetrics.logevents

import expo.modules.appmetrics.utils.JsonAny
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class LogEventBuilderTest {
  @Test
  fun `builds a record from a valid name and options`() {
    val record = makeLogRecord(
      "auth.login_failed",
      LogEventOptions(body = "everything is fine", severity = Severity.ERROR)
    )!!
    assertEquals("auth.login_failed", record.name)
    assertEquals("everything is fine", record.body)
    assertEquals("error", record.severity)
    assertEquals(0, record.droppedAttributesCount)
    // The persisting session stamps its own id; the built record carries none.
    assertEquals("", record.sessionId)
  }

  @Test
  fun `defaults severity to info when options are omitted`() {
    val record = makeLogRecord("user.signed_in", null)!!
    assertEquals("info", record.severity)
  }

  @Test
  fun `defaults severity to info when options omit severity`() {
    val record = makeLogRecord("user.signed_in", LogEventOptions(body = "no severity provided"))!!
    assertEquals("info", record.severity)
  }

  @Test
  fun `trims the event name`() {
    val record = makeLogRecord("  user.signed_in\n", null)!!
    assertEquals("user.signed_in", record.name)
  }

  @Test
  fun `drops events whose name is invalid`() {
    assertNull(makeLogRecord("", null))
    assertNull(makeLogRecord("expo.reserved", null))
  }

  @Test
  fun `keeps valid attributes and drops reserved ones, reporting the dropped count`() {
    val record = makeLogRecord(
      "checkout.completed",
      LogEventOptions(
        attributes = mapOf(
          "valid" to "kept",
          "expo.app.name" to "reserved-namespace",
          "session.id" to "reserved-key"
        )
      )
    )!!
    val attributes = JsonAny.decodeJsonStringToMap(record.attributes!!)!!
    assertEquals("kept", attributes["valid"])
    assertNull(attributes["expo.app.name"])
    assertNull(attributes["session.id"])
    assertEquals(2, record.droppedAttributesCount)
  }

  @Test
  fun `leaves attributes null when every entry is dropped`() {
    val record = makeLogRecord(
      "checkout.completed",
      LogEventOptions(attributes = mapOf("expo.only" to "reserved"))
    )!!
    assertNull(record.attributes)
    assertEquals(1, record.droppedAttributesCount)
  }

  @Test
  fun `truncates an over-long body`() {
    val record = makeLogRecord("verbose.event", LogEventOptions(body = "a".repeat(5000)))!!
    // `validateEventBody` caps the body at 4096 characters, ellipsis included.
    assertEquals(4096, record.body!!.length)
    assertTrue(record.body!!.endsWith("…"))
  }
}
