package expo.modules.image.events

import android.graphics.drawable.Animatable
import android.graphics.drawable.Drawable
import android.util.Log
import com.bumptech.glide.load.DataSource
import com.bumptech.glide.load.engine.GlideException
import com.bumptech.glide.request.RequestListener
import com.bumptech.glide.request.target.Target
import expo.modules.image.ExpoImageViewWrapper
import expo.modules.image.enums.ImageCacheType
import expo.modules.image.records.ImageErrorEvent
import expo.modules.image.records.ImageLoadEvent
import expo.modules.image.records.ImageSource
import expo.modules.image.svg.SVGPictureDrawable
import kotlinx.coroutines.launch
import java.lang.ref.WeakReference
import java.util.Locale

class GlideRequestListener(
  private val expoImageViewWrapper: WeakReference<ExpoImageViewWrapper>
) : RequestListener<Drawable> {
  override fun onLoadFailed(
    e: GlideException?,
    model: Any?,
    target: Target<Drawable>,
    isFirstResource: Boolean
  ): Boolean {
    val errorMessage = e
      ?.message
      // Glide always append that line to the end of the message.
      // It's not possible to call `logRootCauses` from the JS, so we decided to remove it.
      ?.removeSuffix("\n call GlideException#logRootCauses(String) for more detail")
      ?: "Unknown error"

    expoImageViewWrapper
      .get()
      ?.onError
      ?.invoke(ImageErrorEvent(errorMessage))

    Log.e("ExpoImage", errorMessage)
    e?.logRootCauses("ExpoImage")
    return false
  }

  override fun onResourceReady(
    resource: Drawable,
    model: Any,
    target: Target<Drawable>,
    dataSource: DataSource,
    isFirstResource: Boolean
  ): Boolean {
    val intrinsicWidth = (resource as? SVGPictureDrawable)?.svgIntrinsicWidth
      ?: resource.intrinsicWidth
    val intrinsicHeight = (resource as? SVGPictureDrawable)?.svgIntrinsicHeight
      ?: resource.intrinsicHeight

    val imageWrapper = expoImageViewWrapper.get() ?: return false
    val appContext = imageWrapper.appContext
    appContext.mainQueue.launch {
      imageWrapper.onLoad.invoke(
        ImageLoadEvent(
          cacheType = ImageCacheType.fromNativeValue(dataSource).name.lowercase(Locale.getDefault()),
          source = ImageSource(
            url = model.toString(),
            width = intrinsicWidth,
            height = intrinsicHeight,
            mediaType = null, // TODO(@lukmccall): add mediaType
            isAnimated = resource is Animatable
          )
        )
      )
    }

    return false
  }
}
