package expo.modules.observe

import android.content.Context
import expo.modules.observe.storage.PendingMetricsManager
import expo.modules.appmetrics.storage.Metric
import expo.modules.appmetrics.storage.Session
import expo.modules.appmetrics.storage.SessionManager
import expo.modules.appmetrics.storage.SessionWithMetrics
import io.mockk.*
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class BaseObservabilityManagerTest {
  private lateinit var mockContext: Context
  private lateinit var mockSessionManager: SessionManager
  private lateinit var mockEventDispatcher: EventDispatcher
  private lateinit var mockPendingMetricsManager: PendingMetricsManager

  private val testProjectId = "test-project-123"
  private val testBaseUrl = "https://test.example.com/"

  @Before
  fun setUp() {
    mockContext = mockk(relaxed = true)
    mockSessionManager = mockk(relaxed = true)
    mockEventDispatcher = mockk(relaxed = true)
    mockPendingMetricsManager = mockk(relaxed = true)

    // Default to enabled so existing tests aren't short-circuited
    mockkObject(ObservePreferences)
    every { ObservePreferences.getConfig(any()) } returns PersistedConfig(dispatchingEnabled = true, sampleRate = null)
    every { ObservePreferences.getBundleDefaults(any()) } returns null
  }

  @After
  fun tearDown() {
    unmockkAll()
  }

  // region dispatchingEnabled tests

  @Test
  fun `when dispatchingEnabled is false, pending metrics are removed without dispatching`() =
    runTest {
      // Arrange
      every { ObservePreferences.getConfig(any()) } returns PersistedConfig(dispatchingEnabled = false)
      coEvery { mockPendingMetricsManager.getAllPendingMetricIds() } returns listOf("id1", "id2")

      val removedIds = mutableListOf<String>()
      coEvery { mockPendingMetricsManager.removePendingMetrics(any()) } answers {
        removedIds.addAll(firstArg<List<String>>())
      }

      val manager = createManager()

      // Act
      manager.dispatchUnsentMetrics()

      // Assert - dispatch is never called
      coVerify(exactly = 0) { mockEventDispatcher.dispatch(any()) }

      // Assert - sessions are never fetched
      coVerify(exactly = 0) { mockSessionManager.getSessionsWithMetrics(any()) }

      // Assert - all pending metric IDs are removed
      assertEquals(2, removedIds.size)
      assertTrue("id1 should be removed", removedIds.contains("id1"))
      assertTrue("id2 should be removed", removedIds.contains("id2"))
    }

  @Test
  fun `when dispatchingEnabled is null on a stored config and isDebugBuild is false, metrics are dispatched`() =
    runTest {
      // Arrange — a stored config without an explicit dispatchingEnabled doesn't suppress dispatch on release builds.
      every { ObservePreferences.getConfig(any()) } returns PersistedConfig(dispatchingEnabled = null)
      val devMetric = createMetric("metric1", metricId = "dev-metric-id")
      val devSession = createSessionWithMetrics(
        sessionId = "dev-session",
        environment = "development",
        metrics = listOf(devMetric)
      )

      coEvery { mockPendingMetricsManager.getAllPendingMetricIds() } returns listOf("dev-metric-id")
      coEvery { mockSessionManager.getSessionsWithMetrics(any()) } returns listOf(devSession)
      coEvery { mockEventDispatcher.dispatch(any()) } returns true

      val removedIds = mutableListOf<String>()
      coEvery { mockPendingMetricsManager.removePendingMetrics(any()) } answers {
        removedIds.addAll(firstArg<List<String>>())
      }

      val manager = createManager(isDebugBuild = false)

      // Act
      manager.dispatchUnsentMetrics()

      // Assert
      coVerify {
        mockEventDispatcher.dispatch(
          match { events ->
            events.size == 1 && events[0].metadata.environment == "development"
          }
        )
      }
      assertEquals(1, removedIds.size)
      assertTrue(removedIds.contains("dev-metric-id"))
    }

  @Test
  fun `when dispatchingEnabled is true, and isDebugBuild is false, metrics are dispatched`() =
    runTest {
      // Arrange — explicit opt-in lifts the debug default.
      every { ObservePreferences.getConfig(any()) } returns PersistedConfig(dispatchingEnabled = true)
      val devMetric = createMetric("metric1", metricId = "dev-metric-id")
      val devSession = createSessionWithMetrics(
        sessionId = "dev-session",
        environment = "development",
        metrics = listOf(devMetric)
      )

      coEvery { mockPendingMetricsManager.getAllPendingMetricIds() } returns listOf("dev-metric-id")
      coEvery { mockSessionManager.getSessionsWithMetrics(any()) } returns listOf(devSession)
      coEvery { mockEventDispatcher.dispatch(any()) } returns true

      val removedIds = mutableListOf<String>()
      coEvery { mockPendingMetricsManager.removePendingMetrics(any()) } answers {
        removedIds.addAll(firstArg<List<String>>())
      }

      val manager = createManager(isDebugBuild = false)

      // Act
      manager.dispatchUnsentMetrics()

      // Assert
      coVerify {
        mockEventDispatcher.dispatch(
          match { events ->
            events.size == 1 && events[0].metadata.environment == "development"
          }
        )
      }
      assertEquals(1, removedIds.size)
      assertTrue(removedIds.contains("dev-metric-id"))
    }

  @Test
  fun `when stored config is absent and isDebugBuild is false, metrics are dispatched`() =
    runTest {
      // Arrange — release builds default to on.
      every { ObservePreferences.getConfig(any()) } returns null
      val prodMetric = createMetric("metric1", metricId = "prod-metric-id")
      val prodSession = createSessionWithMetrics(
        sessionId = "prod-session",
        environment = "production",
        metrics = listOf(prodMetric)
      )

      coEvery { mockPendingMetricsManager.getAllPendingMetricIds() } returns listOf("prod-metric-id")
      coEvery { mockSessionManager.getSessionsWithMetrics(any()) } returns listOf(prodSession)
      coEvery { mockEventDispatcher.dispatch(any()) } returns true

      val manager = createManager(isDebugBuild = false)

      // Act
      manager.dispatchUnsentMetrics()

      // Assert
      coVerify {
        mockEventDispatcher.dispatch(
          match { events ->
            events.size == 1 && events[0].metadata.environment == "production"
          }
        )
      }
    }

  // endregion

  // region dispatchInDebug tests

  @Test
  fun `when dispatchInDebug is true on debug build, metrics are dispatched`() =
    runTest {
      // Arrange — explicit opt-in lifts the debug-build gate.
      every { ObservePreferences.getConfig(any()) } returns PersistedConfig(dispatchInDebug = true)
      val devMetric = createMetric("metric1", metricId = "dev-metric-id")
      val devSession = createSessionWithMetrics(
        sessionId = "dev-session",
        environment = "development",
        metrics = listOf(devMetric)
      )

      coEvery { mockPendingMetricsManager.getAllPendingMetricIds() } returns listOf("dev-metric-id")
      coEvery { mockSessionManager.getSessionsWithMetrics(any()) } returns listOf(devSession)
      coEvery { mockEventDispatcher.dispatch(any()) } returns true

      val removedIds = mutableListOf<String>()
      coEvery { mockPendingMetricsManager.removePendingMetrics(any()) } answers {
        removedIds.addAll(firstArg<List<String>>())
      }

      val manager = createManager(isDebugBuild = true)

      // Act
      manager.dispatchUnsentMetrics()

      // Assert
      coVerify(exactly = 1) { mockEventDispatcher.dispatch(any()) }
      assertEquals(listOf("dev-metric-id"), removedIds)
    }

  @Test
  fun `when dispatchInDebug is false explicitly on debug build, pending metrics are removed without dispatching`() =
    runTest {
      // Arrange — explicit opt-out behaves like the default on debug builds.
      every { ObservePreferences.getConfig(any()) } returns PersistedConfig(dispatchInDebug = false)
      coEvery { mockPendingMetricsManager.getAllPendingMetricIds() } returns listOf("id1", "id2")

      val removedIds = mutableListOf<String>()
      coEvery { mockPendingMetricsManager.removePendingMetrics(any()) } answers {
        removedIds.addAll(firstArg<List<String>>())
      }

      val manager = createManager(isDebugBuild = true)

      // Act
      manager.dispatchUnsentMetrics()

      // Assert — short-circuit: no session lookup, no dispatch, single removePendingMetrics call.
      coVerify(exactly = 0) { mockEventDispatcher.dispatch(any()) }
      coVerify(exactly = 0) { mockSessionManager.getSessionsWithMetrics(any()) }
      coVerify(exactly = 1) { mockPendingMetricsManager.removePendingMetrics(listOf("id1", "id2")) }
      assertEquals(2, removedIds.size)
    }

  @Test
  fun `when dispatchInDebug is true on release build, metrics dispatch normally`() =
    runTest {
      // Arrange — dispatchInDebug is a no-op on release builds; release always dispatches (subject to other gates).
      every { ObservePreferences.getConfig(any()) } returns PersistedConfig(dispatchInDebug = true)
      val prodMetric = createMetric("metric1", metricId = "prod-metric-id")
      val prodSession = createSessionWithMetrics(
        sessionId = "prod-session",
        environment = "production",
        metrics = listOf(prodMetric)
      )

      coEvery { mockPendingMetricsManager.getAllPendingMetricIds() } returns listOf("prod-metric-id")
      coEvery { mockSessionManager.getSessionsWithMetrics(any()) } returns listOf(prodSession)
      coEvery { mockEventDispatcher.dispatch(any()) } returns true

      val manager = createManager(isDebugBuild = false)

      // Act
      manager.dispatchUnsentMetrics()

      // Assert
      coVerify(exactly = 1) { mockEventDispatcher.dispatch(any()) }
    }

  @Test
  fun `when dispatchingEnabled is false, dispatchInDebug being true has no effect`() =
    runTest {
      // Arrange — dispatchingEnabled=false wins over dispatchInDebug=true.
      every { ObservePreferences.getConfig(any()) } returns PersistedConfig(
        dispatchingEnabled = false,
        dispatchInDebug = true
      )
      coEvery { mockPendingMetricsManager.getAllPendingMetricIds() } returns listOf("id1")
      coEvery { mockPendingMetricsManager.removePendingMetrics(any()) } just runs

      val manager = createManager(isDebugBuild = true)

      // Act
      manager.dispatchUnsentMetrics()

      // Assert
      coVerify(exactly = 0) { mockEventDispatcher.dispatch(any()) }
      coVerify(exactly = 1) { mockPendingMetricsManager.removePendingMetrics(listOf("id1")) }
    }

  // endregion

  // region Combined isDev signal tests (isJsDev || isDebugBuild)

  @Test
  fun `when isJsDev is true on release native build, dispatchInDebug=false discards metrics`() =
    runTest {
      // Arrange — release native binary running a Metro dev JS bundle. JS dev alone gates dispatch.
      every { ObservePreferences.getBundleDefaults(any()) } returns
        PersistedBundleDefaults(environment = "development", isJsDev = true)
      every { ObservePreferences.getConfig(any()) } returns PersistedConfig(dispatchInDebug = false)
      coEvery { mockPendingMetricsManager.getAllPendingMetricIds() } returns listOf("id1")
      coEvery { mockPendingMetricsManager.removePendingMetrics(any()) } just runs

      val manager = createManager(isDebugBuild = false)

      // Act
      manager.dispatchUnsentMetrics()

      // Assert
      coVerify(exactly = 0) { mockEventDispatcher.dispatch(any()) }
      coVerify(exactly = 1) { mockPendingMetricsManager.removePendingMetrics(listOf("id1")) }
    }

  @Test
  fun `when isJsDev is true and isDebugBuild is true, dispatchInDebug=true dispatches`() =
    runTest {
      // Arrange — both signals say dev; explicit override lifts the gate.
      every { ObservePreferences.getBundleDefaults(any()) } returns
        PersistedBundleDefaults(environment = "development", isJsDev = true)
      every { ObservePreferences.getConfig(any()) } returns PersistedConfig(dispatchInDebug = true)
      val devMetric = createMetric("metric1", metricId = "dev-metric-id")
      val devSession = createSessionWithMetrics(
        sessionId = "dev-session",
        environment = "development",
        metrics = listOf(devMetric)
      )

      coEvery { mockPendingMetricsManager.getAllPendingMetricIds() } returns listOf("dev-metric-id")
      coEvery { mockSessionManager.getSessionsWithMetrics(any()) } returns listOf(devSession)
      coEvery { mockEventDispatcher.dispatch(any()) } returns true
      coEvery { mockPendingMetricsManager.removePendingMetrics(any()) } just runs

      val manager = createManager(isDebugBuild = true)

      // Act
      manager.dispatchUnsentMetrics()

      // Assert
      coVerify(exactly = 1) { mockEventDispatcher.dispatch(any()) }
    }

  @Test
  fun `when isJsDev is false and isDebugBuild is false, metrics dispatch (release everywhere)`() =
    runTest {
      // Arrange — full release path.
      every { ObservePreferences.getBundleDefaults(any()) } returns
        PersistedBundleDefaults(environment = "production", isJsDev = false)
      every { ObservePreferences.getConfig(any()) } returns PersistedConfig(dispatchInDebug = false)
      val prodMetric = createMetric("metric1", metricId = "prod-metric-id")
      val prodSession = createSessionWithMetrics(
        sessionId = "prod-session",
        environment = "production",
        metrics = listOf(prodMetric)
      )

      coEvery { mockPendingMetricsManager.getAllPendingMetricIds() } returns listOf("prod-metric-id")
      coEvery { mockSessionManager.getSessionsWithMetrics(any()) } returns listOf(prodSession)
      coEvery { mockEventDispatcher.dispatch(any()) } returns true
      coEvery { mockPendingMetricsManager.removePendingMetrics(any()) } just runs

      val manager = createManager(isDebugBuild = false)

      // Act
      manager.dispatchUnsentMetrics()

      // Assert
      coVerify(exactly = 1) { mockEventDispatcher.dispatch(any()) }
    }

  @Test
  fun `when getBundleDefaults returns null, gate is determined by isDebugBuild alone`() =
    runTest {
      // Arrange — cold start before JS has run. isJsDev defaults to false.
      every { ObservePreferences.getBundleDefaults(any()) } returns null
      every { ObservePreferences.getConfig(any()) } returns PersistedConfig(dispatchInDebug = false)
      coEvery { mockPendingMetricsManager.getAllPendingMetricIds() } returns listOf("id1")
      coEvery { mockPendingMetricsManager.removePendingMetrics(any()) } just runs

      val manager = createManager(isDebugBuild = true)

      // Act
      manager.dispatchUnsentMetrics()

      // Assert — isDebugBuild alone gates dispatch.
      coVerify(exactly = 0) { mockEventDispatcher.dispatch(any()) }
      coVerify(exactly = 1) { mockPendingMetricsManager.removePendingMetrics(listOf("id1")) }
    }

  // endregion

  // region sampleRate tests

  @Test
  fun `when sampleRate is null, metrics dispatch normally`() =
    runTest {
      // Arrange
      every { ObservePreferences.getConfig(any()) } returns PersistedConfig(sampleRate = null)
      val metric = createMetric("metric1", metricId = "id1")
      val session = createSessionWithMetrics(
        sessionId = "session-1",
        environment = "production",
        metrics = listOf(metric)
      )
      coEvery { mockPendingMetricsManager.getAllPendingMetricIds() } returns listOf("id1")
      coEvery { mockSessionManager.getSessionsWithMetrics(any()) } returns listOf(session)
      coEvery { mockEventDispatcher.dispatch(any()) } returns true

      // `deterministicUniformValue` must not matter when sampleRate is null.
      val manager = createManager(deterministicUniformValue = 0.999)

      // Act
      manager.dispatchUnsentMetrics()

      // Assert
      coVerify(exactly = 1) { mockEventDispatcher.dispatch(any()) }
    }

  @Test
  fun `when deterministicUniformValue is less than sampleRate, metrics dispatch`() =
    runTest {
      // Arrange — sampleRate = 0.5, device value = 0.2 → in-sample
      every { ObservePreferences.getConfig(any()) } returns PersistedConfig(sampleRate = 0.5)
      val metric = createMetric("metric1", metricId = "id1")
      val session = createSessionWithMetrics(
        sessionId = "session-1",
        environment = "production",
        metrics = listOf(metric)
      )
      coEvery { mockPendingMetricsManager.getAllPendingMetricIds() } returns listOf("id1")
      coEvery { mockSessionManager.getSessionsWithMetrics(any()) } returns listOf(session)
      coEvery { mockEventDispatcher.dispatch(any()) } returns true

      val manager = createManager(deterministicUniformValue = 0.2)

      // Act
      manager.dispatchUnsentMetrics()

      // Assert
      coVerify(exactly = 1) { mockEventDispatcher.dispatch(any()) }
    }

  @Test
  fun `when deterministicUniformValue is greater than sampleRate, metrics are dropped without dispatching`() =
    runTest {
      // Arrange — sampleRate = 0.5, device value = 0.8 → out-of-sample
      every { ObservePreferences.getConfig(any()) } returns PersistedConfig(sampleRate = 0.5)
      coEvery { mockPendingMetricsManager.getAllPendingMetricIds() } returns listOf("id1", "id2")

      val removedIds = mutableListOf<String>()
      coEvery { mockPendingMetricsManager.removePendingMetrics(any()) } answers {
        removedIds.addAll(firstArg<List<String>>())
      }

      val manager = createManager(deterministicUniformValue = 0.8)

      // Act
      manager.dispatchUnsentMetrics()

      // Assert — no dispatch, pending is cleared
      coVerify(exactly = 0) { mockEventDispatcher.dispatch(any()) }
      coVerify(exactly = 0) { mockSessionManager.getSessionsWithMetrics(any()) }
      assertEquals(listOf("id1", "id2"), removedIds)
    }

  @Test
  fun `when deterministicUniformValue is equal to sampleRate, metrics are dropped without dispatching`() =
    runTest {
      // Arrange — sampleRate = 0.5, device value = 0.5 → out-of-sample (comparison is strict <).
      every { ObservePreferences.getConfig(any()) } returns PersistedConfig(sampleRate = 0.5)
      coEvery { mockPendingMetricsManager.getAllPendingMetricIds() } returns listOf("id1", "id2")

      val removedIds = mutableListOf<String>()
      coEvery { mockPendingMetricsManager.removePendingMetrics(any()) } answers {
        removedIds.addAll(firstArg<List<String>>())
      }

      val manager = createManager(deterministicUniformValue = 0.5)

      // Act
      manager.dispatchUnsentMetrics()

      // Assert — no dispatch, pending is cleared
      coVerify(exactly = 0) { mockEventDispatcher.dispatch(any()) }
      coVerify(exactly = 0) { mockSessionManager.getSessionsWithMetrics(any()) }
      assertEquals(listOf("id1", "id2"), removedIds)
    }

  @Test
  fun `when sampleRate is 0_0, metrics are always dropped`() =
    runTest {
      // Arrange — any deterministic value is >= 0, so sampleRate=0 → out.
      every { ObservePreferences.getConfig(any()) } returns PersistedConfig(sampleRate = 0.0)
      coEvery { mockPendingMetricsManager.getAllPendingMetricIds() } returns listOf("id1")
      coEvery { mockPendingMetricsManager.removePendingMetrics(any()) } just runs

      val manager = createManager(deterministicUniformValue = 0.0)

      // Act
      manager.dispatchUnsentMetrics()

      // Assert
      coVerify(exactly = 0) { mockEventDispatcher.dispatch(any()) }
      coVerify(exactly = 1) { mockPendingMetricsManager.removePendingMetrics(listOf("id1")) }
    }

  @Test
  fun `when sampleRate is 1_0, metrics always dispatch`() =
    runTest {
      // Arrange — deterministic value of 0.999... is always < 1.0.
      every { ObservePreferences.getConfig(any()) } returns PersistedConfig(sampleRate = 1.0)
      val metric = createMetric("metric1", metricId = "id1")
      val session = createSessionWithMetrics(
        sessionId = "session-1",
        environment = "production",
        metrics = listOf(metric)
      )
      coEvery { mockPendingMetricsManager.getAllPendingMetricIds() } returns listOf("id1")
      coEvery { mockSessionManager.getSessionsWithMetrics(any()) } returns listOf(session)
      coEvery { mockEventDispatcher.dispatch(any()) } returns true

      val manager = createManager(deterministicUniformValue = 0.9999999)

      // Act
      manager.dispatchUnsentMetrics()

      // Assert
      coVerify(exactly = 1) { mockEventDispatcher.dispatch(any()) }
    }

  @Test
  fun `sampleRate above 1_0 is clamped and metrics dispatch`() =
    runTest {
      // Arrange — 2.0 → clamped to 1.0 → in-sample.
      every { ObservePreferences.getConfig(any()) } returns PersistedConfig(sampleRate = 2.0)
      val metric = createMetric("metric1", metricId = "id1")
      val session = createSessionWithMetrics(
        sessionId = "session-1",
        environment = "production",
        metrics = listOf(metric)
      )
      coEvery { mockPendingMetricsManager.getAllPendingMetricIds() } returns listOf("id1")
      coEvery { mockSessionManager.getSessionsWithMetrics(any()) } returns listOf(session)
      coEvery { mockEventDispatcher.dispatch(any()) } returns true

      val manager = createManager(deterministicUniformValue = 0.95)

      // Act
      manager.dispatchUnsentMetrics()

      // Assert
      coVerify(exactly = 1) { mockEventDispatcher.dispatch(any()) }
    }

  @Test
  fun `sampleRate below 0_0 is clamped and metrics are dropped`() =
    runTest {
      // Arrange — -0.5 → clamped to 0.0 → out-of-sample.
      every { ObservePreferences.getConfig(any()) } returns PersistedConfig(sampleRate = -0.5)
      coEvery { mockPendingMetricsManager.getAllPendingMetricIds() } returns listOf("id1")
      coEvery { mockPendingMetricsManager.removePendingMetrics(any()) } just runs

      val manager = createManager(deterministicUniformValue = 0.0)

      // Act
      manager.dispatchUnsentMetrics()

      // Assert
      coVerify(exactly = 0) { mockEventDispatcher.dispatch(any()) }
      coVerify(exactly = 1) { mockPendingMetricsManager.removePendingMetrics(listOf("id1")) }
    }

  @Test
  fun `when dispatchingEnabled is false, sampleRate of 1_0 still drops metrics`() =
    runTest {
      // Arrange — dispatchingEnabled=false wins over sampleRate=1.0.
      every { ObservePreferences.getConfig(any()) } returns PersistedConfig(dispatchingEnabled = false, sampleRate = 1.0)
      coEvery { mockPendingMetricsManager.getAllPendingMetricIds() } returns listOf("id1")
      coEvery { mockPendingMetricsManager.removePendingMetrics(any()) } just runs

      val manager = createManager(deterministicUniformValue = 0.0)

      // Act
      manager.dispatchUnsentMetrics()

      // Assert
      coVerify(exactly = 0) { mockEventDispatcher.dispatch(any()) }
      coVerify(exactly = 1) { mockPendingMetricsManager.removePendingMetrics(listOf("id1")) }
    }

  // endregion

  // region Fetching metrics tests

  @Test
  fun `dispatchUnsentMetrics does nothing when no pending metrics exist`() =
    runTest {
      // Arrange
      coEvery { mockPendingMetricsManager.getAllPendingMetricIds() } returns emptyList()

      val manager = createManager()

      // Act
      manager.dispatchUnsentMetrics()

      // Assert
      coVerify(exactly = 0) { mockEventDispatcher.dispatch(any()) }
      coVerify(exactly = 0) { mockPendingMetricsManager.removePendingMetrics(any()) }
      coVerify(exactly = 0) { mockSessionManager.getSessionsWithMetrics(any()) }
    }

  @Test
  fun `dispatchUnsentMetrics fetches pending IDs then sessions from SessionManager`() =
    runTest {
      // Arrange
      val pendingIds = listOf("metric-1", "metric-2")
      coEvery { mockPendingMetricsManager.getAllPendingMetricIds() } returns pendingIds
      coEvery { mockSessionManager.getSessionsWithMetrics(pendingIds) } returns emptyList()

      val manager = createManager()

      // Act
      manager.dispatchUnsentMetrics()

      // Assert
      coVerify(exactly = 1) { mockPendingMetricsManager.getAllPendingMetricIds() }
      coVerify(exactly = 1) { mockSessionManager.getSessionsWithMetrics(pendingIds) }
    }

  @Test
  fun `dispatchUnsentMetrics cleans up orphaned pending IDs with no matching metrics`() =
    runTest {
      // Arrange - pending IDs exist but only some map to actual metrics
      val metric1 = createMetric("metric1", metricId = "id1")
      val session = createSessionWithMetrics(
        sessionId = "session-1",
        environment = "production",
        metrics = listOf(metric1)
      )

      coEvery { mockPendingMetricsManager.getAllPendingMetricIds() } returns listOf("id1", "orphaned-id")
      coEvery { mockSessionManager.getSessionsWithMetrics(any()) } returns listOf(session)
      coEvery { mockEventDispatcher.dispatch(any()) } returns true

      val removedIdBatches = mutableListOf<List<String>>()
      coEvery { mockPendingMetricsManager.removePendingMetrics(any()) } answers {
        removedIdBatches.add(firstArg<List<String>>().toList())
      }

      val manager = createManager()

      // Act
      manager.dispatchUnsentMetrics()

      // Assert - orphaned ID is cleaned up in first batch, dispatched ID in second
      assertEquals(2, removedIdBatches.size)
      assertEquals(listOf("orphaned-id"), removedIdBatches[0])
      assertEquals(listOf("id1"), removedIdBatches[1])
    }

  @Test
  fun `dispatchUnsentMetrics cleans up all orphaned pending IDs when no sessions match`() =
    runTest {
      // Arrange - all pending IDs are orphaned
      coEvery { mockPendingMetricsManager.getAllPendingMetricIds() } returns listOf("orphan-1", "orphan-2")
      coEvery { mockSessionManager.getSessionsWithMetrics(any()) } returns emptyList()

      val removedIds = mutableListOf<String>()
      coEvery { mockPendingMetricsManager.removePendingMetrics(any()) } answers {
        removedIds.addAll(firstArg<List<String>>())
      }

      val manager = createManager()

      // Act
      manager.dispatchUnsentMetrics()

      // Assert - orphaned IDs are cleaned up, no dispatch
      coVerify(exactly = 0) { mockEventDispatcher.dispatch(any()) }
      assertEquals(2, removedIds.size)
      assertTrue(removedIds.contains("orphan-1"))
      assertTrue(removedIds.contains("orphan-2"))
    }

  @Test
  fun `dispatchUnsentMetrics removes all metric IDs from pending after successful dispatch`() =
    runTest {
      // Arrange
      val metric1 = createMetric("metric1", metricId = "id1")
      val metric2 = createMetric("metric2", metricId = "id2")
      val metric3 = createMetric("metric3", metricId = "id3")
      val session1 = createSessionWithMetrics(
        sessionId = "session-1",
        environment = "production",
        metrics = listOf(metric1, metric2)
      )
      val session2 = createSessionWithMetrics(
        sessionId = "session-2",
        environment = "production",
        metrics = listOf(metric3)
      )

      coEvery { mockPendingMetricsManager.getAllPendingMetricIds() } returns listOf("id1", "id2", "id3")
      coEvery { mockSessionManager.getSessionsWithMetrics(any()) } returns listOf(session1, session2)
      coEvery { mockEventDispatcher.dispatch(any()) } returns true

      val removedIds = mutableListOf<String>()
      coEvery { mockPendingMetricsManager.removePendingMetrics(any()) } answers {
        removedIds.addAll(firstArg<List<String>>())
      }

      val manager = createManager()

      // Act
      manager.dispatchUnsentMetrics()

      // Assert - ALL metric IDs from ALL sessions are removed from pending
      assertEquals("All 3 metric IDs should be removed from pending", 3, removedIds.size)
      assertTrue("Metric id1 should be removed from pending", removedIds.contains("id1"))
      assertTrue("Metric id2 should be removed from pending", removedIds.contains("id2"))
      assertTrue("Metric id3 should be removed from pending", removedIds.contains("id3"))
    }

  @Test
  fun `dispatchUnsentMetrics does not remove metric IDs from pending when dispatch fails`() =
    runTest {
      // Arrange
      val metric1 = createMetric("metric1", metricId = "id1")
      val metric2 = createMetric("metric2", metricId = "id2")
      val session = createSessionWithMetrics(
        sessionId = "session-1",
        environment = "production",
        metrics = listOf(metric1, metric2)
      )

      coEvery { mockPendingMetricsManager.getAllPendingMetricIds() } returns listOf("id1", "id2")
      coEvery { mockSessionManager.getSessionsWithMetrics(any()) } returns listOf(session)
      coEvery { mockEventDispatcher.dispatch(any()) } returns false

      val manager = createManager()

      // Act
      manager.dispatchUnsentMetrics()

      // Assert - NO metric IDs should be removed from pending when dispatch fails
      coVerify(exactly = 0) { mockPendingMetricsManager.removePendingMetrics(any()) }
    }

  // endregion

  // region Cleanup tests

  @Test
  fun `cleanup prunes pending metrics and stale sessions`() =
    runTest {
      // Arrange
      val manager = createManager()

      // Act
      manager.cleanup()

      // Assert
      coVerify(exactly = 1) { mockPendingMetricsManager.cleanupOldPendingMetrics() }
      coVerify(exactly = 1) { mockSessionManager.cleanupOldSessions() }
    }

  // endregion

  // region Transformation tests

  @Test
  fun `Metadata fromSessionMetadata transforms all fields correctly`() {
    // Arrange
    val session = Session(
      id = "test-session",
      startTimestamp = "2025-01-01T00:00:00.000Z",
      isActive = true,
      environment = "production",
      appName = "TestApp",
      appIdentifier = "com.test.app",
      appVersion = "1.2.3",
      appBuildNumber = "42",
      appUpdateId = "update-123",
      deviceOs = "Android",
      deviceOsVersion = "14",
      deviceModel = "Pixel 8",
      deviceName = "oriole",
      expoSdkVersion = "52.0.0",
      reactNativeVersion = "0.76.0",
      clientVersion = "1.0.0",
      languageTag = "en-US"
    )

    // Act
    val metadata = Metadata.fromSessionMetadata(session)

    // Assert
    assertEquals("TestApp", metadata.appName)
    assertEquals("com.test.app", metadata.appIdentifier)
    assertEquals("1.2.3", metadata.appVersion)
    assertEquals("42", metadata.appBuildNumber)
    assertEquals("update-123", metadata.appUpdatesInfo?.updateId)
    assertEquals("Android", metadata.deviceOs)
    assertEquals("14", metadata.deviceOsVersion)
    assertEquals("Pixel 8", metadata.deviceModel)
    assertEquals("oriole", metadata.deviceName)
    assertEquals("52.0.0", metadata.expoSdkVersion)
    assertEquals("0.76.0", metadata.reactNativeVersion)
    assertEquals("1.0.0", metadata.clientVersion)
    assertEquals("en-US", metadata.languageTag)
    assertEquals("production", metadata.environment)
  }

  @Test
  fun `Metadata fromSessionMetadata handles null fields`() {
    // Arrange
    val session = Session(
      id = "test-session",
      startTimestamp = "2025-01-01T00:00:00.000Z",
      isActive = true,
      environment = null,
      appName = null,
      appIdentifier = null,
      appVersion = null,
      appBuildNumber = null,
      appUpdateId = null,
      deviceOs = null,
      deviceOsVersion = null,
      deviceModel = null,
      deviceName = null,
      expoSdkVersion = null,
      reactNativeVersion = null,
      clientVersion = null,
      languageTag = null
    )

    // Act
    val metadata = Metadata.fromSessionMetadata(session)

    // Assert
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
    // Arrange
    val metric = Metric(
      metricId = "metric-123",
      sessionId = "session-456",
      timestamp = "2025-01-01T12:00:00.000Z",
      category = "performance",
      name = "app_start",
      value = 1500.5,
      routeName = "/home",
      params = """{"key":"value"}"""
    )

    // Act
    val easMetric = EASMetric.fromMetric(metric)

    // Assert
    assertEquals("session-456", easMetric.sessionId)
    assertEquals("2025-01-01T12:00:00.000Z", easMetric.timestamp)
    assertEquals("performance", easMetric.category)
    assertEquals("app_start", easMetric.name)
    assertEquals(1500.5, easMetric.value, 0.001)
    assertEquals("/home", easMetric.routeName)
    assertEquals(
      buildJsonObject { put("key", "value") },
      easMetric.customParams
    )
  }

  @Test
  fun `EASMetric fromMetric handles null optional fields`() {
    // Arrange
    val metric = Metric(
      metricId = "metric-123",
      sessionId = "session-456",
      timestamp = "2025-01-01T12:00:00.000Z",
      category = "performance",
      name = "app_start",
      value = 1500.5,
      routeName = null,
      params = null
    )

    // Act
    val easMetric = EASMetric.fromMetric(metric)

    // Assert
    assertNull(easMetric.routeName)
    assertNull(easMetric.customParams)
  }

  @Test
  fun `dispatchUnsentMetrics transforms SessionWithMetrics to Event correctly`() =
    runTest {
      // Arrange
      val metric1 = createMetric("loadTime", value = 0.5, category = "appStartup", metricId = "m1")
      val metric2 = createMetric("launchTime", value = 1.2, category = "appStartup", metricId = "m2")
      val session = createSessionWithMetrics(
        sessionId = "session-1",
        environment = "production",
        appName = "MyApp",
        appVersion = "2.0.0",
        metrics = listOf(metric1, metric2)
      )

      coEvery { mockPendingMetricsManager.getAllPendingMetricIds() } returns listOf("m1", "m2")
      coEvery { mockSessionManager.getSessionsWithMetrics(any()) } returns listOf(session)
      coEvery { mockEventDispatcher.dispatch(any()) } returns true

      val manager = createManager()

      // Act
      manager.dispatchUnsentMetrics()

      // Assert
      coVerify {
        mockEventDispatcher.dispatch(
          match { events ->
            events.size == 1 &&
              events[0].metadata.appName == "MyApp" &&
              events[0].metadata.appVersion == "2.0.0" &&
              events[0].metadata.environment == "production" &&
              events[0].metrics.size == 2 &&
              events[0].metrics.any { it.name == "loadTime" && it.value == 0.5 } &&
              events[0].metrics.any { it.name == "launchTime" && it.value == 1.2 }
          }
        )
      }
    }

  @Test
  fun `dispatchUnsentMetrics creates separate events for each session`() =
    runTest {
      // Arrange
      val metric1 = createMetric("metric1", metricId = "metric-id-1")
      val metric2 = createMetric("metric2", metricId = "metric-id-2")
      val session1 = createSessionWithMetrics(
        sessionId = "session-1",
        environment = "production",
        appVersion = "1.0.0",
        metrics = listOf(metric1)
      )
      val session2 = createSessionWithMetrics(
        sessionId = "session-2",
        environment = "production",
        appVersion = "2.0.0",
        metrics = listOf(metric2)
      )

      coEvery { mockPendingMetricsManager.getAllPendingMetricIds() } returns listOf("metric-id-1", "metric-id-2")
      coEvery { mockSessionManager.getSessionsWithMetrics(any()) } returns listOf(session1, session2)
      coEvery { mockEventDispatcher.dispatch(any()) } returns true

      val removedIds = mutableListOf<String>()
      coEvery { mockPendingMetricsManager.removePendingMetrics(any()) } answers {
        removedIds.addAll(firstArg<List<String>>())
      }

      val manager = createManager()

      // Act
      manager.dispatchUnsentMetrics()

      // Assert - separate events created
      coVerify {
        mockEventDispatcher.dispatch(
          match { events ->
            events.size == 2 &&
              events.any { it.metadata.appVersion == "1.0.0" } &&
              events.any { it.metadata.appVersion == "2.0.0" }
          }
        )
      }

      // Assert - ALL metric IDs from both sessions are removed from pending
      assertEquals(2, removedIds.size)
      assertTrue("Metric 1 should be removed from pending", removedIds.contains("metric-id-1"))
      assertTrue("Metric 2 should be removed from pending", removedIds.contains("metric-id-2"))
    }

  // endregion

  // region Helper methods

  private fun createManager(
    isDebugBuild: Boolean = false,
    deterministicUniformValue: Double = 0.0
  ): BaseObservabilityManager {
    val manager = BaseObservabilityManager(
      context = mockContext,
      sessionManager = mockSessionManager,
      pendingMetricsManager = mockPendingMetricsManager,
      projectId = testProjectId,
      baseUrl = testBaseUrl,
      isDebugBuild = isDebugBuild,
      deterministicUniformValueProvider = { deterministicUniformValue }
    )
    // Replace the internal EventDispatcher with our mock
    val field = BaseObservabilityManager::class.java.getDeclaredField("eventDispatcher")
    field.isAccessible = true
    field.set(manager, mockEventDispatcher)
    return manager
  }

  private fun createSessionWithMetrics(
    sessionId: String,
    environment: String?,
    metrics: List<Metric>,
    appName: String = "TestApp",
    appVersion: String = "1.0.0"
  ): SessionWithMetrics {
    val session = Session(
      id = sessionId,
      startTimestamp = "2025-01-01T00:00:00.000Z",
      isActive = true,
      environment = environment,
      appName = appName,
      appIdentifier = "com.test.app",
      appVersion = appVersion,
      appBuildNumber = "1",
      appUpdateId = null,
      deviceOs = "Android",
      deviceOsVersion = "14",
      deviceModel = "Test Device",
      deviceName = "test",
      expoSdkVersion = "52.0.0",
      reactNativeVersion = "0.76.0",
      clientVersion = null,
      languageTag = "en-US"
    )
    return SessionWithMetrics(
      session = session,
      metrics = metrics.map { it.copy(sessionId = sessionId) }
    )
  }

  private fun createMetric(
    name: String,
    metricId: String = "metric-${System.nanoTime()}",
    value: Double = 123.45,
    category: String = "test"
  ): Metric =
    Metric(
      metricId = metricId,
      sessionId = "",
      timestamp = "2025-01-01T00:00:00.000Z",
      category = category,
      name = name,
      value = value,
      routeName = null,
      params = null
    )

  // endregion
}
