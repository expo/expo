package expo.modules.image.blurhash

import android.graphics.Bitmap
import android.net.Uri
import com.bumptech.glide.load.Options
import com.bumptech.glide.load.model.ModelLoader
import com.bumptech.glide.signature.ObjectKey
import expo.modules.image.BlurhashModelProvider

class BlurhashModelLoader : ModelLoader<BlurhashModelProvider, Bitmap> {
  override fun handles(model: BlurhashModelProvider): Boolean = true

  override fun buildLoadData(
    model: BlurhashModelProvider,
    width: Int,
    height: Int,
    options: Options
  ): ModelLoader.LoadData<Bitmap> {
    val blurhash = getPath(model.uri, 0, null) { it }
    return ModelLoader.LoadData(
      ObjectKey(model),
      BlurHashFetcher(blurhash, model.width, model.height, 1f)
    )
  }

  private fun <T> getPath(uri: Uri, index: Int, default: T, converter: (String) -> T): T {
    val value = uri.pathSegments.getOrNull(index) ?: return default
    return converter(value)
  }
}
