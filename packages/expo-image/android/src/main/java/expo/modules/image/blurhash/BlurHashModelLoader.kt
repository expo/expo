package expo.modules.image.blurhash

import android.graphics.Bitmap
import android.net.Uri
import com.bumptech.glide.load.Options
import com.bumptech.glide.load.model.ModelLoader
import com.bumptech.glide.signature.ObjectKey

class BlurHashModelLoader : ModelLoader<String, Bitmap> {
  override fun handles(model: String): Boolean = model.startsWith("blurhash:")

  override fun buildLoadData(
    model: String,
    width: Int,
    height: Int,
    options: Options
  ): ModelLoader.LoadData<Bitmap> {
    val uri = Uri.parse(model)

    val blurHash = getPath(uri, 0, null) { it }
    val blurHashWidth = getPath(uri, 1, 16) { it.toInt() }
    val blurHashHeight = getPath(uri, 2, 16) { it.toInt() }
    val blurHashPunch = getPath(uri, 3, 1f) { it.toFloat() }

    return ModelLoader.LoadData(
      ObjectKey(model),
      BlurHashFetcher(blurHash, blurHashWidth, blurHashHeight, blurHashPunch)
    )
  }

  private fun <T> getPath(uri: Uri, index: Int, default: T, converter: (String) -> T): T {
    val value = uri.pathSegments.getOrNull(index) ?: return default
    return converter(value)
  }
}
