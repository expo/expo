package expo.modules.observe

import android.content.Context
import expo.modules.appmetrics.storage.LogRecord
import expo.modules.appmetrics.storage.Metric
import expo.modules.appmetrics.storage.Session
import expo.modules.appmetrics.storage.SessionManager
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkObject
import io.mockk.unmockkAll
import io.mockk.verify
import kotlinx.coroutines.cancel
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class BaseObservabilityManagerTest {
  private val context = mockk<Context>(relaxed = true)
  private val sessionManager = mockk<SessionManager>(relaxed = true)
  private val eventDispatcher = mockk<EventDispatcher>(relaxed = true)
  private var metricCursor = -1L
  private var logCursor = -1L

  @Before
  fun setUp() {
    mockkObject(ObservePreferences)
    every { ObservePreferences.getConfig(any()) } returns PersistedConfig(dispatchingEnabled = true)
    every { ObservePreferences.getBundleDefaults(any()) } returns null
    every { ObservePreferences.getLastDispatchedMetricId(any()) } answers { metricCursor }
    every { ObservePreferences.setLastDispatchedMetricId(any(), any()) } answers {
      metricCursor = secondArg()
    }
    every { ObservePreferences.getLastDispatchedLogId(any()) } answers { logCursor }
    every { ObservePreferences.setLastDispatchedLogId(any(), any()) } answers {
      logCursor = secondArg()
    }
    coEvery { sessionManager.getMaxMetricId() } returns null
    coEvery { sessionManager.getMaxLogId() } returns null
  }

  @After
  fun tearDown() {
    unmockkAll()
  }

  // region Dispatching enabled tests

  @Test
  fun `disabled dispatch fast forwards both cursors`() = runTest {
    every { ObservePreferences.getConfig(any()) } returns PersistedConfig(dispatchingEnabled = false)
    coEvery { sessionManager.getMaxMetricId() } returns 12
    coEvery { sessionManager.getMaxLogId() } returns 34
    val manager = createManager()

    manager.dispatchUnsentMetrics()
    manager.dispatchUnsentLogs()

    assertEquals(12, metricCursor)
    assertEquals(34, logCursor)
    coVerify(exactly = 0) { sessionManager.getMetrics(any(), any()) }
    coVerify(exactly = 0) { sessionManager.getLogs(any(), any()) }
  }

  @Test
  fun `disabled dispatch does not rewrite unchanged cursors`() = runTest {
    every { ObservePreferences.getConfig(any()) } returns PersistedConfig(dispatchingEnabled = false)
    metricCursor = 12
    logCursor = 34
    coEvery { sessionManager.getMaxMetricId() } returns 12
    coEvery { sessionManager.getMaxLogId() } returns 34
    val manager = createManager()

    manager.dispatchUnsentMetrics()
    manager.dispatchUnsentLogs()

    assertEquals(12, metricCursor)
    assertEquals(34, logCursor)
    verify(exactly = 0) { ObservePreferences.setLastDispatchedMetricId(any(), any()) }
    verify(exactly = 0) { ObservePreferences.setLastDispatchedLogId(any(), any()) }
  }

  @Test
  fun `when dispatchingEnabled is null on a stored config and isDebugBuild is false, metrics are dispatched`() = runTest {
    every { ObservePreferences.getConfig(any()) } returns PersistedConfig(dispatchingEnabled = null)
    stubMetricDispatch()

    createManager().dispatchUnsentMetrics()

    coVerify(exactly = 1) { eventDispatcher.dispatch(any()) }
  }

  @Test
  fun `when stored config is absent and isDebugBuild is false, metrics are dispatched`() = runTest {
    every { ObservePreferences.getConfig(any()) } returns null
    stubMetricDispatch()

    createManager().dispatchUnsentMetrics()

    coVerify(exactly = 1) { eventDispatcher.dispatch(any()) }
  }

  @Test
  fun `when dispatchingEnabled is false, dispatchInDebug and sampleRate have no effect`() = runTest {
    every { ObservePreferences.getConfig(any()) } returns PersistedConfig(
      dispatchingEnabled = false,
      dispatchInDebug = true,
      sampleRate = 1.0
    )
    coEvery { sessionManager.getMaxMetricId() } returns 10

    createManager(isDebugBuild = true, deterministicUniformValue = 0.0).dispatchUnsentMetrics()

    assertEquals(10, metricCursor)
    coVerify(exactly = 0) { eventDispatcher.dispatch(any()) }
  }

  // endregion

  // region Dispatch in debug tests

  @Test
  fun `when dispatchInDebug is true on debug build, metrics are dispatched`() = runTest {
    every { ObservePreferences.getConfig(any()) } returns PersistedConfig(dispatchInDebug = true)
    stubMetricDispatch()

    createManager(isDebugBuild = true).dispatchUnsentMetrics()

    coVerify(exactly = 1) { eventDispatcher.dispatch(any()) }
  }

  @Test
  fun `when dispatchInDebug is false explicitly on debug build, metric cursor is fast forwarded without dispatching`() = runTest {
    every { ObservePreferences.getConfig(any()) } returns PersistedConfig(dispatchInDebug = false)
    coEvery { sessionManager.getMaxMetricId() } returns 10

    createManager(isDebugBuild = true).dispatchUnsentMetrics()

    assertEquals(10, metricCursor)
    coVerify(exactly = 0) { eventDispatcher.dispatch(any()) }
  }

  @Test
  fun `when dispatchInDebug is false on release build, metrics dispatch normally`() = runTest {
    every { ObservePreferences.getConfig(any()) } returns PersistedConfig(dispatchInDebug = false)
    stubMetricDispatch()

    createManager(isDebugBuild = false).dispatchUnsentMetrics()

    coVerify(exactly = 1) { eventDispatcher.dispatch(any()) }
  }

  // endregion

  // region Combined dev mode tests

  @Test
  fun `when isJsDev is true on release native build, dispatchInDebug false fast forwards the metric cursor`() = runTest {
    every { ObservePreferences.getBundleDefaults(any()) } returns
      PersistedBundleDefaults(environment = "development", isJsDev = true)
    every { ObservePreferences.getConfig(any()) } returns PersistedConfig(dispatchInDebug = false)
    coEvery { sessionManager.getMaxMetricId() } returns 10

    createManager(isDebugBuild = false).dispatchUnsentMetrics()

    assertEquals(10, metricCursor)
    coVerify(exactly = 0) { eventDispatcher.dispatch(any()) }
  }

  @Test
  fun `when isJsDev is true and isDebugBuild is true, dispatchInDebug true dispatches`() = runTest {
    every { ObservePreferences.getBundleDefaults(any()) } returns
      PersistedBundleDefaults(environment = "development", isJsDev = true)
    every { ObservePreferences.getConfig(any()) } returns PersistedConfig(dispatchInDebug = true)
    stubMetricDispatch()

    createManager(isDebugBuild = true).dispatchUnsentMetrics()

    coVerify(exactly = 1) { eventDispatcher.dispatch(any()) }
  }

  // endregion

  // region Sample rate tests

  @Test
  fun `when sampleRate is null, metrics dispatch normally`() = runTest {
    every { ObservePreferences.getConfig(any()) } returns PersistedConfig(sampleRate = null)
    stubMetricDispatch()

    createManager(deterministicUniformValue = 0.999).dispatchUnsentMetrics()

    coVerify(exactly = 1) { eventDispatcher.dispatch(any()) }
  }

  @Test
  fun `when deterministicUniformValue is less than sampleRate, metrics dispatch`() = runTest {
    every { ObservePreferences.getConfig(any()) } returns PersistedConfig(sampleRate = 0.5)
    stubMetricDispatch()

    createManager(deterministicUniformValue = 0.2).dispatchUnsentMetrics()

    coVerify(exactly = 1) { eventDispatcher.dispatch(any()) }
  }

  @Test
  fun `when deterministicUniformValue is equal to sampleRate, metric cursor is fast forwarded`() = runTest {
    every { ObservePreferences.getConfig(any()) } returns PersistedConfig(sampleRate = 0.5)
    coEvery { sessionManager.getMaxMetricId() } returns 10

    createManager(deterministicUniformValue = 0.5).dispatchUnsentMetrics()

    assertEquals(10, metricCursor)
    coVerify(exactly = 0) { eventDispatcher.dispatch(any()) }
  }

  @Test
  fun `when deterministicUniformValue is greater than sampleRate, metric cursor is fast forwarded`() = runTest {
    every { ObservePreferences.getConfig(any()) } returns PersistedConfig(sampleRate = 0.5)
    coEvery { sessionManager.getMaxMetricId() } returns 10

    createManager(deterministicUniformValue = 0.8).dispatchUnsentMetrics()

    assertEquals(10, metricCursor)
    coVerify(exactly = 0) { eventDispatcher.dispatch(any()) }
  }

  @Test
  fun `when sampleRate is 0_0, metric cursor is always fast forwarded`() = runTest {
    every { ObservePreferences.getConfig(any()) } returns PersistedConfig(sampleRate = 0.0)
    coEvery { sessionManager.getMaxMetricId() } returns 10

    createManager(deterministicUniformValue = 0.0).dispatchUnsentMetrics()

    assertEquals(10, metricCursor)
    coVerify(exactly = 0) { eventDispatcher.dispatch(any()) }
  }

  @Test
  fun `when sampleRate is 1_0, metrics always dispatch`() = runTest {
    every { ObservePreferences.getConfig(any()) } returns PersistedConfig(sampleRate = 1.0)
    stubMetricDispatch()

    createManager(deterministicUniformValue = 0.999).dispatchUnsentMetrics()

    coVerify(exactly = 1) { eventDispatcher.dispatch(any()) }
  }

  @Test
  fun `sampleRate outside 0_0 to 1_0 is clamped`() = runTest {
    every { ObservePreferences.getConfig(any()) } returns PersistedConfig(sampleRate = 2.0)
    stubMetricDispatch()
    createManager(deterministicUniformValue = 0.95).dispatchUnsentMetrics()
    coVerify(exactly = 1) { eventDispatcher.dispatch(any()) }

    metricCursor = -1
    every { ObservePreferences.getConfig(any()) } returns PersistedConfig(sampleRate = -0.5)
    coEvery { sessionManager.getMaxMetricId() } returns 10
    createManager(deterministicUniformValue = 0.0).dispatchUnsentMetrics()

    assertEquals(10, metricCursor)
    coVerify(exactly = 1) { eventDispatcher.dispatch(any()) }
  }

  // endregion

  // region Fetching and dispatch tests

  @Test
  fun `dispatchUnsentMetrics transforms grouped metrics to events and advances the cursor`() = runTest {
    val metrics = listOf(metric(1, "one"), metric(2, "two"))
    coEvery { sessionManager.getMaxMetricId() } returns 2
    coEvery { sessionManager.getMetrics(-1, 2) } returns metrics
    coEvery { sessionManager.getMetrics(2, 2) } returns emptyList()
    coEvery { sessionManager.getSessions(setOf("session")) } returns listOf(session())
    coEvery { eventDispatcher.dispatch(any()) } returns DispatchResult.Success

    createManager(chunkSize = 2).dispatchUnsentMetrics()

    assertEquals(2, metricCursor)
    coVerify {
      eventDispatcher.dispatch(
        match { events -> events.single().metrics.map { it.name } == listOf("one", "two") }
      )
    }
  }

  @Test
  fun `dispatchUnsentMetrics advances past all rows with no matching sessions`() = runTest {
    coEvery { sessionManager.getMaxMetricId() } returns 1
    coEvery { sessionManager.getMetrics(-1, any()) } returns listOf(metric(1, "orphan"))
    coEvery { sessionManager.getMetrics(1, any()) } returns emptyList()
    coEvery { sessionManager.getSessions(any()) } returns emptyList()

    createManager().dispatchUnsentMetrics()

    assertEquals(1, metricCursor)
    coVerify(exactly = 0) { eventDispatcher.dispatch(any()) }
  }

  @Test
  fun `dispatchUnsentMetrics dispatches valid rows and advances past rows with no matching sessions`() = runTest {
    val metrics = listOf(
      metric(1, "valid", sessionId = "valid-session"),
      metric(2, "orphan", sessionId = "missing-session")
    )
    coEvery { sessionManager.getMaxMetricId() } returns 2
    coEvery { sessionManager.getMetrics(-1, 2) } returns metrics
    coEvery { sessionManager.getMetrics(2, 2) } returns emptyList()
    coEvery { sessionManager.getSessions(any()) } returns listOf(session(id = "valid-session"))
    coEvery { eventDispatcher.dispatch(any()) } returns DispatchResult.Success

    createManager(chunkSize = 2).dispatchUnsentMetrics()

    assertEquals(2, metricCursor)
    coVerify {
      eventDispatcher.dispatch(
        match { events -> events.single().metrics.map { it.name } == listOf("valid") }
      )
    }
  }

  @Test
  fun `dispatchUnsentMetrics halves the chunk after 413 then resets to the default size`() = runTest {
    val metrics = (1L..4L).map { metric(it, "metric-$it") }
    coEvery { sessionManager.getMaxMetricId() } returns 4
    coEvery { sessionManager.getMetrics(-1, 4) } returns metrics
    coEvery { sessionManager.getMetrics(-1, 2) } returns metrics.take(2)
    coEvery { sessionManager.getMetrics(2, 4) } returns metrics.drop(2)
    coEvery { sessionManager.getMetrics(4, 4) } returns emptyList()
    coEvery { sessionManager.getSessions(any()) } returns listOf(session())
    coEvery { eventDispatcher.dispatch(any()) } returnsMany listOf(
      DispatchResult.PayloadTooLarge,
      DispatchResult.Success,
      DispatchResult.Success
    )

    createManager(chunkSize = 4).dispatchUnsentMetrics()

    assertEquals(4, metricCursor)
    coVerify(exactly = 1) { sessionManager.getMetrics(-1, 2) }
    coVerify(exactly = 1) { sessionManager.getMetrics(2, 4) }
  }

  @Test
  fun `dispatchUnsentMetrics halves the fetched count after missing sessions`() = runTest {
    val metrics = listOf(
      metric(1, "one", sessionId = "valid-session"),
      metric(2, "two", sessionId = "valid-session"),
      metric(3, "orphan-three", sessionId = "missing-session"),
      metric(4, "orphan-four", sessionId = "missing-session")
    )
    coEvery { sessionManager.getMaxMetricId() } returns 4
    coEvery { sessionManager.getMetrics(-1, 4) } returns metrics
    coEvery { sessionManager.getMetrics(-1, 2) } returns metrics.take(2)
    coEvery { sessionManager.getMetrics(2, 4) } returns metrics.drop(2)
    coEvery { sessionManager.getMetrics(4, 4) } returns emptyList()
    coEvery { sessionManager.getSessions(any()) } answers {
      if ("valid-session" in firstArg<Collection<String>>()) listOf(session(id = "valid-session")) else emptyList()
    }
    coEvery { eventDispatcher.dispatch(any()) } returnsMany listOf(
      DispatchResult.PayloadTooLarge,
      DispatchResult.Success
    )

    createManager(chunkSize = 4).dispatchUnsentMetrics()

    assertEquals(4, metricCursor)
    coVerify(exactly = 1) { sessionManager.getMetrics(-1, 2) }
    coVerify(exactly = 0) { sessionManager.getMetrics(-1, 1) }
  }

  @Test
  fun `dispatchUnsentMetrics drops a non-retryable chunk and stops`() = runTest {
    val metrics = listOf(metric(1, "one"), metric(2, "two"))
    coEvery { sessionManager.getMaxMetricId() } returns 3
    coEvery { sessionManager.getMetrics(-1, 2) } returns metrics
    coEvery { sessionManager.getSessions(any()) } returns listOf(session())
    coEvery { eventDispatcher.dispatch(any()) } returns DispatchResult.NonRetryableFailure("HTTP 400")

    createManager(chunkSize = 2).dispatchUnsentMetrics()

    assertEquals(2, metricCursor)
    coVerify(exactly = 0) { sessionManager.getMetrics(2, 2) }
  }

  @Test
  fun `dispatchUnsentMetrics stops reading chunks after cancellation`() = runTest {
    val metrics = listOf(metric(1, "one"), metric(2, "two"))
    coEvery { sessionManager.getMaxMetricId() } returns 3
    coEvery { sessionManager.getMetrics(-1, 2) } returns metrics
    coEvery { sessionManager.getSessions(any()) } returns listOf(session())
    coEvery { eventDispatcher.dispatch(any()) } coAnswers {
      currentCoroutineContext().cancel()
      DispatchResult.Success
    }

    launch { createManager(chunkSize = 2).dispatchUnsentMetrics() }.join()

    assertEquals(2, metricCursor)
    coVerify(exactly = 0) { sessionManager.getMetrics(2, 2) }
  }

  @Test
  fun `dispatchUnsentMetrics dispatches a backlog in successive chunks`() = runTest {
    val first = listOf(metric(1, "one"), metric(2, "two"))
    val second = listOf(metric(3, "three"), metric(4, "four"))
    coEvery { sessionManager.getMaxMetricId() } returns 4
    coEvery { sessionManager.getMetrics(-1, 2) } returns first
    coEvery { sessionManager.getMetrics(2, 2) } returns second
    coEvery { sessionManager.getMetrics(4, 2) } returns emptyList()
    coEvery { sessionManager.getSessions(any()) } returns listOf(session())
    coEvery { eventDispatcher.dispatch(any()) } returns DispatchResult.Success

    createManager(chunkSize = 2).dispatchUnsentMetrics()

    assertEquals(4, metricCursor)
    coVerify(exactly = 2) { eventDispatcher.dispatch(any()) }
  }

  @Test
  fun `dispatchUnsentMetrics drops a single metric that still gets 413`() = runTest {
    stubMetricDispatch(result = DispatchResult.PayloadTooLarge)

    createManager().dispatchUnsentMetrics()

    assertEquals(1, metricCursor)
    coVerify(exactly = 1) { eventDispatcher.dispatch(any()) }
    coVerify(exactly = 0) { sessionManager.getMetrics(1, any()) }
  }

  @Test
  fun `dispatchUnsentLogs transforms grouped logs to events and advances independently`() = runTest {
    val logs = listOf(log(4, "first"), log(5, "second"))
    coEvery { sessionManager.getMaxLogId() } returns 5
    coEvery { sessionManager.getLogs(-1, 2) } returns logs
    coEvery { sessionManager.getLogs(5, 2) } returns emptyList()
    coEvery { sessionManager.getSessions(setOf("session")) } returns listOf(session())
    coEvery { eventDispatcher.dispatchLogs(any()) } returns DispatchResult.Success

    createManager(chunkSize = 2).dispatchUnsentLogs()

    assertEquals(5, logCursor)
    assertEquals(-1, metricCursor)
    coVerify {
      eventDispatcher.dispatchLogs(
        match { events -> events.single().logs.map { it.name } == listOf("first", "second") }
      )
    }
  }

  @Test
  fun `dispatchUnsentLogs dispatches valid rows and advances past rows with no matching sessions`() = runTest {
    val logs = listOf(
      log(1, "valid", sessionId = "valid-session"),
      log(2, "orphan", sessionId = "missing-session")
    )
    coEvery { sessionManager.getMaxLogId() } returns 2
    coEvery { sessionManager.getLogs(-1, 2) } returns logs
    coEvery { sessionManager.getLogs(2, 2) } returns emptyList()
    coEvery { sessionManager.getSessions(any()) } returns listOf(session(id = "valid-session"))
    coEvery { eventDispatcher.dispatchLogs(any()) } returns DispatchResult.Success

    createManager(chunkSize = 2).dispatchUnsentLogs()

    assertEquals(2, logCursor)
    coVerify {
      eventDispatcher.dispatchLogs(
        match { events -> events.single().logs.map { it.name } == listOf("valid") }
      )
    }
  }

  @Test
  fun `dispatchUnsentLogs dispatches a backlog in successive chunks`() = runTest {
    val first = listOf(log(1, "one"), log(2, "two"))
    val second = listOf(log(3, "three"), log(4, "four"))
    coEvery { sessionManager.getMaxLogId() } returns 4
    coEvery { sessionManager.getLogs(-1, 2) } returns first
    coEvery { sessionManager.getLogs(2, 2) } returns second
    coEvery { sessionManager.getLogs(4, 2) } returns emptyList()
    coEvery { sessionManager.getSessions(any()) } returns listOf(session())
    coEvery { eventDispatcher.dispatchLogs(any()) } returns DispatchResult.Success

    createManager(chunkSize = 2).dispatchUnsentLogs()

    assertEquals(4, logCursor)
    coVerify(exactly = 2) { eventDispatcher.dispatchLogs(any()) }
  }

  @Test
  fun `dispatchUnsentLogs stops reading chunks after cancellation`() = runTest {
    val logs = listOf(log(1, "one"), log(2, "two"))
    coEvery { sessionManager.getMaxLogId() } returns 3
    coEvery { sessionManager.getLogs(-1, 2) } returns logs
    coEvery { sessionManager.getSessions(any()) } returns listOf(session())
    coEvery { eventDispatcher.dispatchLogs(any()) } coAnswers {
      currentCoroutineContext().cancel()
      DispatchResult.Success
    }

    launch { createManager(chunkSize = 2).dispatchUnsentLogs() }.join()

    assertEquals(2, logCursor)
    coVerify(exactly = 0) { sessionManager.getLogs(2, 2) }
  }

  @Test
  fun `dispatchUnsentLogs halves the fetched count after missing sessions`() = runTest {
    val logs = listOf(
      log(1, "one", sessionId = "valid-session"),
      log(2, "two", sessionId = "valid-session"),
      log(3, "orphan-three", sessionId = "missing-session"),
      log(4, "orphan-four", sessionId = "missing-session")
    )
    coEvery { sessionManager.getMaxLogId() } returns 4
    coEvery { sessionManager.getLogs(-1, 4) } returns logs
    coEvery { sessionManager.getLogs(-1, 2) } returns logs.take(2)
    coEvery { sessionManager.getLogs(2, 4) } returns logs.drop(2)
    coEvery { sessionManager.getLogs(4, 4) } returns emptyList()
    coEvery { sessionManager.getSessions(any()) } answers {
      if ("valid-session" in firstArg<Collection<String>>()) listOf(session(id = "valid-session")) else emptyList()
    }
    coEvery { eventDispatcher.dispatchLogs(any()) } returnsMany listOf(
      DispatchResult.PayloadTooLarge,
      DispatchResult.Success
    )

    createManager(chunkSize = 4).dispatchUnsentLogs()

    assertEquals(4, logCursor)
    coVerify(exactly = 1) { sessionManager.getLogs(-1, 2) }
    coVerify(exactly = 0) { sessionManager.getLogs(-1, 1) }
  }

  @Test
  fun `dispatchUnsentLogs drops a single log that still gets 413`() = runTest {
    stubLogDispatch(result = DispatchResult.PayloadTooLarge)

    createManager().dispatchUnsentLogs()

    assertEquals(1, logCursor)
    coVerify(exactly = 1) { eventDispatcher.dispatchLogs(any()) }
    coVerify(exactly = 0) { sessionManager.getLogs(1, any()) }
  }

  @Test
  fun `dispatchUnsentLogs drops a non-retryable chunk and stops`() = runTest {
    val logs = listOf(log(1, "one"), log(2, "two"))
    coEvery { sessionManager.getMaxLogId() } returns 3
    coEvery { sessionManager.getLogs(-1, 2) } returns logs
    coEvery { sessionManager.getSessions(any()) } returns listOf(session())
    coEvery { eventDispatcher.dispatchLogs(any()) } returns DispatchResult.NonRetryableFailure("HTTP 400")

    createManager(chunkSize = 2).dispatchUnsentLogs()

    assertEquals(2, logCursor)
    coVerify(exactly = 0) { sessionManager.getLogs(2, 2) }
  }

  // endregion

  // region Cleanup tests

  @Test
  fun `cleanup prunes app metrics storage and deletes the legacy database`() = runTest {
    createManager().cleanup()

    coVerify(exactly = 1) { sessionManager.cleanupOldSessions() }
    coVerify(exactly = 1) { sessionManager.cleanupOldLogs() }
    verify(exactly = 1) { context.deleteDatabase("eas_observe") }
  }

  // endregion

  // region Transformation tests

  @Test
  fun `Metadata fromSessionMetadata transforms all fields correctly`() {
    val metadata = Metadata.fromSessionMetadata(
      Session(
        id = "session",
        startTimestamp = "2025-01-01T00:00:00Z",
        environment = "production",
        appName = "TestApp",
        appIdentifier = "dev.expo.test",
        appVersion = "1.2.3",
        appBuildNumber = "42",
        appUpdateId = "update",
        appUpdateRuntimeVersion = "1",
        appUpdateRequestHeaders = """{"expo-channel-name":"production"}""",
        appEasBuildId = "build",
        deviceOs = "Android",
        deviceOsVersion = "16",
        deviceModel = "Pixel",
        deviceName = "pixel",
        expoSdkVersion = "55",
        reactNativeVersion = "0.81",
        clientVersion = "1",
        languageTag = "en-US"
      )
    )

    assertEquals("TestApp", metadata.appName)
    assertEquals("dev.expo.test", metadata.appIdentifier)
    assertEquals("1.2.3", metadata.appVersion)
    assertEquals("42", metadata.appBuildNumber)
    assertEquals("update", metadata.appUpdatesInfo?.updateId)
    assertEquals("1", metadata.appUpdatesInfo?.runtimeVersion)
    assertEquals("production", metadata.appUpdatesInfo?.channel)
    assertEquals("build", metadata.appEasBuildId)
    assertEquals("Android", metadata.deviceOs)
    assertEquals("16", metadata.deviceOsVersion)
    assertEquals("Pixel", metadata.deviceModel)
    assertEquals("pixel", metadata.deviceName)
    assertEquals("55", metadata.expoSdkVersion)
    assertEquals("0.81", metadata.reactNativeVersion)
    assertEquals("1", metadata.clientVersion)
    assertEquals("en-US", metadata.languageTag)
    assertEquals("production", metadata.environment)
  }

  @Test
  fun `Metadata fromSessionMetadata handles null fields`() {
    val metadata = Metadata.fromSessionMetadata(
      Session(id = "session", startTimestamp = "2025-01-01T00:00:00Z")
    )

    assertNull(metadata.appName)
    assertEquals("", metadata.appIdentifier)
    assertNull(metadata.appVersion)
    assertNull(metadata.appBuildNumber)
    assertNull(metadata.appUpdatesInfo)
    assertNull(metadata.deviceOs)
    assertNull(metadata.deviceOsVersion)
    assertNull(metadata.deviceModel)
    assertNull(metadata.deviceName)
    assertEquals("", metadata.expoSdkVersion)
    assertEquals("", metadata.reactNativeVersion)
    assertNull(metadata.clientVersion)
    assertNull(metadata.languageTag)
    assertNull(metadata.environment)
  }

  @Test
  fun `EASMetric fromMetric transforms all fields correctly`() {
    val easMetric = EASMetric.fromMetric(
      Metric(
        id = 1,
        sessionId = "session",
        timestamp = "2025-01-01T00:00:00Z",
        category = "navigation",
        name = "route",
        value = 1.5,
        routeName = "/home",
        updateId = "update",
        params = """{"key":"value"}"""
      )
    )

    assertEquals("session", easMetric.sessionId)
    assertEquals("2025-01-01T00:00:00Z", easMetric.timestamp)
    assertEquals("navigation", easMetric.category)
    assertEquals("route", easMetric.name)
    assertEquals(1.5, easMetric.value, 0.0)
    assertEquals("/home", easMetric.routeName)
    assertEquals("update", easMetric.updateId)
    assertEquals(buildJsonObject { put("key", "value") }, easMetric.customParams)
  }

  @Test
  fun `EASMetric fromMetric handles null optional fields`() {
    val easMetric = EASMetric.fromMetric(metric(1, "metric"))

    assertNull(easMetric.routeName)
    assertNull(easMetric.updateId)
    assertNull(easMetric.customParams)
  }

  @Test
  fun `dispatchUnsentMetrics creates separate events for each session`() = runTest {
    val metrics = listOf(
      metric(1, "one", sessionId = "session-1"),
      metric(2, "two", sessionId = "session-2")
    )
    stubMetricDispatch(
      metrics = metrics,
      sessions = listOf(
        session(id = "session-1", appVersion = "1.0.0"),
        session(id = "session-2", appVersion = "2.0.0")
      )
    )

    createManager().dispatchUnsentMetrics()

    coVerify {
      eventDispatcher.dispatch(
        match { events ->
          events.size == 2 && events.map { it.metadata.appVersion }.toSet() == setOf("1.0.0", "2.0.0")
        }
      )
    }
  }

  // endregion

  // region Retry-gate tests

  @Test
  fun `dispatchUnsentMetrics stops after a retryable chunk and sets the gate`() = runTest {
    coEvery { sessionManager.getMaxMetricId() } returns 1
    coEvery { sessionManager.getMetrics(-1, any()) } returns listOf(metric(1, "one"))
    coEvery { sessionManager.getSessions(any()) } returns listOf(session())
    coEvery { eventDispatcher.dispatch(any()) } returns DispatchResult.RetryableFailure(60_000)
    val manager = createManager(currentTimeMs = { 1_000 })

    manager.dispatchUnsentMetrics()
    manager.dispatchUnsentMetrics()

    assertEquals(-1, metricCursor)
    coVerify(exactly = 1) { eventDispatcher.dispatch(any()) }
  }

  @Test
  fun `dispatchUnsentLogs stops after a retryable chunk and sets the gate`() = runTest {
    stubLogDispatch(result = DispatchResult.RetryableFailure(60_000))
    val manager = createManager(currentTimeMs = { 1_000 })

    manager.dispatchUnsentLogs()
    manager.dispatchUnsentLogs()

    assertEquals(-1, logCursor)
    coVerify(exactly = 1) { eventDispatcher.dispatchLogs(any()) }
  }

  @Test
  fun `metrics Retryable does not gate logs (per-signal gates are independent)`() = runTest {
    stubMetricDispatch(result = DispatchResult.RetryableFailure(60_000))
    stubLogDispatch()
    val manager = createManager(currentTimeMs = { 1_000 })

    manager.dispatchUnsentMetrics()
    manager.dispatchUnsentLogs()

    assertEquals(-1, metricCursor)
    assertEquals(1, logCursor)
    coVerify(exactly = 1) { eventDispatcher.dispatchLogs(any()) }
  }

  @Test
  fun `logs Retryable does not gate metrics (per-signal gates are independent)`() = runTest {
    stubLogDispatch(result = DispatchResult.RetryableFailure(60_000))
    stubMetricDispatch()
    val manager = createManager(currentTimeMs = { 1_000 })

    manager.dispatchUnsentLogs()
    manager.dispatchUnsentMetrics()

    assertEquals(-1, logCursor)
    assertEquals(1, metricCursor)
    coVerify(exactly = 1) { eventDispatcher.dispatch(any()) }
  }

  @Test
  fun `dispatchUnsentMetrics resumes after the retry gate expires`() = runTest {
    var now = 1_000L
    coEvery { sessionManager.getMaxMetricId() } returns 1
    coEvery { sessionManager.getMetrics(-1, any()) } returns listOf(metric(1, "metric"))
    coEvery { sessionManager.getMetrics(1, any()) } returns emptyList()
    coEvery { sessionManager.getSessions(any()) } returns listOf(session())
    coEvery { eventDispatcher.dispatch(any()) } returnsMany listOf(
      DispatchResult.RetryableFailure(60_000),
      DispatchResult.Success
    )
    val manager = createManager(currentTimeMs = { now })

    manager.dispatchUnsentMetrics()
    now += 60_001
    manager.dispatchUnsentMetrics()

    assertEquals(1, metricCursor)
    coVerify(exactly = 2) { eventDispatcher.dispatch(any()) }
  }

  // endregion

  // region Helper methods

  private fun stubMetricDispatch(
    metrics: List<Metric> = listOf(metric(1, "metric")),
    sessions: List<Session> = listOf(session()),
    result: DispatchResult = DispatchResult.Success
  ) {
    val highestId = metrics.maxOf { it.id }
    coEvery { sessionManager.getMaxMetricId() } returns highestId
    coEvery { sessionManager.getMetrics(-1, any()) } returns metrics
    coEvery { sessionManager.getMetrics(highestId, any()) } returns emptyList()
    coEvery { sessionManager.getSessions(metrics.mapTo(linkedSetOf()) { it.sessionId }) } returns sessions
    coEvery { eventDispatcher.dispatch(any()) } returns result
  }

  private fun stubLogDispatch(
    logs: List<LogRecord> = listOf(log(1, "log")),
    sessions: List<Session> = listOf(session()),
    result: DispatchResult = DispatchResult.Success
  ) {
    val highestId = logs.maxOf { it.id }
    coEvery { sessionManager.getMaxLogId() } returns highestId
    coEvery { sessionManager.getLogs(-1, any()) } returns logs
    coEvery { sessionManager.getLogs(highestId, any()) } returns emptyList()
    coEvery { sessionManager.getSessions(logs.mapTo(linkedSetOf()) { it.sessionId }) } returns sessions
    coEvery { eventDispatcher.dispatchLogs(any()) } returns result
  }

  private fun createManager(
    chunkSize: Int = DISPATCH_CHUNK_SIZE,
    currentTimeMs: () -> Long = { 0 },
    isDebugBuild: Boolean = false,
    deterministicUniformValue: Double = 0.0
  ): BaseObservabilityManager {
    val manager = BaseObservabilityManager(
      context = context,
      sessionManager = sessionManager,
      projectId = "project",
      baseUrl = "https://example.com/",
      isDebugBuild = isDebugBuild,
      deterministicUniformValueProvider = { deterministicUniformValue },
      currentTimeMs = currentTimeMs,
      dispatchChunkSize = chunkSize
    )
    val field = BaseObservabilityManager::class.java.getDeclaredField("eventDispatcher")
    field.isAccessible = true
    field.set(manager, eventDispatcher)
    return manager
  }

  private fun session(
    id: String = "session",
    appName: String? = null,
    appVersion: String? = null,
    environment: String? = null
  ) = Session(
    id = id,
    startTimestamp = "2025-01-01T00:00:00Z",
    environment = environment,
    appName = appName,
    appIdentifier = "dev.expo.test",
    appVersion = appVersion,
    expoSdkVersion = "55",
    reactNativeVersion = "0.81"
  )

  private fun metric(id: Long, name: String, sessionId: String = "session") = Metric(
    sessionId = sessionId,
    timestamp = "2025-01-01T00:00:00Z",
    category = "test",
    name = name,
    value = 1.0,
    id = id
  )

  private fun log(id: Long, name: String, sessionId: String = "session") = LogRecord(
    sessionId = sessionId,
    timestamp = "2025-01-01T00:00:00Z",
    name = name,
    severity = "info",
    id = id
  )

  // endregion
}
