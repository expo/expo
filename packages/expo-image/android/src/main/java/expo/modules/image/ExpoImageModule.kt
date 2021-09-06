package expo.modules.image

import android.graphics.drawable.Drawable
import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.bumptech.glide.load.model.GlideUrl
import com.bumptech.glide.request.FutureTarget
import com.bumptech.glide.request.RequestOptions
import com.bumptech.glide.request.target.SimpleTarget
import com.bumptech.glide.request.transition.Transition

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.runInterruptible
import kotlin.Exception

/**
 * We need to convert blocking java.util.concurrent.Future result
 * into non-blocking suspend function. We use extension function for that
 */
suspend fun <T> FutureTarget<T>.awaitGet() = runInterruptible(Dispatchers.IO) { get() }

class ExpoImageModule(val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  private val moduleCoroutineScope = CoroutineScope(Dispatchers.IO)

  private val sizeOptions by lazy {
    RequestOptions()
        .skipMemoryCache(true)
        .diskCacheStrategy(DiskCacheStrategy.DATA)
  }

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
  fun getSize(url: String, promise: Promise) {
    try {
      Glide
          .with(context)
          .`as`(ExpoImageSize::class.java)
          .apply(sizeOptions)
          .load(url)
          .into(object : SimpleTarget<ExpoImageSize>() {
            private val promiseRef = promise

            override fun onResourceReady(resource: ExpoImageSize, transition: Transition<in ExpoImageSize>?) {
              promiseRef.resolve(resource.asWritableNativeMap())
            }

            override fun onLoadFailed(errorDrawable: Drawable?) {
              promiseRef.reject("ERR_IMAGE_GETSIZE_FAILURE", "Failed to get size of the image: $url")
            }
          })
    } catch (e: Exception) {
      promise.reject("ERR_IMAGE_GETSIZE_FAILURE", "Failed to get size of the image: $url", e)
    }
  }
}
