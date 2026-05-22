// Copyright 2015-present 650 Industries. All rights reserved.
/*
 * Copyright (C) 2025 Square, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package expo.modules.fetch

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

    val decompressedSource = when (encoding.lowercase()) {
      "zstd" -> body.source().zstdDecompress().buffer()
      "br" -> BrotliInputStream(body.source().inputStream()).source().buffer()
      "gzip" -> GzipSource(body.source()).buffer()
      else -> response
    }

    return response.newBuilder()
      .removeHeader("Content-Encoding")
      .removeHeader("Content-Length")
      .body(decompressedSource.asResponseBody(body.contentType(), -1))
      .build()
  }
}
