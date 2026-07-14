package expo.modules.kotlin.jni

import com.facebook.react.bridge.ReactApplicationContext
import expo.modules.core.interfaces.DoNotStrip
import java.util.concurrent.CountDownLatch

@DoNotStrip
interface JSHeapAccessExecutor {
  @DoNotStrip
  fun runOnQueue(runnable: Runnable): Boolean

  @DoNotStrip
  @Throws(Throwable::class)
  fun runOnQueueSync(runnable: Runnable)
}

@DoNotStrip
class MainJSHeapAccessExecutor(
  private val reactContext: ReactApplicationContext
) : JSHeapAccessExecutor {
  @DoNotStrip
  override fun runOnQueue(runnable: Runnable): Boolean = reactContext.runOnJSQueueThread(runnable)

  @DoNotStrip
  override fun runOnQueueSync(runnable: Runnable) {
    if (reactContext.isOnJSQueueThread) {
      runnable.run()
      return
    }

    val latch = CountDownLatch(1)
    var error: Throwable? = null
    val wasQueued = runOnQueue {
      try {
        runnable.run()
      } catch (throwable: Throwable) {
        error = throwable
      } finally {
        latch.countDown()
      }
    }

    if (!wasQueued) {
      throw IllegalStateException("Cannot schedule ArrayBuffer access on the JavaScript queue.")
    }

    try {
      latch.await()
    } catch (exception: InterruptedException) {
      Thread.currentThread().interrupt()
      throw exception
    }
    error?.let { throw it }
  }
}
