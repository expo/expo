package expo.modules.image.okhttp

import com.facebook.react.modules.network.ProgressListener
import com.facebook.react.modules.network.ProgressResponseBody
import okhttp3.Interceptor
import okhttp3.Response
import java.io.IOException
import java.lang.ref.WeakReference
import java.util.*

object OkHttpClientProgressInterceptor : Interceptor {
  private val mProgressListeners: MutableMap<String, MutableCollection<WeakReference<ProgressListener>>> = HashMap()

  /**
   * Mostly copied from https://github.com/square/okhttp/blob/97a5e7a9e0cdafd2bb7cbc9a8bb1931082aaa0e4/samples/guide/src/main/java/okhttp3/recipes/Progress.java#L62-L69
   *
   * @return An instance of [OkHttpClient.Builder] configured for notifying
   * [OkHttpClientProgressInterceptor] of new request information.
   */
  @Throws(IOException::class)
  override fun intercept(chain: Interceptor.Chain): Response {
    val weakThis = WeakReference(this)
    val requestUrl = chain.call().request().url.toString()
    val originalResponse = chain.proceed(chain.request())
    return originalResponse.newBuilder()
      .body(
        ProgressResponseBody(originalResponse.body) { bytesWritten, contentLength, done ->
          val strongThis = weakThis.get() ?: return@ProgressResponseBody
          val urlListeners = strongThis.mProgressListeners[requestUrl]
          urlListeners?.forEach { it.get()?.onProgress(bytesWritten, contentLength, done) }
          if (done) {
            strongThis.mProgressListeners.remove(requestUrl)
          }
        }
      )
      .build()
  }

  fun registerProgressListener(requestUrl: String, requestListener: ProgressListener) {
    var requestListeners = mProgressListeners[requestUrl]
    if (requestListeners == null) {
      requestListeners = HashSet()
      mProgressListeners[requestUrl] = requestListeners
    }
    requestListeners.add(WeakReference(requestListener))
  }
}
