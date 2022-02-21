package expo.modules.image

import com.bumptech.glide.load.DataSource
import com.bumptech.glide.load.engine.GlideException
import com.bumptech.glide.request.RequestListener
import com.bumptech.glide.request.target.Target
import com.facebook.react.bridge.Promise

class ExpoImageSizeRequestListener(private val promise: Promise, private val url: String) : RequestListener<ExpoImageSize> {
  override fun onLoadFailed(e: GlideException?, model: Any?, target: Target<ExpoImageSize>?, isFirstResource: Boolean): Boolean {
    promise.reject("ERR_IMAGE_GETSIZE_FAILURE", "Failed to get size of the image: $url. Error message: ${e?.message}", e)
    return true // prevent onLoadFailed from being called on the target
  }

  override fun onResourceReady(resource: ExpoImageSize, model: Any?, target: Target<ExpoImageSize>?, dataSource: DataSource?, isFirstResource: Boolean): Boolean {
    promise.resolve(resource.asWritableNativeMap())
    return true // prevent onResourceReady from being called on the target
  }
}
