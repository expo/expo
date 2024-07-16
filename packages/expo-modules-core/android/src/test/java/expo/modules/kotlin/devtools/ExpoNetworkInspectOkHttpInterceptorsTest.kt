// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.kotlin.devtools

import com.google.common.truth.Truth
import okhttp3.Headers
import okhttp3.Headers.Companion.toHeaders
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.Protocol
import okhttp3.Request
import okhttp3.Response
import okhttp3.ResponseBody
import okhttp3.ResponseBody.Companion.asResponseBody
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Test

class PeekResponseBodyTest {
  @Test
  fun `should return null when body is null`() {
    val response = createResponse(null)
    val body = peekResponseBody(response)
    Truth.assertThat(body).isNull()
  }

  @Test
  fun `should return cloned body and leave original body untouched`() {
    val response = createResponse(
      body = "Hello".toResponseBody("text/plain; charset=utf-8".toMediaType())
    )
    val body = peekResponseBody(response)
    Truth.assertThat(body).isNotNull()

    Truth.assertThat(body?.source()?.isOpen).isTrue()
    Truth.assertThat(body?.source()?.exhausted()).isFalse()
    Truth.assertThat(body?.string()).isEqualTo("Hello")
    Truth.assertThat(body?.source()?.exhausted()).isTrue()

    Truth.assertThat(response.body?.source()?.isOpen).isTrue()
    Truth.assertThat(response.body?.source()?.exhausted()).isFalse()
    Truth.assertThat(response.body?.string()).isEqualTo("Hello")
    Truth.assertThat(response.body?.source()?.exhausted()).isTrue()
  }

  @Test
  fun `should return null when requested peek byteCount is smaller than source`() {
    val response = createResponse(
      body = "Hello".toResponseBody("text/plain; charset=utf-8".toMediaType())
    )
    val body = peekResponseBody(response, 4)
    Truth.assertThat(body).isNull()
    Truth.assertThat(response.body?.string()).isEqualTo("Hello")
  }

  @Test
  fun `should return peeked data when the byteCount is equals to source`() {
    val response = createResponse(
      body = "Hello".toResponseBody("text/plain; charset=utf-8".toMediaType())
    )
    val body = peekResponseBody(response, 5)
    Truth.assertThat(body?.string()).isEqualTo("Hello")
    Truth.assertThat(response.body?.string()).isEqualTo("Hello")
  }

  @Test
  fun `should return uncompressed gzip payload but keep response body untouched`() {
    val buffer = okio.Buffer()
    buffer.writeString("Hello", Charsets.UTF_8)
    val gzipBuffer = okio.Buffer()
    val gzipSink = okio.GzipSink(gzipBuffer)
    gzipSink.write(buffer, buffer.size)
    gzipSink.close()
    val gzipBufferCloned = gzipBuffer.clone()
    val response = createResponse(
      body = gzipBuffer.asResponseBody("text/plain; charset=utf-8".toMediaType()),
      headers = mapOf("Content-Encoding" to "gzip").toHeaders()
    )
    val body = peekResponseBody(response)
    Truth.assertThat(body?.string()).isEqualTo("Hello")
    Truth.assertThat(response.body?.source()?.readByteArray()).isEqualTo(gzipBufferCloned.readByteArray())
  }

  private fun createResponse(body: ResponseBody?, headers: Headers? = null): Response {
    val request = Request.Builder().url("https://example.org").build()
    return Response.Builder()
      .request(request)
      .protocol(Protocol.HTTP_1_1)
      .code(200)
      .message("OK")
      .apply {
        if (body != null) {
          this.body(body)
        }
        if (headers != null) {
          this.headers(headers)
        }
      }
      .build()
  }
}

class ShouldParseBodyTest {
  @Test
  fun `should return true from plain text response`() {
    val plaintext = "hello"
    val response = createResponse(
      body = plaintext.toResponseBody("text/plain".toMediaType()),
      headers = mapOf(
        "Content-Type" to "text/plain",
        "content-length" to plaintext.length.toString()
      ).toHeaders()
    )
    Truth.assertThat(shouldParseBody(response)).isTrue()
  }

  @Test
  fun `should return true from JSON response`() {
    val response = createResponse(
      body = "{\"hello\":\"hello\"}".toResponseBody("application/json".toMediaType()),
      headers = mapOf("Content-Type" to "application/json").toHeaders()
    )
    Truth.assertThat(shouldParseBody(response)).isTrue()
  }

  @Test
  fun `should return false from SSE response`() {
    val response = createResponse(
      body = "0".toResponseBody("text/event-stream".toMediaType()),
      headers = mapOf("Content-Type" to "text/event-stream").toHeaders()
    )
    Truth.assertThat(shouldParseBody(response)).isFalse()
  }

  @Test
  fun `should return false from chunked encoding transfer`() {
    val response = createResponse(
      body = null,
      headers = mapOf("transfer-encoding" to "chunked").toHeaders()
    )
    Truth.assertThat(shouldParseBody(response)).isFalse()
  }

  @Test
  fun `should return false from large response`() {
    val length = (ExpoNetworkInspectOkHttpNetworkInterceptor.MAX_BODY_SIZE + 1).toInt()
    val largeString = String(CharArray(length) { '0' })
    val response = createResponse(
      body = largeString.toResponseBody("text/plain".toMediaType()),
      headers = mapOf(
        "Content-Type" to "text/plain",
        "content-length" to length.toString()
      ).toHeaders()
    )
    Truth.assertThat(shouldParseBody(response)).isFalse()
  }

  private fun createResponse(body: ResponseBody?, headers: Headers? = null): Response {
    val request = Request.Builder().url("https://example.org").build()
    return Response.Builder()
      .request(request)
      .protocol(Protocol.HTTP_1_1)
      .code(200)
      .message("OK")
      .apply {
        if (body != null) {
          this.body(body)
        }
        if (headers != null) {
          this.headers(headers)
        }
      }
      .build()
  }
}
