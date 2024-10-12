package expo.modules.updates.logging

import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import androidx.test.platform.app.InstrumentationRegistry
import expo.modules.core.logging.LogType
import expo.modules.core.logging.PersistentFileLog
import expo.modules.updates.UpdatesModule
import expo.modules.updates.logging.UpdatesLogger.Companion.EXPO_UPDATES_LOGGING_TAG
import expo.modules.updates.logging.UpdatesLogger.Companion.MAX_FRAMES_IN_STACKTRACE
import org.junit.Assert
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import java.util.*

@RunWith(AndroidJUnit4ClassRunner::class)
class UpdatesLoggingTest {

  @Before
  fun setup() {
    val asyncTestUtil = AsyncTestUtil()
    val instrumentationContext = InstrumentationRegistry.getInstrumentation().context
    val persistentLog = PersistentFileLog(EXPO_UPDATES_LOGGING_TAG, instrumentationContext)

    asyncTestUtil.asyncMethodRunning = true
    persistentLog.clearEntries {
      asyncTestUtil.asyncMethodRunning = false
    }
    asyncTestUtil.waitForAsyncMethodToFinish("clearEntries timed out", 1000)
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
    val asyncTestUtil = AsyncTestUtil()
    val instrumentationContext = InstrumentationRegistry.getInstrumentation().context
    val logger = UpdatesLogger(instrumentationContext)
    val now = Date()
    val expectedLogEntry = UpdatesLogEntry(now.time, "Test message", UpdatesErrorCode.JSRuntimeError.code, LogType.Warn.type, null, null, null, null)
    logger.warn("Test message", UpdatesErrorCode.JSRuntimeError)
    asyncTestUtil.waitForTimeout(500)
    val sinceThen = Date(now.time - 5000)
    val logs = UpdatesLogReader(instrumentationContext).getLogEntries(sinceThen)
    Assert.assertTrue(logs.isNotEmpty())
    val actualLogEntry = UpdatesLogEntry.create(logs[logs.size - 1]) as UpdatesLogEntry
    Assert.assertEquals(expectedLogEntry.timestamp / 1000, actualLogEntry.timestamp / 1000)
    Assert.assertEquals(expectedLogEntry.message, actualLogEntry.message)
    Assert.assertEquals(expectedLogEntry.code, actualLogEntry.code)
    Assert.assertEquals(expectedLogEntry.level, actualLogEntry.level)
  }

  @Test
  fun testTimer() {
    val asyncTestUtil = AsyncTestUtil()
    val instrumentationContext = InstrumentationRegistry.getInstrumentation().context
    val logger = UpdatesLogger(instrumentationContext)
    val now = Date()

    val timer = logger.startTimer("testlabel")
    asyncTestUtil.waitForTimeout(300)
    timer.stop()

    asyncTestUtil.waitForTimeout(500)
    val sinceThen = Date(now.time - 5000)
    val logs = UpdatesLogReader(instrumentationContext).getLogEntries(sinceThen)
    Assert.assertTrue(logs.isNotEmpty())

    val actualLogEntry = UpdatesLogEntry.create(logs[logs.size - 1]) as UpdatesLogEntry
    Assert.assertEquals("testlabel", actualLogEntry.message)
    Assert.assertTrue(actualLogEntry.duration!! >= 300)
  }

  @Test
  fun testLogReaderTimeLimit() {
    val asyncTestUtil = AsyncTestUtil()
    val instrumentationContext = InstrumentationRegistry.getInstrumentation().context
    val logger = UpdatesLogger(instrumentationContext)
    val reader = UpdatesLogReader(instrumentationContext)

    val firstTime = Date()
    logger.info("Message 1", UpdatesErrorCode.None)
    asyncTestUtil.waitForTimeout(500)
    val secondTime = Date()
    val cause = Exception("test")
    logger.error("Message 2", cause, UpdatesErrorCode.NoUpdatesAvailable)
    asyncTestUtil.waitForTimeout(500)
    val thirdTime = Date()

    val firstLogs = reader.getLogEntries(firstTime)
    Assert.assertEquals(2, firstLogs.size)
    Assert.assertEquals("Message 1", UpdatesLogEntry.create(firstLogs[0])?.message)
    Assert.assertEquals("Message 2", UpdatesLogEntry.create(firstLogs[1])?.message)

    val secondLogs = reader.getLogEntries(secondTime)
    Assert.assertEquals(1, secondLogs.size)
    Assert.assertEquals("Message 2", UpdatesLogEntry.create(secondLogs[0])?.message)
    Assert.assertEquals(MAX_FRAMES_IN_STACKTRACE, UpdatesLogEntry.create(secondLogs[0])?.stacktrace?.size)

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
    Assert.assertEquals("Message 2", UpdatesLogEntry.create(purgedLogs[0])?.message)
  }

  @Test
  fun testNativeMethods() {
    val asyncTestUtil = AsyncTestUtil()
    val instrumentationContext = InstrumentationRegistry.getInstrumentation().context
    val logger = UpdatesLogger(instrumentationContext)
    logger.warn("Test message", UpdatesErrorCode.JSRuntimeError)
    val entries = UpdatesModule.readLogEntries(
      instrumentationContext,
      1000L
    )
    Assert.assertNotNull(entries)
    Assert.assertEquals(1, entries.size)
    val bundle = entries[0]
    Assert.assertEquals("Test message", bundle.getString("message"))

    var rejected = false
    asyncTestUtil.asyncMethodRunning = true
    UpdatesModule.clearLogEntries(instrumentationContext) { error ->
      if (error != null) {
        rejected = true
        asyncTestUtil.asyncMethodRunning = false
      }
      asyncTestUtil.asyncMethodRunning = false
    }
    asyncTestUtil.waitForAsyncMethodToFinish("clearLogEntriesAsync timed out", 1000)
    Assert.assertFalse(rejected)

    val entries2 = UpdatesModule.readLogEntries(
      instrumentationContext,
      1000L
    )
    asyncTestUtil.waitForAsyncMethodToFinish("readLogEntriesAsync timed out", 1000000)
    Assert.assertNotNull(entries2)
    Assert.assertEquals(0, entries2.size)
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
