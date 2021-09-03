package expo.modules.image

import com.bumptech.glide.Glide
import com.bumptech.glide.load.model.GlideUrl
import com.bumptech.glide.request.FutureTarget
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableNativeArray
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.runInterruptible
import java.lang.Exception

/**
 * We need to convert blocking java.util.concurrent.Future result
 * into non-blocking suspend function. We use extension function for that
 */
suspend fun <T> FutureTarget<T>.awaitGet() = runInterruptible(Dispatchers.IO) { get() }

class ExpoImageModule(val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  private val moduleCoroutineScope = CoroutineScope(Dispatchers.IO)
  override fun getName() = "ExpoImageModule"

  @ReactMethod
  fun prefetch(url: String, promise: Promise) {
    moduleCoroutineScope.launch {
      try {
        val glideUrl = GlideUrl(url)
        val result = Glide.with(context)
            .download(glideUrl)
            .submit()
            .awaitGet()
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
  fun queryCache(urls: ReadableArray, promise: Promise) {
    val result = WritableNativeArray()
    urls.toArrayList().forEach {
      val url = it as String
      if (isInCache(url)) {
        result.pushString(url)
      }
    }
    promise.resolve(result)
  }

  private fun isInCache(url: String) : Boolean {
    try {
      Glide.with(context)
        .load(GlideUrl(url))
        .onlyRetrieveFromCache(true)
        .submit()
        .get()
    } catch (e: Exception) {
      return false
    }
    return true
  }
}
