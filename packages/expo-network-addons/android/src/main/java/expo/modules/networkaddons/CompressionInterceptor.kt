// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.networkaddons

import com.squareup.zstd.okio.zstdDecompress
import okhttp3.Interceptor
import okhttp3.Response
import okhttp3.ResponseBody.Companion.asResponseBody
import okhttp3.internal.http.promisesBody
import okio.GzipSource
import okio.buffer
import okio.source
import org.brotli.dec.BrotliInputStream

/**
 * Transparent compressed response support for Zstandard, Brotli and Gzip.
 *
 * Adds `Accept-Encoding: zstd, br, gzip` to outgoing requests when the caller has not set the
 * header, and decompresses (and strips `Content-Encoding`/`Content-Length` from) responses
 * encoded with any of the three.
 *
 * Modeled after `okhttp3.brotli.BrotliInterceptor`; this replaces the transparent gzip
 * compression in okhttp's `BridgeInterceptor`. Callers who set their own `Accept-Encoding`
 * opt out of automatic decompression.
 *
 * Mirrors `expo.modules.fetch.CompressionInterceptor`; duplicated here to keep this package
 * independent of the heavier `expo` package.
 */
object CompressionInterceptor : Interceptor {
  override fun intercept(chain: Interceptor.Chain): Response =
    if (chain.request().header("Accept-Encoding") == null) {
      val request = chain.request().newBuilder()
        .header("Accept-Encoding", "zstd, br, gzip")
        .build()

      val response = chain.proceed(request)

      uncompress(response)
    } else {
      chain.proceed(chain.request())
    }

  internal fun uncompress(response: Response): Response {
    if (!response.promisesBody()) {
      return response
    }
    val body = response.body ?: return response
    val encoding = response.header("Content-Encoding") ?: return response

    val decompressedSource = when {
      encoding.equals("zstd", ignoreCase = true) ->
        body.source().zstdDecompress().buffer()
      encoding.equals("br", ignoreCase = true) ->
        BrotliInputStream(body.source().inputStream()).source().buffer()
      encoding.equals("gzip", ignoreCase = true) ->
        GzipSource(body.source()).buffer()
      else -> return response
    }

    return response.newBuilder()
      .removeHeader("Content-Encoding")
      .removeHeader("Content-Length")
      .body(decompressedSource.asResponseBody(body.contentType(), -1))
      .build()
  }
}
