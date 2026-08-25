// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.fetch

import com.google.common.truth.Truth.assertThat
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.runtime.Runtime
import io.mockk.mockk
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.runBlocking
import okhttp3.Call
import okhttp3.Protocol
import okhttp3.Request
import okhttp3.Response
import okhttp3.ResponseBody
import okhttp3.ResponseBody.Companion.asResponseBody
import okhttp3.ResponseBody.Companion.toResponseBody
import okio.Buffer
import okio.Source
import okio.Timeout
import okio.buffer
import org.junit.After
import org.junit.Assert.assertThrows
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.IOException
import java.lang.ref.WeakReference
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

@RunWith(RobolectricTestRunner::class)
internal class NativeResponseTest {
  private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
  private val call = mockk<Call>(relaxed = true)

  @After
  fun tearDown() {
    scope.cancel()
  }

  @Test
  fun `a truncated body ends in ERROR_RECEIVED, not BODY_COMPLETED`() {
    val response = newResponse()

    response.onStarted()
    response.onResponse(call, truncatedResponse("partial"))
    awaitIdle()

    // `pumpResponseBodyStream` records the truncation as ERROR_RECEIVED, and the tail of
    // `onResponse` used to overwrite it with BODY_COMPLETED, handing JS a partial body as
    // a whole one.
    assertThat(response.isInState(ResponseState.ERROR_RECEIVED)).isTrue()
    assertThat(response.isInState(ResponseState.BODY_COMPLETED)).isFalse()
  }

  @Test
  fun `startStreaming throws the recorded error after a truncated body`() {
    val response = newResponse()

    response.onStarted()
    response.onResponse(call, truncatedResponse("partial"))
    awaitIdle()

    val error = assertThrows(CodedException::class.java) { response.startStreaming() }
    assertThat(error.cause).isInstanceOf(IOException::class.java)
    assertThat(response.error).isInstanceOf(IOException::class.java)
  }

  @Test
  fun `a complete body ends in BODY_COMPLETED and startStreaming returns it`() {
    val response = newResponse()

    response.onStarted()
    response.onResponse(call, completeResponse("hello world"))
    awaitIdle()

    assertThat(response.isInState(ResponseState.BODY_COMPLETED)).isTrue()
    assertThat(response.error).isNull()
    assertThat(response.startStreaming()?.toString(Charsets.UTF_8)).isEqualTo("hello world")
  }

  @Test
  fun `startStreaming throws after the request failed before any response arrived`() {
    val response = newResponse()

    response.onStarted()
    response.onFailure(call, IOException("connection reset"))

    assertThat(response.isInState(ResponseState.ERROR_RECEIVED)).isTrue()
    val error = assertThrows(CodedException::class.java) { response.startStreaming() }
    assertThat(error.cause).isInstanceOf(IOException::class.java)
  }

  @Test
  fun `startStreaming throws after the request was canceled before the body was read`() {
    val response = newResponse()

    response.onStarted()
    response.emitRequestCanceled()

    assertThat(response.isInState(ResponseState.ERROR_RECEIVED)).isTrue()
    assertThrows(FetchRequestCanceledException::class.java) { response.startStreaming() }
  }

  @Test
  fun `startStreaming throws when a redirect was rejected before the body was read`() {
    val response = newResponse()
    response.redirectMode = NativeRequestRedirect.ERROR

    response.onStarted()
    response.onResponse(call, redirectResponse())

    assertThat(response.isInState(ResponseState.ERROR_RECEIVED)).isTrue()
    assertThrows(FetchRedirectException::class.java) { response.startStreaming() }
  }

  @Test
  fun `startStreaming from RESPONSE_RECEIVED returns null and starts streaming`() {
    val response = newResponse()
    val gate = CountDownLatch(1)

    response.onStarted()
    response.onResponse(call, gatedResponse(gate))

    assertThat(response.startStreaming()).isNull()
    assertThat(response.isInState(ResponseState.BODY_STREAMING_STARTED)).isTrue()

    gate.countDown()
    awaitIdle()
  }

  // region helpers

  /**
   * `SharedObject.emit` bails out at `getJavaScriptObject()` when the runtime reference is empty,
   * so detaching it keeps the state machine testable on the JVM without a JS runtime or any JNI call.
   */
  private fun newResponse(): NativeResponse {
    val response = NativeResponse(mockk<AppContext>(relaxed = true), scope)
    response.runtimeContextHolder = WeakReference<Runtime>(null)
    return response
  }

  /**
   * `waitForStates` invokes its callback synchronously when the response is already in one of the
   * given states, which is the only public read of the otherwise private state.
   */
  private fun NativeResponse.isInState(state: ResponseState): Boolean {
    var matched = false
    waitForStates(listOf(state)) { matched = true }
    return matched
  }

  /** Waits for `onResponse`'s body pump and every state-change listener dispatch to settle. */
  private fun awaitIdle() {
    val job = requireNotNull(scope.coroutineContext[Job])
    val deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(10)
    runBlocking {
      while (System.nanoTime() < deadline) {
        val children = job.children.toList()
        if (children.isEmpty()) {
          return@runBlocking
        }
        children.forEach { it.join() }
      }
      throw AssertionError("Coroutines launched by NativeResponse did not settle in time")
    }
  }

  private fun responseWithBody(body: ResponseBody): Response =
    Response.Builder()
      .request(Request.Builder().url("https://example.test/").build())
      .protocol(Protocol.HTTP_1_1)
      .code(200)
      .message("OK")
      .body(body)
      .build()

  private fun completeResponse(payload: String): Response =
    responseWithBody(payload.toResponseBody())

  private fun redirectResponse(): Response =
    Response.Builder()
      .request(Request.Builder().url("https://example.test/").build())
      .protocol(Protocol.HTTP_1_1)
      .code(302)
      .message("Found")
      .header("Location", "https://example.test/moved")
      .body("".toResponseBody())
      .build()

  /** A response whose body delivers [prefix] and then fails, like a connection cut mid-body. */
  private fun truncatedResponse(prefix: String): Response =
    responseWithBody(TruncatedSource(prefix).buffer().asResponseBody(null, -1L))

  /** A response whose body blocks until [gate] opens, holding the state at RESPONSE_RECEIVED. */
  private fun gatedResponse(gate: CountDownLatch): Response =
    responseWithBody(GatedSource(gate).buffer().asResponseBody(null, -1L))

  private class TruncatedSource(prefix: String) : Source {
    private val bytes = prefix.toByteArray()
    private var delivered = false

    override fun read(sink: Buffer, byteCount: Long): Long {
      if (delivered) {
        throw IOException("unexpected end of stream")
      }
      delivered = true
      sink.write(bytes)
      return bytes.size.toLong()
    }

    override fun timeout(): Timeout = Timeout.NONE

    override fun close() = Unit
  }

  private class GatedSource(private val gate: CountDownLatch) : Source {
    private val bytes = "late".toByteArray()
    private var delivered = false

    override fun read(sink: Buffer, byteCount: Long): Long {
      gate.await()
      if (delivered) {
        return -1L
      }
      delivered = true
      sink.write(bytes)
      return bytes.size.toLong()
    }

    override fun timeout(): Timeout = Timeout.NONE

    override fun close() = Unit
  }

  // endregion
}
