package expo.modules.image

import android.graphics.drawable.Drawable
import com.bumptech.glide.Glide
import expo.modules.kotlin.Promise
import expo.modules.image.records.SourceMap
import expo.modules.kotlin.AppContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.withContext

open class ImageLoadTask(private val appContext: AppContext, private val source: SourceMap) {
  private var task: Job? = null

  suspend fun load(promise: Promise?): Drawable? {
    return coroutineScope {
      val deferred = async {
        val context = this@ImageLoadTask.appContext.reactContext ?: return@async null
        try {
          withContext(Dispatchers.IO) {
            Glide.with(context).asDrawable().load(source.uri).submit().get()
          }
        } catch (e: Exception) {
          promise?.reject(ImageLoadFailed(e))
          return@async null
        }
      }
      task = deferred
      val bitmap: Drawable? = deferred.await()
      promise?.resolve(Image(bitmap))
      return@coroutineScope bitmap
    }
  }
}
