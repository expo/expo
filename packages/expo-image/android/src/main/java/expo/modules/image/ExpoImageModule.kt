package expo.modules.image

import android.util.Log
import com.bumptech.glide.Glide
import com.bumptech.glide.load.model.GlideUrl
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.runInterruptible
import java.io.File
import java.lang.Exception
import java.lang.IllegalStateException
import java.util.concurrent.CancellationException
import java.util.concurrent.ConcurrentHashMap

class ExpoImageModule(val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "ExpoImageModule"
  private val moduleCoroutineScope = CoroutineScope(Dispatchers.IO)
  private val prefetchRequests = ConcurrentHashMap<Int, FutureTarget<File>>()

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
        val message = if (e is CancellationException) "Prefetching was cancelled" else e.message
        promise.reject("ERR_IMAGE_PREFETCH_FAILURE", "Failed to prefetch the image: $message", e)
      }
    }
  }

  @ReactMethod
  fun abortPrefetch(requestId: Int) {
    val future = prefetchRequests.remove(requestId)
    future?.cancel(true)
  }
  
  override fun onCatalystInstanceDestroy() {
    try {
      // TODO: Use [expo.modules.core.errors.ModuleDestroyedException] when migrated to Expo Module
      moduleCoroutineScope.cancel(CancellationException("ExpoImage module is destroyed. Cancelling all jobs."))
    } catch (e: IllegalStateException) {
      Log.w("ExpoImageModule", "No coroutines to cancel")
    }

    super.onCatalystInstanceDestroy()
  }
}
