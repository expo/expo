// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.fetch

import com.google.common.truth.Truth.assertWithMessage
import expo.modules.kotlin.AppContext
import io.mockk.mockk
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.shadows.ShadowLog

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class NativeResponseCancelTest {
  @Test
  fun `cancel after the body settled does not log and leaves the state`() {
    val settled = listOf(
      ResponseState.BODY_COMPLETED,
      ResponseState.BODY_STREAMING_CANCELED,
      ResponseState.ERROR_RECEIVED
    )

    for (state in settled) {
      val response = responseIn(state)
      ShadowLog.clear()
      response.cancelStreaming()

      val invalidStateLogs = ShadowLog.getLogs().map { it.msg }.filter { it.contains("Invalid state") }
      assertWithMessage("cancel from $state").that(invalidStateLogs).isEmpty()
      assertWithMessage("cancel from $state").that(response.isCurrently(state)).isTrue()
    }
  }

  private fun responseIn(state: ResponseState): NativeResponse {
    val response = NativeResponse(mockk<AppContext>(relaxed = true), CoroutineScope(Dispatchers.Unconfined))
    val field = NativeResponse::class.java.getDeclaredField("state")
    field.isAccessible = true
    field.set(response, state)
    return response
  }

  private fun NativeResponse.isCurrently(expected: ResponseState): Boolean {
    var matched = false
    waitForStates(listOf(expected)) { matched = true }
    return matched
  }
}
