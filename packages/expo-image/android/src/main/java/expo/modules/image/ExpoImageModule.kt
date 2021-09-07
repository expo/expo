package expo.modules.image

import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.bumptech.glide.load.model.GlideUrl
import com.bumptech.glide.request.FutureTarget
import com.bumptech.glide.request.RequestOptions
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableNativeMap
import expo.modules.image.enums.ImageCacheType
import kotlinx.coroutines.CoroutineExceptionHandler
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.launch
import kotlinx.coroutines.runInterruptible
import java.lang.Exception
import java.util.concurrent.ExecutionException

/**
 * We need to convert blocking java.util.concurrent.Future result
 * into non-blocking suspend function. We use extension function for that
 */
suspend fun <T> FutureTarget<T>.awaitGet() = runInterruptible(Dispatchers.IO) { get() }

class ExpoImageModule(val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  private val moduleCoroutineScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
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
    moduleCoroutineScope.launch(
        CoroutineExceptionHandler { _, e ->
          promise.reject("ERR_IMAGE_QUERY_CACHE_FAILURE", "Failed to read the cache: ${e.message}", e)
        }
    ) {
      val resultMap = WritableNativeMap()
      urls.toArrayList()
        .filterIsInstance<String>()
        .map { url ->
          async {
            val isInDiskCache = isInCache(url, ImageCacheType.DISK)
            val isInMemoryCache = isInCache(url, ImageCacheType.MEMORY)
            Triple(url, isInDiskCache, isInMemoryCache)
          }
        }
        .awaitAll()
        .filter {
          (_, inDisk, inMemory) -> inDisk || inMemory
        }
        .forEach{ (url, inDisk, inMemory) ->
          resultMap.putString(
            url,
            if (inDisk && inMemory) {
              "disk/memory"
            } else if (inDisk) {
              "disk"
            } else {
              "memory"
            }
          )
        }
      promise.resolve(resultMap)
    }
  }

  private suspend fun isInCache(url: String, cacheOption: ImageCacheType) : Boolean {
    val cacheOptions = RequestOptions()
        .apply {
          when (cacheOption) {
            ImageCacheType.DISK -> skipMemoryCache(true)
            ImageCacheType.MEMORY -> diskCacheStrategy(DiskCacheStrategy.NONE)
          }
        }
    return try {
      val result = Glide.with(context)
          .load(GlideUrl(url))
          .onlyRetrieveFromCache(true)
          .apply(cacheOptions)
          .submit()
          .awaitGet()
      result != null
    } catch (e: ExecutionException) {
      // ExecutionException means that asset was not available in cache. Other exceptions are not caught intentionally
      return false
    }
  }
}
