package expo.modules.image.thumbhash

import android.graphics.Bitmap
import com.bumptech.glide.load.model.ModelLoader
import com.bumptech.glide.load.model.ModelLoaderFactory
import com.bumptech.glide.load.model.MultiModelLoaderFactory

class ThumbhashModelLoaderFactory : ModelLoaderFactory<ThumbhashModel, Bitmap> {
  override fun build(multiFactory: MultiModelLoaderFactory): ModelLoader<ThumbhashModel, Bitmap> =
    ThumbhashModelLoader()

  override fun teardown() = Unit
}
