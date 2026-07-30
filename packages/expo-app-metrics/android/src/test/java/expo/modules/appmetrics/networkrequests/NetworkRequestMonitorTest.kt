package expo.modules.appmetrics.networkrequests

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.net.URI
import java.util.Date
import java.util.UUID

class NetworkRequestMonitorTest {
  @Test
  fun `records snapshots and fans out to delegates`() {
    val monitor = NetworkRequestMonitor()
    val collector = CollectingDelegate()
    monitor.addDelegate(collector)

    val snapshot = makeRequest()
    monitor.record(snapshot)

    assertEquals(1, monitor.recent.size)
    assertEquals(snapshot.id, monitor.recent.first().id)
    assertEquals(1, collector.completed.size)
  }

  @Test
  fun `recordStart fans out without touching the ring buffer`() {
    val monitor = NetworkRequestMonitor()
    val collector = CollectingDelegate()
    monitor.addDelegate(collector)

    val started = NetworkRequestStarted(UUID.randomUUID(), "https://expo.dev/x", "GET", Date())
    monitor.recordStart(started)

    assertEquals(1, collector.started.size)
    assertEquals(started.id, collector.started.first().id)
    assertTrue("ring buffer holds completed snapshots only", monitor.recent.isEmpty())
  }

  @Test
  fun `bounds the ring buffer to 200 entries`() {
    val monitor = NetworkRequestMonitor()
    for (i in 0 until 250) {
      monitor.record(makeRequest(url = "https://expo.dev/$i"))
    }
    assertEquals(200, monitor.recent.size)
    assertEquals("https://expo.dev/50", monitor.recent.first().url)
    assertEquals("https://expo.dev/249", monitor.recent.last().url)
  }

  @Test
  fun `summarize filters by fetchStart inclusive on both ends`() {
    val monitor = NetworkRequestMonitor()
    monitor.record(makeRequest(fetchStart = Date(0)))
    monitor.record(makeRequest(fetchStart = Date(50)))
    monitor.record(makeRequest(fetchStart = Date(100)))

    val summary = monitor.summarize(start = Date(10), end = Date(90))
    assertEquals(1, summary.count)
  }

  @Test
  fun `removeDelegate stops further fan-out`() {
    val monitor = NetworkRequestMonitor()
    val collector = CollectingDelegate()
    monitor.addDelegate(collector)
    monitor.removeDelegate(collector)

    monitor.record(makeRequest())
    assertEquals(0, collector.completed.size)
  }

  @Test
  fun `does not fan out events the delegate filters out`() {
    val monitor = NetworkRequestMonitor()
    val collector = FilteringDelegate(allowedHost = "api.expo.dev")
    monitor.addDelegate(collector)

    monitor.recordStart(
      NetworkRequestStarted(UUID.randomUUID(), "https://api.expo.dev/v2/sessions", "POST", Date())
    )
    monitor.recordStart(
      NetworkRequestStarted(UUID.randomUUID(), "https://cdn.example.com/asset.png", "GET", Date())
    )
    monitor.record(makeRequest(url = "https://api.expo.dev/v2/sessions"))
    monitor.record(makeRequest(url = "https://cdn.example.com/asset.png"))

    // Only the matching host reaches the delegate, on both the start and the completion path.
    assertEquals(1, collector.started.size)
    assertEquals("https://api.expo.dev/v2/sessions", collector.started.first().url)
    assertEquals(1, collector.completed.size)
    assertEquals("https://api.expo.dev/v2/sessions", collector.completed.first().url)
  }

  private fun makeRequest(
    url: String = "https://expo.dev/x",
    fetchStart: Date = Date()
  ): NetworkRequest = NetworkRequest(
    id = UUID.randomUUID(),
    url = url,
    method = "GET",
    statusCode = 200,
    networkProtocol = null,
    requestBytesSent = 0,
    responseBytesReceived = 0,
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
      responseEnd = null,
      totalDuration = 0.1
    ),
    errorDescription = null,
    redirects = emptyList()
  )

  private class CollectingDelegate : NetworkRequestObserverDelegate {
    val completed = mutableListOf<NetworkRequest>()
    val started = mutableListOf<NetworkRequestStarted>()

    override fun onNetworkRequestStarted(request: NetworkRequestStarted) {
      started.add(request)
    }

    override fun onNetworkRequestCompleted(request: NetworkRequest) {
      completed.add(request)
    }
  }

  /**
   * Collecting delegate that only accepts requests for a single host, exercising the monitor's
   * per-delegate `shouldObserveRequest` consult at the fan-out site.
   */
  private class FilteringDelegate(private val allowedHost: String) : NetworkRequestObserverDelegate {
    val completed = mutableListOf<NetworkRequest>()
    val started = mutableListOf<NetworkRequestStarted>()

    override fun shouldObserveRequest(url: String, method: String): Boolean = URI(url).host == allowedHost

    override fun onNetworkRequestStarted(request: NetworkRequestStarted) {
      started.add(request)
    }

    override fun onNetworkRequestCompleted(request: NetworkRequest) {
      completed.add(request)
    }
  }
}
