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
 * If the caller didn't set `Accept-Encoding`, we add `zstd, br, gzip`. Responses with a recognized
 * `Content-Encoding` are always decoded (and the `Content-Encoding`/`Content-Length` headers
 * stripped), matching browser fetch and iOS `URLSession` behavior.
 */
object CompressionInterceptor : Interceptor {
  override fun intercept(chain: Interceptor.Chain): Response {
    val request = chain.request()

    return uncompress(
      chain.proceed(
        when (request.header("Accept-Encoding")) {
          null -> request.newBuilder().header("Accept-Encoding", "zstd, br, gzip").build()
          else -> request
        }
      )
    )
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
      else -> return response
    }

    return response.newBuilder()
      .removeHeader("Content-Encoding")
      .removeHeader("Content-Length")
      .body(decompressedSource.asResponseBody(body.contentType(), -1))
      .build()
  }
}
