package expo.modules.appmetrics.networkrequests

import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import expo.modules.appmetrics.storage.MetricsDatabase
import expo.modules.appmetrics.storage.Session
import expo.modules.appmetrics.storage.Span
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.asExecutor
import kotlinx.coroutines.cancel
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.runTest
import org.json.JSONArray
import org.json.JSONObject
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.shadows.ShadowLog
import java.util.Date
import java.util.UUID

private val fixedStart = Date(1_782_131_895_000)

private fun makeTimings(
  fetchStart: Date? = fixedStart,
  responseEnd: Date? = Date(fixedStart.time + 250),
  totalDuration: Double = 0.25
) = NetworkRequest.Timings(
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
  measuredResponseEnd = responseEnd,
  totalDuration = totalDuration
)

private fun makeRequest(
  url: String = "https://api.example.com/v1/items?page=2",
  method: String = "GET",
  statusCode: Int? = 200,
  networkProtocol: String? = "h2",
  requestBytesSent: Long? = 412,
  responseBytesReceived: Long? = 8_192,
  timings: NetworkRequest.Timings = makeTimings(),
  errorDescription: String? = null,
  errorType: String? = null,
  canceled: Boolean = false,
  fetchType: NetworkRequest.FetchType? = NetworkRequest.FetchType.NETWORK,
  redirects: List<NetworkRequest.Redirect> = emptyList()
) = NetworkRequest(
  id = UUID.randomUUID(),
  url = url,
  method = method,
  statusCode = statusCode,
  networkProtocol = networkProtocol,
  requestBytesSent = requestBytesSent,
  responseBytesReceived = responseBytesReceived,
  timings = timings,
  errorDescription = errorDescription,
  errorType = errorType,
  canceled = canceled,
  fetchType = fetchType,
  redirects = redirects
)

private fun makeSpan(request: NetworkRequest): Span {
  return checkNotNull(request.toSpan(sessionId = "s"))
}

private fun attributes(span: Span): JSONObject {
  return JSONObject(checkNotNull(span.attributes))
}

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class NetworkRequestToSpanMappingTest {
  @Test
  fun `converts a completed request into a client span with millisecond timestamps`() {
    val span = makeSpan(makeRequest(method = "POST"))
    assertEquals("s", span.sessionId)
    assertEquals("POST", span.name)
    assertEquals(Span.CLIENT_KIND, span.kind)
    assertEquals(1_782_131_895_000, span.startTimestampMs)
    assertEquals(1_782_131_895_250, span.endTimestampMs)
    assertNull(span.parentSpanId)
    assertNull(span.events)
  }

  @Test
  fun `maps the HTTP semantic-convention attributes the server extracts to columns`() {
    val attributes = attributes(makeSpan(makeRequest()))
    assertEquals("GET", attributes.getString("http.request.method"))
    assertEquals(200, attributes.getInt("http.response.status_code"))
    assertEquals("https://api.example.com/v1/items?page=2", attributes.getString("url.full"))
    assertEquals("api.example.com", attributes.getString("server.address"))
    assertEquals(412L, attributes.getLong("http.request.size"))
    assertEquals(8_192L, attributes.getLong("http.response.size"))
  }

  @Test
  fun `normalizes the network protocol name to a semconv version`() {
    // OkHttp reports `http/1.1`, `h2`, `h3`; semconv's `network.protocol.version` wants the
    // bare version, and the server stores it in a LowCardinality column.
    val expected = mapOf(
      "http/1.1" to "1.1",
      "http/1.0" to "1.0",
      "h2" to "2",
      "h3" to "3"
    )
    for ((reported, version) in expected) {
      val attributes = attributes(makeSpan(makeRequest(networkProtocol = reported)))
      assertEquals(version, attributes.getString("network.protocol.version"))
    }
  }

  @Test
  fun `omits attributes that were never measured`() {
    // A request that died before headers has no status and no byte counts. Sending a
    // placeholder would be indistinguishable from a genuine zero.
    val request = makeRequest(
      statusCode = null,
      networkProtocol = null,
      requestBytesSent = null,
      responseBytesReceived = null
    )
    val attributes = attributes(makeSpan(request))
    assertFalse(attributes.has("http.response.status_code"))
    assertFalse(attributes.has("network.protocol.version"))
    assertFalse(attributes.has("http.request.size"))
    assertFalse(attributes.has("http.response.size"))
  }

  @Test
  fun `keeps ordinary query values but redacts the default-sensitive ones`() {
    // Redaction is the instrumentation's job per the conventions; signed-URL secrets must
    // never reach the on-device database. Ordinary parameters stay.
    val url = "https://api.example.com/search?q=hello&sig=secret&X-Amz-Signature=abc"
    val attributes = attributes(makeSpan(makeRequest(url = url)))
    assertEquals(
      "https://api.example.com/search?q=hello&sig=REDACTED&X-Amz-Signature=REDACTED",
      attributes.getString("url.full")
    )
  }

  @Test
  fun `redacts every default-sensitive query parameter of a presigned S3 URL`() {
    // The `url.full` convention lists five default-sensitive parameters. `X-Amz-Credential`
    // carries the access key id and `X-Amz-Security-Token` the session token; leaking either
    // is as bad as leaking the signature.
    val url = "https://bucket.s3.amazonaws.com/key" +
      "?X-Amz-Algorithm=AWS4-HMAC-SHA256" +
      "&X-Amz-Credential=AKIAEXAMPLE%2F20260907%2Fus-east-1%2Fs3%2Faws4_request" +
      "&X-Amz-Security-Token=session-token" +
      "&X-Amz-Signature=abc"
    val attributes = attributes(makeSpan(makeRequest(url = url)))
    assertEquals(
      "https://bucket.s3.amazonaws.com/key" +
        "?X-Amz-Algorithm=AWS4-HMAC-SHA256" +
        "&X-Amz-Credential=REDACTED" +
        "&X-Amz-Security-Token=REDACTED" +
        "&X-Amz-Signature=REDACTED",
      attributes.getString("url.full")
    )
  }

  @Test
  fun `redacts a sensitive parameter whose name is percent-encoded`() {
    // A server decodes `%73ig` back to `sig`, so a presigned URL spelled that way carries a real
    // secret. Matching the encoded name against the plain-text list would miss it.
    val url = "https://api.example.com/search?%73ig=secret&X%2DAmz%2DSignature=abc&q=hello"
    val attributes = attributes(makeSpan(makeRequest(url = url)))
    assertEquals(
      "https://api.example.com/search?%73ig=REDACTED&X%2DAmz%2DSignature=REDACTED&q=hello",
      attributes.getString("url.full")
    )
  }

  @Test
  fun `keeps query parameters in the order they were sent`() {
    // `url.full` is the key URL-level analysis groups on, so moving a redacted parameter to the
    // end splits one endpoint into several distinct strings, and diverges from iOS for the very
    // same request.
    val url = "https://api.example.com/search?sig=secret&q=hello&page=2"
    val attributes = attributes(makeSpan(makeRequest(url = url)))
    assertEquals(
      "https://api.example.com/search?sig=REDACTED&q=hello&page=2",
      attributes.getString("url.full")
    )
  }

  @Test
  fun `redacts every occurrence of a repeated sensitive parameter`() {
    // Both occurrences stay, each with its value replaced: collapsing them would report a URL
    // with fewer parameters than the app actually sent.
    val url = "https://api.example.com/search?sig=one&q=hello&sig=two"
    val attributes = attributes(makeSpan(makeRequest(url = url)))
    assertEquals(
      "https://api.example.com/search?sig=REDACTED&q=hello&sig=REDACTED",
      attributes.getString("url.full")
    )
  }

  @Test
  fun `leaves a valueless sensitive parameter alone`() {
    // `?sig` carries no secret to redact, and inventing a value for it would report a URL the
    // app never sent. iOS skips it for the same reason.
    val url = "https://api.example.com/search?sig&q=hello"
    val attributes = attributes(makeSpan(makeRequest(url = url)))
    assertEquals("https://api.example.com/search?sig&q=hello", attributes.getString("url.full"))
  }

  @Test
  fun `redacts userinfo credentials from the URL`() {
    val attributes = attributes(makeSpan(makeRequest(url = "https://user:pass@api.example.com/items")))
    assertEquals("https://REDACTED:REDACTED@api.example.com/items", attributes.getString("url.full"))
  }

  @Test
  fun `records the server port, defaulting from the scheme`() {
    assertEquals(8443, attributes(makeSpan(makeRequest(url = "https://api.example.com:8443/x"))).getInt("server.port"))
    assertEquals(443, attributes(makeSpan(makeRequest(url = "https://api.example.com/x"))).getInt("server.port"))
    assertEquals(80, attributes(makeSpan(makeRequest(url = "http://api.example.com/x"))).getInt("server.port"))
  }

  @Test
  fun `records how the response was fetched, and omits it when unknown`() {
    // A cache hit is timestamped and byte-counted like a download, so without this attribute a
    // 7 MB response read off disk in 100 ms looks like an impossible transfer rate. OkHttp also
    // distinguishes a conditional-GET revalidation, which iOS folds into its cache bucket.
    val cases = mapOf(
      NetworkRequest.FetchType.NETWORK to "network",
      NetworkRequest.FetchType.CACHE to "cache",
      NetworkRequest.FetchType.VALIDATED to "validated"
    )
    for ((fetchType, expected) in cases) {
      val attributes = attributes(makeSpan(makeRequest(fetchType = fetchType)))
      assertEquals(expected, attributes.getString("expo.http.resource.fetch_type"))
    }
    // A transport failure never produced a response, so nothing classified the fetch.
    val unknown = attributes(makeSpan(makeRequest(fetchType = null)))
    assertFalse(unknown.has("expo.http.resource.fetch_type"))
  }

  @Test
  fun `keeps the conventions' known methods verbatim`() {
    // The known set is RFC 9110's methods plus PATCH and QUERY. Each names the span and is
    // recorded as `http.request.method` as sent, with no `method_original`.
    for (method in listOf("GET", "HEAD", "POST", "PUT", "DELETE", "CONNECT", "OPTIONS", "TRACE", "PATCH", "QUERY")) {
      val span = makeSpan(makeRequest(method = method))
      val attributes = attributes(span)
      assertEquals(method, span.name)
      assertEquals(method, attributes.getString("http.request.method"))
      assertFalse("unexpected method_original for $method", attributes.has("http.request.method_original"))
    }
  }

  @Test
  fun `maps a nonstandard method to _OTHER and names the span HTTP`() {
    // Case-sensitive per the conventions: even a lowercase standard verb is not "known", so
    // caller-controlled method strings can't mint unbounded span names.
    for (method in listOf("PURGE", "get")) {
      val span = makeSpan(makeRequest(method = method))
      val attributes = attributes(span)
      assertEquals("HTTP", span.name)
      assertEquals("_OTHER", attributes.getString("http.request.method"))
      assertEquals(method, attributes.getString("http.request.method_original"))
    }
  }

  @Test
  fun `records a canceled request without a status or error type`() {
    // Intentional cancellations (AbortController, prefetch aborts) are routine in RN apps;
    // per the conventions they keep their span but are not errors.
    val span = makeSpan(
      makeRequest(
        statusCode = null,
        errorDescription = "Canceled",
        errorType = "java.io.IOException",
        canceled = true
      )
    )
    assertNull(span.statusCode)
    assertNull(span.statusMessage)
    assertFalse(attributes(span).has("error.type"))
  }

  @Test
  fun `leaves the status unset for a successful response`() {
    // Semconv: a client span for a 2xx response carries no explicit status.
    val span = makeSpan(makeRequest(statusCode = 200))
    assertNull(span.statusCode)
    assertNull(span.statusMessage)
  }

  @Test
  fun `marks 4xx and 5xx responses as errors`() {
    // Semconv makes any 4xx/5xx an error for a client span, unlike the server-span rule.
    for (statusCode in listOf(400, 404, 429, 500, 503)) {
      val span = makeSpan(makeRequest(statusCode = statusCode))
      assertEquals("expected ERROR for status $statusCode", Span.STATUS_ERROR, span.statusCode)
    }
  }

  @Test
  fun `marks a transport failure as an error with the description as the status message`() {
    // `errorDescription` is localized free text, so it belongs in the status message. The
    // low-cardinality `error.type` attribute gets a separate, predictable value.
    val span = makeSpan(
      makeRequest(
        statusCode = null,
        errorDescription = "Unable to resolve host",
        errorType = "java.net.UnknownHostException"
      )
    )
    assertEquals(Span.STATUS_ERROR, span.statusCode)
    assertEquals("Unable to resolve host", span.statusMessage)
    assertEquals("java.net.UnknownHostException", attributes(span).getString("error.type"))
  }

  @Test
  fun `sets the error type to the status code for an HTTP error response`() {
    // Semconv: when a request completes with an error status and no exception, `error.type`
    // is the status code as a string.
    val attributes = attributes(makeSpan(makeRequest(statusCode = 503)))
    assertEquals("503", attributes.getString("error.type"))
  }

  @Test
  fun `prefers the status code over an exception for the error type`() {
    // When the server answered with a 5xx and the transfer then failed, the status code is the
    // more useful low-cardinality value, and iOS resolves it the same way for the same request.
    val attributes = attributes(
      makeSpan(
        makeRequest(
          statusCode = 503,
          errorDescription = "stream closed",
          errorType = "java.io.IOException"
        )
      )
    )
    assertEquals("503", attributes.getString("error.type"))
  }

  @Test
  fun `omits the error type on success`() {
    val attributes = attributes(makeSpan(makeRequest(statusCode = 204)))
    assertFalse(attributes.has("error.type"))
  }

  @Test
  fun `maps each redirect hop onto an event`() {
    val request = makeRequest(
      redirects = listOf(
        NetworkRequest.Redirect(
          fromUrl = "https://example.com/a",
          toUrl = "https://example.com/b",
          statusCode = 301,
          respondedAtMs = 1_782_131_895_100
        ),
        NetworkRequest.Redirect(
          fromUrl = "https://example.com/b",
          toUrl = "https://example.com/c",
          statusCode = 302,
          respondedAtMs = null
        )
      )
    )
    // Event and attribute names follow the naming guidelines: application-specific names live
    // under the `expo.` namespace, and the hop's status reuses the registry's
    // `http.response.status_code`.
    val events = JSONArray(checkNotNull(makeSpan(request).events))
    assertEquals(2, events.length())
    val first = events.getJSONObject(0)
    assertEquals("expo.http.redirect", first.getString("name"))
    val attributes = first.getJSONObject("attributes")
    assertEquals("https://example.com/a", attributes.getString("expo.http.redirect.from"))
    assertEquals("https://example.com/b", attributes.getString("expo.http.redirect.to"))
    assertEquals(301, attributes.getInt("http.response.status_code"))
    assertEquals("unexpected attributes: ${attributes.keys().asSequence().sorted().toList()}", 3, attributes.length())
    // A hop's arrival time becomes the event time; without one the exporter anchors the event
    // to the span start, so the key is omitted rather than faked.
    assertEquals(1_782_131_895_100L, first.getLong("timeMs"))
    assertFalse(events.getJSONObject(1).has("timeMs"))
  }

  @Test
  fun `keeps redirect event times inside the span window`() {
    // A hop that the platform timed before the span's own start has no valid place on the
    // timeline: OTLP events must sit within their span. Rather than ship an event that precedes
    // its span, drop the time and let the exporter anchor the event to the span start.
    val request = makeRequest(
      redirects = listOf(
        NetworkRequest.Redirect(
          fromUrl = "https://example.com/a",
          toUrl = "https://example.com/b",
          statusCode = 301,
          respondedAtMs = fixedStart.time - 500
        ),
        NetworkRequest.Redirect(
          fromUrl = "https://example.com/b",
          toUrl = "https://example.com/c",
          statusCode = 302,
          respondedAtMs = fixedStart.time + 5_000
        )
      )
    )
    val events = JSONArray(checkNotNull(makeSpan(request).events))
    assertFalse(events.getJSONObject(0).has("timeMs"))
    assertFalse(events.getJSONObject(1).has("timeMs"))
  }

  @Test
  fun `derives a missing end timestamp from the total duration`() {
    // A snapshot recorded before the body finished can lack a response end; the row still
    // needs a usable window for the span.
    val timings = makeTimings(fetchStart = fixedStart, responseEnd = null, totalDuration = 1.5)
    val span = makeSpan(makeRequest(timings = timings))
    assertEquals(1_782_131_895_000, span.startTimestampMs)
    assertEquals(1_782_131_896_500, span.endTimestampMs)
  }

  @Test
  fun `returns null when the request carries no usable timestamps`() {
    // Without either endpoint of the window there is nothing to anchor a span to.
    val timings = makeTimings(fetchStart = null, responseEnd = null, totalDuration = 0.0)
    assertNull(makeRequest(timings = timings).toSpan(sessionId = "s"))
  }
}

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class NetworkRequestPersistenceTest {
  // Shared by `runTest` and Room's executors: persistence inserts are fire-and-forget, and
  // Room's suspending DAO calls hop to its executors, which live outside the test scheduler's
  // virtual time. Pinning them to the same scheduler makes `advanceUntilIdle` actually wait
  // for the inserts instead of racing them.
  private val testDispatcher = StandardTestDispatcher()

  private lateinit var database: MetricsDatabase

  @Before
  fun setUp() {
    // Surface swallowed persistence warnings in the test output.
    ShadowLog.stream = System.out
    val context = ApplicationProvider.getApplicationContext<Context>()
    database = Room
      .inMemoryDatabaseBuilder(context, MetricsDatabase::class.java)
      .allowMainThreadQueries()
      .setQueryExecutor(testDispatcher.asExecutor())
      .setTransactionExecutor(testDispatcher.asExecutor())
      .build()
  }

  @After
  fun tearDown() {
    database.close()
  }

  private suspend fun insertSession(id: String) {
    database.sessionDao().insert(
      Session(id = id, startTimestamp = "2026-08-13T10:00:00.000Z")
    )
  }

  private suspend fun allSpans() = database.spanDao().getSpans(afterId = -1, limit = Int.MAX_VALUE)

  @Test
  fun `drops every request while recording is disabled`() = runTest(testDispatcher) {
    insertSession("s")
    val persistence = NetworkRequestPersistence(
      database = database,
      scope = this,
      initialConfiguration = NetworkSpansConfiguration(enabled = false),
      sessionId = "s"
    )
    persistence.persist(makeRequest())
    testScheduler.advanceUntilIdle()
    assertTrue(allSpans().isEmpty())
  }

  @Test
  fun `records only requests matching the configured filter`() = runTest(testDispatcher) {
    insertSession("s")
    val persistence = NetworkRequestPersistence(
      database = database,
      scope = this,
      initialConfiguration = NetworkSpansConfiguration(enabled = true, hosts = listOf("API.myapp.com")),
      sessionId = "s"
    )
    persistence.persist(makeRequest(url = "https://api.example.com/skip"))
    persistence.persist(makeRequest(url = "https://api.myapp.com/keep"))
    testScheduler.advanceUntilIdle()
    val rows = allSpans()
    assertEquals(1, rows.size)
    val recordedUrl = JSONObject(checkNotNull(rows.single().attributes)).getString("url.full")
    assertEquals("https://api.myapp.com/keep", recordedUrl)
  }

  @Test
  fun `applies a configuration change to subsequent requests only`() = runTest(testDispatcher) {
    // "Applies forward": rows persisted before the change stay in the table and still dispatch.
    insertSession("s")
    val persistence = NetworkRequestPersistence(
      database = database,
      scope = this,
      sessionId = "s"
    )
    persistence.persist(makeRequest())
    testScheduler.advanceUntilIdle()
    persistence.setConfiguration(NetworkSpansConfiguration(enabled = false))
    persistence.persist(makeRequest())
    testScheduler.advanceUntilIdle()
    assertEquals(1, allSpans().size)
  }

  @Test
  fun `persists a completed request as a span attributed to the provided session`() = runTest(testDispatcher) {
    insertSession("main-session")
    val persistence = NetworkRequestPersistence(
      database = database,
      scope = this,
      sessionId = "main-session"
    )
    persistence.persist(makeRequest())
    testScheduler.advanceUntilIdle()
    val rows = allSpans()
    assertEquals(1, rows.size)
    assertEquals("main-session", rows.single().sessionId)
    assertEquals("GET", rows.single().name)
  }

  @Test
  fun `installing on the monitor backfills buffered requests and persists new ones`() = runTest(testDispatcher) {
    // The interceptor installs at Application.onCreate, but persistence can only start once
    // the module created the session. Requests observed in between sit in the monitor's ring
    // buffer, so installation drains it and startup traffic is not lost.
    insertSession("main-session")
    val monitor = NetworkRequestMonitor()
    monitor.record(makeRequest(method = "GET"))
    val persistence = NetworkRequestPersistence(
      database = database,
      scope = this,
      sessionId = "main-session"
    )
    monitor.installPersistence(persistence)
    monitor.record(makeRequest(method = "POST"))
    testScheduler.advanceUntilIdle()
    val rows = allSpans()
    assertEquals(listOf("GET", "POST"), rows.map { it.name })
  }

  @Test
  fun `reinstalling after a completed backfill does not re-drain the buffer`() = runTest(testDispatcher) {
    // The module reinstalls on every JS reload; a second drain would duplicate the buffered
    // startup requests under the new session id.
    insertSession("s")
    val monitor = NetworkRequestMonitor()
    monitor.record(makeRequest(method = "GET"))
    val first = NetworkRequestPersistence(
      database = database,
      scope = this,
      sessionId = "s"
    )
    monitor.installPersistence(first)
    testScheduler.advanceUntilIdle()
    monitor.uninstallPersistence(first)
    val second = NetworkRequestPersistence(
      database = database,
      scope = this,
      sessionId = "s"
    )
    monitor.installPersistence(second)
    monitor.record(makeRequest(method = "POST"))
    testScheduler.advanceUntilIdle()
    assertEquals(listOf("GET", "POST"), allSpans().map { it.name })
  }

  @Test
  fun `a backfill canceled before completing is retried by the next install`() = runTest(testDispatcher) {
    // A JS reload cancels the module scope the batch runs on. The drained-flag flips only on
    // completion, so the next install drains again instead of losing the buffer for good.
    insertSession("s")
    val monitor = NetworkRequestMonitor()
    monitor.record(makeRequest(method = "GET"))
    val canceledScope = CoroutineScope(testDispatcher + Job())
    val first = NetworkRequestPersistence(
      database = database,
      scope = canceledScope,
      sessionId = "s"
    )
    monitor.installPersistence(first)
    canceledScope.cancel()
    testScheduler.advanceUntilIdle()
    assertTrue(allSpans().isEmpty())
    val second = NetworkRequestPersistence(
      database = database,
      scope = this,
      sessionId = "s"
    )
    monitor.installPersistence(second)
    testScheduler.advanceUntilIdle()
    assertEquals(listOf("GET"), allSpans().map { it.name })
  }

  @Test
  fun `a backfill canceled midway through does not report completion`() = runTest(testDispatcher) {
    // Cancelling once the batch is inserting is the case a JS reload actually hits. Each
    // remaining insert then throws `CancellationException`, and swallowing those would run the
    // loop to the end and flip the drained flag, losing the buffered requests for good.
    insertSession("s")
    val monitor = NetworkRequestMonitor()
    repeat(3) { index ->
      monitor.record(makeRequest(method = "GET", url = "https://api.example.com/$index"))
    }
    val canceledScope = CoroutineScope(testDispatcher + Job())
    var reportedComplete = false
    val persistence = NetworkRequestPersistence(
      database = database,
      scope = canceledScope,
      sessionId = "s"
    )
    // Cancel from inside the loop's own iteration: `persistBuffered` walks this list, so
    // cancelling as the last element is produced makes the remaining inserts throw
    // `CancellationException` from within the loop. Swallowing those would let the loop finish
    // and report completion for a batch that never wrote its remaining rows.
    val buffered = monitor.recent
    var handed = 0
    val cancelingList = object : AbstractList<NetworkRequest>() {
      override val size = buffered.size
      override fun get(index: Int): NetworkRequest {
        handed++
        if (handed == buffered.size) {
          canceledScope.cancel()
        }
        return buffered[index]
      }
    }
    persistence.persistBuffered(cancelingList) { reportedComplete = true }
    testScheduler.advanceUntilIdle()
    assertFalse("a canceled batch must not report completion", reportedComplete)
  }

  @Test
  fun `requests completing between uninstall and the next install are not lost`() = runTest(testDispatcher) {
    // A production host recreation (an `expo-updates` reload) uninstalls persistence, then the
    // next module waits for its session row before installing. Requests landing in that window
    // reach the ring buffer but no live persistence, so without a re-drain they are never
    // written.
    insertSession("s")
    val monitor = NetworkRequestMonitor()
    // A startup request, so the first install drains a real buffer and marks it drained.
    monitor.record(makeRequest(method = "GET", url = "https://api.example.com/startup"))
    val first = NetworkRequestPersistence(database = database, scope = this, sessionId = "s")
    monitor.installPersistence(first)
    testScheduler.advanceUntilIdle()
    monitor.uninstallPersistence(first)

    monitor.record(makeRequest(method = "GET", url = "https://api.example.com/in-window"))
    testScheduler.advanceUntilIdle()

    val second = NetworkRequestPersistence(database = database, scope = this, sessionId = "s")
    monitor.installPersistence(second)
    testScheduler.advanceUntilIdle()
    val urls = allSpans().map { JSONObject(checkNotNull(it.attributes)).getString("url.full") }
    assertTrue("the in-window request must reach the table, got $urls", urls.any { it.endsWith("/in-window") })
  }

  @Test
  fun `a live-persisted request is not re-persisted by the next install`() = runTest(testDispatcher) {
    // `record` writes a request through the installed persistence immediately. A later install
    // must not drain it again from the ring buffer, or every JS reload duplicates every request
    // still in the buffer, each copy under a fresh span id the server cannot dedupe.
    insertSession("s")
    val monitor = NetworkRequestMonitor()
    val first = NetworkRequestPersistence(
      database = database,
      scope = this,
      sessionId = "s"
    )
    monitor.installPersistence(first)
    testScheduler.advanceUntilIdle()
    // Persisted live, while a persistence is installed.
    monitor.record(makeRequest(method = "GET", url = "https://api.example.com/live"))
    testScheduler.advanceUntilIdle()
    monitor.uninstallPersistence(first)

    val second = NetworkRequestPersistence(
      database = database,
      scope = this,
      sessionId = "s"
    )
    monitor.installPersistence(second)
    testScheduler.advanceUntilIdle()
    val live = allSpans().count {
      JSONObject(checkNotNull(it.attributes)).getString("url.full").endsWith("/live")
    }
    assertEquals("a live-persisted request must be written exactly once", 1, live)
  }

  @Test
  fun `a drained request is not re-drained after aging out of the buffer`() = runTest(testDispatcher) {
    // A request that both drained and then aged out of the ring buffer must not be written
    // again by a later install.
    insertSession("s")
    val monitor = NetworkRequestMonitor(recentCapacity = 2)
    monitor.record(makeRequest(method = "GET", url = "https://api.example.com/first"))
    val first = NetworkRequestPersistence(
      database = database,
      scope = this,
      sessionId = "s"
    )
    // Install starts the drain, then uninstall immediately: the next two requests arrive with no
    // persistence installed, so they only reach the ring buffer and push `/first` out of it
    // before the batch's completion callback runs.
    monitor.installPersistence(first)
    monitor.uninstallPersistence(first)
    monitor.record(makeRequest(method = "GET", url = "https://api.example.com/second"))
    monitor.record(makeRequest(method = "GET", url = "https://api.example.com/third"))
    testScheduler.advanceUntilIdle()

    val second = NetworkRequestPersistence(
      database = database,
      scope = this,
      sessionId = "s"
    )
    monitor.installPersistence(second)
    testScheduler.advanceUntilIdle()
    val firstCount = allSpans().count {
      JSONObject(checkNotNull(it.attributes)).getString("url.full").endsWith("/first")
    }
    assertEquals("the evicted request must not be written twice", 1, firstCount)
  }

  @Test
  fun `eviction prunes the drained set so it stays bounded by the buffer`() = runTest(testDispatcher) {
    // The drained set exists only to suppress a re-drain of ids a later install could still see
    // in the ring buffer, so eviction has to forget the evicted id. Without that the set grows
    // for the life of the process, one UUID per request.
    insertSession("s")
    val monitor = NetworkRequestMonitor(recentCapacity = 2)
    val persistence = NetworkRequestPersistence(
      database = database,
      scope = this,
      sessionId = "s"
    )
    monitor.installPersistence(persistence)
    testScheduler.advanceUntilIdle()
    for (i in 0 until 20) {
      monitor.record(makeRequest(method = "GET", url = "https://api.example.com/$i"))
    }
    testScheduler.advanceUntilIdle()
    assertEquals("the buffer must stay at its capacity", 2, monitor.recent.size)
    assertEquals(
      "the drained set must not outgrow the buffer it guards",
      2,
      monitor.drainedRequestIdCount
    )
  }

  @Test
  fun `overflow while persistence is installed does not re-drain the survivors`() = runTest(testDispatcher) {
    // Every request here is written live and marked, then all but the last two are evicted. The
    // marks that eviction drops belong to rows already on disk, so a reinstall that rescans the
    // buffer must still find nothing to drain.
    insertSession("s")
    val monitor = NetworkRequestMonitor(recentCapacity = 2)
    val first = NetworkRequestPersistence(
      database = database,
      scope = this,
      sessionId = "s"
    )
    monitor.installPersistence(first)
    testScheduler.advanceUntilIdle()
    for (i in 0 until 10) {
      monitor.record(makeRequest(method = "GET", url = "https://api.example.com/$i"))
    }
    testScheduler.advanceUntilIdle()
    monitor.uninstallPersistence(first)

    val second = NetworkRequestPersistence(
      database = database,
      scope = this,
      sessionId = "s"
    )
    monitor.installPersistence(second)
    testScheduler.advanceUntilIdle()
    val urls = allSpans().map { JSONObject(checkNotNull(it.attributes)).getString("url.full") }
    assertEquals("every request must be written exactly once, got $urls", 10, urls.size)
    assertEquals("no request may be written twice, got $urls", 10, urls.toSet().size)
  }

  @Test
  fun `an uninstalled persistence receives no further requests`() = runTest(testDispatcher) {
    insertSession("s")
    val monitor = NetworkRequestMonitor()
    val persistence = NetworkRequestPersistence(
      database = database,
      scope = this,
      sessionId = "s"
    )
    monitor.installPersistence(persistence)
    monitor.uninstallPersistence(persistence)
    monitor.record(makeRequest())
    testScheduler.advanceUntilIdle()
    assertTrue(allSpans().isEmpty())
  }

  @Test
  fun `uninstalling a stale instance leaves its replacement installed`() = runTest(testDispatcher) {
    // A late-arriving OnDestroy from the torn-down module must not remove the instance the
    // next module installed.
    insertSession("s")
    val monitor = NetworkRequestMonitor()
    val stale = NetworkRequestPersistence(
      database = database,
      scope = this,
      sessionId = "s"
    )
    monitor.installPersistence(stale)
    val replacement = NetworkRequestPersistence(
      database = database,
      scope = this,
      sessionId = "s"
    )
    monitor.installPersistence(replacement)
    monitor.uninstallPersistence(stale)
    monitor.record(makeRequest())
    testScheduler.advanceUntilIdle()
    assertEquals(1, allSpans().size)
  }

  @Test
  fun `drops a request whose session row does not exist yet`() = runTest(testDispatcher) {
    // The sessions FK protects referential integrity; persistence must degrade to a dropped
    // row rather than throw into the monitor's record path.
    val persistence = NetworkRequestPersistence(
      database = database,
      scope = this,
      sessionId = "never-inserted"
    )
    persistence.persist(makeRequest())
    testScheduler.advanceUntilIdle()
    assertTrue(allSpans().isEmpty())
  }
}
