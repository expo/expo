package expo.modules.updates.logging

import android.os.Bundle
import expo.modules.core.logging.LogType
import expo.modules.core.logging.PersistentFileLog
import expo.modules.updates.UpdatesModule
import expo.modules.updates.logging.UpdatesLogger.Companion.EXPO_UPDATES_LOGGING_TAG
import expo.modules.updates.logging.UpdatesLogger.Companion.MAX_FRAMES_IN_STACKTRACE
import expo.modules.updatesinterface.UpdatesLogMessage
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.runTest
import org.junit.Assert
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import org.json.JSONObject
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.File
import java.io.IOException
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.*

@RunWith(RobolectricTestRunner::class)
class UpdatesLoggingTest {
  @get:Rule
  val temporaryFolder = TemporaryFolder()

  @Before
  fun setup() = runTest {
    val filesDirectory = temporaryFolder.newFolder()
    val persistentLog = PersistentFileLog(EXPO_UPDATES_LOGGING_TAG, filesDirectory)

    val job = launch {
      persistentLog.clearEntries {}
    }
    job.join()
  }

  @Test
  fun testLogEntryConversion() {
    val entry = UpdatesLogEntry(12345678, "Test message", "NoUpdatesAvailable", "warn", null, null, null, null)
    val json = entry.asString()
    val entryCopy = UpdatesLogEntry.create(json)
    Assert.assertEquals(entry.message, entryCopy?.message)
    Assert.assertEquals(entry.timestamp, entryCopy?.timestamp)
    Assert.assertEquals(entry.code, entryCopy?.code)
    Assert.assertEquals(entry.level, entryCopy?.level)
    Assert.assertNull(entryCopy?.updateId)
    Assert.assertNull(entryCopy?.assetId)
    Assert.assertNull(entryCopy?.stacktrace)

    val entry2 = UpdatesLogEntry(12345678, "Test message", "UpdateFailedToLoad", "fatal", null, "myUpdateId", "myAssetId", listOf("stack frame 1", "stack frame 2"))
    val json2 = entry2.asString()
    val entryCopy2 = UpdatesLogEntry.create(json2)
    Assert.assertEquals(entry2.message, entryCopy2?.message)
    Assert.assertEquals(entry2.timestamp, entryCopy2?.timestamp)
    Assert.assertEquals(entry2.code, entryCopy2?.code)
    Assert.assertEquals(entry2.level, entryCopy2?.level)
    Assert.assertEquals(entry2.updateId, entryCopy2?.updateId)
    Assert.assertEquals(entry2.assetId, entryCopy2?.assetId)
    Assert.assertNotNull(entryCopy2?.stacktrace)
    Assert.assertEquals(entry2.stacktrace?.size, entryCopy2?.stacktrace?.size)

    // Test that invalid JSON converts to null
    val testInvalidJSON = "{\"timestamp\":1600000,\"message\":\"Test message\",\"code\":\"JSRuntimeError\",\"level\":\"wa"
    Assert.assertNull(UpdatesLogEntry.create(testInvalidJSON))

    // Test that valid JSON missing a required field converts to null
    val testMissingRequiredFieldJSON = "{\"message\":\"Test message\",\"code\":\"JSRuntimeError\",\"level\":\"warn\"}"
    Assert.assertNull(UpdatesLogEntry.create(testMissingRequiredFieldJSON))
  }

  @Test
  fun testOneLogAppears() {
    val filesDirectory = temporaryFolder.newFolder()
    val asyncTestUtil = AsyncTestUtil()
    val logger = UpdatesLogger(filesDirectory)
    val now = Date()
    val expectedLogEntry = UpdatesLogEntry(now.time, "Error reaping updates: Test message", UpdatesErrorCode.None.code, LogType.Warn.type, null, null, null, null)
    logger.warn(UpdatesLogMessage.ReaperFailed, values = mapOf("cause" to "Test message"))
    asyncTestUtil.waitForTimeout(500)
    val sinceThen = Date(now.time - 5000)
    val logs = UpdatesLogReader(filesDirectory).getLogEntries(sinceThen)
    Assert.assertTrue(logs.isNotEmpty())
    val actualLogEntry = UpdatesLogEntry.create(logs[logs.size - 1]) as UpdatesLogEntry
    Assert.assertEquals(expectedLogEntry.timestamp / 1000, actualLogEntry.timestamp / 1000)
    Assert.assertEquals(expectedLogEntry.message, actualLogEntry.message)
    Assert.assertEquals(expectedLogEntry.code, actualLogEntry.code)
    Assert.assertEquals(expectedLogEntry.level, actualLogEntry.level)
  }

  @Test
  fun `a keyed warning has its key, values and filled template`() = runTest {
    val filesDirectory = temporaryFolder.newFolder()
    val logger = UpdatesLogger(filesDirectory)
    val now = Date()
    val cause = IOException("Permission denied")

    logger.warn(UpdatesLogMessage.ReaperAssetDeleteFailed, cause, mapOf("path" to "/tmp/a.png"), updateId = "myUpdateId")
    AsyncTestUtil().waitForTimeout(500)

    val logs = UpdatesLogReader(filesDirectory).getLogEntries(Date(now.time - 5000))
    val entry = UpdatesLogEntry.create(logs.last())!!
    Assert.assertEquals("reaper.assetDeleteFailed", entry.key)
    Assert.assertEquals(mapOf("path" to "/tmp/a.png", "cause" to "Permission denied"), entry.values)
    Assert.assertEquals("Error deleting asset at /tmp/a.png: Permission denied", entry.message)
    Assert.assertEquals("None", entry.code)
    Assert.assertEquals("warn", entry.level)
    Assert.assertEquals("myUpdateId", entry.updateId)

    val bundle = UpdatesModule.readLogEntries(filesDirectory, 5000L).last()
    Assert.assertEquals("reaper.assetDeleteFailed", bundle.getString("key"))
    Assert.assertEquals("/tmp/a.png", bundle.getBundle("values")?.getString("path"))
    Assert.assertEquals("Permission denied", bundle.getBundle("values")?.getString("cause"))
  }

  @Test
  fun `an entry written before log message keys has no key or values`() {
    val entry = UpdatesLogEntry.create("""{"timestamp":1700000000000,"message":"Old message","code":"None","level":"warn"}""")!!

    Assert.assertEquals("Old message", entry.message)
    Assert.assertNull(entry.key)
    Assert.assertNull(entry.values)
    Assert.assertFalse(JSONObject(entry.asString()).has("key"))
    Assert.assertFalse(JSONObject(entry.asString()).has("values"))
  }

  @Test
  fun `fill leaves a placeholder with no value and does not fill values`() {
    val filled = UpdatesLogger.fill(
      "Asset {assetKey} failed: {cause} ({reason})",
      mapOf("assetKey" to "{cause}", "cause" to "timeout")
    )

    Assert.assertEquals("Asset {cause} failed: timeout ({reason})", filled)
  }

  @Test
  fun `a load failure that was already logged is not logged again`() {
    val filesDirectory = temporaryFolder.newFolder()
    val logger = UpdatesLogger(filesDirectory)
    val now = Date()
    val cause = IOException("Failed to load update", LoggedException("Code signing verification failed for manifest", Exception("Incorrect signature")))

    logger.errorForLoadFailure(UpdatesLogMessage.RemoteFetchFailed, UpdatesLogMessage.RemoteFetchUnreachable, cause, null)
    AsyncTestUtil().waitForTimeout(500)

    Assert.assertEquals(emptyList<String>(), UpdatesLogReader(filesDirectory).getLogEntries(Date(now.time - 5000)))
  }

  @Test
  fun testTimer() {
    val filesDirectory = temporaryFolder.newFolder()
    val asyncTestUtil = AsyncTestUtil()
    val logger = UpdatesLogger(filesDirectory)
    val now = Date()

    val timer = logger.startTimer("testlabel")
    asyncTestUtil.waitForTimeout(300)
    timer.stop()

    asyncTestUtil.waitForTimeout(500)
    val sinceThen = Date(now.time - 5000)
    val logs = UpdatesLogReader(filesDirectory).getLogEntries(sinceThen)
    Assert.assertTrue(logs.isNotEmpty())

    val actualLogEntry = UpdatesLogEntry.create(logs[logs.size - 1]) as UpdatesLogEntry
    Assert.assertEquals("testlabel", actualLogEntry.message)
    Assert.assertTrue(actualLogEntry.duration!! >= 300)
  }

  @Test
  fun testLogReaderTimeLimit() = runTest {
    val filesDirectory = temporaryFolder.newFolder()
    val asyncTestUtil = AsyncTestUtil()
    val logger = UpdatesLogger(filesDirectory)
    val reader = UpdatesLogReader(filesDirectory)

    val firstTime = Date()
    logger.info("Message 1", UpdatesErrorCode.None)
    asyncTestUtil.waitForTimeout(500)
    val secondTime = Date()
    val cause = Exception("test")
    logger.error(UpdatesLogMessage.RemoteFetchFailed, cause, mapOf("cause" to "Message 2"))
    asyncTestUtil.waitForTimeout(500)
    val thirdTime = Date()

    val firstLogs = reader.getLogEntries(firstTime)
    Assert.assertEquals(2, firstLogs.size)
    Assert.assertEquals("Message 1", UpdatesLogEntry.create(firstLogs[0])?.message)
    Assert.assertEquals("Failed to download new update: Message 2", UpdatesLogEntry.create(firstLogs[1])?.message)

    val secondLogs = reader.getLogEntries(secondTime)
    Assert.assertEquals(1, secondLogs.size)
    Assert.assertEquals("Failed to download new update: Message 2", UpdatesLogEntry.create(secondLogs[0])?.message)

    val stacktraceSize = UpdatesLogEntry.create(secondLogs[0])?.stacktrace?.size
    Assert.assertTrue(stacktraceSize == MAX_FRAMES_IN_STACKTRACE)

    val thirdLogs = reader.getLogEntries(thirdTime)
    Assert.assertEquals(0, thirdLogs.size)

    asyncTestUtil.asyncMethodRunning = true
    var err: Exception? = null
    reader.purgeLogEntries(
      secondTime
    ) {
      err = it
      asyncTestUtil.asyncMethodRunning = false
    }
    asyncTestUtil.waitForAsyncMethodToFinish("purgeLogEntries timed out", 1000)
    Assert.assertNull(err)
    val purgedLogs = reader.getLogEntries(firstTime)
    Assert.assertEquals(1, purgedLogs.size)
    Assert.assertEquals("Failed to download new update: Message 2", UpdatesLogEntry.create(purgedLogs[0])?.message)
  }

  @Test
  fun testNativeMethods() = runTest {
    val asyncTestUtil = AsyncTestUtil()
    val filesDirectory = temporaryFolder.newFolder()
    val logger = UpdatesLogger(filesDirectory)
    logger.warn(UpdatesLogMessage.ReaperFailed, values = mapOf("cause" to "Test message"))
    val entries = readLogEntriesWhenWritten(filesDirectory)
    Assert.assertEquals(1, entries.size)
    val bundle = entries[0]
    Assert.assertEquals("Error reaping updates: Test message", bundle.getString("message"))

    var rejected = false
    asyncTestUtil.asyncMethodRunning = true
    UpdatesModule.clearLogEntries(filesDirectory) { error ->
      if (error != null) {
        rejected = true
        asyncTestUtil.asyncMethodRunning = false
      }
      asyncTestUtil.asyncMethodRunning = false
    }
    asyncTestUtil.waitForAsyncMethodToFinish("clearLogEntriesAsync timed out", 1000)
    Assert.assertFalse(rejected)

    val entries2 = UpdatesModule.readLogEntries(
      filesDirectory,
      1000L
    )
    Assert.assertEquals(0, entries2.size)
  }

  @Test
  fun `clearing the log removes entries with any timestamp`() = runTest {
    val filesDirectory = temporaryFolder.newFolder()
    val futureEntry = UpdatesLogEntry(Date().time + 60_000, "Test message", "None", "error", null, null, null, null)
    val appended = CountDownLatch(1)
    PersistentFileLog(EXPO_UPDATES_LOGGING_TAG, filesDirectory).appendEntry(futureEntry.asString()) { appended.countDown() }
    Assert.assertTrue(appended.await(1, TimeUnit.SECONDS))

    val cleared = CountDownLatch(1)
    var clearError: Exception? = null
    UpdatesModule.clearLogEntries(filesDirectory) { error ->
      clearError = error
      cleared.countDown()
    }
    Assert.assertTrue(cleared.await(1, TimeUnit.SECONDS))

    Assert.assertNull(clearError)
    Assert.assertEquals(emptyList<String>(), PersistentFileLog(EXPO_UPDATES_LOGGING_TAG, filesDirectory).readEntries())
  }

  /**
   * The logger writes to the log file on a background queue, so a read right after a log call can
   * run before the write.
   */
  private suspend fun readLogEntriesWhenWritten(filesDirectory: File): List<Bundle> {
    val end = System.currentTimeMillis() + 1000
    while (true) {
      val entries = UpdatesModule.readLogEntries(filesDirectory, 1000L)
      if (entries.isNotEmpty() || System.currentTimeMillis() > end) {
        return entries
      }
      Thread.sleep(16)
    }
  }

  internal class AsyncTestUtil {
    var asyncMethodRunning = false

    fun waitForAsyncMethodToFinish(failureMessage: String, timeout: Long) {
      val end = System.currentTimeMillis() + timeout

      while (asyncMethodRunning) {
        if (System.currentTimeMillis() > end) {
          Assert.fail(failureMessage)
        }
        Thread.sleep(16)
      }
    }

    fun waitForTimeout(timeout: Long) {
      val end = System.currentTimeMillis() + timeout
      while (System.currentTimeMillis() < end) {
        Thread.sleep(16)
      }
    }
  }
}
