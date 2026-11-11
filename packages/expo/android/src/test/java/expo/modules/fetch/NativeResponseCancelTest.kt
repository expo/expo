// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.fetch

import com.google.common.truth.Truth.assertThat
import expo.modules.kotlin.AppContext
import io.mockk.mockk
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class NativeResponseCancelTest {
  @Test
  fun `cancel before the first read drops the buffered body`() {
    val response = responseIn(ResponseState.RESPONSE_RECEIVED)
    response.sink.appendBufferBody(byteArrayOf(1, 2, 3, 4))

    response.cancelStreaming()

    assertThat(bufferedLength(response)).isEqualTo(0)
    assertThat(response.isCurrently(ResponseState.BODY_STREAMING_CANCELED)).isTrue()
  }

  @Test
  fun `cancel keeps the buffer while a buffered read is waiting`() {
    val response = responseIn(ResponseState.RESPONSE_RECEIVED)
    response.sink.appendBufferBody(byteArrayOf(1, 2, 3, 4))
    response.readBufferedBody { }

    response.cancelStreaming()

    assertThat(bufferedLength(response)).isEqualTo(4)
    assertThat(response.isCurrently(ResponseState.RESPONSE_RECEIVED)).isTrue()
  }

  private fun responseIn(state: ResponseState): NativeResponse {
    val response = NativeResponse(
      mockk<AppContext>(relaxed = true),
      CoroutineScope(Dispatchers.Unconfined)
    )
    val field = NativeResponse::class.java.getDeclaredField("state")
    field.isAccessible = true
    field.set(response, state)
    return response
  }

  private fun bufferedLength(response: NativeResponse): Int {
    return response.sink.finalize(directBuffer = false).position()
  }

  private fun NativeResponse.isCurrently(expected: ResponseState): Boolean {
    var matched = false
    waitForStates(listOf(expected)) { matched = true }
    return matched
  }
}
