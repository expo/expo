package expo.modules.image

import android.graphics.drawable.Drawable
import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.bumptech.glide.load.model.GlideUrl
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.lang.Exception

class ExpoImageModule(val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "ExpoImageModule"

  @ReactMethod
  fun prefetch(url: String, promise: Promise) {
    val glideUrl = GlideUrl(url)
    var result : Drawable? = null
    try {
      result = Glide.with(context)
        .load(glideUrl)
        .diskCacheStrategy(DiskCacheStrategy.DATA)
        .submit()
        .get()
    } catch (e: Exception) {
      promise.reject("ERR_IMAGE_PREFETCH_FAILURE", "Failed to prefetch the image: ${e.message}", e)
    }
    if (result == null) {
      promise.reject("ERR_IMAGE_PREFETCH_FAILURE", "Failed to prefetch the image: ${url}.")
    }
    promise.resolve(null)
  }
}
