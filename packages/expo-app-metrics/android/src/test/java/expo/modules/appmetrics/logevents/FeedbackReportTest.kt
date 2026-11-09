package expo.modules.appmetrics.logevents

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.jsonObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class FeedbackReportTest {
  private fun attributesOf(report: FeedbackReport): JsonObject =
    Json.parseToJsonElement(report.toLogRecord(sessionId = "s").attributes!!).jsonObject

  @Test
  fun `records an expo_feedback event with the id, rating, and message`() {
    val report = FeedbackReport(id = "checkout", message = "Great", rating = 7, attributes = mapOf("plan" to "pro"))
    val record = report.toLogRecord(sessionId = "s")
    val attributes = attributesOf(report)

    assertEquals("expo.feedback", record.name)
    assertEquals("Great", record.body)
    assertEquals("info", record.severity)
    assertEquals(JsonPrimitive("checkout"), attributes["expo.feedback.id"])
    assertEquals(JsonPrimitive(7), attributes["expo.feedback.rating"])
    assertEquals(JsonPrimitive("pro"), attributes["plan"])
  }

  @Test
  fun `user attributes cannot overwrite the feedback attributes`() {
    val report = FeedbackReport(
      id = "checkout",
      rating = 3,
      attributes = mapOf("expo.feedback.id" to "spoofed", "expo.feedback.rating" to 10)
    )
    val attributes = attributesOf(report)

    assertEquals(JsonPrimitive("checkout"), attributes["expo.feedback.id"])
    assertEquals(JsonPrimitive(3), attributes["expo.feedback.rating"])
    assertEquals(2, report.toLogRecord(sessionId = "s").droppedAttributesCount)
  }

  @Test
  fun `omits the rating attribute when no rating is set`() {
    val attributes = attributesOf(FeedbackReport(id = "checkout", message = "Great"))

    assertFalse(attributes.containsKey("expo.feedback.rating"))
  }

  @Test
  fun `cuts the message to 4096 characters`() {
    val record = FeedbackReport(id = "checkout", message = "a".repeat(5000)).toLogRecord(sessionId = "s")

    assertEquals(4096, record.body?.length)
  }
}
