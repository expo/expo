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
  fun `dispatch returns true on successful 200 response`() =
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
      assertTrue(result)
      assertEquals(1, mockServer.requestCount)

      val request = mockServer.takeRequest()
      assertEquals("POST", request.method)
      assertTrue(request.path?.contains(testProjectId) == true)
      assertEquals("application/json; charset=utf-8", request.getHeader("Content-Type"))
      assertNotNull(request.body)
    }

  @Test
  fun `dispatch returns true on successful 201 response`() =
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
      assertTrue(result)
    }

  @Test
  fun `dispatch returns false when empty event list is provided`() =
    runTest {
      // Arrange
      val emptyEvents = emptyList<Event>()

      // Act
      val result = eventDispatcher.dispatch(emptyEvents)

      // Assert
      assertFalse(result)
      assertEquals(0, mockServer.requestCount)
    }

  @Test
  fun `dispatch returns false on 400 error response`() =
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
      assertFalse(result)
      assertEquals(1, mockServer.requestCount)
    }

  @Test
  fun `dispatch returns false on 500 server error`() =
    runTest {
      // Arrange
      mockServer.enqueue(
        MockResponse()
          .setResponseCode(500)
          .setBody("""{"error": "Internal Server Error"}""")
      )

      val events = listOf(createTestEvent())

      // Act
      val result = eventDispatcher.dispatch(events)

      // Assert
      assertFalse(result)
      assertEquals(1, mockServer.requestCount)
    }

  @Test
  fun `dispatch includes correct easClientId in payload`() =
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
      assertEquals(testEasClientId.toString(), json.getString("easClientId"))
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
      assertTrue(result)
      assertEquals(1, mockServer.requestCount)

      val request = mockServer.takeRequest()
      val requestBody = request.body.readUtf8()
      val json = JSONObject(requestBody)
      val eventsArray = json.getJSONArray("events")

      assertEquals(3, eventsArray.length())

      val metricNames = mutableListOf<String>()
      for (i in 0 until eventsArray.length()) {
        val event = eventsArray.getJSONObject(i)
        val metrics = event.getJSONArray("metrics")
        metricNames.add(metrics.getJSONObject(0).getString("name"))
      }

      assertTrue(metricNames.contains("metric1"))
      assertTrue(metricNames.contains("metric2"))
      assertTrue(metricNames.contains("metric3"))
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
      assertEquals("/$testProjectId", request.path)
    }

  @Test
  fun `dispatch throws exception on network failure`() =
    runTest {
      // Arrange
      mockServer.shutdown() // Shutdown server to simulate network failure

      val events = listOf(createTestEvent())

      // Act & Assert
      try {
        eventDispatcher.dispatch(events)
        fail("Expected exception to be thrown")
      } catch (e: Exception) {
        // Expected behavior
        assertNotNull(e)
      }
    }

  @Test
  fun `dispatch includes all metadata fields in payload`() =
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
        appUpdateId = null,
        appEasBuildId = null,
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
        timestamp = "2025-11-26T10:00:00Z",
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
      val eventsArray = json.getJSONArray("events")
      val event = eventsArray.getJSONObject(0)
      val metadataJson = event.getJSONObject("metadata")

      assertEquals("TestApp", metadataJson.getString("appName"))
      assertEquals("com.test.app", metadataJson.getString("appIdentifier"))
      assertEquals("1.0.0", metadataJson.getString("appVersion"))
      assertEquals("100", metadataJson.getString("appBuildNumber"))
      assertEquals("en-US", metadataJson.getString("languageTag"))
      assertEquals("Android", metadataJson.getString("deviceOs"))
      assertEquals("14", metadataJson.getString("deviceOsVersion"))
      assertEquals("Pixel 8", metadataJson.getString("deviceModel"))
      assertEquals("TestDevice", metadataJson.getString("deviceName"))
      assertEquals("52.0.0", metadataJson.getString("expoSdkVersion"))
      assertEquals("0.76.0", metadataJson.getString("reactNativeVersion"))
      assertEquals("1.0.0", metadataJson.getString("clientVersion"))
    }

  @Test
  fun `dispatch handles 299 response as success`() =
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
      assertTrue(result)
    }

  // Helper function to create test events
  private fun createTestEvent(metricName: String = "test_metric"): Event {
    val metadata = Metadata(
      appName = "TestApp",
      appIdentifier = "com.test.app",
      appVersion = "1.0.0",
      appBuildNumber = "1",
      appUpdateId = null,
      appEasBuildId = null,
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
      timestamp = "2025-11-26T10:00:00Z",
      category = "test",
      name = metricName,
      value = 123.45
    )

    return Event(metadata = metadata, metrics = listOf(metric))
  }
}
