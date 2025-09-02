// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.fetch

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.sharedobjects.SharedObject
import okhttp3.Call
import okhttp3.CookieJar
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.net.URL

private data class RequestHolder(var request: Request?)

internal class NativeRequest(appContext: AppContext, internal val response: NativeResponse) :
  SharedObject(appContext) {
  private val requestHolder = RequestHolder(null)
  private var task: Call? = null

  fun start(client: OkHttpClient, url: URL, requestInit: NativeRequestInit, requestBody: ByteArray?) {
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
    val mediaType = headers["Content-Type"]?.toMediaTypeOrNull()
    val request = Request.Builder()
      .headers(headers)
      .method(requestInit.method, requestBody?.toRequestBody(mediaType))
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
