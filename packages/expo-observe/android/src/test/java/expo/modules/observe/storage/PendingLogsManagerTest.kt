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
class PendingLogsManagerTest {
  private lateinit var database: ObserveDatabase
  private lateinit var manager: PendingLogsManager

  @Before
  fun setUp() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    database = Room
      .inMemoryDatabaseBuilder(context, ObserveDatabase::class.java)
      .allowMainThreadQueries()
      .build()
    manager = PendingLogsManager(context, database)
  }

  @After
  fun tearDown() {
    database.close()
  }

  @Test
  fun `addPendingLogs inserts logs correctly`() =
    runTest {
      val logIds = listOf("log-1", "log-2", "log-3")

      manager.addPendingLogs(logIds)

      val result = manager.getPendingLogIds(Int.MAX_VALUE)
      assertEquals(3, result.size)
      assertTrue(result.containsAll(logIds))
    }

  @Test
  fun `getPendingLogIds returns all inserted IDs from multiple add calls`() =
    runTest {
      manager.addPendingLogs(listOf("log-1", "log-2"))
      manager.addPendingLogs(listOf("log-3"))

      val result = manager.getPendingLogIds(Int.MAX_VALUE)

      assertEquals(3, result.size)
      assertTrue(result.containsAll(listOf("log-1", "log-2", "log-3")))
    }

  @Test
  fun `getPendingLogIds returns the oldest IDs up to the limit`() =
    runTest {
      database.pendingLogDao().insertAll(
        listOf(
          PendingLog("log-3", "2025-01-03T00:00:00.000Z"),
          PendingLog("log-1", "2025-01-01T00:00:00.000Z"),
          PendingLog("log-4", "2025-01-04T00:00:00.000Z"),
          PendingLog("log-2", "2025-01-02T00:00:00.000Z")
        )
      )

      val result = manager.getPendingLogIds(2)

      assertEquals(listOf("log-1", "log-2"), result)
    }

  @Test
  fun `hasPendingLogs reflects whether logs are pending`() =
    runTest {
      assertFalse(manager.hasPendingLogs())

      manager.addPendingLogs(listOf("log-1"))

      assertTrue(manager.hasPendingLogs())
    }

  @Test
  fun `removePendingLogs deletes specified IDs only`() =
    runTest {
      manager.addPendingLogs(listOf("log-1", "log-2", "log-3"))

      manager.removePendingLogs(listOf("log-1", "log-3"))

      assertEquals(listOf("log-2"), manager.getPendingLogIds(Int.MAX_VALUE))
    }

  @Test
  fun `cleanupOldPendingLogs removes old entries`() =
    runTest {
      database.pendingLogDao().insertAll(
        listOf(PendingLog(logId = "old-log", addedAt = "2020-01-01T00:00:00.000Z"))
      )
      manager.addPendingLogs(listOf("recent-log"))

      manager.cleanupOldPendingLogs()

      assertEquals(listOf("recent-log"), manager.getPendingLogIds(Int.MAX_VALUE))
    }

  @Test
  fun `addPendingLogs with duplicate IDs ignores duplicates`() =
    runTest {
      manager.addPendingLogs(listOf("log-1", "log-2"))

      manager.addPendingLogs(listOf("log-2", "log-3"))

      val result = manager.getPendingLogIds(Int.MAX_VALUE)
      assertEquals(3, result.size)
      assertTrue(result.containsAll(listOf("log-1", "log-2", "log-3")))
    }

  @Test
  fun `removePendingLogs with empty list is a no-op`() =
    runTest {
      manager.addPendingLogs(listOf("log-1", "log-2"))

      manager.removePendingLogs(emptyList())

      assertEquals(2, manager.getPendingLogIds(Int.MAX_VALUE).size)
    }

  @Test
  fun `removeAllPendingLogs deletes all pending logs`() =
    runTest {
      manager.addPendingLogs(listOf("log-1", "log-2"))

      manager.removeAllPendingLogs()

      assertFalse(manager.hasPendingLogs())
    }

  @Test
  fun `removePendingLogs handles more than 900 items`() =
    runTest {
      val allIds = (1..1100).map { "log-$it" }
      allIds.chunked(500).forEach { chunk ->
        manager.addPendingLogs(chunk)
      }
      assertEquals(1100, manager.getPendingLogIds(Int.MAX_VALUE).size)

      manager.removePendingLogs(allIds)

      val remaining = manager.getPendingLogIds(Int.MAX_VALUE)
      assertTrue("Expected empty but got ${remaining.size} items", remaining.isEmpty())
    }
}
