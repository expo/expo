package expo.modules.image.events

import android.graphics.BitmapFactory
import android.graphics.drawable.Drawable
import com.bumptech.glide.load.DataSource
import com.bumptech.glide.load.engine.GlideException
import com.bumptech.glide.request.RequestListener
import com.bumptech.glide.request.target.CustomTarget
import com.bumptech.glide.request.target.Target
import com.bumptech.glide.request.transition.Transition
import com.facebook.react.modules.network.ProgressListener
import expo.modules.image.ExpoImageViewWrapper
import expo.modules.image.enums.ImageCacheType
import expo.modules.image.records.ImageErrorEvent
import expo.modules.image.records.ImageLoadEvent
import expo.modules.image.records.ImageProgressEvent
import expo.modules.image.records.ImageSource
import java.lang.ref.WeakReference

class ImageLoadEventsManager(
  private val expoImageViewWrapper: WeakReference<ExpoImageViewWrapper>,
) : CustomTarget<BitmapFactory.Options?>(), RequestListener<Drawable?>, ProgressListener {
  private var mBitmapFactoryOptions: BitmapFactory.Options? = null
  private var mDataSource: DataSource? = null
  private var mModel: Any? = null

  fun onLoadStarted() {
    expoImageViewWrapper.get()?.onLoadStart?.invoke(Unit)
  }

  override fun onProgress(bytesWritten: Long, contentLength: Long, done: Boolean) {
    expoImageViewWrapper.get()?.onProgress?.invoke(
      ImageProgressEvent(
        loaded = bytesWritten.toInt(),
        total = contentLength.toInt()
      )
    )
  }

  override fun onLoadFailed(e: GlideException?, model: Any, target: Target<Drawable?>, isFirstResource: Boolean): Boolean {
    expoImageViewWrapper.get()?.onError?.invoke(ImageErrorEvent(e.toString()))
    return false
  }

  override fun onResourceReady(resource: BitmapFactory.Options, transition: Transition<in BitmapFactory.Options?>?) {
    mBitmapFactoryOptions = resource
    onResourceReady()
  }

  override fun onResourceReady(resource: Drawable?, model: Any, target: Target<Drawable?>, dataSource: DataSource, isFirstResource: Boolean): Boolean {
    mModel = model
    mDataSource = dataSource
    onResourceReady()
    return false
  }

  private fun onResourceReady() {
    val model = mModel ?: return
    val dataSource = mDataSource ?: return
    val bitmapFactoryOptions = mBitmapFactoryOptions ?: return
    val expoImageViewWrapper = expoImageViewWrapper.get() ?: return

    expoImageViewWrapper.onLoad(
      ImageLoadEvent(
        cacheType = ImageCacheType.fromNativeValue(dataSource).enumValue,
        source = ImageSource(
          url = model.toString(),
          width = bitmapFactoryOptions.outWidth,
          height = bitmapFactoryOptions.outHeight,
          mediaType = bitmapFactoryOptions.outMimeType
        )
      )
    )
  }

  override fun onLoadCleared(placeholder: Drawable?) = Unit // do nothing
}
