// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.kotlin.devtools

import androidx.collection.ArrayMap
import kotlinx.coroutines.suspendCancellableCoroutine
import okhttp3.Call
import okhttp3.Callback
import okhttp3.Headers
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import java.io.IOException
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/**
 * OkHttp `Headers` extension method to generate a simple key-value map
 * which only exposing single value for a key.
 */
fun Headers.toSingleMap(): Map<String, String> {
  val result = ArrayMap<String, String>()
  for (key in names()) {
    result[key] = get(key)
  }
  return result
}

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
