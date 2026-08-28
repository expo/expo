package expo.modules.observe.storage

import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class PendingMetricsManagerTest {
  private lateinit var database: ObserveDatabase
  private lateinit var manager: PendingMetricsManager

  @Before
  fun setUp() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    database = Room
      .inMemoryDatabaseBuilder(context, ObserveDatabase::class.java)
      .allowMainThreadQueries()
      .build()
    manager = PendingMetricsManager(context, database)
  }

  @After
  fun tearDown() {
    database.close()
  }

  @Test
  fun `addPendingMetrics inserts metrics correctly`() =
    runTest {
      // Arrange
      val metricIds = listOf("metric-1", "metric-2", "metric-3")

      // Act
      manager.addPendingMetrics(metricIds)

      // Assert
      val result = manager.getPendingMetricIds(Int.MAX_VALUE)
      assertEquals(3, result.size)
      assertTrue(result.containsAll(metricIds))
    }

  @Test
  fun `getPendingMetricIds returns all inserted IDs from multiple add calls`() =
    runTest {
      // Arrange
      manager.addPendingMetrics(listOf("metric-1", "metric-2"))
      manager.addPendingMetrics(listOf("metric-3"))

      // Act
      val result = manager.getPendingMetricIds(Int.MAX_VALUE)

      // Assert
      assertEquals(3, result.size)
      assertTrue(result.containsAll(listOf("metric-1", "metric-2", "metric-3")))
    }

  @Test
  fun `getPendingMetricIds returns the oldest IDs up to the limit`() =
    runTest {
      database.pendingMetricDao().insertAll(
        listOf(
          PendingMetric("metric-3", "2025-01-03T00:00:00.000Z"),
          PendingMetric("metric-1", "2025-01-01T00:00:00.000Z"),
          PendingMetric("metric-4", "2025-01-04T00:00:00.000Z"),
          PendingMetric("metric-2", "2025-01-02T00:00:00.000Z")
        )
      )

      val result = manager.getPendingMetricIds(2)

      assertEquals(listOf("metric-1", "metric-2"), result)
    }

  @Test
  fun `removePendingMetrics deletes specified IDs only`() =
    runTest {
      // Arrange
      manager.addPendingMetrics(listOf("metric-1", "metric-2", "metric-3"))

      // Act
      manager.removePendingMetrics(listOf("metric-1", "metric-3"))

      // Assert
      val remaining = manager.getPendingMetricIds(Int.MAX_VALUE)
      assertEquals(1, remaining.size)
      assertEquals("metric-2", remaining[0])
    }

  @Test
  fun `cleanupOldPendingMetrics removes old entries`() =
    runTest {
      // Arrange - insert a metric with a very old timestamp directly via DAO
      val oldMetric = PendingMetric(metricId = "old-metric", addedAt = "2020-01-01T00:00:00.000Z")
      database.pendingMetricDao().insertAll(listOf(oldMetric))

      // Insert a recent metric via the manager (uses current timestamp)
      manager.addPendingMetrics(listOf("recent-metric"))

      // Verify both exist
      assertEquals(2, manager.getPendingMetricIds(Int.MAX_VALUE).size)

      // Act
      manager.cleanupOldPendingMetrics()

      // Assert - only recent metric survives
      val remaining = manager.getPendingMetricIds(Int.MAX_VALUE)
      assertEquals(1, remaining.size)
      assertEquals("recent-metric", remaining[0])
    }

  @Test
  fun `addPendingMetrics with duplicate IDs ignores duplicates`() =
    runTest {
      // Arrange
      manager.addPendingMetrics(listOf("metric-1", "metric-2"))

      // Act - insert overlapping IDs
      manager.addPendingMetrics(listOf("metric-2", "metric-3"))

      // Assert - no duplicates
      val result = manager.getPendingMetricIds(Int.MAX_VALUE)
      assertEquals(3, result.size)
      assertTrue(result.containsAll(listOf("metric-1", "metric-2", "metric-3")))
    }

  @Test
  fun `removePendingMetrics with empty list is a no-op`() =
    runTest {
      // Arrange
      manager.addPendingMetrics(listOf("metric-1", "metric-2"))

      // Act
      manager.removePendingMetrics(emptyList())

      // Assert - nothing removed
      assertEquals(2, manager.getPendingMetricIds(Int.MAX_VALUE).size)
    }

  @Test
  fun `removeAllPendingMetrics deletes all pending metrics`() =
    runTest {
      manager.addPendingMetrics(listOf("metric-1", "metric-2"))

      manager.removeAllPendingMetrics()

      assertFalse(manager.hasPendingMetrics())
    }

  @Test
  fun `removePendingMetrics handles more than 900 items`() =
    runTest {
      // Arrange - insert 1100 metrics
      val allIds = (1..1100).map { "metric-$it" }
      allIds.chunked(500).forEach { chunk ->
        manager.addPendingMetrics(chunk)
      }
      assertEquals(1100, manager.getPendingMetricIds(Int.MAX_VALUE).size)

      // Act - remove all 1100 at once
      manager.removePendingMetrics(allIds)

      // Assert - all removed
      val remaining = manager.getPendingMetricIds(Int.MAX_VALUE)
      assertTrue("Expected empty but got ${remaining.size} items", remaining.isEmpty())
    }
}
