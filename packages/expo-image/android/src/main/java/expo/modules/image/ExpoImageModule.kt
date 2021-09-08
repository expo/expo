package expo.modules.image

import android.graphics.drawable.Drawable
import android.util.Log

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
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.runInterruptible
import kotlin.Exception

import java.lang.IllegalStateException
import java.util.concurrent.CancellationException

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
            override fun onResourceReady(resource: ExpoImageSize, transition: Transition<in ExpoImageSize>?) {
              promise.resolve(resource.asWritableNativeMap())
            }

            override fun onLoadFailed(errorDrawable: Drawable?) {
              promise.reject("ERR_IMAGE_GETSIZE_FAILURE", "Failed to get size of the image: $url")
            }
          })
    } catch (e: Exception) {
      promise.reject("ERR_IMAGE_GETSIZE_FAILURE", "Failed to get size of the image: $url: ${e.message}", e)
    }
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
