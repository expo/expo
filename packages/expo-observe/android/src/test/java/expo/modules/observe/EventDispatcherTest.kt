package expo.modules.observe

import android.content.Context
import expo.modules.easclient.EASClientID
import io.mockk.*
import kotlinx.coroutines.test.runTest
import okhttp3.OkHttpClient
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.json.JSONObject
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.util.UUID

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class EventDispatcherTest {
  private lateinit var mockServer: MockWebServer
  private lateinit var mockContext: Context
  private lateinit var eventDispatcher: EventDispatcher
  private lateinit var httpClient: OkHttpClient
  private val testProjectId = "test-project-123"
  private val testEasClientId = UUID.randomUUID()

  @Before
  fun setUp() {
    // Setup MockWebServer
    mockServer = MockWebServer()
    mockServer.start()

    // Create a real OkHttpClient for testing
    httpClient = OkHttpClient()

    // Mock Android Context
    mockContext = mockk(relaxed = true)

    // Mock EASClientID to return a predictable UUID
    mockkConstructor(EASClientID::class)
    every { anyConstructed<EASClientID>().uuid } returns testEasClientId

    // Create EventDispatcher with test dependencies
    eventDispatcher = EventDispatcher(
      context = mockContext,
      projectId = testProjectId,
      httpClient = httpClient,
      baseUrl = mockServer.url("/").toString()
    )
  }

  @After
  fun tearDown() {
    mockServer.shutdown()
    unmockkAll()
  }

  @Test
  fun `dispatch returns Success on 200 response`() =
    runTest {
      // Arrange
      mockServer.enqueue(
        MockResponse()
          .setResponseCode(200)
          .setBody("""{"eventsProcessed":1,"metricsInserted":13}""")
      )

      val events = listOf(createTestEvent())

      // Act
      val result = eventDispatcher.dispatch(events)

      // Assert
      assertEquals(DispatchResult.Success, result)
      assertEquals(1, mockServer.requestCount)

      val request = mockServer.takeRequest()
      assertEquals("POST", request.method)
      assertTrue(request.path?.contains(testProjectId) == true)
      assertEquals("application/json; charset=utf-8", request.getHeader("Content-Type"))
      assertNotNull(request.body)
    }

  @Test
  fun `dispatch returns Success on 201 response`() =
    runTest {
      // Arrange
      mockServer.enqueue(
        MockResponse()
          .setResponseCode(201)
          .setBody("""{"status": "created"}""")
      )

      val events = listOf(createTestEvent())

      // Act
      val result = eventDispatcher.dispatch(events)

      // Assert
      assertEquals(DispatchResult.Success, result)
    }

  @Test
  fun `dispatch returns Success on empty event list without hitting the network`() =
    runTest {
      // Empty input is a no-op; we still report Success so the caller treats it as "nothing
      // to do" rather than as a transient failure to retry.
      val emptyEvents = emptyList<Event>()

      // Act
      val result = eventDispatcher.dispatch(emptyEvents)

      // Assert
      assertEquals(DispatchResult.Success, result)
      assertEquals(0, mockServer.requestCount)
    }

  @Test
  fun `dispatch returns NonRetryable on 400 error response`() =
    runTest {
      // Arrange
      mockServer.enqueue(
        MockResponse()
          .setResponseCode(400)
          .setBody("""{"error": "Bad Request"}""")
      )

      val events = listOf(createTestEvent())

      // Act
      val result = eventDispatcher.dispatch(events)

      // Assert
      assertTrue("expected NonRetryable, got $result", result is DispatchResult.NonRetryable)
      assertTrue((result as DispatchResult.NonRetryable).reason.contains("400"))
      assertEquals(1, mockServer.requestCount)
    }

  @Test
  fun `dispatch returns NonRetryable on 500 server error`() =
    runTest {
      // 500 is NOT in OTLP's retryable list — only 408/429/502/503/504 are. 500 means an
      // internal server error we can't reason about, so we drop the batch.
      mockServer.enqueue(
        MockResponse()
          .setResponseCode(500)
          .setBody("""{"error": "Internal Server Error"}""")
      )

      val events = listOf(createTestEvent())

      // Act
      val result = eventDispatcher.dispatch(events)

      // Assert
      assertTrue("expected NonRetryable, got $result", result is DispatchResult.NonRetryable)
      assertEquals(1, mockServer.requestCount)
    }

  @Test
  fun `dispatch returns Retryable on 503 with Retry-After header`() =
    runTest {
      mockServer.enqueue(
        MockResponse()
          .setResponseCode(503)
          .setHeader("Retry-After", "5")
          .setBody("""{"error": "Service Unavailable"}""")
      )

      val events = listOf(createTestEvent())

      val result = eventDispatcher.dispatch(events)

      assertTrue("expected Retryable, got $result", result is DispatchResult.Retryable)
      assertEquals(5_000L, (result as DispatchResult.Retryable).retryAfterMs)
    }

  @Test
  fun `dispatch returns Retryable on 429 without Retry-After`() =
    runTest {
      mockServer.enqueue(
        MockResponse()
          .setResponseCode(429)
          .setBody("""{"error": "Too Many Requests"}""")
      )

      val result = eventDispatcher.dispatch(listOf(createTestEvent()))

      assertTrue("expected Retryable, got $result", result is DispatchResult.Retryable)
      assertEquals(null, (result as DispatchResult.Retryable).retryAfterMs)
    }

  @Test
  fun `dispatch includes the easClientId as a resource attribute`() =
    runTest {
      // Arrange
      mockServer.enqueue(
        MockResponse()
          .setResponseCode(200)
          .setBody("""{"eventsProcessed":1,"metricsInserted":13}""")
      )

      val events = listOf(createTestEvent())

      // Act
      eventDispatcher.dispatch(events)

      // Assert
      val request = mockServer.takeRequest()
      val requestBody = request.body.readUtf8()
      val json = JSONObject(requestBody)
      val resource = json.getJSONArray("resourceMetrics").getJSONObject(0).getJSONObject("resource")
      val attributes = resource.getJSONArray("attributes")

      val clientIdAttribute = (0 until attributes.length())
        .map { attributes.getJSONObject(it) }
        .first { it.getString("key") == "expo.eas_client.id" }
      assertEquals(
        testEasClientId.toString(),
        clientIdAttribute.getJSONObject("value").getString("stringValue")
      )
    }

  @Test
  fun `dispatch sends multiple events in single request`() =
    runTest {
      // Arrange
      mockServer.enqueue(
        MockResponse()
          .setResponseCode(200)
          .setBody("""{"eventsProcessed":1,"metricsInserted":13}""")
      )

      val events = listOf(
        createTestEvent(metricName = "metric1"),
        createTestEvent(metricName = "metric2"),
        createTestEvent(metricName = "metric3")
      )

      // Act
      val result = eventDispatcher.dispatch(events)

      // Assert
      assertEquals(DispatchResult.Success, result)
      assertEquals(1, mockServer.requestCount)

      val request = mockServer.takeRequest()
      val requestBody = request.body.readUtf8()
      val json = JSONObject(requestBody)
      val resourceMetrics = json.getJSONArray("resourceMetrics")

      assertEquals(3, resourceMetrics.length())
    }

  @Test
  fun `dispatch constructs correct endpoint URL`() =
    runTest {
      // Arrange
      mockServer.enqueue(
        MockResponse()
          .setResponseCode(200)
          .setBody("""{"eventsProcessed":1,"metricsInserted":13}""")
      )

      val events = listOf(createTestEvent())

      // Act
      eventDispatcher.dispatch(events)

      // Assert
      val request = mockServer.takeRequest()
      assertEquals("/$testProjectId/v1/metrics", request.path)
    }

  @Test
  fun `dispatch returns Retryable on network failure`() =
    runTest {
      // Transport-level errors (DNS, TLS, timeouts, connection reset) are transient by
      // definition — fold them into Retryable(null) so the next dispatch round picks the
      // batch up again instead of crashing the WorkManager job.
      mockServer.shutdown() // Shutdown server to simulate network failure

      val events = listOf(createTestEvent())

      val result = eventDispatcher.dispatch(events)

      assertTrue("expected Retryable, got $result", result is DispatchResult.Retryable)
      assertEquals(null, (result as DispatchResult.Retryable).retryAfterMs)
    }

  @Test
  fun `dispatch maps metadata to OTel resource attributes`() =
    runTest {
      // Arrange
      mockServer.enqueue(
        MockResponse()
          .setResponseCode(200)
          .setBody("""{"eventsProcessed":1,"metricsInserted":13}""")
      )

      val metadata = Metadata(
        appName = "TestApp",
        appIdentifier = "com.test.app",
        appVersion = "1.0.0",
        appBuildNumber = "100",
        appEasBuildId = null,
        appUpdatesInfo = null,
        languageTag = "en-US",
        deviceOs = "Android",
        deviceOsVersion = "14",
        deviceModel = "Pixel 8",
        deviceName = "TestDevice",
        expoSdkVersion = "52.0.0",
        reactNativeVersion = "0.76.0",
        clientVersion = "1.0.0"
      )

      val metric = EASMetric(
        sessionId = "session-123",
        timestamp = "2025-11-26T10:00:00.000Z",
        category = "performance",
        name = "app_start",
        value = 1500.0
      )

      val events = listOf(Event(metadata = metadata, metrics = listOf(metric)))

      // Act
      eventDispatcher.dispatch(events)

      // Assert
      val request = mockServer.takeRequest()
      val requestBody = request.body.readUtf8()
      val json = JSONObject(requestBody)
      val resource = json.getJSONArray("resourceMetrics").getJSONObject(0).getJSONObject("resource")
      val attributes = resource.getJSONArray("attributes")

      val stringAttributes = (0 until attributes.length())
        .map { attributes.getJSONObject(it) }
        .associate { it.getString("key") to it.getJSONObject("value").getString("stringValue") }

      assertEquals("com.test.app", stringAttributes["service.name"])
      assertEquals("1.0.0", stringAttributes["service.version"])
      assertEquals("100", stringAttributes["expo.app.build_number"])
      assertEquals("en-US", stringAttributes["browser.language"])
      assertEquals("Android", stringAttributes["os.name"])
      assertEquals("14", stringAttributes["os.version"])
      assertEquals("Pixel 8", stringAttributes["device.model.identifier"])
      assertEquals("TestDevice", stringAttributes["device.model.name"])
      assertEquals("52.0.0", stringAttributes["expo.sdk.version"])
      assertEquals("0.76.0", stringAttributes["expo.react_native.version"])
      assertEquals("1.0.0", stringAttributes["telemetry.sdk.version"])
      assertEquals("TestApp", stringAttributes["expo.app.name"])
    }

  @Test
  fun `dispatch handles 299 response as Success`() =
    runTest {
      // Arrange
      mockServer.enqueue(
        MockResponse()
          .setResponseCode(299)
          .setBody("""{"eventsProcessed":1,"metricsInserted":13}""")
      )

      val events = listOf(createTestEvent())

      // Act
      val result = eventDispatcher.dispatch(events)

      // Assert
      assertEquals(DispatchResult.Success, result)
    }

  @Test
  fun `dispatch returns NonRetryable on 200 with partial_success that rejected records`() =
    runTest {
      // A 2xx body that includes `partialSuccess` with rejectedDataPoints > 0 means the
      // collector permanently refused those rows. Treat as NonRetryable so the caller drops
      // them instead of looping.
      mockServer.enqueue(
        MockResponse()
          .setResponseCode(200)
          .setBody("""{"partialSuccess":{"rejectedDataPoints":3,"errorMessage":"metric_kind_mismatch"}}""")
      )

      val result = eventDispatcher.dispatch(listOf(createTestEvent()))

      assertTrue("expected NonRetryable, got $result", result is DispatchResult.NonRetryable)
      assertTrue((result as DispatchResult.NonRetryable).reason.contains("rejected 3"))
      assertTrue(result.reason.contains("metric_kind_mismatch"))
    }

  // Helper function to create test events
  private fun createTestEvent(metricName: String = "test_metric"): Event {
    val metadata = Metadata(
      appName = "TestApp",
      appIdentifier = "com.test.app",
      appVersion = "1.0.0",
      appBuildNumber = "1",
      appEasBuildId = null,
      appUpdatesInfo = null,
      languageTag = "en",
      deviceOs = "Android",
      deviceOsVersion = "14",
      deviceModel = "TestDevice",
      deviceName = "TestDevice",
      expoSdkVersion = "52.0.0",
      reactNativeVersion = "0.76.0",
      clientVersion = "1.0.0"
    )

    val metric = EASMetric(
      sessionId = "test-session",
      timestamp = "2025-11-26T10:00:00.000Z",
      category = "test",
      name = metricName,
      value = 123.45
    )

    return Event(metadata = metadata, metrics = listOf(metric))
  }
}
