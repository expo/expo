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
  cancelled: Boolean = false,
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
  cancelled = cancelled,
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
  fun `records a cancelled request without a status or error type`() {
    // Intentional cancellations (AbortController, prefetch aborts) are routine in RN apps;
    // per the conventions they keep their span but are not errors.
    val span = makeSpan(
      makeRequest(
        statusCode = null,
        errorDescription = "Canceled",
        errorType = "java.io.IOException",
        cancelled = true
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
          statusCode = 301
        ),
        NetworkRequest.Redirect(
          fromUrl = "https://example.com/b",
          toUrl = "https://example.com/c",
          statusCode = 302
        )
      )
    )
    val events = JSONArray(checkNotNull(makeSpan(request).events))
    assertEquals(2, events.length())
    val first = events.getJSONObject(0)
    assertEquals("expo.http.redirect", first.getString("name"))
    val attributes = first.getJSONObject("attributes")
    assertEquals("https://example.com/a", attributes.getString("from"))
    assertEquals("https://example.com/b", attributes.getString("to"))
    assertEquals(301, attributes.getInt("statusCode"))
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
    assertTrue(database.spanDao().getAll().isEmpty())
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
    val rows = database.spanDao().getAll()
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
    assertEquals(1, database.spanDao().getAll().size)
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
    val rows = database.spanDao().getAll()
    assertEquals(1, rows.size)
    assertEquals("main-session", rows.single().sessionId)
    assertEquals("GET", rows.single().name)
  }

  @Test
  fun `installing on the monitor backfills buffered requests and persists new ones`() = runTest(testDispatcher) {
    // The interceptor installs at Application.onCreate, but persistence can only start once
    // the module created the session. Requests observed in between sit in the monitor's ring
    // buffer, so installation drains it — startup traffic is not lost.
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
    val rows = database.spanDao().getAll()
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
    assertEquals(listOf("GET", "POST"), database.spanDao().getAll().map { it.name })
  }

  @Test
  fun `a backfill cancelled before completing is retried by the next install`() = runTest(testDispatcher) {
    // A JS reload cancels the module scope the batch runs on. The drained-flag flips only on
    // completion, so the next install drains again instead of losing the buffer for good.
    insertSession("s")
    val monitor = NetworkRequestMonitor()
    monitor.record(makeRequest(method = "GET"))
    val cancelledScope = CoroutineScope(testDispatcher + Job())
    val first = NetworkRequestPersistence(
      database = database,
      scope = cancelledScope,
      sessionId = "s"
    )
    monitor.installPersistence(first)
    cancelledScope.cancel()
    testScheduler.advanceUntilIdle()
    assertTrue(database.spanDao().getAll().isEmpty())
    val second = NetworkRequestPersistence(
      database = database,
      scope = this,
      sessionId = "s"
    )
    monitor.installPersistence(second)
    testScheduler.advanceUntilIdle()
    assertEquals(listOf("GET"), database.spanDao().getAll().map { it.name })
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
    assertTrue(database.spanDao().getAll().isEmpty())
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
    assertEquals(1, database.spanDao().getAll().size)
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
    assertTrue(database.spanDao().getAll().isEmpty())
  }
}
