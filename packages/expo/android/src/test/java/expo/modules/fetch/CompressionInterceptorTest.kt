// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.fetch

import com.google.common.truth.Truth.assertThat
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.Protocol
import okhttp3.Request
import okhttp3.Response
import okhttp3.ResponseBody.Companion.toResponseBody
import okio.Buffer
import okio.GzipSink
import okio.buffer
import org.junit.Test

class CompressionInterceptorTest {
  // brotli of "hello world" produced offline with `printf 'hello world' | brotli`.
  // Avoids pulling in a brotli encoder just for this test; the decoder side is what we exercise.
  private val brotliHelloWorld = hexToBytes("0f058068656c6c6f20776f726c6403")

  // region intercept() — Accept-Encoding behavior

  @Test
  fun `should add zstd, br, gzip Accept-Encoding when caller sets none`() {
    val capturedRequest = interceptAndCapture(initialAcceptEncoding = null)

    assertThat(capturedRequest.header("Accept-Encoding")).isEqualTo("zstd, br, gzip")
  }

  @Test
  fun `should leave caller-set Accept-Encoding header untouched`() {
    val capturedRequest = interceptAndCapture(initialAcceptEncoding = "gzip")

    assertThat(capturedRequest.header("Accept-Encoding")).isEqualTo("gzip")
  }

  @Test
  fun `should still decompress response when caller set Accept-Encoding`() {
    val payload = "hello world"

    val request = Request.Builder()
      .url("https://example.test/")
      .header("Accept-Encoding", "gzip")
      .build()

    val chain = mockk<Interceptor.Chain>()

    every { chain.request() } returns request
    every { chain.proceed(any()) } answers {
      Response.Builder()
        .request(request)
        .protocol(Protocol.HTTP_1_1)
        .code(200)
        .message("OK")
        .header("Content-Encoding", "gzip")
        .body(payload.toByteArray().gzipCompressed().toResponseBody("application/octet-stream".toMediaType()))
        .build()
    }

    val response = CompressionInterceptor.intercept(chain)

    assertThat(response.body!!.string()).isEqualTo(payload)
    assertThat(response.header("Content-Encoding")).isNull()
  }

  // endregion

  // region uncompress() — decompression

  @Test
  fun `should decompress gzip response and strip Content-Encoding and Content-Length headers`() {
    val payload = "hello world"
    val response = encodedResponse(payload.toByteArray().gzipCompressed(), "gzip")

    val uncompressed = CompressionInterceptor.uncompress(response)

    assertThat(uncompressed.body!!.string()).isEqualTo(payload)
    assertThat(uncompressed.header("Content-Encoding")).isNull()
    assertThat(uncompressed.header("Content-Length")).isNull()
  }

  @Test
  fun `should decompress br response and strip Content-Encoding and Content-Length headers`() {
    val response = encodedResponse(brotliHelloWorld, "br")

    val uncompressed = CompressionInterceptor.uncompress(response)

    assertThat(uncompressed.body!!.string()).isEqualTo("hello world")
    assertThat(uncompressed.header("Content-Encoding")).isNull()
    assertThat(uncompressed.header("Content-Length")).isNull()
  }

  @Test
  fun `should match Content-Encoding case-insensitively`() {
    val payload = "hello world"
    val response = encodedResponse(payload.toByteArray().gzipCompressed(), "GZIP")

    val uncompressed = CompressionInterceptor.uncompress(response)

    assertThat(uncompressed.body!!.string()).isEqualTo(payload)
  }

  // endregion

  // region uncompress() — pass-through cases

  @Test
  fun `should leave response unchanged when Content-Encoding is absent`() {
    val response = baseResponseBuilder()
      .body("plain".toResponseBody("text/plain".toMediaType()))
      .build()

    val result = CompressionInterceptor.uncompress(response)

    assertThat(result).isSameInstanceAs(response)
  }

  @Test
  fun `should leave response unchanged when Content-Encoding is unknown`() {
    val response = encodedResponse("noop".toByteArray(), "lz4")

    val result = CompressionInterceptor.uncompress(response)

    assertThat(result).isSameInstanceAs(response)
  }

  @Test
  fun `should leave 204 response untouched`() {
    val response = baseResponseBuilder()
      .code(204)
      .message("No Content")
      .body("".toResponseBody())
      .header("Content-Encoding", "gzip")
      .build()

    val result = CompressionInterceptor.uncompress(response)

    assertThat(result).isSameInstanceAs(response)
  }

  // endregion

  // region helpers

  private fun interceptAndCapture(initialAcceptEncoding: String?): Request {
    val builder = Request.Builder().url("https://example.test/")
    if (initialAcceptEncoding != null) {
      builder.header("Accept-Encoding", initialAcceptEncoding)
    }
    val request = builder.build()

    val chain = mockk<Interceptor.Chain>()
    every { chain.request() } returns request

    val captured = slot<Request>()
    every { chain.proceed(capture(captured)) } answers {
      Response.Builder()
        .request(captured.captured)
        .protocol(Protocol.HTTP_1_1)
        .code(200)
        .message("OK")
        .body("".toResponseBody())
        .build()
    }

    CompressionInterceptor.intercept(chain)
    return captured.captured
  }

  private fun baseResponseBuilder(): Response.Builder =
    Response.Builder()
      .request(Request.Builder().url("https://example.test/").build())
      .protocol(Protocol.HTTP_1_1)
      .code(200)
      .message("OK")

  private fun encodedResponse(body: ByteArray, encoding: String): Response =
    baseResponseBuilder()
      .header("Content-Encoding", encoding)
      .header("Content-Length", body.size.toString())
      .body(body.toResponseBody("application/octet-stream".toMediaType()))
      .build()

  private fun ByteArray.gzipCompressed(): ByteArray {
    val sink = Buffer()
    GzipSink(sink).buffer().use { it.write(this) }
    return sink.readByteArray()
  }

  private fun hexToBytes(hex: String): ByteArray =
    ByteArray(hex.length / 2) { i ->
      hex.substring(i * 2, i * 2 + 2).toInt(16).toByte()
    }

  // endregion
}
