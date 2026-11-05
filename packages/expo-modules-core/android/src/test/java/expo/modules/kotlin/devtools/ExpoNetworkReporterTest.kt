// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.kotlin.devtools

import com.google.common.truth.Truth
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Protocol
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.assertThrows
import org.junit.Test
import java.io.IOException

private class RecordingSink : ExpoNetworkReporter.Sink {
  val events = mutableListOf<String>()
  var storedBody: ExpoNetworkReporter.StoredBody? = null

  override fun reportRequestStart(requestId: String, request: Request) {
    events.add("start $requestId ${request.method} ${request.url}")
  }

  override fun reportResponseStart(requestId: String, response: Response) {
    events.add("response $requestId ${response.code}")
  }

  override fun reportDataReceived(requestId: String, dataLength: Int) {
    events.add("data $requestId $dataLength")
  }

  override fun reportResponseEnd(requestId: String, encodedDataLength: Long, body: ExpoNetworkReporter.StoredBody?) {
    storedBody = body
    events.add("end $requestId $encodedDataLength")
  }

  override fun reportRequestFailed(requestId: String, cancelled: Boolean) {
    events.add("failed $requestId cancelled=$cancelled")
  }

  override val storesResponseBodies = true
}

class ExpoNetworkReporterTest {
  private val sink = RecordingSink()

  /** A client that answers every request with [body] instead of reaching the network. */
  private fun client(body: String, contentType: String = "application/json", interceptor: Interceptor? = null): OkHttpClient {
    return OkHttpClient.Builder()
      .addInterceptor(ExpoNetworkReporter(sink))
      .apply { interceptor?.let(::addInterceptor) }
      .addInterceptor { chain ->
        Response.Builder()
          .request(chain.request())
          .protocol(Protocol.HTTP_1_1)
          .code(200)
          .message("OK")
          .body(body.toResponseBody(contentType.toMediaType()))
          .build()
      }
      .build()
  }

  @Test
  fun `reports a tagged request under its DevTools request id`() {
    val request = Request.Builder()
      .url("https://example.com/data")
      .post("hello".toRequestBody("text/plain".toMediaType()))
      .tag(DevToolsRequestId::class.java, DevToolsRequestId("js-1"))
      .build()

    val response = client("""{"ok":true}""").newCall(request).execute()
    Truth.assertThat(response.body?.string()).isEqualTo("""{"ok":true}""")

    Truth.assertThat(sink.events).containsExactly(
      "start js-1 POST https://example.com/data",
      "response js-1 200",
      "data js-1 11",
      "end js-1 11"
    ).inOrder()
    Truth.assertThat(sink.storedBody?.data).isEqualTo("""{"ok":true}""")
    Truth.assertThat(sink.storedBody?.base64Encoded).isFalse()
  }

  @Test
  fun `generates an id for an untagged request and keeps binary bodies as base64`() {
    val request = Request.Builder().url("https://example.com/image").build()

    client("png", contentType = "image/png").newCall(request).execute().body?.bytes()

    val requestId = sink.events.first().split(" ")[1]
    Truth.assertThat(requestId).isNotEmpty()
    Truth.assertThat(sink.events.last()).isEqualTo("end $requestId 3")
    Truth.assertThat(sink.storedBody?.base64Encoded).isTrue()
    Truth.assertThat(sink.storedBody?.data).isEqualTo("cG5n")
  }

  @Test
  fun `marks the request so the network inspector skips it`() {
    var seen: Request? = null
    val client = client("{}", interceptor = Interceptor { chain ->
      seen = chain.request()
      chain.proceed(chain.request())
    })

    client.newCall(Request.Builder().url("https://example.com/data").build()).execute().close()

    Truth.assertThat(ExpoNetworkReporter.isReported(requireNotNull(seen))).isTrue()
    Truth.assertThat(ExpoNetworkReporter.isReported(Request.Builder().url("https://example.com/data").build())).isFalse()
  }

  @Test
  fun `reports a request that fails before its response`() {
    val client = OkHttpClient.Builder()
      .addInterceptor(ExpoNetworkReporter(sink))
      .addInterceptor { throw IOException("offline") }
      .build()
    val request = Request.Builder()
      .url("https://example.com/data")
      .tag(DevToolsRequestId::class.java, DevToolsRequestId("js-2"))
      .build()

    assertThrows(IOException::class.java) {
      client.newCall(request).execute()
    }

    Truth.assertThat(sink.events).containsExactly(
      "start js-2 GET https://example.com/data",
      "failed js-2 cancelled=false"
    ).inOrder()
  }
}
