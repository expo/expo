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

  @Test
  fun `counts timeouts separately from other failures`() {
    val requests = listOf(
      makeRequest(
        statusCode = null,
        errorDescription = "timeout",
        totalDuration = 30.0,
        isTimeout = true
      ),
      // A 5xx is the backend failing, not the network.
      makeRequest(statusCode = 503),
      makeRequest(statusCode = 200)
    )
    val summary = NetworkRequestSummary.from(requests)
    assertEquals(2, summary.failed)
    assertEquals(1, summary.timedOut)
  }

  @Test
  fun `reports no timeouts when every request reached the server`() {
    val summary = NetworkRequestSummary.from(listOf(makeRequest(statusCode = 500)))
    assertEquals(1, summary.failed)
    assertEquals(0, summary.timedOut)
  }

  @Test
  fun `aggregates slowest time to first byte and ignores requests without one`() {
    val requests = listOf(
      makeRequest(fetchStart = Date(0), responseStart = Date(50)),
      makeRequest(fetchStart = Date(0), responseStart = Date(300)),
      // No responseStart (failed before headers arrived), so it contributes nothing.
      makeRequest(statusCode = null, errorDescription = "timed out", totalDuration = 2.0)
    )
    val summary = NetworkRequestSummary.from(requests)
    assertEquals(0.3, summary.slowestTimeToFirstByte!!, 0.0001)
  }

  @Test
  fun `leaves slowest time to first byte null when no request reported one`() {
    val summary = NetworkRequestSummary.from(listOf(makeRequest()))
    assertNull(summary.slowestTimeToFirstByte)
  }

  @Test
  fun `computes throughput over the time the network was actually busy`() {
    // Two requests back to back: 1s each, no overlap, so 2s of busy time.
    val requests = listOf(
      makeRequest(
        responseBytesReceived = 8000,
        fetchStart = Date(0),
        responseEnd = Date(1000)
      ),
      makeRequest(
        responseBytesReceived = 2000,
        fetchStart = Date(1000),
        responseEnd = Date(2000)
      )
    )
    val summary = NetworkRequestSummary.from(requests)
    assertEquals(5000.0, summary.throughputBytesPerSecond!!, 0.0001)
  }

  @Test
  fun `does not deflate throughput when requests run concurrently`() {
    // Four parallel requests, each 1s and 10 kB. Summed request-seconds would be 4s and report
    // 10 kB/s; the network actually moved 40 kB in one second of wall-clock.
    val requests = (0 until 4).map {
      makeRequest(
        responseBytesReceived = 10000,
        fetchStart = Date(0),
        responseEnd = Date(1000)
      )
    }
    val summary = NetworkRequestSummary.from(requests)
    assertEquals(40000.0, summary.throughputBytesPerSecond!!, 0.0001)
  }

  @Test
  fun `excludes idle gaps between requests from throughput`() {
    // 1s of transfer, a 10s idle gap, then another 1s: only the 2s of busy time counts.
    val requests = listOf(
      makeRequest(responseBytesReceived = 5000, fetchStart = Date(0), responseEnd = Date(1000)),
      makeRequest(responseBytesReceived = 5000, fetchStart = Date(11000), responseEnd = Date(12000))
    )
    val summary = NetworkRequestSummary.from(requests)
    assertEquals(5000.0, summary.throughputBytesPerSecond!!, 0.0001)
  }

  @Test
  fun `merges partially overlapping requests into one busy span`() {
    // 0-2s and 1-3s overlap, so busy time is 3s rather than the 4s of summed duration.
    val requests = listOf(
      makeRequest(responseBytesReceived = 3000, fetchStart = Date(0), responseEnd = Date(2000)),
      makeRequest(responseBytesReceived = 3000, fetchStart = Date(1000), responseEnd = Date(3000))
    )
    val summary = NetworkRequestSummary.from(requests)
    assertEquals(2000.0, summary.throughputBytesPerSecond!!, 0.0001)
  }

  @Test
  fun `leaves throughput null when no request reported a usable interval`() {
    // Without a responseEnd there's no busy span to divide by, so the rate is unknown rather than 0.
    val summary = NetworkRequestSummary.from(
      listOf(makeRequest(responseBytesReceived = 5000, responseEnd = null))
    )
    assertNull(summary.throughputBytesPerSecond)
  }

  @Test
  fun `ignores requests that received no bytes when timing throughput`() {
    // A slow API call that returns nothing spends real time in flight, but no bytes could have been
    // flowing during it. Counting its span would describe time the payload wasn't moving; its
    // latency is already covered by `slowestTimeToFirstByte`.
    val requests = listOf(
      makeRequest(responseBytesReceived = 10000, fetchStart = Date(0), responseEnd = Date(1000)),
      makeRequest(
        url = "https://httpbin.org/status/204",
        statusCode = 204,
        responseBytesReceived = 0,
        fetchStart = Date(1000),
        responseEnd = Date(4000)
      )
    )
    val summary = NetworkRequestSummary.from(requests)
    assertEquals(10000.0, summary.throughputBytesPerSecond!!, 0.0001)
  }

  @Test
  fun `ignores a byte-carrying request whose interval collapsed to nothing`() {
    // A cache hit reports its bytes but is served from disk inside one clock tick, so its interval
    // collapses. Counting those bytes against another request's span would double the rate.
    val requests = listOf(
      makeRequest(responseBytesReceived = 10000, fetchStart = Date(0), responseEnd = Date(0)),
      makeRequest(responseBytesReceived = 10000, fetchStart = Date(5000), responseEnd = Date(6000))
    )
    val summary = NetworkRequestSummary.from(requests)
    // Only the download's 10 kB over its own 1s span.
    assertEquals(10000.0, summary.throughputBytesPerSecond!!, 0.0001)
  }

  @Test
  fun `leaves throughput null when the only receiving request had no measurable span`() {
    val summary = NetworkRequestSummary.from(
      listOf(makeRequest(responseBytesReceived = 10000, fetchStart = Date(0), responseEnd = Date(0)))
    )
    assertNull(summary.throughputBytesPerSecond)
  }

  @Test
  fun `leaves throughput null when nothing was received`() {
    // A cache hit moves no bytes; dividing would report a fake 0 B/s rather than "unknown".
    val summary = NetworkRequestSummary.from(
      listOf(makeRequest(statusCode = 304, responseBytesReceived = 0, totalDuration = 0.01))
    )
    assertNull(summary.throughputBytesPerSecond)
  }

  @Test
  fun `ignores a negative first-byte duration`() {
    // A clock adjustment mid-request can invert these wall-clock dates.
    val summary = NetworkRequestSummary.from(
      listOf(makeRequest(fetchStart = Date(500), responseStart = Date(300)))
    )
    assertNull(summary.slowestTimeToFirstByte)
  }

  private fun makeRequest(
    url: String = "https://expo.dev/x",
    statusCode: Int? = 200,
    errorDescription: String? = null,
    requestBytesSent: Long? = 0,
    responseBytesReceived: Long? = 0,
    totalDuration: Double = 0.1,
    isTimeout: Boolean = false,
    fetchStart: Date = Date(0),
    responseStart: Date? = null,
    responseEnd: Date? = Date(100)
  ): NetworkRequest = NetworkRequest(
    id = UUID.randomUUID(),
    url = url,
    method = "GET",
    statusCode = statusCode,
    networkProtocol = null,
    requestBytesSent = requestBytesSent,
    responseBytesReceived = responseBytesReceived,
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
      responseStart = responseStart,
      responseEnd = responseEnd,
      totalDuration = totalDuration
    ),
    errorDescription = errorDescription,
    redirects = emptyList(),
    isTimeout = isTimeout
  )
}
