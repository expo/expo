package expo.modules.imageloader

import android.content.Context
import android.graphics.Bitmap
import android.graphics.drawable.Drawable
import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.bumptech.glide.request.target.CustomTarget
import com.bumptech.glide.request.transition.Transition
import expo.modules.core.interfaces.InternalModule
import expo.modules.interfaces.imageloader.ImageLoaderInterface
import java.util.concurrent.ExecutionException
import java.util.concurrent.Future

class ImageLoaderModule(val context: Context) : InternalModule, ImageLoaderInterface {

  override fun getExportedInterfaces(): List<Class<*>> {
    return listOf(ImageLoaderInterface::class.java)
  }

  override fun loadImageForDisplayFromURL(url: String): Future<Bitmap> {
    val future = SimpleSettableFuture<Bitmap>()
    loadImageForDisplayFromURL(
      url,
      object : ImageLoaderInterface.ResultListener {
        override fun onSuccess(bitmap: Bitmap) = future.set(bitmap)

        override fun onFailure(cause: Throwable?) =
          future.setException(ExecutionException(cause))
      }
    )
    return future
  }

  override fun loadImageForDisplayFromURL(
    url: String,
    resultListener: ImageLoaderInterface.ResultListener
  ) {
    Glide.with(context)
      .asBitmap()
      .load(url)
      .into(object : CustomTarget<Bitmap>() {
        override fun onResourceReady(resource: Bitmap, transition: Transition<in Bitmap>?) {
          resultListener.onSuccess(resource)
        }

        override fun onLoadCleared(placeholder: Drawable?) {
          // no op
        }

        override fun onLoadFailed(errorDrawable: Drawable?) {
          super.onLoadFailed(errorDrawable)
          resultListener.onFailure(Exception("Loading bitmap failed"))
        }
      })
  }

  override fun loadImageForManipulationFromURL(url: String): Future<Bitmap> {
    val future = SimpleSettableFuture<Bitmap>()
    loadImageForManipulationFromURL(
      url,
      object : ImageLoaderInterface.ResultListener {
        override fun onSuccess(bitmap: Bitmap) = future.set(bitmap)

        override fun onFailure(cause: Throwable?) = future.setException(ExecutionException(cause))
      }
    )
    return future
  }

  override fun loadImageForManipulationFromURL(
    url: String,
    resultListener: ImageLoaderInterface.ResultListener
  ) {
    val normalizedUrl = normalizeAssetsUrl(url)

    Glide.with(context)
      .asBitmap()
      .diskCacheStrategy(DiskCacheStrategy.NONE)
      .skipMemoryCache(true)
      .load(normalizedUrl)
      .into(object : CustomTarget<Bitmap>() {
        override fun onResourceReady(resource: Bitmap, transition: Transition<in Bitmap>?) {
          resultListener.onSuccess(resource)
        }

        override fun onLoadCleared(placeholder: Drawable?) {
          // no op
        }

        override fun onLoadFailed(errorDrawable: Drawable?) {
          super.onLoadFailed(errorDrawable)
          resultListener.onFailure(Exception("Loading bitmap failed"))
        }
      })
  }

  private fun normalizeAssetsUrl(url: String): String {
    var actualUrl = url
    if (url.startsWith("asset:///")) {
      actualUrl = "file:///android_asset/" + url.split("/").last()
    }
    return actualUrl
  }
}
