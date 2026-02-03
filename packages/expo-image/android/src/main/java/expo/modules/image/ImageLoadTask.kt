package expo.modules.image

import android.graphics.drawable.BitmapDrawable
import com.bumptech.glide.request.RequestOptions
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
      val drawable = withContext(Dispatchers.IO) {
        Glide
          .with(context)
          .asDrawable()
          .load(model)
          .centerInside()
          .customize(options.tintColor){
            apply(RequestOptions().set(CustomOptions.tintColor, it))
          }
          .submit(options.maxWidth, options.maxHeight)
          .get()
      }

      if (drawable is BitmapDrawable && options.tintColor != null) {
        drawable.setTint(options.tintColor)
      }

      return Image(drawable)
    } catch (e: Exception) {
      throw ImageLoadFailed(e)
    }
  }
}
