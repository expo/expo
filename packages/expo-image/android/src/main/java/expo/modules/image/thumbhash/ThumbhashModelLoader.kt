package expo.modules.image.thumbhash

import android.graphics.Bitmap

import com.bumptech.glide.load.Options
import com.bumptech.glide.load.model.ModelLoader
import com.bumptech.glide.signature.ObjectKey

import expo.modules.image.GlideThumbhashModel

class ThumbhashModelLoader : ModelLoader<GlideThumbhashModel, Bitmap> {

  override fun handles(model: GlideThumbhashModel): Boolean = true

  override fun buildLoadData(model: GlideThumbhashModel, width: Int, height: Int, options: Options): ModelLoader.LoadData<Bitmap> {
    // Thumbhash might contain '/' characters
    val thumbhash = model.uri.pathSegments.joinToString(separator = "/")
    return ModelLoader.LoadData(
      ObjectKey(model),
      ThumbhashFetcher(thumbhash)
    )
  }
}
