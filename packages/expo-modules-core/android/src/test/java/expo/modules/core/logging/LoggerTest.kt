package expo.modules.core.logging

import org.junit.Assert
import org.junit.Test

class LoggerTest {
  class TestLoggerHandler : LogHandler() {
    data class TestLoggerHandlerLogEntry(val type: LogType, val message: String, val cause: Throwable? = null)
    val logEntries = mutableListOf<TestLoggerHandlerLogEntry>()

    fun clear() {
      logEntries.clear()
    }

    override fun log(type: LogType, message: String, cause: Throwable?) {
      logEntries.add(TestLoggerHandlerLogEntry(type, message, cause))
    }
  }

  @Test
  fun `should log various levels`() {
    val loggerHandler = TestLoggerHandler()
    val logger = Logger(listOf(loggerHandler))

    logger.trace("hello")
    Assert.assertEquals(loggerHandler.logEntries.first(), TestLoggerHandler.TestLoggerHandlerLogEntry(LogType.Trace, "hello"))
    loggerHandler.clear()

    logger.debug("hello")
    Assert.assertEquals(loggerHandler.logEntries.first(), TestLoggerHandler.TestLoggerHandlerLogEntry(LogType.Debug, "hello"))
    loggerHandler.clear()

    logger.info("hello")
    Assert.assertEquals(loggerHandler.logEntries.first(), TestLoggerHandler.TestLoggerHandlerLogEntry(LogType.Info, "hello"))
    loggerHandler.clear()

    val throwable = Error("test")

    logger.warn("hello", throwable)
    Assert.assertEquals(loggerHandler.logEntries.first(), TestLoggerHandler.TestLoggerHandlerLogEntry(LogType.Warn, "hello", throwable))
    loggerHandler.clear()

    logger.error("hello", throwable)
    Assert.assertEquals(loggerHandler.logEntries.first(), TestLoggerHandler.TestLoggerHandlerLogEntry(LogType.Error, "hello", throwable))
    loggerHandler.clear()

    logger.fatal("hello", throwable)
    Assert.assertEquals(loggerHandler.logEntries.first(), TestLoggerHandler.TestLoggerHandlerLogEntry(LogType.Fatal, "hello", throwable))
    loggerHandler.clear()
  }

  @Test
  fun `should run timer`() {
    val loggerHandler = TestLoggerHandler()
    val logger = Logger(listOf(loggerHandler))

    val timer = logger.startTimer { duration -> "$duration" }
    Thread.sleep(300)
    timer.stop()

    val entry = loggerHandler.logEntries.first()
    Assert.assertEquals(entry.type, LogType.Timer)
    Assert.assertTrue(entry.message.toInt() >= 300)
    loggerHandler.clear()
  }
}
