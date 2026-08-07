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
    assertNull(summary.slowest)
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
    assertEquals(0.5, summary.slowest?.duration!!, 0.0001)
    assertEquals("slow.example", summary.slowest?.host)
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
  fun `picks the slowest completed request rather than the slowest failure`() {
    // A timeout's duration is the client's timeout setting, not a measurement of the server, so
    // letting it win would make this field report a config constant instead of the network.
    val requests = listOf(
      makeRequest(
        url = "http://192.168.0.104/bundle",
        statusCode = null,
        errorDescription = "timeout",
        totalDuration = 10.0
      ),
      makeRequest(
        url = "https://cdn.expo.dev/asset",
        responseBytesReceived = 5000,
        totalDuration = 2.0,
        fetchStart = Date(0),
        responseStart = Date(400),
        responseEnd = Date(2000)
      ),
      makeRequest(url = "https://api.expo.dev/v2", responseBytesReceived = 100, totalDuration = 0.2)
    )
    val summary = NetworkRequestSummary.from(requests)
    assertEquals(2.0, summary.slowest!!.duration, 0.0001)
    assertEquals("cdn.expo.dev", summary.slowest!!.host)
    // All fields describe that one request.
    assertEquals(0.4, summary.slowest!!.timeToFirstByte!!, 0.0001)
    assertEquals(5000L, summary.slowest!!.bytesReceived)
    // The timeout is still counted, just not used to describe the slowest request.
    assertEquals(1, summary.failed)
  }

  @Test
  fun `reports the slowest request's status code so an empty body can be explained`() {
    // A 304 revalidation is successful, so it's a candidate, but carries no body. Without the status
    // code a reader can't tell that from a 200 whose transfer broke.
    val requests = listOf(
      makeRequest(
        statusCode = 304,
        responseBytesReceived = 0,
        totalDuration = 1.1,
        fetchStart = Date(0),
        responseEnd = Date(1100)
      ),
      makeRequest(
        statusCode = 200,
        responseBytesReceived = 7000,
        totalDuration = 0.5,
        fetchStart = Date(0),
        responseStart = Date(100),
        responseEnd = Date(500)
      )
    )
    val summary = NetworkRequestSummary.from(requests)
    assertEquals(304, summary.slowest!!.statusCode)
    assertEquals(0L, summary.slowest!!.bytesReceived)
    // Not filtered out: the status code explains the zero rather than hiding the request.
    assertEquals(1.1, summary.slowest!!.duration, 0.0001)
  }

  @Test
  fun `leaves slowest null when every request failed`() {
    val summary = NetworkRequestSummary.from(
      listOf(
        makeRequest(
          statusCode = null,
          errorDescription = "timeout",
          totalDuration = 10.0
        )
      )
    )
    assertNull(summary.slowest)
    assertEquals(1, summary.count)
  }

  @Test
  fun `reports the slowest request's own time to first byte, not the window maximum`() {
    // The quick request has the higher TTFB; a window max would report 0.9 here. The slowest
    // request's own TTFB is 0.3, which is what pairs with its duration.
    val requests = listOf(
      makeRequest(
        responseBytesReceived = 9000,
        totalDuration = 4.0,
        fetchStart = Date(0),
        responseStart = Date(300),
        responseEnd = Date(4000)
      ),
      makeRequest(
        responseBytesReceived = 100,
        totalDuration = 1.0,
        fetchStart = Date(0),
        responseStart = Date(900),
        responseEnd = Date(1000)
      )
    )
    val summary = NetworkRequestSummary.from(requests)
    assertEquals(4.0, summary.slowest!!.duration, 0.0001)
    assertEquals(0.3, summary.slowest!!.timeToFirstByte!!, 0.0001)
  }

  @Test
  fun `leaves slowest time to first byte null when the slowest request reported none`() {
    val requests = listOf(
      makeRequest(totalDuration = 2.0, fetchStart = Date(0), responseStart = null),
      makeRequest(totalDuration = 0.1, fetchStart = Date(0), responseStart = Date(50))
    )
    val summary = NetworkRequestSummary.from(requests)
    // The 2s request wins on duration but never produced a first byte, so the field is absent
    // rather than borrowing the quick request's value.
    assertEquals(2.0, summary.slowest!!.duration, 0.0001)
    assertNull(summary.slowest!!.timeToFirstByte)
  }

  @Test
  fun `leaves slowest time to first byte null when no request reported one`() {
    val summary = NetworkRequestSummary.from(listOf(makeRequest()))
    assertNull(summary.slowest?.timeToFirstByte)
  }

  @Test
  fun `computes throughput over the time the network was actually busy`() {
    // Two requests back to back: 1s each, no overlap, so 2s of busy time.
    val requests = listOf(
      makeRequest(
        responseBytesReceived = 8000,
        fetchStart = Date(0),
        responseStart = Date(0),
        responseEnd = Date(1000)
      ),
      makeRequest(
        responseBytesReceived = 2000,
        fetchStart = Date(1000),
        responseStart = Date(1000),
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
        responseStart = Date(0),
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
      makeRequest(
        responseBytesReceived = 5000,
        fetchStart = Date(0),
        responseStart = Date(0),
        responseEnd = Date(1000)
      ),
      makeRequest(
        responseBytesReceived = 5000,
        fetchStart = Date(11000),
        responseStart = Date(11000),
        responseEnd = Date(12000)
      )
    )
    val summary = NetworkRequestSummary.from(requests)
    assertEquals(5000.0, summary.throughputBytesPerSecond!!, 0.0001)
  }

  @Test
  fun `excludes a stalled failed request from throughput`() {
    // A healthy 1 MB download inside the span of a request that received a few bytes and then
    // stalled until the client gave up. Counting the stall would merge the two spans and report the
    // whole window as busy, which reads as a connection many times slower than the real one.
    val requests = listOf(
      makeRequest(
        responseBytesReceived = 1_000_000,
        fetchStart = Date(0),
        responseStart = Date(0),
        responseEnd = Date(1000)
      ),
      makeRequest(
        statusCode = null,
        errorDescription = "timeout",
        responseBytesReceived = 2000,
        fetchStart = Date(0),
        responseStart = Date(0),
        responseEnd = Date(30000)
      )
    )
    val summary = NetworkRequestSummary.from(requests)
    assertEquals(1_000_000.0, summary.throughputBytesPerSecond!!, 0.0001)
  }

  @Test
  fun `measures throughput over the transfer window, not the whole request`() {
    // 4 seconds waiting on the backend, then 1 kB delivered in 10ms. Charging the wait to the
    // network reports ~256 B/s for a connection that moved 1 kB in a hundredth of a second.
    val summary = NetworkRequestSummary.from(
      listOf(
        makeRequest(
          responseBytesReceived = 1024,
          fetchStart = Date(0),
          responseStart = Date(4000),
          responseEnd = Date(4010)
        )
      )
    )
    assertEquals(102_400.0, summary.throughputBytesPerSecond!!, 0.0001)
  }

  @Test
  fun `excludes a request whose end was never measured from throughput`() {
    // Headers arrived and then the request died, so `responseEnd` is the wall-clock moment the
    // snapshot was recorded rather than the last byte. Dividing by that window would describe the
    // recording delay: 100 kB over the 550ms fallback reads as 186 kB/s for a 50ms transfer.
    val summary = NetworkRequestSummary.from(
      listOf(
        makeRequest(
          responseBytesReceived = 102_400,
          fetchStart = Date(0),
          responseStart = Date(1000),
          responseEnd = Date(1550),
          endWasMeasured = false
        )
      )
    )
    assertNull(summary.throughputBytesPerSecond)
  }

  @Test
  fun `excludes a transfer too fast for the clock to measure`() {
    // `Date()` advances in whole milliseconds, so a sub-millisecond transfer records as a
    // zero-length window. iOS applies the same floor rather than dividing by the finer windows it
    // can resolve, so the two platforms agree on when the rate is unknown.
    val summary = NetworkRequestSummary.from(
      listOf(
        makeRequest(
          responseBytesReceived = 8192,
          fetchStart = Date(0),
          responseStart = Date(1),
          responseEnd = Date(1)
        )
      )
    )
    assertNull(summary.throughputBytesPerSecond)
  }

  @Test
  fun `excludes a cache hit from throughput`() {
    // A cached read reports its bytes from the task counters but never touches the network, so it
    // has no first-byte timestamp. Counting it would add megabytes to the numerator against the
    // few milliseconds it took to read from disk.
    val summary = NetworkRequestSummary.from(
      listOf(
        makeRequest(
          responseBytesReceived = 5_000_000,
          fetchStart = Date(0),
          responseStart = null,
          responseEnd = Date(20)
        ),
        makeRequest(
          responseBytesReceived = 100_000,
          fetchStart = Date(0),
          responseStart = Date(0),
          responseEnd = Date(1000)
        )
      )
    )
    assertEquals(100_000.0, summary.throughputBytesPerSecond!!, 0.0001)
  }

  @Test
  fun `merges partially overlapping requests into one busy span`() {
    // 0-2s and 1-3s overlap, so busy time is 3s rather than the 4s of summed duration.
    val requests = listOf(
      makeRequest(
        responseBytesReceived = 3000,
        fetchStart = Date(0),
        responseStart = Date(0),
        responseEnd = Date(2000)
      ),
      makeRequest(
        responseBytesReceived = 3000,
        fetchStart = Date(1000),
        responseStart = Date(1000),
        responseEnd = Date(3000)
      )
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
    // latency is already covered by `slowest.timeToFirstByte`.
    val requests = listOf(
      makeRequest(
        responseBytesReceived = 10000,
        fetchStart = Date(0),
        responseStart = Date(0),
        responseEnd = Date(1000)
      ),
      makeRequest(
        url = "https://httpbin.org/status/204",
        statusCode = 204,
        responseBytesReceived = 0,
        fetchStart = Date(1000),
        responseStart = Date(1000),
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
      makeRequest(
        responseBytesReceived = 10000,
        fetchStart = Date(0),
        responseStart = Date(0),
        responseEnd = Date(0)
      ),
      makeRequest(
        responseBytesReceived = 10000,
        fetchStart = Date(5000),
        responseStart = Date(5000),
        responseEnd = Date(6000)
      )
    )
    val summary = NetworkRequestSummary.from(requests)
    // Only the download's 10 kB over its own 1s span.
    assertEquals(10000.0, summary.throughputBytesPerSecond!!, 0.0001)
  }

  @Test
  fun `leaves throughput null when the only receiving request had no measurable span`() {
    val summary = NetworkRequestSummary.from(
      listOf(
        makeRequest(
          responseBytesReceived = 10000,
          fetchStart = Date(0),
          responseStart = Date(0),
          responseEnd = Date(0)
        )
      )
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
    assertNull(summary.slowest?.timeToFirstByte)
  }

  private fun makeRequest(
    url: String = "https://expo.dev/x",
    statusCode: Int? = 200,
    errorDescription: String? = null,
    requestBytesSent: Long? = 0,
    responseBytesReceived: Long? = 0,
    totalDuration: Double = 0.1,
    fetchStart: Date = Date(0),
    responseStart: Date? = null,
    responseEnd: Date? = Date(100),
    // Defaults to whatever `responseEnd` is so a test that doesn't care gets a transfer window
    // matching the span it set up. Pass `false` to model a request whose last byte was never
    // reported, which is what an unmeasured end looks like in production.
    endWasMeasured: Boolean = true
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
      measuredResponseEnd = if (endWasMeasured) responseEnd else null,
      totalDuration = totalDuration
    ),
    errorDescription = errorDescription,
    redirects = emptyList()
  )
}
