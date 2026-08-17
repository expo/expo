package expo.modules.appmetrics.networkrequests

import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import okhttp3.mockwebserver.SocketPolicy
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import java.io.IOException

/**
 * End-to-end interceptor tests driven through OkHttp's `MockWebServer`. Each test installs a
 * dedicated `NetworkRequestMonitor` (via `NetworkRequestInterceptor.forTesting`) so assertions
 * aren't polluted by the process-wide singleton.
 */
class NetworkRequestInterceptorTest {
  private lateinit var server: MockWebServer
  private lateinit var monitor: NetworkRequestMonitor
  private lateinit var client: OkHttpClient

  @Before
  fun setUp() {
    server = MockWebServer().apply { start() }
    monitor = NetworkRequestMonitor()
    client = OkHttpClient.Builder()
      .addInterceptor(NetworkRequestInterceptor.forTesting(monitor))
      .eventListenerFactory(NetworkRequestEventListener.factory)
      .build()
  }

  @After
  fun tearDown() {
    server.shutdown()
  }

  @Test
  fun `records a successful response`() {
    server.enqueue(MockResponse().setResponseCode(200).setBody("hello"))

    val response = client.newCall(Request.Builder().url(server.url("/hello")).build()).execute()
    val body = response.body!!.string()
    response.close()

    assertEquals("hello", body)
    assertEquals(1, monitor.recent.size)
    val snapshot = monitor.recent.first()
    assertEquals(200, snapshot.statusCode)
    assertEquals("GET", snapshot.method)
    assertNull(snapshot.errorDescription)
    assertTrue(snapshot.redirects.isEmpty())
  }

  @Test
  fun `records a non-2xx response without throwing`() {
    server.enqueue(MockResponse().setResponseCode(500).setBody("oops"))

    val response = client.newCall(Request.Builder().url(server.url("/fail")).build()).execute()
    response.close()

    assertEquals(1, monitor.recent.size)
    assertEquals(500, monitor.recent.first().statusCode)
    // The summary's isFailed predicate flips for non-2xx so the TTI rollup counts it.
    assertEquals(1, NetworkRequestSummary.from(monitor.recent).failed)
  }

  @Test
  fun `records an error description when the request throws`() {
    // Shut the server down before issuing the request to provoke an IOException at connect time.
    val deadUrl = server.url("/dead")
    server.shutdown()

    var thrown = false
    try {
      client.newCall(Request.Builder().url(deadUrl).build()).execute()
    } catch (_: IOException) {
      thrown = true
    }
    assertTrue("the network call should throw", thrown)
    assertEquals(1, monitor.recent.size)
    val snapshot = monitor.recent.first()
    assertNull(snapshot.statusCode)
    assertNotNull(snapshot.errorDescription)

    // Re-create the server so the @After teardown's shutdown call doesn't trip on a closed socket.
    server = MockWebServer().apply { start() }
  }

  @Test
  fun `records a body that breaks mid-transfer as failed`() {
    // Headers arrive and the body is cut off partway. The interceptor's own catch only wraps
    // `chain.proceed`, which has already returned by then, so without the listener's report this
    // lands as a clean 200 and the broken transfer is counted as a success.
    server.enqueue(
      MockResponse()
        .setResponseCode(200)
        .setBody("x".repeat(1024))
        .setSocketPolicy(SocketPolicy.DISCONNECT_DURING_RESPONSE_BODY)
    )

    var thrown = false
    try {
      val response = client.newCall(Request.Builder().url(server.url("/truncated")).build()).execute()
      response.body!!.string()
    } catch (_: Exception) {
      thrown = true
    }
    assertTrue("the body read should fail", thrown)
    assertEquals(1, monitor.recent.size)
    val snapshot = monitor.recent.first()
    assertNotNull("a broken transfer should carry an error", snapshot.errorDescription)
    assertTrue("a broken transfer should count as failed", snapshot.isFailed)
  }

  @Test
  fun `treats a message-less failure as failed`() {
    // `SocketException()` carries no message at all, so a snapshot keyed off the description alone
    // would keep the 200 the headers arrived with and report a broken transfer as a success. This
    // is the only path where a null description isn't already caught by a missing status code.
    val request = Request.Builder().url("https://expo.dev/x").build()
    val response = okhttp3.Response.Builder()
      .request(request)
      .protocol(okhttp3.Protocol.HTTP_1_1)
      .code(200)
      .message("OK")
      .build()
    val snapshot = buildSnapshot(
      id = java.util.UUID.randomUUID(),
      originalRequest = request,
      response = response,
      phases = null,
      fallbackStart = java.util.Date(0),
      fallbackEnd = java.util.Date(100),
      totalDuration = 0.1,
      error = java.net.SocketException()
    )
    assertTrue("a message-less failure should still count as failed", snapshot.isFailed)
  }

  @Test
  fun `reconstructs a redirect chain in chronological order`() {
    server.enqueue(MockResponse().setResponseCode(302).setHeader("Location", "/b"))
    server.enqueue(MockResponse().setResponseCode(301).setHeader("Location", "/c"))
    server.enqueue(MockResponse().setResponseCode(200).setBody("final"))

    val response = client.newCall(Request.Builder().url(server.url("/a")).build()).execute()
    response.close()

    assertEquals(1, monitor.recent.size)
    val redirects = monitor.recent.first().redirects
    assertEquals(2, redirects.size)
    // First hop: /a returned 302 pointing at /b.
    assertTrue(redirects[0].fromUrl.endsWith("/a"))
    assertTrue(redirects[0].toUrl.endsWith("/b"))
    assertEquals(302, redirects[0].statusCode)
    // Second hop: /b returned 301 pointing at /c.
    assertTrue(redirects[1].fromUrl.endsWith("/b"))
    assertTrue(redirects[1].toUrl.endsWith("/c"))
    assertEquals(301, redirects[1].statusCode)
  }

  @Test
  fun `records request bytes that include the body payload`() {
    server.enqueue(MockResponse().setResponseCode(200))

    val payload = "{\"hello\":\"world\"}"
    val request = Request.Builder()
      .url(server.url("/echo"))
      .post(payload.toRequestBody())
      .build()
    val response = client.newCall(request).execute()
    response.close()

    val snapshot = monitor.recent.first()
    // Wire bytes sent = headers + body. Headers vary by OkHttp version, so assert via the
    // weaker invariant: it's at least the body length plus *some* header overhead.
    val sent = snapshot.requestBytesSent!!
    assertTrue("expected at least payload bytes, got $sent", sent >= payload.length)
  }

  @Test
  fun `records response bytes that include the body length`() {
    val body = "x".repeat(1024)
    server.enqueue(MockResponse().setResponseCode(200).setBody(body))

    val response = client.newCall(Request.Builder().url(server.url("/big")).build()).execute()
    response.body!!.string()
    response.close()

    val snapshot = monitor.recent.first()
    val received = snapshot.responseBytesReceived!!
    assertTrue("expected at least body length, got $received", received >= body.length)
  }

  @Test
  fun `records response bytes for a chunked body with no declared length`() {
    val body = "x".repeat(4096)
    server.enqueue(
      MockResponse()
        .setResponseCode(200)
        .setChunkedBody(body, 512)
    )

    val response = client.newCall(Request.Builder().url(server.url("/chunked")).build()).execute()
    response.body!!.string()
    response.close()

    val snapshot = monitor.recent.first()
    val received = snapshot.responseBytesReceived!!
    // A chunked response declares no Content-Length, so the `contentLength()` fallback is -1.
    // The count has to come from the event listener; without it we'd silently report headers only.
    assertTrue("expected at least body length, got $received", received >= body.length)
  }

  @Test
  fun `reports unknown response bytes rather than a headers-only count`() {
    server.enqueue(
      MockResponse()
        .setResponseCode(200)
        .setChunkedBody("y".repeat(2048), 256)
    )

    // Never drain the body: `responseBodyEnd` won't fire, so no byte count is available. The
    // snapshot has to say "unknown" instead of reporting the header estimate as a measurement,
    // which would both understate totals and let the request into the throughput denominator.
    val response = client.newCall(Request.Builder().url(server.url("/abandoned")).build()).execute()
    response.close()

    val snapshot = monitor.recent.first()
    assertNull(
      "expected unknown byte count, got ${snapshot.responseBytesReceived}",
      snapshot.responseBytesReceived
    )
  }

  @Test
  fun `internal opt-out header skips observation and is stripped from the outgoing request`() {
    server.enqueue(MockResponse().setResponseCode(200))

    val request = Request.Builder()
      .url(server.url("/internal"))
      .addHeader(INTERNAL_HEADER_NAME, "1")
      .build()
    client.newCall(request).execute().close()

    assertTrue("internal requests must not land in the monitor", monitor.recent.isEmpty())
    // The server should have received the request *without* our internal header.
    val recorded = server.takeRequest()
    assertNull(recorded.getHeader(INTERNAL_HEADER_NAME))
  }

  @Test
  fun `does not re-observe when chain already carries the marker`() {
    server.enqueue(MockResponse().setResponseCode(200))
    server.enqueue(MockResponse().setResponseCode(200))

    // Install two interceptors on the same monitor, simulating an app that adds our public
    // interceptor on top of a client we already factory-injected. The second pass must
    // short-circuit.
    val doubleClient = OkHttpClient.Builder()
      .addInterceptor(NetworkRequestInterceptor.forTesting(monitor))
      .addInterceptor(NetworkRequestInterceptor.forTesting(monitor))
      .build()

    doubleClient.newCall(Request.Builder().url(server.url("/once")).build()).execute().close()
    assertEquals(1, monitor.recent.size)
  }

  @Test
  fun `delegate receives both started and completed events with matching ids`() {
    server.enqueue(MockResponse().setResponseCode(200).setBody("ok"))

    val collector = CollectingDelegate()
    monitor.addDelegate(collector)

    val response = client.newCall(Request.Builder().url(server.url("/end-to-end")).build()).execute()
    response.body!!.string()
    response.close()

    // Started fires from the interceptor before the network call; completed fires after the
    // response body closes. Both should reach the delegate.
    assertEquals(1, collector.started.size)
    assertEquals(1, collector.completed.size)
    // The ids match — that's the contract JS code uses to correlate the two events.
    assertEquals(collector.started.first().id, collector.completed.first().id)
    assertEquals("GET", collector.started.first().method)
    assertEquals(200, collector.completed.first().statusCode)
  }

  @Test
  fun `body must be closed before the completed event fires`() {
    server.enqueue(MockResponse().setResponseCode(200).setBody("hello"))

    val collector = CollectingDelegate()
    monitor.addDelegate(collector)

    val response = client.newCall(Request.Builder().url(server.url("/lazy")).build()).execute()
    // The started event has fired, but the completed event must wait for the response body to be
    // drained or closed — until then the byte counters on the counting wrapper are still moving.
    assertEquals(1, collector.started.size)
    assertEquals(0, collector.completed.size)

    response.body!!.string()
    response.close()

    assertEquals(1, collector.completed.size)
  }

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
}
