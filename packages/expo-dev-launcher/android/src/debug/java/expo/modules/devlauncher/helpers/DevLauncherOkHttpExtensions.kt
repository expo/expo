package expo.modules.devlauncher.helpers

import android.net.Uri
import kotlinx.coroutines.suspendCancellableCoroutine
import okhttp3.Call
import okhttp3.Callback
import okhttp3.Headers
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import okhttp3.Response
import java.io.IOException
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/**
 * An extension which converts the OkHttp requests to coroutines.
 */
suspend inline fun Request.await(okHttpClient: OkHttpClient): Response {
  return suspendCancellableCoroutine { callback ->
    okHttpClient.newCall(this).enqueue(object : Callback {
      override fun onResponse(call: Call, response: Response) {
        callback.resume(response)
      }

      override fun onFailure(call: Call, e: IOException) {
        if (callback.isCancelled) {
          return
        }
        callback.resumeWithException(e)
      }
    })
  }
}

fun fetch(url: Uri, method: String, headers: Headers): Request =
  Request.Builder().method(method, null).url(url.toString()).headers(headers).build()

fun post(url: Uri, requestBody: RequestBody, vararg headers: Pair<String, String>): Request =
  Request
    .Builder()
    .method("POST", requestBody)
    .url(url.toString())
    .apply {
      headers.forEach {
        addHeader(it.first, it.second)
      }
    }
    .build()
