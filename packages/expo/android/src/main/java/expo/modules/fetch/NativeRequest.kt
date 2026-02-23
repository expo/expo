// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.fetch

import expo.modules.filesystem.FileSystemFile
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.sharedobjects.SharedObject
import okhttp3.Call
import okhttp3.CookieJar
import okhttp3.MediaType
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import okio.BufferedSink
import okio.source
import java.net.URL

private data class RequestHolder(var request: Request?)

internal val METHODS_REQUIRING_BODY = arrayOf("POST", "PUT", "PATCH")

internal class NativeRequest(appContext: AppContext, internal val response: NativeResponse) :
  SharedObject(appContext) {
  private val requestHolder = RequestHolder(null)
  private var task: Call? = null

  fun start(client: OkHttpClient, url: URL, requestInit: NativeRequestInit, requestBody: ByteArray?) {
    val headers = requestInit.headers.toHeaders()
    val mediaType = headers["Content-Type"]?.toMediaTypeOrNull()
    val reqBody = requestBody?.toRequestBody(mediaType) ?: run {
      // OkHttp requires a non-null body for POST, PATCH, and PUT requests.
      // WinterTC fetch, however, does not have this limitation.
      // Provide an empty body to make OkHttp behave like WinterTC fetch.
      // Ref: https://github.com/expo/expo/issues/35950#issuecomment-3245173248
      if (requestInit.method in METHODS_REQUIRING_BODY) {
        byteArrayOf(0).toRequestBody(mediaType)
      } else {
        null
      }
    }
    enqueueRequest(client, url, requestInit, reqBody)
  }

  fun startWithFile(client: OkHttpClient, url: URL, requestInit: NativeRequestInit, file: FileSystemFile) {
    val headers = requestInit.headers.toHeaders()
    val mediaType = headers["Content-Type"]?.toMediaTypeOrNull()
    val unifiedFile = file.file
    val reqBody = object : RequestBody() {
      override fun contentType(): MediaType? = mediaType
      override fun contentLength(): Long = unifiedFile.length().let { if (it > 0) it else -1L }
      override fun writeTo(sink: BufferedSink) {
        unifiedFile.inputStream().use { sink.writeAll(it.source()) }
      }
    }
    enqueueRequest(client, url, requestInit, reqBody)
  }

  private fun enqueueRequest(client: OkHttpClient, url: URL, requestInit: NativeRequestInit, reqBody: RequestBody?) {
    val clientBuilder = client.newBuilder()
    if (requestInit.credentials != NativeRequestCredentials.INCLUDE) {
      clientBuilder.cookieJar(CookieJar.NO_COOKIES)
    }
    if (requestInit.redirect != NativeRequestRedirect.FOLLOW) {
      clientBuilder.followRedirects(false)
      clientBuilder.followSslRedirects(false)
    }

    val newClient = clientBuilder.build()
    response.redirectMode = requestInit.redirect

    val headers = requestInit.headers.toHeaders()
    val request = Request.Builder()
      .headers(headers)
      .method(requestInit.method, reqBody)
      .url(OkHttpFileUrlInterceptor.handleFileUrl(url))
      .build()
    this.requestHolder.request = request

    this.task = newClient.newCall(request)
    this.task?.enqueue(this.response)
    response.onStarted()
  }

  fun cancel() {
    val task = this.task ?: return
    task.cancel()
    response.emitRequestCanceled()
  }
}
