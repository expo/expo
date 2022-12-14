package expo.modules.image.blurhash

import android.graphics.Bitmap
import android.net.Uri
import com.bumptech.glide.load.Options
import com.bumptech.glide.load.model.ModelLoader
import com.bumptech.glide.signature.ObjectKey

class BlurhashModelLoader : ModelLoader<String, Bitmap> {
  override fun handles(model: String): Boolean = model.startsWith("blurhash:")

  override fun buildLoadData(
    model: String,
    width: Int,
    height: Int,
    options: Options
  ): ModelLoader.LoadData<Bitmap> {
    val uri = Uri.parse(model)

    val blurhash = getPath(uri, 0, null) { it }
    val blurhashWidth = getPath(uri, 1, 16) { it.toInt() }
    val blurhashHeight = getPath(uri, 2, 16) { it.toInt() }
    val blurhashPunch = getPath(uri, 3, 1f) { it.toFloat() }

    return ModelLoader.LoadData(
      ObjectKey(model),
      BlurHashFetcher(blurhash, blurhashWidth, blurhashHeight, blurhashPunch)
    )
  }

  private fun <T> getPath(uri: Uri, index: Int, default: T, converter: (String) -> T): T {
    val value = uri.pathSegments.getOrNull(index) ?: return default
    return converter(value)
  }
}
