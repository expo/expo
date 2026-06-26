package expo.modules.kotlin.jni

import com.facebook.react.bridge.ReactApplicationContext
import com.google.common.truth.Truth
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.Test

class JSHeapAccessExecutorTest {
  @Test
  fun main_executor_runs_sync_block_inline_when_already_on_js_queue() {
    val reactContext = mockk<ReactApplicationContext>()
    every { reactContext.isOnJSQueueThread } returns true

    val executor = MainJSHeapAccessExecutor(reactContext)
    var wasCalled = false

    executor.runOnQueueSync {
      wasCalled = true
    }

    Truth.assertThat(wasCalled).isTrue()
    verify(exactly = 0) { reactContext.runOnJSQueueThread(any()) }
  }

  @Test
  fun main_executor_posts_sync_block_when_called_outside_js_queue() {
    val reactContext = mockk<ReactApplicationContext>()
    every { reactContext.isOnJSQueueThread } returns false
    every { reactContext.runOnJSQueueThread(any()) } answers {
      firstArg<Runnable>().run()
      true
    }

    val executor = MainJSHeapAccessExecutor(reactContext)
    var wasCalled = false

    executor.runOnQueueSync {
      wasCalled = true
    }

    Truth.assertThat(wasCalled).isTrue()
    verify(exactly = 1) { reactContext.runOnJSQueueThread(any()) }
  }

  @Test
  fun main_executor_rethrows_sync_block_errors_on_calling_thread() {
    val reactContext = mockk<ReactApplicationContext>()
    every { reactContext.isOnJSQueueThread } returns false
    every { reactContext.runOnJSQueueThread(any()) } answers {
      firstArg<Runnable>().run()
      true
    }

    val executor = MainJSHeapAccessExecutor(reactContext)
    val error = IllegalStateException("boom")

    val thrown = runCatching {
      executor.runOnQueueSync {
        throw error
      }
    }.exceptionOrNull()

    Truth.assertThat(thrown).isSameInstanceAs(error)
  }
}
