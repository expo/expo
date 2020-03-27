package expo.modules.imageloader

import android.content.Context
import android.graphics.Bitmap
import android.graphics.drawable.Drawable
import android.os.AsyncTask
import androidx.annotation.NonNull
import androidx.annotation.Nullable
import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.bumptech.glide.request.target.SimpleTarget
import com.bumptech.glide.request.transition.Transition
import com.facebook.common.references.CloseableReference
import com.facebook.datasource.DataSource
import com.facebook.drawee.backends.pipeline.Fresco
import com.facebook.imagepipeline.datasource.BaseBitmapDataSubscriber
import com.facebook.imagepipeline.image.CloseableImage
import com.facebook.imagepipeline.request.ImageRequest
import org.unimodules.core.interfaces.InternalModule
import org.unimodules.interfaces.imageloader.ImageLoader
import java.util.concurrent.ExecutionException
import java.util.concurrent.Future


class ImageLoaderModule(val context: Context) : InternalModule, ImageLoader {

  override fun getExportedInterfaces(): List<Class<*>>? {
    return listOf(ImageLoader::class.java)
  }

  override fun loadImageForDisplayFromURL(url: String): Future<Bitmap> {
    val future = SimpleSettableFuture<Bitmap>()
    loadImageForDisplayFromURL(url, object : ImageLoader.ResultListener {
      override fun onSuccess(bitmap: Bitmap) = future.set(bitmap)

      override fun onFailure(@Nullable cause: Throwable?) = future.setException(ExecutionException(cause))
    })
    return future
  }

  override fun loadImageForDisplayFromURL(url: String, resultListener: ImageLoader.ResultListener) {
    val imageRequest = ImageRequest.fromUri(url)
    val imagePipeline = Fresco.getImagePipeline()
    val dataSource = imagePipeline.fetchDecodedImage(imageRequest, context)

    dataSource.subscribe(
      object : BaseBitmapDataSubscriber() {
        override fun onNewResultImpl(bitmap: Bitmap?) {
          bitmap?.let {
            resultListener.onSuccess(bitmap)
            return
          }

          resultListener.onFailure(Exception("Loaded bitmap is null"))
        }

        override fun onFailureImpl(@NonNull dataSource: DataSource<CloseableReference<CloseableImage>>) {
          resultListener.onFailure(dataSource.failureCause)
        }
      },
      AsyncTask.THREAD_POOL_EXECUTOR
    )
  }

  override fun loadImageForManipulationFromURL(@NonNull url: String): Future<Bitmap> {
    val future = SimpleSettableFuture<Bitmap>()
    loadImageForManipulationFromURL(url, object : ImageLoader.ResultListener {
      override fun onSuccess(bitmap: Bitmap) = future.set(bitmap)

      override fun onFailure(@NonNull cause: Throwable?) = future.setException(ExecutionException(cause))
    })
    return future
  }

  override fun loadImageForManipulationFromURL(url: String, resultListener: ImageLoader.ResultListener) {
    val normalizedUrl = normalizeAssetsUrl(url)

    Glide.with(context)
      .asBitmap()
      .diskCacheStrategy(DiskCacheStrategy.NONE)
      .skipMemoryCache(true)
      .load(normalizedUrl)
      .into(object : SimpleTarget<Bitmap>() {
        override fun onResourceReady(resource: Bitmap, transition: Transition<in Bitmap>?) {
          resultListener.onSuccess(resource)
        }

        override fun onLoadFailed(errorDrawable: Drawable?) {
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
