package expo.modules.image

import com.bumptech.glide.Glide
import expo.modules.image.records.ImageLoadOptions
import expo.modules.image.records.SourceMap
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

open class ImageLoadTask(
  private val appContext: AppContext,
  private val source: SourceMap,
  private val options: ImageLoadOptions
) {
  suspend fun load(): Image {
    val context =
      this@ImageLoadTask.appContext.reactContext ?: throw Exceptions.ReactContextLost()

    val sourceToLoad = source.createGlideModelProvider(context)
    val model = sourceToLoad?.getGlideModel()

    try {
      val bitmap = withContext(Dispatchers.IO) {
        Glide
          .with(context)
          .asDrawable()
          .load(model)
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
