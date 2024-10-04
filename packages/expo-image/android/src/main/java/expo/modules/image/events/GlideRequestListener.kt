package expo.modules.image.events

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
import java.lang.ref.WeakReference
import java.util.*

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
    expoImageViewWrapper.get()?.onLoad?.invoke(
      ImageLoadEvent(
        cacheType = ImageCacheType.fromNativeValue(dataSource).name.lowercase(Locale.getDefault()),
        source = ImageSource(
          url = model.toString(),
          width = resource.intrinsicWidth,
          height = resource.intrinsicHeight,
          mediaType = null // TODO(@lukmccall): add mediaType
        )
      )
    )

    return false
  }
}
