package expo.modules.image.thumbhash

import android.graphics.Bitmap
import com.bumptech.glide.load.model.ModelLoader
import com.bumptech.glide.load.model.ModelLoaderFactory
import com.bumptech.glide.load.model.MultiModelLoaderFactory
import expo.modules.image.GlideThumbhashModel

class ThumbhashModelLoaderFactory : ModelLoaderFactory<GlideThumbhashModel, Bitmap> {
  override fun build(multiFactory: MultiModelLoaderFactory): ModelLoader<GlideThumbhashModel, Bitmap> =
    ThumbhashModelLoader()

  override fun teardown() = Unit
}
