package expo.modules.devmenu.helpers

import android.net.Uri

import kotlinx.coroutines.suspendCancellableCoroutine
import okhttp3.Call
import okhttp3.Callback
import okhttp3.MediaType
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

fun fetch(url: Uri, authHeader: Pair<String, String>? = null): Request =
  Request
    .Builder()
    .method("GET", null)
    .url(url.toString())
    .apply {
      if (authHeader != null) {
        addHeader(authHeader.first, authHeader.second)
      }
    }
    .build()

fun fetchGraphQL(url: Uri, query: String, authHeader: Pair<String, String>? = null): Request =
  Request
    .Builder()
    .url(url.toString())
    .method(
      "POST",
      @Suppress("DEPRECATION_ERROR")
      RequestBody.create(
        MediaType.parse("application/json"),
        "{\"query\": \"${
          query
            .trimIndent()
            .replace("\n", "\\n")
            .replace("\"", "\\\"")
        }\"}"
      )
    )
    .addHeader("Content-Type", "application/json")
    .apply {
      if (authHeader != null) {
        addHeader(authHeader.first, authHeader.second)
      }
    }
    .build()
