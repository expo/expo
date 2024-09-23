package expo.modules.image.thumbhash

import android.graphics.Bitmap

import com.bumptech.glide.load.Options
import com.bumptech.glide.load.model.ModelLoader
import com.bumptech.glide.signature.ObjectKey

class ThumbhashModelLoader : ModelLoader<ThumbhashModel, Bitmap> {

  override fun handles(model: ThumbhashModel): Boolean = true

  override fun buildLoadData(model: ThumbhashModel, width: Int, height: Int, options: Options): ModelLoader.LoadData<Bitmap> {
    // The URI looks like this: thumbhash:/3OcRJYB4d3h\iIeHeEh3eIhw+j2w
    // ThumbHash may include slashes which could break the structure of the URL, so we replace them
    // with backslashes on the JS side and revert them back to slashes here, before generating the image.
    val thumbhash = model.uri.pathSegments.joinToString(separator = "/").replace("\\", "/")

    return ModelLoader.LoadData(
      ObjectKey(model),
      ThumbhashFetcher(thumbhash)
    )
  }
}
