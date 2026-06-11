package expo.modules.kotlin.views

import com.google.common.truth.Truth
import kotlinx.coroutines.async
import kotlinx.coroutines.test.runTest
import org.junit.Test

class ViewFunctionHandlersTest {
  private val handlers = ViewFunctionHandlers("TestView")

  @Test
  fun `resolves a bound handler immediately`() = runTest {
    val handler: ViewFunctionHandler = { "result" }
    handlers["expand"] = handler

    Truth.assertThat(handlers.resolve("expand")).isSameInstanceAs(handler)
  }

  @Test
  fun `suspends a call that arrives before the initial binding pass`() = runTest {
    val pendingCall = async { handlers.resolve("expand")(emptyArray<Any?>()) }
    testScheduler.runCurrent()
    Truth.assertThat(pendingCall.isCompleted).isFalse()

    handlers["expand"] = { "result" }
    handlers.markInitiallyBound()

    Truth.assertThat(pendingCall.await()).isEqualTo("result")
  }

  @Test
  fun `fails for a handler missing after the initial binding pass`() = runTest {
    handlers.markInitiallyBound()

    val error = runCatching { handlers.resolve("expand") }.exceptionOrNull()

    Truth.assertThat(error).isInstanceOf(IllegalStateException::class.java)
    Truth.assertThat(error).hasMessageThat()
      .contains("No handler registered for AsyncFunction 'expand' on view 'TestView'")
  }

  @Test
  fun `fails for a removed handler`() = runTest {
    handlers.markInitiallyBound()
    handlers["expand"] = { "result" }
    handlers.remove("expand")

    val error = runCatching { handlers.resolve("expand") }.exceptionOrNull()

    Truth.assertThat(error).hasMessageThat().contains("No handler registered")
  }

  @Test
  fun `fails after the timeout when the view never binds`() = runTest {
    val error = runCatching { handlers.resolve("expand") }.exceptionOrNull()

    Truth.assertThat(error).isInstanceOf(IllegalStateException::class.java)
    Truth.assertThat(error).hasMessageThat().contains("never composed")
  }
}
