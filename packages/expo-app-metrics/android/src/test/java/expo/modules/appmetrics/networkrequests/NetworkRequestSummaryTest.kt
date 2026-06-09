package expo.modules.appmetrics.networkrequests

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import java.util.Date
import java.util.UUID

class NetworkRequestSummaryTest {
  @Test
  fun `empty list yields empty summary`() {
    val summary = NetworkRequestSummary.from(emptyList())
    assertEquals(0, summary.count)
    assertEquals(0, summary.failed)
    assertEquals(0L, summary.bytesReceived)
    assertEquals(0L, summary.bytesSent)
    assertEquals(0.0, summary.totalDuration, 0.0001)
    assertNull(summary.slowestDuration)
    assertNull(summary.slowestHost)
    assertEquals(true, summary.isEmpty)
  }

  @Test
  fun `counts failed entries by error, 4xx, and 5xx status`() {
    val requests = listOf(
      makeRequest(statusCode = 200, totalDuration = 0.1),
      // 304 is a successful conditional-GET cache hit — must not count as failed.
      makeRequest(statusCode = 304, totalDuration = 0.1),
      makeRequest(statusCode = 404, totalDuration = 0.2),
      makeRequest(statusCode = 503, totalDuration = 0.2),
      makeRequest(statusCode = null, errorDescription = "timed out", totalDuration = 0.3)
    )
    val summary = NetworkRequestSummary.from(requests)
    assertEquals(5, summary.count)
    assertEquals(3, summary.failed)
  }

  @Test
  fun `slowest by totalDuration with host resolved from URL`() {
    val requests = listOf(
      makeRequest(url = "https://fast.example/x", totalDuration = 0.1),
      makeRequest(url = "https://slow.example/y", totalDuration = 0.5),
      makeRequest(url = "https://mid.example/z", totalDuration = 0.3)
    )
    val summary = NetworkRequestSummary.from(requests)
    assertEquals(0.5, summary.slowestDuration!!, 0.0001)
    assertEquals("slow.example", summary.slowestHost)
  }

  @Test
  fun `aggregates byte counts treating null as zero`() {
    val requests = listOf(
      makeRequest(requestBytesSent = 100, responseBytesReceived = 200),
      makeRequest(requestBytesSent = null, responseBytesReceived = 50),
      makeRequest(requestBytesSent = 30, responseBytesReceived = null)
    )
    val summary = NetworkRequestSummary.from(requests)
    assertEquals(130L, summary.bytesSent)
    assertEquals(250L, summary.bytesReceived)
  }

  private fun makeRequest(
    url: String = "https://expo.dev/x",
    statusCode: Int? = 200,
    errorDescription: String? = null,
    requestBytesSent: Long? = 0,
    responseBytesReceived: Long? = 0,
    totalDuration: Double = 0.1
  ): NetworkRequest = NetworkRequest(
    id = UUID.randomUUID(),
    url = url,
    method = "GET",
    statusCode = statusCode,
    networkProtocol = null,
    requestBytesSent = requestBytesSent,
    responseBytesReceived = responseBytesReceived,
    timings = NetworkRequest.Timings(
      fetchStart = Date(0),
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
      totalDuration = totalDuration
    ),
    errorDescription = errorDescription,
    redirects = emptyList()
  )
}
