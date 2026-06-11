package expo.modules.kotlin.functions

import android.view.View
import com.google.common.truth.Truth
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import kotlinx.coroutines.test.runTest
import org.junit.Test

class RetryOnViewNotFoundTest {
  private fun viewNotFound() =
    CodedException("argument cast failed", Exceptions.ViewNotFound(View::class.java, 42))

  @Test
  fun `returns the result without waiting when the view resolves`() = runTest {
    var frames = 0

    val result = retryOnViewNotFound(awaitNextFrame = { frames++ }) { "ok" }

    Truth.assertThat(result).isEqualTo("ok")
    Truth.assertThat(frames).isEqualTo(0)
  }

  @Test
  fun `retries across frames until the view mounts`() = runTest {
    var frames = 0
    var attempts = 0

    val result = retryOnViewNotFound(awaitNextFrame = { frames++ }) {
      if (++attempts < 3) {
        throw viewNotFound()
      }
      "mounted"
    }

    Truth.assertThat(result).isEqualTo("mounted")
    Truth.assertThat(frames).isEqualTo(2)
  }

  @Test
  fun `rethrows other errors immediately`() = runTest {
    var frames = 0

    val error = runCatching {
      retryOnViewNotFound(awaitNextFrame = { frames++ }) { throw CodedException("boom") }
    }.exceptionOrNull()

    Truth.assertThat(error).hasMessageThat().contains("boom")
    Truth.assertThat(frames).isEqualTo(0)
  }

  @Test
  fun `gives up once the frame budget is exhausted`() = runTest {
    var frames = 0

    val error = runCatching {
      retryOnViewNotFound(maxFrames = 5, awaitNextFrame = { frames++ }) {
        throw viewNotFound()
      }
    }.exceptionOrNull()

    Truth.assertThat(error).isInstanceOf(CodedException::class.java)
    Truth.assertThat(frames).isEqualTo(5)
  }
}
