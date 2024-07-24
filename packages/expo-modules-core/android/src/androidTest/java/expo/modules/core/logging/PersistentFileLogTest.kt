package expo.modules.core.logging

import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert
import org.junit.Test

class PersistentFileLogTest {
  @Test
  fun testPersistentLog() {
    val asyncTestUtil = AsyncTestUtil()
    val instrumentationContext = InstrumentationRegistry.getInstrumentation().context
    val persistentLog = PersistentFileLog("dev.expo.modules.core.logging.test", instrumentationContext)

    var err: Error? = null
    asyncTestUtil.asyncMethodRunning = true
    persistentLog.clearEntries {
      err = it
      asyncTestUtil.asyncMethodRunning = false
    }
    asyncTestUtil.waitForAsyncMethodToFinish("clearEntries timed out", 1000L)
    Assert.assertNull(err)
    Assert.assertEquals(0, persistentLog.readEntries().size)

    err = null
    asyncTestUtil.asyncMethodRunning = true
    persistentLog.appendEntry(
      "Test entry 1"
    ) {
      err = it
      asyncTestUtil.asyncMethodRunning = false
    }
    asyncTestUtil.waitForAsyncMethodToFinish("appendEntry timed out", 1000L)
    Assert.assertNull(err)
    Assert.assertEquals(1, persistentLog.readEntries().size)
    Assert.assertEquals("Test entry 1", persistentLog.readEntries()[0])

    err = null
    asyncTestUtil.asyncMethodRunning = true
    persistentLog.appendEntry(
      "Test entry 2"
    ) {
      err = it
      asyncTestUtil.asyncMethodRunning = false
    }
    asyncTestUtil.waitForAsyncMethodToFinish("appendEntry 2 timed out", 1000L)
    Assert.assertNull(err)
    Assert.assertEquals(2, persistentLog.readEntries().size)
    Assert.assertEquals("Test entry 2", persistentLog.readEntries()[1])

    err = null
    asyncTestUtil.asyncMethodRunning = true
    persistentLog.purgeEntriesNotMatchingFilter(
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
