package expo.modules.image

import com.bumptech.glide.Glide
import com.bumptech.glide.load.model.GlideUrl
import com.bumptech.glide.load.model.Headers
import com.bumptech.glide.load.model.LazyHeaders
import expo.modules.image.records.ImageLoadOptions
import expo.modules.image.records.SourceMap
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlin.apply
import kotlin.collections.component1
import kotlin.collections.component2

open class ImageLoadTask(
  private val appContext: AppContext,
  private val source: SourceMap,
  private val options: ImageLoadOptions
) {
  suspend fun load(): Image {
    val context =
      this@ImageLoadTask.appContext.reactContext ?: throw Exceptions.ReactContextLost()

    val headers = source.headers?.let {
      LazyHeaders.Builder().apply {
        it.forEach { (key, value) ->
          addHeader(key, value)
        }
      }.build()
    } ?: Headers.DEFAULT

    try {
      val bitmap = withContext(Dispatchers.IO) {
        Glide
          .with(context)
          .asDrawable()
          .load(GlideUrl(source.uri, headers))
          .centerInside()
          .submit(options.maxWidth, options.maxHeight)
          .get()
      }

      return Image(bitmap)
    } catch (e: Exception) {
      throw ImageLoadFailed(e)
    }
  }
}
