package expo.modules.asset

import kotlinx.coroutines.suspendCancellableCoroutine
import okhttp3.Call
import okhttp3.Callback
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import java.io.IOException
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

suspend inline fun Request.await(okHttpClient: OkHttpClient): Response {
  return suspendCancellableCoroutine { callback ->
    val responseCallback = object : Callback {
      override fun onResponse(call: Call, response: Response) {
        callback.resume(response)
      }

      override fun onFailure(call: Call, e: IOException) {
        if (callback.isCancelled) {
          return
        }
        callback.resumeWithException(e)
      }
    }

    okHttpClient
      .newCall(this)
      .enqueue(responseCallback)
  }
}
