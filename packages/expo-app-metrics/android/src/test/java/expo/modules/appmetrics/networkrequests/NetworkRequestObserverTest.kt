package expo.modules.appmetrics.networkrequests

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.util.Date
import java.util.UUID

/**
 * The JS-facing observer mostly forwards to `NetworkRequestMonitor`. What's specific to the
 * observer is the payload shape — the map it hands to `emit()` is the wire format JS consumers
 * see. These tests pin that shape down so renames require a deliberate change.
 */
class NetworkRequestObserverTest {
  @Test
  fun `startedPayload contains the started-event keys`() {
    val id = UUID.randomUUID()
    val startedAt = Date(1_700_000_000_000L)
    val payload = NetworkRequestObserver.startedPayload(
      NetworkRequestStarted(id, "https://expo.dev/start", "POST", startedAt)
    )

    assertEquals(id.toString(), payload["id"])
    assertEquals("https://expo.dev/start", payload["url"])
    assertEquals("POST", payload["method"])
    assertNotNull("startedAt should be populated", payload["startedAt"])
    // Only the four documented keys — anything extra means the JS contract grew unintentionally.
    assertEquals(setOf("id", "url", "method", "startedAt"), payload.keys)
  }

  @Test
  fun `completedPayload normalizes timings and redirects`() {
    val id = UUID.randomUUID()
    val fetchStart = Date(2_000_000L)
    val responseEnd = Date(2_500_000L)
    val request = NetworkRequest(
      id = id,
      url = "https://expo.dev/end",
      method = "GET",
      statusCode = 200,
      networkProtocol = "h2",
      requestBytesSent = 123,
      responseBytesReceived = 4567,
      timings = NetworkRequest.Timings(
        fetchStart = fetchStart,
        domainLookupStart = null,
        domainLookupEnd = null,
        connectStart = null,
        connectEnd = null,
        secureConnectionStart = null,
        secureConnectionEnd = null,
        requestStart = null,
        requestEnd = null,
        responseStart = null,
        responseEnd = responseEnd,
        totalDuration = 0.5
      ),
      errorDescription = null,
      redirects = listOf(
        NetworkRequest.Redirect(
          fromUrl = "https://expo.dev/a",
          toUrl = "https://expo.dev/b",
          statusCode = 301
        )
      )
    )

    val payload = NetworkRequestObserver.completedPayload(request)

    assertEquals(id.toString(), payload["id"])
    assertEquals("https://expo.dev/end", payload["url"])
    assertEquals("GET", payload["method"])
    assertEquals(200, payload["statusCode"])
    assertEquals("h2", payload["networkProtocol"])
    assertEquals(123L, payload["requestBytesSent"])
    assertEquals(4567L, payload["responseBytesReceived"])
    assertEquals(0.5, payload["totalDuration"])
    assertNotNull(payload["startedAt"])
    assertNotNull(payload["completedAt"])

    @Suppress("UNCHECKED_CAST")
    val redirects = payload["redirects"] as List<Map<String, Any?>>
    assertEquals(1, redirects.size)
    assertEquals("https://expo.dev/a", redirects[0]["fromUrl"])
    assertEquals("https://expo.dev/b", redirects[0]["toUrl"])
    assertEquals(301, redirects[0]["statusCode"])
  }

  @Test
  fun `completedPayload preserves nulls and empty redirects`() {
    val id = UUID.randomUUID()
    val request = NetworkRequest(
      id = id,
      url = "https://expo.dev/error",
      method = "GET",
      statusCode = null,
      networkProtocol = null,
      requestBytesSent = null,
      responseBytesReceived = null,
      timings = NetworkRequest.Timings(
        fetchStart = Date(3_000_000L),
        domainLookupStart = null,
        domainLookupEnd = null,
        connectStart = null,
        connectEnd = null,
        secureConnectionStart = null,
        secureConnectionEnd = null,
        requestStart = null,
        requestEnd = null,
        responseStart = null,
        responseEnd = null,
        totalDuration = 0.1
      ),
      errorDescription = "timed out",
      redirects = emptyList()
    )

    val payload = NetworkRequestObserver.completedPayload(request)

    // Every nullable key must be present in the map so JS callers can read them without crashing.
    assertTrue(payload.containsKey("statusCode"))
    assertNull(payload["statusCode"])
    assertTrue(payload.containsKey("networkProtocol"))
    assertNull(payload["networkProtocol"])
    assertTrue(payload.containsKey("requestBytesSent"))
    assertNull(payload["requestBytesSent"])
    assertTrue(payload.containsKey("completedAt"))
    assertNull(payload["completedAt"])
    assertEquals("timed out", payload["errorDescription"])

    // `redirects` is always present as an empty list, never null — JS callers `.map` over it
    // without a null-guard.
    @Suppress("UNCHECKED_CAST")
    val redirects = payload["redirects"] as List<Map<String, Any?>>
    assertTrue(redirects.isEmpty())
  }
}
