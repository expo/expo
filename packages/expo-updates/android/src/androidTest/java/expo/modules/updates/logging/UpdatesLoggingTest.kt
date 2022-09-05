package expo.modules.updates.logging

import android.os.Bundle
import androidx.test.platform.app.InstrumentationRegistry
import expo.modules.core.Promise
import expo.modules.core.logging.LogType
import expo.modules.core.logging.PersistentFileLog
import expo.modules.updates.UpdatesModule
import expo.modules.updates.logging.UpdatesLogger.Companion.EXPO_UPDATES_LOGGING_TAG
import expo.modules.updates.logging.UpdatesLogger.Companion.MAX_FRAMES_IN_STACKTRACE
import junit.framework.TestCase
import org.junit.Assert
import org.junit.Before
import org.junit.Test
import java.util.*

class UpdatesLoggingTest : TestCase() {

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
    val entry = UpdatesLogEntry(12345678, "Test message", "NoUpdatesAvailable", "warn", null, null, null)
    val json = entry.asString()
    val entryCopy = UpdatesLogEntry.create(json)
    Assert.assertEquals(entry.message, entryCopy?.message)
    Assert.assertEquals(entry.timestamp, entryCopy?.timestamp)
    Assert.assertEquals(entry.code, entryCopy?.code)
    Assert.assertEquals(entry.level, entryCopy?.level)
    Assert.assertNull(entryCopy?.updateId)
    Assert.assertNull(entryCopy?.assetId)
    Assert.assertNull(entryCopy?.stacktrace)

    val entry2 = UpdatesLogEntry(12345678, "Test message", "UpdateFailedToLoad", "fatal", "myUpdateId", "myAssetId", listOf("stack frame 1", "stack frame 2"))
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
    val expectedLogEntry = UpdatesLogEntry(now.time, "Test message", UpdatesErrorCode.JSRuntimeError.code, LogType.Warn.type, null, null, null)
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
  fun testLogReaderTimeLimit() {
    val asyncTestUtil = AsyncTestUtil()
    val instrumentationContext = InstrumentationRegistry.getInstrumentation().context
    val logger = UpdatesLogger(instrumentationContext)
    val reader = UpdatesLogReader(instrumentationContext)

    val firstTime = Date()
    logger.info("Message 1", UpdatesErrorCode.None)
    asyncTestUtil.waitForTimeout(500)
    val secondTime = Date()
    logger.error("Message 2", UpdatesErrorCode.NoUpdatesAvailable)
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
    var err: Error? = null
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
  fun testBridgeMethods() {
    val asyncTestUtil = AsyncTestUtil()
    val instrumentationContext = InstrumentationRegistry.getInstrumentation().context
    val logger = UpdatesLogger(instrumentationContext)
    logger.warn("Test message", UpdatesErrorCode.JSRuntimeError)
    asyncTestUtil.waitForTimeout(500)
    val updatesModule = UpdatesModule(instrumentationContext)
    asyncTestUtil.asyncMethodRunning = true
    var entries: List<Bundle>? = null
    var rejected = false
    updatesModule.readLogEntriesAsync(
      1000L,
      PromiseTestWrapper(
        resolve = { result ->
          entries = result as? List<Bundle>
          asyncTestUtil.asyncMethodRunning = false
        },
        reject = { _, _, _ ->
          rejected = true
          asyncTestUtil.asyncMethodRunning = false
        }
      )
    )
    asyncTestUtil.waitForAsyncMethodToFinish("readLogEntriesAsync timed out", 1000)
    Assert.assertFalse(rejected)
    Assert.assertNotNull(entries)
    Assert.assertEquals(1, entries?.size)
    val bundle = entries?.get(0)
    Assert.assertEquals("Test message", bundle?.get("message"))

    rejected = false
    asyncTestUtil.asyncMethodRunning = true
    updatesModule.clearLogEntriesAsync(
      PromiseTestWrapper(
        resolve = {
          asyncTestUtil.asyncMethodRunning = false
        },
        reject = { _, _, _ ->
          rejected = true
          asyncTestUtil.asyncMethodRunning = false
        }
      )
    )
    asyncTestUtil.waitForAsyncMethodToFinish("clearLogEntriesAsync timed out", 1000)
    Assert.assertFalse(rejected)

    entries = null
    rejected = false
    asyncTestUtil.asyncMethodRunning = true
    updatesModule.readLogEntriesAsync(
      1000L,
      PromiseTestWrapper(
        resolve = { result ->
          entries = result as? List<Bundle>
          asyncTestUtil.asyncMethodRunning = false
        },
        reject = { _, _, _ ->
          rejected = true
          asyncTestUtil.asyncMethodRunning = false
        }
      )
    )
    asyncTestUtil.waitForAsyncMethodToFinish("readLogEntriesAsync timed out", 1000000)
    Assert.assertFalse(rejected)
    Assert.assertNotNull(entries)
    Assert.assertEquals(0, entries?.size)
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

  internal class PromiseTestWrapper(
    private val resolve: (_: Any?) -> Unit,
    private val reject: (code: String?, message: String?, e: Throwable?) -> Unit

  ) : Promise {
    override fun resolve(value: Any?) {
      resolve.invoke(value)
    }

    override fun reject(code: String?, message: String?, e: Throwable?) {
      reject.invoke(code, message, e)
    }
  }
}
