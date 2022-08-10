package expo.modules.updates.logging

import expo.modules.updates.logging.UpdatesLogger.Companion.MAX_FRAMES_IN_STACKTRACE
import junit.framework.TestCase
import org.junit.Assert
import org.junit.Test
import java.util.*

class UpdatesLoggingTest : TestCase() {

  @Test
  fun testLogEntryConversion() {
    val entry = UpdatesLogEntry(12345678, "Test message", "NoUpdatesAvailable", "warn", null, null, null)
    val json = entry.asString()
    val entryCopy = UpdatesLogEntry.create(json)
    Assert.assertEquals(entry.message, entryCopy.message)
    Assert.assertEquals(entry.timestamp, entryCopy.timestamp)
    Assert.assertEquals(entry.code, entryCopy.code)
    Assert.assertEquals(entry.level, entryCopy.level)
    Assert.assertNull(entryCopy.updateId)
    Assert.assertNull(entryCopy.assetId)
    Assert.assertNull(entryCopy.stacktrace)

    val entry2 = UpdatesLogEntry(12345678, "Test message", "UpdateFailedToLoad", "fatal", "myUpdateId", "myAssetId", listOf("stack frame 1", "stack frame 2"))
    val json2 = entry2.asString()
    val entryCopy2 = UpdatesLogEntry.create(json2)
    Assert.assertEquals(entry2.message, entryCopy2.message)
    Assert.assertEquals(entry2.timestamp, entryCopy2.timestamp)
    Assert.assertEquals(entry2.code, entryCopy2.code)
    Assert.assertEquals(entry2.level, entryCopy2.level)
    Assert.assertEquals(entry2.updateId, entryCopy2.updateId)
    Assert.assertEquals(entry2.assetId, entryCopy2.assetId)
    Assert.assertNotNull(entryCopy2.stacktrace)
    Assert.assertEquals(entry2.stacktrace?.size, entryCopy2.stacktrace?.size)
  }

  @Test
  fun testOneLogAppears() {
    val logger = UpdatesLogger()
    logger.warn("Test message", UpdatesErrorCode.JSRuntimeError)
    val now = Date()
    val expectedLogEntry = UpdatesLogEntry(now.time, "Test message", UpdatesErrorCode.JSRuntimeError.code, UpdatesLogType.Warn.type, null, null, null)
    val sinceThen = Date(now.time - 5000)
    val logs = UpdatesLogReader().getLogEntries(sinceThen)
    Assert.assertTrue(logs.size > 0)
    val actualLogEntry = UpdatesLogEntry.create(logs[logs.size - 1])
    Assert.assertEquals(expectedLogEntry.timestamp / 1000, actualLogEntry.timestamp / 1000)
    Assert.assertEquals(expectedLogEntry.message, actualLogEntry.message)
    Assert.assertEquals(expectedLogEntry.code, actualLogEntry.code)
    Assert.assertEquals(expectedLogEntry.level, actualLogEntry.level)
  }

  @Test
  fun testLogReaderTimeLimit() {
    val logger = UpdatesLogger()
    val firstTime = Date()
    logger.info("Message 1", UpdatesErrorCode.None)
    Thread.sleep(2000)
    val secondTime = Date()
    logger.error("Message 2", UpdatesErrorCode.NoUpdatesAvailable)
    Thread.sleep(1000)
    val thirdTime = Date()
    val reader = UpdatesLogReader()

    val firstLogs = reader.getLogEntries(firstTime)
    Assert.assertEquals(2, firstLogs.size)
    Assert.assertEquals("Message 1", UpdatesLogEntry.create(firstLogs[0]).message)
    Assert.assertEquals("Message 2", UpdatesLogEntry.create(firstLogs[1]).message)

    val secondLogs = reader.getLogEntries(secondTime)
    Assert.assertEquals(1, secondLogs.size)
    Assert.assertEquals("Message 2", UpdatesLogEntry.create(secondLogs[0]).message)
    Assert.assertEquals(MAX_FRAMES_IN_STACKTRACE, UpdatesLogEntry.create(secondLogs[0]).stacktrace?.size)

    val thirdLogs = reader.getLogEntries(thirdTime)
    Assert.assertEquals(0, thirdLogs.size)
  }
}
