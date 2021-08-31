package expo.modules.image

import com.bumptech.glide.Glide
import com.bumptech.glide.load.model.GlideUrl
import com.bumptech.glide.request.FutureTarget
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.runInterruptible
import java.io.File
import java.lang.Exception
import java.util.concurrent.ConcurrentHashMap

/**
 * We need to convert blocking java.util.concurrent.Future result
 * into non-blocking suspend function. We use extension function for that
 */
suspend fun <T> FutureTarget<T>.awaitGet() = runInterruptible(Dispatchers.IO) { get() }

class ExpoImageModule(val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  private val moduleCoroutineScope = CoroutineScope(Dispatchers.IO)
  override fun getName() = "ExpoImageModule"
  var prefetchRequests = ConcurrentHashMap<Int, FutureTarget<File>>()

  @ReactMethod
  fun prefetch(url: String, requestId: Int, promise: Promise) {
    moduleCoroutineScope.launch {
      try {
        val glideUrl = GlideUrl(url)
        val future = Glide.with(context)
            .download(glideUrl)
            .submit()
        prefetchRequests[requestId] = future
        val result = future.awaitGet()
        prefetchRequests.remove(requestId)
        if (result != null) {
          promise.resolve(null)
        } else {
          promise.reject("ERR_IMAGE_PREFETCH_FAILURE", "Failed to prefetch the image: ${url}.")
        }
      } catch (e: Exception) {
        promise.reject("ERR_IMAGE_PREFETCH_FAILURE", "Failed to prefetch the image: ${e.message}", e)
      }
    }
  }

  @ReactMethod
  fun abortPrefetch(requestId: Int) {
    val future = prefetchRequests.remove(requestId)
    future?.cancel(true)
  }
}
