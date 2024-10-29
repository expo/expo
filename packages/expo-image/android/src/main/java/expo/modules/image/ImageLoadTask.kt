package expo.modules.image

import android.graphics.drawable.Drawable
import com.bumptech.glide.Glide
import expo.modules.image.records.ImageLoadOptions
import expo.modules.image.records.SourceMap
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.withContext

open class ImageLoadTask(private val appContext: AppContext, private val source: SourceMap, private val options: ImageLoadOptions) {
  private var task: Job? = null

  suspend fun load(promise: Promise) {
    return coroutineScope {
      val deferred = async {
        val context = this@ImageLoadTask.appContext.reactContext ?: throw Exceptions.ReactContextLost()
        withContext(Dispatchers.IO) {
          Glide
            .with(context)
            .asDrawable()
            .load(source.uri)
            .centerInside()
            .submit(options.maxWidth, options.maxHeight)
            .get()
        }
      }
      task = deferred
      try {
        val bitmap: Drawable = deferred.await()
        promise.resolve(Image(bitmap))
      } catch (e: Exception) {
        promise.reject(ImageLoadFailed(e))
      }
    }
  }
}
