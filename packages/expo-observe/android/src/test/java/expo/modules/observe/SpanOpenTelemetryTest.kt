package expo.modules.observe

import expo.modules.appmetrics.storage.Span
import kotlinx.serialization.json.Json
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

private const val START_MS = 1_782_131_895_000
private const val END_MS = 1_782_131_895_250

private fun makeRow(
  sessionId: String = "0f8fad5b-d9cb-469f-a165-70867728950e",
  traceId: String = "a3ce929d0e0e4736a3ce929d0e0e4736",
  spanId: String = "00f067aa0ba902b7",
  parentSpanId: String? = null,
  name: String = "GET",
  kind: Int = Span.CLIENT_KIND,
  startTimestampMs: Long = START_MS,
  endTimestampMs: Long = END_MS,
  statusCode: Int? = null,
  statusMessage: String? = null,
  attributes: String? = null,
  events: String? = null
) = Span(
  sessionId = sessionId,
  traceId = traceId,
  spanId = spanId,
  parentSpanId = parentSpanId,
  name = name,
  kind = kind,
  startTimestampMs = startTimestampMs,
  endTimestampMs = endTimestampMs,
  statusCode = statusCode,
  statusMessage = statusMessage,
  attributes = attributes,
  events = events
)

private fun attribute(span: OTSpan, key: String): OTAnyValue? =
  span.attributes.firstOrNull { it.key == key }?.value

class SpanToOTSpanMappingTest {
  @Test
  fun `passes the persisted identity through to the wire shape`() {
    // Ids are generated at record time and persisted precisely so that the export layer never
    // invents new ones — a redelivered row must stay byte-identical on the server.
    val span = makeRow(name = "POST", kind = 5).toOTSpan()
    assertEquals("a3ce929d0e0e4736a3ce929d0e0e4736", span.traceId)
    assertEquals("00f067aa0ba902b7", span.spanId)
    assertEquals("POST", span.name)
    assertEquals(5, span.kind)
    assertNull(span.parentSpanId)
  }

  @Test
  fun `passes a present parent span id through`() {
    val span = makeRow(parentSpanId = "abcdef0123456789").toOTSpan()
    assertEquals("abcdef0123456789", span.parentSpanId)
  }

  @Test
  fun `converts the start and end timestamps to unix nanoseconds`() {
    val span = makeRow().toOTSpan()
    assertEquals(1_782_131_895_000_000_000, span.startTimeUnixNano)
    assertEquals(1_782_131_895_250_000_000, span.endTimeUnixNano)
  }

  @Test
  fun `never reports an end that precedes the start`() {
    // The server rejects a span whose end is before its start. A clock adjustment mid-span
    // can invert the two wall-clock timestamps, so the mapping has to clamp.
    val span = makeRow(startTimestampMs = START_MS, endTimestampMs = START_MS - 5_000).toOTSpan()
    assertTrue(span.endTimeUnixNano >= span.startTimeUnixNano)
  }

  @Test
  fun `clamps a far-future timestamp instead of overflowing`() {
    // A corrupt row or a device clock set far into the future must never overflow the
    // nanosecond conversion into a negative timestamp; it saturates instead.
    val span = makeRow(startTimestampMs = Long.MAX_VALUE, endTimestampMs = Long.MAX_VALUE).toOTSpan()
    assertTrue(span.startTimeUnixNano > 0)
    assertTrue(span.endTimeUnixNano >= span.startTimeUnixNano)
  }

  @Test
  fun `attaches the session id as an attribute`() {
    val span = makeRow(sessionId = "session-uuid").toOTSpan()
    assertEquals(OTAnyValue.Str("session-uuid"), attribute(span, "session.id"))
  }

  @Test
  fun `decodes the attributes blob into typed wire attributes`() {
    val json =
      """{"http.request.method":"GET","http.response.status_code":200,"http.request.size":412,"retried":false,"sampling.rate":0.5}"""
    val span = makeRow(attributes = json).toOTSpan()
    assertEquals(OTAnyValue.Str("GET"), attribute(span, "http.request.method"))
    assertEquals(OTAnyValue.Int64(200), attribute(span, "http.response.status_code"))
    assertEquals(OTAnyValue.Int64(412), attribute(span, "http.request.size"))
    assertEquals(OTAnyValue.Bln(false), attribute(span, "retried"))
    assertEquals(OTAnyValue.Dbl(0.5), attribute(span, "sampling.rate"))
  }

  @Test
  fun `tolerates an absent or malformed attributes blob`() {
    // Only the session attribute remains; a bad blob must not fail the whole span.
    for (blob in listOf(null, "not json", "[1,2,3]")) {
      val span = makeRow(attributes = blob).toOTSpan()
      assertEquals(1, span.attributes.size)
      assertEquals("session.id", span.attributes.single().key)
    }
  }

  @Test
  fun `passes the error status and message through`() {
    val span = makeRow(statusCode = 2, statusMessage = "offline").toOTSpan()
    assertEquals(2, span.status?.code)
    assertEquals("offline", span.status?.message)
  }

  @Test
  fun `omits the status when the row has none`() {
    // UNSET is expressed by omitting the status object entirely, per the conventions.
    assertNull(makeRow(statusCode = null).toOTSpan().status)
  }
}

class SpanEventDecodingTest {
  private fun eventsJson(count: Int): String {
    val events = (0 until count).joinToString(separator = ",") { index ->
      """{"name":"http.redirect","attributes":{"from":"https://example.com/$index","statusCode":302}}"""
    }
    return "[$events]"
  }

  @Test
  fun `decodes events with their attributes`() {
    val span = makeRow(events = eventsJson(count = 2)).toOTSpan()
    assertEquals(2, span.events.size)
    assertTrue(span.events.all { it.name == "http.redirect" })
    val first = span.events.first()
    val attributes = first.attributes.associate { it.key to it.value }
    assertEquals(OTAnyValue.Str("https://example.com/0"), attributes["from"])
    assertEquals(OTAnyValue.Int64(302), attributes["statusCode"])
  }

  @Test
  fun `anchors events without a timestamp to the span start`() {
    // Producers may omit per-event timestamps; an out-of-window event is meaningless in a
    // trace waterfall, so the fallback is the span start.
    val span = makeRow(events = eventsJson(count = 2)).toOTSpan()
    assertTrue(span.events.all { it.timeUnixNano == span.startTimeUnixNano })
  }

  @Test
  fun `uses a per-event timestamp when the producer recorded one`() {
    val json = """[{"name":"checkpoint","timeMs":${START_MS + 100}}]"""
    val span = makeRow(events = json).toOTSpan()
    assertEquals(1_782_131_895_100_000_000, span.events.single().timeUnixNano)
  }

  @Test
  fun `drops an event without a name`() {
    // The server drops nameless events anyway; skipping them locally keeps the payload honest.
    val json = """[{"attributes":{"orphan":true}},{"name":"kept"}]"""
    val span = makeRow(events = json).toOTSpan()
    assertEquals(listOf("kept"), span.events.map { it.name })
  }

  @Test
  fun `emits no events when the row has none`() {
    val span = makeRow().toOTSpan()
    assertTrue(span.events.isEmpty())
    assertEquals(0, span.droppedEventsCount)
  }

  @Test
  fun `caps the number of emitted events at the server limit`() {
    // The server keeps at most 32 events per span and counts the rest as dropped. Sending
    // more just wastes payload, so the SDK truncates and reports the loss itself.
    val span = makeRow(events = eventsJson(count = 40)).toOTSpan()
    assertEquals(32, span.events.size)
    assertEquals(8, span.droppedEventsCount)
  }
}

class TracesRequestBodyTest {
  private fun encode(spans: List<OTSpan>): String {
    val event = Event(
      metadata = Metadata(
        appName = null,
        appIdentifier = "dev.expo.test",
        appVersion = null,
        appBuildNumber = null,
        appEasBuildId = null,
        appUpdatesInfo = null,
        languageTag = null,
        deviceOs = null,
        deviceOsVersion = null,
        deviceModel = null,
        deviceName = null,
        expoSdkVersion = "55.0.0",
        reactNativeVersion = "0.85.0",
        clientVersion = null
      ),
      metrics = emptyList()
    )
    return OTTracesRequestBody(
      resourceSpans = listOf(event.toOTResourceSpans("eas-client-id", spans))
    ).toJson()
  }

  @Test
  fun `encodes the resourceSpans envelope the endpoint expects`() {
    val body = encode(listOf(makeRow().toOTSpan()))
    assertTrue(body.contains("\"resourceSpans\""))
    assertTrue(body.contains("\"scopeSpans\""))
    assertTrue(body.contains("\"traceId\":\"a3ce929d0e0e4736a3ce929d0e0e4736\""))
    assertTrue(body.contains("\"kind\":3"))
  }

  @Test
  fun `omits an absent parent span id from the encoded span`() {
    // The server rejects a span carrying a present-but-invalid parent id, so a root span
    // must leave the key out entirely rather than encode null or an empty string.
    val body = encode(listOf(makeRow().toOTSpan()))
    assertFalse(body.contains("parentSpanId"))
  }
}

class TracesPartialSuccessTest {
  @Test
  fun `counts rejected spans from a traces partial success`() {
    // The traces endpoint reports `rejectedSpans`, a field neither the metrics nor the logs
    // response carries. Without it the shared decoder reads a rejection as a clean success.
    val json = """{"partialSuccess":{"rejectedSpans":3,"errorMessage":"bad span"}}"""
    val response = Json { ignoreUnknownKeys = true }.decodeFromString(OTServiceResponse.serializer(), json)
    val partial = checkNotNull(response.partialSuccess)
    assertEquals(3, partial.rejectedCount)
    assertEquals("bad span", partial.errorMessage)
  }
}
