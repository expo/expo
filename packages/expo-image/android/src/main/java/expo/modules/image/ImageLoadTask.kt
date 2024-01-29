package expo.modules.image

import android.graphics.Bitmap
import com.bumptech.glide.Glide
import expo.modules.kotlin.Promise
import expo.modules.image.records.SourceMap
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.kotlin.sharedobjects.SharedRef
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.withContext
import expo.modules.image.ImageLoadAborted

open class ImageLoadTask(val appContext:AppContext, private val source: SourceMap) : SharedObject() {
  private var task: Job? = null
  private var promise: Promise? = null

  suspend fun load(_promise: Promise?): Bitmap? {
    promise = _promise
    return coroutineScope {
      val deferred = async {
        val context = this@ImageLoadTask.appContext.reactContext ?: return@async null;
        withContext(Dispatchers.IO) {
          Glide.with(context).asBitmap().load(source.uri).submit().get()
        }
      }
      task = deferred
      val bitmap: Bitmap? = deferred.await()
      _promise?.resolve(Image(bitmap))
      return@coroutineScope bitmap
    }
  }

  fun abort() {
    promise?.reject(ImageLoadAborted())
    task?.cancel()
  }
}