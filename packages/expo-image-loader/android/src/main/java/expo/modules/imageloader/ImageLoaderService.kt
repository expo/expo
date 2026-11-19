package expo.modules.imageloader

import android.content.Context
import android.graphics.Bitmap
import android.graphics.drawable.Drawable
import android.os.Handler
import android.os.Looper
import com.bumptech.glide.Glide
import com.bumptech.glide.RequestManager
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.bumptech.glide.request.target.CustomTarget
import com.bumptech.glide.request.target.Target
import com.bumptech.glide.request.transition.Transition
import expo.modules.interfaces.imageloader.ImageLoaderInterface
import expo.modules.kotlin.services.ServiceInterface
import java.util.concurrent.ExecutionException
import java.util.concurrent.Future

@ServiceInterface(ImageLoaderInterface::class)
class ImageLoaderService(val context: Context) : ImageLoaderInterface {
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
    val requestManager = Glide.with(context)
    requestManager
      .asBitmap()
      .load(url)
      .into(resultListenerTarget(requestManager, resultListener))
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
    val requestManager = Glide.with(context)

    requestManager
      .asBitmap()
      .diskCacheStrategy(DiskCacheStrategy.NONE)
      .skipMemoryCache(true)
      .load(normalizedUrl)
      .into(resultListenerTarget(requestManager, resultListener))
  }

  override fun loadImageForManipulationFromURL(
    url: String,
    maxWidth: Int?,
    maxHeight: Int?,
    resultListener: ImageLoaderInterface.ResultListener
  ) {
    val normalizedUrl = normalizeAssetsUrl(url)
    val requestManager = Glide.with(context)

    requestManager
      .asBitmap()
      .diskCacheStrategy(DiskCacheStrategy.NONE)
      .skipMemoryCache(true)
      // Downsample during decoding so that large images don't need to be fully decoded into memory.
      .centerInside()
      .load(normalizedUrl)
      .into(resultListenerTarget(requestManager, resultListener, maxWidth ?: Target.SIZE_ORIGINAL, maxHeight ?: Target.SIZE_ORIGINAL))
  }

  private fun resultListenerTarget(
    requestManager: RequestManager,
    resultListener: ImageLoaderInterface.ResultListener,
    maxWidth: Int = Target.SIZE_ORIGINAL,
    maxHeight: Int = Target.SIZE_ORIGINAL
  ): CustomTarget<Bitmap> {
    return object : CustomTarget<Bitmap>(maxWidth, maxHeight) {
      private var hasResult = false

      override fun onResourceReady(resource: Bitmap, transition: Transition<in Bitmap>?) {
        if (hasResult) {
          return
        }
        hasResult = true
        resultListener.onSuccess(resource)
      }

      override fun onLoadCleared(placeholder: Drawable?) {
        // no op
      }

      override fun onLoadFailed(errorDrawable: Drawable?) {
        super.onLoadFailed(errorDrawable)
        if (hasResult) {
          return
        }
        hasResult = true
        resultListener.onFailure(Exception("Loading bitmap failed"))
        // Glide restarts failed requests when connectivity returns, which would report a second result.
        // Clearing from inside a target callback is not allowed, so post it to the main thread.
        Handler(Looper.getMainLooper()).post { requestManager.clear(this) }
      }
    }
  }

  private fun normalizeAssetsUrl(url: String): String {
    var actualUrl = url
    if (url.startsWith("asset:///")) {
      actualUrl = "file:///android_asset/" + url.split("/").last()
    }
    return actualUrl
  }
}
