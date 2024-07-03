// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.networkfetch

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.sharedobjects.SharedRef
import expo.modules.kotlin.types.Enumerable
import okhttp3.Call
import okhttp3.CookieJar
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.net.URL

internal class NativeRequest(internal val response: NativeResponse) :
  SharedRef<RequestHolder>(RequestHolder(null)) {
  private var task: Call? = null

  fun start(client: OkHttpClient, url: URL, requestInit: NativeRequestInit, requestBody: ByteArray?) {
    val newClient = if (requestInit.credentials == NativeRequestCredentials.INCLUDE) {
      client
    } else {
      client.newBuilder().cookieJar(CookieJar.NO_COOKIES).build()
    }

    var headers = requestInit.headers.toHeaders()
    val mediaType = headers["Content-Type"]?.toMediaTypeOrNull()
    val shouldGzipRequestBody =
      headers["Content-Encoding"]?.equals("gzip", ignoreCase = true) == true
    val body: ByteArray? = if (shouldGzipRequestBody) {
      requestBody?.toGzipByteArray()
    } else {
      requestBody
    }
    if (shouldGzipRequestBody && body != null) {
      headers = headers.newBuilder()
        .add("Content-Length", body.size.toString())
        .build()
    }
    val request = Request.Builder()
      .headers(headers)
      .method(requestInit.method, body?.toRequestBody(mediaType))
      .url(url)
      .build()
    this.ref.request = request

    this.task = newClient.newCall(request)
    this.task?.enqueue(this.response)
  }

  fun cancel() {
    val task = this.task ?: return
    task.cancel()
    response.emitRequestCancelled()
  }
}

internal data class RequestHolder(var request: Request?)

internal enum class NativeRequestCredentials(val value: String) : Enumerable {
  INCLUDE("include"),
  OMIT("omit")
}

internal data class NativeRequestInit(
  @Field val credentials: NativeRequestCredentials = NativeRequestCredentials.INCLUDE,
  @Field val headers: List<Pair<String, String>> = emptyList(),
  @Field val method: String = "GET"
) : Record
