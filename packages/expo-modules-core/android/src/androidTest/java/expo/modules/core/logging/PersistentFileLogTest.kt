package expo.modules.core.logging

import androidx.test.platform.app.InstrumentationRegistry
import junit.framework.TestCase
import org.junit.Assert
import org.junit.Test

class PersistentFileLogTest : TestCase() {

  @Test
  fun testPersistentLog() {
    val asyncTestUtil = AsyncTestUtil()
    val instrumentationContext = InstrumentationRegistry.getInstrumentation().context
    val persistentLog = PersistentFileLog("dev.expo.modules.core.logging.test", instrumentationContext)

    asyncTestUtil.asyncMethodRunning = true
    persistentLog.clearEntries {
      Assert.assertNull(it)
      asyncTestUtil.asyncMethodRunning = false
    }
    asyncTestUtil.waitForAsyncMethodToFinish("clearEntries timed out", 1000L)
    Assert.assertEquals(0, persistentLog.readEntries().size)

    asyncTestUtil.asyncMethodRunning = true
    persistentLog.appendEntry(
      "Test entry 1"
    ) {
      Assert.assertNull(it)
      asyncTestUtil.asyncMethodRunning = false
    }
    asyncTestUtil.waitForAsyncMethodToFinish("appendEntry timed out", 1000L)
    Assert.assertEquals(1, persistentLog.readEntries().size)
    Assert.assertEquals("Test entry 1", persistentLog.readEntries()[0])

    asyncTestUtil.asyncMethodRunning = true
    persistentLog.appendEntry(
      "Test entry 2"
    ) {
      Assert.assertNull(it)
      asyncTestUtil.asyncMethodRunning = false
    }
    asyncTestUtil.waitForAsyncMethodToFinish("appendEntry 2 timed out", 1000L)
    Assert.assertEquals(2, persistentLog.readEntries().size)
    Assert.assertEquals("Test entry 2", persistentLog.readEntries()[1])

    asyncTestUtil.asyncMethodRunning = true
    persistentLog.filterEntries(
      { entryString ->
        entryString.contains("2")
      },
      {
        Assert.assertNull(it)
        asyncTestUtil.asyncMethodRunning = false
      }
    )
    asyncTestUtil.waitForAsyncMethodToFinish("filterEntries timed out", 1000L)
    Assert.assertEquals(1, persistentLog.readEntries().size)
    Assert.assertEquals("Test entry 2", persistentLog.readEntries()[0])
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
}
