// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.fetch

import com.google.common.truth.Truth.assertThat
import expo.modules.kotlin.AppContext
import io.mockk.mockk
import kotlinx.coroutines.job
import kotlinx.coroutines.test.runTest
import okhttp3.Call
import okhttp3.Protocol
import okhttp3.Request
import okhttp3.Response
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.lang.ref.WeakReference

@RunWith(RobolectricTestRunner::class)
class NativeResponseTest {
  @Test
  fun `cancel before the first read discards the buffered body`() = runTest {
    val response = NativeResponse(mockk<AppContext>(relaxed = true), this)
    response.runtimeContextHolder = WeakReference(null)
    val okResponse = Response.Builder()
      .request(Request.Builder().url("https://example.test/").build())
      .protocol(Protocol.HTTP_1_1)
      .code(200)
      .message("OK")
      .body("late".toResponseBody())
      .build()

    response.onStarted()
    response.onResponse(mockk<Call>(), okResponse)
    response.sink.appendBufferBody("buffered".toByteArray())
    var canceled = false
    response.waitForStates(listOf(ResponseState.BODY_STREAMING_CANCELED)) { canceled = true }
    response.cancelStreaming()
    coroutineContext.job.children.toList().forEach { it.join() }

    assertThat(canceled).isTrue()
    assertThat(response.sink.finalize(directBuffer = false).capacity()).isEqualTo(0)
  }
}
